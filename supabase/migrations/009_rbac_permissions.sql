-- =====================================================
-- RBAC: Role-Based Access Control & Tenant Feature Flags
-- =====================================================
-- This migration adds:
-- 1. enabled_features JSONB column to companies (tenant feature flags)
-- 2. role_permissions table (defines what each role can do)
-- 3. Updates user_profiles with standardized role column
-- 4. RLS policies that scope data by company_id
-- =====================================================

-- =====================================================
-- 1. ADD TENANT FEATURE FLAGS TO COMPANIES
-- =====================================================

-- Add enabled_features column to companies table
-- Default features for all tenants: leads, campaigns, developments
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '["leads", "campaigns", "developments", "conversations"]'::jsonb;

-- Add subscription-based feature tiers as a reference
COMMENT ON COLUMN companies.enabled_features IS
'Array of enabled features for this tenant.
Possible values: leads, campaigns, developments, analytics, reports, borrowers, ai_insights, billing, team_management
Starter tier: ["leads", "developments"]
Access tier: ["leads", "campaigns", "developments", "conversations"]
Growth tier: ["leads", "campaigns", "developments", "conversations", "analytics", "ai_insights"]
Enterprise tier: All features';

-- =====================================================
-- 2. CREATE ROLE PERMISSIONS TABLE
-- =====================================================

-- Drop if exists (for clean re-runs)
DROP TABLE IF EXISTS role_permissions;

-- Create role_permissions table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,           -- 'owner', 'admin', 'sales', 'marketing', 'viewer'
  feature TEXT NOT NULL,        -- 'leads', 'campaigns', 'developments', etc.
  can_read BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, feature)
);

