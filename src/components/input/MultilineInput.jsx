// src/components/input/MultilineInput.jsx
import React from 'react';
import { getTranslation } from '../../utils/text';

const MultilineInput = ({
  value,
  onChange,
  onKeyDown,
  disabled = false,
  isLoading = false,
  uiLanguage = 'cs'
}) => {
  const isMobile = window.innerWidth <= 768;
  const t = getTranslation(uiLanguage);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      if (!isMobile) {
        // Desktop: Enter sends message, Shift+Enter = new line
        e.preventDefault();
        if (onKeyDown) onKeyDown(e);
      }
      // Mobile: Return = new line (default behavior), send button = send message
    }
  };

  return (
    <div style={{ flex: 1 }}>
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? t('omniaPreparingResponse') : t('chatPlaceholder')}
        disabled={disabled}
        rows={1}
        style={{
          width: '100%',
          minHeight: '48px',
          maxHeight: '120px',
          padding: isMobile ? '1.1rem 1.4rem' : '1.2rem 1.6rem',
          fontSize: isMobile ? '16px' : '0.95rem',
          borderRadius: '30px',
          border: '2px solid rgba(74, 85, 104, 0.6)',
          outline: 'none',
          backgroundColor: disabled 
            ? 'rgba(45, 55, 72, 0.6)' 
            : 'rgba(26, 32, 44, 0.8)',
          color: '#ffffff',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          opacity: disabled ? 0.7 : 1,
          backdropFilter: 'blur(10px)',
          fontWeight: '400',
          resize: 'none',
          fontFamily: 'inherit',
          lineHeight: '1.5'
        }}
      />
    </div>
  );
};

export default MultilineInput;