# Omnia One AI - principy, hodnoty a funkcionality

Tento manifest shrnuje, proc je Omnia navrzena jako offline-first AI asistent respektujici soukromi uzivatelu, a jak prakticky funguje. Opira se o zdrojovy kod projektu (IndexedDB chatDB, Supabase synchronizaci, API routy v adresari `api/`) a aktualni schopnosti aplikace.

## 1. Offline-first zazitek

- Lokalni databaze `OmniaChatDB` (Dexie/IndexedDB) uklada chaty a prilohy primo v prohlizeci, aby bylo mozne pokracovat i bez pripojeni.  
- Synchronizacni vrstva (`src/services/sync/chatSync.js`) odesila data do cloudu az ve chvili, kdy je dostupne pripojeni, a respektuje nastaveni uzivatele.  
- Pokud nejsou environment variables Supabase dostupne, aplikace prechazi do lokalniho rezimu a nic neposila na server.

## 2. Ochrana soukromi a kontrola nad daty

- Auth tokeny se overuji pouze na backendu (service role), klient nema pristup k citlivym klicum.  
- RLS v Supabase zajistuji, ze uzivatel vidi jen sve chaty, zpravy a soubory.  
- Souborovy storage (attachments, generated-images, generated-pdfs-temp) pouziva vlastnicka prava; mazat muze jen jejich autor.  
- Funkce `delete-account.js` provadi uplne smazani uctu v Supabase vcetne kaskadniho odebrani profilu, chatu a zprav.  
- Mazani jednotlivych chatu (`chatDB.deleteChat`) odstrani drive prilohy z cloud storage a pote zaznamy v databazi.  
- Logika aplikace neprodava ani nesdili data tretim stranam mimo nezbytne API volani potrebna pro fungovani sluzby.

## 3. Data se nepouzivaji pro trenovani

- Zadne API volani neposkytuje tretim stranam pravo data trvale skladovat za ucelem treninku vlastnich modelu; integrace (Google Vertex AI, Anthropic, OpenAI) jsou konfiguracne nastaveny pro rezimy bez opakovaneho trenovani podle vychozich podminek API.  
- Ulozene logy obsahuji pouze technicke informace (status kod, ID zadosti) a nejsou vazane na obsah konverzaci.

## 4. Uzivatel ma sva data kdykoli k dispozici

- Historie konverzaci je dostupna jak lokalne, tak po synchronizaci v Supabase.  
- V UI lze chaty exportovat a ulozit; profil slouzi k personalizaci odpovedi.  
- Pri zmene zarizeni se po prihlaseni obnovi stejna chat historie diky `chatSyncService`.

## 5. Co Omnia umi

- **Textova AI**: integrace s Gemini 2.5 Flash, Claude Sonnet/Haiku a GPT-4o; uzivatel muze plynule prepinat modely a stale pracuje ve stejne konverzaci.  
- **Generovani obsahu**: tvorba textu, shrnuti, strukturovane vystupy, PDF reporty (`api/generate-pdf.js`).  
- **Prace se soubory**: nahrane dokumenty zpracuje `api/process-document.js` (plain text i PDF pres Google Document AI).  
- **Obrazky**: AI generovane obrazky se ukladaji do Supabase storage (bucket `generated-images`) a jsou k dispozici ke stazeni.  
- **Hlas**: prevod hlasu na text `api/google-stt.js`, text na hlas `api/google-tts.js` nebo `api/elevenlabs-tts.js`.  
- **Neomezeny chat**: aplikace neumiestnuje umele limity na pocet konverzaci; historie se spravuje chytrym paginovanim a smazanim na prani.  
- **Rychle sdileni**: chat lze synchronizovat mezi zarizenimi v realnem case pomoci Supabase Realtime.

## 6. Proc je Omnia jina

- Kombinuje vice AI modelu ve stejnem kontextu, proto muze uzivatel porovnavat odpovedi nebo prepinat podle potreby, aniz by prisel o historii.  
- Offline-first architektura minimalizuje latenci a chrani soukromi; data zustavaji primarne u uzivatele.  
- Vsechny dulezite bezpecnostni mechanismy (auth, storage, sync) jsou otevrene zdokumentovany v repozitari, aby bylo mozne auditovat chovani.  
- Tymy mohou vyuzit Supabase metrics a exports pro dalsi pracovni postupy (napr. billing, kontrolu agentu).  
- Aplikace podporuje vice jazyku (cz, en, ro, de atd.) a umi detekovat jazyk pri hovoru nebo textu.

## 7. Zavazky vuci uzivatelum

- Transparentnost: aktualni podminky, zasady soukromi a tento manifest jsou dostupne ve slozce `pravni-dokumentace` a budou pravidelne aktualizovany.  
- Odstraneni dat: zadost o vymaz projde skrz backend `delete-account.js` a soubory se odstrani i z cloud storage.  
- Otevrene planovani: verejne dokumenty v adresari `docs/` popisuji budoucnost (napr. background agenti, realtime sync).  
- Zpetna vazba: kontaktni e-mail `cristianbucioaca@omniaoneai.com` je primarni kanal pro dotazy, zadosti i report incidentu.

---

Tento manifest slouzi jako verejne sdeleni o tom, jak se Omnia One AI stara o soukromi, jak funguje offline-first architektura a proc je reseni vhodne pro uzivatele, kteri chteji mit kontrolu nad svymi daty a soucasne vyuzivat vyspely AI ekosystem.
