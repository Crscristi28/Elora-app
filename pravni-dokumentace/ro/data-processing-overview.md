# Registrul prelucrărilor de date Omnia One AI

Acest registru documentează activitățile de prelucrare efectuate de Omnia One AI, în conformitate cu articolul 30 GDPR. Informațiile se bazează pe implementarea curentă (schema Supabase, rutele API, serviciile front-end).

## 1. Set de date: Conturi de utilizator

- **Descriere**: Înregistrare prin Supabase Auth, cu intrări în `auth.users` și `profiles`.  
- **Categorii de date**: e-mail, parolă hash-uită, ID utilizator, rol, nume, pseudonim, localizare preferată, timestamp-uri.  
- **Persoane vizate**: utilizatori înregistrați.  
- **Scop**: creare și întreținere cont, personalizarea AI.  
- **Temei legal**: executarea contractului.  
- **Destinatari**: Supabase (UE).  
- **Păstrare**: pe durata existenței contului; ștergere via `delete-account.js`.  
- **Securitate**: RLS, transport criptat, parole hash-uite, cheia de service doar pe backend.

## 2. Set de date: Mesaje și context

- **Descriere**: Tabele `chats`, `messages`, baza locală IndexedDB `OmniaChatDB`.  
- **Categorii de date**: text, metadate (timestamp, sender, device_id, sources), atașamente (fișiere, imagini, PDF), răspunsuri AI.  
- **Persoane vizate**: utilizatori înregistrați.  
- **Scop**: furnizarea asistentului conversațional, păstrarea istoricului, continuitate.  
- **Temei legal**: executarea contractului.  
- **Destinatari**: Supabase, furnizorii AI (Google Vertex AI, Anthropic, OpenAI) pentru fragmentele relevante.  
- **Păstrare**: până la ștergerea chat-ului sau a contului; local poate fi eliminat oricând.  
- **Ștergere**: `deleteChat` elimină întâi fișierele din Storage, apoi înregistrările din IndexedDB și Supabase.  
- **Securitate**: RLS `auth.uid()`, verificarea proprietarului în Storage, stocare offline în browser.

## 3. Set de date: Fișiere încărcate și rezultate

- **Descriere**: bucket-uri Supabase Storage (attachments, generated-images, generated-pdfs-temp), Google Cloud Storage pe durata procesării documentelor, cache local.  
- **Categorii de date**: conținutul fișierelor încărcate, imagini generate de AI, PDF-uri, metadate (nume, dimensiune, cale, publicUrl).  
- **Persoane vizate**: utilizatori înregistrați.  
- **Scop**: analiză de documente, generare de resurse, descărcare de către utilizator.  
- **Temei legal**: executarea contractului; consimțământ implicit dacă sunt furnizate date sensibile.  
- **Destinatari**: Supabase Storage (UE), Google Document AI și Cloud Storage, ElevenLabs (pentru TTS).  
- **Păstrare**: până la ștergerea fișierului sau a contului; stocarea temporară se curăță după finalizare.  
- **Securitate**: RLS pe Storage (ștergere doar de către proprietar), HTTPS, validare MIME, ștergere fișiere înaintea ștergerii chat-ului.

## 4. Set de date: Comunicare vocală

- **Descriere**: audio trimis către `api/google-stt.js` și `api/elevenlabs-stt.js`, text trimis către `api/elevenlabs-tts.js` și `api/google-tts.js`.  
- **Categorii de date**: înregistrări audio scurte, transcrieri, audio generat.  
- **Persoane vizate**: utilizatori (și eventual alte persoane surprinse în înregistrare).  
- **Scop**: funcții speech-to-text și text-to-speech.  
- **Temei legal**: executarea contractului.  
- **Destinatari**: Google Speech-to-Text, ElevenLabs.  
- **Păstrare**: audio-ul nu este stocat după transcriere; fluxurile MP3 nu sunt arhivate.  
- **Securitate**: limite de dimensiune, sanitizare input, HTTPS.

## 5. Set de date: Metrice operaționale

- **Descriere**: tabela `usage_metrics`, log-uri locale, analize agregate.  
- **Categorii de date**: user_id, tip metrică (mesaje, tokeni), valoare, dată.  
- **Persoane vizate**: utilizatori înregistrați.  
- **Scop**: monitorizare, facturare, prevenirea abuzurilor.  
- **Temei legal**: interes legitim; executarea contractului pentru facturare.  
- **Destinatari**: Supabase (UE), Stripe (referințe de facturare).  
- **Păstrare**: până la 24 de luni sau până la ștergerea contului.  
- **Securitate**: RLS, acces doar cu sesiuni autentificate.

## 6. Set de date: Facturare

- **Descriere**: integrare Stripe, tabela `subscriptions`.  
- **Categorii de date**: user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, perioade de facturare.  
- **Persoane vizate**: utilizatori cu abonamente active.  
- **Scop**: evidența plăților, emiterea facturilor, suport clienți.  
- **Temei legal**: executarea contractului; obligație legală (contabilitate).  
- **Destinatari**: Stripe (UE/SUA).  
- **Păstrare**: conform politicilor Stripe și cerințelor legale (minimum 5 ani).  
- **Securitate**: identificatori tokenizați; aplicația nu stochează date de card. Ștergerea se face prin dashboard-ul Stripe sau API.

## 7. Set de date: Suport și comunicare

- **Descriere**: corespondență prin e-mail, șabloane de notificare Supabase.  
- **Categorii de date**: e-mail, conținutul mesajului, detalii despre problemă.  
- **Persoane vizate**: utilizatori care contactează suportul.  
- **Scop**: răspuns la solicitări, rezolvarea incidentelor.  
- **Temei legal**: interes legitim.  
- **Destinatari**: furnizorul de e-mail al Omnia (omniaoneai.com).  
- **Păstrare**: pe durata soluționării + 12 luni pentru audit.  
- **Securitate**: acces limitat la Furnizor; transmitere e-mail TLS.

## 8. Gestionarea drepturilor persoanelor vizate

- Solicitările sunt primite la cristianbucioaca@omniaoneai.com.  
- Identitatea este verificată prin deținerea contului Supabase; pot fi cerute date suplimentare.  
- Exportul include profil, listă de chat-uri, conținut, metrice și metadatele fișierelor.  
- Ștergerea declanșează `delete-account.js` și verificarea manuală a bucket-urilor Storage.  
- Răspunsul este furnizat în 30 de zile; pentru cazuri complexe, termenul poate fi prelungit cu 30 de zile și Utilizatorul este informat.

---

Actualizat la 2 noiembrie 2025. Modificările ulterioare ale implementării vor fi reflectate în edițiile următoare.
