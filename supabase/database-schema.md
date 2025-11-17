# 🗄️ Omnia Database Schema

Complete documentation of Supabase database structure, relationships, and policies.

---

## 📊 Database Tables

### 1. `messages` Table

Stores all chat messages with attachments, images, and metadata.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** | uuid | NOT NULL | PRIMARY KEY | Unique message identifier |
| **chat_id** | text | NOT NULL | - | Reference to parent chat (FK → `chats.id`) |
| **user_id** | uuid | NOT NULL | - | Message owner (FK → `auth.users.id`) |
| **content** | text | NOT NULL | - | Message text content |
| **timestamp** | timestamptz | NOT NULL | now() | Message creation time |
| **sender** | text | NOT NULL | - | "user" or "assistant" |
| **synced** | bool | NULL | false | Supabase sync status |
| **created_at** | timestamptz | NOT NULL | now() | Row creation timestamp |
| **updated_at** | timestamptz | NOT NULL | now() | Last update timestamp (auto-updated) |
| **attachments** | jsonb | NULL | - | User uploaded files (Supabase Storage URLs) |
| **image** | jsonb | NULL | - | Legacy single image field (deprecated) |
| **type** | text | NULL | - | Message type identifier |
| **sequence** | int8 | NULL | - | Message ordering within chat |
| **pdf** | jsonb | NULL | - | AI-generated PDF metadata |
| **images** | jsonb | NULL | - | AI-generated images array |
| **has_metadata** | bool | NULL | false | Whether message has metadata |
| **metadata** | jsonb | NULL | - | Additional message metadata |
| **source_documents** | jsonb | NULL | - | RAG source documents (if applicable) |
| **device_id** | text | NULL | - | Device that created the message |

**Foreign Keys:**
- `chat_id` → `chats.id` (CASCADE on delete)
- `user_id` → `auth.users.id`

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `chat_id` (for fast message retrieval)
- INDEX on `user_id` (for RLS performance)

**RLS Policies:**
- SELECT: `auth.uid() = user_id` (users see only their messages)
- INSERT: `auth.uid() = user_id` (users can only create their own messages)
- UPDATE: `auth.uid() = user_id` (users can only update their messages)
- DELETE: `auth.uid() = user_id` (users can only delete their messages)

---

### 2. `chats` Table

Stores chat conversations metadata.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** | text | NOT NULL | PRIMARY KEY | Unique chat identifier (UUID string) |
| **user_id** | uuid | NOT NULL | - | Chat owner (FK → `auth.users.id`) |
| **title** | text | NOT NULL | - | Chat display name |
| **created_at** | timestamptz | NOT NULL | now() | Chat creation timestamp |
| **updated_at** | timestamptz | NOT NULL | now() | Last update timestamp (auto-updated) |

