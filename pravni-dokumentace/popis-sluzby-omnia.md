# Popis sluzby Omnia One AI (technicko-pravni shrnuti)

Tento dokument shrnuje, co aplikace Omnia One AI dela, jak je navrzena a jake ma hlavni funkce. Obsah slouzi jako podklad pro komunikaci s uzivateli i pro pravni dokumentaci.

## 1. Zakladni predstava

Omnia One AI je webova a mobilne optimalizovana aplikace postavena na React + Vite, ktera uzivatelum poskytuje inteligentniho asistenta. Uzivatel muze psat, mluvit, nahravat soubory a prijimat odpovedi od vice modelu umele inteligence (Gemini, Claude, GPT-4o). Aplikace je navrzena pro vicejazycne pouziti (CZ, EN, RO atd.) a kombinuje textove, dokumentove i vizualni funkce.

## 2. Hlavni moduly

- **Frontend (src/)**: React komponenty pro chat, historii, nahravani souboru, generovani obsahu, nastaveni.  
- **IndexedDB**: lokalni uloziste `OmniaChatDB` pro rychly pristup k historii konverzaci a offline rezim.  
- **Synchronizace**: sluzba `chatSync.js` zajistuje upload do Supabase a realtime aktualizace mezi zarizenimi.  
- **Backend API (api/)**: serverless routy na Vercelu pro praci s AI modely, hlasovym vstupem/vystupem, zpracovanim dokumentu a mazanim uctu.  
- **Supabase**: autentizace, databaze (profiles, chats, messages, usage_metrics, subscriptions) a Storage.  
- **Placene sluzby**: Stripe (pokud je aktivni), Evidence spotreby (`usage_metrics`).

## 3. Funkcionality pro uzivatele

1. **Chat s AI**: real-time odpovedi s podporou vice poskytovatelu.  
2. **Web search a citace**: integrace `api/claude-web-search.js` vraci zdrojove odkazy, ktere se ukladaji jako `sources`.  
3. **Zpracovani dokumentu**: upload souboru pres `api/process-document.js` s moznosti analyzy plain textu i PDF (Google Document AI).  
4. **Generovani obrazku a PDF**: volani `api/imagen.js`, `api/generate-pdf.js` a ukladani vysledku do Storage.  
5. **Hlasove funkce**: diky `api/google-stt.js`, `api/google-tts.js`, `api/elevenlabs-tts.js` lze diktovat i poslouchat odpovedi.  
6. **Sprava uctu**: registrace, prihlaseni, zmena hesla, obnova pres OTP, nastaveni profilu, smazani uctu.  
7. **Mazani obsahu**: mazani jednotlivych chatu nebo kompletniho uctu vcetne priloh.  
8. **Predplatne (volitelne)**: tabulka `subscriptions` a integrace se Stripe pro spravu planu.

## 4. Datove toky

1. **Prihlaseni**: uzivatel zada e-mail/heslo, Supabase vrati JWT, ktere se pouziva pro volani serveru.  
2. **Odeslani zpravy**: frontend sestavi seznam `messages`, podle logiky vybere AI model a posle JSON na prislusny endpoint (napr. `/api/gemini`). Backend overi token, doplni roli, zavola AI API, odpoved streamuje zpet.  
3. **Nahrani souboru**: soubor se posle na `/api/process-document`, kde se budto zpracuje lokalne (plain text), nebo preda Google Document AI. Metadata se vrati do aplikace a mohou byt ulozena v chatu.  
4. **Generovani obrazku**: AI model vrati base64, backend ulozi obrazek do Supabase Storage a vrati public URL.  
5. **Synchronizace**: `chatSyncService` porovnava lokalni a cloudova data, odesila nove zpravy, mazani se propaguje v obou smerech.  
6. **Mazani**: volani `deleteChat` odstrani soubory a zaznamy. Mazani celeho uctu vola `/api/delete-account`.

## 5. Bezpecnost a ochrana dat

- Autentizace a autorizace prochazi Supabase; backend ma service role klic.  
- Row Level Security brani pristupu k cizim datum.  
- Storage ma nastaveny owner check, proto muze soubory mazat jen jejich vlastnik.  
- Vsechny API routy nastavuji CORS, limituji metody na POST/OPTIONS a kontroluji vstupy.  
- Tokeny a credentiale jsou uchovany v promennych prostredi (Vercel secret manager).  
- Chat historie se uklada lokalne i v Supabase, ale uzivatel ma vzdy moznost data smazat.  
- Logy jsou minimalni a nesou pouze technicke informace.

## 6. Integrace tretich stran

| Poskytovatel | Ucel | Predavana data |
| --- | --- | --- |
| Supabase | autentizace, databaze, storage, realtime | uzivatelske ID, chaty, zpravy, soubory |
| Google Cloud Vertex AI | odpovedi modelu Gemini | obsah aktualni konverzace, systemove instrukce |
| Anthropic Claude | generativni odpovedi, web search | text zpravy, metadata, prilohy (pokud jsou nutne) |
| OpenAI | GPT-4o odpovedi | textove zpravy a systemove instrukce |
| Google Document AI | extrakce textu z dokumentu | obsah nahraneho souboru |
| Google TTS/STT | prevod hlasu | audio stream nebo text |
| ElevenLabs | TTS fallback | text odpovedi |
| Stripe | predplatne | identifikatory uzivatele, plan, stav |

## 7. Uzivatelska kontrola

- V UI jsou dostupne akce pro smazani chatu, vymazani vsech dat a zruseni uctu.  
- Pri mazani chatu se zobrazi dialog s potvrzenim (`deleteConfirmation`).  
- Pri nahravani souboru je zobrazena historie a moznost stahnout priloha zpatky.  
- Nastaveni profilu uklada pouze dobrovolne udaje (jmeno, prezdivka).  
- Pokud nejsou environment variables pro Supabase k dispozici, aplikace pracuje v offline modu bez odesilani dat do cloudu.

## 8. Technologie a nasazeni

- Build je rizeny pomoci Vite (`npm run build`), deployment typicky na Vercel.  
- API routy vyuzivaji Node fetch, streaming pres `application/x-ndjson` pro AI odpovedi.  
- Pro PDF generovani je pripojen Puppeteer (`api/generate-pdf.js`).  
- Soucasti projektu je i adresar `docs/` s technickymi popisy architektury, realtime, synchronizace.

## 9. Omezeni a varovani

- AI odpovedi mohou byt nepresne; dokumentace doporucuje overovat dulezite informace.  
- Modely tretich stran mohou docasne uchovavat data pro ucely diagnostiky.  
- Pri chybejicim API klici ma backend zcela ukoncit zadost a vracet vhodne chybove kody.  
- Velke soubory jsou omezeny (napr. 10 MB pro audio v Google STT).  
- Offline rezim nezahrnuje sifrovani na urovni aplikace (spoleha na zabezpeceni prohlizece).

---

Tento popis byl vytvoren na zaklade zdrojoveho kodu dostupneho k 15. unoru 2025 a slouzi jako doprovodna dokumentace k pravnim souborum.
