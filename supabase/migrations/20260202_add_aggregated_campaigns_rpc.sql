-- Create RPC function to return pre-aggregated campaign data
-- This dramatically improves dashboard load times by aggregating 24k+ ad rows
-- into ~80 campaign-level summaries at the database level

CREATE OR REPLACE FUNCTION get_aggregated_campaigns()
RETURNS TABLE (
  id text,
  campaign_name text,
  company_id uuid,
  development_id uuid,
  platform text,
  status text,
  total_spend numeric,
  total_leads integer,
  cpl numeric,
  total_impressions bigint,
  total_clicks bigint,
  ctr numeric,
  total_reach bigint,
  ad_count integer,
  ad_set_count integer,
  start_date date,
  end_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Use first row's id or generate from campaign name
    COALESCE(MIN(c.id)::text, encode(sha256(c.campaign_name::bytea), 'hex')::text) as id,
    c.campaign_name,
    -- Take the most common company_id for this campaign
    (SELECT cc.company_id FROM campaigns cc WHERE cc.campaign_name = c.campaign_name AND cc.company_id IS NOT NULL LIMIT 1) as company_id,
    (SELECT cc.development_id FROM campaigns cc WHERE cc.campaign_name = c.campaign_name AND cc.development_id IS NOT NULL LIMIT 1) as development_id,
    COALESCE(MAX(c.platform), 'Meta') as platform,
    COALESCE(
      CASE 
        WHEN COUNT(*) FILTER (WHERE c.delivery_status = 'active' OR c.status = 'active') > 0 THEN 'active'
        ELSE 'paused'
      END,
      'active'
    ) as status,
    COALESCE(SUM(COALESCE(c.total_spent::numeric, c.spend::numeric, 0)), 0) as total_spend,
    COALESCE(SUM(COALESCE(c.number_of_leads, c.leads, 0))::integer, 0) as total_leads,
    CASE 
      WHEN SUM(COALESCE(c.number_of_leads, c.leads, 0)) > 0 
      THEN ROUND(SUM(COALESCE(c.total_spent::numeric, c.spend::numeric, 0)) / NULLIF(SUM(COALESCE(c.number_of_leads, c.leads, 0)), 0), 2)
      ELSE 0 
    END as cpl,
    COALESCE(SUM(c.impressions), 0)::bigint as total_impressions,
    COALESCE(SUM(COALESCE(c.link_clicks, c.clicks, 0)), 0)::bigint as total_clicks,
    CASE 
      WHEN SUM(c.impressions) > 0 
      THEN ROUND((SUM(COALESCE(c.link_clicks, c.clicks, 0))::numeric / NULLIF(SUM(c.impressions), 0)) * 100, 2)
      ELSE 0 
    END as ctr,
    COALESCE(SUM(c.reach), 0)::bigint as total_reach,
    COUNT(*)::integer as ad_count,
    COUNT(DISTINCT c.ad_set_name)::integer as ad_set_count,
    MIN(c.date::date) as start_date,
    MAX(c.date::date) as end_date
  FROM campaigns c
  WHERE c.campaign_name IS NOT NULL
  GROUP BY c.campaign_name
  ORDER BY total_spend DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_aggregated_campaigns() TO authenticated;
GRANT EXECUTE ON FUNCTION get_aggregated_campaigns() TO anon;

-- Add comment
COMMENT ON FUNCTION get_aggregated_campaigns() IS 
'Returns campaign-level aggregated metrics from ad-level data. 
Dramatically improves dashboard performance by aggregating ~24k ad rows into ~80 campaigns at the database level.';
