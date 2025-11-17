# Autentizace a bezpecnostni opatreni Omnia One AI

Tento dokument popisuje, jak je v aplikaci Omnia One AI resena autentizace, autorizace a ochrana dat. Informace vychazeji z analyzy kodu v adresarich `api/`, `src/services/`, `supabase/` a dokumentace Supabase.

## 1. Registrace a prihlaseni

- Prihlasen i registrace probihaji pres Supabase Auth (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`).  
- Supabase uklada hesla hashovana (bcrypt) a vystavuje JWT token platny standardne 60 minut, ktery se automaticky obnovuje.  
- Na klientu je pouzivan modul `src/services/auth/supabaseAuth.js`, ktery poskytuje funkce prihlaseni, odhlaseni, obnovy hesla (OTP) a sledovani stavu session.  
- Pristupove tokeny se nikdy neodesilaji tretim stranam primo z prohlizece; pri volani vlastnich API jsou pridane do hlavicky `Authorization: Bearer`.

## 2. Overeni na backendu

- Serverove endpointy (`api/claude.js`, `api/gemini.js`, dalsi) vytvari instanci Supabase klienta se service role klicem (`SUPABASE_SERVICE_ROLE_KEY`).  
- Pri kazde zadosti se z hlavicky vybere JWT token a overi pres `supabase.auth.getUser(token)`.  
- Pokud overeni selze, endpoint vraci `401 Unauthorized`.  
- Po prihlaseni se dotazuje tabulka `profiles` na roli uzivatele. Neznamy nebo chybejici zaznam je vychozi `user`.

## 3. Role a opravneni

- Tabulka `profiles` obsahuje sloupec `role` (napr. `user`, `owner`).  
- Roli lze nastavit pomoci SQL skriptu `supabase/add-admin-role.sql`.  
- Na backendu je role pouzita pro aktivaci rozsirene funkce (napr. pristup k administracnim nastrojum nebo prednosti ve fronte).  
- I kdyz role neni nalezena, system volne nepovoluje rozsirena opravneni.

## 4. Row Level Security a databaze

- Vsechny dulezite tabulky (`chats`, `messages`, `profiles`, `usage_metrics`, `subscriptions`) maji aktivni Row Level Security.  
- Pristupova politika zajistuje, ze `auth.uid() = user_id` nebo `auth.uid() = id`. Uzivatel tak vidi pouze vlastni zaznamy.  
- Pri vkladani a mazani dat se kontroluje, zda radek patri prave prihlasenemu uzivateli.  
- Triggery `update_updated_at_column` aktualizuji cas `updated_at`, aby bylo mozne sledovat zmeny pro synchronizaci.

## 5. Ukladani priloh a souboru

- Souborove prilohy se ukladaji v Supabase Storage (bucket `attachments`), AI obrazky v `generated-images`, PDF vystupy v `generated-pdfs-temp`.  
- Pri uploadu se pouziva `supabase.storage.from(bucket).upload(...)`, coz automaticky nastavi `owner = auth.uid()`.  
- Mazani souboru probiha pres `deleteFromSupabaseStorage`, ktere lze volat pouze pro vlastni soubory diky Storage RLS politike.  
- Pri smazani chatu (`chatDB.deleteChat`) se nejdrive odstrani vazane soubory, teprve potom zaznamy `messages` a `chats`.

## 6. Lokalni uloziste a synchronizace

- Pro offline rezim je pouzita IndexedDB (Dexie) pod nazvem `OmniaChatDB`.  
- Verze schematu postupne pridavaji nove sloupce (attachments, images, pdf, sources) s duslednym logem migraci.  
- Synchronizaci s cloudem zajistuje `src/services/sync/chatSync.js`. Pred odeslanim dat do Supabase zkontroluje, zda je uzivatel autentizovany, a odesila pouze vlastni zaznamy.  
- Pri odstraneni dat se take odmazavaji pripadne zaznamy v realtime synchronizaci, aby se zmeny projevily na ostatnich zarizenich.

## 7. Smazani uctu a dat

- Na backendu existuje endpoint `api/delete-account.js`, ktery volani `supabase.auth.admin.deleteUser(userId)` odstrani uzivatele z auth.users a spusti kaskadni mazani profilu, chatu, zprav a vazanych souboru.  
- Tento postup je finalni a data nelze obnovit.  
- Uzivatel si muze predtim stahnout vlastni konverzace; export lze pripravit na vyzadani.

## 8. Ochrana API klicu a tretich stran

- Vsechny klice (Google, Anthropic, OpenAI, ElevenLabs, Stripe) jsou nacitany z promennych prostredi a nejsou exponovane na klienta.  
- Backend kontroluje, zda klice existuji, a v pripade chybejici konfigurace vraci HTTP 500 s bezpecnou chybovou hlaskou.  
- Pri volani tredistrannych API jsou posilany pouze nezbytne informace (napr. aktualni zpravy pro generativni model, text k prevodu hlasu).

## 9. Incident response

- Logy selhani se zapisuji do konzole (viditelne ve vercel logu) s minimalnimi osobnimi udaji.  
- Provozovatel sleduje ucast nekonci `console.error` a `console.warn` hlasky a muze podle nich reagovat.  
- V pripade bezpecnostniho incidentu bude uzivatel informovan pres e-mail a dokument bude aktualizovan.

## 10. Dopurcena opatreni pro uzivatele

- Pouzivejte jedinecne heslo a dvoufaktorovou autentizaci na e-mailove schrance.  
- Pri podezreni na zneuziti okamzite zmente heslo a informujte podporu.  
- Nepredavejte sve tokeny nebo API klice tretim stranam.  
- Pravidelne mazte nepotrebne chaty a prilohy, aby nedochazelo k zbytecne akumulaci dat.

---

Dokument reflektuje skutecny stav aplikace Omnia One AI k datu 2. listopadu 2025.
