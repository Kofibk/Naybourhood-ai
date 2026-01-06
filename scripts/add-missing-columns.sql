-- ═══════════════════════════════════════════════════════════════════
-- ADD MISSING COLUMNS TO BUYERS TABLE
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add full_name column (combines first_name + last_name for display)
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS full_name text;

-- 2. Add budget numeric fields for scoring
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS budget_min numeric;

ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS budget_max numeric;

-- 3. Add notes field for lead notes
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS notes text;

-- 4. Add financial qualification fields
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS proof_of_funds boolean DEFAULT false;

ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS mortgage_status text;

ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS uk_broker boolean DEFAULT false;

ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS uk_solicitor boolean DEFAULT false;

-- 5. Add purpose field (mapped from purchase_purpose for compatibility)
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS purpose text;

-- 6. Populate full_name from first_name + last_name where empty
UPDATE public.buyers
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '';

-- 7. Parse budget_range to extract budget_min and budget_max
-- Format examples: "£400K - £500K", "£1 - £2 Million"
UPDATE public.buyers
SET
  budget_min = CASE
    WHEN budget_range ~ '£([0-9.]+)K' THEN
      (REGEXP_REPLACE(SPLIT_PART(budget_range, '-', 1), '[^0-9.]', '', 'g')::numeric * 1000)
    WHEN budget_range ~ '£([0-9.]+) ?Million' THEN
      (REGEXP_REPLACE(SPLIT_PART(budget_range, '-', 1), '[^0-9.]', '', 'g')::numeric * 1000000)
    WHEN budget_range ~ '£([0-9,]+)' THEN
      REPLACE(REGEXP_REPLACE(SPLIT_PART(budget_range, '-', 1), '[^0-9,]', '', 'g'), ',', '')::numeric
    ELSE NULL
  END,
  budget_max = CASE
    WHEN budget_range ~ '£([0-9.]+)K' THEN
      (REGEXP_REPLACE(SPLIT_PART(budget_range, '-', 2), '[^0-9.]', '', 'g')::numeric * 1000)
    WHEN budget_range ~ '£([0-9.]+) ?Million' THEN
      (REGEXP_REPLACE(SPLIT_PART(budget_range, '-', 2), '[^0-9.]', '', 'g')::numeric * 1000000)
    WHEN budget_range ~ '£([0-9,]+)' THEN
      REPLACE(REGEXP_REPLACE(SPLIT_PART(budget_range, '-', 2), '[^0-9,]', '', 'g'), ',', '')::numeric
    ELSE NULL
  END
WHERE budget_min IS NULL AND budget_range IS NOT NULL;

-- 8. Copy purchase_purpose to purpose for compatibility
UPDATE public.buyers
SET purpose = purchase_purpose::text
WHERE purpose IS NULL AND purchase_purpose IS NOT NULL;

-- 9. Verify the changes
SELECT
  COUNT(*) as total_leads,
  COUNT(full_name) as with_full_name,
  COUNT(budget_min) as with_budget_min,
  COUNT(budget_max) as with_budget_max,
  COUNT(notes) as with_notes,
  COUNT(CASE WHEN proof_of_funds = true THEN 1 END) as with_proof_of_funds
FROM public.buyers;