**Foreign Keys:**
- `user_id` → `auth.users.id`

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (for fast chat list retrieval)

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id` (CASCADE deletes messages)

---

### 3. `profiles` Table

User profile information and preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** | uuid | NOT NULL | PRIMARY KEY | User ID (FK → `auth.users.id`) |
| **full_name** | text | NULL | - | User's full name |
| **avatar_url** | text | NULL | - | Profile picture URL |
| **created_at** | timestamptz | NOT NULL | now() | Profile creation timestamp |
| **updated_at** | timestamptz | NOT NULL | now() | Last update timestamp |
| **name** | text | NULL | - | Display name |
| **preferred_language** | text | NULL | 'cs' | UI language (cs, en, ro, de, ru, pl) |

**Foreign Keys:**
- `id` → `auth.users.id` (PRIMARY KEY reference)

**RLS Policies:**
- SELECT: `auth.uid() = id` (users see only their profile)
- INSERT: `auth.uid() = id` (auto-created on user registration)
- UPDATE: `auth.uid() = id` (users can update their profile)

**TODO: Add `role` column for admin/owner detection**

---

### 4. `usage_metrics` Table

Tracks user usage statistics for billing and analytics.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** | uuid | NOT NULL | PRIMARY KEY | Metric record ID |
| **user_id** | uuid | NOT NULL | - | User reference (FK → `auth.users.id`) |
| **metric_type** | text | NOT NULL | - | Metric category (e.g., "messages", "tokens") |
| **value** | numeric | NOT NULL | - | Metric value |
| **date** | date | NOT NULL | - | Metric date (for daily aggregation) |
| **created_at** | timestamptz | NOT NULL | now() | Record creation timestamp |

**Foreign Keys:**
- `user_id` → `auth.users.id`

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id, date` (for time-series queries)

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`

---

### 5. `subscriptions` Table

Stripe subscription management for billing.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** | uuid | NOT NULL | PRIMARY KEY | Subscription record ID |
| **user_id** | uuid | NOT NULL | - | Subscriber (FK → `auth.users.id`) |
| **plan_id** | text | NOT NULL | - | Subscription plan identifier |
| **status** | text | NOT NULL | - | Stripe subscription status |
| **stripe_customer_id** | text | NULL | - | Stripe customer ID |
| **stripe_subscription_id** | text | NULL | - | Stripe subscription ID |
| **current_period_start** | timestamptz | NULL | - | Billing period start |
| **current_period_end** | timestamptz | NULL | - | Billing period end |
| **created_at** | timestamptz | NOT NULL | now() | Subscription creation timestamp |
| **updated_at** | timestamptz | NOT NULL | now() | Last update timestamp |

**Foreign Keys:**
- `user_id` → `auth.users.id`

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `stripe_customer_id`
- UNIQUE INDEX on `stripe_subscription_id`
- INDEX on `user_id` (for user subscription lookup)

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- (INSERT/UPDATE managed by server-side Stripe webhooks)

---

### 6. `message_embeddings` Table

Vector embeddings for semantic search across conversation history (RAG - Retrieval-Augmented Generation).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **id** | uuid | NOT NULL | gen_random_uuid() | Unique embedding record ID |
| **user_id** | uuid | NOT NULL | - | Embedding owner (FK → `auth.users.id`) |
| **chat_id** | text | NOT NULL | - | Source chat (FK → `chats.id`) |
| **message_id** | uuid | NOT NULL | - | Source message (FK → `messages.id`) |
| **content** | text | NOT NULL | - | Message text (denormalized for search) |
| **sender** | text | NOT NULL | - | "user" or "bot" (CHECK constraint) |
| **embedding** | vector(768) | NULL | - | Vector embedding (Vertex AI text-embedding-005) |
| **created_at** | timestamptz | NOT NULL | now() | Embedding creation timestamp |
| **updated_at** | timestamptz | NOT NULL | now() | Last update timestamp |

**Purpose:**
- Stores vector embeddings for semantic similarity search
- Only **bot messages** are embedded (answers, not user questions)
- Enables RAG context retrieval across ALL user's chats

**Foreign Keys:**
- `user_id` → `auth.users.id` (CASCADE on delete)
- `chat_id` → `chats.id` (CASCADE on delete)
- `message_id` → `messages.id` (CASCADE on delete)

**Indexes:**
- PRIMARY KEY on `id`
- **HNSW index** on `embedding` (vector_cosine_ops) - Fast approximate nearest neighbor search
- INDEX on `user_id` (RLS performance)
- INDEX on `chat_id` (filter by chat)
- INDEX on `sender` (filter bot vs user)
- INDEX on `created_at DESC` (temporal ordering)
- Compound INDEX on `(user_id, sender)` (common query pattern)

**HNSW Index Configuration:**
```sql
CREATE INDEX message_embeddings_embedding_idx
  ON message_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```
- `m = 16`: Max connections per layer (higher = better recall, slower build)
- `ef_construction = 64`: Dynamic candidate list size during construction

**RLS Policies:**
- SELECT: `auth.uid() = user_id` (users see only their embeddings)
- INSERT: `auth.uid() = user_id` (users can only create their own embeddings)
- DELETE: `auth.uid() = user_id` (users can only delete their embeddings)

**Database Function:**

`match_messages()` - Semantic similarity search using cosine distance:

```sql
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_chat_id TEXT DEFAULT NULL,      -- NULL = search all chats
  filter_user_id UUID DEFAULT NULL,      -- NULL = current user
  filter_sender TEXT DEFAULT 'bot'       -- Default to bot messages only
)
RETURNS TABLE (
  id UUID,
  message_id UUID,
  chat_id TEXT,
  content TEXT,
  sender TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
```

**Usage Example:**
```sql
-- Find 5 most relevant bot messages across all chats
SELECT * FROM match_messages(
  query_embedding := '[0.1, 0.2, ...]'::vector,
  match_threshold := 0.5,
  match_count := 5,
  filter_chat_id := NULL,      -- Search all chats
  filter_sender := 'bot'       -- Bot messages only
);
```

**Performance:**
- Query embedding generation: 50-100ms (Vertex AI)
- Similarity search: 10-30ms (pgvector HNSW)
- Scales well to 100k+ embeddings

**See:** `/supabase/rag-schema-v2-with-sender.sql` for complete schema

---

## 🔗 Relationships Diagram

```
auth.users (Supabase Auth)
    ↓
    ├─→ profiles (1:1 - user profile)
    │
    ├─→ chats (1:N - user's conversations)
    │       ↓
    │       └─→ messages (1:N - chat messages)
    │               ├─→ attachments → storage.objects (Supabase Storage)
    │               ├─→ images → storage.objects (generated images)
    │               ├─→ pdf → storage.objects (generated PDFs)
    │               └─→ message_embeddings (1:1 - vector embedding for RAG)
    │
    ├─→ usage_metrics (1:N - usage tracking)
    │
    └─→ subscriptions (1:N - billing)
```

**CASCADE Behavior:**
- Delete `chats` → auto-deletes related `messages` → auto-deletes related `message_embeddings`
- Delete `messages` → auto-deletes related `message_embeddings`
- Delete `messages` → SHOULD delete related Storage files (via app logic, not DB CASCADE)

---

## 📦 Storage Buckets

### 1. `attachments`

User-uploaded files (images, documents, PDFs).

**Configuration:**
- Public: Yes
- File size limit: 50MB (Vercel proxy) / 100MB (direct GCS upload)
- Allowed MIME types: All (validated in app)

**Policies:**
- SELECT: Public (anyone can read via public URL)
- INSERT: `authenticated` + app logic validates owner
- DELETE: `owner = auth.uid()` (users can only delete their files)

**RLS Policy:**
```sql
CREATE POLICY "Users can delete only their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND owner = auth.uid()
);
```

---

### 2. `generated-images`

AI-generated images (DALL-E, Imagen, etc.).

**Configuration:**
- Public: Yes
- File size limit: 10MB
- Allowed MIME types: image/png, image/jpeg, image/webp

**Policies:**
- SELECT: Public
- INSERT: `authenticated`
- DELETE: `owner = auth.uid()`

**RLS Policy:**
```sql
CREATE POLICY "Users can delete only their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-images'
  AND owner = auth.uid()
);
```

---

### 3. `generated-pdfs-temp`

AI-generated PDF files (temporary storage).

**Configuration:**
- Public: Yes
- File size limit: 10MB
- Allowed MIME types: application/pdf

**Policies:**
- SELECT: Public
- INSERT: `authenticated`
- DELETE: `owner = auth.uid()`

**RLS Policy:**
```sql
CREATE POLICY "Users can delete only their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-pdfs-temp'
  AND owner = auth.uid()
);
```

---

## 🔐 Security Overview

### Row Level Security (RLS)

**All tables have RLS enabled** with policies that ensure:
- ✅ Users can ONLY access their own data
- ✅ `user_id` check on ALL operations (SELECT, INSERT, UPDATE, DELETE)
- ✅ No cross-user data leakage

**Policy Pattern:**
```sql
-- Standard user_id check for all tables
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

