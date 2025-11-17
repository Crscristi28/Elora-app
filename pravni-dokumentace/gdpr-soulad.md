# GDPR compliance checklist pro Omnia One AI

Datum: 2. listopadu 2025

Dokument shrnuje, jak aplikace Omnia One AI naplnuje pozadavky obecneho narizeni o ochrane osobnich udaju (GDPR) a jaky je navrhovany postup pri rideni rizik.

## 1. Identifikace spravce a kontakty

- **Spravce**: Cristian Bucioaca, Omnia One AI.  
- **Kontakt pro ochranu udaju**: cristianbucioaca@omniaoneai.com.  
- Specialni poverenec (DPO) neni jmenovan; agendu vykonava primo Spravce.

## 2. Pravni zaklad zpracovani

- Plneni smlouvy (cl. 6 odst. 1 b) GDPR): vytvoreni uctu, poskytovani AI asistenta, sprava predplatneho.  
- Plneni pravni povinnosti (cl. 6 odst. 1 c)): evidence plateb, danove a ucetni povinnosti pres Stripe.  
- Opravneny zajem (cl. 6 odst. 1 f)): zabezpeceni systemu, logovani incidentu, agregovana analytika.  
- Souhlas (cl. 6 odst. 1 a)): pouze pokud uzivatel dobrovolne vlozi citliva data do chatu. Aplikace souhlas nevyzaduje pro zakladni funkcionalitu.

## 3. Minimalizace a omezeni ukladani

- Nasazene RLS politiky zajistuji, ze uzivatel ma pristup pouze ke svym datum.  
- Lokalni IndexedDB uchovava data jen pro potreby offline funkcionality; mazani je dostupne primo v aplikaci.  
- Supabase storage bucket obsahuje pouze soubory prirazene k aktualnim chatum; po smazani chatu jsou soubory odstraneny.  
- Logy s osobnimi udaji jsou minimalizovany na nezbytne identifikatory (ID, cas, status kod).

## 4. Prava subjektu udaju

1. **Pristup**: uzivatel muze v nastaveni vyzadat export dat; Spravce zpracuje do 30 dnu.  
2. **Oprava**: profilova data lze upravit v `ProfileService.saveProfile`.  
3. **Vymaz**: funkcionalita `delete-account.js` odstrani ucet vcetne kaskadnich vazeb.  
4. **Omezeni**: uzivatel muze vypnout synchronizaci nebo zrusit predplatne.  
5. **Prenositelnost**: export lze poskytnout v JSON/CSV formatu ze Supabase.  
6. **Namitka**: v pripade zpracovani na opravneny zajem je mozne zazadat o posouzeni; Spravce provede balancujici test.  
7. **Stiznost**: uzivatel muze kontaktovat Urad pro ochranu osobnich udaju (www.uoou.cz).

## 5. Zpracovatelske smlouvy

- **Supabase**: Data Processing Addendum dostupne v ramci predplatneho. Data jsou ukladana v EU.  
- **Google Cloud**: DPA zahrnujici Vertex AI, Document AI, Cloud Storage, Text-to-Speech, Speech-to-Text. Regiony jsou nastavitelne; projekt pouziva `us-central1` pro Vertex AI a zadany region pro Document AI.  
- **Anthropic**: API podminky upravuji zpracovani obsahu; vystup muze byt ulozen pro kratkodobou dobu k hodnoceni kvality.  
- **OpenAI**: plati Data Processing Addendum, data zavadime pres secure HTTPS.  
- **ElevenLabs**: zpracovani textu pro generovani hlasu, data nejsou trvale uchovavana.  
- **Stripe**: je samostatnym spravcem platebnich udaju, ma vlastni DPA.

## 6. Hodnoceni rizik a DPIA

- Aplikace zpracovava textualni konverzace, vcetne moznych citlivych udaju, ktere muze uzivatel dobrovolne zadat.  
- Riziko je snizeno tim, ze data sdili pouze uzivatel a AI modely; nejsou verejne publikovana.  
- Vzhledem k rozsahu, absenci rozsahleho monitoringu a poctu uzivatelu se nepredpoklada povinnost provadet formalni DPIA. Spravce vsak vede interni zaznamy a odpovidajici technickou dokumentaci.  
- V pripade rozsireni o automatizovana rozhodnuti s pravnim ucinkem bude DPIA provedena.

## 7. Bezpecnostni opatreni

- Sifrovany prenos (HTTPS) pro vsechna API.  
- Service role klice ulozene pouze na backendu.  
- Automaticke mazani souboru ve Storage pred smazanim chatu.  
- Kontrola vstupu (limit velikosti souboru, sanitizace textu pred TTS).  
- Systemove logy s minimalnimi osobnimi udaji, pristup pouze pro Spravce.  
- Pravidelne aktualizace zavislosti (npm audit, kontrola CVE).

## 8. Incident response plan

1. Detekce incidentu skrze logy (`console.error`, monitoring Vercel/Supabase).  
2. Okamzite odpojeni kompromitovanych API klicu a revokace session v Supabase.  
3. Vyhodnoceni rozsahu: ktere tabulky/uzivatele byly dotceny.  
4. Informovani dotcenych uzivatelu e-mailem bez zbytecneho odkladu (nejpozdeji do 72 hodin pri naruseni osobnich udaju).  
5. Priprava oznameni pro dozorovy organ, pokud je pravdepodobne riziko pro prava a svobody osob.  
6. Dokumentace incidentu a aktualizace tohoto planu.

## 9. Ukladani dokumentu a audit

- Tato dokumentace je verze 1.0 ulozena v repozitari `pravni-dokumentace`.  
- Aktualizace budou verzovany pres Git, aby bylo dohledatelne, kdy zmeny nastaly.  
- Kazda zmena funkcionality, ktera ma dopad na zpracovani dat, vyzaduje revizi tohoto dokumentu i prehledu zpracovani.

---

Tento checklist slouzi jako pracovni podklad pro ukazku souladu s GDPR a ma byt doplnen o konkretni smlouvy a postupy podle realneho nasazeni.