-- Add comment
COMMENT ON TABLE role_permissions IS
'Defines permissions for each role on each feature.
A user can only access a feature if:
1. Their tenant (company) has the feature enabled in enabled_features
2. Their role has the appropriate permission in this table';

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read role_permissions (it's configuration data)
CREATE POLICY "Anyone can read role_permissions" ON role_permissions
  FOR SELECT USING (true);

-- Only super admins can modify (via service role)
CREATE POLICY "Service role can modify role_permissions" ON role_permissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 3. SEED DEFAULT ROLE PERMISSIONS
-- =====================================================

-- Owner: Full access to everything
INSERT INTO role_permissions (role, feature, can_read, can_create, can_update, can_delete) VALUES
  ('owner', 'leads', true, true, true, true),
  ('owner', 'campaigns', true, true, true, true),
  ('owner', 'developments', true, true, true, true),
  ('owner', 'conversations', true, true, true, true),
  ('owner', 'analytics', true, true, true, true),
  ('owner', 'reports', true, true, true, true),
  ('owner', 'borrowers', true, true, true, true),
  ('owner', 'ai_insights', true, true, true, true),
  ('owner', 'billing', true, true, true, true),
  ('owner', 'team_management', true, true, true, true),
  ('owner', 'settings', true, true, true, true);

-- Admin: Full access except billing
INSERT INTO role_permissions (role, feature, can_read, can_create, can_update, can_delete) VALUES
  ('admin', 'leads', true, true, true, true),
  ('admin', 'campaigns', true, true, true, true),
  ('admin', 'developments', true, true, true, true),
  ('admin', 'conversations', true, true, true, true),
  ('admin', 'analytics', true, true, true, false),
  ('admin', 'reports', true, true, true, false),
  ('admin', 'borrowers', true, true, true, true),
  ('admin', 'ai_insights', true, true, true, false),
  ('admin', 'billing', true, false, false, false),  -- Read-only billing
  ('admin', 'team_management', true, true, true, false),
  ('admin', 'settings', true, true, true, false);

-- Sales: Leads, campaigns, conversations, some analytics
INSERT INTO role_permissions (role, feature, can_read, can_create, can_update, can_delete) VALUES
  ('sales', 'leads', true, true, true, false),
  ('sales', 'campaigns', true, false, false, false),  -- Read-only campaigns
  ('sales', 'developments', true, false, false, false),
  ('sales', 'conversations', true, true, true, false),
  ('sales', 'analytics', true, false, false, false),
  ('sales', 'reports', true, false, false, false),
  ('sales', 'borrowers', true, true, true, false),
  ('sales', 'ai_insights', true, false, false, false),
  ('sales', 'billing', false, false, false, false),
  ('sales', 'team_management', false, false, false, false),
  ('sales', 'settings', true, false, false, false);

-- Marketing: Campaigns, analytics, reports
INSERT INTO role_permissions (role, feature, can_read, can_create, can_update, can_delete) VALUES
  ('marketing', 'leads', true, false, false, false),  -- Read-only leads
  ('marketing', 'campaigns', true, true, true, false),
  ('marketing', 'developments', true, false, false, false),
  ('marketing', 'conversations', true, false, false, false),
  ('marketing', 'analytics', true, true, true, false),
  ('marketing', 'reports', true, true, true, false),
  ('marketing', 'borrowers', false, false, false, false),
  ('marketing', 'ai_insights', true, false, false, false),
  ('marketing', 'billing', false, false, false, false),
  ('marketing', 'team_management', false, false, false, false),
  ('marketing', 'settings', true, false, false, false);

-- Viewer: Read-only access to most things
INSERT INTO role_permissions (role, feature, can_read, can_create, can_update, can_delete) VALUES
  ('viewer', 'leads', true, false, false, false),
  ('viewer', 'campaigns', true, false, false, false),
  ('viewer', 'developments', true, false, false, false),
  ('viewer', 'conversations', true, false, false, false),
  ('viewer', 'analytics', true, false, false, false),
  ('viewer', 'reports', true, false, false, false),
  ('viewer', 'borrowers', true, false, false, false),
  ('viewer', 'ai_insights', true, false, false, false),
  ('viewer', 'billing', false, false, false, false),
  ('viewer', 'team_management', false, false, false, false),
  ('viewer', 'settings', true, false, false, false);

-- =====================================================
-- 4. UPDATE USER_PROFILES WITH ROLE COLUMN
-- =====================================================

-- Add role column if it doesn't exist (different from user_type and job_role)
-- This is the permission role, not the business type
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS permission_role TEXT DEFAULT 'viewer'
CHECK (permission_role IN ('owner', 'admin', 'sales', 'marketing', 'viewer'));

COMMENT ON COLUMN user_profiles.permission_role IS
'Permission role for RBAC. Different from user_type (business type) and job_role (function).
owner: Company owner, full access including billing
admin: Full access except billing management
sales: Leads, conversations, borrowers
marketing: Campaigns, analytics, reports
viewer: Read-only access';

-- Set existing company admins as owners
UPDATE user_profiles
SET permission_role = 'owner'
WHERE is_company_admin = true AND permission_role IS NULL;

-- Set internal team as admins
UPDATE user_profiles
SET permission_role = 'admin'
WHERE is_internal_team = true AND permission_role IS NULL;

-- =====================================================
-- 5. UPDATE RLS POLICIES FOR COMPANY-SCOPED ACCESS
-- =====================================================

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user has feature access
CREATE OR REPLACE FUNCTION user_can_access_feature(feature_name TEXT, permission_type TEXT DEFAULT 'read')
RETURNS BOOLEAN AS $$
DECLARE
  user_company_id UUID;
  user_role TEXT;
  company_features JSONB;
  has_permission BOOLEAN;
BEGIN
  -- Get user's company and role
  SELECT company_id, permission_role INTO user_company_id, user_role
  FROM user_profiles WHERE id = auth.uid();

  -- Internal team (Naybourhood staff) has access to everything
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true) THEN
    RETURN true;
  END IF;

  -- No company = no access
  IF user_company_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if company has feature enabled
  SELECT enabled_features INTO company_features
  FROM companies WHERE id = user_company_id;

  IF NOT (company_features ? feature_name) THEN
    RETURN false;
  END IF;

  -- Check role permission
  SELECT
    CASE permission_type
      WHEN 'read' THEN can_read
      WHEN 'create' THEN can_create
      WHEN 'update' THEN can_update
      WHEN 'delete' THEN can_delete
      ELSE can_read
    END INTO has_permission
  FROM role_permissions
  WHERE role = user_role AND feature = feature_name;

  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 6. UPDATE BUYERS (LEADS) RLS POLICIES
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view buyers" ON buyers;
DROP POLICY IF EXISTS "Authenticated users can insert buyers" ON buyers;
DROP POLICY IF EXISTS "Authenticated users can update buyers" ON buyers;
DROP POLICY IF EXISTS "Authenticated users can delete buyers" ON buyers;

