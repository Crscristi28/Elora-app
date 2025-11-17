-- 🔐 SUPABASE RLS POLICY CHECK
-- Spusť tyto queries na Supabase SQL Editor a pošli mi screenshots

-- ==========================================
-- 1️⃣ CHECK IF RLS IS ENABLED
-- ==========================================
-- Expected: rowsecurity = true pro všechny tabulky

SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('chats', 'messages', 'profiles')
  AND schemaname = 'public'
ORDER BY tablename;


-- ==========================================
-- 2️⃣ LIST ALL RLS POLICIES ON CHATS TABLE
-- ==========================================
-- Expected: Policies pro SELECT, INSERT, UPDATE, DELETE
-- Expected: Všechny používají auth.uid() = user_id

SELECT
  policyname AS "Policy Name",
  cmd AS "Command (SELECT/INSERT/UPDATE/DELETE)",
  qual AS "USING Condition",
  with_check AS "WITH CHECK Condition"
FROM pg_policies
WHERE tablename = 'chats'
  AND schemaname = 'public'
ORDER BY cmd, policyname;


-- ==========================================
-- 3️⃣ LIST ALL RLS POLICIES ON MESSAGES TABLE
-- ==========================================
-- Expected: Policies pro SELECT, INSERT, UPDATE, DELETE
-- Expected: Všechny používají auth.uid() = user_id

SELECT
  policyname AS "Policy Name",
  cmd AS "Command (SELECT/INSERT/UPDATE/DELETE)",
  qual AS "USING Condition",
  with_check AS "WITH CHECK Condition"
FROM pg_policies
WHERE tablename = 'messages'
  AND schemaname = 'public'
ORDER BY cmd, policyname;


-- ==========================================
-- 4️⃣ CHECK TABLE STRUCTURES
-- ==========================================
-- Expected: chats má user_id column
-- Expected: messages má user_id column

-- CHATS table structure
SELECT
  column_name AS "Column",
  data_type AS "Type",
  is_nullable AS "Nullable"
FROM information_schema.columns
WHERE table_name = 'chats'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- MESSAGES table structure
SELECT
  column_name AS "Column",
  data_type AS "Type",
  is_nullable AS "Nullable"
FROM information_schema.columns
WHERE table_name = 'messages'
  AND table_schema = 'public'
ORDER BY ordinal_position;


-- ==========================================
-- 5️⃣ CHECK FOREIGN KEY CONSTRAINTS
-- ==========================================
-- Expected: messages.chat_id → chats.id s ON DELETE CASCADE

SELECT
  tc.table_name AS "Table",
  kcu.column_name AS "Foreign Key Column",
  ccu.table_name AS "References Table",
  ccu.column_name AS "References Column",
  rc.delete_rule AS "ON DELETE Action"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('messages', 'chats')
ORDER BY tc.table_name;


-- ==========================================
-- 6️⃣ CHECK STORAGE BUCKETS
-- ==========================================
-- Expected: attachments, generated-images, generated-pdfs-temp

SELECT
  name AS "Bucket Name",
  public AS "Is Public",
  file_size_limit AS "Size Limit",
  allowed_mime_types AS "Allowed Types"
FROM storage.buckets
WHERE name IN ('attachments', 'generated-images', 'generated-pdfs-temp')
ORDER BY name;


-- ==========================================
-- 7️⃣ STORAGE BUCKET POLICIES
-- ==========================================
-- Expected: Policies pro každý bucket

SELECT
  bucket_id AS "Bucket",
  name AS "Policy Name",
  definition AS "Policy Definition"
FROM storage.policies
WHERE bucket_id IN ('attachments', 'generated-images', 'generated-pdfs-temp')
ORDER BY bucket_id, name;


-- ==========================================
-- 8️⃣ TEST YOUR DATA ACCESS (SAFE)
-- ==========================================
-- Toto ti ukáže JENOM tvoje chaty (pokud RLS funguje správně)

SELECT
  id,
  title,
  created_at,
  (user_id = auth.uid()) AS "Is My Chat"
FROM chats
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;


-- ==========================================
-- INSTRUCTIONS FOR YOU:
-- ==========================================
/*
1. Otevři Supabase Dashboard
2. Jdi do SQL Editor
3. Spusť queries 1-7 (ne všechny najednou, po jednom nebo po skupinách)
4. Udělej screenshot VÝSLEDKŮ každého query
5. Pošli mi screenshots

CO HLEDÁM:
✅ RLS Enabled = true pro chats a messages
✅ Policies pro SELECT, INSERT, UPDATE, DELETE na obou tabulkách
✅ Všechny policies mají: (auth.uid() = user_id)
✅ Foreign key: messages.chat_id → chats.id s ON DELETE CASCADE
✅ Storage buckets existují
✅ Storage policies chrání data

Pokud něco chybí → napíšu ti přesné SQL pro přidání policies
*/
