-- ========================================
-- RLS POLICY OPTIMIZATION & DEDUPLICATION
-- ========================================
--
-- PROBLEM:
-- 1. Duplicate policies created over time (2-3 months ago + 2 weeks ago)
-- 2. auth.uid() evaluated per-row (slow)
-- 3. Multiple policy name variations exist
--
-- SOLUTION:
-- 1. Drop ALL known policy variations (safe with IF EXISTS)
-- 2. Recreate with optimized (select auth.uid()) syntax
-- 3. Expected 20-30% performance improvement
--
-- SAFETY:
-- - Uses BEGIN/COMMIT transaction (rollback on error)
-- - IF EXISTS prevents errors for non-existent policies
-- - Zero downtime (policies recreated immediately)
--
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ========================================

-- CHATS TABLE - All known variations
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
DROP POLICY IF EXISTS "Users can select own chats" ON chats;
DROP POLICY IF EXISTS "Users can select their own chats" ON chats;

DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert their own chats" ON chats;
DROP POLICY IF EXISTS "Users can create own chats" ON chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON chats;

DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON chats;
DROP POLICY IF EXISTS "Users can modify own chats" ON chats;
DROP POLICY IF EXISTS "Users can modify their own chats" ON chats;

DROP POLICY IF EXISTS "Users can delete own chats" ON chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON chats;
DROP POLICY IF EXISTS "Users can remove own chats" ON chats;
DROP POLICY IF EXISTS "Users can remove their own chats" ON chats;

-- MESSAGES TABLE - All known variations
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can select own messages" ON messages;
DROP POLICY IF EXISTS "Users can select their own messages" ON messages;

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create own messages" ON messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON messages;

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can modify own messages" ON messages;
DROP POLICY IF EXISTS "Users can modify their own messages" ON messages;

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Users can remove own messages" ON messages;
DROP POLICY IF EXISTS "Users can remove their own messages" ON messages;

-- MESSAGE_EMBEDDINGS TABLE - All known variations
DROP POLICY IF EXISTS "Users can view own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can view their own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can view their embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can select own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can select their own embeddings" ON message_embeddings;

DROP POLICY IF EXISTS "Users can insert own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can insert their own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can create own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can create their own embeddings" ON message_embeddings;

DROP POLICY IF EXISTS "Users can update own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can update their own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can modify own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can modify their own embeddings" ON message_embeddings;

DROP POLICY IF EXISTS "Users can delete own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can delete their own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can remove own embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can remove their own embeddings" ON message_embeddings;

-- ========================================
-- STEP 2: RECREATE OPTIMIZED POLICIES
-- ========================================

-- CHATS TABLE - 4 policies (one per action)
CREATE POLICY "Users can view own chats"
ON chats FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own chats"
ON chats FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own chats"
ON chats FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own chats"
ON chats FOR DELETE
USING ((select auth.uid()) = user_id);

-- MESSAGES TABLE - 4 policies (one per action)
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own messages"
ON messages FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING ((select auth.uid()) = user_id);

-- MESSAGE_EMBEDDINGS TABLE - 4 policies (one per action)
CREATE POLICY "Users can view own embeddings"
ON message_embeddings FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own embeddings"
ON message_embeddings FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own embeddings"
ON message_embeddings FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own embeddings"
ON message_embeddings FOR DELETE
USING ((select auth.uid()) = user_id);

-- ========================================
-- STEP 3: VERIFY NEW POLICIES
-- ========================================

-- This query will show the new policies after migration
-- Expected: 12 total (4 per table)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as action,
  CASE
    WHEN qual LIKE '%select auth.uid()%' THEN 'OPTIMIZED ✅'
    WHEN qual LIKE '%auth.uid()%' THEN 'NEEDS FIX ❌'
    ELSE 'NO CHECK'
  END as optimization_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'messages', 'message_embeddings')
ORDER BY tablename, cmd, policyname;

COMMIT;

-- ========================================
-- POST-MIGRATION STEPS
-- ========================================
--
-- 1. Verify query shows 12 policies total (4 per table)
-- 2. Check optimization_status = "OPTIMIZED ✅" for all
-- 3. Test queries in Supabase Query Performance:
--    - SELECT * FROM messages WHERE user_id = auth.uid() ORDER BY timestamp DESC LIMIT 50;
--    - Should see 20-30% speed improvement
-- 4. Monitor Vercel logs for reduced DB query times
--
-- ========================================

-- ROLLBACK: If something goes wrong, run this:
-- ROLLBACK;
--
-- Then investigate issues before re-running
-- ========================================
