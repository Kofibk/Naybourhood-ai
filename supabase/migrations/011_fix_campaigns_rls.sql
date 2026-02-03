-- Migration: Fix campaigns RLS policies to properly show all campaigns for internal team
-- Issue: Campaigns page showing 0 campaigns despite database having 24,504 records
-- Root cause: RLS policies reference is_internal_team column which may not exist,
-- and the policy logic doesn't properly handle internal team access to all campaigns

-- =====================================================
-- STEP 1: Ensure is_internal_team column exists on user_profiles
-- =====================================================

-- Add is_internal_team column if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_internal_team BOOLEAN DEFAULT false;

-- Add is_company_admin column if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_company_admin BOOLEAN DEFAULT false;

-- Add is_master_admin column if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_master_admin BOOLEAN DEFAULT false;

-- Add email column to user_profiles if it doesn't exist (needed for email-based checks)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- =====================================================
-- STEP 2: Sync email from auth.users to user_profiles
-- =====================================================

-- Update user_profiles.email from auth.users
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id AND (up.email IS NULL OR up.email = '');

-- =====================================================
-- STEP 3: Set internal team flags based on email domain
-- =====================================================

-- Mark Naybourhood team members as internal
UPDATE public.user_profiles
SET is_internal_team = true
WHERE email LIKE '%@naybourhood.ai'
  AND (is_internal_team IS NULL OR is_internal_team = false);

-- Mark kofi@naybourhood.ai as master admin
UPDATE public.user_profiles
SET is_master_admin = true, is_internal_team = true, is_company_admin = true
WHERE email = 'kofi@naybourhood.ai';

-- =====================================================
-- STEP 4: Create improved helper function for internal team check
-- =====================================================

-- Drop and recreate the function to check if current user is internal team
CREATE OR REPLACE FUNCTION is_internal_team_member()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  is_internal BOOLEAN;
BEGIN
  -- First try to get from user_profiles
  SELECT
    COALESCE(up.is_internal_team, false),
    COALESCE(up.email, au.email)
  INTO is_internal, user_email
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  WHERE au.id = auth.uid();

  -- If is_internal_team is true in database, return true
  IF is_internal = true THEN
    RETURN true;
  END IF;

  -- Fallback: check email domain
  IF user_email LIKE '%@naybourhood.ai' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 5: Fix campaigns RLS policies
-- =====================================================

-- Drop all existing campaign policies
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view campaigns in their company" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their company" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their company" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns in their company" ON public.campaigns;

-- Create new policy: Internal team can see ALL campaigns
CREATE POLICY "campaigns_select_policy" ON public.campaigns
  FOR SELECT USING (
    -- Internal team (Naybourhood staff) can see all campaigns
    is_internal_team_member()
    -- OR user can see campaigns for their company
    OR company_id = get_user_company_id()
    -- OR campaigns with no company (for backwards compatibility during data migration)
    OR (company_id IS NULL AND is_internal_team_member())
  );

-- Create policy for inserts
CREATE POLICY "campaigns_insert_policy" ON public.campaigns
  FOR INSERT WITH CHECK (
    -- Internal team can create any campaign
    is_internal_team_member()
    -- OR user can create campaigns for their company
    OR company_id = get_user_company_id()
  );

-- Create policy for updates
CREATE POLICY "campaigns_update_policy" ON public.campaigns
  FOR UPDATE USING (
    -- Internal team can update any campaign
    is_internal_team_member()
    -- OR user can update campaigns for their company
    OR company_id = get_user_company_id()
  );

-- Create policy for deletes
CREATE POLICY "campaigns_delete_policy" ON public.campaigns
  FOR DELETE USING (
    -- Internal team can delete any campaign
    is_internal_team_member()
    -- OR user can delete campaigns for their company (with appropriate permissions)
    OR company_id = get_user_company_id()
  );

-- =====================================================
-- STEP 6: Fix buyers (leads) RLS policies for consistency
-- =====================================================

