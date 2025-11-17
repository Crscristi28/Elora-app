# Manifest Omnia One AI – principii și capabilități

Acest manifest explică de ce Omnia este proiectată ca un asistent AI offline-first, orientat spre confidențialitate, și cum funcționează în practică. Afirmațiile se sprijină pe codul din proiect (baza IndexedDB, sincronizarea Supabase, rutele API) și pe funcționalitățile actuale.

## 1. Experiență offline-first

- Baza locală `OmniaChatDB` (Dexie/IndexedDB) stochează chat-urile și atașamentele direct în browser, astfel încât utilizatorii pot continua și fără conexiune.  
- Stratul de sincronizare (`src/services/sync/chatSync.js`) trimite datele în cloud doar când există conexiune și ține cont de preferințele utilizatorului.  
- Dacă variabilele de mediu Supabase lipsesc, aplicația trece în modul local și nu transmite date.

## 2. Confidențialitate și control

- Token-urile sunt verificate doar pe backend (cheie de service); clientul nu primește acces privilegiate.  
- Politicile RLS Supabase asigură că utilizatorii văd numai chat-urile, mesajele și fișierele proprii.  
- Bucket-urile Storage aplică dreptul de proprietate; doar autorul poate șterge atașamentele, imaginile sau PDF-urile.  
- Funcția `delete-account.js` șterge complet contul prin `supabase.auth.admin.deleteUser`, incluzând profile, chat-uri și mesaje.  
- Ștergerea chat-urilor (`chatDB.deleteChat`) elimină întâi fișierele din Storage și apoi intrările din baze de date.  
- Omnia nu vinde și nu divulgă date terților decât în limitele API-urilor integrate.

## 3. Fără antrenament pe datele clienților

- Apelurile către API sunt configurate în modurile „no training” sau echivalente (Google Vertex AI, Anthropic, OpenAI).  
- Logurile runtime conțin doar metadate tehnice (coduri de status, ID-uri) și nu includ conținutul conversațiilor.

## 4. Datele utilizatorului sunt mereu accesibile

- Istoricul conversațiilor este disponibil local și, după sincronizare, în Supabase.  
- Interfața permite exportul și personalizează prompturile pe baza profilului.  
- La schimbarea dispozitivului, `chatSyncService` recuperează conversațiile după autentificare.

## 5. Ce poate face Omnia

- **AI text**: integrează Gemini 2.5 Flash, Claude Sonnet/Haiku și GPT-4o; utilizatorul poate comuta între modele în același context.  
- **Generare conținut**: text, rezumate, structuri, rapoarte PDF (`api/generate-pdf.js`).  
- **Procesare fișiere**: `api/process-document.js` suportă text și PDF via Google Document AI.  
- **Imagini**: imaginile generate se salvează în Supabase (`generated-images`) și pot fi descărcate.  
- **Voce**: conversie vorbire-text (`api/google-stt.js`) și text-vorbire (`api/google-tts.js`, `api/elevenlabs-tts.js`).  
- **Chat-uri nelimitate**: nu există limitări artificiale; paginarea și ștergerea mențin performanța.  
- **Sincronizare rapidă**: Supabase Realtime propagă actualizările pe toate dispozitivele.

## 6. De ce Omnia este diferită

- Mai multe modele AI împart același context, permițând comparații și comutări fără pierderea istoricului.  
- Arhitectura offline-first reduce latențele și întărește confidențialitatea, menținând datele la utilizator.  
- Mecanismele de securitate (auth, storage, sync) sunt documentate public pentru audit.  
- Echipele pot folosi metricile Supabase pentru fluxuri suplimentare (billing, monitorizare agenți).  
- Aplicația suportă mai multe limbi (RO, CZ, EN, DE etc.) și detectează automat limba în text și voce.

## 7. Angajamente față de utilizatori

- **Transparență**: termenii, politica de confidențialitate și acest manifest sunt disponibile în `pravni-dokumentace` și se actualizează.  
- **Ștergerea datelor**: ștergerea contului curăță și bucket-urile Storage.  
- **Planuri deschise**: documentele din `docs/` descriu dezvoltările viitoare (agenți, sync realtime).  
- **Feedback**: cristianbucioaca@omniaoneai.com este canalul principal pentru solicitări și incidente.

---

Manifest public privind angajamentul Omnia One AI față de confidențialitate, arhitectură offline-first și setul de funcții la data de 2 noiembrie 2025.
