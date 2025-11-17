-- ============================================
-- OMNIA REALTIME SETUP - Phase 1
-- ============================================
-- Enables real-time multi-device sync for chats and messages
-- Run this entire script in Supabase SQL Editor
--
-- What this does:
-- 1. Enable Row Level Security (RLS) on chats and messages tables
-- 2. Create RLS policies (users can only access their own data)
-- 3. Enable Realtime replication for instant cross-device updates
-- 4. Add automatic updated_at timestamp triggers
--
-- After running this script, JavaScript code will be able to:
-- - Subscribe to real-time changes in chats and messages
-- - Receive instant notifications when data changes on other devices
-- - Maintain proper security (users only see their own data)
-- ============================================

BEGIN;

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RLS POLICIES FOR CHATS TABLE
-- ============================================

-- Drop existing policies if they exist (idempotent - safe to re-run)
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON chats;

-- SELECT: Users can only see their own chats
CREATE POLICY "Users can view own chats"
ON chats FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only insert chats with their own user_id
CREATE POLICY "Users can insert own chats"
ON chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own chats
CREATE POLICY "Users can update own chats"
ON chats FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own chats
CREATE POLICY "Users can delete own chats"
ON chats FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. RLS POLICIES FOR MESSAGES TABLE
-- ============================================

-- Drop existing policies if they exist (idempotent - safe to re-run)
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- SELECT: Users can only see their own messages
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only insert messages with their own user_id
CREATE POLICY "Users can insert own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own messages
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 4. ENABLE REALTIME REPLICATION
-- ============================================
-- This allows JavaScript code to subscribe to changes via WebSocket
-- NOTE: After running this, also run realtime-delete-events.sql to enable DELETE events!

-- Add chats table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- IMPORTANT: This only enables INSERT and UPDATE events by default!
-- To enable DELETE events, run supabase/realtime-delete-events.sql after this script

-- ============================================
-- 5. UPDATED_AT TRIGGERS (AUTO-TIMESTAMP)
-- ============================================
-- Automatically update updated_at column when row is modified

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;

-- Trigger for chats table
CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for messages table (only if updated_at column exists)
-- Note: messages table uses 'timestamp' field, not 'updated_at'
-- This trigger is conditional to avoid errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'updated_at'
  ) THEN
    CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
-- These queries help verify the setup was successful

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('chats', 'messages');

-- Expected output: rowsecurity = true for both tables

-- Verify policies exist
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, cmd;

-- Expected output: 8 policies total (4 for chats, 4 for messages)

-- Verify realtime replication
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Expected output: Should include 'chats' and 'messages'

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- If something fails during execution, the transaction will automatically
-- rollback. You can also manually rollback by running:
--
-- ROLLBACK;
--
-- Then fix the issue and re-run the entire script.
--
-- To completely remove Realtime setup:
--
-- ALTER PUBLICATION supabase_realtime DROP TABLE chats;
-- ALTER PUBLICATION supabase_realtime DROP TABLE messages;
-- DROP POLICY "Users can view own chats" ON chats;
-- DROP POLICY "Users can insert own chats" ON chats;
-- DROP POLICY "Users can update own chats" ON chats;
-- DROP POLICY "Users can delete own chats" ON chats;
-- DROP POLICY "Users can view own messages" ON messages;
-- DROP POLICY "Users can insert own messages" ON messages;
-- DROP POLICY "Users can update own messages" ON messages;
-- DROP POLICY "Users can delete own messages" ON messages;
-- DROP TRIGGER update_chats_updated_at ON chats;
-- DROP TRIGGER update_messages_updated_at ON messages;
-- DROP FUNCTION update_updated_at_column;

-- ============================================
-- NEXT STEPS
-- ============================================
-- After running this SQL script successfully:
-- 1. Verify all verification queries show expected results
-- 2. Proceed to Phase 2: Implement RealtimeService in JavaScript
-- 3. Phase 3: Integrate into App.jsx
-- 4. Phase 4: Connect to IndexedDB
-- 5. Phase 5: Test multi-device sync
