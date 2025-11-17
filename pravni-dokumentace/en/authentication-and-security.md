# Omnia Authentication and Security Overview

This document describes how authentication, authorisation and data protection are implemented in Omnia One AI. It is derived from the source code in the `api/`, `src/services/` and `supabase/` directories and from Supabase documentation.

## 1. Registration and Sign-In

- Registration and login use Supabase Auth (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`).  
- Supabase stores passwords hashed (bcrypt) and issues JWT tokens that expire after 60 minutes and refresh automatically.  
- On the client, `src/services/auth/supabaseAuth.js` offers sign-in, sign-out, password reset (OTP) and session listeners.  
- Access tokens are never forwarded directly to third parties; when calling Omnia API routes they are sent via the `Authorization: Bearer` header.

## 2. Backend Verification

- Server routes (`api/claude.js`, `api/gemini.js` and others) instantiate Supabase with the service role key (`SUPABASE_SERVICE_ROLE_KEY`).  
- Each request extracts the JWT token from the header and verifies it with `supabase.auth.getUser(token)`.  
- Invalid tokens result in `401 Unauthorized`.  
- After verification the backend queries the `profiles` table to retrieve the user role. Missing records default to `'user'`.

## 3. Roles and Permissions

- The `profiles` table includes a `role` column (e.g. `user`, `owner`).  
- Roles can be configured via the SQL script `supabase/add-admin-role.sql`.  
- Backend logic uses the role flag to unlock privileged features (admin tools, priority access).  
- If the role lookup fails the system falls back to standard user permissions.

## 4. Row Level Security and Database Access

- All critical tables (`chats`, `messages`, `profiles`, `usage_metrics`, `subscriptions`) enforce Row Level Security.  
- Policies ensure that `auth.uid() = user_id` (or `auth.uid() = id` in case of `profiles`), so Users only access their own rows.  
- Inserts and deletes also require the record to belong to the authenticated user.  
- Triggers like `update_updated_at_column` keep `updated_at` timestamps current for synchronisation purposes.

## 5. File Storage

- Attachments are stored in Supabase Storage (bucket `attachments`), AI images in `generated-images`, PDFs in `generated-pdfs-temp`.  
- Uploads via `supabase.storage.from(bucket).upload(...)` automatically set `owner = auth.uid()`.  
- File deletions use `deleteFromSupabaseStorage`, which is allowed only for the owner thanks to Storage policies.  
- When the User deletes a chat (`chatDB.deleteChat`) the logic removes Storage files before deleting `messages` and `chats`.

## 6. Local Storage and Synchronisation

- IndexedDB (Dexie) stores offline data under the name `OmniaChatDB`.  
- Schema versions add new columns (attachments, images, pdf, sources) with explicit migration logs.  
- Synchronisation with Supabase is handled by `src/services/sync/chatSync.js`. It checks authentication before uploading and transmits only the current user's records.  
- Deletions propagate to realtime listeners so that changes appear on other devices.

## 7. Account and Data Deletion

- The backend endpoint `api/delete-account.js` calls `supabase.auth.admin.deleteUser(userId)` to remove the user, cascading to profiles, chats, messages and related files.  
- This operation is irreversible; data cannot be restored after the deletion.  
- Users can export conversations before requesting deletion.

## 8. API Keys and Third-Party Access

- All secrets (Google, Anthropic, OpenAI, ElevenLabs, Stripe) are loaded from environment variables and never exposed to the client.  
- The backend checks for missing keys and responds with HTTP 500 plus a safe message if the configuration is incomplete.  
- Requests to third-party APIs send only the data required for the specific function (e.g. current message, text to synthesize).

## 9. Incident Response

- Runtime errors are logged to the console (visible in Vercel logs) with minimal personal data.  
- The Provider monitors `console.error` and `console.warn` outputs to catch anomalies.  
- In case of a security incident, tokens can be revoked in Supabase and API keys rotated immediately.

## 10. User Recommendations

- Use a unique password and enable MFA on the mail account used for login.  
- If suspicious activity occurs, change the password and notify support right away.  
- Do not share tokens or API keys with third parties.  
- Periodically delete unnecessary chats and attachments to limit stored data.

---

This document reflects the security architecture of Omnia One AI as of 2 November 2025.
