// api/elevenlabs-stt.js - ELEVENLABS SPEECH-TO-TEXT
// 🎤 Premium STT with language detection & speaker diarization
// ✅ Replaces OpenAI Whisper with ElevenLabs native STT

export const config = {
  runtime: 'edge',
  maxDuration: 30,
}

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🎤 ElevenLabs STT API called');

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.error('❌ ElevenLabs API key missing');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuration error',
          message: 'ElevenLabs API key not configured'
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get audio data from request body
    const audioBuffer = await req.arrayBuffer();
    
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      console.error('❌ No audio data received');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No audio data',
          message: 'Nebyla přijata žádná audio data'
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔧 ENHANCED: Better size validation
    const audioSizeKB = Math.round(audioBuffer.byteLength / 1024);
    console.log('🎵 Audio data received:', {
      size: audioBuffer.byteLength,
      sizeKB: audioSizeKB,
      sizeMB: Math.round(audioSizeKB / 1024 * 100) / 100
    });

    // 🔧 Reject too small files (likely silence/noise)
    if (audioBuffer.byteLength < 1000) { // Less than 1KB
      console.warn('⚠️ Audio file too small - likely silence');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Audio too short',
          message: 'Audio nahrávka je příliš krátká nebo tichá'
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔧 Reject too large files (1GB ElevenLabs limit)
    if (audioBuffer.byteLength > 1024 * 1024 * 1024) { // 1GB limit
      console.warn('⚠️ Audio file too large');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Audio too large',
          message: 'Audio nahrávka je příliš velká (max 1GB)'
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔧 Smart MIME type detection
    const audioBlob = new Blob([audioBuffer], { 
      type: detectAudioMimeType(audioBuffer)
    });
    
    // Create FormData for ElevenLabs STT API
    const formData = new FormData();
    formData.append('file', audioBlob, getAudioFileName(audioBuffer));
    formData.append('model_id', 'scribe_v1'); // Use stable model
    
    // 🆕 ENHANCED: Auto-detect language (don't force specific language)
    // formData.append('language_code', null); // Let ElevenLabs auto-detect
    
    formData.append('enable_logging', 'false'); // Privacy protection
    formData.append('tag_audio_events', 'true'); // Detect laughter, etc.
    formData.append('timestamps_granularity', 'word'); // Word-level timing
    formData.append('diarize', 'false'); // Single speaker expected
    formData.append('temperature', '0.2'); // Lower randomness for better accuracy

    console.log('📤 Sending to ElevenLabs STT API...');

    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        // Don't set Content-Type - let browser set boundary for FormData
      },
      body: formData
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('❌ ElevenLabs STT API error:', {
        status: elevenLabsResponse.status,
        statusText: elevenLabsResponse.statusText,
        error: errorText
      });
      
      // 🔧 Better error messages
      const errorMessage = getLocalizedErrorMessage(elevenLabsResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ElevenLabs STT API failed',
          message: errorMessage,
          details: errorText,
          retryable: isRetryableError(elevenLabsResponse.status)
        }), 
        { status: elevenLabsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sttResult = await elevenLabsResponse.json();
    
    // 🔧 Better result validation
    if (!sttResult.text || sttResult.text.trim().length === 0) {
      console.warn('⚠️ ElevenLabs returned empty text');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Empty transcription',
          message: 'Nepodařilo se rozpoznat žádný text',
          details: 'Zkuste mluvit hlasitěji nebo blíže k mikrofonu'
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ ElevenLabs STT transcription successful:', {
      text: sttResult.text?.substring(0, 100) + '...',
      textLength: sttResult.text?.length || 0,
      language: sttResult.language_code,
      probability: sttResult.language_probability,
      words: sttResult.words?.length || 0
    });

    // 🔧 Enhanced language detection
    const detectedLanguage = enhancedLanguageDetection(sttResult.text, sttResult.language_code);
    const confidence = sttResult.language_probability || 0.95;
    
    // 🔧 Text post-processing
    const cleanedText = postProcessTranscription(sttResult.text, detectedLanguage);

    return new Response(
      JSON.stringify({
        success: true,
        text: cleanedText,
        language: detectedLanguage,
        confidence: confidence,
        message: 'Řeč úspěšně rozpoznána pomocí ElevenLabs',
        details: {
          service: 'elevenlabs_stt',
          originalLanguage: sttResult.language_code || 'unknown',
          detectedLanguage: detectedLanguage,
          audioSize: audioSizeKB,
          words: sttResult.words || [],
          originalText: sttResult.text
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 ElevenLabs STT unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Speech recognition failed',
        message: 'ElevenLabs rozpoznávání řeči selhalo - zkuste to znovu',
        details: error.message,
        retryable: true
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// 🔧 Smart MIME type detection
function detectAudioMimeType(audioBuffer) {
  const uint8Array = new Uint8Array(audioBuffer.slice(0, 12));
  
  // Check for WebM signature
  if (uint8Array[0] === 0x1A && uint8Array[1] === 0x45 && uint8Array[2] === 0xDF && uint8Array[3] === 0xA3) {
    return 'audio/webm';
  }
  
  // Check for MP4 signature
  if (uint8Array[4] === 0x66 && uint8Array[5] === 0x74 && uint8Array[6] === 0x79 && uint8Array[7] === 0x70) {
    return 'audio/mp4';
  }
  
  // Check for WAV signature
  if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
    return 'audio/wav';
  }
  
  // Default fallback
  return 'audio/webm';
}

// 🔧 Smart filename generation
function getAudioFileName(audioBuffer) {
  const mimeType = detectAudioMimeType(audioBuffer);
  
  switch (mimeType) {
    case 'audio/mp4':
      return 'audio.m4a';
    case 'audio/wav':
      return 'audio.wav';
    case 'audio/webm':
    default:
      return 'audio.webm';
  }
}

// 🔧 Enhanced language detection combining ElevenLabs + text analysis
function enhancedLanguageDetection(text, elevenLabsLanguage) {
  if (!text) return 'cs';
  
  const lowerText = text.toLowerCase().trim();
  
  // Strong indicators for explicit language requests
  const explicitCzech = ['mluvte česky', 'v češtině', 'česká odpověď', 'přepni na češtinu'];
  const explicitEnglish = ['speak english', 'in english', 'switch to english', 'english please'];
  const explicitRomanian = ['vorbește română', 'în română', 'schimbă la română'];
  
  for (const phrase of explicitCzech) {
    if (lowerText.includes(phrase)) return 'cs';
  }
  for (const phrase of explicitEnglish) {
    if (lowerText.includes(phrase)) return 'en';
  }
  for (const phrase of explicitRomanian) {
    if (lowerText.includes(phrase)) return 'ro';
  }
  
  // Enhanced word-based detection (real-world no-diacritics support)
  const czechWords = ['muzes', 'muzeme', 'dekuji', 'prosim', 'ahoj', 'jsem', 'jsi', 'mas', 'jak', 'co', 'kde'];
  const englishWords = ['what', 'how', 'where', 'when', 'why', 'doing', 'think', 'help', 'please', 'the', 'and'];
  const romanianWords = ['ce', 'cum', 'unde', 'faci', 'esti', 'sunt', 'multumesc', 'salut', 'cine', 'sa', 'si'];
  
  const czechCount = czechWords.filter(word => lowerText.includes(word)).length;
  const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
  const romanianCount = romanianWords.filter(word => lowerText.includes(word)).length;
  
  const maxCount = Math.max(czechCount, englishCount, romanianCount);
  
  if (maxCount >= 2) {
    if (czechCount === maxCount) return 'cs';
    if (englishCount === maxCount) return 'en';
    if (romanianCount === maxCount) return 'ro';
  }
  
  // Fallback to ElevenLabs detection if confident
  if (elevenLabsLanguage && ['cs', 'en', 'ro', 'czech', 'english', 'romanian'].includes(elevenLabsLanguage.toLowerCase())) {
    const languageMap = {
      'czech': 'cs', 'cs': 'cs',
      'english': 'en', 'en': 'en',
      'romanian': 'ro', 'ro': 'ro'
    };
    return languageMap[elevenLabsLanguage.toLowerCase()] || 'cs';
  }
  
  return 'cs'; // Safe default
}

// 🔧 Post-process transcription for better quality
function postProcessTranscription(text, language) {
  if (!text) return '';
  
  let cleaned = text.trim();
  
  // Remove common STT artifacts
  cleaned = cleaned.replace(/\[.*?\]/g, ''); // Remove [bracketed] content
  cleaned = cleaned.replace(/\(.*?\)/g, ''); // Remove (parenthetical) content
  cleaned = cleaned.replace(/\s+/g, ' '); // Normalize whitespace
  
  // Language-specific cleaning
  switch (language) {
    case 'cs':
      // Czech-specific post-processing
      cleaned = cleaned.replace(/\buum\b/gi, ''); // Remove filler words
      cleaned = cleaned.replace(/\behm\b/gi, '');
      break;
    case 'en':
      // English-specific post-processing
      cleaned = cleaned.replace(/\buh\b/gi, ''); // Remove filler words
      cleaned = cleaned.replace(/\bum\b/gi, '');
      break;
    case 'ro':
      // Romanian-specific post-processing
      cleaned = cleaned.replace(/\beh\b/gi, ''); // Remove filler words
      break;
  }
  
  return cleaned.trim();
}

// 🔧 Better error messages
function getLocalizedErrorMessage(status, errorText) {
  switch (status) {
    case 400:
      return 'Neplatný audio formát - zkuste jiný typ nahrávky';
    case 413:
      return 'Audio soubor je příliš velký - zkuste kratší nahrávku';
    case 429:
      return 'Příliš mnoho požadavků - zkuste to za chvíli';
    case 500:
    case 502:
    case 503:
      return 'Chyba ElevenLabs serveru - zkuste to znovu za chvíli';
    default:
      return `Chyba rozpoznávání řeči (${status}) - zkuste to znovu`;
  }
}

// 🔧 Check if error is retryable
function isRetryableError(status) {
  // Retryable errors: server errors, rate limits, timeouts
  return [429, 500, 502, 503, 504].includes(status);
}