-- Drop existing buyer policies
DROP POLICY IF EXISTS "Authenticated users can view buyers" ON public.buyers;
DROP POLICY IF EXISTS "Authenticated users can insert buyers" ON public.buyers;
DROP POLICY IF EXISTS "Authenticated users can update buyers" ON public.buyers;
DROP POLICY IF EXISTS "Authenticated users can delete buyers" ON public.buyers;
DROP POLICY IF EXISTS "Users can view leads in their company" ON public.buyers;
DROP POLICY IF EXISTS "Users can create leads in their company" ON public.buyers;
DROP POLICY IF EXISTS "Users can update leads in their company" ON public.buyers;
DROP POLICY IF EXISTS "Users can delete leads in their company" ON public.buyers;

-- Create new policies for buyers
CREATE POLICY "buyers_select_policy" ON public.buyers
  FOR SELECT USING (
    is_internal_team_member()
    OR company_id = get_user_company_id()
    OR (company_id IS NULL AND is_internal_team_member())
  );

CREATE POLICY "buyers_insert_policy" ON public.buyers
  FOR INSERT WITH CHECK (
    is_internal_team_member()
    OR company_id = get_user_company_id()
  );

CREATE POLICY "buyers_update_policy" ON public.buyers
  FOR UPDATE USING (
    is_internal_team_member()
    OR company_id = get_user_company_id()
  );

CREATE POLICY "buyers_delete_policy" ON public.buyers
  FOR DELETE USING (
    is_internal_team_member()
    OR company_id = get_user_company_id()
  );

-- =====================================================
-- STEP 7: Fix companies RLS policies
-- =====================================================

-- Drop existing company policies
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;

-- Internal team can see all companies
CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT USING (
    is_internal_team_member()
    OR id = get_user_company_id()
  );

CREATE POLICY "companies_insert_policy" ON public.companies
  FOR INSERT WITH CHECK (
    is_internal_team_member()
  );

CREATE POLICY "companies_update_policy" ON public.companies
  FOR UPDATE USING (
    is_internal_team_member()
    OR id = get_user_company_id()
  );

CREATE POLICY "companies_delete_policy" ON public.companies
  FOR DELETE USING (
    is_internal_team_member()
  );

-- =====================================================
-- STEP 8: Fix developments RLS policies
-- =====================================================

-- Drop existing development policies
DROP POLICY IF EXISTS "Authenticated users can view developments" ON public.developments;
DROP POLICY IF EXISTS "Authenticated users can insert developments" ON public.developments;
DROP POLICY IF EXISTS "Authenticated users can update developments" ON public.developments;
DROP POLICY IF EXISTS "Authenticated users can delete developments" ON public.developments;

-- Create new policies for developments
CREATE POLICY "developments_select_policy" ON public.developments
  FOR SELECT USING (
    is_internal_team_member()
    OR company_id = get_user_company_id()
    OR (company_id IS NULL AND is_internal_team_member())
  );

CREATE POLICY "developments_insert_policy" ON public.developments
  FOR INSERT WITH CHECK (
    is_internal_team_member()
    OR company_id = get_user_company_id()
  );

CREATE POLICY "developments_update_policy" ON public.developments
  FOR UPDATE USING (
    is_internal_team_member()
    OR company_id = get_user_company_id()
  );

CREATE POLICY "developments_delete_policy" ON public.developments
  FOR DELETE USING (
    is_internal_team_member()
    OR company_id = get_user_company_id()
  );

-- =====================================================
-- STEP 9: Ensure get_user_company_id function exists and works
-- =====================================================

-- Recreate the helper function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 10: Create index for performance
-- =====================================================

-- Index on is_internal_team for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_internal_team
ON public.user_profiles(is_internal_team)
WHERE is_internal_team = true;

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email
ON public.user_profiles(email);

-- =====================================================
-- DONE: RLS policies should now properly allow internal team to see all data
-- =====================================================
