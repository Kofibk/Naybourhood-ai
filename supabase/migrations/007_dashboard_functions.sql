-- Dashboard optimization functions for sub-second load times
-- These functions run in PostgreSQL and return only the data needed

-- =====================================================
-- Function: get_buyer_dashboard_stats
-- Returns aggregated stats for developer/agent dashboards
-- =====================================================
CREATE OR REPLACE FUNCTION get_buyer_dashboard_stats(p_company_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_leads', COUNT(*),
    'hot_leads', COUNT(*) FILTER (WHERE ai_classification = 'Hot Lead' OR ai_quality_score >= 70),
    'qualified', COUNT(*) FILTER (WHERE ai_classification = 'Qualified' OR (ai_quality_score >= 50 AND ai_quality_score < 70)),
    'needs_qualification', COUNT(*) FILTER (WHERE ai_classification = 'Needs Qualification' OR ai_quality_score IS NULL),
    'nurture', COUNT(*) FILTER (WHERE ai_classification = 'Nurture'),
    'low_priority', COUNT(*) FILTER (WHERE ai_classification = 'Low Priority' OR ai_quality_score < 30),
    'avg_score', COALESCE(ROUND(AVG(ai_quality_score)::numeric, 0), 0),
    'contact_pending', COUNT(*) FILTER (WHERE status = 'Contact Pending'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'In Progress'),
    'qualified_status', COUNT(*) FILTER (WHERE status = 'Qualified'),
    'viewing_booked', COUNT(*) FILTER (WHERE viewing_booked = true),
    'converted', COUNT(*) FILTER (WHERE status = 'Converted'),
    'last_24h', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'),
    'last_7d', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    'last_30d', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
  ) INTO result
  FROM buyers
  WHERE (p_company_id IS NULL OR company_id = p_company_id)
    AND (is_archived IS NULL OR is_archived = false)
    AND (is_duplicate IS NULL OR is_duplicate = false)
    AND (is_fake IS NULL OR is_fake = false);

  RETURN result;
END;
$$;

-- =====================================================
-- Function: get_borrower_dashboard_stats
-- Returns aggregated stats for broker dashboards
-- =====================================================
CREATE OR REPLACE FUNCTION get_borrower_dashboard_stats(p_company_id UUID DEFAULT NULL, p_company_name TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_leads', COUNT(*),
    'contact_pending', COUNT(*) FILTER (WHERE status = 'Contact Pending'),
    'follow_up', COUNT(*) FILTER (WHERE status = 'Follow-up' OR status = 'Follow Up'),
    'awaiting_docs', COUNT(*) FILTER (WHERE status = 'Awaiting Documents'),
    'completed', COUNT(*) FILTER (WHERE status = 'Completed' OR status = 'Approved'),
    'not_proceeding', COUNT(*) FILTER (WHERE status = 'Not Proceeding'),
    'total_loan_amount', COALESCE(SUM(loan_amount), 0),
    'avg_loan_amount', COALESCE(ROUND(AVG(loan_amount)::numeric, 0), 0),
    'last_24h', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'),
    'last_7d', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    'last_30d', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
  ) INTO result
  FROM borrowers
  WHERE (
    (p_company_id IS NULL OR company_id = p_company_id)
    OR (p_company_name IS NOT NULL AND LOWER(company) = LOWER(p_company_name))
  )
  AND (is_archived IS NULL OR is_archived = false)
  AND (is_duplicate IS NULL OR is_duplicate = false)
  AND (is_fake IS NULL OR is_fake = false);

  RETURN result;
END;
$$;

-- =====================================================
-- Function: get_campaign_stats
-- Returns aggregated campaign metrics
-- =====================================================
CREATE OR REPLACE FUNCTION get_campaign_stats(p_company_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_campaigns', COUNT(DISTINCT campaign_name),
    'total_spend', COALESCE(SUM(spend), 0),
    'total_leads', COALESCE(SUM(leads), 0),
    'total_impressions', COALESCE(SUM(impressions), 0),
    'total_clicks', COALESCE(SUM(clicks), 0),
    'avg_cpl', CASE
      WHEN SUM(leads) > 0 THEN ROUND((SUM(spend) / SUM(leads))::numeric, 2)
      ELSE 0
    END,
    'avg_ctr', CASE
      WHEN SUM(impressions) > 0 THEN ROUND((SUM(clicks)::numeric / SUM(impressions) * 100), 2)
      ELSE 0
    END
  ) INTO result
  FROM campaigns
  WHERE p_company_id IS NULL OR company_id = p_company_id;

  RETURN result;
