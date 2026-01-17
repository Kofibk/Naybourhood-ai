-- Naybourhood AI Scoring Framework Migration
-- Implements the scoring hierarchy: Financial Proceedability > Commitment Signals > Realism > Engagement
-- Run this in your Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════
-- NEW COLUMNS FOR SCORING FRAMEWORK (using safe DO blocks)
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Purchase purpose with support for dependent_studying
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'purchase_purpose') THEN
    ALTER TABLE public.buyers ADD COLUMN purchase_purpose TEXT;
  END IF;

  -- 28-day purchase intent (critical for Hot Lead classification)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'ready_within_28_days') THEN
    ALTER TABLE public.buyers ADD COLUMN ready_within_28_days BOOLEAN DEFAULT false;
  END IF;

  -- Enhanced AI scoring fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'ai_classification') THEN
    ALTER TABLE public.buyers ADD COLUMN ai_classification TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'ai_priority') THEN
    ALTER TABLE public.buyers ADD COLUMN ai_priority TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'ai_recommendations') THEN
    ALTER TABLE public.buyers ADD COLUMN ai_recommendations TEXT[];
  END IF;

  -- Call priority for sales team
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'call_priority') THEN
    ALTER TABLE public.buyers ADD COLUMN call_priority INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'call_priority_reason') THEN
    ALTER TABLE public.buyers ADD COLUMN call_priority_reason TEXT;
  END IF;

  -- Low urgency flag for classification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'low_urgency_flag') THEN
    ALTER TABLE public.buyers ADD COLUMN low_urgency_flag BOOLEAN DEFAULT false;
  END IF;

  -- Fake lead detection
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'is_fake_lead') THEN
    ALTER TABLE public.buyers ADD COLUMN is_fake_lead BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'fake_lead_flags') THEN
    ALTER TABLE public.buyers ADD COLUMN fake_lead_flags TEXT[];
  END IF;

  -- Country field if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'country') THEN
    ALTER TABLE public.buyers ADD COLUMN country TEXT;
  END IF;
END $$;

-- Comment on columns for documentation (safe to run multiple times)
COMMENT ON COLUMN buyers.purchase_purpose IS 'Purpose of purchase: primary_residence, dependent_studying, investment, holiday_home';
COMMENT ON COLUMN buyers.ready_within_28_days IS 'HARD RULE: If true, buyer is automatically classified as Hot Lead';
COMMENT ON COLUMN buyers.ai_classification IS 'Hot Lead, Qualified, Needs Qualification, Nurture, Low Priority, Disqualified';
COMMENT ON COLUMN buyers.call_priority IS 'Priority level 1-5 where 1 is highest (28-day buyers)';
COMMENT ON COLUMN buyers.low_urgency_flag IS 'If true, buyer is classified as Low Priority regardless of other scores';

-- ═══════════════════════════════════════════════════════════════════
-- CREATE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_buyers_classification ON buyers(ai_classification);
CREATE INDEX IF NOT EXISTS idx_buyers_call_priority ON buyers(call_priority);
CREATE INDEX IF NOT EXISTS idx_buyers_28_day ON buyers(ready_within_28_days) WHERE ready_within_28_days = true;
CREATE INDEX IF NOT EXISTS idx_buyers_purchase_purpose ON buyers(purchase_purpose);
CREATE INDEX IF NOT EXISTS idx_buyers_company_id ON buyers(company_id);
CREATE INDEX IF NOT EXISTS idx_buyers_is_fake ON buyers(is_fake_lead) WHERE is_fake_lead = false;

