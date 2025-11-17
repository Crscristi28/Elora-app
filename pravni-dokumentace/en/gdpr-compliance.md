# Omnia One AI GDPR Compliance Checklist

Date: 2 November 2025

This checklist summarises how Omnia One AI meets the key GDPR requirements and outlines risk management procedures.

## 1. Controller and Contacts

- **Controller**: Cristian Bucioaca, Omnia One AI.  
- **Privacy contact**: cristianbucioaca@omniaoneai.com.  
- No dedicated DPO is appointed; the Controller handles data protection matters directly.

## 2. Legal Basis

- Performance of contract (Art. 6(1)(b)): account creation, AI assistant features, subscription management.  
- Legal obligation (Art. 6(1)(c)): tax and accounting records handled via Stripe.  
- Legitimate interest (Art. 6(1)(f)): security logging, incident handling, aggregated analytics.  
- Consent (Art. 6(1)(a)): only when the User voluntarily submits sensitive data; not required for core functionality.

## 3. Data Minimisation and Storage Limitation

- Active RLS policies ensure users access only their own records.  
- Local IndexedDB keeps data solely for offline functionality; Users can wipe it in-app.  
- Supabase Storage holds only files linked to current chats; deleting a chat removes attachments.  
- Logs include only essential identifiers (ID, timestamp, status code).

## 4. Data Subject Rights

1. **Access**: Users can request exports; responses provided within 30 days.  
2. **Rectification**: profile data editable via `ProfileService.saveProfile`.  
3. **Erasure**: `delete-account.js` removes the account and cascaded data.  
4. **Restriction**: Users may disable sync or cancel subscriptions.  
5. **Portability**: exports available in JSON/CSV format from Supabase.  
6. **Objection**: Users can challenge processing based on legitimate interests; a balancing test is documented.  
7. **Complaint**: Users may contact the Office for Personal Data Protection (www.uoou.cz).

## 5. Processor Agreements

- **Supabase**: DPA included in the subscription; EU data hosting.  
- **Google Cloud**: DPA covering Vertex AI, Document AI, Cloud Storage, TTS, STT. Regions configured for `us-central1` (Vertex) and the selected Document AI region.  
- **Anthropic**: API terms specify short-term retention for quality evaluation.  
- **OpenAI**: Data Processing Addendum governs API usage; HTTPS connection enforced.  
- **ElevenLabs**: processes text inputs for speech synthesis without long-term storage.  
- **Stripe**: independent controller of payment information with its own DPA.

## 6. Risk Assessment and DPIA

- The application handles conversational text that may include sensitive information entered by the User.  
- Risks are mitigated because data are visible only to the User and the AI processing providers; nothing is publicly shared.  
- Given the scope, limited monitoring and user base, a formal DPIA is not currently required. Internal records and technical documentation are kept to support future audits.  
- If Omnia introduces automated decisions with significant legal effect, a DPIA will be prepared.

## 7. Security Measures

- Encrypted transport (HTTPS) for all API calls.  
- Service role keys stored on the backend only.  
- Automatic removal of Storage files before deleting chats.  
- Input validation (file size limits, text sanitisation before TTS).  
- Minimal logging with restricted access.  
- Regular dependency updates (npm audit, CVE monitoring).

## 8. Incident Response Plan

1. Detect incidents through logs (`console.error`, Vercel/Supabase monitoring).  
2. Revoke compromised API keys and Supabase sessions immediately.  
3. Assess impact: identify affected tables/users.  
4. Notify affected users via e-mail without undue delay (within 72 hours if a personal data breach is likely to cause risk).  
5. Report to the supervisory authority when necessary.  
6. Document the incident and update this plan.

## 9. Documentation and Audit Trail

- This is version 1.0 stored in the `pravni-dokumentace` repository folder.  
- Updates are tracked via Git history for traceability.  
- Any functional change affecting data processing requires reviewing this checklist and the processing overview.

---

This checklist is a working document illustrating GDPR compliance and should be complemented with signed processor agreements and operational procedures relevant to production deployment.
