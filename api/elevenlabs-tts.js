// api/elevenlabs-tts.js - FIXED VERSION with optimized voice settings
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ 
      error: 'ElevenLabs API key not configured' 
    });
  }

  const { 
    text, 
    voice_id = process.env.ELEVENLABS_VOICE_ID || 'MpbYQvoTmXjHkaxtLiSh',
    model_id = 'eleven_multilingual_v2',
    // 🔧 BALANCED VOICE SETTINGS - REDUCED SPEED
    voice_settings = {
      stability: 0.50,        // Balanced pro čísla (původně 0.30)
      similarity_boost: 0.75, // Mírně vyšší než original (původně 0.25)
      style: 0.0,            // Optimized for speed and stability (ElevenLabs recommendation)
      use_speaker_boost: false // Vypnuto - může zrychlovat
    }
  } = req.body;

  if (!text) {
    return res.status(400).json({ 
      error: 'Text is required' 
    });
  }

  try {
    // 🔍 DEBUG LOGGING for problematic patterns
    const hasNumbers = /\d/.test(text);
    const hasTemperature = /\d+\s*°[CF]/i.test(text);
    const hasCurrency = /\d+\s*[Kč€$]/i.test(text);
    
    console.log('🎵 ElevenLabs TTS Request (BALANCED):', {
      textLength: text.length,
      textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      hasNumbers,
      hasTemperature,
      hasCurrency,
      voice_id: voice_id,
      model: model_id,
      optimizedSettings: voice_settings
    });

    // 🚨 SPECIAL LOGGING for temperature patterns
    if (hasTemperature) {
      const tempMatches = text.match(/\d+\s*°[CF]/gi);
      console.log('🌡️ Temperature patterns detected:', tempMatches);
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,              // ← RAW TEXT (no preprocessing!)
          model_id: model_id,
          voice_settings: voice_settings // ← OPTIMIZED SETTINGS
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', response.status, errorText);
      
      // Handle specific errors
      if (response.status === 401) {
        return res.status(401).json({ 
          error: 'Invalid API key' 
        });
      }
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded or quota reached' 
        });
      }
      
      return res.status(response.status).json({ 
        error: `ElevenLabs API error: ${response.status}`,
        details: errorText
      });
    }

    // 🔧 STREAMING: Collect chunks as they arrive  
    const reader = response.body.getReader();
    const chunks = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    // Combine all chunks into single buffer
    const audioBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log('✅ ElevenLabs STREAMING TTS SUCCESS:', {
      textContainedNumbers: hasNumbers,
      textContainedTemperature: hasTemperature,
      audioSize: audioBuffer.byteLength,
      sizeKB: Math.round(audioBuffer.byteLength / 1024),
      chunksReceived: chunks.length,
      settings: {
        stability: voice_settings.stability,
        similarity_boost: voice_settings.similarity_boost,
        style: voice_settings.style
      }
    });
    
    // Send audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('💥 ElevenLabs route error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}

// 🎯 SETTINGS EXPLANATION:
/*
🔧 BALANCED VOICE SETTINGS (po korekci):

PREVIOUS (TOO AGGRESSIVE):
- stability: 0.75      → příliš rychlé čísla ❌
- similarity_boost: 0.90 → příliš rychlé ❌  
- style: 0.15          → nepřirozené ❌

NEW (BALANCED):
- stability: 0.50      → mírnější zlepšení ✅
- similarity_boost: 0.75 → umírněné zlepšení ✅
- style: 0.25          → téměř original ✅
- use_speaker_boost: false → vypnuto - může zrychlovat ✅

🧪 TEST CASES TO VERIFY:
- "31°C" → should be slower and clearer
- "45 tisíc dolarů" → natural speed
- "75%" → not rushed
- "API klíč" → normal pace

🎯 EXPECTED RESULTS:
- Numbers: Clear but not rushed ✅
- Temperature: Natural speed ✅  
- No robotic fast speech ✅
*/