END;
$$;

-- =====================================================
-- Function: get_recent_buyers
-- Returns recent buyers with only needed columns
-- =====================================================
CREATE OR REPLACE FUNCTION get_recent_buyers(
  p_company_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  ai_quality_score INT,
  ai_classification TEXT,
  ai_summary TEXT,
  budget_range TEXT,
  preferred_bedrooms INT,
  preferred_location TEXT,
  timeline_to_purchase TEXT,
  development_name TEXT,
  source_platform TEXT,
  company_id UUID,
  created_at TIMESTAMPTZ,
  date_added TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    COALESCE(b.full_name, CONCAT(b.first_name, ' ', b.last_name)) as full_name,
    b.first_name,
    b.last_name,
    b.email,
    b.phone,
    b.status,
    b.ai_quality_score,
    b.ai_classification,
    b.ai_summary,
    b.budget_range,
    b.preferred_bedrooms,
    b.preferred_location,
    b.timeline_to_purchase,
    b.development_name,
    b.source_platform,
    b.company_id,
    b.created_at,
    b.date_added
  FROM buyers b
  WHERE (p_company_id IS NULL OR b.company_id = p_company_id)
    AND (b.is_archived IS NULL OR b.is_archived = false)
    AND (b.is_duplicate IS NULL OR b.is_duplicate = false)
    AND (b.is_fake IS NULL OR b.is_fake = false)
  ORDER BY b.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- Function: get_recent_borrowers
-- Returns recent borrowers with only needed columns
-- =====================================================
CREATE OR REPLACE FUNCTION get_recent_borrowers(
  p_company_id UUID DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  finance_type TEXT,
  loan_amount NUMERIC,
  required_by_date DATE,
  company_id UUID,
  company TEXT,
  date_added TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    COALESCE(b.full_name, CONCAT(b.first_name, ' ', b.last_name)) as full_name,
    b.first_name,
    b.last_name,
    b.email,
    b.phone,
    b.status,
    b.finance_type,
    b.loan_amount,
    b.required_by_date,
    b.company_id,
    b.company,
    b.date_added,
    b.created_at
  FROM borrowers b
  WHERE (
    (p_company_id IS NULL OR b.company_id = p_company_id)
    OR (p_company_name IS NOT NULL AND LOWER(b.company) = LOWER(p_company_name))
  )
  AND (b.is_archived IS NULL OR b.is_archived = false)
  AND (b.is_duplicate IS NULL OR b.is_duplicate = false)
  AND (b.is_fake IS NULL OR b.is_fake = false)
  ORDER BY COALESCE(b.date_added, b.created_at) DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- Function: get_top_campaigns
-- Returns top performing campaigns
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_campaigns(
  p_company_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  campaign_name TEXT,
  development_name TEXT,
  spend NUMERIC,
  leads INT,
  cpl NUMERIC,
  impressions INT,
  clicks INT,
  ctr NUMERIC,
  company_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.campaign_name,
    c.development_name,
    COALESCE(SUM(c.spend), 0) as spend,
    COALESCE(SUM(c.leads), 0)::INT as leads,
    CASE WHEN SUM(c.leads) > 0 THEN ROUND((SUM(c.spend) / SUM(c.leads))::numeric, 2) ELSE 0 END as cpl,
    COALESCE(SUM(c.impressions), 0)::INT as impressions,
    COALESCE(SUM(c.clicks), 0)::INT as clicks,
    CASE WHEN SUM(c.impressions) > 0 THEN ROUND((SUM(c.clicks)::numeric / SUM(c.impressions) * 100), 2) ELSE 0 END as ctr,
    c.company_id
  FROM campaigns c
  WHERE p_company_id IS NULL OR c.company_id = p_company_id
  GROUP BY c.campaign_name, c.development_name, c.company_id
  ORDER BY SUM(c.leads) DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_buyer_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_borrower_dashboard_stats(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_buyers(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_borrowers(UUID, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_campaigns(UUID, INT) TO authenticated;

-- Also grant to anon for Quick Access users
GRANT EXECUTE ON FUNCTION get_buyer_dashboard_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_borrower_dashboard_stats(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_campaign_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_recent_buyers(UUID, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_recent_borrowers(UUID, TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION get_top_campaigns(UUID, INT) TO anon;
