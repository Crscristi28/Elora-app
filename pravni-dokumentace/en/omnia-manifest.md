# Omnia One AI Principles and Capabilities

This manifesto explains why Omnia is designed as an offline-first, privacy-respecting AI assistant and how it works in practice. The statements are supported by the project's source code (IndexedDB chat database, Supabase sync layer, API routes) and current application features.

## 1. Offline-First Experience

- The local `OmniaChatDB` (Dexie/IndexedDB) stores chats and attachments directly in the browser so users can keep working without connectivity.  
- The sync layer (`src/services/sync/chatSync.js`) uploads data to the cloud only when a connection is available and honours user settings.  
- If Supabase environment variables are missing, the app switches to local mode and does not transmit data to the server.

## 2. Privacy and User Control

- Auth tokens are verified exclusively on the backend (service role); the client never receives privileged keys.  
- Supabase Row Level Security ensures users see only their own chats, messages and files.  
- Storage buckets enforce ownership; only the author can delete attachments, generated images or PDFs.  
- The `delete-account.js` function performs a full account wipe via `supabase.auth.admin.deleteUser`, cascading to profiles, chats and messages.  
- Chat deletions (`chatDB.deleteChat`) remove linked Storage files before database entries.  
- The application does not sell or disclose data to third parties beyond what is required for integrated AI services.

## 3. No Training on Customer Data

- API calls are configured to use "no training" or equivalent modes offered by providers (Google Vertex AI, Anthropic, OpenAI).  
- Runtime logs contain only technical metadata (status codes, request IDs) and exclude conversation content.

## 4. User Data Always Available

- Conversation history is accessible locally and, after sync, in Supabase.  
- The UI allows exports and keeps profiles for personalised prompts.  
- When switching devices, the `chatSyncService` restores conversations after login.

## 5. What Omnia Can Do

- **Text AI**: integrates Gemini 2.5 Flash, Claude Sonnet/Haiku and GPT-4o; users can switch models within the same context.  
- **Content generation**: create text, summaries, structured outputs, PDF reports (`api/generate-pdf.js`).  
- **File processing**: `api/process-document.js` handles both text uploads and PDFs via Google Document AI.  
- **Images**: generated images are saved to Supabase Storage (`generated-images`) and can be downloaded.  
- **Voice**: convert speech to text (`api/google-stt.js`) and text to speech (`api/google-tts.js`, `api/elevenlabs-tts.js`).  
- **Unlimited chats**: Omnia does not impose artificial chat limits; pagination and deletion keep storage manageable.  
- **Fast sharing**: Supabase Realtime mirrors conversation updates across devices.

## 6. Why Omnia Is Different

- Multiple AI models share a single context, enabling comparisons and seamless switching without losing history.  
- Offline-first architecture minimises latency and reinforces privacy by keeping data primarily with the user.  
- Security mechanisms (auth, storage, sync) are fully documented in the repository for easy auditing.  
- Teams can use Supabase metrics and exports to build additional workflows (billing, agent monitoring).  
- The app supports multiple languages (CZ, EN, RO, DE, etc.) and auto-detects language in text and voice flows.

## 7. Commitments to Users

- **Transparency**: current terms, privacy policy and this manifesto live in `pravni-dokumentace` and will be updated regularly.  
- **Data deletion**: account removal triggers backend deletion and clears Storage buckets.  
- **Open roadmap**: public documents in `docs/` describe planned improvements (agents, realtime sync).  
- **Feedback**: cristianbucioaca@omniaoneai.com is the primary contact for requests and incident reports.

---

This manifesto is a public statement on Omnia One AI's privacy stance, offline-first architecture and feature set as of 2 November 2025.
