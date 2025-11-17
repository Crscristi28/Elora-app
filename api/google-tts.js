// 🌍 UPGRADED GOOGLE TTS - RYCHLEJŠÍ + PLNĚ MULTIJAZYČNÝ
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ 
      success: false,
      error: 'Google API key not configured' 
    });
  }

  const { text, language = 'cs', voice = 'natural' } = req.body;

  if (!text) {
    return res.status(400).json({ 
      success: false,
      error: 'Text is required' 
    });
  }

  // 🔧 CRITICAL: Apply same text sanitization as ElevenLabs TTS
  const sanitizedText = sanitizeTextForTTS(text, language);

  try {
    // 🎵 CHIRP 3: HD VOICES - NEJVYŠŠÍ LIGA GOOGLE TTS 2025
    const languageMapping = {
      // Chirp 3: HD voices - ultra-realistic generative AI voices
      'en': { code: 'en-US', voice: 'en-US-Chirp3-HD-Achernar', name: 'English (Chirp3 HD Ultra-Realistic)' },
      
      // Fallback na Studio/Neural2 pro ostatní jazyky
      'en-gb': { code: 'en-GB', voice: 'en-GB-Studio-B', name: 'English UK (Studio)' },
      'es': { code: 'es-ES', voice: 'es-ES-Studio-C', name: 'Spanish (Studio)' },
      'de': { code: 'de-DE', voice: 'de-DE-Studio-B', name: 'German (Studio)' },
      'fr': { code: 'fr-FR', voice: 'fr-FR-Studio-A', name: 'French (Studio)' },
      
      // Fallback na nejlepší Neural2 pro ostatní jazyky
      'cs': { code: 'cs-CZ', voice: 'cs-CZ-Wavenet-B', name: 'Czech (Wavenet Premium)' },
      'ro': { code: 'ro-RO', voice: 'ro-RO-Wavenet-B', name: 'Romanian (Wavenet)' },
      'it': { code: 'it-IT', voice: 'it-IT-Neural2-C', name: 'Italian (Neural2)' },
      'pl': { code: 'pl-PL', voice: 'pl-PL-Neural2-A', name: 'Polish' },
      'pt': { code: 'pt-PT', voice: 'pt-PT-Neural2-A', name: 'Portuguese' },
      'nl': { code: 'nl-NL', voice: 'nl-NL-Neural2-A', name: 'Dutch' },
      'sv': { code: 'sv-SE', voice: 'sv-SE-Neural2-A', name: 'Swedish' },
      'da': { code: 'da-DK', voice: 'da-DK-Neural2-A', name: 'Danish' },
      'no': { code: 'nb-NO', voice: 'nb-NO-Neural2-A', name: 'Norwegian' },
      'fi': { code: 'fi-FI', voice: 'fi-FI-Neural2-A', name: 'Finnish' },
      'hu': { code: 'hu-HU', voice: 'hu-HU-Neural2-A', name: 'Hungarian' },
      'sk': { code: 'sk-SK', voice: 'sk-SK-Neural2-A', name: 'Slovak' },
      
      // Asian Languages
      'ja': { code: 'ja-JP', voice: 'ja-JP-Neural2-B', name: 'Japanese' },
      'ko': { code: 'ko-KR', voice: 'ko-KR-Neural2-A', name: 'Korean' },
      'zh': { code: 'zh-CN', voice: 'zh-CN-Neural2-A', name: 'Chinese (Simplified)' },
      'zh-tw': { code: 'zh-TW', voice: 'zh-TW-Neural2-A', name: 'Chinese (Traditional)' },
      'hi': { code: 'hi-IN', voice: 'hi-IN-Neural2-A', name: 'Hindi' },
      'th': { code: 'th-TH', voice: 'th-TH-Neural2-A', name: 'Thai' },
      'vi': { code: 'vi-VN', voice: 'vi-VN-Neural2-A', name: 'Vietnamese' },
      
      // Other Global Languages
      'ar': { code: 'ar-XA', voice: 'ar-XA-Neural2-A', name: 'Arabic' },
      'ru': { code: 'ru-RU', voice: 'ru-RU-Neural2-A', name: 'Russian' },
      'tr': { code: 'tr-TR', voice: 'tr-TR-Neural2-A', name: 'Turkish' },
      'he': { code: 'he-IL', voice: 'he-IL-Neural2-A', name: 'Hebrew' },
      'uk': { code: 'uk-UA', voice: 'uk-UA-Neural2-A', name: 'Ukrainian' },
      'bg': { code: 'bg-BG', voice: 'bg-BG-Neural2-A', name: 'Bulgarian' },
      'hr': { code: 'hr-HR', voice: 'hr-HR-Neural2-A', name: 'Croatian' },
      'sr': { code: 'sr-RS', voice: 'sr-RS-Neural2-A', name: 'Serbian' },
      
      // Alternative variants 
      'en-au': { code: 'en-AU', voice: 'en-AU-Neural2-C', name: 'English AU (Neural2)' },
      'es-mx': { code: 'es-MX', voice: 'es-MX-Neural2-A', name: 'Spanish (Mexico)' },
      'pt-br': { code: 'pt-BR', voice: 'pt-BR-Neural2-A', name: 'Portuguese (Brazil)' }
    };

    // Get language config (fallback to detected language, NOT always Czech!)
    const langConfig = languageMapping[language.toLowerCase()] || languageMapping['en'];
    
    console.log('🎵 STUDIO TTS request:', { 
      inputLanguage: language,
      detectedConfig: langConfig,
      selectedVoice: langConfig.voice,
      textLength: text.length 
    });

    // 🎤 VOICE SELECTION LOGIC
    let selectedVoice = langConfig.voice;
    
    // Allow voice customization
    if (voice && voice !== 'natural') {
      const voicePrefix = langConfig.code;
      selectedVoice = `${voicePrefix}-${voice}`;
    }

    // 🎵 ADAPTIVE AUDIO CONFIG - Chirp3-HD vs ostatní hlasy
    let audioConfig;
    
    if (selectedVoice.includes('Chirp3-HD')) {
      // Chirp3-HD hlasy nepodporují pitch/volume parametry
      audioConfig = {
        audioEncoding: 'MP3',
        speakingRate: 1.0,   // Normal speed for better punctuation respect
        effectsProfileId: ['headphone-class-device']
      };
    } else {
      // Standardní config pro ostatní hlasy  
      audioConfig = {
        audioEncoding: 'MP3',
        speakingRate: 1.0,   // Normal speed - respect punctuation better
        pitch: 0.0,          // Normal pitch - more natural
        volumeGainDb: 0.0,   // Normal volume - clearer speech
        effectsProfileId: ['headphone-class-device']
      };
    }

    // Google TTS API call
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: sanitizedText }, // Use sanitized text instead of raw
          voice: { 
            languageCode: langConfig.code,
            name: selectedVoice
          },
          audioConfig
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google TTS API error:', data);
      
      // Enhanced fallback chain: Chirp3-HD → Studio → Neural2 → Standard
      if (selectedVoice.includes('Chirp3-HD')) {
        console.log('🔄 Chirp3-HD failed, trying Studio fallback...');
        const fallbackVoice = selectedVoice.replace('Chirp3-HD-Achernar', 'Studio-M');
        
        const fallbackResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: sanitizedText }, // Use sanitized text in fallback too
              voice: { 
                languageCode: langConfig.code,
                name: fallbackVoice
              },
              audioConfig
            })
          }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.audioContent) {
            const audioBuffer = Buffer.from(fallbackData.audioContent, 'base64');
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', audioBuffer.length);
            res.status(200).send(audioBuffer);
            
            console.log('✅ Studio fallback success:', { 
              language: langConfig.name, 
              voice: fallbackVoice,
              audioSize: audioBuffer.length 
            });
            return;
          }
        }
      }
      
      // Fallback with Neural2 if Studio fails, then Standard if Neural2 fails
      if (selectedVoice.includes('Studio')) {
        console.log('🔄 Studio failed, trying Neural2 fallback...');
        const fallbackVoice = selectedVoice.replace('Studio', 'Neural2');
        
        const fallbackResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: sanitizedText }, // Use sanitized text in fallback too
              voice: { 
                languageCode: langConfig.code,
                name: fallbackVoice
              },
              audioConfig
            })
          }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.audioContent) {
            const audioBuffer = Buffer.from(fallbackData.audioContent, 'base64');
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', audioBuffer.length);
            res.status(200).send(audioBuffer);
            
            console.log('✅ Neural2 fallback success:', { 
              language: langConfig.name, 
              voice: fallbackVoice,
              audioSize: audioBuffer.length 
            });
            return;
          }
        }
      }
      
      // Final fallback with Standard voice if all premium fails
      if (selectedVoice.includes('Chirp3-HD') || selectedVoice.includes('Studio') || selectedVoice.includes('Wavenet') || selectedVoice.includes('Neural2')) {
        console.log('🔄 Fallback to Standard voice...');
        const fallbackVoice = selectedVoice.replace('Chirp3-HD-Achernar', 'Standard-A').replace('Studio', 'Standard').replace('Wavenet', 'Standard').replace('Neural2', 'Standard');
        
        const fallbackResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: sanitizedText }, // Use sanitized text in fallback too
              voice: { 
                languageCode: langConfig.code,
                name: fallbackVoice
              },
              audioConfig
            })
          }
        );

        const fallbackData = await fallbackResponse.json();
        
        if (fallbackResponse.ok && fallbackData.audioContent) {
          const audioBuffer = Buffer.from(fallbackData.audioContent, 'base64');
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', audioBuffer.length);
          res.status(200).send(audioBuffer);
          
          console.log('✅ Optimized TTS fallback success:', { 
            language: langConfig.name, 
            voice: fallbackVoice,
            speed: 'Optimized (1.15x)',
            audioSize: audioBuffer.length 
          });
          return;
        }
      }
      
      throw new Error(data.error?.message || `Google TTS API failed: ${response.status}`);
    }

    if (!data.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    // Convert base64 to buffer and send as audio
    const audioBuffer = Buffer.from(data.audioContent, 'base64');
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30min cache
    res.status(200).send(audioBuffer);

    console.log('✅ CHIRP3-HD TTS SUCCESS:', { 
      language: langConfig.name,
      voice: selectedVoice, 
      voiceType: selectedVoice.includes('Chirp3-HD') ? 'CHIRP3-HD' : selectedVoice.includes('Studio') ? 'STUDIO' : selectedVoice.includes('Neural2') ? 'NEURAL2' : 'WAVENET',
      speed: 'Optimized (1.15x)',
      pitch: 'Pleasant (+0.4)',
      volume: 'Clear (+2.5dB)',
      audioSize: audioBuffer.length,
      duration: `${Math.round(audioBuffer.length / 1000)}KB`
    });

  } catch (error) {
    console.error('💥 Fast TTS error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      language: language,
      fallback: 'Standard voices available as backup'
    });
  }
}