-- ═══════════════════════════════════════════════════════════════════
-- VIEW: v_hot_leads_today
-- Last 14 days, ranked by call_priority
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_hot_leads_today AS
SELECT
  b.id,
  b.full_name,
  b.first_name,
  b.last_name,
  b.email,
  b.phone,
  b.country,
  b.budget,
  b.budget_min,
  b.budget_max,
  b.bedrooms,
  b.location,
  b.area,
  b.timeline,
  b.source,
  b.campaign,
  b.status,
  b.payment_method,
  b.proof_of_funds,
  b.mortgage_status,
  b.uk_broker,
  b.uk_solicitor,
  b.purchase_purpose,
  b.ready_within_28_days,
  b.ai_quality_score,
  b.ai_intent_score,
  b.ai_confidence,
  b.ai_classification,
  b.ai_priority,
  b.ai_summary,
  b.ai_next_action,
  b.ai_risk_flags,
  b.ai_recommendations,
  b.call_priority,
  b.call_priority_reason,
  b.assigned_to,
  b.assigned_user_name,
  b.company_id,
  b.notes,
  b.created_at,
  b.updated_at,
  b.last_contact,
  b.ai_scored_at,
  EXTRACT(DAY FROM (NOW() - b.created_at)) as days_since_created,
  CASE
    WHEN b.ready_within_28_days = true THEN 'Immediate - 28 Day Buyer'
    WHEN b.call_priority = 1 THEN 'Within 1 hour'
    WHEN b.call_priority = 2 THEN 'Within 4 hours'
    ELSE 'Within 24 hours'
  END as response_sla
FROM buyers b
WHERE
  -- Hot Lead classification
  (b.ai_classification = 'Hot Lead' OR b.ai_classification = 'Hot')
  -- Within last 14 days
  AND b.created_at >= NOW() - INTERVAL '14 days'
  -- Not fake lead
  AND (b.is_fake_lead = false OR b.is_fake_lead IS NULL)
  -- Not disqualified status
  AND LOWER(COALESCE(b.status, '')) NOT IN ('disqualified', 'fake', 'spam', 'duplicate')
ORDER BY
  -- 28-day buyers first
  b.ready_within_28_days DESC NULLS LAST,
  -- Then by call priority
  b.call_priority ASC NULLS LAST,
  -- Then by quality score
  b.ai_quality_score DESC NULLS LAST,
  -- Then by most recent
  b.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════
-- VIEW: v_leads_prioritized
-- Full pipeline by classification with call priority
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_leads_prioritized AS
SELECT
  b.id,
  b.full_name,
  b.first_name,
  b.last_name,
  b.email,
  b.phone,
  b.country,
  b.budget,
  b.budget_min,
  b.budget_max,
  b.bedrooms,
  b.location,
  b.area,
  b.timeline,
  b.source,
  b.campaign,
  b.status,
  b.payment_method,
  b.proof_of_funds,
  b.mortgage_status,
  b.uk_broker,
  b.uk_solicitor,
  b.purchase_purpose,
  b.ready_within_28_days,
  b.ai_quality_score,
  b.ai_intent_score,
  b.ai_confidence,
  b.ai_classification,
  b.ai_priority,
  b.ai_summary,
  b.ai_next_action,
  b.ai_risk_flags,
  b.ai_recommendations,
  b.call_priority,
  b.call_priority_reason,
  b.low_urgency_flag,
  b.is_fake_lead,
  b.assigned_to,
  b.assigned_user_name,
  b.company_id,
  b.notes,
  b.created_at,
  b.updated_at,
  b.last_contact,
  b.ai_scored_at,
  -- Computed fields
  EXTRACT(DAY FROM (NOW() - b.created_at)) as days_since_created,
  CASE
    WHEN b.last_contact IS NOT NULL THEN EXTRACT(DAY FROM (NOW() - b.last_contact))
    ELSE NULL
  END as days_since_contact,
  -- Classification rank for sorting
  CASE b.ai_classification
    WHEN 'Hot Lead' THEN 1
    WHEN 'Hot' THEN 1
    WHEN 'Qualified' THEN 2
    WHEN 'Warm-Qualified' THEN 2
    WHEN 'Needs Qualification' THEN 3
    WHEN 'Nurture' THEN 4
    WHEN 'Nurture-Premium' THEN 4
    WHEN 'Nurture-Standard' THEN 5
    WHEN 'Low Priority' THEN 6
    WHEN 'Cold' THEN 6
    WHEN 'Disqualified' THEN 7
    ELSE 8
  END as classification_rank,
  -- Response SLA
  CASE
    WHEN b.ready_within_28_days = true THEN 'Within 1 hour'
    WHEN b.call_priority = 1 THEN 'Within 2 hours'
    WHEN b.call_priority = 2 THEN 'Within 4 hours'
    WHEN b.call_priority = 3 THEN 'Within 24 hours'
    WHEN b.call_priority = 4 THEN 'Within 48 hours'
    ELSE 'Within 1 week'
  END as response_sla
