-- ═══════════════════════════════════════════════════════════════════
-- LEAD IMPORT SQL SCRIPT
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════════

-- OPTION 1: REPLACE MODE (Delete all existing, insert new)
-- ⚠️ WARNING: This will DELETE all existing leads!
-- Uncomment the line below to enable:
-- DELETE FROM buyers WHERE true;


-- OPTION 2: Check current lead count before import
SELECT COUNT(*) as current_lead_count FROM buyers;


-- ═══════════════════════════════════════════════════════════════════
-- IMPORT INSTRUCTIONS
-- ═══════════════════════════════════════════════════════════════════
--
-- Since SQL can't directly read JSON files, use one of these methods:
--
-- METHOD A: Use the API endpoint (Recommended)
-- 1. Go to: /admin/settings or call the API directly
-- 2. POST to /api/import/leads with body: { "mode": "upsert" }
--
-- METHOD B: Use Supabase Table Editor
-- 1. Go to Supabase Dashboard > Table Editor > buyers
-- 2. Click "Insert" > "Import data from CSV"
-- 3. Convert your JSON to CSV first (use online converter)
-- 4. Upload and map columns
--
-- METHOD C: Use Supabase CLI
-- Run: supabase db import --file leads_transformed.json --table buyers
--
-- ═══════════════════════════════════════════════════════════════════


-- AFTER IMPORT: Rescore all leads to update AI classifications
-- Run this after importing leads:

-- UPDATE buyers SET
--   ai_scored_at = NULL
-- WHERE ai_scored_at IS NULL OR ai_quality_score IS NULL;

-- Then trigger rescoring via the app or API


-- ═══════════════════════════════════════════════════════════════════
-- VERIFY IMPORT
-- ═══════════════════════════════════════════════════════════════════

-- Check lead count by status
SELECT
  status,
  COUNT(*) as count
FROM buyers
GROUP BY status
ORDER BY count DESC;

-- Check lead count by classification
SELECT
  ai_classification,
  COUNT(*) as count,
  ROUND(AVG(ai_quality_score), 1) as avg_quality,
  ROUND(AVG(ai_intent_score), 1) as avg_intent
FROM buyers
GROUP BY ai_classification
ORDER BY count DESC;

-- Check data completeness
SELECT
  COUNT(*) as total_leads,
  COUNT(email) as with_email,
  COUNT(phone) as with_phone,
  COUNT(budget_min) as with_budget,
  COUNT(timeline) as with_timeline,
  COUNT(ai_quality_score) as scored
FROM buyers;


-- ═══════════════════════════════════════════════════════════════════
-- CLEANUP DUPLICATES (if needed)
-- ═══════════════════════════════════════════════════════════════════

-- Find duplicates by email
-- SELECT email, COUNT(*) as count
-- FROM buyers
-- WHERE email IS NOT NULL
-- GROUP BY email
-- HAVING COUNT(*) > 1;

-- Remove duplicates (keep most recent)
-- DELETE FROM buyers a
-- USING buyers b
-- WHERE a.email = b.email
-- AND a.created_at < b.created_at;
