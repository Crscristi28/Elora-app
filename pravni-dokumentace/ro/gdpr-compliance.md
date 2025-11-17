# Lista de conformitate GDPR Omnia One AI

Data: 2 noiembrie 2025

Acest document rezumă modul în care Omnia One AI respectă cerințele GDPR și planul de gestionare a riscurilor.

## 1. Operator și contacte

- **Operator**: Cristian Bucioaca, Omnia One AI.  
- **Contact pentru confidențialitate**: cristianbucioaca@omniaoneai.com.  
- Nu este numit un DPO; Operatorul gestionează direct protecția datelor.

## 2. Temeiuri legale

- Executarea contractului (art. 6 alin. 1 lit. b): crearea conturilor, funcțiile asistentului AI, gestionarea abonamentelor.  
- Obligație legală (art. 6 alin. 1 lit. c): evidența fiscală și contabilă prin Stripe.  
- Interes legitim (art. 6 alin. 1 lit. f): logare securitate, gestionarea incidentelor, analize agregate.  
- Consimțământ (art. 6 alin. 1 lit. a): doar când Utilizatorul furnizează date sensibile; nu este necesar pentru funcțiile de bază.

## 3. Minimizarea și limitarea stocării

- Politicile RLS active permit accesul doar la propriile date.  
- IndexedDB local păstrează date doar pentru modul offline; utilizatorii le pot șterge din aplicație.  
- Storage Supabase conține doar fișierele asociate chat-urilor curente; la ștergerea chat-ului, fișierele dispar.  
- Logurile includ doar identificatori esențiali (ID, timp, cod status).

## 4. Drepturile persoanelor vizate

1. **Acces**: exporturi furnizate în 30 de zile.  
2. **Rectificare**: editarea datelor de profil (`ProfileService.saveProfile`).  
3. **Ștergere**: `delete-account.js` elimină contul și datele aferente.  
4. **Restricționare**: se poate dezactiva sincronizarea sau anula abonamentul.  
5. **Portabilitate**: exporturi în format JSON/CSV din Supabase.  
6. **Opoziție**: se poate solicita reevaluarea prelucrărilor bazate pe interes legitim; testul de echilibrare este documentat.  
7. **Plângere**: către autoritatea națională (www.dataprotection.ro).

## 5. Acorduri cu persoane împuternicite

- **Supabase**: DPA inclus în abonament; găzduire în UE.  
- **Google Cloud**: DPA pentru Vertex AI, Document AI, Cloud Storage, TTS, STT (regiune `us-central1` pentru Vertex și regiunea setată pentru Document AI).  
- **Anthropic**: termenii API prevăd retenție scurtă pentru evaluarea calității.  
- **OpenAI**: DPA dedicat, conexiune HTTPS.  
- **ElevenLabs**: procesează text pentru sinteză vocală fără stocare pe termen lung.  
- **Stripe**: operator independent pentru plăți, cu propriul DPA.

## 6. Evaluarea riscurilor și DPIA

- Aplicația gestionează conversații text ce pot include informații sensibile introduse voluntar de utilizator.  
- Riscurile sunt reduse deoarece datele sunt vizibile doar utilizatorului și furnizorilor de AI; nu sunt publice.  
- Având în vedere domeniul și baza de utilizatori, nu este necesar momentan un DPIA formal; există evidențe tehnice pentru audit.  
- Dacă Omnia va introduce decizii automatizate cu impact juridic semnificativ, se va realiza o DPIA.

## 7. Măsuri de securitate

- Transport criptat (HTTPS) pentru toate API-urile.  
- Cheile de service sunt stocate exclusiv pe backend.  
- Fișierele din Storage se șterg automat înaintea ștergerii chat-ului.  
- Validare input (limite de fișier, sanitizare text pentru TTS).  
- Loguri minimale cu acces restricționat.  
- Actualizări regulate ale dependențelor (npm audit, monitorizare CVE).

## 8. Plan de răspuns la incidente

1. Detectarea incidentelor prin loguri (`console.error`, monitorizare Vercel/Supabase).  
2. Revocarea rapidă a cheilor API compromise și a sesiilor Supabase.  
3. Evaluarea impactului: identificarea tabelelor/utilizatorilor afectați.  
4. Notificarea utilizatorilor afectați în maxim 72 de ore, dacă există risc pentru drepturi și libertăți.  
5. Informarea autorității de supraveghere, dacă este necesar.  
6. Documentarea incidentului și actualizarea planului.

## 9. Documentație și audit

- Aceasta este versiunea 1.0 stocată în directorul `pravni-dokumentace`.  
- Actualizările sunt urmărite în Git pentru trasabilitate.  
- Orice modificare funcțională care afectează prelucrarea datelor implică revizuirea acestei liste și a registrului.

---

Document de lucru pentru demonstrarea conformității GDPR; trebuie completat cu acordurile și procedurile relevante implementării în producție.
