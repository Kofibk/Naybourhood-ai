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
    'viewing_booked', COUNT(*) FILTER (WHERE viewing_booked = true),
    'converted', COUNT(*) FILTER (WHERE status = 'Converted'),
    'last_24h', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'),
    'last_7d', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    'last_30d', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
  ) INTO result
  FROM buyers
  WHERE (p_company_id IS NULL OR company_id = p_company_id);
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
  WHERE p_company_id IS NULL OR company_id = p_company_id;
  RETURN result;
END;
$$;

-- =====================================================
-- Function: get_campaign_stats
-- Returns aggregated campaign metrics
-- Uses correct column names: total_spent, number_of_leads
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
    'total_spend', COALESCE(SUM(total_spent), 0),
    'total_leads', COALESCE(SUM(number_of_leads), 0),
    'total_impressions', COALESCE(SUM(impressions), 0),
    'total_clicks', COALESCE(SUM(clicks), 0),
    'avg_cpl', CASE WHEN SUM(number_of_leads) > 0 THEN ROUND((SUM(total_spent) / SUM(number_of_leads))::numeric, 2) ELSE 0 END,
    'avg_ctr', CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(clicks)::numeric / SUM(impressions) * 100), 2) ELSE 0 END
  ) INTO result
  FROM campaigns
  WHERE p_company_id IS NULL OR company_id = p_company_id;
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_buyer_dashboard_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_borrower_dashboard_stats(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_campaign_stats(UUID) TO authenticated, anon;
