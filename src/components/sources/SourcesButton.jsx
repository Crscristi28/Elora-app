// 📁 src/components/sources/SourcesButton.jsx
// 🔗 Sources button with stacked favicon preview

import React, { useState } from 'react';
import { getFaviconUrl, getFallbackIcon } from './sourcesUtils.js';

// Individual favicon circle component
const FaviconCircle = ({ source, index, isLight }) => {
  const [imageError, setImageError] = useState(false);
  const faviconUrl = getFaviconUrl(source.url);
  const fallbackIcon = getFallbackIcon(source.url);

  return (
    <div
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        border: isLight ? '1.5px solid rgba(0, 0, 0, 0.2)' : '1.5px solid rgba(255, 255, 255, 0.25)',
        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(45, 55, 72, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginLeft: index === 0 ? '0' : '-6px', // Overlap effect
        zIndex: 5 - index, // First favicon on top
        position: 'relative',
        flexShrink: 0
      }}
    >
      {faviconUrl && !imageError ? (
        <img
          src={faviconUrl}
          alt=""
          style={{
            width: '12px',
            height: '12px',
            objectFit: 'contain'
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <span style={{ fontSize: '10px' }}>
          {fallbackIcon}
        </span>
      )}
    </div>
  );
};

const SourcesButton = ({ sources = [], onClick, language = 'cs', isDark = false, isLight = false }) => {
  // Reserve space even when no sources (prevent Virtuoso layout shift)
  if (!sources || sources.length === 0) {
    return <div style={{ height: '36px', width: '0', flexShrink: 0 }}></div>;
  }

  const visibleSources = sources.slice(0, 5);
  const remainingCount = sources.length > 5 ? sources.length - 5 : 0;

  const getButtonTitle = () => {
    const titles = {
      'cs': `Zobrazit ${sources.length} zdrojů`,
      'en': `Show ${sources.length} sources`,
      'ro': `Arată ${sources.length} surse`
    };
    return titles[language] || titles['cs'];
  };

  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '36px', // Fixed height for Virtuoso
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 0.8
      }}
      title={getButtonTitle()}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Stacked favicons container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '18px',
        paddingLeft: '2px' // Small padding for visual balance
      }}>
        {visibleSources.map((source, index) => (
          <FaviconCircle
            key={index}
            source={source}
            index={index}
            isLight={isLight}
          />
        ))}
      </div>

      {/* +X counter if more than 5 sources */}
      {remainingCount > 0 && (
        <span style={{
          fontSize: '0.75rem',
          color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          fontWeight: '500',
          paddingLeft: '2px'
        }}>
          +{remainingCount}
        </span>
      )}
    </button>
  );
};

export default SourcesButton;