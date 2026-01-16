-- Migration: Customer and User Profile creation on signup
-- Run this in your Supabase SQL Editor

-- =============================================
-- UPDATE HANDLE_NEW_USER_PROFILE TRIGGER
-- Creates both customers and user_profiles records on signup
-- =============================================

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

  -- Create customers record
  INSERT INTO public.customers (id, first_name, last_name, email)
  VALUES (NEW.id, v_first_name, v_last_name, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Create user_profiles record with customer_id link
  INSERT INTO public.user_profiles (id, customer_id, onboarding_step, onboarding_completed)
  VALUES (NEW.id, NEW.id, 1, false)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES FOR CUSTOMERS TABLE
-- =============================================

-- Allow users to view their own customer record
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
CREATE POLICY "Users can view own customer record"
ON public.customers
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own customer record
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;
CREATE POLICY "Users can update own customer record"
ON public.customers
FOR UPDATE
USING (auth.uid() = id);

-- =============================================
-- RLS POLICIES FOR COMPANIES TABLE
-- =============================================

-- Allow authenticated users to create companies (needed for onboarding)
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- Done! Run this migration in Supabase SQL Editor
-- =============================================
