import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

const app = express();
const port = 3001; // Changed to match Vite proxy config

app.use(cors({ origin: 'http://localhost:5173' })); // Updated for local development
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// OpenAI endpoint
app.post('/openai', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'OpenAI API communication error.' });
  }
});

// ElevenLabs TTS endpoint
app.post('/elevenlabs-tts', async (req, res) => {
  try {
    const { text, voice_id = 'EXAVITQu4vr4xnSDxMaL' } = req.body;
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ElevenLabs STT endpoint
app.post('/elevenlabs-stt', async (req, res) => {
  try {
    // For local development, use OpenAI Whisper as fallback
    const audioData = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        success: false, 
        error: 'Speech-to-text not configured for local development' 
      });
    }

    // Create a buffer from the audio data
    const audioBuffer = Buffer.from(audioData);
    
    // For now, return a mock response
    res.json({ 
      success: false, 
      error: 'Speech-to-text requires complex multipart form handling - not implemented in local proxy' 
    });

  } catch (error) {
    console.error('ElevenLabs STT error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google TTS endpoint
app.post('/google-tts', async (req, res) => {
  try {
    const { text, language = 'cs', voice = 'natural' } = req.body;
    
    // Fallback TTS implementation
    res.status(503).json({ error: 'Google TTS not configured for local development' });
  } catch (error) {
    console.error('Google TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Claude web search endpoint
app.post('/claude-web-search', async (req, res) => {
  try {
    // Fallback implementation
    res.json({
      success: false,
      message: 'Claude web search not configured for local development'
    });
  } catch (error) {
    console.error('Claude web search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PDF Generation endpoint - Import and use the Vercel function
app.post('/generate-pdf', async (req, res) => {
  try {
    // Import the Vercel function
    const { default: generatePdfHandler } = await import('../api/generate-pdf.js');

    // Create mock Vercel request/response objects
    const mockReq = {
      method: 'POST',
      body: req.body
    };

    const mockRes = {
      setHeader: (name, value) => res.setHeader(name, value),
      status: (code) => res.status(code),
      json: (data) => res.json(data),
      send: (data) => res.send(data),
      end: () => res.end()
    };

    await generatePdfHandler(mockReq, mockRes);
  } catch (error) {
    console.error('📄 PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Proxy server running on http://localhost:${port}`);
  console.log('📝 Available endpoints:');
  console.log('  - POST /openai');
  console.log('  - POST /elevenlabs-tts');
  console.log('  - POST /elevenlabs-stt');
  console.log('  - POST /google-tts');
  console.log('  - POST /claude-web-search');
  console.log('  - POST /generate-pdf');
});