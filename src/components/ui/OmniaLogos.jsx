// 📁 src/components/ui/OmniaLogos.jsx
// 🎨 All OMNIA logo variations in one file

import React from 'react';

// 🎨 MAIN OMNIA LOGO - Large animated logo
export const OmniaLogo = ({ size = 80, animate = false, shouldHide = false, isListening = false }) => {
  if (shouldHide) return null;
  
  const getAnimation = () => {
    if (isListening) return 'omnia-listening 2s ease-in-out infinite';
    if (animate) return 'omnia-breathe 4s ease-in-out infinite';
    return 'none';
  };
  
  const getGradient = () => {
    if (isListening) {
      return `
        radial-gradient(circle at 30% 40%, 
          #00ffff 0%,
          #00d4ff 25%,
          #0099ff 50%,
          #6432ff 75%,
          #9932cc 90%,
          #4b0082 100%
        )
      `;
    }
    return `
      radial-gradient(circle at 30% 40%, 
        #00ffff 0%,
        #0096ff 30%,
        #6432ff 60%,
        #9932cc 80%,
        #4b0082 100%
      )
    `;
  };
  
  return (
    <div
      className="omnia-logo"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getGradient(),
        boxShadow: `0 0 ${size * 0.4}px rgba(100, 50, 255, 0.6)`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        animation: getAnimation(),
        transform: 'translateZ(0)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '35%',
          height: '35%',
          borderRadius: '50%',
          background: isListening 
            ? 'rgba(255, 255, 255, 0.4)' 
            : 'rgba(255, 255, 255, 0.3)',
          filter: 'blur(8px)',
          transition: 'all 0.3s ease'
        }}
      />
      
      {(animate || isListening) && (
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            animation: isListening 
              ? 'shimmer 1.5s ease-in-out infinite' 
              : 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

// 🎨 MINI OMNIA LOGO - Small clickable logo for voice screen
export const MiniOmniaLogo = ({
  size = 28,
  onClick,
  isAudioPlaying = false,
  loading = false,
  streaming = false,
  isListening = false
}) => {
  const getLogoStyle = () => ({
    width: size,
    height: size,
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transform: 'translateZ(0)',
    pointerEvents: 'auto'
  });

  return (
    <div
      style={{
        ...getLogoStyle(),
        visibility: 'visible !important',
        opacity: '1 !important',
        display: 'flex !important',
        pointerEvents: 'auto !important'
      }}
      onClick={onClick}
      title={isListening ? "Poslouchám..." : "Voice Screen"}
    >
      <div
        style={{
          width: '40%',
          height: '50%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: `${6 + i * 3}px`,
              backgroundColor: 'white',
              borderRadius: 1,
              animation: isListening
                ? `equalizerPulse ${0.5 + i * 0.2}s ease-in-out infinite`
                : 'none',
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// 🎨 CHAT OMNIA LOGO - Tiny logo for chat messages
export const ChatOmniaLogo = ({ size = 14 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `
          radial-gradient(circle at 30% 40%, 
            #00ffff 0%,
            #0096ff 30%,
            #6432ff 60%,
            #9932cc 80%,
            #4b0082 100%
          )
        `,
        boxShadow: `0 0 ${size * 0.6}px rgba(100, 50, 255, 0.6)`,
        display: 'inline-block',
        marginRight: '6px',
        flexShrink: 0,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    />
  );
};

// Export all logos
export default {
  OmniaLogo,
  MiniOmniaLogo,
  ChatOmniaLogo
};