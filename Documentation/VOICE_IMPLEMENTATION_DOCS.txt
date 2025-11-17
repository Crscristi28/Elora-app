# Omnia Voice Implementation Documentation

This document provides comprehensive technical documentation of the STT/TTS/voice implementation in the Omnia codebase, including all recent fixes and improvements.

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Voice Components](#voice-components)
4. [Audio Processing Flow](#audio-processing-flow)
5. [Voice Chat Flow](#voice-chat-flow)
6. [Error Handling](#error-handling)
7. [Recent Fixes](#recent-fixes)
8. [Configuration](#configuration)

## Overview

The Omnia voice system uses a dual-provider approach with Google as the primary provider and ElevenLabs as a fallback. This ensures high availability and quality for both Speech-to-Text (STT) and Text-to-Speech (TTS) operations.

### Key Features:
- **Primary Provider**: Google Cloud (STT & TTS)
- **Fallback Provider**: ElevenLabs (STT & TTS)
- **Language Support**: Czech (cs), English (en), Romanian (ro)
- **Audio Formats**: WebM/Opus (preferred), MP4, WAV
- **Voice Models**: Google Chirp3-HD, Studio, Neural2, Wavenet; ElevenLabs Multilingual v2

## API Endpoints

### 1. Google STT (`/api/google-stt.js`)

**Purpose**: Primary speech-to-text endpoint using Google Cloud Speech-to-Text API

**Key Features**:
- Supports multiple audio encodings (WEBM_OPUS, LINEAR16, OGG_OPUS)
- Automatic language detection with support for cs-CZ, en-US, ro-RO
- Enhanced punctuation and word-level timestamps
- Uses `latest_long` model for better accuracy

**Request Format**:
```javascript
POST /api/google-stt
Headers: Content-Type: application/octet-stream
Body: Audio buffer (arrayBuffer)
```

**Response Format**:
```javascript
{
  success: boolean,
  text: string,           // Transcribed text
  language: string,       // Detected language code
  confidence: number,     // Confidence score (0-1)
  message: string,
  details: {
    service: 'google_stt',
    originalLanguage: string,
    detectedLanguage: string,
    audioSize: number,     // KB
    words: array,          // Word timestamps
    originalText: string   // Before post-processing
  }
}
```

**Error Handling**:
- File size validation (1KB - 10MB)
- Smart audio encoding detection
- Localized error messages in Czech
- Retryable error detection (429, 500, 502, 503, 504)

### 2. Google TTS (`/api/google-tts.js`)

**Purpose**: Primary text-to-speech endpoint using Google Cloud Text-to-Speech API

**Key Features**:
- Chirp3-HD voices for English (highest quality)
- Studio voices for major languages
- Wavenet/Neural2 voices for other languages
- Adaptive audio configuration based on voice type
- Multi-level fallback chain: Chirp3-HD → Studio → Neural2 → Standard

**Request Format**:
```javascript
POST /api/google-tts
Headers: Content-Type: application/json
Body: {
  text: string,
  language: string,  // Language code (cs, en, ro, etc.)
  voice: string      // Optional voice variant
}
```

**Voice Configuration**:
```javascript
// Chirp3-HD (English only)
{
  audioEncoding: 'MP3',
  speakingRate: 1.15,
  effectsProfileId: ['headphone-class-device']
  // No pitch/volume support
}

// Other voices
{
  audioEncoding: 'MP3',
  speakingRate: 1.15,
  pitch: 0.4,
  volumeGainDb: 2.5,
  effectsProfileId: ['headphone-class-device']
}
```

**Response**: Audio stream (MP3 format)

### 3. ElevenLabs TTS (`/api/elevenlabs-tts.js`)

**Purpose**: Fallback text-to-speech with balanced voice settings

**Key Features**:
- Multilingual v2 model
- Optimized voice settings for natural speech
- Special handling for numbers and temperature

**Voice Settings**:
```javascript
{
  stability: 0.50,
  similarity_boost: 0.75,
  style: 0.25,
  use_speaker_boost: false
}
```

### 4. ElevenLabs STT (`/api/elevenlabs-stt.js`)

**Purpose**: Fallback speech-to-text with enhanced language detection

**Key Features**:
- Scribe v1 model for stability
- Auto language detection
- Word-level timestamps
- Smart MIME type detection

## Voice Components

### 1. VoiceButton (`/src/components/ui/VoiceButton.jsx`)

**Purpose**: Provides TTS playback for any text content

**Key Features**:
- Auto language detection
- Emoji sanitization before TTS
- Simple HTML5 Audio playback
- Fallback from ElevenLabs to Google

**Implementation**:
```javascript
// TTS flow
1. Detect language from text
2. Sanitize text (remove emojis, fix formatting)
3. Try primary TTS provider
4. Fallback to secondary if needed
5. Play using HTML5 Audio API
```

### 2. SimpleVoiceRecorder (`/src/components/voice/SimpleVoiceRecorder.jsx`)

**Purpose**: Voice recording component with visual feedback

**Key Features**:
- Audio level monitoring with visual meter
- Recording timer
- Cancel functionality
- Haptic feedback on mobile
- Minimum/maximum recording time enforcement

**Recording Configuration**:
```javascript
{
  sampleRate: 16000,      // Standard for STT compatibility
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  mimeType: 'audio/webm;codecs=opus'
}
```

**STT Flow**:
```javascript
1. Record audio (2-30 seconds)
2. Try Google STT (primary)
3. Fallback to ElevenLabs if Google fails
4. Return transcribed text with language detection
```

### 3. VoiceScreen (`/src/components/chat/VoiceScreen.jsx`)

**Purpose**: Full-screen voice chat interface

**Key Features**:
- Chat history display
- Visual feedback for speaking/listening states
- Animated glow effects
- Message bubbles with speaker identification

## Audio Processing Flow

### 1. STT Processing Flow
```
User speaks → Microphone capture → WebM/Opus encoding
→ Google STT API (primary) → Language detection
→ Text post-processing → Return transcript
↓ (on failure)
ElevenLabs STT API (fallback) → Same processing
```

### 2. TTS Processing Flow
```
Text input → Language detection → Text sanitization
→ Remove emojis/markdown → Provider selection
→ Google TTS (primary) or ElevenLabs (fallback)
→ Audio generation → HTML5 Audio playback
```

### 3. Text Preprocessing

**Sanitization (`sanitizeText.js`)**:
- Removes all emojis
- Cleans markdown formatting
- Converts numbers to words (language-specific)
- Handles temperature, currency, percentages
- Expands abbreviations

**TTS Preprocessing (`ttsPreprocessing.js`)**:
- Mathematical symbol conversion
- Unit conversions
- Language-specific number pronunciation
- Abbreviation expansion

## Voice Chat Flow

### 1. Voice Chat Initialization
```javascript
1. User clicks voice button
2. VoiceScreen component opens
3. Audio context unlocked on user interaction
4. Microphone permission requested
```

### 2. Conversation Flow
```javascript
1. User records message (SimpleVoiceRecorder)
2. STT transcription (Google → ElevenLabs fallback)
3. Send to AI model (any model supports voice)
4. Receive AI response
5. TTS playback using processVoiceResponse()
6. Display in chat interface
```

### 3. Voice Response Processing (Critical Fix)
```javascript
// Fixed implementation (commit f415584)
const processVoiceResponse = async (responseText, language) => {
  // Generate audio
  const audioBlob = await generateAudioForSentence(responseText, language);
  
  // Use simple HTML5 Audio (not mobileAudioManager)
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  // Set up event handlers
  audio.onplay = () => setIsAudioPlaying(true);
  audio.onended = () => {
    setIsAudioPlaying(false);
    URL.revokeObjectURL(audioUrl);
  };
  
  // Play audio
  await audio.play();
};
```

## Error Handling

### 1. STT Error Handling

**Common Errors**:
- Audio too short (< 2 seconds)
- Audio too large (> 10MB for Google, > 1GB for ElevenLabs)
- Invalid audio format
- Network/API failures

**Error Response Format**:
```javascript
{
  success: false,
  error: string,
  message: string,      // Localized message
  details: string,      // Technical details
  retryable: boolean
}
```

### 2. TTS Error Handling

**Fallback Chain**:
1. Try primary voice model
2. Fallback to lower quality model
3. Switch to alternative provider
4. Return error if all fail

**Common Issues**:
- Unsupported voice parameters (Chirp3-HD)
- Rate limits
- Invalid text input

## Recent Fixes

### 1. Voice Chat TTS Fix (commit f415584)
**Problem**: Voice responses not playing in voice chat mode
**Solution**: Replaced mobileAudioManager with simple HTML5 Audio API
**Impact**: Fixed audio playback in voice screen

### 2. Google STT Format Fix (commits 0b25f93, e5d6b52)
**Problem**: MP4 audio format not supported by Google STT
**Solution**: Force LINEAR16 encoding for MP4 files, consistent WEBM format
**Impact**: Improved STT compatibility across devices

### 3. Emoji Handling (commit 4dde283)
**Problem**: Emojis causing TTS pronunciation issues
**Solution**: Apply same emoji sanitization to both Google and ElevenLabs
**Impact**: Consistent TTS quality across providers

### 4. Chirp3-HD Implementation (commits 875f3f4, 1108ff5)
**Problem**: Need highest quality TTS voices
**Solution**: Implement Google's Chirp3-HD with adaptive configuration
**Impact**: Ultra-realistic English TTS

### 5. Voice Chat for All Models (commit 2c32732)
**Problem**: Voice chat restricted to GPT-4 only
**Solution**: Remove model restriction, enable for all AI models
**Impact**: Universal voice chat support

### 6. STT Fallback System (commit 92fff8c)
**Problem**: Single point of failure for STT
**Solution**: Implement Google/ElevenLabs fallback system
**Impact**: Higher reliability for voice recognition

## Configuration

### Environment Variables
```bash
# Google Cloud
GOOGLE_API_KEY=your_google_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=MpbYQvoTmXjHkaxtLiSh  # Optional, has default
```

### Voice Selection Logic
```javascript
// Primary: Google TTS
USE_ELEVENLABS = false  // in VoiceButton.jsx

// Language → Voice mapping
'en' → Chirp3-HD (highest quality)
'en-gb', 'es', 'de', 'fr' → Studio voices
'cs', 'ro' → Wavenet voices
Others → Neural2 or Standard voices
```

### Audio Settings
```javascript
// Recording
sampleRate: 16000 Hz
channels: Mono
format: WebM/Opus (preferred)

// Playback
format: MP3
speakingRate: 1.15x (15% faster)
pitch: +0.4 (slightly higher)
volume: +2.5dB (clearer)
```

## Implementation Checklist for Redeployment

When reimplementing these fixes after reverting to a previous deployment:

1. **Update API Endpoints**
   - [ ] Copy all 4 API files (google-stt.js, google-tts.js, elevenlabs-stt.js, elevenlabs-tts.js)
   - [ ] Ensure environment variables are set

2. **Fix Voice Chat TTS**
   - [ ] Update processVoiceResponse() to use HTML5 Audio
   - [ ] Remove mobileAudioManager usage from voice playback
   - [ ] Keep mobileAudioManager for other audio functions

3. **Update Voice Components**
   - [ ] Copy VoiceButton.jsx with emoji sanitization
   - [ ] Copy SimpleVoiceRecorder.jsx with Google/ElevenLabs fallback
   - [ ] Copy VoiceScreen.jsx with visual improvements

4. **Text Processing**
   - [ ] Copy sanitizeText.js with emoji removal
   - [ ] Copy ttsPreprocessing.js with math symbol fixes
   - [ ] Ensure language detection is working

5. **Configuration**
   - [ ] Set USE_ELEVENLABS = false for Google as primary
   - [ ] Configure voice mappings in google-tts.js
   - [ ] Test fallback chains

6. **Testing**
   - [ ] Test voice recording with different durations
   - [ ] Test TTS with emojis and special characters
   - [ ] Test language detection and switching
   - [ ] Test voice chat with all AI models
   - [ ] Test error scenarios and fallbacks

## Debugging Tips

### Common Issues and Solutions

1. **No audio playback in voice chat**
   - Check: processVoiceResponse uses HTML5 Audio
   - Check: fromVoice && showVoiceScreen conditions
   - Add debug logs in handleSend()

2. **STT fails with specific audio**
   - Check: Audio encoding detection
   - Check: Sample rate consistency (16000 Hz)
   - Try different MIME types

3. **TTS sounds robotic/fast**
   - Check: Voice settings (stability, similarity_boost)
   - Check: Text preprocessing (emoji removal)
   - Verify speakingRate settings

4. **Language detection issues**
   - Check: enhancedLanguageDetection() logic
   - Verify word lists for each language
   - Test with mixed language input

### Debug Logging

Key log points to monitor:
```javascript
// STT
'🎤 Google STT API called'
'🎵 Audio data received:'
'✅ Google STT transcription successful:'

// TTS  
'🎵 STUDIO TTS request:'
'✅ CHIRP3-HD TTS SUCCESS:'
'🔄 Fallback to Standard voice...'

// Voice Chat
'🎵 Processing voice response - INSTANT MODE:'
'🎵 Claude complete, instant voice playback...'
```

## Summary

The Omnia voice system provides a robust, multi-provider solution for voice interactions with:
- Automatic fallbacks for high availability
- Language-aware text processing
- Optimized voice settings for natural speech
- Visual feedback and good UX
- Support for all AI models

The recent fixes have significantly improved reliability and quality, particularly for voice chat interactions and cross-device compatibility.