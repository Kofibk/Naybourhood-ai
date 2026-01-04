-- Migration: Add missing columns to match frontend expectations
-- Run this in your Supabase SQL Editor

-- =============================================
-- BUYERS TABLE - Add missing columns
-- =============================================

-- Add first_name and last_name (can be derived from full_name)
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS last_name text;

-- Add payment and mortgage fields
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS mortgage_status text;

-- Add area as alias for location flexibility
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS area text;

-- Add assignment fields
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id);
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS assigned_user text;
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS assigned_user_name text;
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

-- =============================================
-- CAMPAIGNS TABLE - Add missing columns
-- =============================================

-- Add development field (separate from client)
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS development text;

-- =============================================
-- COMPANIES TABLE - Add missing columns
-- =============================================

-- Add website
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website text;

-- Add billing/subscription fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_status text
  CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'cancelled', 'none'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_price numeric;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_cycle text
  CHECK (billing_cycle IN ('monthly', 'annual'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS next_billing_date date;

-- Add Stripe integration fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- =============================================
-- PROFILES TABLE - Add missing columns
-- =============================================

-- Add avatar and activity tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active timestamp with time zone;

-- =============================================
-- HELPER: Populate first_name/last_name from full_name
-- =============================================

-- Update existing records to split full_name into first_name and last_name
UPDATE public.buyers
SET
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name = COALESCE(last_name,
    CASE
      WHEN position(' ' in full_name) > 0
      THEN substring(full_name from position(' ' in full_name) + 1)
      ELSE NULL
    END
  )
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- =============================================
-- CREATE INDEXES for new columns
-- =============================================

CREATE INDEX IF NOT EXISTS idx_buyers_assigned_to ON public.buyers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_campaigns_development ON public.campaigns(development);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id ON public.companies(stripe_customer_id);

-- =============================================
-- Done! Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'buyers';
-- =============================================
