-- Add checklist_progress jsonb column to user_profiles
-- Tracks post-onboarding checklist completion state
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS checklist_progress jsonb DEFAULT '{}';

-- Add index for querying dismissed state
CREATE INDEX IF NOT EXISTS idx_user_profiles_checklist_dismissed
  ON user_profiles ((checklist_progress->>'dismissed'))
  WHERE checklist_progress->>'dismissed' = 'true';
