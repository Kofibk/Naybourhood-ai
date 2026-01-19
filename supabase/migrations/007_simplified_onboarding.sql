-- Migration: Add columns for simplified 2-step onboarding flow
-- Run this in your Supabase SQL Editor

-- =============================================
-- ADD MISSING COLUMNS TO user_profiles
-- =============================================

-- Add company_id to link user to company
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add is_company_admin flag
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_company_admin BOOLEAN DEFAULT false;

-- Add membership_status for approval workflow
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'active'
CHECK (membership_status IN ('pending_approval', 'active', 'rejected', 'suspended'));

-- Add onboarding_completed_at timestamp
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- =============================================
-- ADD MISSING COLUMNS TO companies
-- =============================================

-- Add created_by to track who created the company
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add logo_url for company logo
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- =============================================
-- UPDATE RLS POLICIES FOR companies
-- =============================================

-- Allow users to view companies they belong to
DROP POLICY IF EXISTS "Users can view their company" ON companies;
CREATE POLICY "Users can view their company" ON companies
FOR SELECT USING (
  id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
  OR created_by = auth.uid()
);

-- Allow users to update companies they created
DROP POLICY IF EXISTS "Company creators can update their company" ON companies;
CREATE POLICY "Company creators can update their company" ON companies
FOR UPDATE USING (created_by = auth.uid());

-- =============================================
-- CREATE INDEX FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);

-- =============================================
-- Done! Run this migration in Supabase SQL Editor
-- =============================================
