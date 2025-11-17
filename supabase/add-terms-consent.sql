-- ============================================
-- ADD TERMS CONSENT TRACKING TO PROFILES
-- ============================================
-- Adds terms and privacy policy consent tracking columns
-- Run this script in Supabase SQL Editor
--
-- What this does:
-- 1. Adds consent tracking columns to profiles table
-- 2. Creates indexes for faster consent status queries
-- 3. Adds documentation comments
-- 4. Verifies all columns were added correctly
--
-- GDPR Compliance: Tracks explicit user consent for:
-- - Terms of Service
-- - Privacy Policy
-- ============================================

BEGIN;

-- ============================================
-- 1. ADD CONSENT TRACKING COLUMNS
-- ============================================

-- Add terms_accepted_at column (timestamp when user accepted Terms)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted_at timestamptz NULL;
    RAISE NOTICE 'Added terms_accepted_at column to profiles table';
  ELSE
    RAISE NOTICE 'terms_accepted_at column already exists, skipping';
  END IF;
END $$;

-- Add terms_version column (which version of terms was accepted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_version'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_version text NULL;
    RAISE NOTICE 'Added terms_version column to profiles table';
  ELSE
    RAISE NOTICE 'terms_version column already exists, skipping';
  END IF;
END $$;

-- Add privacy_policy_accepted_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'privacy_policy_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_policy_accepted_at timestamptz NULL;
    RAISE NOTICE 'Added privacy_policy_accepted_at column to profiles table';
  ELSE
    RAISE NOTICE 'privacy_policy_accepted_at column already exists, skipping';
  END IF;
END $$;

-- Add privacy_policy_version column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'privacy_policy_version'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_policy_version text NULL;
    RAISE NOTICE 'Added privacy_policy_version column to profiles table';
  ELSE
    RAISE NOTICE 'privacy_policy_version column already exists, skipping';
  END IF;
END $$;

-- ============================================
-- 2. ADD COLUMN COMMENTS (DOCUMENTATION)
-- ============================================

COMMENT ON COLUMN profiles.terms_accepted_at IS
  'Timestamp when user explicitly accepted Terms of Service (NULL = not yet accepted)';

COMMENT ON COLUMN profiles.terms_version IS
  'Version of Terms of Service accepted (e.g., "v1.0", "2025-11-02")';

COMMENT ON COLUMN profiles.privacy_policy_accepted_at IS
  'Timestamp when user explicitly accepted Privacy Policy (NULL = not yet accepted)';

COMMENT ON COLUMN profiles.privacy_policy_version IS
  'Version of Privacy Policy accepted (e.g., "v1.0", "2025-11-02")';

-- ============================================
-- 3. CREATE INDEXES (OPTIONAL - FOR PERFORMANCE)
-- ============================================

-- Index for finding users who haven't accepted terms yet
CREATE INDEX IF NOT EXISTS idx_profiles_terms_pending
ON profiles(id)
WHERE terms_accepted_at IS NULL;

-- Index for finding users by terms acceptance date
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted_at
ON profiles(terms_accepted_at)
WHERE terms_accepted_at IS NOT NULL;

-- ============================================
-- 4. VERIFICATION
-- ============================================

-- Check that all columns exist and show current state of ALL users
SELECT
  p.id,
  u.email,
  p.created_at,
  p.terms_accepted_at,
  p.terms_version,
  p.privacy_policy_accepted_at,
  p.privacy_policy_version,
  CASE
    WHEN p.terms_accepted_at IS NULL THEN 'NEEDS CONSENT'
    ELSE 'CONSENTED'
  END as consent_status
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;

-- Quick summary count
SELECT
  COUNT(*) as total_users,
  COUNT(terms_accepted_at) as users_consented,
  COUNT(*) - COUNT(terms_accepted_at) as users_need_consent
FROM profiles;

-- Expected output:
-- - All existing users should have NULL values (need to show consent modal)
-- - New columns should be visible in table structure
-- - Summary should show: total_users = ~30, users_consented = 0, users_need_consent = ~30

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- If something fails, the transaction will automatically rollback.
-- To manually remove these columns:
--
-- ALTER TABLE profiles DROP COLUMN IF EXISTS terms_accepted_at;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS terms_version;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS privacy_policy_accepted_at;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS privacy_policy_version;
-- DROP INDEX IF EXISTS idx_profiles_terms_pending;
-- DROP INDEX IF EXISTS idx_profiles_terms_accepted_at;
--
-- ============================================
-- NEXT STEPS
-- ============================================
-- After running this SQL:
-- 1. Verify columns exist in verification query above
-- 2. Create TermsConsentModal.jsx component
-- 3. Add consent check to App.jsx on mount
-- 4. Create consentService.js to handle accept/check logic
-- 5. Add RLS policy if needed (currently covered by existing UPDATE policy)
-- 6. Test with existing users - they should see consent modal on next login
--
-- ============================================
-- GDPR COMPLIANCE NOTES
-- ============================================
-- - NULL values indicate user has NOT consented yet
-- - timestamp records WHEN they consented (audit trail)
-- - version tracks WHICH terms they agreed to (important for updates)
-- - User can revoke consent by deleting account (already implemented)
-- - Existing "Users can update own profile" RLS policy allows users to update these fields
--
-- ============================================
