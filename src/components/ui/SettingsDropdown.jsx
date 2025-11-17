// 📁 src/components/ui/SettingsDropdown.jsx
// ⚙️ Settings dropdown component - language selector & new chat

import React from 'react';
import { sessionManager } from '../../services/storage';

const SettingsDropdown = ({ 
  isOpen, 
  onClose, 
  onNewChat, 
  uiLanguage, 
  setUILanguage, 
  t 
}) => {
  if (!isOpen) return null;

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setUILanguage(newLanguage);
    sessionManager.saveUILanguage(newLanguage);
    onClose();
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '4px',
        background: 'rgba(45, 55, 72, 0.95)',
        border: '1px solid rgba(74, 85, 104, 0.8)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
        zIndex: 1001,
        minWidth: '240px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* NEW CHAT BUTTON */}
      <button
        onClick={handleNewChat}
        style={{
          display: 'block',
          width: '100%',
          padding: '0.75rem 1rem',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          fontSize: '0.85rem',
          cursor: 'pointer',
          fontWeight: '400',
          borderRadius: '12px 12px 0 0',
          color: '#e2e8f0',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(74, 85, 104, 0.6)';
          e.target.style.transform = 'translateX(4px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.transform = 'translateX(0)';
        }}
      >
        🆕 {t('newChat')}
      </button>
      
      {/* LANGUAGE SELECTOR */}
      <div style={{ 
        padding: '0.5rem 1rem', 
        borderTop: '1px solid rgba(74, 85, 104, 0.5)',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#a0aec0', 
          marginBottom: '0.5rem',
          fontWeight: '500'
        }}>
          🌍 {t('interfaceLanguage')}
        </div>
        <select 
          value={uiLanguage} 
          onChange={handleLanguageChange}
          style={{ 
            width: '100%', 
            padding: '6px 10px', 
            borderRadius: '6px',
            background: 'rgba(26, 32, 44, 0.8)',
            border: '1px solid rgba(74, 85, 104, 0.6)',
            color: 'white',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(5px)',
            cursor: 'pointer'
          }}
        >
          <option value="cs" style={{ background: '#1a202c' }}>🇨🇿 Čeština</option>
          <option value="en" style={{ background: '#1a202c' }}>🇺🇸 English</option>
          <option value="ro" style={{ background: '#1a202c' }}>🇷🇴 Română</option>
        </select>
      </div>
      
      {/* STATUS INDICATORS */}
      <div style={{
        padding: '0.5rem 1rem',
        fontSize: '0.75rem',
        color: '#68d391',
        borderTop: '1px solid rgba(74, 85, 104, 0.5)',
        background: 'rgba(104, 211, 145, 0.05)'
      }}>
        ✅ Voice Control Enabled
      </div>
      
      <div style={{
        padding: '0.5rem 1rem',
        fontSize: '0.75rem',
        color: '#68d391',
        background: 'rgba(104, 211, 145, 0.05)'
      }}>
        ✅ Google TTS Enhanced
      </div>
      
      <div style={{
        padding: '0.5rem 1rem',
        fontSize: '0.75rem',
        color: '#ffc107',
        background: 'rgba(255, 193, 7, 0.05)',
        borderTop: '1px solid rgba(74, 85, 104, 0.5)'
      }}>
        🔧 Auto Language Detection
      </div>
    </div>
  );
};

export default SettingsDropdown;