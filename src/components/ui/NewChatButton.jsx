// 🎨 NewChatButton.jsx - Chat bubble design pro top-right
// ✅ Clean white styling podle fotky
// 🚀 Chat bubble tvar jako na obrázku

import React from 'react';
import { getTranslation } from '../../utils/text';

const NewChatButton = ({ 
  onClick, 
  disabled = false,
  size = 'default', // 'small' | 'default' | 'large'
  uiLanguage = 'cs'
}) => {
  const isMobile = window.innerWidth <= 768;
  const t = getTranslation(uiLanguage);
  
  // 📐 RESPONSIVE SIZES
  const sizes = {
    small: { width: 32, height: 32, plus: '14px' },
    default: { width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, plus: isMobile ? '16px' : '18px' },
    large: { width: 48, height: 48, plus: '20px' }
  };
  
  const currentSize = sizes[size] || sizes.default;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: currentSize.width,
        height: currentSize.height,
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        outline: 'none',
        position: 'relative'
      }}
      title={t('newChatButton')}
    >
      {/* 💬 CHAT BUBBLE SHAPE */}
      <svg 
        width={currentSize.width} 
        height={currentSize.height} 
        viewBox="0 0 40 40" 
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1))',
          transition: 'all 0.3s ease'
        }}
      >
        {/* 🎨 CHAT BUBBLE PATH */}
        <path
          d="M20 4C11.16 4 4 10.5 4 18.5C4 23.5 6.5 28 10.5 31L8 36L14.5 33.5C16.8 34.2 18.3 34.5 20 34.5C28.84 34.5 36 28 36 18.5C36 10.5 28.84 4 20 4Z"
          fill="rgba(255, 255, 255, 0.9)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          style={{
            transition: 'all 0.3s ease'
          }}
        />
      </svg>
      
      {/* ➕ PLUS ICON */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) translateY(-1px)', // Slight adjustment for visual centering
          fontSize: currentSize.plus,
          fontWeight: '400',
          color: 'rgba(0, 78, 146, 0.8)',
          lineHeight: 1,
          transition: 'all 0.3s ease'
        }}
      >
        +
      </div>

      {/* 🎯 HOVER OVERLAY */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0)',
          transition: 'all 0.3s ease',
          pointerEvents: 'none'
        }}
        className="hover-overlay"
      />

      <style jsx>{`
        button:hover .hover-overlay {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        
        button:hover svg path {
          fill: rgba(255, 255, 255, 1) !important;
          stroke: rgba(255, 255, 255, 0.3) !important;
        }
        
        button:hover div {
          color: rgba(0, 78, 146, 1) !important;
          transform: translate(-50%, -50%) translateY(-1px) scale(1.05) !important;
        }
        
        button:active {
          transform: scale(0.95);
        }
        
        @media (max-width: 768px) {
          button:hover .hover-overlay {
            background: rgba(255, 255, 255, 0.05) !important;
          }
        }
      `}</style>
    </button>
  );
};

// 🎨 SIMPLE PLUS BUTTON VARIANT (fallback)
export const SimplePlusButton = ({ 
  onClick, 
  disabled = false,
  size = 40 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.8)',
        background: 'transparent',
        color: 'rgba(255, 255, 255, 0.9)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.4}px`,
        fontWeight: '300',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.5 : 1,
        outline: 'none'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 1)';
          e.target.style.color = '#ffffff';
          e.target.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.background = 'transparent';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
          e.target.style.color = 'rgba(255, 255, 255, 0.9)';
          e.target.style.transform = 'scale(1)';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.target.style.transform = 'scale(0.95)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.target.style.transform = 'scale(1.05)';
        }
      }}
      title={t('newChatButton')}
    >
      +
    </button>
  );
};

export default NewChatButton;