-- ═══════════════════════════════════════════════════════════════════
-- Fix ENUM Columns to TEXT for Flexible Data Import
-- This script converts ENUM columns to TEXT to allow any value
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Drop all views that depend on the buyers table
-- (We'll recreate them at the end)

-- First, let's see all dependent views
DO $$
DECLARE
  view_rec RECORD;
BEGIN
  RAISE NOTICE 'Views depending on buyers table:';
  FOR view_rec IN
    SELECT DISTINCT v.table_name as view_name
    FROM information_schema.view_column_usage v
    WHERE v.table_name != 'buyers'
    AND EXISTS (
      SELECT 1 FROM information_schema.view_column_usage vc
      WHERE vc.view_name = v.table_name
      AND vc.table_name = 'buyers'
    )
  LOOP
    RAISE NOTICE 'Found view: %', view_rec.view_name;
  END LOOP;
END $$;

-- Drop views in order (most dependent first)
DROP VIEW IF EXISTS buyers_stats CASCADE;
DROP VIEW IF EXISTS buyers_pipeline CASCADE;
DROP VIEW IF EXISTS buyers_view CASCADE;

-- Step 2: Convert ENUM columns to TEXT

-- purchase_purpose: ENUM → TEXT
ALTER TABLE buyers
  ALTER COLUMN purchase_purpose TYPE TEXT;

-- payment_method: ENUM → TEXT
ALTER TABLE buyers
  ALTER COLUMN payment_method TYPE TEXT;

-- enquiry_type: ENUM → TEXT
ALTER TABLE buyers
  ALTER COLUMN enquiry_type TYPE TEXT;

-- status is already handled by lead_normalizer, but let's ensure it's TEXT too
-- ALTER TABLE buyers
--   ALTER COLUMN status TYPE TEXT;

-- Step 3: Verify the changes
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'buyers'
AND column_name IN ('purchase_purpose', 'payment_method', 'enquiry_type', 'status')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════════════
-- Step 4: Recreate the views
-- ═══════════════════════════════════════════════════════════════════

-- Recreate buyers_view (main view for lead display)
CREATE OR REPLACE VIEW buyers_view AS
SELECT
  b.id,
  b.lead_id,
  b.full_name,
  b.first_name,
  b.last_name,
  b.email,
  b.phone,
  b.country,
  b.budget_range,
  b.budget_min,
  b.budget_max,
  b.preferred_bedrooms,
  b.preferred_location,
  b.timeline_to_purchase,
  b.purchase_purpose,
  b.ready_within_28_days,
  b.source_platform,
  b.source_campaign,
  b.development_name,
  b.enquiry_type,
  b.status,
  b.payment_method,
  b.proof_of_funds,
  b.mortgage_status,
  b.uk_broker,
  b.uk_solicitor,
  b.notes,
  b.agent_transcript,
  b.viewing_intent_confirmed,
  b.viewing_booked,
  b.viewing_date,
  b.replied,
  b.stop_agent_communication,
  b.connect_to_broker,
  b.assigned_caller,
  b.company_id,
  b.date_added,
  b.created_at,
  b.updated_at,
  -- AI fields
  b.ai_quality_score,
  b.ai_intent_score,
  b.ai_confidence,
  b.ai_summary,
  b.ai_next_action,
  b.ai_risk_flags,
  b.ai_recommendations,
  b.ai_classification,
  b.ai_priority,
  b.ai_scored_at,
  -- Calculated fields
  COALESCE(b.ai_quality_score, 50) as quality_score,
  COALESCE(b.ai_intent_score, 50) as intent_score,
  CASE
    WHEN COALESCE(b.ai_quality_score, 50) >= 70 AND COALESCE(b.ai_intent_score, 50) >= 70 THEN 'Hot'
    WHEN COALESCE(b.ai_quality_score, 50) >= 40 OR COALESCE(b.ai_intent_score, 50) >= 40 THEN 'Warm'
    ELSE 'Low'
  END as classification,
  -- Days in status
  EXTRACT(DAY FROM NOW() - COALESCE(b.updated_at, b.created_at))::integer as days_in_status
FROM buyers b;

-- Recreate buyers_pipeline (pipeline stats view)
CREATE OR REPLACE VIEW buyers_pipeline AS
SELECT
  status,
  COUNT(*) as count,
  company_id
FROM buyers
WHERE status IS NOT NULL
GROUP BY status, company_id;

-- Recreate buyers_stats (aggregated stats view)
CREATE OR REPLACE VIEW buyers_stats AS
SELECT
  company_id,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'Contact Pending') as contact_pending,
  COUNT(*) FILTER (WHERE status = 'Follow Up') as follow_up,
  COUNT(*) FILTER (WHERE status = 'Viewing Booked') as viewing_booked,
  COUNT(*) FILTER (WHERE status = 'Negotiating') as negotiating,
  COUNT(*) FILTER (WHERE status = 'Reserved') as reserved,
  COUNT(*) FILTER (WHERE status = 'Exchanged') as exchanged,
  COUNT(*) FILTER (WHERE status = 'Completed') as completed,
  COUNT(*) FILTER (WHERE status = 'Not Proceeding') as not_proceeding,
  COUNT(*) FILTER (WHERE status = 'Duplicate') as duplicate,
  COUNT(*) FILTER (WHERE ai_classification = 'Hot' OR (COALESCE(ai_quality_score, 50) >= 70 AND COALESCE(ai_intent_score, 50) >= 70)) as hot_leads,
  AVG(COALESCE(ai_quality_score, 50))::integer as avg_quality_score,
  AVG(COALESCE(ai_intent_score, 50))::integer as avg_intent_score
FROM buyers
GROUP BY company_id;

-- ═══════════════════════════════════════════════════════════════════
-- Done! Verify everything worked
-- ═══════════════════════════════════════════════════════════════════

SELECT 'Views recreated successfully' as result;

-- Show current column types
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'buyers'
AND column_name IN ('purchase_purpose', 'payment_method', 'enquiry_type', 'status', 'uk_broker', 'uk_solicitor')
ORDER BY column_name;
