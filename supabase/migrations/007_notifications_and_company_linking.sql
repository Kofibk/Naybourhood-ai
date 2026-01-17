-- Migration: Admin Notifications and Improved Company Linking
-- 1. Creates admin_notifications table for system notifications
-- 2. Adds triggers to notify admin when user joins company
-- 3. Auto-links developments/campaigns to company when company is created

-- ============================================
-- STEP 1: Create admin_notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Notification type
  type TEXT NOT NULL CHECK (type IN (
    'new_user_joined_company',
    'new_company_created',
    'first_user_for_company',
    'subscription_expiring',
    'high_priority_lead',
    'campaign_performance_alert',
    'system_alert'
  )),
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  -- Related entities
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  development_id UUID REFERENCES developments(id),
  campaign_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  -- Priority
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view all notifications"
ON admin_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_type IN ('admin', 'super_admin')
  )
);

-- Only admins can update notifications (mark as read, dismiss)
CREATE POLICY "Admins can update notifications"
ON admin_notifications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_type IN ('admin', 'super_admin')
  )
);

-- Service role can insert notifications (from triggers)
CREATE POLICY "Service role can insert notifications"
ON admin_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_company_id ON admin_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- ============================================
-- STEP 2: Function to create admin notification
-- ============================================
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_user_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_development_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT 'medium',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (
    type, title, message, user_id, company_id,
    development_id, campaign_id, priority, metadata
  )
  VALUES (
    p_type, p_title, p_message, p_user_id, p_company_id,
    p_development_id, p_campaign_id, p_priority, p_metadata
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Trigger to notify when user is linked to company
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_on_user_company_link()
RETURNS TRIGGER AS $$
DECLARE
  company_name TEXT;
  user_email TEXT;
  user_count INTEGER;
BEGIN
  -- Only process if company_id was just set (was NULL, now has value)
  IF OLD.company_id IS NULL AND NEW.company_id IS NOT NULL THEN
    -- Get company name
    SELECT name INTO company_name FROM companies WHERE id = NEW.company_id;

    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

    -- Count existing users in this company (excluding current user)
    SELECT COUNT(*) INTO user_count
    FROM user_profiles
    WHERE company_id = NEW.company_id AND id != NEW.id;

    IF user_count = 0 THEN
      -- First user for this company - high priority notification
      PERFORM create_admin_notification(
        'first_user_for_company',
        'First User Joined Company',
        'User ' || COALESCE(user_email, 'Unknown') || ' is the first user to join ' || COALESCE(company_name, 'Unknown Company'),
        NEW.id,
        NEW.company_id,
        NULL,
        NULL,
        'high',
        jsonb_build_object('user_email', user_email, 'company_name', company_name, 'is_first_user', true)
      );
    ELSE
      -- Additional user joined company
      PERFORM create_admin_notification(
        'new_user_joined_company',
        'New User Joined Company',
        'User ' || COALESCE(user_email, 'Unknown') || ' joined ' || COALESCE(company_name, 'Unknown Company') || ' (Total users: ' || (user_count + 1) || ')',
        NEW.id,
        NEW.company_id,
        NULL,
        NULL,
        'medium',
        jsonb_build_object('user_email', user_email, 'company_name', company_name, 'total_users', user_count + 1)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_admin_user_company_link ON user_profiles;
CREATE TRIGGER notify_admin_user_company_link
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_user_company_link();

-- ============================================
-- STEP 4: Trigger to notify when new company is created
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_on_company_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_company_created',
    'New Company Created',
    'A new company "' || COALESCE(NEW.name, 'Unknown') || '" has been created',
    NULL,
    NEW.id,
    NULL,
    NULL,
    'medium',
    jsonb_build_object('company_name', NEW.name, 'website', NEW.website, 'type', NEW.type)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_admin_company_created ON companies;
CREATE TRIGGER notify_admin_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_company_created();

-- ============================================
-- STEP 5: Function to auto-link developments/campaigns to company
-- Called when a new company is created
-- ============================================
CREATE OR REPLACE FUNCTION auto_link_entities_to_company()
RETURNS TRIGGER AS $$
DECLARE
  company_domain TEXT;
  matched_count INTEGER := 0;
BEGIN
  -- Extract domain from company website if available
  IF NEW.website IS NOT NULL AND NEW.website != '' THEN
    company_domain := LOWER(
      REPLACE(REPLACE(REPLACE(REPLACE(NEW.website, 'https://', ''), 'http://', ''), 'www.', ''), '/', '')
    );

    -- Link developments by matching developer name to company name
    UPDATE developments
    SET company_id = NEW.id, updated_at = NOW()
    WHERE company_id IS NULL
      AND (
        LOWER(developer) = LOWER(NEW.name)
        OR LOWER(developer) LIKE '%' || LOWER(NEW.name) || '%'
        OR LOWER(NEW.name) LIKE '%' || LOWER(developer) || '%'
      );

    GET DIAGNOSTICS matched_count = ROW_COUNT;

    -- Link campaigns by matching client name to company name
    UPDATE campaigns
    SET company_id = NEW.id
    WHERE company_id IS NULL
      AND (
        LOWER(client) = LOWER(NEW.name)
        OR LOWER(client) LIKE '%' || LOWER(NEW.name) || '%'
        OR LOWER(NEW.name) LIKE '%' || LOWER(client) || '%'
      );
  ELSE
    -- No website, try to match by name only
    UPDATE developments
    SET company_id = NEW.id, updated_at = NOW()
    WHERE company_id IS NULL
      AND (
        LOWER(developer) = LOWER(NEW.name)
        OR LOWER(developer) LIKE '%' || LOWER(NEW.name) || '%'
      );

    UPDATE campaigns
    SET company_id = NEW.id
    WHERE company_id IS NULL
      AND (
        LOWER(client) = LOWER(NEW.name)
        OR LOWER(client) LIKE '%' || LOWER(NEW.name) || '%'
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_link_entities_on_company_create ON companies;
CREATE TRIGGER auto_link_entities_on_company_create
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_entities_to_company();

-- ============================================
-- STEP 6: Updated trigger for updated_at
-- ============================================
CREATE TRIGGER on_admin_notifications_updated BEFORE UPDATE ON admin_notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STEP 7: Backfill - Link existing developments/campaigns to companies
-- ============================================
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id, name, website FROM companies LOOP
    -- Link developments by developer name
    UPDATE developments
    SET company_id = company_record.id, updated_at = NOW()
    WHERE company_id IS NULL
      AND (
        LOWER(developer) = LOWER(company_record.name)
        OR LOWER(developer) LIKE '%' || LOWER(company_record.name) || '%'
        OR LOWER(company_record.name) LIKE '%' || LOWER(developer) || '%'
      );

    -- Link campaigns by client name
    UPDATE campaigns
    SET company_id = company_record.id
    WHERE company_id IS NULL
      AND (
        LOWER(client) = LOWER(company_record.name)
        OR LOWER(client) LIKE '%' || LOWER(company_record.name) || '%'
        OR LOWER(company_record.name) LIKE '%' || LOWER(client) || '%'
      );
  END LOOP;
END $$;
