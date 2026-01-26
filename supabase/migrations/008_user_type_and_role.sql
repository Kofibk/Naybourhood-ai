-- Migration: Separate user_type and job_role
-- user_type: What kind of business (agent, developer, broker)
-- job_role: What job function (operations, marketing, sales)

-- Add job_role column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS job_role text CHECK (job_role IN ('operations', 'marketing', 'sales'));

-- Add comment explaining the distinction
COMMENT ON COLUMN public.user_profiles.user_type IS 'Business type: agent, developer, broker';
COMMENT ON COLUMN public.user_profiles.job_role IS 'Job function: operations, marketing, sales';

-- Update existing profiles view if it exists
-- The user_type column already exists and stores: admin, developer, agent, broker
-- We're adding job_role to specify the person's function within their organization
