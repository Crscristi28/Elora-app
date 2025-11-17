# 🎤 Deepgram Voice Chat Migration Plan

**Status:** Ready to Implement
**Priority:** High
**Estimated Time:** 4-5 days
**Date Created:** November 15, 2025

---

## 📋 Objective

Replace ElevenLabs + Google TTS/STT with **Deepgram WebSocket** (both STT and TTS) for real-time voice chat with interruption support.

---

## 🎯 Why Migrate?

### Current Problems:
- ❌ ElevenLabs + Google = 2 providers (complexity)
- ❌ No interruption support (can't stop AI mid-sentence)
- ❌ REST API = higher latency
- ❌ No free tier (ElevenLabs expensive)

### Deepgram Benefits:
- ✅ Single provider (STT + TTS)
- ✅ WebSocket = real-time streaming
- ✅ Interruption support (Clear message + client VAD)
- ✅ **$200 free credits** (45,000 minutes STT)
- ✅ Lower latency (<50ms interruption)
- ✅ All 6 Omnia languages (cs, en, ro, de, ru, pl)

---

## 💰 Cost Comparison

### Current (ElevenLabs + Google):
```
STT: Google @ $0.006/min × 500 min = $3.00/month
TTS: ElevenLabs @ $0.30/1k chars × 150k chars = $45.00/month
TOTAL: $48/month
```

### After Deepgram:
```
STT: Deepgram @ $0.0077/min × 500 min = $3.85/month
TTS: Deepgram @ $0.030/1k chars × 150k chars = $4.50/month
TOTAL: $8.35/month

SAVINGS: $39.65/month (83% reduction)
```

**Free Tier:** $200 credit = 25,974 minutes STT or 6.6M characters TTS (3-6 months free!)

---

## 🏗️ Architecture

### Recommended: Dual WebSocket + Client VAD

```
┌─────────────────────────────────┐
│      OMNIA PWA (Browser)        │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Client-Side VAD         │  │
│  │  (Silero - instant)      │  │
│  │  Detects user speech     │  │
│  └──────────┬───────────────┘  │
│             │ <50ms             │
│             ↓                   │
│  ┌──────────────────────────┐  │
│  │  Interruption Handler    │  │
│  │  - Send Clear to TTS     │  │
│  │  - Stop audio playback   │  │
│  └──────────────────────────┘  │
│                                 │
│  STT WebSocket (always on)      │
│  ↓ Transcript                   │
│  Claude/Gemini (current logic)  │
│  ↓ Response                     │
│  TTS WebSocket (on-demand)      │
│  ↓ Audio chunks                 │
│  Audio Playback Manager         │
└─────────────────────────────────┘
         ↕️ WebSocket
┌─────────────────────────────────┐
│      Deepgram API               │
│  - Nova-3 (STT)                 │
│  - Aura-2 (TTS)                 │
└─────────────────────────────────┘
```

---

## 📅 Implementation Timeline

### Day 1: Setup & Basic Connection
- [ ] Sign up for Deepgram account ($200 free credits)
- [ ] Create `/api/deepgram-token.js` (temp token generator)
- [ ] Install dependencies: `@ricky0123/vad-web`, `@deepgram/sdk`
- [ ] Test basic WebSocket connection (STT + TTS)

### Day 2: Core Services
- [ ] Create `DeepgramSTTService` (`/src/services/voice/deepgram-stt.service.js`)
- [ ] Create `DeepgramTTSService` (`/src/services/voice/deepgram-tts.service.js`)
- [ ] Create `VADService` (`/src/services/voice/vad.service.js`)
- [ ] Create `AudioPlaybackManager` (`/src/utils/audio/AudioPlaybackManager.js`)

### Day 3: Integration
- [ ] Create `InterruptibleVoiceChat` component
- [ ] Replace `SimpleVoiceRecorder` with new component
- [ ] Wire up VAD → interruption handler
- [ ] Connect to existing Claude/Gemini chat flow
- [ ] Test interruption flow

### Day 4: Testing & Polish
- [ ] Test all 6 languages (cs, en, ro, de, ru, pl)
- [ ] Test interruption latency (<100ms target)
- [ ] Edge cases (rapid interrupts, network issues)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile PWA testing (iOS, Android)

### Day 5: Cleanup & Deploy
- [ ] Remove ElevenLabs code completely
- [ ] Remove Google STT/TTS code
- [ ] Update CLAUDE.md documentation
- [ ] Commit: "🔥 Replace ElevenLabs/Google with Deepgram WebSocket"
- [ ] Deploy to production
- [ ] Monitor usage & cost

---

## 🔑 Key Implementation Details

### 1. Token Security (Backend)

**File:** `/api/deepgram-token.js`

```javascript
import { createClient } from '@deepgram/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  try {
    // Create 10-second temporary key (security!)
    const { key } = await deepgram.manage.createProjectKey(
      process.env.DEEPGRAM_PROJECT_ID,
      {
        comment: 'Temporary browser key',
        scopes: ['usage:write'],
        time_to_live_in_seconds: 10
      }
    );

    res.status(200).json({ key });
  } catch (error) {
    console.error('Token generation failed:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
```

**Environment Variables:**
```bash
DEEPGRAM_API_KEY=your_api_key
DEEPGRAM_PROJECT_ID=your_project_id
```

### 2. Client-Side VAD (Instant Interruption)

```javascript
import { MicVAD } from '@ricky0123/vad-web';

const vad = await MicVAD.new({
  onSpeechStart: () => {
    // User started speaking - interrupt AI if playing
    if (isTTSPlaying) {
      handleInterruption();
    }
  }
});

vad.start(); // Always listening for interruptions
```

**Latency:** <50ms (instant feel!)

### 3. TTS Interruption (Clear Message)

```javascript
function handleInterruption() {
  console.log('🛑 USER INTERRUPTED AI');

  // 1. Send Clear to Deepgram TTS WebSocket
  ttsSocket.send(JSON.stringify({ type: 'Clear' }));

  // 2. Stop audio playback immediately
  audioContext.suspend();
  audioQueue = [];

  // 3. Resume audio context for next playback
  audioContext.resume();

  isTTSPlaying = false;
}
```

**Deepgram Response:**
```json
{
  "type": "Cleared",
  "sequence_id": 0
}
```

Latency: ~40-50ms server-side processing

---

## 🎤 Voice Models

### STT (Speech-to-Text):
```javascript
model: "nova-3"
language: "cs" // or "en", "ro", "de", "ru", "pl"
```

**Features:**
- Multi-language support (all 6 Omnia languages)
- Smart formatting (punctuation, capitalization)
- Interim results (real-time partial transcripts)
- UtteranceEnd detection (backup interruption trigger)

### TTS (Text-to-Speech):
```javascript
model: "aura-2-thalia-en" // Female, professional
// OR
model: "aura-2-apollo-en" // Male, confident
```

**Available Voices (English only for now):**
- Thalia, Andromeda, Helena (female)
- Apollo, Arcas, Aries (male)
- 44 voices total

**Note:** Other languages fallback to Google TTS if needed (or wait for Deepgram multilingual expansion)

---

## 📊 Success Metrics

### Performance Targets:
- ✅ Interruption latency: <100ms (target: 50ms)
- ✅ STT transcription latency: <300ms
- ✅ TTS first audio chunk: <200ms
- ✅ False positive interruptions: <1%

### Cost Targets:
- ✅ Monthly cost: <$10 (vs $48 current)
- ✅ Use free tier credits for 3-6 months
- ✅ Stay within free tier as long as possible

### UX Targets:
- ✅ Feels like ChatGPT Advanced Voice Mode
- ✅ Natural conversation flow
- ✅ Can interrupt AI anytime
- ✅ No noticeable latency

---

## 🔧 Files to Create

```
/api/
  deepgram-token.js                    (NEW - token generator)

/src/services/voice/
  deepgram-stt.service.js             (NEW - STT WebSocket)
  deepgram-tts.service.js             (NEW - TTS WebSocket)
  vad.service.js                      (NEW - client VAD)

/src/utils/audio/
  AudioPlaybackManager.js             (NEW - interruption-aware playback)

/src/components/voice/
  InterruptibleVoiceChat.jsx          (NEW - replaces SimpleVoiceRecorder)

/src/hooks/
  useDeepgramSTT.js                   (OPTIONAL - React hook wrapper)
  useDeepgramTTS.js                   (OPTIONAL - React hook wrapper)
```

---

## 🗑️ Files to Remove

```
/api/
  elevenlabs-tts.js                   (DELETE - no longer needed)
  elevenlabs-stt.js                   (DELETE - if exists)
  google-stt.js                       (DELETE - replaced by Deepgram)

/src/services/voice/
  elevenlabs.service.js               (DELETE - old provider)
```

**Keep:**
```
/api/google-tts.js                    (KEEP - fallback for non-English if needed)
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Czech Language Not Working
**Solution:** Deepgram supports Czech (cs-CZ) in Nova-3 model. Test thoroughly.

### Issue 2: Multiple Rapid Interruptions
**Solution:** Track `clearInProgress` flag to prevent duplicate Clear messages.

### Issue 3: Network Latency Delays Clear
**Solution:** Always clear client-side audio immediately, server Clear is secondary.

### Issue 4: VAD False Positives
**Solution:** Tune thresholds (`positiveSpeechThreshold: 0.7`) and add minimum speech frames.

---

## 🎯 Rollback Plan

If Deepgram has issues:

1. **Keep ElevenLabs/Google in git history** (don't force-delete)
2. **Feature flag:** Add `USE_DEEPGRAM` env variable
3. **Gradual rollout:** Test with subset of users first
4. **Quick revert:** `git revert <commit-hash>` if needed

---

## 📚 Resources

- Deepgram STT Docs: https://developers.deepgram.com/docs/streaming
- Deepgram TTS Docs: https://developers.deepgram.com/docs/tts-websocket-streaming
- TTS Clear Message: https://developers.deepgram.com/docs/tts-ws-clear
- Silero VAD: https://github.com/ricky0123/vad
- GitHub Example: https://github.com/deepgram/dg_react_agent

---

## ✅ Checklist Before Starting

- [ ] Deepgram account created
- [ ] $200 free credits confirmed
- [ ] API keys saved in `.env`
- [ ] Current voice chat working (baseline)
- [ ] Git branch created: `feature/deepgram-voice-migration`
- [ ] CLAUDE.md reviewed
- [ ] Time blocked (4-5 days uninterrupted)

---

**Next Steps:** Review this plan, approve, and start Day 1! 🚀
