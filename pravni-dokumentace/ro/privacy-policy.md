# Politica de confidențialitate Omnia One AI

Data intrării în vigoare: 2 noiembrie 2025

Această Politică explică ce date personale procesează aplicația Omnia One AI, în ce scop și cum sunt protejate. Operatorul de date este Cristian Bucioaca, contact: cristianbucioaca@omniaoneai.com.

## 1. Roluri conform GDPR

- Furnizorul acționează ca operator pentru datele personale furnizate de utilizatori sau generate în timpul utilizării aplicației.  
- Platformele terțe (Supabase, Google Cloud, OpenAI, Anthropic, ElevenLabs, Stripe) acționează ca persoane împuternicite sau operatori independenți, în funcție de serviciul prestat.  
- Datele sunt partajate cu terți numai în măsura necesară pentru furnizarea Serviciului.

## 2. Categorii de date procesate

1. **Date de identificare și autentificare**: e-mail, parolă criptată, ID intern de utilizator.  
2. **Informații de profil**: nume afișat și pseudonim opțional, limbă preferată.  
3. **Conținut de chat și atașamente**: mesaje text, metadate de sistem, fișiere încărcate (PDF, imagini, documente), rezultate generate de AI.  
4. **Metadate tehnice**: ID dispozitiv, marcaje de timp, versiune browser, jurnale de erori.  
5. **Metrice de utilizare**: număr de mesaje, tokeni consumați, activitate de abonare (dacă este cazul).  
6. **Date de plată**: gestionate de Stripe; aplicația stochează doar identificatori de referință (customer_id, subscription_id).  
7. **Date vocale**: fluxuri audio temporare pentru funcțiile speech-to-text sau text-to-speech; nu sunt stocate după procesare.

## 3. Scopuri și temeiuri legale

| Scop | Categorii de date | Temei legal |
| --- | --- | --- |
| Furnizarea funcțiilor principale (login, chat, sincronizare) | identificare, profil, conținut chat, tehnice | executarea contractului (art. 6 alin. 1 lit. b) GDPR) |
| Procesarea documentelor, generarea AI, funcții vocale | conținut chat, atașamente, date vocale | executarea contractului |
| Securitate și prevenire fraudă (logare, verificare token) | metadate tehnice | interes legitim (securitate) |
| Facturare și emitere facturi | date de identificare, metrice, identificatori de plată | executarea contractului / obligație legală |
| Îmbunătățirea produsului (analiză agregată) | date agregate de utilizare | interes legitim |

## 4. Partajarea datelor

- **Supabase** (centre din UE): autentificare, baze de date (profiles, chats, messages), Storage (attachments, generated-images, generated-pdfs-temp), realtime.  
- **Google Cloud** (regiuni din UE și SUA conform configurației): Vertex AI Gemini, Document AI, Text-to-Speech, Speech-to-Speech, Cloud Storage pentru procesare temporară. Credentialele sunt furnizate ca JSON în variabile de mediu pe server.  
- **Anthropic**: API Claude pentru răspunsuri generative și căutare web; se transmit doar contextul relevant și atașamentele acceptate.  
- **OpenAI**: GPT-4o pentru funcționalități suplimentare; se trimit instrucțiuni de sistem și părți din conversație.  
- **ElevenLabs**: streaming Text-to-Speech; se transmite doar textul curent.  
- **Stripe**: gestionarea abonamentelor; aplicația reține doar identificatori tokenizați.  
- **Căutare Google / surse externe**: la activarea căutării web, interogarea este trimisă fără date personale.

Datele nu sunt vândute terților și nu sunt partajate pentru marketing-ul acestora.

## 5. Stocare și retenție

- **Supabase**: datele sunt păstrate până când Utilizatorul șterge chatul sau întregul cont. Înainte de ștergere, interfața explică efectele, solicită introducerea textului `DELETE` și confirmarea acțiunii în aplicație; nu se trimite e-mail suplimentar. După confirmare, scriptul `delete-account.js` apelează `supabase.auth.admin.deleteUser` și elimină profile, chat-uri, mesaje și fișierele asociate.  
- **IndexedDB** în browser: baza locală `OmniaChatDB` păstrează chaturile pentru acces offline. Utilizatorul poate șterge datele din setări sau la deconectare.  
- **Stocare temporară**: fișierele procesate prin Document AI pot fi păstrate temporar în Google Cloud Storage; după finalizare, fișierele și metadatele temporare sunt șterse.  
- **Loguri server**: păstrate până la 30 de zile pentru rezolvarea incidentelor, apoi anonimizate sau eliminate.  
- **Facturi și evidențe de plată**: păstrate de Stripe conform obligațiilor legale.

## 6. Măsuri de securitate

- Toate tabelele Supabase au politici Row Level Security care impun `auth.uid()`.  
- Obiectele din Storage folosesc coloana `owner`, astfel încât doar proprietarul poate șterge fișierele.  
- Tokenurile sunt verificate pe backend folosind cheia de service Supabase.  
- Parolele sunt criptate de Supabase conform standardelor actuale.  
- Toate comunicările API sunt criptate (HTTPS).  
- La ștergerea unui chat, aplicația elimină mai întâi fișierele din Storage (`deleteStorageFiles`), apoi șterge conversațiile și înregistrările de sincronizare.  
- Accesul la credențialele critice (Google, OpenAI, Anthropic, ElevenLabs) este limitat la codul serverului.

## 7. Drepturile utilizatorilor

Utilizatorii beneficiază de următoarele drepturi conform GDPR:

1. **Acces**: solicitarea unei copii a datelor (disponibilă prin export din cont).  
2. **Rectificare**: actualizarea informațiilor de profil (`ProfileService.saveProfile`).  
3. **Ștergere**: eliminarea chat-urilor, atașamentelor sau a întregului cont din interfață.  
4. **Restricționare**: dezactivarea sincronizării sau anularea abonamentelor.  
5. **Portabilitate**: solicitarea exportului conversațiilor în format JSON/CSV.  
6. **Opoziție**: contestarea prelucrărilor bazate pe interes legitim.  
7. **Plângere**: depunerea unei sesizări la Autoritatea Națională de Supraveghere a Prelucrării Datelor (www.dataprotection.ro). *(Tradus din exemplul UOOU; adaptați după caz.)*

Cererile pot fi trimise la cristianbucioaca@omniaoneai.com. Furnizorul va răspunde în maximum 30 de zile.

## 8. Decizii automate

Răspunsurile AI sunt generate cu modele terțe pe baza instrucțiunilor și a istoricului conversației. Serviciul nu aplică decizii automatizate cu efecte juridice sau similare fără intervenție umană. Abonamentele și facturarea urmează reguli transparente.

## 9. Modificarea politicii

Documentul poate fi actualizat în funcție de schimbările tehnice sau legale. Utilizatorii vor fi informați despre modificările importante cu cel puțin 14 zile înainte prin e-mail sau notificări în aplicație. Versiunile vechi sunt arhivate și pot fi furnizate la cerere.

---

Politica reflectă implementarea Omnia One AI la data de 2 noiembrie 2025.
