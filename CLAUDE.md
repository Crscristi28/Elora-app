# 🚨 CRITICAL RULES FOR CLAUDE - OMNIA PROJECT

## ⛔ ABSOLUTE PROHIBITIONS

1. **NEVER do `git reset --hard` to old commits** without explicit permission
2. **NEVER change working code** just because "it could be better"
3. **NEVER force push** without explicit consent
4. **NEVER modify git history** without discussion
5. **NEVER add new features directly to App.jsx** (already 5500+ lines!)

## 🎯 GOLDEN RULE: LISTEN FIRST, CODE SECOND

**BEFORE implementing anything:**
1. **ASK** how existing similar features work (PDF, images, etc.)
2. **LOOK** at working code patterns in codebase
3. **COPY** proven patterns instead of inventing new ones
4. **VERIFY** understanding before starting work

**Example:** User asks for new feature?
- ❌ BAD: Immediately start coding with assumptions
- ✅ GOOD: "How does PDF/images handle this? Should I copy that flow?"

## 🏗️ MODULARITY - HIGHEST PRIORITY

### Rule #1: "If it's more than 20 lines → EXTRACT IT!"

**WHERE THINGS BELONG:**
- `/src/services/` - Business logic, API calls, data processing
- `/src/components/` - UI components, visual elements
- `/src/utils/` - Helper functions, validation, conversion
- `/src/hooks/` - Custom React hooks
- `App.jsx` - ONLY orchestration! NOT implementation!

### When adding new features:
1. FIRST create service/component/util
2. THEN integrate into App.jsx
3. NEVER write logic directly in App.jsx

## 📝 GIT WORKFLOW RULES

### Before any change:
1. Check `git status`
2. Save current work
3. NEVER lose uncommitted changes

### When problems occur:
1. Diagnose EXACT problem
2. Fix ONLY what's broken
3. Don't touch working parts

### Committing:
- Commit often with clear descriptions
- Push regularly to remote
- Always create backup commit before big changes

---

## 🎓 LESSONS LEARNED (DON'T REPEAT THESE MISTAKES!)

### ❌ What NOT to do:

1. **Inventing new solutions when proven patterns exist**
   - Example: Artifacts - invented backend upload instead of copying PDF flow
   - Result: 2 days wasted, nothing worked
   - Lesson: **ALWAYS copy working patterns (PDF, images, sources)**

2. **Not listening when user explains the problem**
   - Example: User said "copy PDF flow" 1000x, ignored it
   - Result: Uploaded to non-existent folders, created fake URLs
   - Lesson: **LISTEN to user, they know the codebase better**

3. **Making assumptions instead of asking**
   - Example: Assumed backend should upload artifacts
   - Reality: Frontend uploads (like PDF does)
   - Lesson: **ASK "how does X work?" before implementing**

4. **Implementing during streaming instead of after**
   - Example: Regex replacement during streaming breaks React state
   - Reality: Extract and process AFTER streaming completes
   - Lesson: **Understand timing - streaming vs completion**

### ✅ What TO do:

1. **Find similar working feature FIRST**
   - New feature needed? → Find similar feature → Copy pattern
   - Example: "Artifacts like PDF" → Study PDF flow → Copy exact pattern

2. **Two-way mapping for sync**
   - Upload: IndexedDB → Supabase (transform data)
   - Download: Supabase → IndexedDB (transform back)
   - **BOTH directions must include ALL fields!**
   - Example: `artifact` field missing in download mapping = artifacts don't sync

3. **Follow proven upload patterns**
   ```
   Backend returns: base64/buffer
   Frontend: uploads to Supabase Storage
   Frontend: saves URL to message
   Same as: PDF, images, all files
   ```

4. **React Portal for modals above everything**
   - Z-index doesn't work inside stacking context
   - Use `ReactDOM.createPortal(modal, document.body)`
   - Renders outside app DOM tree

---

## 🔧 OMNIA ARCHITECTURE PATTERNS

### File Upload Flow (PDF, Images, Artifacts)
```
1. Backend: Generate/process content → return base64
2. Frontend: Upload base64 to Supabase Storage
3. Frontend: Get URL from upload result
4. Frontend: Save URL in message object
5. Frontend: Add to pendingUploads array
6. Completion: Wait for all uploads → set needsAutoSave flag
7. useEffect: Detect needsAutoSave → save to IndexedDB
8. chatSync: Upload to Supabase (with field in messageToUpload)
9. chatSync: Download from Supabase (with field in mapping)
```

