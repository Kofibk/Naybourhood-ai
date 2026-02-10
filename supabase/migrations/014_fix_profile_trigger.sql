-- Migration: Fix user profile trigger to populate fields from user metadata
-- Run this in your Supabase SQL Editor
-- 
-- PROBLEM: The old trigger only inserted the user ID into user_profiles,
-- leaving email, first_name, last_name, etc. as NULL.
-- The previous fix attempted UUID casting that crashed generateLink.
--
-- FIX: Simple, defensive trigger that populates basic fields.
-- Does NOT set company_id (foreign key - let API handle it) or job_role (check constraint).
-- Uses ON CONFLICT DO UPDATE to fill in NULLs on re-invite.

-- =============================================
-- STEP 1: Fix the trigger function
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_role text;
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

  -- Extract role from metadata (default to 'developer' which is always valid)
  v_role := NEW.raw_user_meta_data->>'role';
  -- Only use the role if it's a valid user_type value
  IF v_role IS NULL OR v_role NOT IN ('developer', 'agent', 'broker', 'admin') THEN
    v_role := 'developer';
  END IF;
  
  -- Extract is_internal safely (default false)
  BEGIN
    v_is_internal := COALESCE((NEW.raw_user_meta_data->>'is_internal')::boolean, false);
  EXCEPTION WHEN OTHERS THEN
    v_is_internal := false;
  END;

  -- Create customers record (keep backward compatibility, simple DO NOTHING)
  BEGIN
    INSERT INTO public.customers (id, first_name, last_name, email)
    VALUES (NEW.id, v_first_name, v_last_name, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- If customers table doesn't exist or fails, just continue
    NULL;
  END;

  -- Create/update user_profiles record
  -- IMPORTANT: Do NOT set company_id here (foreign key that could fail)
  -- IMPORTANT: Do NOT set job_role here (has strict check constraint)
  -- The API code will set those fields after this trigger completes
  INSERT INTO public.user_profiles (
    id, 
    customer_id, 
    email,
    first_name,
    last_name,
    user_type,
    is_internal_team,
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
    'pending',
    1, 
    CASE WHEN v_is_internal THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    user_type = COALESCE(user_profiles.user_type, EXCLUDED.user_type),
    is_internal_team = COALESCE(EXCLUDED.is_internal_team, user_profiles.is_internal_team, false);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, still return NEW so the auth.users INSERT succeeds
  -- The API code will handle profile creation as a fallback
  RAISE WARNING 'handle_new_user_profile trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- =============================================
-- STEP 2: Fix check constraints that might be stale
-- Drop and recreate to ensure correct values
-- =============================================

-- Fix membership_status check constraint
-- First drop any existing constraint (name may vary)
DO $$
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_membership_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Recreate with all valid values
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_membership_status_check 
  CHECK (membership_status IN ('pending', 'pending_approval', 'active', 'rejected', 'suspended'));

-- Fix user_type check constraint to include 'admin'
DO $$
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_type_check 
  CHECK (user_type IN ('developer', 'agent', 'broker', 'admin'));

-- Fix job_role check constraint to be more permissive
DO $$
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_job_role_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_job_role_check 
  CHECK (job_role IS NULL OR job_role IN ('operations', 'marketing', 'sales', 'management', 'other'));

-- =============================================
-- Done! Run this migration in Supabase SQL Editor
-- =============================================
