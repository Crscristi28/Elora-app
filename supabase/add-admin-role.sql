-- ============================================
-- ADD ADMIN ROLE TO PROFILES
-- ============================================
-- Adds 'role' column to profiles table for admin/owner detection
-- Run this script in Supabase SQL Editor
--
-- What this does:
-- 1. Adds 'role' column to profiles table
-- 2. Sets default role to 'user' for all existing users
-- 3. Updates specific user to 'owner' role
-- 4. Future: Claude API will detect role and adjust security rules
-- ============================================

BEGIN;

-- ============================================
-- 1. ADD ROLE COLUMN
-- ============================================

-- Add role column if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
    RAISE NOTICE 'Added role column to profiles table';
  ELSE
    RAISE NOTICE 'Role column already exists, skipping';
  END IF;
END $$;

-- ============================================
-- 2. SET DEFAULT ROLES
-- ============================================

-- Update all existing users to 'user' role if NULL
UPDATE profiles
SET role = 'user'
WHERE role IS NULL;

-- ============================================
-- 3. SET OWNER ROLE
-- ============================================

-- 🔧 REPLACE WITH YOUR USER ID!
-- Find your user_id by running:
--   SELECT id, email FROM auth.users WHERE email = 'your.email@example.com';

-- Option 1: Update by email (recommended)
UPDATE profiles
SET role = 'owner'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'cristinelbucioaca2801@gmail.com'
);

-- Option 2: Update by user_id directly (if you know it)
-- UPDATE profiles
-- SET role = 'owner'
-- WHERE id = 'YOUR_USER_ID_HERE';  -- 🔧 REPLACE THIS!

-- ============================================
-- 4. VERIFICATION
-- ============================================

-- Check that role column exists and owner is set
SELECT
  p.id,
  u.email,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at;

-- Expected output: Should see your email with role = 'owner'

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- If something fails, the transaction will automatically rollback.
-- To manually remove the role column:
--
-- ALTER TABLE profiles DROP COLUMN role;
--
-- ============================================
-- NEXT STEPS
-- ============================================
-- After running this SQL:
-- 1. Verify your user has role = 'owner' in verification query above
-- 2. Update App.jsx to fetch user role on login
-- 3. Update /api/claude.js to include owner detection in system prompt
-- 4. Test: Claude should recognize you as app developer without explaining
