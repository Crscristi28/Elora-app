-- =====================================================
-- OMNIA - Add device_id to messages
-- =====================================================
-- Date: 2025-01-27
-- Purpose: Prevent duplicate messages via Realtime sync
--
-- Problem:
-- - Device A sends message → optimistic update
-- - Message syncs to Supabase
-- - Realtime broadcasts back to Device A
-- - Device A receives own message → duplicate! ❌
--
-- Solution:
-- - Each device has unique device_id
-- - Messages include device_id when uploaded
-- - Realtime callback skips if device_id matches
-- - Device A skips own messages ✅
-- - Device B processes messages normally ✅
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADD device_id COLUMN
-- =====================================================
-- NULLABLE for backward compatibility
-- Existing messages will have NULL device_id
-- New messages will have device_id populated

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS device_id TEXT NULL;

-- =====================================================
-- 2. CREATE INDEX FOR PERFORMANCE
-- =====================================================
-- Index speeds up Realtime filter queries
-- WHERE device_id = ? will be frequent

CREATE INDEX IF NOT EXISTS idx_messages_device_id
ON messages(device_id);

-- =====================================================
-- 3. ADD DOCUMENTATION
-- =====================================================
-- Comment explains purpose for future developers

COMMENT ON COLUMN messages.device_id IS
  'Unique identifier for the device that created this message. Used to prevent duplicate messages in Realtime sync. Device A skips Realtime events for messages with device_id matching its own ID.';

-- =====================================================
-- 4. VERIFICATION
-- =====================================================
-- Check column was added successfully

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
  AND column_name = 'device_id';

-- Expected output:
-- column_name: device_id
-- data_type: text
-- is_nullable: YES

-- Check index was created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'messages'
  AND indexname = 'idx_messages_device_id';

-- Expected output:
-- indexname: idx_messages_device_id
-- indexdef: CREATE INDEX idx_messages_device_id ON public.messages USING btree (device_id)

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================
-- To revert this migration:
--
-- BEGIN;
-- DROP INDEX IF EXISTS idx_messages_device_id;
-- ALTER TABLE messages DROP COLUMN IF EXISTS device_id;
-- COMMIT;

-- =====================================================
-- NEXT STEPS AFTER MIGRATION
-- =====================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Update frontend code:
--    a) Generate device_id on app load (localStorage)
--    b) Include device_id in message uploads (chatSync.js)
--    c) Skip Realtime callbacks if device_id matches (App.jsx)
-- 3. Test:
--    a) Send message on Device A
--    b) Verify no duplicate on Device A
--    c) Verify message appears on Device B
-- 4. Deploy to production

-- =====================================================
-- RELATED FILES
-- =====================================================
-- Frontend implementation:
-- - src/utils/deviceId.js - Generate & store device_id
-- - src/services/sync/chatSync.js - Include device_id in uploads
-- - src/App.jsx - Skip Realtime if device_id matches
