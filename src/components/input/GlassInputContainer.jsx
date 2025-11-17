// src/components/input/GlassInputContainer.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const GlassInputContainer = ({ children }) => {
  const { isDark, isElora } = useTheme();
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(10, 10, 10, 0.8))'
        : isElora
          ? 'linear-gradient(135deg, rgba(0, 4, 40, 0.95), rgba(0, 78, 146, 0.8))'
          : 'linear-gradient(135deg, rgba(253, 251, 247, 0.95), rgba(253, 251, 247, 0.8))',
      backdropFilter: 'blur(20px)',
      padding: isMobile ? '1.2rem' : '1.6rem',
      borderTop: isDark
        ? '1px solid rgba(255,255,255,0.1)'
        : isElora
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(0,0,0,0.1)',
      paddingBottom: isMobile ? '1.2rem' : '1.6rem',
      zIndex: 10,
      flexShrink: 0
    }}>
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        display: 'flex', 
        gap: '0.8rem', 
        alignItems: 'center'
      }}>
        {children}
      </div>
    </div>
  );
};

export default GlassInputContainer;