# Omnia One AI Data Processing Overview

This record documents the processing activities carried out by Omnia One AI in line with GDPR Article 30. It is based on the current implementation (Supabase schema, API routes, frontend services).

## 1. Dataset: User Accounts

- **Description**: Registration through Supabase Auth, corresponding entries in `auth.users` and `profiles`.  
- **Data categories**: e-mail, password hash, user ID, role, name, nickname, preferred locale, timestamps.  
- **Data subjects**: registered users.  
- **Purpose**: account creation and maintenance, AI personalisation.  
- **Legal basis**: performance of contract.  
- **Recipients**: Supabase (EU).  
- **Retention**: for the life of the account; deleted via `delete-account.js`.  
- **Security**: RLS, encrypted transport, hashed passwords, service role limited to backend.

## 2. Dataset: Chat Messages and Context

- **Description**: Tables `chats`, `messages`, local IndexedDB `OmniaChatDB`.  
- **Data categories**: message text, metadata (timestamps, sender, device_id, sources), attachments (files, images, pdf), AI responses.  
- **Data subjects**: registered users interacting with the AI assistant.  
- **Purpose**: provide conversational AI, preserve history, ensure continuity.  
- **Legal basis**: performance of contract.  
- **Recipients**: Supabase, AI providers (Google Vertex AI, Anthropic, OpenAI) for the relevant conversation snippets.  
- **Retention**: until the chat or account is deleted; locally removable at any time.  
- **Deletion**: `deleteChat` removes Storage objects first, then rows in IndexedDB and Supabase.  
- **Security**: RLS `auth.uid()`, Storage ownership enforcement, reliance on browser storage for offline data.

## 3. Dataset: Uploaded Files and Generated Assets

- **Description**: Supabase Storage buckets (attachments, generated-images, generated-pdfs-temp), Google Cloud Storage during document processing, local cache.  
- **Data categories**: file contents uploaded by the user, AI generated images, PDFs, metadata (name, size, path, publicUrl).  
- **Data subjects**: registered users.  
- **Purpose**: document analysis, asset generation, download by the User.  
- **Legal basis**: performance of contract; in exceptional cases user consent if sensitive data are voluntarily provided.  
- **Recipients**: Supabase Storage (EU), Google Document AI and Cloud Storage, ElevenLabs (for TTS output).  
- **Retention**: until the specific file or account is deleted; temporary stores are cleared after completion.  
- **Security**: Storage RLS (owner-only delete), HTTPS, MIME validation, removal of Storage data before chat deletion.

## 4. Dataset: Voice Communication

- **Description**: Audio sent to `api/google-stt.js` and `api/elevenlabs-stt.js`, text sent to `api/elevenlabs-tts.js` and `api/google-tts.js`.  
- **Data categories**: short audio recordings, transcripts, generated audio.  
- **Data subjects**: registered users (and anyone captured in recordings).  
- **Purpose**: speech-to-text and text-to-speech functionality.  
- **Legal basis**: performance of contract.  
- **Recipients**: Google Speech-to-Text, ElevenLabs.  
- **Retention**: audio is not stored after transcription; generated MP3 streams are not archived.  
- **Security**: file size limits, input sanitisation, HTTPS.

## 5. Dataset: Operational and Usage Metrics

- **Description**: Table `usage_metrics`, local logs, aggregated analytics.  
- **Data categories**: user_id, metric type (messages, tokens), value, date.  
- **Data subjects**: registered users.  
- **Purpose**: monitoring, billing, abuse prevention.  
- **Legal basis**: legitimate interest; performance of contract for billing.  
- **Recipients**: Supabase (EU), Stripe (for billing references).  
- **Retention**: up to 24 months or until the account is deleted.  
- **Security**: RLS, access only via authenticated sessions.

## 6. Dataset: Billing

- **Description**: Stripe integration, `subscriptions` table.  
- **Data categories**: user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, billing period timestamps.  
- **Data subjects**: users with active subscriptions.  
- **Purpose**: payment records, invoicing, customer support.  
- **Legal basis**: performance of contract; legal obligation (bookkeeping).  
- **Recipients**: Stripe (EU/US).  
- **Retention**: according to Stripe policies and legal requirements (minimum 5 years).  
- **Security**: tokenised references; card data are never stored in the application. Deletion handled through Stripe dashboards or API.

## 7. Dataset: Support and Communication

- **Description**: Support e-mails, Supabase notification templates.  
- **Data categories**: e-mail, message content, issue details.  
- **Data subjects**: users contacting support.  
- **Purpose**: responding to enquiries, resolving incidents.  
- **Legal basis**: legitimate interest.  
- **Recipients**: Omnia's mail provider (omniaoneai.com).  
- **Retention**: during ticket resolution + 12 months for audit.  
- **Security**: access limited to the Provider; TLS-secured mail transmission.

## 8. Handling Data Subject Requests

- Requests are accepted at cristianbucioaca@omniaoneai.com.  
- Identity verification uses Supabase account ownership; additional details may be requested if necessary.  
- Exports include profile data, chat lists, message content, metrics and file metadata.  
- Deletion triggers `delete-account.js` plus manual verification that Storage buckets are clear.  
- Responses are provided within 30 days; complex cases may extend the deadline by an additional 30 days with notification.

---

Updated 2 November 2025. Future implementation changes will be reflected in subsequent versions of this overview.