// 🔧 CRITICAL: Same text sanitization as ElevenLabs TTS (remove **bold**, emoji, etc.)
function sanitizeTextForTTS(text, language = 'cs') {
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
  
  // Apply language-specific transformations like ElevenLabs
  switch (language.toLowerCase()) {
    case 'ro': // Romanian
      processedText = processedText
        .replace(/(\d+)\s*%/gi, '$1 la sută')
        .replace(/(\d+)[\s]*°C/gi, '$1 grade Celsius')
        .replace(/(\d+)[\s]*°F/gi, '$1 grade Fahrenheit')
        .replace(/(\d{1,2}):(\d{2})/g, '$1 și $2 minute')
        .replace(/(\d+)\s*€/gi, '$1 euro')
        .replace(/(\d+)\s*\$/gi, '$1 dolari')
        .replace(/(\d+)[.,](\d+)/g, '$1 virgulă $2');
      break;
      
    case 'cs': // Czech
      processedText = processedText
        .replace(/(\d+)\s*%/gi, '$1 procent')
        .replace(/(\d+)[\s]*°C/gi, '$1 stupňů Celsia')
        .replace(/(\d+)[\s]*°F/gi, '$1 stupňů Fahrenheita')
        .replace(/(\d{1,2}):(\d{2})/g, '$1 hodin $2 minut')
        .replace(/(\d+)\s*€/gi, '$1 eur')
        .replace(/(\d+)\s*Kč/gi, '$1 korun')
        .replace(/(\d+)[.,](\d+)/g, '$1 celá $2');
      break;
      
    case 'en': // English  
      processedText = processedText
        .replace(/(\d+)\s*%/gi, '$1 percent')
        .replace(/(\d+)[\s]*°C/gi, '$1 degrees Celsius')
        .replace(/(\d+)[\s]*°F/gi, '$1 degrees Fahrenheit')
        .replace(/(\d{1,2}):(\d{2})/g, '$1 hours $2 minutes')
        .replace(/(\d+)\s*€/gi, '$1 euros')
        .replace(/(\d+)\s*\$/gi, '$1 dollars')
        .replace(/(\d+)[.,](\d+)/g, '$1 point $2');
      break;
  }
  
  // Clean up whitespace
  processedText = processedText
    .replace(/\s+/g, ' ')
    .trim();
  
  return processedText;
}