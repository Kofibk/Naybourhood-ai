-- Multi-Tenant Company Linking Migration
-- Creates companies table and links users/leads to companies
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Create the companies table
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  type TEXT CHECK (type IN ('Developer', 'Agent', 'Broker', 'Marketing Agency', 'Financial Advisor')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT CHECK (status IN ('Active', 'Inactive', 'Pending')) DEFAULT 'Active',
  -- Subscription/Billing
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'access', 'growth', 'enterprise')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'cancelled', 'none')) DEFAULT 'none',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read companies
CREATE POLICY "Authenticated users can view companies"
ON companies FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage companies
CREATE POLICY "Admins can manage companies"
ON companies FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_type = 'admin'
  )
);

-- Index for website lookups (for email domain matching)
CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website);

-- ============================================
-- STEP 2: Add company_id to user_profiles
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- ============================================
-- STEP 3: Add company_id to buyers (leads) if not exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buyers' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE buyers ADD COLUMN company_id UUID REFERENCES companies(id);
    CREATE INDEX idx_buyers_company_id ON buyers(company_id);
  END IF;
END $$;

-- ============================================
-- STEP 4: Add company_id to campaigns if not exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN company_id UUID REFERENCES companies(id);
    CREATE INDEX idx_campaigns_company_id ON campaigns(company_id);
  END IF;
END $$;

-- ============================================
-- STEP 5: Email domain matching functions
-- ============================================
CREATE OR REPLACE FUNCTION extract_email_domain(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION find_company_by_email_domain(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  email_domain TEXT;
  matched_company_id UUID;
BEGIN
  email_domain := extract_email_domain(user_email);

  -- Skip common email providers
  IF email_domain IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                      'icloud.com', 'aol.com', 'mail.com', 'protonmail.com') THEN
    RETURN NULL;
  END IF;

  -- Find company where website matches email domain
  SELECT c.id INTO matched_company_id
  FROM companies c
  WHERE
    LOWER(REPLACE(REPLACE(REPLACE(c.website, 'https://', ''), 'http://', ''), 'www.', '')) = email_domain
    OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(c.website, 'https://', ''), 'http://', ''), 'www.', ''), '/', '')) = email_domain
    OR LOWER(c.website) LIKE '%' || email_domain || '%'
  LIMIT 1;

  RETURN matched_company_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 6: Auto-link trigger for user_profiles
-- ============================================
CREATE OR REPLACE FUNCTION auto_link_user_to_company()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  matched_company_id UUID;
BEGIN
  IF NEW.company_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  IF user_email IS NOT NULL THEN
    matched_company_id := find_company_by_email_domain(user_email);
    IF matched_company_id IS NOT NULL THEN
      NEW.company_id := matched_company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_link_user_company ON user_profiles;
CREATE TRIGGER auto_link_user_company
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_user_to_company();

-- ============================================
-- STEP 7: Migrate existing company_name data to companies table
-- ============================================
DO $$
DECLARE
  profile_record RECORD;
  new_company_id UUID;
BEGIN
  -- For each user with a company_name but no company_id
  FOR profile_record IN
    SELECT DISTINCT company_name, website
    FROM user_profiles
    WHERE company_name IS NOT NULL
      AND company_name != ''
      AND company_id IS NULL
  LOOP
    -- Check if company already exists
    SELECT id INTO new_company_id
    FROM companies
    WHERE LOWER(name) = LOWER(profile_record.company_name)
    LIMIT 1;

    -- Create company if it doesn't exist
    IF new_company_id IS NULL THEN
      INSERT INTO companies (name, website)
      VALUES (profile_record.company_name, profile_record.website)
      RETURNING id INTO new_company_id;
    END IF;

    -- Link users to this company
    UPDATE user_profiles
    SET company_id = new_company_id
    WHERE LOWER(company_name) = LOWER(profile_record.company_name)
      AND company_id IS NULL;
  END LOOP;
END $$;

-- ============================================
-- STEP 8: Backfill users by email domain
-- ============================================
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
