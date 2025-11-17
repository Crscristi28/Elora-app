// api/google-stt.js - GOOGLE SPEECH-TO-TEXT FALLBACK
// 🎤 Google Cloud STT with same functionality as ElevenLabs STT
// ✅ Maintains exact same response format and language detection

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
    console.log('🎤 Google STT API called');

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      console.error('❌ Google API key missing');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuration error',
          message: 'Google API key not configured'
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

    // 🔧 ENHANCED: Better size validation (same as ElevenLabs)
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

    // 🔧 Reject too large files (Google limit is 10MB for sync)
    if (audioBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
      console.warn('⚠️ Audio file too large');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Audio too large',
          message: 'Audio nahrávka je příliš velká (max 10MB)'
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔧 Smart audio encoding detection and conversion
    const audioEncoding = detectGoogleAudioEncoding(audioBuffer);
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // 🔧 Google STT request with ElevenLabs-style settings (auto-detect language)
    const sttRequest = {
      config: {
        encoding: audioEncoding,
        sampleRateHertz: 44100, // High quality sample rate for better recognition 
        
        // 🔧 SMART LANGUAGE DETECTION using Omnia's system
        languageCode: 'cs-CZ', // Primary language (most common)
        alternativeLanguageCodes: ['en-US', 'ro-RO'], // Alternative languages
        
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        maxAlternatives: 1,
        profanityFilter: false,
        useEnhanced: true, // Use enhanced model for better accuracy
        model: 'latest_long', // Better accuracy (per project docs)
      },
      audio: {
        content: base64Audio
      }
    };

    console.log('📤 Sending to Google STT API...');

    const googleResponse = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sttRequest)
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error('❌ Google STT API error:', {
        status: googleResponse.status,
        statusText: googleResponse.statusText,
        error: errorText
      });
      
      // 🔧 Better error messages (same format as ElevenLabs)
      const errorMessage = getLocalizedErrorMessage(googleResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Google STT API failed',
          message: errorMessage,
          details: errorText,
          retryable: isRetryableError(googleResponse.status)
        }), 
        { status: googleResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sttResult = await googleResponse.json();
    
    // 🔧 Extract transcription from Google response
    if (!sttResult.results || sttResult.results.length === 0 || 
        !sttResult.results[0].alternatives || sttResult.results[0].alternatives.length === 0) {
      console.warn('⚠️ Google returned empty transcription');
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

    const bestResult = sttResult.results[0].alternatives[0];
    const transcriptText = bestResult.transcript || '';
    const confidence = bestResult.confidence || 0.85;

    if (!transcriptText.trim()) {
      console.warn('⚠️ Google returned empty text');
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

    console.log('✅ Google STT transcription successful:', {
      text: transcriptText?.substring(0, 100) + '...',
      textLength: transcriptText?.length || 0,
      confidence: confidence
    });

    // 🔧 Enhanced language detection (same logic as ElevenLabs)
    const detectedLanguage = enhancedLanguageDetection(transcriptText, null);
    
    // 🔧 Text post-processing (same logic as ElevenLabs)
    let cleanedText = postProcessTranscription(transcriptText, detectedLanguage);
    
    // 🔧 CRITICAL: Apply same sanitization as ElevenLabs (remove **bold**, emoji, etc.)
    cleanedText = sanitizeTextForSTT(cleanedText);

    // 🔧 Extract word timestamps for compatibility
    const words = bestResult.words || [];

    // 🔧 Return EXACT same format as ElevenLabs STT for compatibility
    return new Response(
      JSON.stringify({
        success: true,
        text: cleanedText,
        language: detectedLanguage,
        confidence: confidence,
        message: 'Řeč úspěšně rozpoznána pomocí Google STT',
        details: {
          service: 'google_stt',
          originalLanguage: 'auto-detected',
          detectedLanguage: detectedLanguage,
          audioSize: audioSizeKB,
          words: words,
          originalText: transcriptText
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Google STT unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Speech recognition failed',
        message: 'Google rozpoznávání řeči selhalo - zkuste to znovu',
        details: error.message,
        retryable: true
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// 🔧 Detect Google audio encoding from buffer
function detectGoogleAudioEncoding(audioBuffer) {
  const uint8Array = new Uint8Array(audioBuffer.slice(0, 12));
  
  // Check for WebM signature - WebM with Opus codec
  if (uint8Array[0] === 0x1A && uint8Array[1] === 0x45 && uint8Array[2] === 0xDF && uint8Array[3] === 0xA3) {
    return 'OGG_OPUS';  // Correct encoding for WebM/Opus (not WEBM_OPUS)
  }
  
  // Check for MP4 signature - iOS audio/mp4
  if (uint8Array[4] === 0x66 && uint8Array[5] === 0x74 && uint8Array[6] === 0x79 && uint8Array[7] === 0x70) {
    return 'MP3';  // MP4 container closest to MP3 encoding
  }
  
  // Check for WAV signature
  if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
    return 'LINEAR16';
  }
  
  // Default fallback - use OGG_OPUS for consistency
  return 'OGG_OPUS';  // Correct fallback for WebM/Opus
}

// 🔧 Enhanced language detection combining text analysis (SAME AS ELEVENLABS)
function enhancedLanguageDetection(text, originalLanguage) {
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
  
  // Enhanced word-based detection (real-world comprehensive support)
  const czechWords = [
    // Common words (no diacritics)
    'muzes', 'muzeme', 'dekuji', 'prosim', 'ahoj', 'jsem', 'jsi', 'mas', 'jak', 'co', 'kde',
    // Extended vocabulary  
    'dobre', 'spatne', 'ano', 'ne', 'ted', 'vcera', 'zitra', 'cas', 'den', 'noc', 
    'den', 'tyden', 'mesic', 'rok', 'clovek', 'lide', 'zena', 'muz', 'dite', 'rodina',
    'prace', 'skola', 'dom', 'auto', 'jidlo', 'voda', 'penize', 'cena', 'nakup', 'obchod',
    'mluvit', 'rikat', 'delat', 'jit', 'prijit', 'odejit', 'vidět', 'slyšet', 'rozumet',
    'chci', 'potrebuji', 'mam', 'nemam', 'vim', 'nevim', 'myslim', 'citim'
  ];
  
  const englishWords = [
    // Original core words
    'what', 'how', 'where', 'when', 'why', 'doing', 'think', 'help', 'please', 'the', 'and',
    // Extended common words
    'hi', 'hello', 'you', 'are', 'is', 'was', 'were', 'have', 'has', 'had', 'will', 'would',
    'good', 'bad', 'fine', 'great', 'nice', 'okay', 'yes', 'no', 'thanks', 'thank', 'welcome',
    'today', 'tomorrow', 'yesterday', 'time', 'day', 'night', 'week', 'month', 'year',
    'people', 'person', 'man', 'woman', 'child', 'family', 'friend', 'work', 'school', 'home',
    'can', 'could', 'should', 'must', 'need', 'want', 'like', 'love', 'know', 'understand',
    'tell', 'say', 'speak', 'talk', 'listen', 'hear', 'see', 'look', 'watch', 'feel'
  ];
  
  const romanianWords = [
    // Original core words  
    'ce', 'cum', 'unde', 'faci', 'esti', 'sunt', 'multumesc', 'salut', 'cine', 'sa', 'si',
    // Extended vocabulary
    'buna', 'ziua', 'seara', 'noapte', 'dimineata', 'bine', 'rau', 'da', 'nu', 'poate',
    'vreau', 'trebuie', 'pot', 'stiu', 'inteleg', 'vorbesc', 'spun', 'aud', 'vad', 'simt',
    'azi', 'maine', 'ieri', 'timp', 'zi', 'saptamana', 'luna', 'an', 'ora', 'minut',
    'oameni', 'om', 'femeie', 'barbat', 'copil', 'familie', 'prieten', 'munca', 'scoala', 'casa',
    'bani', 'mancare', 'apa', 'masina', 'telefon', 'computer', 'internet', 'email'
  ];
  
  const czechCount = czechWords.filter(word => lowerText.includes(word)).length;
  const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
  const romanianCount = romanianWords.filter(word => lowerText.includes(word)).length;
  
  const maxCount = Math.max(czechCount, englishCount, romanianCount);
  
  if (maxCount >= 2) {
    if (czechCount === maxCount) return 'cs';
    if (englishCount === maxCount) return 'en';
    if (romanianCount === maxCount) return 'ro';
  }
  
  return 'cs'; // Safe default
}

// 🔧 Post-process transcription for better quality (SAME AS ELEVENLABS)
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

// 🔧 Better error messages (SAME AS ELEVENLABS)
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
      return 'Chyba Google serveru - zkuste to znovu za chvíli';
    default:
      return `Chyba rozpoznávání řeči (${status}) - zkuste to znovu`;
  }
}

// 🔧 Check if error is retryable (SAME AS ELEVENLABS)
function isRetryableError(status) {
  // Retryable errors: server errors, rate limits, timeouts
  return [429, 500, 502, 503, 504].includes(status);
}

// 🔧 CRITICAL: Same sanitization as ElevenLabs (remove **bold**, emoji, etc.)
function sanitizeTextForSTT(text) {
  if (!text || typeof text !== 'string') return '';
  
  let processedText = text;
  
  // 🚫 MARKDOWN CLEANUP - UNIVERSAL (same as ElevenLabs sanitizeText)
  processedText = processedText
    .replace(/\*\*([^*]+)\*\*/g, '$1')           // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')               // Remove *italic*
    .replace(/#{1,6}\s*/g, '')                   // Remove ### headers
    .replace(/`([^`]+)`/g, '$1')                 // Remove `inline code`
    .replace(/```[\s\S]*?```/g, '')              // Remove ```code blocks```
    .replace(/_([^_]+)_/g, '$1')                 // Remove _underline_
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')    // Remove [links](url)
    .replace(/~~([^~]+)~~/g, '$1');              // Remove ~~strikethrough~~
  
  // 🚫 REMOVE ALL EMOJI (same as ElevenLabs)
  processedText = processedText
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');
  
  // Clean up whitespace
  processedText = processedText
    .replace(/\s+/g, ' ')
    .trim();
  
  return processedText;
}