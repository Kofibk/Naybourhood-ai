-- Migration: Company creation on signup
-- Run this in your Supabase SQL Editor

-- =============================================
-- CREATE ROLE ENUM TYPE
-- =============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('developer', 'agent', 'broker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- ADD BUSINESS_ADDRESS TO COMPANIES TABLE
-- =============================================

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS business_address text;

-- =============================================
-- UPDATE HANDLE_NEW_USER_PROFILE TRIGGER
-- =============================================

-- Update the trigger function to populate email and name fields
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_first_name text;
  v_last_name text;
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

  INSERT INTO user_profiles (
    id,
    first_name,
    last_name,
    onboarding_step,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    1,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Done! The trigger already exists, this just updates the function
-- =============================================
