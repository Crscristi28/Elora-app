# Autentificare și securitate în Omnia

Acest document descrie modul în care sunt implementate autentificarea, autorizarea și protecția datelor în Omnia One AI. Informațiile provin din fișierele din directoarele `api/`, `src/services/`, `supabase/` și din documentația Supabase.

## 1. Înregistrare și autentificare

- Înregistrarea și login-ul folosesc Supabase Auth (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`).  
- Supabase păstrează parolele hash-uite (bcrypt) și emite token-uri JWT care expiră după 60 de minute și se reînnoiesc automat.  
- Pe client, `src/services/auth/supabaseAuth.js` oferă funcții pentru autentificare, delogare, resetare parolă (OTP) și ascultare a stării sesiunii.  
- Token-urile nu sunt transmise direct către servicii terțe; la apelarea API-urilor Omnia sunt trimise prin antetul `Authorization: Bearer`.

## 2. Verificare pe backend

- Rutele de pe server (`api/claude.js`, `api/gemini.js` etc.) inițializează Supabase cu cheia de service (`SUPABASE_SERVICE_ROLE_KEY`).  
- Fiecare cerere extrage token-ul JWT din antet și îl verifică prin `supabase.auth.getUser(token)`.  
- Token-urile invalide returnează status `401 Unauthorized`.  
- După verificare, backend-ul interoghează tabela `profiles` pentru a afla rolul utilizatorului; lipsa unui profil implică rolul implicit `user`.

## 3. Roluri și permisiuni

- Tabela `profiles` include coloana `role` (ex. `user`, `owner`).  
- Rolurile pot fi configurate prin scriptul SQL `supabase/add-admin-role.sql`.  
- Backend-ul folosește rolul pentru a debloca funcții privilegiate (instrumente de administrare, acces prioritar).  
- Dacă rolul nu este găsit, sistemul revine la permisiunile standard de utilizator.

## 4. Row Level Security și acces la bază

- Tabelele critice (`chats`, `messages`, `profiles`, `usage_metrics`, `subscriptions`) folosesc Row Level Security.  
- Politicile impun `auth.uid() = user_id` (sau `auth.uid() = id` pentru `profiles`), astfel încât Utilizatorii accesează doar propriile înregistrări.  
- Inserările și ștergerile necesită ca rândul să aparțină utilizatorului autentificat.  
- Triggere precum `update_updated_at_column` actualizează câmpul `updated_at` pentru sincronizare.

## 5. Stocarea fișierelor

- Atașamentele sunt stocate în Supabase Storage (bucket `attachments`), imaginile AI în `generated-images`, iar PDF-urile în `generated-pdfs-temp`.  
- Încărcările prin `supabase.storage.from(bucket).upload(...)` setează automat `owner = auth.uid()`.  
- Ștergerile folosesc `deleteFromSupabaseStorage`, permis doar proprietarului datorită politicilor Storage.  
- La ștergerea chat-ului (`chatDB.deleteChat`), fișierele asociate sunt eliminate înainte de înregistrările din `messages` și `chats`.

## 6. Stocare locală și sincronizare

- IndexedDB (Dexie) păstrează datele offline sub numele `OmniaChatDB`.  
- Versiunile de schemă adaugă coloane noi (attachments, images, pdf, sources) cu log-uri de migrare.  
- Sincronizarea cu Supabase este gestionată de `src/services/sync/chatSync.js`, care verifică autentificarea înainte de upload și transmite doar înregistrările utilizatorului curent.  
- Ștergerile se propagă via Supabase Realtime, astfel încât celelalte dispozitive primesc actualizările.

## 7. Ștergerea contului și a datelor

- Endpoint-ul `api/delete-account.js` apelează `supabase.auth.admin.deleteUser(userId)` pentru a șterge contul, declanșând ștergeri în cascade (profil, chat-uri, mesaje, fișiere).  
- Operațiunea este ireversibilă; datele nu pot fi recuperate după finalizare.  
- Utilizatorii își pot exporta conversațiile înainte de a solicita ștergerea.

## 8. Chei API și acces terț

- Toate secretele (Google, Anthropic, OpenAI, ElevenLabs, Stripe) sunt încărcate din variabile de mediu și nu sunt expuse clientului.  
- Backend-ul verifică existența cheilor și, în caz de lipsă, răspunde cu HTTP 500 și un mesaj sigur.  
- Cererile către API-urile externe trimit doar datele necesare funcției respective (de ex. mesajul curent, textul pentru sinteză).

## 9. Răspuns la incidente

- Erorile sunt logate în consolă (vizibile în logurile Vercel) cu minimul de date personale.  
- Furnizorul monitorizează mesajele `console.error` și `console.warn` pentru a detecta problemele.  
- În caz de incident, token-urile pot fi revocate în Supabase, iar cheile API pot fi rotite imediat.

## 10. Recomandări pentru utilizatori

- Folosiți o parolă unică și activați MFA pe e-mailul asociat contului.  
- La activitate suspectă, schimbați parola și contactați imediat suportul.  
- Nu partajați token-uri sau chei API cu terți.  
- Ștergeți periodic chat-urile și atașamentele inutile pentru a minimiza datele stocate.

---

Documentul reflectă arhitectura de securitate Omnia One AI la 2 noiembrie 2025.
