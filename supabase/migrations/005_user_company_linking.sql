-- User Company Linking Migration
-- Adds company_id to user_profiles and creates email domain matching function
-- Run this in your Supabase SQL Editor

-- Step 1: Add company_id column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Step 2: Create index for company_id lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- Step 3: Create function to extract domain from email
CREATE OR REPLACE FUNCTION extract_email_domain(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Create function to find company by email domain
-- Matches email domain against company website (strips www. and protocol)
CREATE OR REPLACE FUNCTION find_company_by_email_domain(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  email_domain TEXT;
  company_id UUID;
BEGIN
  -- Extract domain from email
  email_domain := extract_email_domain(user_email);

  -- Skip common email providers (these users need manual company assignment)
  IF email_domain IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                      'icloud.com', 'aol.com', 'mail.com', 'protonmail.com') THEN
    RETURN NULL;
  END IF;

  -- Find company where website domain matches email domain
  -- Handle various website formats: https://www.example.com, www.example.com, example.com
  SELECT c.id INTO company_id
  FROM companies c
  WHERE
    -- Direct domain match
    LOWER(REPLACE(REPLACE(REPLACE(c.website, 'https://', ''), 'http://', ''), 'www.', '')) = email_domain
    OR
    -- Match with trailing slash removed
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(c.website, 'https://', ''), 'http://', ''), 'www.', ''), '/', '')) = email_domain
    OR
    -- Match domain contained in website
    LOWER(c.website) LIKE '%' || email_domain || '%'
  LIMIT 1;

  RETURN company_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 5: Create function to auto-link user to company on profile creation/update
CREATE OR REPLACE FUNCTION auto_link_user_to_company()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  matched_company_id UUID;
BEGIN
  -- Only run if company_id is not already set
  IF NEW.company_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  IF user_email IS NOT NULL THEN
    -- Try to find matching company
    matched_company_id := find_company_by_email_domain(user_email);

    IF matched_company_id IS NOT NULL THEN
      NEW.company_id := matched_company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to auto-link users to companies
DROP TRIGGER IF EXISTS auto_link_user_company ON user_profiles;
CREATE TRIGGER auto_link_user_company
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_user_to_company();

-- Step 7: Also sync company_id to the profiles table when user_profiles is updated
CREATE OR REPLACE FUNCTION sync_company_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles table with company_id from user_profiles
  UPDATE profiles
  SET company_id = NEW.company_id,
      updated_at = NOW()
  WHERE id = NEW.id
    AND (company_id IS NULL OR company_id != NEW.company_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_user_profile_company ON user_profiles;
CREATE TRIGGER sync_user_profile_company
  AFTER INSERT OR UPDATE OF company_id ON user_profiles
  FOR EACH ROW
  WHEN (NEW.company_id IS NOT NULL)
  EXECUTE FUNCTION sync_company_to_profiles();

-- Step 8: Backfill existing users - link them to companies based on email domain
DO $$
DECLARE
  user_record RECORD;
  matched_company_id UUID;
BEGIN
  FOR user_record IN
    SELECT up.id, au.email
    FROM user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE up.company_id IS NULL
  LOOP
    matched_company_id := find_company_by_email_domain(user_record.email);
    IF matched_company_id IS NOT NULL THEN
      UPDATE user_profiles
      SET company_id = matched_company_id
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END $$;

-- Step 9: Ensure RLS allows users to read their linked company
-- Companies already have public read access from migration 002, but let's verify
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'companies'
    AND policyname = 'Allow public read access to companies'
  ) THEN
    CREATE POLICY "Allow public read access to companies"
    ON public.companies FOR SELECT
    USING (true);
  END IF;
END $$;
