-- Migration: Add company field to buyers and finance_leads tables
-- This field tracks which company (Million Pound Homes or Tudor Financial) the lead belongs to

-- Add company column to buyers table
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS company TEXT;

-- Add company column to finance_leads table
ALTER TABLE public.finance_leads
ADD COLUMN IF NOT EXISTS company TEXT;

-- Set default company for existing property leads (buyers) to "Million Pound Homes"
UPDATE public.buyers
SET company = 'Million Pound Homes'
WHERE company IS NULL;

-- Set default company for existing finance leads to "Tudor Financial"
UPDATE public.finance_leads
SET company = 'Tudor Financial'
WHERE company IS NULL;

-- Add check constraint to ensure only valid company values
ALTER TABLE public.buyers
ADD CONSTRAINT buyers_company_check
CHECK (company IN ('Million Pound Homes', 'Tudor Financial'));

ALTER TABLE public.finance_leads
ADD CONSTRAINT finance_leads_company_check
CHECK (company IN ('Million Pound Homes', 'Tudor Financial'));

-- Create index for company field for faster filtering
CREATE INDEX IF NOT EXISTS idx_buyers_company ON public.buyers(company);
CREATE INDEX IF NOT EXISTS idx_finance_leads_company ON public.finance_leads(company);

-- Comment on columns
COMMENT ON COLUMN public.buyers.company IS 'Company that owns this lead: Million Pound Homes or Tudor Financial';
COMMENT ON COLUMN public.finance_leads.company IS 'Company that owns this lead: Million Pound Homes or Tudor Financial';
