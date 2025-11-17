-- ============================================
-- OMNIA REALTIME - DELETE EVENTS FIX
-- ============================================
-- Enables DELETE events for Realtime publication
-- Run this in Supabase SQL Editor after realtime-setup.sql
--
-- Problem:
-- - INSERT events work ✅
-- - UPDATE events work ✅
-- - DELETE events DON'T work ❌
--
-- Root cause:
-- ALTER PUBLICATION supabase_realtime ADD TABLE only enables INSERT/UPDATE by default
-- DELETE events need to be explicitly enabled with publish parameter
--
-- Solution:
-- Enable DELETE events by setting publish = 'insert, update, delete'
-- ============================================

BEGIN;

-- ============================================
-- 1. ENABLE DELETE EVENTS FOR REALTIME
-- ============================================

-- Method 1: Set publication-wide (affects all tables in publication)
-- This enables DELETE events for ALL tables in supabase_realtime publication
ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update, delete');

-- Method 2: Per-table configuration (optional - use if Method 1 doesn't work)
-- Uncomment if you need table-specific control:
--
-- ALTER PUBLICATION supabase_realtime DROP TABLE chats;
-- ALTER PUBLICATION supabase_realtime DROP TABLE messages;
--
-- ALTER PUBLICATION supabase_realtime ADD TABLE chats
--   WITH (publish = 'insert, update, delete');
--
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages
--   WITH (publish = 'insert, update, delete');

-- ============================================
-- 2. VERIFICATION QUERIES
-- ============================================
-- Check publication configuration

-- Verify publication exists and has correct settings
SELECT
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- Expected output:
-- pubname: supabase_realtime
-- puballtables: false
-- pubinsert: true
-- pubupdate: true
-- pubdelete: true  ← This should be TRUE after fix!

-- Verify tables are in publication
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Expected output:
-- Should include 'chats' and 'messages' tables

COMMIT;

-- ============================================
-- TEST PLAN
-- ============================================
-- After running this SQL:
--
-- 1. Reload your application to reconnect Realtime
-- 2. Open app on 2 devices (Device A + Device B)
-- 3. Device A: Delete a chat
-- 4. Expected logs on Device B:
--    📡 [REALTIME] chats DELETE: {eventType: "DELETE", ...}
--    🗑️ [REALTIME] Chat deleted: <chat-id>
--    ✅ [REALTIME] Chat deleted from IndexedDB
--    ✅ [REALTIME] Chat removed from React state
--
-- If you still don't see DELETE events:
-- 1. Check browser console for Realtime connection errors
-- 2. Verify RLS policies allow DELETE (already configured in realtime-setup.sql)
-- 3. Check Supabase Dashboard → Database → Replication → supabase_realtime
--    Should show: Insert: ON, Update: ON, Delete: ON

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- To disable DELETE events again:
--
-- ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update');
--
-- This will revert to only INSERT and UPDATE events

-- ============================================
-- RELATED FILES
-- ============================================
-- - supabase/realtime-setup.sql - Initial Realtime setup (RLS + publication)
-- - src/App.jsx - handleRealtimeDeleteChat() (lines 488-522)
-- - src/App.jsx - handleRealtimeDeleteMessage() (lines 668-700)
-- - src/services/storage/chatDB.js - deleteChat() (lines 177-207)
-- - src/services/sync/chatSync.js - deleteChat() (lines 682-721)
