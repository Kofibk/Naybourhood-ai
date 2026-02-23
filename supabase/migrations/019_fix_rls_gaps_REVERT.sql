-- ============================================================================
-- REVERT Migration 019: Restore exact previous state
-- Run this in your Supabase SQL Editor if you need to undo 019_fix_rls_gaps.sql
--
-- This restores:
--   0. Helper:         Drop is_internal_team_member() function
--   1. companies:      Disable RLS, re-create 3 USING(true) policies, drop update policy
--   2. user_profiles:  Disable RLS, restore original internal team policy,
--                      re-create "Service role can manage all profiles"
--   3. borrowers:      Re-create 3 USING(true) policies, drop INSERT/UPDATE policies
--   4. conversations:  Disable RLS, re-create 2 permissive policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. COMPANIES — revert
-- ============================================================================

-- Disable RLS first (so policies become decorative again)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Drop the new policy we added
DROP POLICY IF EXISTS "Users can update their company" ON companies;

-- Re-create the 3 permissive policies that were dropped
CREATE POLICY "Allow public read access to companies" ON companies
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow anon read companies" ON companies
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read companies" ON companies
  FOR SELECT TO authenticated USING (true);


-- ============================================================================
-- 2. USER_PROFILES — revert
-- ============================================================================

-- Disable RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop the new policies we added
DROP POLICY IF EXISTS "Company members can view profiles in their company" ON user_profiles;

-- Drop the recreated internal team policy (uses function)
DROP POLICY IF EXISTS "Internal team views all user_profiles" ON user_profiles;

-- Restore original internal team policy (uses direct subquery — safe when RLS is disabled)
CREATE POLICY "Internal team views all user_profiles" ON user_profiles
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_internal_team = true
    )
  );

-- Re-create the bypass policy (original: roles={public}, cmd=ALL, qual=true, with_check=true)
CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL TO public USING (true) WITH CHECK (true);


-- ============================================================================
-- 3. BORROWERS — revert
-- ============================================================================

-- Drop the new policies we added
DROP POLICY IF EXISTS "Company users can create borrowers" ON borrowers;
DROP POLICY IF EXISTS "Company users can update their borrowers" ON borrowers;

-- Re-create the 3 permissive policies that were dropped
CREATE POLICY "Allow anon read borrowers" ON borrowers
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read borrowers" ON borrowers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated users" ON borrowers
  FOR SELECT TO public USING (auth.role() = 'authenticated');


-- ============================================================================
-- 4. CONVERSATIONS — revert
-- ============================================================================

-- Disable RLS
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Drop the new policy we added
DROP POLICY IF EXISTS "Company members can view buyer conversations" ON conversations;

-- Re-create the 2 permissive policies that were dropped
CREATE POLICY "Authenticated users can view conversations" ON conversations
  FOR SELECT TO public USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert conversations" ON conversations
  FOR INSERT TO public WITH CHECK (auth.role() = 'authenticated');


-- ============================================================================
-- 0. HELPER FUNCTION — revert (drop last so policies that reference it are gone first)
-- ============================================================================

DROP FUNCTION IF EXISTS is_internal_team_member();

COMMIT;
