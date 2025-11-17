# Zasady ochrany soukromi pro Omnia One AI

Datum ucinnosti: 2. listopadu 2025

Tento dokument vysvetluje, jake osobni udaje aplikace Omnia One AI zpracovava, za jakym ucelem a jak jsou chraneny. Provozovatelem je Cristian Bucioaca, kontakt: cristianbucioaca@omniaoneai.com.

## 1. Jakou pravni roli Provozovatel zastava

- Provozovatel vystupuje jako spravce osobnich udaju, jez uzivatele zadali nebo vznikly pri pouzivani aplikace.  
- Tretistranni platformy (Supabase, Google Cloud, OpenAI, Anthropic, ElevenLabs, Stripe) jsou zpracovatele nebo samostatni spravci podle povahy sluzby.  
- V ramci integraci jsou uzivatelska data predavana pouze v rozsahu nezbytnem k poskytnuti sluzby.

## 2. Kategorie zpracovavanych udaju

1. **Identifikacni a prihlasovaci udaje**: e-mail, zasifrovane heslo, interni ID uzivatele.  
2. **Profilova data**: dobrovolne zadane jmeno a prezdivka, preferovana lokalizace.  
3. **Obsah chatu a prilohy**: textove zpravy, systemova metadata, soubory nahrane uzivatelem (PDF, obrazky, dokumenty), AI generovane vystupy.  
4. **Technicka metadata**: ID zarizeni, casove znacky, verze prohlizece, logy o selhani.  
5. **Provozni metriky**: pocty zprav, spotreba tokenu, aktivita predplatneho (pokud je zapnuto).  
6. **Platebni udaje**: zpracovava Stripe; aplikace uchovava pouze referencni identifikatory (customer_id, subscription_id).  
7. **Hlasova data**: kratkodobe audio streamy pro prevod hlasu (Google STT, ElevenLabs TTS), ktere se po prevodu neukladaji.

## 3. Ucely a pravni zaklad

| Ucel zpracovani | Kategorie udaju | Pravni zaklad |
| --- | --- | --- |
| Poskytnuti zakladnich funkci (prihlaseni, chat, synchronizace) | identifikacni, profilova, obsah chatu, technicka | plneni smlouvy (cl. 6 odst. 1 b) GDPR) |
| Zpracovani souboru, generovani odpovedi AI, hlasove sluzby | obsah chatu, prilohy, hlasova data | plneni smlouvy |
| Udrzba bezpecnosti (logy, detekce zneuziti, access tokeny) | technicka metadata | opravneny zajem (bezpecnost) |
| Fakturace a evidence plateb | identifikacni udaje, provozni metriky, platebni identifikatory | plneni smlouvy / pravni povinnost |
| Zlepseni produktu (anonymizovana analyza) | agregovana provozni data | opravneny zajem |

## 4. Komu se data predavaji

- **Supabase** (EU datacentra): autentizace, databaze (profiles, chats, messages), Storage (attachments, generated-images, generated-pdfs-temp), realtime signalizace.  
- **Google Cloud** (EU a US regiony podle konfigurace): Vertex AI Gemini, Document AI, Text-to-Speech, Speech-to-Text, Cloud Storage pro docasne zpracovani. Credentiale jsou ukladan y ve formatu JSON v promennych prostredi na strane serveru.  
- **Anthropic**: API Claude pro generativni odpovedi a web search. Predavany je obsah aktualni konverzace a pripadne prilohy ve formatech podporovanych API.  
- **OpenAI**: GPT-4o pro rozsirene generativni funkce. Odesilane jsou systemove instrukce a cast historie konverzace.  
- **ElevenLabs**: Text-to-Speech streamy pro generovani hlasove odezvy. Predava se pouze text aktualni odpovedi.  
- **Stripe**: sprava predplatneho; do aplikace se vraci pouze tokenizovane identifikatory.  
- **Google Search / externi zdroje**: pri zapnute vyhledavaci funkci se dotaz anonymne odesila do integrace pro web search.