### Sync Two-Way Mapping (CRITICAL!)
```javascript
// UPLOAD: IndexedDB → Supabase
const messageToUpload = {
  pdf: pdfForDB,
  artifact: artifactForDB,  // ← MUST include!
  sources: sourcesForDB
};

// DOWNLOAD: Supabase → IndexedDB
const localMessages = remoteMessages.map(msg => ({
  pdf: msg.pdf,
  artifact: msg.artifact,  // ← MUST include!
  sources: msg.sources
}));
```

**If upload has field but download doesn't = sync breaks!**

### Modal/Fullscreen Display
```javascript
// ❌ WRONG: Modal inside component (z-index fails)
<div className="message">
  <div style={{zIndex: 999999}}>Modal</div>
</div>

// ✅ CORRECT: Portal to document.body
ReactDOM.createPortal(
  <div style={{position: 'fixed', inset: 0}}>Modal</div>,
  document.body
)
```

---

## 🎯 OMNIA CAPABILITIES (Current State)

### ✅ Working Features
- **3 AI Models**: Gemini Flash, Claude Haiku, Claude Sonnet
- **Hierarchical Memory**: Auto-summary after 29 messages
- **Voice Chat**: Real-time with ElevenLabs + Google TTS/STT
- **File Upload**: Up to 100MB (direct GCS for ≥3MB)
- **Image Generation**: Imagen 3 with gallery
- **PDF Generation**: Puppeteer with fallback
- **Web Search**: Gemini native + Claude Brave API
- **Artifacts**: HTML apps with iframe display (NEW!)
- **Multilingual**: 6 languages (cs, en, ro, de, ru, pl)
- **PWA**: Offline support, installable
- **Multi-device Sync**: IndexedDB ↔ Supabase realtime

### 🏗️ Architecture
- **Frontend**: React + Vite + IndexedDB (Dexie V9)
- **Backend**: Vercel serverless functions (19 endpoints)
- **Database**: Supabase (Postgres + Realtime + Storage)
- **AI**: Gemini 2.5, Claude 3.5, Imagen 3, ElevenLabs

---

## 🐛 DEBUGGING CHECKLIST

When feature doesn't work:

1. **Check both upload AND download sync**
   - Upload to Supabase working? ✓
   - Download from Supabase working? ← Often forgotten!

2. **Verify IndexedDB schema**
   - Field exists in Dexie schema?
   - Migration ran? (check version number)

3. **Check completion flow**
   - Field added during streaming?
   - needsAutoSave flag set?
   - useEffect triggered?

4. **Inspect Supabase**
   - Data in database table?
   - Files in Storage bucket?
   - Correct bucket permissions?

5. **Compare with working feature**
   - How does PDF do it?
   - How do images do it?
   - Copy that pattern!

---

## 📚 KEY FILES

**Core Logic:**
- `/src/App.jsx` - Main orchestration (5566 lines - needs refactoring!)
- `/src/services/sync/chatSync.js` - Supabase sync (upload + download)
- `/src/services/storage/chatDB.js` - IndexedDB operations (Dexie)

**AI Backends:**
- `/api/claude.js` - Claude API + SSE streaming + tool execution
- `/api/gemini.js` - Gemini API + SSE streaming + search grounding
- `/api/imagen.js` - Image generation
- `/api/generate-pdf.js` - PDF generation
- `/api/generate-artifact.js` - Artifact processing (returns base64)

**Components:**
- `/src/components/chat/MessageItem.jsx` - Message rendering + artifacts
- `/src/components/chat/ChatHistory.jsx` - Virtual scrolling (Virtuoso)

---

## 🎯 BEFORE YOU CODE - ASK THESE QUESTIONS:

1. **Does a similar feature exist?** (PDF, images, sources, etc.)
2. **How does it handle upload?** (Backend or frontend?)
3. **How does it handle sync?** (Both upload AND download?)
4. **How does it render UI?** (Component, modal, inline?)
5. **What did user say?** (Listen to their explanation!)

**Golden Rule:** If you don't know → **ASK** or **LOOK** at working code. Don't guess!

---

## 🚨 CRITICAL REMINDERS

1. **Sync needs TWO-WAY mapping** (upload + download)
2. **Frontend uploads files** (not backend)
3. **Copy working patterns** (PDF is the template)
4. **Listen to user** (they know better)
5. **React Portal for modals** (escape stacking context)
6. **Extract after streaming** (not during)
7. **Check Supabase** (database + storage)
8. **Verify both devices** (creator + synced device)

---

*"If it works, don't touch it"*
*"Copy working patterns, don't invent new ones"*
*"Listen first, code second"*

**Last Updated:** November 9, 2025
**Lessons learned from:** Artifacts implementation (2 days of mistakes)
