-- ============================================
-- OMNIA REALTIME - REPLICA IDENTITY FIX
-- ============================================
-- Enables REPLICA IDENTITY FULL for DELETE events to work properly
-- Run this in Supabase SQL Editor after realtime-delete-events.sql
--
-- Problem:
-- - DELETE events from Supabase don't arrive on other devices ❌
-- - Even though pubdelete = true in supabase_realtime publication
-- - Logs show: Supabase delete succeeds, but no Realtime event on Device B
--
-- Root cause:
-- REPLICA IDENTITY DEFAULT only sends primary key (id) when row is deleted
-- Realtime needs user_id to filter events (user_id=eq.{userId})
-- Without user_id in deleted row payload, Realtime can't match subscriber filter
-- So DELETE events are NOT sent to WebSocket subscribers!
--
-- Solution:
-- REPLICA IDENTITY FULL sends entire deleted row including user_id
-- Realtime can then filter by user_id and send event to correct subscribers
-- ============================================

BEGIN;

-- ============================================
-- 1. ENABLE REPLICA IDENTITY FULL
-- ============================================
-- This makes Postgres send entire deleted row to Realtime
-- (not just primary key)

ALTER TABLE chats REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;

-- ============================================
-- 2. VERIFICATION QUERIES
-- ============================================
-- Check REPLICA IDENTITY settings

-- Verify REPLICA IDENTITY was changed
SELECT
  schemaname,
  tablename,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT (primary key)'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL'
    WHEN 'i' THEN 'INDEX'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE tablename IN ('chats', 'messages')
  AND schemaname = 'public';

-- Expected output after fix:
-- chats:    FULL ✅
-- messages: FULL ✅

COMMIT;

-- ============================================
-- TEST PLAN
-- ============================================
-- After running this SQL:
--
-- 1. Reload both devices (reconnect Realtime)
-- 2. Device A: Delete a chat
-- 3. Expected logs on Device B:
--    📡 [REALTIME] chats DELETE: {eventType: "DELETE", ...}
--    🗑️ [REALTIME] Chat deleted: <chat-id>
--    ✅ [REALTIME] Chat deleted from IndexedDB
--    ✅ [REALTIME] Chat removed from React state
--
-- 4. Device B should see chat disappear instantly (< 1s)
--
-- If DELETE events still don't work:
-- 1. Check browser console for Realtime errors
-- 2. Verify subscription is connected: "✅ [REALTIME] Connected to chats changes"
-- 3. Check Supabase Dashboard → Database → Replication
--    Should show: Insert: ON, Update: ON, Delete: ON
-- 4. Verify RLS policies allow DELETE (already configured)

-- ============================================
-- PERFORMANCE IMPACT
-- ============================================
-- REPLICA IDENTITY FULL has minimal impact:
-- - Slightly more data in Write-Ahead Log (WAL)
-- - Negligible for chat app with low delete frequency
-- - DELETE operations are infrequent (< 1% of operations)
-- - Benefits far outweigh costs (real-time multi-device sync!)

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- To revert to DEFAULT:
--
-- ALTER TABLE chats REPLICA IDENTITY DEFAULT;
-- ALTER TABLE messages REPLICA IDENTITY DEFAULT;
--
-- Note: This will BREAK DELETE events again!

-- ============================================
-- RELATED FILES
-- ============================================
-- - supabase/realtime-setup.sql - Initial Realtime setup (RLS + publication)
-- - supabase/realtime-delete-events.sql - Enable DELETE in publication
-- - supabase/realtime-replica-identity.sql - THIS FILE (REPLICA IDENTITY FULL)
-- - src/App.jsx - handleRealtimeDeleteChat() (lines 488-522)
-- - src/App.jsx - handleRealtimeDeleteMessage() (lines 668-700)
-- - src/services/sync/realtimeSync.js - Generic Realtime service
