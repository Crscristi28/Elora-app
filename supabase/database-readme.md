# Supabase SQL Migrations

SQL skripty pro konfiguraci Supabase Realtime synchronizace.

## 📋 Setup Order

Spusť SQL skripty v tomto pořadí v **Supabase SQL Editor**:

### 1. `realtime-setup.sql` ✅
**Kdy:** První setup po vytvoření Supabase projektu

**Co dělá:**
- Povolí Row Level Security (RLS) na `chats` a `messages` tabulkách
- Vytvoří RLS policies (users vidí pouze vlastní data)
- Přidá tabulky do Realtime publication
- Vytvoří `updated_at` triggery

**⚠️ Poznámka:** Tento skript povolí JEN INSERT a UPDATE eventy. Pro DELETE eventy je potřeba spustit další skript.

---

### 2. `realtime-delete-events.sql` ✅
**Kdy:** Hned po `realtime-setup.sql` (nebo kdykoliv později)

**Co dělá:**
- Povolí DELETE eventy pro Realtime
- Bez tohoto scriptu DELETE eventy na jiném zařízení NEPŘICHÁZÍ!

**Proč samostatný skript:**
- `ALTER PUBLICATION ADD TABLE` povolí defaultně jen INSERT + UPDATE
- DELETE eventy je potřeba explicitně povolit pomocí `publish` parametru

---

### 3. `realtime-replica-identity.sql` ✅ **KRITICKÝ!**
**Kdy:** Hned po `realtime-delete-events.sql`

**Co dělá:**
- Nastaví `REPLICA IDENTITY FULL` na `chats` a `messages` tabulkách
- **BEZ TOHOTO DELETE EVENTY STÁLE NEFUNGUJÍ!**

**Proč je to potřeba:**
- `REPLICA IDENTITY DEFAULT` posílá jen primary key (id) při DELETE
- Realtime nemá `user_id` pro filtrování → event se NEPOŠLE
- `REPLICA IDENTITY FULL` posílá celý deleted row včetně `user_id`
- Realtime pak může filtrovat podle `user_id=eq.{userId}` → event PŘIJDE ✅

**Verifikace:**
```sql
-- Check REPLICA IDENTITY settings
SELECT
  schemaname,
  tablename,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT (primary key)'
    WHEN 'f' THEN 'FULL'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE tablename IN ('chats', 'messages')
  AND schemaname = 'public';
```

**Expected output:**
```
chats:    FULL ✅
messages: FULL ✅
```

---

## 🔍 Verification

Po spuštění VŠECH TŘÍ skriptů zkontroluj v SQL Editoru:

```sql
-- Check publication configuration
SELECT
  pubname,
  pubinsert,
  pubupdate,
  pubdelete  -- Should be TRUE!
FROM pg_publication
WHERE pubname = 'supabase_realtime';
```

**Expected output:**
```
pubname: supabase_realtime
pubinsert: true
pubupdate: true
pubdelete: true  ✅
```

---

## 🧪 Testing

### Test INSERT events:
1. Otevři app na 2 zařízeních
2. Device A: Pošli zprávu
3. Device B: Měl by vidět zprávu okamžitě (< 1s)

**Expected logs (Device B):**
```
📡 [REALTIME] messages INSERT: <uuid>
💬 [REALTIME] New message detected: ...
✅ [REALTIME] Adding new message to state
```

---

### Test UPDATE events:
1. Device A: Uprav chat title (pokud máš tuto funkci)
2. Device B: Měl by vidět změnu okamžitě

**Expected logs (Device B):**
```
📡 [REALTIME] chats UPDATE: <chat-id>
📝 [REALTIME] Chat updated: ...
✅ [REALTIME] Chat updated in React state
```

---

### Test DELETE events:
1. Device A: Smaž chat (long press v sidebar)
2. Device B: Chat by měl zmizet okamžitě

**Expected logs (Device B):**
```
📡 [REALTIME] chats DELETE: <chat-id>
🗑️ [REALTIME] Chat deleted: ...
✅ [REALTIME] Chat deleted from IndexedDB
✅ [REALTIME] Chat removed from React state
```

**❌ Pokud nevidíš DELETE logs:**
- Zkontroluj že jsi spustil `realtime-delete-events.sql`
- Reload aplikaci (reconnect Realtime)
- Zkontroluj browser console pro Realtime connection errors

---

## 🔄 Rollback

### Disable DELETE events:
```sql
ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update');
```

### Remove tables from Realtime:
```sql
ALTER PUBLICATION supabase_realtime DROP TABLE chats;
ALTER PUBLICATION supabase_realtime DROP TABLE messages;
```

### Disable RLS:
```sql
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

---

## 📁 File Structure

```
supabase/
├── README.md                        # Tento soubor (Realtime setup guide)
├── database-schema.md              # 🗄️ Complete database schema documentation
├── realtime-setup.sql              # 1️⃣ První setup (RLS + Realtime)
├── realtime-delete-events.sql      # 2️⃣ Enable DELETE events
├── realtime-replica-identity.sql   # 3️⃣ Fix REPLICA IDENTITY (KRITICKÝ!)
├── add-device-id.sql               # 📱 Add device_id to messages table
└── add-admin-role.sql              # 👑 Add role column to profiles (owner/admin detection)
```

## 📚 Documentation

**[📖 Database Schema](./database-schema.md)** - Complete schema documentation:
- All tables structure (messages, chats, profiles, usage_metrics, subscriptions)
- Foreign key relationships
- RLS policies overview
- Storage buckets and policies
- Realtime configuration
- Useful SQL queries

---

## 🔗 Related Code

**Realtime Service:**
- `src/services/sync/realtimeSync.js` - Generic Realtime service

**Event Handlers:**
- `src/App.jsx` - handleRealtimeNewChat() (line 352)
- `src/App.jsx` - handleRealtimeUpdateChat() (line 410)
- `src/App.jsx` - handleRealtimeDeleteChat() (line 488) ⚡ Needs DELETE events!
- `src/App.jsx` - handleRealtimeNewMessage() (line 528)
- `src/App.jsx` - handleRealtimeUpdateMessage() (line 617)
- `src/App.jsx` - handleRealtimeDeleteMessage() (line 668) ⚡ Needs DELETE events!

**Delete Logic:**
- `src/services/storage/chatDB.js` - deleteChat() (line 177)
- `src/services/sync/chatSync.js` - deleteChat() (line 682)

---

## ❓ Troubleshooting

### Realtime events nepřichází:
1. Check Supabase logs: Dashboard → Logs → Realtime
2. Check browser console pro WebSocket errors
3. Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename IN ('chats', 'messages')`
4. Restart Realtime: Reload aplikaci

### DELETE events stále nefungují:
1. **Nejdřív zkontroluj REPLICA IDENTITY!** (nejčastější problém)
   ```sql
   SELECT tablename, CASE relreplident
     WHEN 'd' THEN 'DEFAULT' WHEN 'f' THEN 'FULL'
   END FROM pg_class c
   JOIN pg_tables t ON t.tablename = c.relname
   WHERE tablename IN ('chats', 'messages');
   ```
   Musí být `FULL` pro obě tabulky! Pokud je `DEFAULT`, spusť `realtime-replica-identity.sql`

2. Verify publication: `SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime'`
3. Check `pubdelete` column - musí být `true`
4. Reload aplikaci (reconnect Realtime)
5. Check logs na Device B - měl by vidět `📡 [REALTIME] chats DELETE`

### Performance issues:
- Realtime má rate limit (default: 100 connections)
- Pro production doporučeno nastavit connection pooling
- Monitor Supabase Dashboard → Database → Realtime connections
