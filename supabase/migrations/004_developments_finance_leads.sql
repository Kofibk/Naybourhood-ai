-- Migration: Add developments and finance_leads tables
-- Also update profiles role constraint to include super_admin

-- Update profiles role constraint to include super_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'developer', 'agent', 'broker'));

-- Add is_internal column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'is_internal'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_internal boolean DEFAULT false;
  END IF;
END $$;

-- Add phone, job_title, bio columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'job_title') THEN
    ALTER TABLE public.profiles ADD COLUMN job_title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status text CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_confirmed') THEN
    ALTER TABLE public.profiles ADD COLUMN email_confirmed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invited_at') THEN
    ALTER TABLE public.profiles ADD COLUMN invited_at timestamp with time zone;
  END IF;
END $$;

-- Developments table
CREATE TABLE IF NOT EXISTS public.developments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  address text,
  developer text,
  company_id uuid REFERENCES public.companies(id),
  status text CHECK (status IN ('Planning', 'Pre-Launch', 'Launching', 'Selling', 'Completed', 'Sold Out')) DEFAULT 'Planning',
  total_units integer DEFAULT 0,
  available_units integer DEFAULT 0,
  price_from text,
  price_to text,
  completion_date date,
  description text,
  image_url text,
  features text[],
  -- PDF and document attachments
  brochure_url text,
  floor_plan_url text,
  price_list_url text,
  attachments jsonb DEFAULT '[]'::jsonb,
  -- Stats (calculated/denormalized)
  total_leads integer DEFAULT 0,
  ad_spend numeric DEFAULT 0,
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Finance leads table (for broker/mortgage leads)
CREATE TABLE IF NOT EXISTS public.finance_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Contact info
  full_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  -- Finance details
  finance_type text CHECK (finance_type IN ('Mortgage', 'Buy-to-Let', 'Commercial', 'Bridging', 'Development Finance', 'Other')),
  loan_amount numeric,
  loan_amount_display text,
  required_by_date date,
  message text,
  -- Status and assignment
  status text CHECK (status IN ('New', 'Contacted', 'Qualified', 'In Progress', 'Approved', 'Declined', 'Completed')) DEFAULT 'New',
  notes text,
  assigned_agent uuid REFERENCES public.profiles(id),
  company_id uuid REFERENCES public.companies(id),
  -- Timestamps
  date_added timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for developments
CREATE POLICY "Authenticated users can view developments" ON public.developments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert developments" ON public.developments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update developments" ON public.developments
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete developments" ON public.developments
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for finance_leads
CREATE POLICY "Authenticated users can view finance_leads" ON public.finance_leads
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert finance_leads" ON public.finance_leads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update finance_leads" ON public.finance_leads
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete finance_leads" ON public.finance_leads
  FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes for developments
CREATE INDEX IF NOT EXISTS idx_developments_company_id ON public.developments(company_id);
CREATE INDEX IF NOT EXISTS idx_developments_status ON public.developments(status);
CREATE INDEX IF NOT EXISTS idx_developments_name ON public.developments(name);

-- Indexes for finance_leads
CREATE INDEX IF NOT EXISTS idx_finance_leads_company_id ON public.finance_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_finance_leads_status ON public.finance_leads(status);
CREATE INDEX IF NOT EXISTS idx_finance_leads_assigned_agent ON public.finance_leads(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_finance_leads_created_at ON public.finance_leads(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER on_developments_updated BEFORE UPDATE ON public.developments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_finance_leads_updated BEFORE UPDATE ON public.finance_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update handle_new_user function to support super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_internal)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    CASE
      WHEN new.email = 'kofi@naybourhood.ai' THEN 'super_admin'
      WHEN new.email LIKE '%@naybourhood.ai' THEN 'admin'
      ELSE 'developer'
    END,
    CASE
      WHEN new.email LIKE '%@naybourhood.ai' THEN true
      ELSE false
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
