# Omnia Terms of Use

Effective date: 2 November 2025

These Terms govern use of the Omnia One AI application (the "Service") operated by Cristian Bucioaca, e-mail: cristianbucioaca@omniaoneai.com (the "Provider"). By accessing the Service you confirm that you have read and agree to these Terms.

## 1. Definitions

- **User**: Any natural or legal person who creates an account or otherwise uses the Service.  
- **User Content**: All information provided by the User, in particular e-mail, password, chat history, uploaded files, generated outputs and usage metadata.  
- **Service**: The Omnia web and mobile experience including the companion API routes.  
- **Third-Party Providers**: Supabase, Google Cloud (Vertex AI, Document AI, Text-to-Speech, Speech-to-Text), Anthropic (Claude), OpenAI, ElevenLabs and Stripe.

## 2. Scope of the Service

Omnia provides a multi-platform AI assistant that allows Users to:

- engage in text and voice conversations,  
- generate, analyse and summarise content,  
- upload and process files (text, PDF, images),  
- store chats and attachments for their own use,  
- synchronise conversations across devices through Supabase,  
- optionally subscribe to paid tiers processed through Stripe (if enabled).

## 3. Account Creation and Access

1. The User must provide accurate and up-to-date information during registration.  
2. Registration requires an e-mail address and password. Passwords are stored by Supabase in hashed form and are not accessible to the Provider.  
3. The User is responsible for safeguarding login credentials. Any activity performed via the account is deemed to be the User's activity.

## 4. Content Access and Responsibility

1. The User retains full control over their conversations and may delete individual chats or the entire account at any time.  
2. Content created by the Provider (for example system prompts) remains the intellectual property of the Provider.  
3. The Provider does not guarantee the accuracy, truthfulness or legal suitability of AI-generated outputs. The User must independently verify critical information before relying on it.

## 5. Prohibited Conduct

The User must not:

- use the Service for unlawful, fraudulent or harmful purposes,  
- upload content that infringes third-party rights,  
- attempt to compromise the security or availability of the Service,  
- reverse-engineer or bypass safeguards (such as Supabase RLS policies),  
- overload the Service or otherwise harm the Provider or other users.

## 6. Payments and Subscription

When paid tiers are offered:

1. Payment information is processed by Stripe as an independent data controller.  
2. Users may be charged recurring fees depending on the selected plan.  
3. Failure to pay may result in suspension or termination of the Service.  
4. Subscriptions can be cancelled in the account settings or following Stripe's instructions.

## 7. Third-Party Integrations

The Provider makes the Service work by integrating with:

- Supabase (authentication, database, Storage, realtime).  
- Google Cloud (Vertex AI, Document AI, Text-to-Speech, Speech-to-Text, Cloud Storage).  
- Anthropic (Claude API), OpenAI (Chat Completions), Google Vertex AI Gemini.  
- ElevenLabs (Text-to-Speech).  
- Stripe (payments).  

Using the Service implies consent to the transfer of necessary data to these providers for the purpose of fulfilling the contract.

## 8. Availability and Changes

1. The Service is provided on an "as is" basis. The Provider does not guarantee uninterrupted or error-free operation.  
2. The Provider may change, temporarily limit or discontinue the Service when necessary (e.g. security, maintenance).  
3. Material changes affecting Users will be announced via in-app notifications or e-mail when available.

## 9. Termination

1. The User may delete their account at any time. Before final deletion the interface explains the consequences, requires the User to type `DELETE` and confirm the action; no confirmation e-mail is sent. Once confirmed, the Supabase cascade removes auth.users, profiles, chats, messages and associated Storage objects through the `supabase.auth.admin.deleteUser` action.  
2. The Provider may terminate access if the User breaches these Terms or applicable law. Whenever feasible, the User will be warned in advance.  
3. After termination all data are permanently deleted and cannot be restored once the backend deletion has completed.

## 10. Warranty and Liability

1. The Provider is not liable for direct or indirect damages resulting from use of AI outputs, loss of data or downtime.  
2. Liability is limited except in cases of intent or gross negligence by the Provider.  
3. The User is responsible for the content they submit or create and must ensure compliance with applicable law and licence terms.

## 11. Changes to the Terms

1. The Provider may update these Terms.  
2. Users will be informed about substantial updates by e-mail or in-app notice at least 14 days before they take effect.  
3. Continuing to use the Service after the effective date constitutes acceptance of the updated Terms. Users who disagree may delete their account.

## 12. Governing Law

1. These Terms are governed by the laws of the Czech Republic.  
2. Disputes will be handled by the competent courts at the Provider's seat or residence.

## 13. Contact

For questions regarding the Service or these Terms please contact cristianbucioaca@omniaoneai.com.

---

This document is based on the current functionality of Omnia One AI as observed in the project's source code on the effective date.
