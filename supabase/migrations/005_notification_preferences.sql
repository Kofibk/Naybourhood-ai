-- Add notification_preferences JSONB column to profiles
-- This stores user notification settings as a flexible JSON object

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "newBuyerAlerts": true,
  "messageNotifications": true,
  "hotLeadAlerts": true,
  "followUpReminders": true,
  "priorityActions": true,
  "emailDigest": "daily",
  "pushEnabled": false
}'::jsonb;

-- Add comment explaining the schema
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification preferences: newBuyerAlerts, messageNotifications, hotLeadAlerts, followUpReminders, priorityActions (all boolean), emailDigest (none/daily/weekly), pushEnabled (boolean)';

-- Create index for faster querying of notification preferences
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences
ON public.profiles USING gin(notification_preferences);
