// 📁 src/components/voice/VoiceScreen.jsx
// 🎙️ Simplified Voice Screen Modal

import React, { useState, useEffect } from 'react';
import { SimpleVoiceRecorder } from '../voice';
import { getTranslation } from '../../utils/text/translations';

const VoiceScreen = ({ 
  isOpen,
  onClose,
  onTranscript,
  isLoading,
  isAudioPlaying,
  uiLanguage,
  audioManager
}) => {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  
  const isMobile = window.innerWidth <= 768;
  const t = getTranslation(uiLanguage);

  // 🎆 Opening animation trigger
  useEffect(() => {
    if (isOpen && !isOpening) {
      setIsOpening(true);
      setShowParticleBurst(true);
      
      // Hide particles after animation
      setTimeout(() => {
        setShowParticleBurst(false);
      }, 1200);
      
      // Reset opening state
      setTimeout(() => {
        setIsOpening(false);
      }, 1500);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTranscript = (text, confidence) => {
    console.log('🎙️ Voice transcript in VoiceScreen:', text);
    setLastTranscript(text);
    onTranscript(text, confidence);
  };

  const handleVoiceStateChange = (listening) => {
    setIsListening(listening);
  };

  const handleClose = () => {
    // 🔧 CRITICAL: Stop all voice activities before closing
    if (isListening) {
      console.log('🛑 Force stopping voice recording before close');
      // The SimpleVoiceRecorder should handle cleanup in its own useEffect
    }
    
    // 🔧 CRITICAL: Stop audio if available via props
    if (audioManager && audioManager.stop) {
      console.log('🛑 Stopping audio from VoiceScreen X button');
      audioManager.stop();
    }
    
    onClose();
  };

  // 🎨 ENHANCED UI s glow efektem
  const getBackgroundStyle = () => {
    if (isListening) {
      return {
        background: 'linear-gradient(135deg, #000428, #004e92, #009ffd, #00d4ff)'
      };
    }

    return {
      background: 'linear-gradient(135deg, #000428, #004e92, #009ffd)'
    };
  };

  return (
    <div 
      className="voice-screen-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        ...getBackgroundStyle(),
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
        padding: isMobile ? '1rem' : '2rem',
        minHeight: '100vh',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)',
        transition: 'background 0.5s ease',
        animation: isOpening ? 'voiceChatFadeIn 1s ease-out 0.5s both' : 
                  isAudioPlaying ? 'screenPulse 1.5s ease-in-out infinite' : 'none'
      }}
    >
      {/* 🎯 HEADER WITH CLOSE BUTTON */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #4299e1, #63b3ed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ELORA Voice Chat
        </div>
        
        <button
          onClick={handleClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            color: 'white',
            fontSize: '1.2rem'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>
      </div>
      
      {/* 🎤 CENTRAL CONTENT - Flex container for centering */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        {/* 🎤 VOICE RECORDER - NEMĚNÍM HO! */}
        <div 
          style={{ 
            marginBottom: '2rem',
            position: 'relative'
          }}
        >
          <SimpleVoiceRecorder 
            onTranscript={handleTranscript}
            onListeningChange={handleVoiceStateChange}
            disabled={isLoading}
            isAudioPlaying={isAudioPlaying}
            uiLanguage={uiLanguage}
          />
          
          {/* 🌊 VOICE VISUALIZER */}
          {isListening && (
            <div 
              className="voice-visualizer"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: '2px solid rgba(0, 255, 255, 0.3)',
                animation: 'pulse-ring 1.5s ease-out infinite',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>

        {/* 🔄 LOADING STATE */}
        {isLoading && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              marginTop: '2rem'
            }}
          >
            <div style={{ 
              width: '20px', 
              height: '20px', 
              border: '2px solid rgba(255,255,255,0.3)', 
              borderTop: '2px solid #9333ea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>
              {t('omniaThinking')}
            </span>
          </div>
        )}

        {/* ℹ️ INSTRUCTIONS */}
        <div 
          style={{
            marginTop: '2rem',
            fontSize: '0.9rem',
            opacity: 0.6,
            textAlign: 'center'
          }}
        >
          {isListening ? t('tapMicrophoneToStop') : t('talkWithElora')}
        </div>
      </div>

      {/* 🌟 AI SPEAKING PULSE EFFECT - Screen Border Glow */}
      {isAudioPlaying && (
        <div
          className="ai-speaking-glow"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 900,
            border: '12px solid transparent',
            borderImage: 'linear-gradient(45deg, #4299e1, #9333ea, #06b6d4, #3b82f6) 1',
            boxShadow: `
              inset 0 0 60px rgba(66, 153, 225, 0.4),
              inset 0 0 120px rgba(147, 51, 234, 0.3),
              0 0 60px rgba(66, 153, 225, 0.5),
              0 0 120px rgba(147, 51, 234, 0.4)
            `,
            animation: 'aiSpeakingPulse 2s ease-in-out infinite alternate'
          }}
        />
      )}

      {/* 🎆 PARTICLE BURST OPENING ANIMATION */}
      {showParticleBurst && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Generate 12 particles in different directions */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30) * (Math.PI / 180); // 30 degree intervals
            const distance = 200 + (i % 3) * 100; // Varying distances
            const size = 8 + (i % 3) * 4; // Bigger sizes: 8-16px
            const duration = 0.8 + (i % 3) * 0.2; // Varying speeds
            
            return (
              <div
                key={i}
                className={`particle particle-${i}`}
                style={{
                  position: 'absolute',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `radial-gradient(circle, rgba(66, 153, 225, 1), rgba(147, 51, 234, 1))`,
                  borderRadius: '50%',
                  boxShadow: `
                    0 0 ${size * 3}px rgba(66, 153, 225, 1),
                    0 0 ${size * 6}px rgba(147, 51, 234, 0.8),
                    0 0 ${size * 9}px rgba(6, 182, 212, 0.6)
                  `,
                  animation: `particleBurst${i} ${duration}s ease-out forwards`
                }}
              />
            );
          })}
        </div>
      )}

      {/* 🎨 ANIMATIONS */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes aiSpeakingPulse {
          0% {
            opacity: 0.5;
            box-shadow: 
              inset 0 0 40px rgba(66, 153, 225, 0.3),
              inset 0 0 80px rgba(147, 51, 234, 0.2),
              0 0 40px rgba(66, 153, 225, 0.4),
              0 0 80px rgba(147, 51, 234, 0.3);
          }
          50% {
            opacity: 0.8;
            box-shadow: 
              inset 0 0 80px rgba(66, 153, 225, 0.5),
              inset 0 0 160px rgba(147, 51, 234, 0.4),
              0 0 80px rgba(66, 153, 225, 0.6),
              0 0 160px rgba(147, 51, 234, 0.5);
          }
          100% {
            opacity: 1.0;
            box-shadow: 
              inset 0 0 120px rgba(66, 153, 225, 0.6),
              inset 0 0 240px rgba(147, 51, 234, 0.5),
              0 0 120px rgba(66, 153, 225, 0.7),
              0 0 240px rgba(147, 51, 234, 0.6);
          }
        }

        @keyframes screenPulse {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.02);
            filter: brightness(1.1);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        @keyframes voiceChatFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Particle burst animations - 12 different directions */
        @keyframes particleBurst0 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(200px, 0px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst1 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(173px, 100px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst2 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(100px, 173px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst3 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(0px, 200px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst4 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-100px, 173px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst5 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-173px, 100px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst6 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-200px, 0px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst7 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-173px, -100px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst8 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(-100px, -173px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst9 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(0px, -200px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst10 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(100px, -173px) scale(0.5); opacity: 0; } }
        @keyframes particleBurst11 { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 50% { opacity: 1; } 100% { transform: translate(173px, -100px) scale(0.5); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default VoiceScreen;