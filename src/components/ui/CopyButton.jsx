// 📁 src/components/ui/CopyButton.jsx
// 📋 Copy text button component

import React, { useState } from 'react';

const CopyButton = ({ text, language = 'cs', isDark = false, isLight = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getButtonTitle = () => {
    const titles = {
      'cs': {
        copied: 'Zkopírováno!',
        ready: 'Zkopírovat text'
      },
      'en': {
        copied: 'Copied!',
        ready: 'Copy text'
      },
      'ro': {
        copied: 'Copiat!',
        ready: 'Copiază textul'
      }
    };

    const langTitles = titles[language] || titles['cs'];
    return copied ? langTitles.copied : langTitles.ready;
  };

  // Color logic: Dark → white, Light-test → black, Light → white
  const iconColor = isDark ? 'white' : (isLight ? 'black' : 'white');

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        borderRadius: '6px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.85rem',
        color: copied ? '#28a745' : iconColor,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      title={getButtonTitle()}
    >
      {copied ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      )}
    </button>
  );
};

export default CopyButton;