### Storage Security

**Storage objects use built-in `owner` column:**
- Supabase automatically sets `owner = auth.uid()` on upload
- DELETE policies check `owner = auth.uid()`
- No custom metadata needed!

**File Deletion Flow:**
1. User deletes chat in app
2. App fetches all message attachments/images/PDFs
3. App calls `deleteFromSupabaseStorage()` for each file
4. Storage policy checks: `owner = auth.uid()` → allows deletion
5. App deletes messages from database (CASCADE from chat)

---

## 🔄 Realtime Configuration

**Enabled on tables:**
- `chats` - INSERT, UPDATE, DELETE events
- `messages` - INSERT, UPDATE, DELETE events

**REPLICA IDENTITY:**
- Both tables use `REPLICA IDENTITY FULL` (required for DELETE events with filters)

**Publication:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update, delete');
```

**Filters:**
- `user_id=eq.{userId}` - only receive events for current user's data

**See:** `/supabase/realtime-setup.sql` for full Realtime configuration

---

## 🛠️ Database Functions & Triggers

### `update_updated_at_column()`

Auto-updates `updated_at` timestamp on row modification.

**Applied to:**
- `chats` table (BEFORE UPDATE trigger)
- `messages` table (BEFORE UPDATE trigger - if updated_at exists)

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📁 Related Files

**Documentation:**
- `/supabase/AUTH_AND_ROLES.md` - Authentication flow & role-based access control
- `/supabase/database-schema.md` - This document (database schema)

**SQL Scripts:**
- `/supabase/realtime-setup.sql` - RLS policies + Realtime setup
- `/supabase/realtime-delete-events.sql` - Enable DELETE events
- `/supabase/realtime-replica-identity.sql` - Fix REPLICA IDENTITY
- `/supabase/add-device-id.sql` - Add device_id to messages
- `/supabase/add-admin-role.sql` - Owner role setup (see AUTH_AND_ROLES.md)
- `/supabase/rag-schema-v2-with-sender.sql` - RAG embeddings system (v2 with sender filtering)

**Code:**
- `/src/services/storage/chatDB.js` - IndexedDB (Dexie) operations
- `/src/services/sync/chatSync.js` - Supabase sync operations
- `/src/services/storage/supabaseStorage.js` - Storage file operations
- `/src/services/sync/realtimeSync.js` - Realtime WebSocket service
- `/src/services/auth/supabaseAuth.js` - Authentication service (see AUTH_AND_ROLES.md)

---

## 🚀 Migration History

1. **Initial schema** - chats, messages, profiles
2. **Add usage_metrics** - usage tracking for billing
3. **Add subscriptions** - Stripe integration
4. **Add Realtime** - multi-device sync
5. **Add device_id** - multi-device tracking
6. **Fix Storage policies** - use built-in `owner` column instead of metadata
7. **Add RAG embeddings (v2)** - message_embeddings table with sender filtering (2025-11-03)
8. **TODO: Add role column** - admin/owner detection

---

## 📝 Notes

**Storage File Deletion:**
- ⚠️ Storage files are NOT automatically deleted when messages are deleted
- App must manually call `deleteFromSupabaseStorage()` for each file
- Implemented in `chatDB.js:deleteStorageFiles()` and `chatSync.js:deleteStorageFilesForMessages()`

**Messages without pagination:**
- IndexedDB loads all messages for active chat (1000 max per chat)
- Virtuoso handles rendering performance
- Supabase sync is incremental (based on `updated_at` timestamps)

**Sync Strategy:**
- Empty IndexedDB → full download from Supabase
- Otherwise → incremental sync (fetch only new/updated records since last sync)
- Force full download available via UI (Settings → Force Sync)

---

## 🔍 Useful Queries

### Check RLS Policies
```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Check Storage Objects
```sql
SELECT
  name,
  bucket_id,
  owner,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id IN ('attachments', 'generated-images', 'generated-pdfs-temp')
ORDER BY created_at DESC
LIMIT 10;
```

### Check Realtime Configuration
```sql
SELECT
  pubname,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE pubname = 'supabase_realtime';
```

### Check REPLICA IDENTITY
```sql
SELECT
  schemaname,
  tablename,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT (primary key only)'
    WHEN 'f' THEN 'FULL (entire row)'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE tablename IN ('chats', 'messages')
  AND schemaname = 'public';
```

---

## ⚠️ Known Issues

1. **Storage file orphans** - If app crashes during chat deletion, files may remain in Storage
   - **Mitigation:** Periodic cleanup job (TODO)

2. **No CASCADE delete for Storage** - Database CASCADE doesn't trigger Storage file deletion
   - **Mitigation:** App-level cleanup before DB delete

3. **No role-based access** - All users have same permissions (no admin panel)
   - **Mitigation:** TODO - Add `role` column to profiles

---

Last updated: 2025-11-03