Data nejsou prodavana tretim stranam ani sdilena pro marketing tretich stran.

## 5. Uloziste a doba uchovani

- **Supabase**: data jsou ulozena do doby, nez Uzivatel smaze chat nebo cely ucet. Pri smazani uctu je uzivatel upozornen na dusledky, musi napsat `DELETE` a potvrdit akci v aplikaci; neni odesilan zadny e-mail. Nasledne backend `delete-account.js` vola `supabase.auth.admin.deleteUser` a aktivuje kaskadni odstraneni profilu, chatu, zprav i priloh.  
- **IndexedDB v prohlizeci**: lokalni databaze `OmniaChatDB` uchovava chaty pro offline pouziti. Uzivatel muze data vymazat v nastaveni nebo pri odhlaseni.  
- **Docasne uloziste**: nahrane soubory pri zpracovani dokumentu mohou byt docasne drzeny v Google Cloud Storage, po dokonceni se maze docasny soubor i metadata.  
- **Logy serveru**: kratkodobe (max 30 dni) pro reseni incidentu, pote se anonymizuji nebo smazeji.  
- **Platebni doklady**: uchovava Stripe v souladu s pravnimi predpisy.

## 6. Bezpecnostni opatreni

- Vsechny nove radky v Supabase maji aktivni Row Level Security a kontrolu `auth.uid()`.  
- Storage objekty v Supabase vyzaduji vlastnictvi `owner = auth.uid()` pro mazani.  
- Tokeny Supabase jsou overovany na backendu pomoci service role klice.  
- Hesla jsou u Supabase hashovana podle bezpecnostnich standardu.  
- Komunikace s API je sifrovana (HTTPS).  
- Pri smazani chatu se nejprve odstrani soubory ze Storage (`deleteStorageFiles`), pote konverzace a pripadne zaznamy v sync tabulkach.  
- Pristup k ridicim credentialum (Google, OpenAI, Anthropic, ElevenLabs) je omezen na serverovou cast.

## 7. Prava uzivatelu

Uzivatel ma v souladu s GDPR zejmena tato prava:

1. Pravo na pristup k udajum (v nastaveni uctu lze pozadat o export).  
2. Pravo na opravu profilu (profil lze editovat primo v aplikaci).  
3. Pravo na vymaz (smazani chatu, priloh nebo cely uctovy profil).  
4. Pravo na omezeni zpracovani (lze vypnout synchronizaci nebo zrusit predplatne).  
5. Pravo vzneseni namitek proti zpracovani zalozenemu na opravnenem zajmu.  
6. Pravo na prenositelnost (export konverzaci lze zaslat na zaklade zadosti).  
7. Pravo podat stiznost u dozoroveho organu (Urad pro ochranu osobnich udaju, www.uoou.cz).

Zadosti lze smerovat na cristianbucioaca@omniaoneai.com. Provozovatel odpovi nejpozdeji do 30 dni.

## 8. Automatizovane rozhodovani a profilace

Aplikace generuje odpovedi s vyuzitim modelu umele inteligence na zaklade instrukci a historie konverzace. Neprovadi se profilace vedouci k pravnim ucinkum nebo obdobne vyznamnemu dopadu bez lidskeho vstupu. Predplatna a fakturace jsou ridena jasnymi pravidly.

## 9. Zmeny zasad

Tento dokument muze byt prubezne aktualizovan, pokud dojde k technickym nebo legislativnim zmenam. O vyznamnych zmenach bude uzivatel informovan e-mailem nebo oznamenim ve Sluzbe nejmene 14 dni pred ucinnosti. Archiv predchozich verzi bude k dispozici na vyzadani.

---

Tento text je pripraven na zaklade skutecne implementace projektu Omnia One AI (zdrojem jsou soubory v adresarich `api/`, `src/services/`, `supabase/` a souvisejici konfigurace).
