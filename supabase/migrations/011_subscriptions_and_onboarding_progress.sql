-- Migration: Self-Service Billing - Subscriptions & Onboarding Progress
-- Creates subscriptions table and onboarding_progress table with RLS

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('starter', 'growth', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id
  ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see subscriptions for their own company
CREATE POLICY "Users can view own company subscription"
  ON public.subscriptions
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS: Only service role can insert/update subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- ONBOARDING PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step)
);

-- Indexes for onboarding_progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id
  ON public.onboarding_progress(user_id);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own onboarding progress
CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FOR SUBSCRIPTIONS
-- ============================================================================

-- Reuse existing handle_updated_at function if it exists
-- (already defined in schema.sql)
