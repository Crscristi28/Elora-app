# 🎨 Artifacts Streaming Implementation Plan

**Status:** Planning phase
**Goal:** Implement real-time artifact streaming like Claude.ai
**Current:** Artifacts work via tool call (blocks conversation flow)
**Target:** Artifacts stream inline with text (smooth like Claude.ai)

---

## 🚨 CRITICAL: What NOT to Do (Lessons from Failed Attempt)

### ❌ MISTAKE #1: Regex During Streaming
**What we tried:**
```javascript
// WRONG - breaks React state!
delta.text.forEach(chunk => {
  accumulatedText += chunk;
  // Tried to replace <antArtifact> tags during streaming
  const replaced = accumulatedText.replace(/<antArtifact[^>]*>[\s\S]*?<\/antArtifact>/, '[ARTIFACT]');
  setMessages(...); // Re-render → state chaos
});
```

**What happened:**
- ✗ Text disappeared (re-render issues)
- ✗ Markdown broken (regex matched wrong parts)
- ✗ React lost streaming state
- ✗ Complete disaster

**Lesson:** NEVER manipulate streaming text with regex during streaming!

---

### ❌ MISTAKE #2: Replacing Text During Streaming
**Problem:** Any text replacement during streaming causes:
- React re-renders lose delta state
- Accumulated text gets corrupted
- Message component loses focus
- Streaming animation breaks

**Lesson:** Let text stream naturally, extract AFTER completion!

---

## ✅ CORRECT Approach (How Claude.ai Does It)

### Overview
1. **DURING STREAMING:** Display `<antArtifact>` tags in code block (normal rendering)
2. **DETECT COMPLETION:** Watch for closing `</antArtifact>` tag
3. **EXTRACT IMMEDIATELY:** When closing tag detected → extract HTML
4. **DISPLAY FROM MEMORY:** Show artifact using HTML string (no upload yet)
5. **UPLOAD AFTER MESSAGE:** When streaming complete → upload to Supabase

---

## 🎯 Implementation Steps

### Step 1: Let Code Stream Naturally

**During Streaming:**
```javascript
// User sees:
"Let me create an email analyzer for you..."

<antArtifact identifier="email-analyzer" type="application/vnd.ant.code" title="Email Analyzer">
<!DOCTYPE html>
<html>
  <head>
    <title>Email Analyzer</title>
    ... CODE STREAMS HERE LIVE ...
  </head>
</html>
</antArtifact>

"You can use this to analyze your email patterns..."
```

**What happens:**
- ✅ Code block displays HTML (with syntax highlighting)
- ✅ Code block has `max-height: 350px` with scroll
- ✅ User sees code writing in real-time
- ✅ Claude continues writing text below
- ✅ NO regex, NO replacement, NO manipulation!

**Code:**
```javascript
// In streaming handler - DO NOTHING SPECIAL!
accumulatedText += delta.text;
setMessages(prev => prev.map(msg =>
  msg.id === botMessageId
    ? { ...msg, text: accumulatedText }
    : msg
));
```

---

### Step 2: Detect Closing Tag

**Trigger:** When `</antArtifact>` appears in text

```javascript
// Check each delta for closing tag
if (accumulatedText.includes('</antArtifact>')) {
  console.log('🎨 Artifact complete! Extracting...');
  extractArtifact(accumulatedText);
}
```

**Important:**
- This triggers DURING streaming (not after)
- Claude can continue writing text after artifact
- Smooth flow maintained

---

### Step 3: Extract HTML Immediately

**When closing tag detected:**

```javascript
function extractArtifact(text) {
  // Extract artifact metadata and content
  const artifactMatch = text.match(
    /<antArtifact\s+identifier="([^"]+)"\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/antArtifact>/
  );

  if (!artifactMatch) return;

  const [fullMatch, identifier, type, title, htmlContent] = artifactMatch;

  // Create artifact object (NO UPLOAD YET!)
  const artifact = {
    identifier,
    type,
    title,
    html: htmlContent,  // Raw HTML string
    timestamp: Date.now()
  };

  // Replace tag with artifact card placeholder
  const updatedText = text.replace(
    fullMatch,
    `\n\n[ARTIFACT:${identifier}]\n\n`
  );

  // Update message with artifact + cleaned text
  setMessages(prev => prev.map(msg =>
    msg.id === botMessageId
      ? { ...msg, text: updatedText, artifact }
      : msg
  ));

  console.log('✅ Artifact extracted and displayed!');
}
```

