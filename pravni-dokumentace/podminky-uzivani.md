# Podminky uzivani sluzby Omnia

Datum ucinnosti: 2. listopadu 2025

Tyto podminky upravuji pouzivani aplikace Omnia One AI (dale jen 'Sluzba'), kterou provozuje Cristian Bucioaca, e-mail: cristianbucioaca@omniaoneai.com (dale jen 'Provozovatel'). Vstupem do aplikace potvrzujete, ze jste se s podminkami seznamil(a) a souhlasite s nimi.

## 1. Vymezeni pojmu

- **Uzivatel**: fyzicka nebo pravnicka osoba, ktera si vytvorila ucet nebo Sluzbu vyuziva.  
- **Ucestnicka data**: veskere informace poskytnute Uzivatelem, zejmena e-mail, heslo, obsah chatu, nahrane soubory a metadata o pouziti.  
- **Sluzba**: webova a mobilni aplikace Omnia vcetne doplnkovych API a integraci.  
- **Tretistranni poskytovatele**: zejmena Supabase, Google Cloud (Vertex AI, Document AI, Text-to-Speech, Speech-to-Text), Anthropic (Claude), OpenAI, ElevenLabs a Stripe.

## 2. Rozsah sluzby

Omnia poskytuje multiplatformniho AI asistenta, ktery umoznuje:

- textovou a hlasovou konverzaci,  
- generovani, analyzu a sumarizaci obsahu,  
- upload a zpracovani souboru (text, PDF, obrazky),  
- ukladani konverzaci a priloh pro potreby Uzivatele,  
- synchronizaci mezi zarizenimi pres Supabase,  
- volitelne predplatne a vyuctovani prostrednictvim Stripe (pokud je aktivni).

## 3. Registrace a ucet

1. Uzivatel je povinen pri registraci zadat pravdive a aktualni udaje.  
2. Registrace vyzaduje e-mail a heslo. Hesla jsou u Supabase ukladana zasifrovana a Provozovatel k nim nema pristup.  
3. Uzivatel je zodpovedny za ochranu pristupovych udaju. Jakakoli aktivita z uctu se povazuje za aktivitu Uzivatele.

## 4. Pristup k obsahu a odpovednost

1. Uzivatel ma plnou kontrolu nad konverzacemi a muze kdykoli smazat jednotlive chaty nebo cely ucet.  
2. Obsah vytvoren Provozovatelem (napr. systemove sablony) zustava dusevnim vlastnictvim Provozovatele.  
3. Provozovatel nezodpovida za presnost, pravdivost ani pravni vyuzitelnost vystupu generovaneho umelou inteligenci. Uzivatel je povinen overit si informace pred dalsim pouzitim.

## 5. Zakazana jednani

Uzivatel nesmi:

- vyuzivat Sluzbu k ilegalnimu, podvodnemu nebo skodlivemu jednani,  
- vkladat obsah, ktery porusuje prava tretich osob,  
- pokouset se o naruseni bezpecnosti Sluzby,  
- zpetne analyzovat nebo obchazet ochrany (napr. RLS politiky Supabase),  
- vyuzivat Sluzbu tak, aby dochazelo k pretezovani nebo ke skodam Provozovateli nebo dalsim uzivatelum.

## 6. Platby a predplatne

Pokud Provozovatel nabizi placene tarify:

1. Platebni informace zpracovava Stripe jako samostatny spravce udaju.  
2. Uzivateli mohou byt uctovany mesicni poplatky podle zvoleneho planu.  
3. Neposkytnuti platby muze vest k pozastaveni nebo vypovedi sluzby.  
4. Predplatne lze vypovedet v nastaveni uctu nebo podle instrukci Stripe.

## 7. Spoluprace s tretimi stranami

Provozovatel zajistuje funkcnost Sluzby pomoci integraci s nasledujicimi platformami:

- Supabase (autentizace, databaze, Storage, realtime).  
- Google Cloud (Vertex AI, Document AI, Text-to-Speech, Speech-to-Text, Cloud Storage).  
- Anthropic (Claude API), OpenAI (Chat Completions), Google Vertex AI Gemini.  
- ElevenLabs (Text-to-Speech).  
- Stripe (platby).  

Pouziti Sluzby znamena souhlas s predanim nevyhnutelnych dat temto poskytovatelum za ucelem plneni smlouvy.

## 8. Dostupnost a zmeny sluzby

1. Sluzba je poskytovana ve forme 'tak jak je'. Provozovatel nezarucuje nepretrzitost ani bezchybnost.  
2. Provozovatel muze Sluzbu upravovat, docasne omezit nebo ukoncit, pokud je to nezbytne (napr. bezpecnost, udrzba).  
3. Zmeny, ktere zasadne ovlivni Uzivatele, budou oznamovany prostrednictvim aplikace nebo e-mailem, pokud je kontakt dostupny.

## 9. Ukonceni uzivatelske smlouvy

1. Uzivatel muze kdykoli smazat ucet pres dostupnou funkci. Pred definitivnim smazanim je vyzvan k napsani textu `DELETE` a potvrzeni akce primo v aplikaci, neni odesilan zadny e-mail s dalsim potvrzenim. Smazanim uctu dojde k odstraneni dat ze Supabase (auth.users, profiles, chats, messages, storage) v souladu s nastavenymi kaskadami.  
2. Provozovatel muze ukoncit pristup, pokud Uzivatel porusi podminky nebo zakon. Pokud je to mozne, upozorni Uzivatele predem.  
3. Po ukonceni uctu jsou veskera data odstranena bez moznosti obnovy, jakmile probehne backendova akce `supabase.auth.admin.deleteUser`.

## 10. Zaruka a odpovednost

1. Provozovatel neodpovida za primo ci neprimo vzniklou skodu plynouci z pouzivani vystupu AI, ztraty dat nebo nedostupnosti Sluzby.  
2. Vyjimkou je skoda zpusobena umyslne nebo hrubou nedbalosti Provozovatele.  
3. Uzivatel nese odpovednost za obsah, ktery do Sluzby vlozi nebo vytvori, a zajistuje, ze je v souladu s pravem a licencemi.

## 11. Zmena podminek

1. Provozovatel je opravnen tyto podminky aktualizovat.  
2. O vyznamnych zmenach bude Uzivatel informovan e-mailem nebo oznamem ve Sluzbe nejmene 14 dni pred ucinnosti.  
3. Pokracovanim v pouzivani po ucinnosti zmeny Uzivatel souhlasi s novym znenim. Pokud nesouhlasi, je opravnen ucet smazat.

## 12. Rozhodne pravo

1. Pravni vztahy se ridi pravem Ceske republiky.  
2. Pripadne spory budou reseny pred prislusnym soudem podle sidla nebo bydliste Provozovatele.

## 13. Kontakt

Dotazy ke Sluzbe nebo podminkam lze smerovat na e-mail: cristianbucioaca@omniaoneai.com.

---

Tyto podminky jsou pripraveny na zaklade analysy kodu projektu a reflektuji skutecne funkcionality aplikace Omnia k datu ucinnosti.
