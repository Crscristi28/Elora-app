// elevenLabs.service.js - FINAL SIMPLE VERSION

const elevenLabsService = {
  async generateSpeech(text) {
    const response = await fetch('/api/elevenlabs-tts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        text: text,
        voice_id: process.env.ELEVENLABS_VOICE_ID || 'MpbYQvoTmXjHkaxtLiSh',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.50,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs failed: ${response.status}`);
    }

    return await response.blob();
  }
};

export default elevenLabsService;