FROM buyers b
WHERE
  -- Exclude fake leads
  (b.is_fake_lead = false OR b.is_fake_lead IS NULL)
ORDER BY
  -- 28-day buyers always first
  b.ready_within_28_days DESC NULLS LAST,
  -- Then by classification rank
  CASE b.ai_classification
    WHEN 'Hot Lead' THEN 1
    WHEN 'Hot' THEN 1
    WHEN 'Qualified' THEN 2
    WHEN 'Warm-Qualified' THEN 2
    WHEN 'Needs Qualification' THEN 3
    WHEN 'Nurture' THEN 4
    WHEN 'Nurture-Premium' THEN 4
    WHEN 'Nurture-Standard' THEN 5
    WHEN 'Low Priority' THEN 6
    WHEN 'Cold' THEN 6
    WHEN 'Disqualified' THEN 7
    ELSE 8
  END ASC,
  -- Then by call priority
  b.call_priority ASC NULLS LAST,
  -- Then by quality score
  b.ai_quality_score DESC NULLS LAST,
  -- Then by intent score
  b.ai_intent_score DESC NULLS LAST,
  -- Finally by most recent
  b.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════
-- VIEW: v_buyer_scoring_dashboard
-- Scoring distribution analytics
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_buyer_scoring_dashboard AS
SELECT
  -- Classification distribution
  b.ai_classification,
  COUNT(*) as lead_count,
  -- Score averages
  ROUND(AVG(b.ai_quality_score), 1) as avg_quality_score,
  ROUND(AVG(b.ai_intent_score), 1) as avg_intent_score,
  ROUND(AVG(b.ai_confidence * 10), 1) as avg_confidence_score,
  -- 28-day buyer count
  COUNT(*) FILTER (WHERE b.ready_within_28_days = true) as buyers_28_day,
  -- Payment method breakdown
  COUNT(*) FILTER (WHERE LOWER(b.payment_method) = 'cash') as cash_buyers,
  COUNT(*) FILTER (WHERE LOWER(b.payment_method) = 'mortgage') as mortgage_buyers,
  -- Purpose breakdown
  COUNT(*) FILTER (WHERE LOWER(b.purchase_purpose) = 'primary_residence') as primary_residence,
  COUNT(*) FILTER (WHERE LOWER(b.purchase_purpose) = 'dependent_studying') as dependent_studying,
  COUNT(*) FILTER (WHERE LOWER(b.purchase_purpose) = 'investment') as investment,
  COUNT(*) FILTER (WHERE LOWER(b.purchase_purpose) = 'holiday_home') as holiday_home,
  -- Call priority breakdown
  COUNT(*) FILTER (WHERE b.call_priority = 1) as priority_1_count,
  COUNT(*) FILTER (WHERE b.call_priority = 2) as priority_2_count,
  COUNT(*) FILTER (WHERE b.call_priority = 3) as priority_3_count,
  COUNT(*) FILTER (WHERE b.call_priority = 4) as priority_4_count,
  COUNT(*) FILTER (WHERE b.call_priority = 5) as priority_5_count,
  -- Time period
  COUNT(*) FILTER (WHERE b.created_at >= NOW() - INTERVAL '24 hours') as leads_last_24h,
  COUNT(*) FILTER (WHERE b.created_at >= NOW() - INTERVAL '7 days') as leads_last_7d,
  COUNT(*) FILTER (WHERE b.created_at >= NOW() - INTERVAL '14 days') as leads_last_14d,
  COUNT(*) FILTER (WHERE b.created_at >= NOW() - INTERVAL '30 days') as leads_last_30d
FROM buyers b
WHERE
  (b.is_fake_lead = false OR b.is_fake_lead IS NULL)
  AND LOWER(COALESCE(b.status, '')) NOT IN ('disqualified', 'fake', 'spam', 'duplicate')
