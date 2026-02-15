-- Fix RLS policies: remove overly permissive "public read" policies
-- that allow ANY user (including anonymous) to read ALL data regardless of company.
--
-- Background:
-- 002_fix_rls_policies.sql created "Allow public read access to ..." policies
-- with USING (true), which lets anyone read all rows.
-- 009_rbac_permissions.sql added company-scoped policies for buyers, but
-- because Supabase ORs permissive policies, the public one overrides them.
-- Developments and campaigns were never given company-scoped policies.
--
-- This migration:
-- 1. Drops the "public read" USING(true) policies on buyers, developments, campaigns
-- 2. Drops the broad "authenticated" write policies on developments
-- 3. Creates company-scoped policies for developments (buyers already have them from 009)
-- Note: service_role bypasses RLS entirely, so no explicit policy needed for it.

-- ============================================================================
-- BUYERS TABLE
-- ============================================================================
-- Drop the USING(true) public read policy. Company-scoped policies already
-- exist from 009_rbac_permissions.sql:
--   "Users can view leads in their company"
--   "Users can create leads in their company"
--   "Users can update leads in their company"
--   "Users can delete leads in their company"
DROP POLICY IF EXISTS "Allow public read access to buyers" ON buyers;

-- ============================================================================
-- DEVELOPMENTS TABLE
-- ============================================================================
-- Drop the public read and broad authenticated write policies
DROP POLICY IF EXISTS "Allow public read access to developments" ON developments;
DROP POLICY IF EXISTS "Authenticated users can insert developments" ON developments;
DROP POLICY IF EXISTS "Authenticated users can update developments" ON developments;
DROP POLICY IF EXISTS "Authenticated users can delete developments" ON developments;

-- Create company-scoped policies (using helpers from 009_rbac_permissions.sql)
CREATE POLICY "Users can view developments in their company" ON developments
  FOR SELECT USING (
    company_id = get_user_company_id()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can create developments in their company" ON developments
  FOR INSERT WITH CHECK (
    (company_id = get_user_company_id() AND user_can_access_feature('developments', 'create'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can update developments in their company" ON developments
  FOR UPDATE USING (
    (company_id = get_user_company_id() AND user_can_access_feature('developments', 'update'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can delete developments in their company" ON developments
  FOR DELETE USING (
    (company_id = get_user_company_id() AND user_can_access_feature('developments', 'delete'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

-- ============================================================================
-- CAMPAIGNS TABLE
-- ============================================================================
-- Same issue: "Allow public read access to campaigns" from 002 overrides
-- the company-scoped "Users can view campaigns in their company" from 009.
DROP POLICY IF EXISTS "Allow public read access to campaigns" ON campaigns;
