-- Migration: Customer creation on signup
-- Run this in your Supabase SQL Editor

-- =============================================
-- UPDATE HANDLE_NEW_USER_PROFILE TRIGGER
-- Now creates a customer record instead of user_profiles
-- =============================================

-- Update the trigger function to create a customer record
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

  -- Insert into customers table
  INSERT INTO customers (
    id,
    first_name,
    last_name,
    email
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Done! The trigger already exists, this just updates the function
-- =============================================