GROUP BY b.ai_classification
ORDER BY
  CASE b.ai_classification
    WHEN 'Hot Lead' THEN 1
    WHEN 'Hot' THEN 1
    WHEN 'Qualified' THEN 2
    WHEN 'Warm-Qualified' THEN 2
    WHEN 'Needs Qualification' THEN 3
    WHEN 'Nurture' THEN 4
    WHEN 'Nurture-Premium' THEN 4
    WHEN 'Nurture-Standard' THEN 5
    WHEN 'Low Priority' THEN 6
    WHEN 'Cold' THEN 6
    ELSE 7
  END ASC;

-- ═══════════════════════════════════════════════════════════════════
-- VIEW: v_scoring_summary
-- Overall scoring system summary
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_scoring_summary AS
SELECT
  -- Total counts
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE b.is_fake_lead = false OR b.is_fake_lead IS NULL) as valid_leads,
  COUNT(*) FILTER (WHERE b.is_fake_lead = true) as fake_leads,

  -- Classification counts
  COUNT(*) FILTER (WHERE b.ai_classification IN ('Hot Lead', 'Hot')) as hot_leads,
  COUNT(*) FILTER (WHERE b.ai_classification IN ('Qualified', 'Warm-Qualified')) as qualified_leads,
  COUNT(*) FILTER (WHERE b.ai_classification = 'Needs Qualification') as needs_qualification,
  COUNT(*) FILTER (WHERE b.ai_classification IN ('Nurture', 'Nurture-Premium', 'Nurture-Standard')) as nurture_leads,
  COUNT(*) FILTER (WHERE b.ai_classification IN ('Low Priority', 'Cold')) as low_priority_leads,
  COUNT(*) FILTER (WHERE b.ai_classification = 'Disqualified') as disqualified_leads,

  -- 28-day buyers
  COUNT(*) FILTER (WHERE b.ready_within_28_days = true) as total_28_day_buyers,

  -- Score averages (excluding fakes)
  ROUND(AVG(b.ai_quality_score) FILTER (WHERE b.is_fake_lead = false OR b.is_fake_lead IS NULL), 1) as avg_quality,
  ROUND(AVG(b.ai_intent_score) FILTER (WHERE b.is_fake_lead = false OR b.is_fake_lead IS NULL), 1) as avg_intent,
  ROUND(AVG(b.ai_confidence * 10) FILTER (WHERE b.is_fake_lead = false OR b.is_fake_lead IS NULL), 1) as avg_confidence,

  -- Hot lead rate (percentage of valid leads that are hot)
  ROUND(
    (COUNT(*) FILTER (WHERE b.ai_classification IN ('Hot Lead', 'Hot') AND (b.is_fake_lead = false OR b.is_fake_lead IS NULL))::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE b.is_fake_lead = false OR b.is_fake_lead IS NULL), 0)) * 100,
    1
  ) as hot_lead_rate,

  -- 28-day buyer rate
  ROUND(
    (COUNT(*) FILTER (WHERE b.ready_within_28_days = true AND (b.is_fake_lead = false OR b.is_fake_lead IS NULL))::NUMERIC /
     NULLIF(COUNT(*) FILTER (WHERE b.is_fake_lead = false OR b.is_fake_lead IS NULL), 0)) * 100,
    1
  ) as buyer_28_day_rate

FROM buyers b;

-- ═══════════════════════════════════════════════════════════════════
-- GRANT PERMISSIONS ON VIEWS
-- ═══════════════════════════════════════════════════════════════════

-- Grant read access to authenticated users
GRANT SELECT ON v_hot_leads_today TO authenticated;
GRANT SELECT ON v_leads_prioritized TO authenticated;
GRANT SELECT ON v_buyer_scoring_dashboard TO authenticated;
GRANT SELECT ON v_scoring_summary TO authenticated;

-- Grant read access for anonymous users (for public dashboards if needed)
GRANT SELECT ON v_buyer_scoring_dashboard TO anon;
GRANT SELECT ON v_scoring_summary TO anon;
