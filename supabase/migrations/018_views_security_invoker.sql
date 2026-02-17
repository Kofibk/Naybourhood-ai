-- Migration: Switch all views from SECURITY DEFINER to SECURITY INVOKER
--
-- Context: The frontend now correctly passes authenticated Supabase sessions
-- everywhere. Views should use SECURITY INVOKER so that RLS policies apply
-- through them, enforcing multi-tenant data isolation.
--
-- Prerequisites: Tasks 1-5 must be complete — all API routes and pages must
-- pass authenticated sessions before running this migration.
--
-- Effect: Each view query will execute with the calling user's permissions,
-- meaning RLS company-scoped policies will filter data automatically.

ALTER VIEW v_buyer_scoring_dashboard SET (security_invoker = true);
ALTER VIEW v_buyer_scoring_dashboard_v2 SET (security_invoker = true);
ALTER VIEW v_companies_with_stats SET (security_invoker = true);
ALTER VIEW v_company_dashboard SET (security_invoker = true);
ALTER VIEW v_company_lead_stats SET (security_invoker = true);
ALTER VIEW v_company_scoring_stats SET (security_invoker = true);
ALTER VIEW v_crm_export_ready SET (security_invoker = true);
ALTER VIEW v_development_lead_stats SET (security_invoker = true);
ALTER VIEW v_hot_leads_by_company SET (security_invoker = true);
ALTER VIEW v_hot_leads_dashboard SET (security_invoker = true);
ALTER VIEW v_hot_leads_today SET (security_invoker = true);
ALTER VIEW v_hot_leads_with_scores SET (security_invoker = true);
ALTER VIEW v_lead_recommendations SET (security_invoker = true);
ALTER VIEW v_lead_trends_daily SET (security_invoker = true);
ALTER VIEW v_leads_by_classification SET (security_invoker = true);
ALTER VIEW v_leads_for_crm SET (security_invoker = true);
ALTER VIEW v_leads_pending_crm_push SET (security_invoker = true);
ALTER VIEW v_leads_prioritized SET (security_invoker = true);
ALTER VIEW v_score_trends SET (security_invoker = true);
