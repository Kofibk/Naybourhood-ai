-- =====================================================
-- CASCADE DELETE: Auto-delete user_profiles when auth user is deleted
-- =====================================================
-- This allows deleting users from Supabase Auth dashboard without
-- manually deleting their profile first.
-- =====================================================

-- Drop existing constraint and add with CASCADE
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Also add CASCADE to any other tables that reference auth.users
-- (if they exist and have foreign keys)

-- Done - now deleting an auth user will automatically delete their profile
