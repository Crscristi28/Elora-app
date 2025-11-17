# Omnia One AI Service Summary

This document summarises what Omnia One AI does, how it is designed and its main capabilities. It acts as a reference for product communication and supporting legal documentation.

## 1. Concept

Omnia One AI is a React + Vite application tailored for web and mobile experiences that delivers an intelligent assistant. Users can write, speak, upload files and receive responses from multiple AI models (Gemini, Claude, GPT-4o). The application supports several languages (CZ, EN, RO, DE and more) and combines text, document and visual workflows.

## 2. Core Modules

- **Frontend (`src/`)**: React components for chat, history, uploads, content generation and settings.  
- **IndexedDB**: local database `OmniaChatDB` for offline chat history.  
- **Synchronisation**: `chatSync.js` uploads changes to Supabase and receives realtime updates.  
- **Backend API (`api/`)**: serverless routes (Vercel) for AI calls, voice features, document processing and account deletion.  
- **Supabase**: authentication, database (`profiles`, `chats`, `messages`, `usage_metrics`, `subscriptions`) and Storage.  
- **Paid services**: Stripe for subscriptions, usage metrics for billing insights.

## 3. User Features

1. **AI chat**: real-time responses across multiple providers.  
2. **Web search and citations**: `api/claude-web-search.js` returns sources saved as `sources`.  
3. **Document handling**: uploads via `api/process-document.js` supporting plain text and PDF (Google Document AI).  
4. **Image and PDF generation**: `api/imagen.js`, `api/generate-pdf.js` store results in Storage.  
5. **Voice tools**: speech recognition (`api/google-stt.js`) and speech synthesis (`api/google-tts.js`, `api/elevenlabs-tts.js`).  
6. **Account management**: registration, login, password change, OTP recovery, profile settings, account deletion.  
7. **Content deletion**: remove specific chats or the entire account including attachments.  
8. **Subscriptions (optional)**: `subscriptions` table and Stripe integration handle paid plans.

## 4. Data Flows

1. **Login**: user submits e-mail/password, Supabase returns a JWT used for subsequent API calls.  
2. **Message sending**: the frontend assembles `messages`, selects the AI model and sends JSON to the corresponding endpoint (e.g. `/api/gemini`). The backend verifies the token, adds the role and streams the AI response.  
3. **File upload**: `/api/process-document` handles either direct text processing or delegates to Google Document AI. Metadata are returned and can be stored in the chat.  
4. **Image generation**: the AI returns base64; the backend saves it to Supabase Storage and responds with a public URL.  
5. **Synchronisation**: `chatSyncService` compares local and cloud data, uploads new messages and mirrors deletions.  
6. **Deletion**: `deleteChat` removes Storage files and related database entries; total account deletion uses `/api/delete-account`.

## 5. Security and Data Protection

- Authentication and authorisation rely on Supabase with server-side service role keys.  
- Row Level Security prevents access to other users' data.  
- Storage buckets check ownership so only the file owner can delete assets.  
- API routes enforce CORS, limit methods to POST/OPTIONS and validate inputs.  
- Tokens and credentials are stored in environment variables (Vercel secret manager).  
- Chat history lives locally and in Supabase; Users can remove it at any time.  
- Logging is minimal and focused on technical diagnostics.

## 6. Third-Party Integrations

| Provider | Purpose | Data transferred |
| --- | --- | --- |
| Supabase | authentication, database, storage, realtime | user ID, chats, messages, files |
| Google Cloud Vertex AI | Gemini responses | current conversation context, system prompts |
| Anthropic Claude | generative replies, web search | message text, metadata, relevant attachments |
| OpenAI | GPT-4o responses | conversation snippets and system instructions |
| Google Document AI | document parsing | uploaded file content |
| Google TTS/STT | voice services | audio stream or text |
| ElevenLabs | TTS fallback | text to synthesise |
| Stripe | subscriptions | user identifiers, plan, payment status |

## 7. User Control

- The UI offers controls to delete chats, clear all data and close the account.  
- Deletion prompts confirm the action (`deleteConfirmation`).  
- Upload history shows available attachments and download links.  
- Profile settings store only optional fields (name, nickname).  
- When Supabase credentials are missing, the app works offline without sending data to the cloud.

## 8. Technology and Deployment

- Vite powers builds (`npm run build`), typical deployment is on Vercel.  
- API routes use the Fetch API and stream responses using `application/x-ndjson`.  
- PDF generation relies on Puppeteer (`api/generate-pdf.js`).  
- The `docs/` directory contains deeper technical references (architecture, realtime, sync).

## 9. Limitations and Warnings

- AI outputs can be inaccurate; documentation encourages verification.  
- Third-party models may retain data briefly for diagnostics.  
- Missing API keys result in immediate errors to avoid partial processing.  
- File size limits apply (e.g. 10 MB for Google STT audio).  
- Offline mode depends on browser security; no additional app-level encryption is applied.

---

Prepared based on the project source code as of 2 November 2025.
