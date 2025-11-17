# Termeni de utilizare Omnia

Data intrării în vigoare: 2 noiembrie 2025

Acești Termeni reglementează utilizarea aplicației Omnia One AI („Serviciul”), operată de Cristian Bucioaca, e-mail: cristianbucioaca@omniaoneai.com („Furnizorul”). Prin accesarea Serviciului confirmați că ați citit și că sunteți de acord cu acești Termeni.

## 1. Definiții

- **Utilizator**: orice persoană fizică sau juridică ce își creează un cont sau folosește în alt mod Serviciul.  
- **Conținut al Utilizatorului**: toate informațiile furnizate de Utilizator, în special e-mail, parolă, istoric de chat, fișiere încărcate, rezultate generate și metadate de utilizare.  
- **Serviciul**: experiența web și mobilă Omnia, inclusiv rutele API asociate.  
- **Furnizori terți**: Supabase, Google Cloud (Vertex AI, Document AI, Text-to-Speech, Speech-to-Text), Anthropic (Claude), OpenAI, ElevenLabs și Stripe.

## 2. Domeniul Serviciului

Omnia oferă un asistent AI multiplatformă care le permite Utilizatorilor să:

- poarte conversații text și voce,  
- genereze, analizeze și sumarizeze conținut,  
- încarce și proceseze fișiere (text, PDF, imagini),  
- stocheze chat-uri și atașamente pentru uz propriu,  
- sincronizeze conversațiile între dispozitive prin Supabase,  
- opțional, să se aboneze la planuri plătite procesate prin Stripe (dacă sunt activate).

## 3. Crearea și accesul la cont

1. Utilizatorul trebuie să furnizeze informații corecte și actualizate la înregistrare.  
2. Înregistrarea necesită o adresă de e-mail și o parolă. Parolele sunt stocate de Supabase într-o formă criptată și nu sunt accesibile Furnizorului.  
3. Utilizatorul este responsabil pentru protejarea datelor de autentificare. Orice activitate realizată prin cont este atribuită Utilizatorului.

## 4. Accesul la conținut și responsabilitatea

1. Utilizatorul păstrează controlul complet asupra conversațiilor și poate șterge oricând chat-uri individuale sau întregul cont.  
2. Conținutul creat de Furnizor (de exemplu prompturi de sistem) rămâne proprietatea intelectuală a Furnizorului.  
3. Furnizorul nu garantează acuratețea, veridicitatea sau utilizabilitatea juridică a rezultatelor generate de AI. Utilizatorul trebuie să verifice independent informațiile critice înainte de a se baza pe ele.

## 5. Conduită interzisă

Utilizatorul nu trebuie să:

- folosească Serviciul în scopuri ilegale, frauduloase sau dăunătoare,  
- încarce conținut care încalcă drepturile terților,  
- încerce să compromită securitatea sau disponibilitatea Serviciului,  
- decompileze sau să ocolească măsurile de protecție (precum politicile RLS Supabase),  
- supraîncarce Serviciul sau să provoace prejudicii Furnizorului ori altor utilizatori.

## 6. Plăți și abonamente

Când sunt oferite planuri contra cost:

1. Informațiile de plată sunt procesate de Stripe ca operator independent de date.  
2. Utilizatorii pot fi taxați periodic în funcție de planul ales.  
3. Neplata poate conduce la suspendarea sau încetarea Serviciului.  
4. Abonamentele pot fi anulate din setările contului sau urmând instrucțiunile Stripe.

## 7. Integrarea cu terți

Furnizorul asigură funcționarea Serviciului prin integrarea cu:

- Supabase (autentificare, bază de date, Storage, realtime).  
- Google Cloud (Vertex AI, Document AI, Text-to-Speech, Speech-to-Speech, Cloud Storage).  
- Anthropic (API Claude), OpenAI (Chat Completions), Google Vertex AI Gemini.  
- ElevenLabs (Text-to-Speech).  
- Stripe (plăți).  

Prin utilizarea Serviciului sunteți de acord cu transferul datelor necesare către acești furnizori pentru executarea contractului.

## 8. Disponibilitate și modificări

1. Serviciul este furnizat „ca atare”. Furnizorul nu garantează funcționarea neîntreruptă sau lipsa erorilor.  
2. Furnizorul poate modifica, limita temporar sau întrerupe Serviciul atunci când este necesar (de ex. pentru securitate, mentenanță).  
3. Modificările semnificative ce afectează Utilizatorii vor fi anunțate în aplicație sau prin e-mail, dacă este disponibil.

## 9. Încetare

1. Utilizatorul își poate șterge contul oricând. Înainte de ștergere, aplicația explică consecințele și solicită introducerea textului `DELETE`, urmat de confirmare direct în interfață; nu este trimis niciun e-mail de confirmare. După confirmare, mecanismul Supabase elimină auth.users, profiles, chats, messages și fișierele asociate prin acțiunea `supabase.auth.admin.deleteUser`.  
2. Furnizorul poate suspenda accesul dacă Utilizatorul încalcă acești Termeni sau legislația aplicabilă. Dacă este posibil, Utilizatorul va fi notificat în prealabil.  
3. După încetare, toate datele sunt șterse definitiv și nu pot fi restaurate odată finalizată acțiunea backend.

## 10. Garanții și răspundere

1. Furnizorul nu răspunde pentru prejudiciile directe sau indirecte rezultate din utilizarea conținutului AI, pierderea datelor sau indisponibilitate.  
2. Răspunderea este limitată, cu excepția situațiilor de intenție sau neglijență gravă a Furnizorului.  
3. Utilizatorul este responsabil pentru conținutul introdus sau creat și trebuie să se asigure că respectă legea și licențele aplicabile.

## 11. Modificarea Termenilor

1. Furnizorul poate actualiza acești Termeni.  
2. Utilizatorii vor fi informați despre modificările importante prin e-mail sau notificare în aplicație cu cel puțin 14 zile înainte de intrarea în vigoare.  
3. Continuarea utilizării Serviciului după data intrării în vigoare constituie acceptarea noilor Termeni. Utilizatorii care nu sunt de acord își pot șterge contul.

## 12. Legea aplicabilă

1. Acești Termeni sunt guvernați de legislația României.  
2. Litigiile sunt soluționate de instanțele competente de la sediul sau domiciliul Furnizorului.

## 13. Contact

Pentru întrebări referitoare la Serviciu sau la acești Termeni, contactați cristianbucioaca@omniaoneai.com.

---

Documentul se bazează pe funcționalitățile curente ale Omnia One AI la data intrării în vigoare.
