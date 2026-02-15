-- Waitlist table for early access signups from the landing page
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  role text CHECK (role IN ('developer', 'agent', 'broker', 'marketing_agency', 'financial_advisor', 'other')),
  monthly_lead_volume text,
  biggest_challenge text,
  would_pay boolean,
  current_spend text,
  referral_source text,
  status text CHECK (status IN ('new', 'contacted', 'converted', 'declined')) DEFAULT 'new',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Public form: anyone can insert
CREATE POLICY "Anyone can submit waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated users can view waitlist" ON public.waitlist
  FOR SELECT USING (auth.role() = 'authenticated');

-- Index for duplicate checking
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);

-- Updated_at trigger
CREATE TRIGGER on_waitlist_updated BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
