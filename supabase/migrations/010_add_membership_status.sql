-- Migration: Add membership_status column to user_profiles
-- This column tracks whether users are pending approval, active, rejected, or suspended
-- It's used throughout the app to manage user access and onboarding flow

-- Add membership_status column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS membership_status TEXT 
CHECK (membership_status IN ('pending', 'pending_approval', 'active', 'rejected', 'suspended'))
DEFAULT 'active';

-- Add comment explaining the column
COMMENT ON COLUMN public.user_profiles.membership_status IS 
'Membership status within their company:
- pending: Invited but haven''t accepted yet
- pending_approval: Joined existing company, needs admin approval
- active: Active user (company admin or approved member)
- rejected: Access denied by company admin
- suspended: Temporarily suspended';

-- Update existing users to have 'active' status (if they exist and have NULL)
UPDATE public.user_profiles
SET membership_status = 'active'
WHERE membership_status IS NULL;
