-- Migration: Link campaigns to developments via foreign key
-- Previously campaigns only had a TEXT 'development' field with the name
-- This adds a proper development_id foreign key for referential integrity

-- Add development_id column to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS development_id uuid REFERENCES public.developments(id);

-- Migrate existing data: match development names to IDs
UPDATE public.campaigns c
SET development_id = d.id
FROM public.developments d
WHERE c.development IS NOT NULL
  AND c.development_id IS NULL
  AND LOWER(TRIM(c.development)) = LOWER(TRIM(d.name));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_development_id ON public.campaigns(development_id);

-- Add comment explaining the relationship
COMMENT ON COLUMN public.campaigns.development_id IS 'Foreign key to developments table - the development this campaign is marketing';
COMMENT ON COLUMN public.campaigns.development IS 'Legacy text field with development name - kept for backwards compatibility, prefer development_id';
