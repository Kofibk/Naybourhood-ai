-- ═══════════════════════════════════════════════════════════════════
-- DIRECT LEAD IMPORT - Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- First, update the status CHECK constraint to include all valid statuses
-- (Only run this once if you get constraint violations)

ALTER TABLE public.buyers DROP CONSTRAINT IF EXISTS buyers_status_check;

ALTER TABLE public.buyers ADD CONSTRAINT buyers_status_check
CHECK (status IN (
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Duplicate',
  'New',
  'Contacted',
  'Qualified',
  'Offer Made',
  'Lost',
  'Documentation'
));

-- Check current lead count
SELECT COUNT(*) as current_lead_count FROM public.buyers;

-- ═══════════════════════════════════════════════════════════════════
-- OPTION A: If you want to use the API import after deploying the fix,
-- go to your deployed app: /admin/settings and click "Import Leads"
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- OPTION B: Direct SQL insert for a few test leads
-- Copy-paste and edit this pattern for bulk imports
-- ═══════════════════════════════════════════════════════════════════

-- Test insert for first lead
INSERT INTO public.buyers (
  full_name, first_name, last_name,
  email, phone, country,
  budget_range, budget_min, budget_max,
  preferred_bedrooms, preferred_location,
  timeline_to_purchase, purchase_purpose, ready_within_28_days,
  source_platform, source_campaign, development_name, enquiry_type,
  status, payment_method, proof_of_funds, mortgage_status,
  uk_broker, uk_solicitor, notes,
  viewing_intent_confirmed, viewing_booked,
  replied, stop_agent_communication, connect_to_broker,
  date_added
) VALUES (
  'Botshelo Jacobs', 'Botshelo', 'Jacobs',
  'botshelojacobs@gmail.com', '+27846192962', 'South Africa',
  '£400K - £500K', 400000, 500000,
  2, 'London',
  '6-12 months', 'Investment', false,
  'ig', 'MPH+-+B2C+Campaign+2M++Properties', 'General Search', 'Form',
  'Contact Pending', 'Mortgage', false, 'Not Started',
  true, false, 'Botshelo Jacobs is the Managing Director of Reneilwe Consulting and Planners, based in Johannesburg, South Africa.',
  false, false,
  false, false, true,
  '2026-01-06T13:20:00Z'
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  budget_range = EXCLUDED.budget_range,
  budget_min = EXCLUDED.budget_min,
  budget_max = EXCLUDED.budget_max,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════
-- VERIFY: Check that leads were imported
-- ═══════════════════════════════════════════════════════════════════

SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'Contact Pending' THEN 1 END) as contact_pending,
  COUNT(CASE WHEN status = 'Follow Up' THEN 1 END) as follow_up,
  COUNT(CASE WHEN status = 'Viewing Booked' THEN 1 END) as viewing_booked,
  COUNT(DISTINCT source_platform) as unique_sources,
  MIN(date_added) as earliest_lead,
  MAX(date_added) as latest_lead
FROM public.buyers;
