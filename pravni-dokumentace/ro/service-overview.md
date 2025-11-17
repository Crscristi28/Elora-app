# Sumar servicii Omnia One AI

Acest document descrie ce face Omnia One AI, cum este proiectată și principalele funcționalități. Servește drept referință pentru comunicarea produsului și documentația juridică.

## 1. Concept

Omnia One AI este o aplicație React + Vite pentru web și mobil care oferă un asistent inteligent. Utilizatorii pot scrie, dicta, încărca fișiere și pot primi răspunsuri de la mai multe modele AI (Gemini, Claude, GPT-4o). Aplicația suportă mai multe limbi (română, cehă, engleză, germană etc.) și combină fluxuri text, documente și vizuale.

## 2. Module principale

- **Frontend (`src/`)**: componente React pentru chat, istoric, upload-uri, generare conținut și setări.  
- **IndexedDB**: baza locală `OmniaChatDB` pentru istoric offline.  
- **Sincronizare**: `chatSync.js` încarcă modificările în Supabase și primește actualizări realtime.  
- **API backend (`api/`)**: rute serverless (Vercel) pentru apeluri AI, funcții vocale, procesare documente și ștergere cont.  
- **Supabase**: autentificare, baze de date (`profiles`, `chats`, `messages`, `usage_metrics`, `subscriptions`) și Storage.  
- **Servicii plătite**: Stripe pentru abonamente, metrice pentru monitorizare.

## 3. Funcții pentru utilizatori

1. **Chat AI**: răspunsuri în timp real de la mai mulți furnizori.  
2. **Căutare web și citări**: `api/claude-web-search.js` întoarce surse salvate în `sources`.  
3. **Procesare documente**: upload prin `api/process-document.js`, cu suport pentru text și PDF (Google Document AI).  
4. **Generare imagini și PDF**: `api/imagen.js`, `api/generate-pdf.js` salvează rezultatele în Storage.  
5. **Instrumente vocale**: recunoaștere vocală (`api/google-stt.js`) și sinteză (`api/google-tts.js`, `api/elevenlabs-tts.js`).  
6. **Gestionarea contului**: înregistrare, autentificare, schimbare parolă, recuperare OTP, profil, ștergere cont.  
7. **Ștergere conținut**: eliminarea chat-urilor specifice sau a întregului cont, inclusiv atașamente.  
8. **Abonamente (opțional)**: tabela `subscriptions` și integrarea Stripe pentru planuri plătite.

## 4. Fluxuri de date

1. **Login**: utilizatorul trimite e-mail și parolă, Supabase returnează un JWT folosit pentru apelurile API.  
2. **Trimitere mesaj**: frontend-ul construiește lista `messages`, alege modelul și trimite JSON către endpoint (ex. `/api/gemini`). Backend-ul verifică token-ul, setează rolul și transmite răspunsul în streaming.  
3. **Upload fișier**: `/api/process-document` prelucrează direct textul sau apelează Google Document AI; metadatele sunt returnate și pot fi salvate în chat.  
4. **Generare imagine**: AI-ul returnează base64; backend-ul salvează în Supabase Storage și oferă un URL public.  
5. **Sincronizare**: `chatSyncService` compară datele locale cu cele din cloud, urcă mesaje noi și propagă ștergerile.  
6. **Ștergere**: `deleteChat` elimină fișierele din Storage și înregistrările asociate; `/api/delete-account` șterge complet contul.

## 5. Securitate și protecția datelor

- Autentificarea și autorizarea folosesc Supabase cu cheia de service pe backend.  
- Row Level Security blochează accesul la datele altor utilizatori.  
- Bucket-urile Storage verifică proprietarul, permițând ștergerea doar de către autor.  
- Rutele API aplică CORS, limitează metodele la POST/OPTIONS și validează inputul.  
- Token-urile și credențialele sunt păstrate în variabile de mediu (Vercel).  
- Istoricul chat-urilor este disponibil local și în Supabase; utilizatorul îl poate șterge oricând.  
- Logurile sunt minimale și axate pe diagnostic tehnic.

## 6. Integrare cu terți

| Furnizor | Scop | Date transferate |
| --- | --- | --- |
| Supabase | autentificare, baze de date, storage, realtime | ID utilizator, chat-uri, mesaje, fișiere |
| Google Cloud Vertex AI | răspunsuri Gemini | context conversație, instrucțiuni de sistem |
| Anthropic Claude | răspunsuri generative, căutare web | text, metadate, atașamente relevante |
| OpenAI | răspunsuri GPT-4o | fragmente de conversație și instrucțiuni |
| Google Document AI | analiză documente | conținutul fișierului încărcat |
| Google TTS/STT | servicii vocale | flux audio sau text |
| ElevenLabs | alternativă TTS | text pentru sinteză |
| Stripe | abonamente | identificatori utilizator, plan, status plată |

## 7. Controlul utilizatorului

- Interfața oferă butoane pentru ștergerea chat-urilor, a tuturor datelor și închiderea contului.  
- La ștergere apare dialogul de confirmare (`deleteConfirmation`).  
- Istoricul fișierelor arată atașamentele disponibile și link-urile de descărcare.  
- Setările de profil rețin doar câmpuri opționale (nume, pseudonim).  
- Dacă lipsesc cheile Supabase, aplicația funcționează offline fără a trimite date în cloud.

## 8. Tehnologie și deploy

- Vite gestionează build-ul (`npm run build`), iar deployment-ul standard este pe Vercel.  
- Rutele API folosesc Fetch API și transmit răspunsurile în format `application/x-ndjson`.  
- Pentru generarea PDF se folosește Puppeteer (`api/generate-pdf.js`).  
- Directorul `docs/` conține referințe tehnice detaliate (arhitectură, realtime, sync).

## 9. Limitări și avertismente

- Răspunsurile AI pot fi inexacte; documentația recomandă verificarea informațiilor esențiale.  
- Modelele terțe pot reține temporar date pentru diagnostic.  
- Lipsa unei chei API produce eroare imediat, evitând prelucrări incomplete.  
- Există limite de dimensiune (ex. 10 MB pentru audio în Google STT).  
- Modul offline se bazează pe securitatea browserului; nu există criptare suplimentară la nivel de aplicație.

---

Pregătit pe baza codului sursă la 2 noiembrie 2025.
