-- ============================================================================
-- Migration 019: Fix RLS gaps for multi-tenant isolation (v2)
-- Run this in your Supabase SQL Editor
--
-- What this does:
--   0. Helper:         Create is_internal_team_member() SECURITY DEFINER function
--   1. companies:      Enable RLS, drop 3 USING(true) policies, add user update policy
--   2. user_profiles:  Enable RLS, fix recursion in internal team policy,
--                      drop bad "service role" bypass, add company-scoped viewing
--   3. borrowers:      Drop 3 USING(true) policies, add INSERT/UPDATE for company users
--   4. conversations:  Enable RLS, drop 2 permissive policies, add company-scoped SELECT
--
-- Verified prerequisites:
--   - get_user_company_id() function EXISTS and is SECURITY DEFINER
--   - finance_leads table does NOT exist (skipped)
--   - All referenced columns verified via information_schema
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. HELPER FUNCTION
--    Create a SECURITY DEFINER function to check internal team membership.
--    This avoids infinite recursion when used inside user_profiles RLS policies
--    (a direct subquery on user_profiles from within user_profiles policies
--    causes PostgreSQL to re-evaluate RLS recursively).
-- ============================================================================

CREATE OR REPLACE FUNCTION is_internal_team_member()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_internal_team FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- ============================================================================
-- 1. COMPANIES
--    RLS is currently DISABLED. 3 policies grant USING(true) to everyone.
--    After: RLS enabled, only own company visible, admins/internal team see all.
-- ============================================================================

-- Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Allow public read access to companies" ON companies;
DROP POLICY IF EXISTS "Allow anon read companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated read companies" ON companies;

-- Add: regular users can update their own company
CREATE POLICY "Users can update their company" ON companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
  );

-- Enable RLS (existing policies that remain:
--   "Admins can manage companies"
--   "Internal team views all companies"
--   "Internal team updates all companies"
--   "Users can view their company"
--   "Authenticated users can create companies"
--   + new "Users can update their company")
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 2. USER_PROFILES
--    RLS is currently DISABLED. "Service role can manage all profiles" applies
--    USING(true) to {public} role (everyone), not just service_role.
--    The existing "Internal team views all user_profiles" policy uses a direct
--    subquery on user_profiles which causes infinite recursion when RLS is on.
--    After: RLS enabled, recursion-safe policies, users see own profile +
--           company colleagues, internal team sees all.
-- ============================================================================

-- Drop the misnamed policy that bypasses everything for all roles
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;

-- Drop and recreate the internal team policy using SECURITY DEFINER function
-- (the existing one uses EXISTS(SELECT FROM user_profiles ...) which causes recursion)
DROP POLICY IF EXISTS "Internal team views all user_profiles" ON user_profiles;

CREATE POLICY "Internal team views all user_profiles" ON user_profiles
  FOR SELECT USING (
    is_internal_team_member()
  );

-- Add: company members can view profiles in their company (for team pages)
-- (get_user_company_id() is already SECURITY DEFINER, so no recursion)
CREATE POLICY "Company members can view profiles in their company" ON user_profiles
  FOR SELECT USING (
    company_id = get_user_company_id()
  );

-- Enable RLS (policies that will be active:
--   "Users can view own profile"          — see own row
--   "Internal team views all user_profiles" — internal team sees all (recursion-safe)
--   "Company members can view profiles in their company" — see colleagues
--   "Users can update own profile"        — update own row
--   "Users can insert own profile"        — insert own row (auth trigger))
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 3. BORROWERS
--    RLS is ENABLED but 3 USING(true) policies override company-scoped ones.
--    After: only company-scoped + internal team + service role policies remain,
--           plus new INSERT/UPDATE for company users.
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow anon read borrowers" ON borrowers;
DROP POLICY IF EXISTS "Allow authenticated read borrowers" ON borrowers;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON borrowers;

-- Add: company users can create borrowers in their company
CREATE POLICY "Company users can create borrowers" ON borrowers
  FOR INSERT WITH CHECK (
    company_id = get_user_company_id()
    OR is_internal_team_member()
  );

-- Add: company users can update borrowers in their company
CREATE POLICY "Company users can update their borrowers" ON borrowers
  FOR UPDATE USING (
    company_id = get_user_company_id()
    OR is_internal_team_member()
  );

-- (RLS already enabled on borrowers, remaining policies:
--   "Users view own company borrowers"
--   "Internal team views all borrowers"
--   "Internal team updates all borrowers"
--   "Allow all for service role"
--   "Service role manages borrowers"
--   + new "Company users can create borrowers"
--   + new "Company users can update their borrowers")


-- ============================================================================
-- 4. CONVERSATIONS
--    RLS is currently DISABLED. "Authenticated users can view/insert" lets
--    any auth user see all conversations across all companies.
--    After: RLS enabled, users see own conversations + conversations linked
--           to their company's buyers, internal team sees all.
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can insert conversations" ON conversations;

-- Add: company-scoped SELECT via buyer_id -> buyers.company_id
-- (ConversationThread queries by buyer_id, team members need to see each other's conversations)
CREATE POLICY "Company members can view buyer conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyers
      WHERE buyers.id = conversations.buyer_id
        AND buyers.company_id = get_user_company_id()
    )
    OR is_internal_team_member()
  );

-- Enable RLS (existing policies that remain:
--   "Users read own conversations" (user_id = auth.uid())
--   "Users create conversations" (user_id = auth.uid())
--   "Users update own conversations" (user_id = auth.uid())
--   "Internal team views all conversations"
--   + new "Company members can view buyer conversations")
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

COMMIT;