---

### Step 4: Display from Memory (No URL Needed!)

**Key Insight:** HTML doesn't need download/blob/URL for display!

**MessageItem.jsx rendering:**
```javascript
// Artifact displays immediately from HTML string
{msg.artifact && (
  <div className="artifact-card">
    <div className="artifact-header">
      <span>🎨 {msg.artifact.title}</span>
      <button onClick={() => openArtifact(msg.artifact)}>Open</button>
    </div>
  </div>
)}

// In fullscreen modal:
<iframe
  srcDoc={artifact.html}  // Direct HTML string - no URL!
  sandbox="allow-scripts allow-same-origin allow-forms..."
/>
```

**No need for:**
- ❌ Blob URL (`URL.createObjectURL`)
- ❌ Supabase Storage URL (yet)
- ❌ Base64 encoding
- ✅ Just raw HTML string in `srcDoc`!

---

### Step 5: Upload After Streaming Complete

**When message streaming finishes:**

```javascript
// onMessageStop callback
async function onStreamingComplete(message) {
  if (message.artifact) {
    console.log('📤 Uploading artifact to Supabase...');

    // Upload HTML to Supabase Storage
    const uploadResult = await uploadBase64ToSupabaseStorage(
      btoa(message.artifact.html),  // Convert to base64
      `artifact-${message.artifact.timestamp}-${message.artifact.title}.html`,
      'attachments'
    );

    // Update artifact with storage URL
    const updatedArtifact = {
      ...message.artifact,
      storageUrl: uploadResult.publicUrl,
      storagePath: uploadResult.path
    };

    // Update message
    setMessages(prev => prev.map(msg =>
      msg.id === message.id
        ? { ...msg, artifact: updatedArtifact, needsAutoSave: true }
        : msg
    ));

    console.log('✅ Artifact uploaded and saved!');
  }
}
```

**Why upload after?**
- Upload doesn't block rendering
- User sees artifact immediately
- If streaming fails, no orphaned files
- Smooth UX like Claude.ai

---

## 🔧 Technical Details

### Code Block Styling (During Streaming)

```css
/* Make code block scrollable for long artifacts */
pre code {
  max-height: 350px;
  overflow-y: auto;
  display: block;
}
```

### Artifact Card Placeholder

When `[ARTIFACT:id]` appears in text, MessageRenderer shows:

```javascript
// In MessageRenderer
const renderContent = (text) => {
  // Detect artifact placeholder
  const parts = text.split(/\[ARTIFACT:([^\]]+)\]/);

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      // This is artifact ID
      return <ArtifactCard key={i} identifier={part} />;
    }
    // Normal markdown text
    return <ReactMarkdown key={i}>{part}</ReactMarkdown>;
  });
};
```

### State Management

```javascript
// Message object structure
{
  id: 'msg_123',
  sender: 'bot',
  text: 'Here is your analyzer...\n\n[ARTIFACT:email-analyzer]\n\nYou can use it to...',
  artifact: {
    identifier: 'email-analyzer',
    type: 'application/vnd.ant.code',
    title: 'Email Analyzer',
    html: '<!DOCTYPE html>...',  // Full HTML
    timestamp: 1699999999,
    storageUrl: 'https://...',    // Added after upload
    storagePath: 'artifacts/...'  // Added after upload
  },
  timestamp: 1699999999
}
```

---

## 🎯 Flow Comparison

### Current (Tool-based) - BLOCKING
```
User: "Create email analyzer"
  ↓
Claude: "I'll create that for you."
  ↓
[Tool call: create_artifact]
  ↓
[WAIT for tool completion] ← BLOCKS HERE!
  ↓
[Tool returns]
  ↓
Claude: [CAN'T CONTINUE - conversation ends]
  ↓
User must send new message to continue
```

### New (Streaming) - SMOOTH
```
User: "Create email analyzer"
  ↓
Claude: "I'll create an email analyzer for you.

<antArtifact...>
<!DOCTYPE html>    ← WRITES CODE LIVE
<html>
...
</antArtifact>

Here's what it does:..."  ← CONTINUES WRITING!
  ↓
[Closing tag detected → extract → display]
  ↓
[User sees artifact card immediately]
  ↓
[Background: upload to Supabase]
  ↓
[Save to IndexedDB with URL]
```