-- New company-scoped policies
CREATE POLICY "Users can view leads in their company" ON buyers
  FOR SELECT USING (
    company_id = get_user_company_id()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can create leads in their company" ON buyers
  FOR INSERT WITH CHECK (
    (company_id = get_user_company_id() AND user_can_access_feature('leads', 'create'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can update leads in their company" ON buyers
  FOR UPDATE USING (
    (company_id = get_user_company_id() AND user_can_access_feature('leads', 'update'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can delete leads in their company" ON buyers
  FOR DELETE USING (
    (company_id = get_user_company_id() AND user_can_access_feature('leads', 'delete'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

-- =====================================================
-- 7. UPDATE CAMPAIGNS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON campaigns;

CREATE POLICY "Users can view campaigns in their company" ON campaigns
  FOR SELECT USING (
    company_id = get_user_company_id()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can create campaigns in their company" ON campaigns
  FOR INSERT WITH CHECK (
    (company_id = get_user_company_id() AND user_can_access_feature('campaigns', 'create'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

CREATE POLICY "Users can update campaigns in their company" ON campaigns
  FOR UPDATE USING (
    (company_id = get_user_company_id() AND user_can_access_feature('campaigns', 'update'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

-- =====================================================
-- 8. UPDATE COMPANIES RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;

-- Users can only see their own company (internal team can see all)
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    id = get_user_company_id()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

-- Only owners/admins can update their company
CREATE POLICY "Company admins can update their company" ON companies
  FOR UPDATE USING (
    (id = get_user_company_id() AND user_can_access_feature('settings', 'update'))
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_internal_team = true)
  );

-- =====================================================
-- 9. CREATE VIEW FOR USER PERMISSIONS (for easy querying)
-- =====================================================

CREATE OR REPLACE VIEW user_feature_permissions AS
SELECT
  up.id AS user_id,
  up.email,
  up.permission_role,
  up.company_id,
  c.name AS company_name,
  c.enabled_features,
  rp.feature,
  rp.can_read,
  rp.can_create,
  rp.can_update,
  rp.can_delete,
  -- Feature is accessible if company has it AND role permits it
  (c.enabled_features ? rp.feature) AS company_has_feature,
  ((c.enabled_features ? rp.feature) AND rp.can_read) AS effective_can_read,
  ((c.enabled_features ? rp.feature) AND rp.can_create) AS effective_can_create,
  ((c.enabled_features ? rp.feature) AND rp.can_update) AS effective_can_update,
  ((c.enabled_features ? rp.feature) AND rp.can_delete) AS effective_can_delete
FROM user_profiles up
LEFT JOIN companies c ON up.company_id = c.id
CROSS JOIN role_permissions rp
WHERE rp.role = up.permission_role;

-- Grant access to the view
GRANT SELECT ON user_feature_permissions TO authenticated;

-- =====================================================
-- 10. UPDATE EXISTING COMPANIES WITH DEFAULT FEATURES
-- =====================================================

-- Set default features based on subscription tier
UPDATE companies SET enabled_features =
  CASE subscription_tier
    WHEN 'starter' THEN '["leads", "developments"]'::jsonb
    WHEN 'access' THEN '["leads", "campaigns", "developments", "conversations"]'::jsonb
    WHEN 'growth' THEN '["leads", "campaigns", "developments", "conversations", "analytics", "ai_insights", "borrowers"]'::jsonb
    WHEN 'enterprise' THEN '["leads", "campaigns", "developments", "conversations", "analytics", "reports", "borrowers", "ai_insights", "billing", "team_management", "settings"]'::jsonb
    ELSE '["leads", "campaigns", "developments", "conversations"]'::jsonb  -- Default to access tier
  END
WHERE enabled_features IS NULL OR enabled_features = '["leads", "campaigns", "developments", "conversations"]'::jsonb;

-- =====================================================
-- DONE
-- =====================================================
