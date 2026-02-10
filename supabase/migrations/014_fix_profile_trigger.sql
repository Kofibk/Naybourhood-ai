-- Migration: Fix user profile trigger to populate fields from user metadata
-- Run this in your Supabase SQL Editor
-- 
-- PROBLEM: The old trigger only inserted the user ID into user_profiles,
-- leaving email, first_name, last_name, user_type, etc. as NULL.
-- When users are invited via generateLink(), the metadata (full_name, role, 
-- company_id, is_internal) is stored in auth.users.raw_user_meta_data
-- but was never being written to user_profiles.
--
-- FIX: Update the trigger to extract all available metadata and populate
-- the profile fields. Use ON CONFLICT DO UPDATE so re-invites also work.

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_role text;
  v_company_id uuid;
  v_is_internal boolean;
BEGIN
  -- Extract full_name from metadata or derive from email
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Split full_name into first_name and last_name
  v_first_name := split_part(v_full_name, ' ', 1);
  v_last_name := CASE
    WHEN position(' ' in v_full_name) > 0
    THEN substring(v_full_name from position(' ' in v_full_name) + 1)
    ELSE NULL
  END;

  -- Extract role from metadata (set by invite flow)
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'developer');
  
  -- Extract company_id from metadata (set by invite flow)
  v_company_id := CASE 
    WHEN NEW.raw_user_meta_data->>'company_id' IS NOT NULL 
         AND NEW.raw_user_meta_data->>'company_id' != 'null'
         AND NEW.raw_user_meta_data->>'company_id' != ''
    THEN (NEW.raw_user_meta_data->>'company_id')::uuid
    ELSE NULL
  END;
  
  -- Extract is_internal from metadata (set by invite flow)
  v_is_internal := COALESCE((NEW.raw_user_meta_data->>'is_internal')::boolean, false);

  -- Create customers record (keep backward compatibility)
  INSERT INTO public.customers (id, first_name, last_name, email)
  VALUES (NEW.id, v_first_name, v_last_name, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, customers.first_name),
    last_name = COALESCE(EXCLUDED.last_name, customers.last_name),
    email = COALESCE(EXCLUDED.email, customers.email);

  -- Create user_profiles record with ALL available data
  -- Use ON CONFLICT DO UPDATE so that re-invites update the existing row
  INSERT INTO public.user_profiles (
    id, 
    customer_id, 
    email,
    first_name,
    last_name,
    user_type,
    is_internal_team,
    company_id,
    membership_status,
    onboarding_step, 
    onboarding_completed
  )
  VALUES (
    NEW.id, 
    NEW.id, 
    NEW.email,
    v_first_name,
    v_last_name,
    v_role,
    v_is_internal,
    v_company_id,
    'pending',
    1, 
    CASE WHEN v_is_internal THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    user_type = COALESCE(EXCLUDED.user_type, user_profiles.user_type),
    is_internal_team = COALESCE(EXCLUDED.is_internal_team, user_profiles.is_internal_team),
    company_id = COALESCE(EXCLUDED.company_id, user_profiles.company_id),
    membership_status = COALESCE(user_profiles.membership_status, 'pending'),
    onboarding_completed = CASE 
      WHEN EXCLUDED.is_internal_team = true THEN true 
      ELSE COALESCE(user_profiles.onboarding_completed, false)
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself doesn't need to be recreated since we're using CREATE OR REPLACE FUNCTION
-- But let's ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- =============================================
-- Done! Run this migration in Supabase SQL Editor
-- The trigger will now populate all profile fields from user metadata
-- =============================================
