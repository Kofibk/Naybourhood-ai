-- Fix RLS policies to allow anon key read access
-- This allows the app to fetch data without requiring a Supabase session
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view buyers" ON public.buyers;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;

-- Create new policies that allow public read access (anon key)
CREATE POLICY "Allow public read access to buyers"
ON public.buyers FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to campaigns"
ON public.campaigns FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to companies"
ON public.companies FOR SELECT
USING (true);

-- Keep write operations restricted to authenticated users
-- (These may already exist, so use IF NOT EXISTS pattern)
DO $$
BEGIN
  -- Buyers insert
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert buyers') THEN
    CREATE POLICY "Authenticated users can insert buyers"
    ON public.buyers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Buyers update
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update buyers') THEN
    CREATE POLICY "Authenticated users can update buyers"
    ON public.buyers FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  -- Buyers delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete buyers') THEN
    CREATE POLICY "Authenticated users can delete buyers"
    ON public.buyers FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Also fix developments and finance_leads tables
DROP POLICY IF EXISTS "Authenticated users can view developments" ON public.developments;
DROP POLICY IF EXISTS "Authenticated users can view finance_leads" ON public.finance_leads;

CREATE POLICY "Allow public read access to developments"
ON public.developments FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to finance_leads"
ON public.finance_leads FOR SELECT
USING (true);
