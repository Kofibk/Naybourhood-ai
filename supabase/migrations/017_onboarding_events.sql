-- Onboarding events table for tracking user drop-off and flow analytics
CREATE TABLE IF NOT EXISTS onboarding_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id),
  event_type text NOT NULL,
  step_number integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- Only Naybourhood admins (internal team) can read all events for analytics
CREATE POLICY "Admins can read all onboarding events" ON onboarding_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_internal_team = true)
  );

-- Users can insert their own events
CREATE POLICY "Users can insert own events" ON onboarding_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Index for efficient analytics queries
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON onboarding_events (event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user ON onboarding_events (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created ON onboarding_events (created_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_step ON onboarding_events (step_number) WHERE step_number IS NOT NULL;
