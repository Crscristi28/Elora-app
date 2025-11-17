# Omnia One AI Privacy Policy

Effective date: 2 November 2025

This Privacy Policy explains what personal data the Omnia One AI application processes, for what purposes and how it is protected. The controller is Cristian Bucioaca, contact: cristianbucioaca@omniaoneai.com.

## 1. Roles under GDPR

- The Provider acts as the data controller for personal data submitted by users or generated while using the application.  
- Third-party platforms (Supabase, Google Cloud, OpenAI, Anthropic, ElevenLabs, Stripe) act as processors or independent controllers depending on the service they deliver.  
- Data are shared with third parties only to the extent necessary to provide the Service.

## 2. Categories of Processed Data

1. **Identification and login data**: e-mail, hashed password, internal user ID.  
2. **Profile information**: optional display name and nickname, preferred localisation.  
3. **Chat content and attachments**: text messages, system metadata, files uploaded by the user (PDF, images, documents), AI-generated outputs.  
4. **Technical metadata**: device ID, timestamps, browser version, error logs.  
5. **Usage metrics**: message counts, token usage, subscription activity (if enabled).  
6. **Payment data**: handled by Stripe; the application stores only reference identifiers (customer_id, subscription_id).  
7. **Voice data**: short-lived audio streams for speech-to-text or text-to-speech conversions; they are not stored after processing.

## 3. Purposes and Legal Basis

| Purpose | Data categories | Legal basis |
| --- | --- | --- |
| Providing core functionality (login, chat, sync) | identification, profile, chat content, technical | performance of contract (GDPR Art. 6(1)(b)) |
| Document processing, AI generation, voice features | chat content, attachments, voice data | performance of contract |
| Security and fraud prevention (logging, token checks) | technical metadata | legitimate interest (security) |
| Billing and invoicing | identification data, usage metrics, payment identifiers | performance of contract / legal obligation |
| Product improvement (aggregated analytics) | aggregated usage data | legitimate interest |

## 4. Data Sharing

- **Supabase** (EU regions): authentication, database (profiles, chats, messages), Storage (attachments, generated-images, generated-pdfs-temp), realtime.  
- **Google Cloud** (EU and US regions per configuration): Vertex AI Gemini, Document AI, Text-to-Speech, Speech-to-Text, Cloud Storage for temporary processing. Credentials are provided as JSON via server-side environment variables.  
- **Anthropic**: Claude API for generative responses and web search. Only the relevant conversation context and supported attachments are transmitted.  
- **OpenAI**: GPT-4o for additional generative capabilities. System instructions and portions of the conversation are sent as required.  
- **ElevenLabs**: Text-to-Speech streaming; only the current text response is transmitted.  
- **Stripe**: subscription management; only tokenised identifiers are stored in the application.  
- **Google Search / external sources**: when web search is enabled, the query is sent without personal identifiers.

No data are sold to third parties or shared for third-party marketing.

## 5. Storage and Retention

- **Supabase**: data are stored until the User deletes the chat or the entire account. The interface explains the effects and requires the User to type `DELETE` and confirm the action directly in-app; no e-mail confirmation is issued. After confirmation the backend `delete-account.js` calls `supabase.auth.admin.deleteUser` and cascades profiles, chats, messages and related Storage objects.  
- **IndexedDB** in the browser: the local `OmniaChatDB` database holds chats for offline access. Users can delete the data in settings or during sign-out.  
- **Temporary storage**: uploaded files processed through Document AI may be stored briefly in Google Cloud Storage; after completion both temporary files and metadata are removed.  
- **Server logs**: retained for up to 30 days for incident response and then anonymised or deleted.  
- **Invoices and payment records**: kept by Stripe in accordance with legal requirements.

## 6. Security Measures

- All tables in Supabase have Row Level Security rules enforcing `auth.uid()`.  
- Storage objects rely on the built-in `owner` field, allowing only the owner to delete files.  
- Access tokens are verified on the backend using the Supabase service role key.  
- Passwords are hashed by Supabase according to current security standards.  
- All API communication is encrypted (HTTPS).  
- When a chat is deleted the application removes Storage files first (`deleteStorageFiles`), then deletes conversations and sync records.  
- Access to critical credentials (Google, OpenAI, Anthropic, ElevenLabs) is limited to server-side code.

## 7. User Rights

Users have the following rights under GDPR:

1. **Access**: request a copy of their data (available via account export).  
2. **Rectification**: update profile information (handled by `ProfileService.saveProfile`).  
3. **Erasure**: delete chats, attachments or the entire account using the provided controls.  
4. **Restriction**: disable synchronisation or cancel subscriptions.  
5. **Portability**: request export of conversations in JSON/CSV format.  
6. **Objection**: object to processing based on legitimate interests.  
7. **Complaint**: lodge a complaint with the Office for Personal Data Protection (www.uoou.cz).

Requests can be sent to cristianbucioaca@omniaoneai.com. The Provider will respond within 30 days.

## 8. Automated Decision-Making

AI responses are generated using third-party models based on system instructions and conversation history. The Service does not apply automated decision-making that produces legal or similarly significant effects without human oversight. Subscription and billing follow transparent rules.

## 9. Changes to this Policy

This document may be updated when technical or legal changes occur. Users will be informed about significant changes by e-mail or in-app notice at least 14 days before they take effect. Previous versions are archived and can be provided on request.

---

This policy reflects the implementation of Omnia One AI as of 2 November 2025.
