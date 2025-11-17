// 📁 src/components/ui/OmniaArrowButton.jsx
// ➡️ Send message button with Omnia gradient - FIXED with style prop

import React from 'react';

const OmniaArrowButton = ({ onClick, disabled, loading, size = 50, isListening = false, style = {} }) => {
  const getButtonStyle = () => {
    const baseStyle = {
      width: size,
      height: size,
      borderRadius: '50%',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.3,
      fontWeight: 'bold',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      color: 'white',
      opacity: disabled ? 0.5 : 1,
      transform: 'translateZ(0)'
    };

    if (disabled) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #4a5568, #2d3748)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      };
    }

    return {
      ...baseStyle,
      background: 'radial-gradient(circle at center, #1b6cf2 0%, #007bff 60%, #0056b3 100%)',
      boxShadow: '0 0 10px rgba(0,123,255,0.6)'
    };
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...getButtonStyle(),
        ...style  // ✅ PŘIDÁNO - custom styles support
      }}
      title={isListening ? "Poslouchám..." : "Odeslat zprávu"}
      onMouseEnter={(e) => {
        if (!disabled && !isListening) {
          e.target.style.transform = 'translateY(-2px) scale(1.05) translateZ(0)';
          e.target.style.boxShadow = '0 8px 20px rgba(100, 50, 255, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isListening) {
          e.target.style.transform = 'translateY(0) scale(1) translateZ(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(100, 50, 255, 0.4)';
        }
      }}
    >
      {loading ? (
        <div style={{
          width: '12px',
          height: '12px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
};

export default OmniaArrowButton;