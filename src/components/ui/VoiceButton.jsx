// 📁 src/components/ui/VoiceButton.jsx
// 🔊 Voice playback button - UPDATED with sanitizeText integration
// ✅ FIXED: Uses sanitizeText from utils (not local copy) for emoji fixes

import React, { useState, useRef, useEffect } from 'react';
import { detectLanguage, sanitizeText } from '../../utils/text';
import { elevenLabsService } from '../../services/voice';

// 🆕 CONFIG - ElevenLabs vs Google TTS
const USE_ELEVENLABS = true;

const VoiceButton = ({ text, onAudioStart, onAudioEnd, isDark = false, isLight = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const audioRef = useRef(null);
  
  useEffect(() => {
    const lang = detectLanguage(text);
    setDetectedLanguage(lang);
  }, [text]);

  const handleSpeak = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      if (onAudioEnd) onAudioEnd();
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const langToUse = detectedLanguage || 'en';
      
      if (onAudioStart) onAudioStart();

      let audioBlob;

      if (USE_ELEVENLABS) {
        try {
          // 🔧 EMOJI FIX: Use utils sanitizeText with language parameter for emoji punctuation
          const sanitizedText = sanitizeText(text, langToUse);
          
          console.log('🎵 ElevenLabs with emoji-enhanced sanitization:', {
            original: text.substring(0, 50) + '...',
            sanitized: sanitizedText.substring(0, 50) + '...',
            language: langToUse
          });
          
          audioBlob = await elevenLabsService.generateSpeech(sanitizedText);
          console.log('✅ VoiceButton: ElevenLabs SUCCESS with emoji fixes');
        } catch (error) {
          console.error('❌ VoiceButton: ElevenLabs failed, using Google:', error);
          // 🔧 SAME EMOJI TREATMENT: Use sanitizeText for Google TTS too
          const sanitizedText = sanitizeText(text, langToUse);
          
          console.log('🎵 Google TTS with emoji-enhanced sanitization:', {
            original: text.substring(0, 50) + '...',
            sanitized: sanitizedText.substring(0, 50) + '...',
            language: langToUse
          });
          
          const response = await fetch('/api/google-tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ 
              text: sanitizedText, // Now using same sanitization as ElevenLabs
              language: langToUse,
              voice: 'natural'
            })
          });
          if (!response.ok) throw new Error(`Google TTS failed: ${response.status}`);
          audioBlob = await response.blob();
        }
      } else {
        // 🔧 SAME EMOJI TREATMENT: Google TTS with sanitization like ElevenLabs
        const sanitizedText = sanitizeText(text, langToUse);
        
        console.log('🎵 Google TTS Primary with emoji-enhanced sanitization:', {
          original: text.substring(0, 50) + '...',
          sanitized: sanitizedText.substring(0, 50) + '...',
          language: langToUse
        });
        
        const response = await fetch('/api/google-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ 
            text: sanitizedText, // Same sanitization as ElevenLabs
            language: langToUse,
            voice: 'natural'
          })
        });
        if (!response.ok) throw new Error(`Google TTS failed: ${response.status}`);
        audioBlob = await response.blob();
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        if (onAudioEnd) onAudioEnd();
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = (e) => {
        console.error('❌ Playback error:', e);
        setIsPlaying(false);
        if (onAudioEnd) onAudioEnd();
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();

    } catch (error) {
      console.error('💥 TTS error:', error);
      setIsPlaying(false);
      if (onAudioEnd) onAudioEnd();
    } finally {
      setIsLoading(false);
    }
  };

  // Color logic: Dark → white, Light-test → black, Light → white
  const iconColor = isDark ? 'white' : (isLight ? 'black' : 'white');

  return (
    <button
      onClick={handleSpeak}
      disabled={isLoading || !detectedLanguage}
      style={{
        background: 'none',
        border: 'none',
        cursor: isLoading ? 'wait' : 'pointer',
        padding: '5px',
        borderRadius: '6px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.85rem',
        opacity: detectedLanguage ? 1 : 0.5,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        color: iconColor
      }}
      title={isPlaying ? "Klepněte pro zastavení" : `Přehrát s kvalitní výslovností (${USE_ELEVENLABS ? 'ElevenLabs + emoji fixes' : 'Google TTS'})`}
    >
      {isLoading ? (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      ) : isPlaying ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      )}
    </button>
  );
};

export default VoiceButton;