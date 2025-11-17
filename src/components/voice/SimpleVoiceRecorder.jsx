// 🎙️ ENHANCED SIMPLE VOICE RECORDER - ElevenLabs STT Edition
// ✅ NOVÉ: Cancel button, Audio level meter, Recording timer, Haptic feedback

import React, { useState, useRef, useEffect } from 'react';
import { getTranslation } from '../../utils/text/translations';

const SimpleVoiceRecorder = ({ 
  onTranscript, 
  onListeningChange,
  onAudioLevel,
  disabled, 
  isAudioPlaying,
  uiLanguage = 'cs'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const t = getTranslation(uiLanguage);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // ✅ FIXED VALUES - No aggressive detection
  const MIN_RECORDING_TIME = 2000;    // 2 seconds minimum  
  const MAX_RECORDING_TIME = 30000;   // 30 seconds maximum
  
  const isIOSPWA = window.navigator.standalone;

  // 🎵 AUDIO LEVEL MONITORING
  const startAudioLevelMonitoring = (stream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        
        setAudioLevel(normalizedLevel);
        
        // Send audio level to parent component
        if (onAudioLevel) {
          onAudioLevel(normalizedLevel);
        }
        
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.warn('⚠️ Audio level monitoring not available:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setAudioLevel(0);
    
    // Reset audio level in parent component
    if (onAudioLevel) {
      onAudioLevel(0);
    }
  };

  // 📱 HAPTIC FEEDBACK
  const triggerHapticFeedback = (type = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'start':
          navigator.vibrate([50, 30, 50]); // Double tap
          break;
        case 'stop':
          navigator.vibrate(100); // Single long
          break;
        case 'error':
          navigator.vibrate([30, 10, 30, 10, 30]); // Triple short
          break;
        default:
          navigator.vibrate(50);
      }
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      console.log('🎙️ Requesting microphone permission...');
      
      const constraints = {
        audio: {
          sampleRate: isIOSPWA ? 44100 : 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      console.log('✅ Microphone permission granted');
      return true;
      
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setPermissionGranted(false);
      
      const errorMessage = {
        'cs': 'Nepodařilo se získat přístup k mikrofonu',
        'en': 'Could not access microphone',
        'ro': 'Nu s-a putut accesa microfonul'
      }[uiLanguage] || 'Microphone access denied';
      
      onTranscript(`[${errorMessage}]`);
      triggerHapticFeedback('error');
      return false;
    }
  };

  const startListening = async () => {
    try {
      console.log('🎙️ Starting ElevenLabs voice recording...');

      if (!permissionGranted) {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;
      }

      const constraints = {
        audio: {
          sampleRate: isIOSPWA ? 44100 : 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Start audio level monitoring
      startAudioLevelMonitoring(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: isIOSPWA ? 'audio/mp4' : 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      // Start recording timer
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - recordingStartTimeRef.current;
        setRecordingTime(Math.floor(elapsed / 1000));
      }, 100);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing with ElevenLabs...');
        setIsProcessing(true);
        
        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setRecordingTime(0);
        
        // Stop audio monitoring
        stopAudioLevelMonitoring();
        
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        try {
          if (audioChunksRef.current.length === 0 || recordingDuration < MIN_RECORDING_TIME) {
            console.warn('⚠️ Recording too short or no data');
            const shortMessage = {
              'cs': 'Nahrávka příliš krátká - zkuste znovu (min 2s)',
              'en': 'Recording too short - try again (min 2s)',
              'ro': 'Înregistrare prea scurtă - încearcă din nou (min 2s)'
            }[uiLanguage] || 'Recording too short';
            
            onTranscript(`[${shortMessage}]`);
            setIsProcessing(false);
            triggerHapticFeedback('error');
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { 
            type: isIOSPWA ? 'audio/mp4' : 'audio/webm' 
          });
          
          if (audioBlob.size < 1000) {
            console.warn('⚠️ Audio too small - likely silence');
            const silenceMessage = {
              'cs': 'Žádný zvuk nezaznamenán - zkuste znovu',
              'en': 'No audio detected - try again',
              'ro': 'Nu s-a detectat audio - încearcă din nou'
            }[uiLanguage] || 'No audio detected';
            
            onTranscript(`[${silenceMessage}]`);
            setIsProcessing(false);
            triggerHapticFeedback('error');
            return;
          }

          const arrayBuffer = await audioBlob.arrayBuffer();
          console.log('📤 Sending to Google STT API...');
          
          // 🔧 ENABLED: ElevenLabs STT as primary with Google fallback
          let response = await fetch('/api/elevenlabs-stt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            body: arrayBuffer
          });

          let data;
          let usedService = 'ElevenLabs';

          // 🔧 If ElevenLabs fails, use Google STT as fallback
          if (!response.ok) {
            console.warn('⚠️ ElevenLabs STT failed, trying Google STT fallback...');
            response = await fetch('/api/google-stt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
              },
              body: arrayBuffer
            });
            usedService = 'Google';
          }

          if (!response.ok) {
            throw new Error(`STT failed: HTTP ${response.status}`);
          }

          data = await response.json();
          console.log(`✅ ${usedService} STT response:`, data);
          
          if (data.success && data.text && data.text.trim()) {
            const transcribedText = data.text.trim();
            const detectedLanguage = data.language || 'unknown';
            
            console.log('🌍 Detected language:', detectedLanguage);
            console.log('📝 Transcribed text:', transcribedText);
            
            onTranscript(transcribedText, data.confidence || 1.0);
            triggerHapticFeedback('stop');
          } else {
            console.warn('⚠️ Empty or failed transcription');
            const failMessage = {
              'cs': 'Nepodařilo se rozpoznat řeč - zkuste znovu',
              'en': 'Could not recognize speech - try again',
              'ro': 'Nu s-a putut recunoaște vorba - încearcă din nou'
            }[uiLanguage] || 'Speech recognition failed';
            
            onTranscript(`[${failMessage}]`);
            triggerHapticFeedback('error');
          }

        } catch (error) {
          console.error('💥 ElevenLabs STT error:', error);
          const errorMessage = {
            'cs': 'Chyba při rozpoznávání řeči - zkuste to znovu',
            'en': 'Speech recognition error - try again',
            'ro': 'Eroare recunoaștere vocală - încearcă din nou'
          }[uiLanguage] || 'Speech recognition error';
          
          onTranscript(`[${errorMessage}]`);
          triggerHapticFeedback('error');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      if (onListeningChange) onListeningChange(true);
      triggerHapticFeedback('start');
      
      console.log('🎯 ElevenLabs recording started');

      // ✅ FIXED: Only MAX timeout, no silence detection
      setTimeout(() => {
        if (isListening && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('⏰ Max recording time reached - stopping');
          stopListening();
        }
      }, MAX_RECORDING_TIME);

    } catch (error) {
      console.error('💥 Start listening error:', error);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsListening(false);
      setIsProcessing(false);
      setPermissionGranted(false);
      if (onListeningChange) onListeningChange(false);
      
      const errorMessage = {
        'cs': 'Nepodařilo se spustit nahrávání',
        'en': 'Could not start recording',
        'ro': 'Nu s-a putut porni înregistrarea'
      }[uiLanguage] || 'Recording failed';
      
      onTranscript(`[${errorMessage}]`);
      triggerHapticFeedback('error');
    }
  };

  const stopListening = () => {
    console.log('🛑 Stopping ElevenLabs recording...');

    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordingTime(0);
    
    // Stop audio monitoring
    stopAudioLevelMonitoring();

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping recorder:', error);
      }
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      streamRef.current = null;
    }
    
    setIsListening(false);
    if (onListeningChange) onListeningChange(false);
    triggerHapticFeedback('stop');
  };

  // 🆕 CANCEL RECORDING (no processing)
  const cancelRecording = () => {
    console.log('❌ Cancelling recording...');
    
    // Clear audio chunks so onstop won't process
    audioChunksRef.current = [];
    
    // Stop everything
    stopListening();
    
    // Notify user
    const cancelMessage = {
      'cs': 'Nahrávání zrušeno',
      'en': 'Recording cancelled',
      'ro': 'Înregistrare anulată'
    }[uiLanguage] || 'Recording cancelled';
    
    onTranscript(`[${cancelMessage}]`);
  };

  // ✅ SIMPLE TOGGLE - Manual control only
  const toggleListening = () => {
    if (disabled || isProcessing) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
      stopAudioLevelMonitoring();
    };
  }, []);

  useEffect(() => {
    if (isAudioPlaying && isListening) {
      console.log('🔇 Stopping listening - audio playing');
      stopListening();
    }
  }, [isAudioPlaying, isListening]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonStyle = () => {
    const baseStyle = {
      border: 'none',
      borderRadius: '50%',
      padding: 0,
      fontSize: '2rem',
      cursor: (disabled || isProcessing) ? 'not-allowed' : 'pointer',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'none',
      transform: 'translateZ(0)',
      willChange: 'transform, box-shadow',
      position: 'relative'
    };

    if (isProcessing) return { 
      ...baseStyle,
      backgroundColor: '#ffc107',
      color: 'white',
      boxShadow: '0 0 25px rgba(255, 193, 7, 0.6)',
      animation: 'omnia-pulse 1.5s ease-in-out infinite'
    };
    
    if (isListening) return { 
      ...baseStyle,
      backgroundColor: '#dc3545',
      color: 'white',
      transform: 'scale(1.1) translateZ(0)',
      boxShadow: '0 0 35px rgba(220, 53, 69, 0.8)',
      animation: 'omnia-pulse 1s ease-in-out infinite'
    };
    
    return { 
      ...baseStyle,
      backgroundColor: '#007bff',
      color: 'white',
      boxShadow: '0 0 20px rgba(0, 123, 255, 0.5)'
    };
  };

  const getButtonIcon = () => {
    if (isProcessing) return (
      <div style={{ 
        width: '20px', 
        height: '20px', 
        border: '3px solid rgba(255,255,255,0.3)', 
        borderTop: '3px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
    );
    
    if (isListening) {
      return (
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'white',
          borderRadius: '2px',
          animation: 'pulse 1s ease-in-out infinite'
        }}></div>
      );
    }
    
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    );
  };

  const getButtonTitle = () => {
    const titles = {
      'cs': {
        processing: 'Zpracovávám s ElevenLabs...',
        listening: 'Klikněte pro zastavení nahrávání',
        ready: 'Klikněte pro začátek nahrávání'
      },
      'en': {
        processing: 'Processing with ElevenLabs...',
        listening: 'Click to stop recording',
        ready: 'Click to start recording'
      },
      'ro': {
        processing: 'Procesez cu ElevenLabs...',
        listening: 'Apasă pentru a opri înregistrarea',
        ready: 'Apasă pentru a începe înregistrarea'
      }
    };

    const langTitles = titles[uiLanguage] || titles['cs'];
    
    if (isProcessing) return langTitles.processing;
    if (isListening) return langTitles.listening;
    return langTitles.ready;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '1rem' 
    }}>
      {/* 🎤 MAIN BUTTON */}
      <button
        onClick={toggleListening}
        disabled={disabled || isProcessing}
        title={getButtonTitle()}
        style={getButtonStyle()}
      >
        {getButtonIcon()}
        
        {/* 🆕 AUDIO LEVEL INDICATOR */}
        {isListening && audioLevel > 5 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${100 + audioLevel * 0.5}px`,
            height: `${100 + audioLevel * 0.5}px`,
            borderRadius: '50%',
            border: `2px solid rgba(255, 255, 255, ${audioLevel / 100})`,
            pointerEvents: 'none',
            animation: 'none'
          }} />
        )}
      </button>

      {/* 🆕 RECORDING TIMER */}
      {isListening && (
        <div style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          color: '#dc3545',
          fontFamily: 'monospace'
        }}>
          {formatTime(recordingTime)}
        </div>
      )}

      {/* 🆕 CANCEL BUTTON */}
      {isListening && (
        <button
          onClick={cancelRecording}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '8px 20px',
            color: 'white',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          {t('cancel')}
        </button>
      )}

      {/* 🆕 AUDIO LEVEL BAR (optional visual) */}
      {isListening && (
        <div style={{
          width: '200px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${audioLevel}%`,
            height: '100%',
            background: audioLevel > 70 ? '#ff4444' : audioLevel > 30 ? '#ffc107' : '#28a745',
            transition: 'width 0.1s ease'
          }} />
        </div>
      )}
    </div>
  );
};

export default SimpleVoiceRecorder;