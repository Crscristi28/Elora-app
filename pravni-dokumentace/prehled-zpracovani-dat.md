# Prehled zpracovani osobnich a provoznich dat v Omnia One AI

Tento prehled plni funkci zaznamu o cinnostech zpracovani dle cl. 30 GDPR. Udaje byly sestaveny na zaklade aktualni implementace (supabase schema, API routy, frontendove sluzby).

## 1. Dataset: Uzivatelske ucty

- **Popis**: Registrace pres Supabase Auth, evidence v tabulkach `auth.users` a `profiles`.  
- **Kategorie udaju**: e-mail, heslo (hash), id uzivatele, role, jmeno, prezdivka, preferovana lokalizace, casy vytvoreni/aktualizace.  
- **Subjekty**: registrovani uzivatele.  
- **Ucel**: vytvoreni a udrzovani uctu, personalizace odpovedi AI.  
- **Pravni zaklad**: plneni smlouvy.  
- **Prijemci**: Supabase (EU).  
- **Uchovani**: po dobu existence uctu; mazano pri volani `delete-account.js`.  
- **Bezpecnost**: RLS, sifrovane prenosy, hesla hashovana, service role pouze na backendu.

## 2. Dataset: Chatove zpravy a kontext

- **Popis**: Tabulky `chats`, `messages`, lokalni IndexedDB `OmniaChatDB`.  
- **Kategorie udaju**: textove zpravy, metadata (timestamps, sender, device_id, sources), prilohy (attachments, images, pdf), AI odpovedi.  
- **Subjekty**: registrovani uzivatele, jejich konverzacni partner AI.  
- **Ucel**: poskytnuti AI asistenta, historie konverzace, kontinuita.  
- **Pravni zaklad**: plneni smlouvy.  
- **Prijemci**: Supabase, poskytovatele AI (Google Vertex AI, Anthropic, OpenAI) v rozsahu aktualni zpravy.  
- **Uchovani**: do smazani chatu nebo uctu; lokalne lze kdykoli odstranit.  
- **Mazani**: funkce `deleteChat` nejprve maze soubory ze Storage, pote radky v IndexedDB i Supabase.  
- **Bezpecnost**: RLS `auth.uid()`, Storage vlastnik = uzivatel, offline sifrovani je zajisteno ulozistem prohlizece.

## 3. Dataset: Nahrane soubory a generovane vystupy

- **Popis**: Supabase Storage (attachments, generated-images, generated-pdfs-temp), Google Cloud Storage pri zpracovani dokumentu, lokalni cache.  
- **Kategorie udaju**: obsah souboru nahranych uzivatelem, AI vytvorene obrazky, PDF, metadata (nazev, velikost, cesta, publicUrl).  
- **Subjekty**: registrovani uzivatele.  
- **Ucel**: analyza dokumentu, generovani vystupu, stazeni uzivatelem.  
- **Pravni zaklad**: plneni smlouvy, ve vyjimecnych pripadech souhlas (pokud uzivatel dobrovolne prilozi citliva data).  
- **Prijemci**: Supabase Storage (EU), Google Document AI a Google Storage (pri zpracovani), ElevenLabs (pokud je soubor vysledkem TTS).  
- **Uchovani**: do smazani konkretniho souboru nebo ukonceni uctu; docasna uloziste jsou uklizena po dokoncenem procesu.  
- **Bezpecnost**: RLS na Storage (mazani pouze vlastnik), protokol HTTPS, kontrola MIME typu, pred smazanim chatu dochazi k odstraneni dat z bucketu.

## 4. Dataset: Hlasova komunikace

- **Popis**: Audio data posilana na `api/google-stt.js` a `api/elevenlabs-stt.js`, resp. text generovany `api/elevenlabs-tts.js` a `api/google-tts.js`.  
- **Kategorie udaju**: kratkodobe audio zaznamy, transkripce, generovane audio.  
- **Subjekty**: registrovani uzivatele, pripadne osoby v zaznamech (pokud je uzivatel zachyti).  
- **Ucel**: prevod reci na text a naopak.  
- **Pravni zaklad**: plneni smlouvy.  
- **Prijemci**: Google Cloud Speech-to-Text, ElevenLabs.  
- **Uchovani**: audio se neuklada po doruceni odpovedi; generovane MP3 se vraci v ramci streamu a dale se nearchivuji.  
- **Bezpecnost**: limit velikosti souboru, sanitizace vstupu, HTTPS.

## 5. Dataset: Provozni a vykonostni metriky

- **Popis**: Tabulka `usage_metrics`, lokalni logy, analyticke agregace.  
- **Kategorie udaju**: user_id, typ metriky (pocet zprav, spotrebovane tokeny), hodnota, datum.  
- **Subjekty**: registrovani uzivatele.  
- **Ucel**: monitoring, billing, ochrana pred zneuzitim.  
- **Pravni zaklad**: opravneny zajem Provozovatele, pripadne plneni smlouvy pro fakturaci.  
- **Prijemci**: Supabase (EU), Stripe (pro prirazeni plateb).  
- **Uchovani**: do 24 mesicu od vytvoreni nebo do vymazani uctu.  
- **Bezpecnost**: RLS, pristup pouze autentizovanym session.

## 6. Dataset: Platebni agenda

- **Popis**: Integrace se Stripe, tabulka `subscriptions`.  
- **Kategorie udaju**: user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, billing period.  
- **Subjekty**: uzivatele s aktivnim predplatnym.  
- **Ucel**: evidence plateb, fakturace, uzivatelska podpora.  
- **Pravni zaklad**: plneni smlouvy, pravni povinnost uchovani ucetnich dokladu.  
- **Prijemci**: Stripe (USA/EU).  
- **Uchovani**: dle podminek Stripe a zakonnych povinnosti (minimalne 5 let).  
- **Bezpecnost**: tokenizace; aplikace neuchovava cisla karet. Mazani probiha pres Stripe dashboard nebo API.

## 7. Dataset: Podpora a komunikace

- **Popis**: E-mailova komunikace se zakaznikem, notifikacni sablony v Supabase.  
- **Kategorie udaju**: e-mail, obsah zpravy, informace o problemu.  
- **Subjekty**: uzivatele, kteri kontaktuji podporu.  
- **Ucel**: odpoved na dotazy, reseni incidentu.  
- **Pravni zaklad**: opravneny zajem.  
- **Prijemci**: poskytovatel e-mailove schranky (omniaoneai.com).  
- **Uchovani**: po dobu reseni dotazu + 12 mesicu pro audit.  
- **Bezpecnost**: pristup pouze Provozovatel; sifrovana e-mailova komunikace (TLS).

## 8. Postupy pri uplatneni prav subjektu udaju

- Zadosti se prijimaji na adrese cristianbucioaca@omniaoneai.com.  
- Autentizace zadatele probiha pres verifikaci vlastnictvi e-mailu v Supabase (v pripade potreby je mozne vyzadovat dalsi informace).  
- Export dat zahrnuje: profily, seznam chatu, obsah zprav, metriky a metadata souboru.  
- Vymaz se provadi volanim `delete-account.js` a manualnim overenim, ze Storage neobsahuje dalsi soubory.  
- Odpoved je poskytovana do 30 dnu, ve slozitych pripadech lze lhutu prodlouzit o dalsich 30 dnu s informovanim uzivatele.

---

Prehled byl sestaven 2. listopadu 2025. Zmeny v implementaci se promtn e projevi v aktualizacich tohoto dokumentu.