---

## 📋 Implementation Checklist

### Phase 1: Remove Tool (Preparation)
- [ ] Remove `create_artifact` from Claude tools array (`/api/claude.js`)
- [ ] Keep `executeArtifactCreation` for reference (comment out)
- [ ] Test that Claude still works without tool

### Phase 2: Streaming Detection
- [ ] Add closing tag detection in streaming handler
- [ ] Add extraction function (regex for `<antArtifact>`)
- [ ] Test extraction doesn't break markdown

### Phase 3: Display from Memory
- [ ] Update MessageRenderer to detect `[ARTIFACT:id]` placeholder
- [ ] Create ArtifactCard component (inline preview)
- [ ] Test iframe with `srcDoc` displays HTML correctly
- [ ] Verify code block shows streaming HTML nicely

### Phase 4: Upload After Completion
- [ ] Add upload logic in `onMessageStop`
- [ ] Convert HTML string to base64
- [ ] Upload to Supabase Storage
- [ ] Update artifact object with URL
- [ ] Trigger save to IndexedDB

### Phase 5: Testing
- [ ] Test: Artifact streams and displays immediately
- [ ] Test: Claude continues writing after artifact
- [ ] Test: Upload completes in background
- [ ] Test: Artifact persists after refresh
- [ ] Test: Multi-device sync works
- [ ] Test: Download button works

---

## 🚨 Common Pitfalls to Avoid

### 1. Don't Parse During Streaming
```javascript
// ❌ WRONG
delta.forEach(chunk => {
  if (chunk.includes('<antArtifact>')) {
    // Don't do complex parsing here!
  }
});

// ✅ CORRECT
if (accumulatedText.includes('</antArtifact>')) {
  // Parse only when complete
  extractArtifact(accumulatedText);
}
```

### 2. Don't Block on Upload
```javascript
// ❌ WRONG
const url = await uploadArtifact(html);  // Blocks rendering!
displayArtifact(url);

// ✅ CORRECT
displayArtifact(html);  // Show immediately
uploadArtifact(html).then(updateWithUrl);  // Upload async
```

### 3. Don't Forget Two-Way Sync
```javascript
// Upload: IndexedDB → Supabase
artifact: artifactForDB  // ✅

// Download: Supabase → IndexedDB
artifact: msg.artifact   // ✅ Must include!
```

---

## 📚 Reference: Claude.ai Observations

**What we observed:**
1. Code appears in expandable code block during streaming
2. Closing tag triggers instant artifact card appearance
3. Text continues flowing after artifact
4. No blocking, no waiting
5. Perfectly smooth UX

**Key insight from user:**
> "Claude už přestal psát kod a už psal normálně do chatu, už se dělal rovnou ta extrakce"

Translation: When closing tag appears, extraction happens IMMEDIATELY during streaming, not waiting for completion.

---

## 🎯 Success Criteria

Artifacts implementation is complete when:

1. ✅ Claude can write artifact code inline (streaming visible)
2. ✅ Artifact card appears as soon as closing tag completes
3. ✅ Claude continues writing text after artifact
4. ✅ No blocking/waiting during conversation
5. ✅ Artifact displays immediately (from HTML string)
6. ✅ Upload happens in background (doesn't block UX)
7. ✅ Persistence works (IndexedDB + Supabase sync)
8. ✅ Multi-device sync works
9. ✅ Flow feels identical to Claude.ai

---

## 💡 Additional Notes

### Why This Approach Works

1. **No blocking:** Extraction during streaming, not after
2. **No upload delay:** Display from memory first
3. **Smooth flow:** Text continues after artifact
4. **React-friendly:** No state manipulation during streaming
5. **Simple:** Just string operations, no complex state

### Anthropic's Implementation (Research)

- Uses `<antArtifact>` custom XML tags
- NOT using markdown code blocks
- Likely client-side detection of closing tag
- Probably using similar extraction approach
- Upload definitely happens after display (confirmed by UX observation)

### Performance Considerations

- Extraction regex is fast (runs once when closing tag detected)
- No base64 conversion until upload
- iframe `srcDoc` is instant (no network request)
- Upload doesn't block because async
- IndexedDB save triggered by `needsAutoSave` flag

---

**Created:** November 9, 2025
**For:** Tomorrow's implementation session
**Remember:** LISTEN FIRST, CODE SECOND. Copy proven patterns!
