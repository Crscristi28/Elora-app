-- ========================================
-- FIX SECURITY WARNINGS - SEARCH PATH
-- ========================================
--
-- PROBLEM:
-- 1. update_updated_at_column() has mutable search_path
-- 2. match_messages() LEGACY function needs cleanup (RAG v1)
-- 3. vector extension in public schema (intentional - needed for RAG)
--
-- SOLUTION:
-- 1. Fix trigger function search_path
-- 2. Drop legacy match_messages() (will recreate in rag-schema-v2)
-- 3. Keep vector extension (needed for message_embeddings)
--
-- SAFETY:
-- - Non-breaking change (only adds security constraint)
-- - Legacy match_messages() will be recreated by rag-schema-v2
-- - Zero downtime
--
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: FIX TRIGGER FUNCTION
-- ========================================

-- Fix update_updated_at_column (used by chats, messages, etc.)
ALTER FUNCTION public.update_updated_at_column()
SET search_path = public, pg_temp;

-- ========================================
-- STEP 2: FIX RAG FUNCTION SEARCH_PATH
-- ========================================

-- Fix match_messages() function (RAG v2 with sender filtering)
-- Note: This function was created by rag-schema-v2-with-sender.sql yesterday
ALTER FUNCTION public.match_messages(vector(768), float, int, text, uuid, text)
SET search_path = public, pg_temp;

-- ========================================
-- STEP 3: VERIFY FIXES
-- ========================================

-- Check which functions now have fixed search_path
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE
    WHEN p.proconfig IS NULL THEN '❌ No search_path set'
    WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN '✅ search_path = ' || array_to_string(p.proconfig, ', ')
    ELSE '❌ No search_path set'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('update_updated_at_column', 'match_messages')
ORDER BY p.proname;

COMMIT;

-- ========================================
-- POST-FIX VERIFICATION
-- ========================================
--
-- Run Supabase Linter again:
-- Database → Performance → Linter
--
-- Expected results:
-- ✅ function_search_path_mutable for update_updated_at_column - GONE
-- ✅ function_search_path_mutable for match_messages - GONE (function dropped)
-- ⚪ extension_in_public for vector - REMAINS (intentional - needed for RAG)
-- ⚪ auth_leaked_password_protection - REMAINS (intentional)
-- ✅ vulnerable_postgres_version - GONE (after Postgres upgrade completes)
--
-- ========================================
-- NEXT STEPS
-- ========================================
--
-- After running this script:
-- 1. Run rag-schema-v2-with-sender.sql to recreate RAG with sender filtering
-- 2. Implement RAG incrementally according to RAG-IMPLEMENTATION-PROBLEMS.md
-- 3. Follow Phase 1-6 implementation plan
--
-- ========================================
