// 📁 src/components/sources/SourceCard.jsx
// 🔗 Individual source card component

import React, { useState } from 'react';
import { formatSource } from './sourcesUtils.js';

const SourceCard = ({ source, index = 0 }) => {
  const [imageError, setImageError] = useState(false);
  const isMobile = window.innerWidth <= 768;
  
  // Format source using utils
  const formattedSource = formatSource(source);
  
  const handleImageError = () => {
    setImageError(true);
  };

  const CardContent = (
    <>
      {/* Favicon / Icon */}
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
          overflow: 'hidden'
        }}
      >
        {formattedSource.favicon && !imageError ? (
          <img
            src={formattedSource.favicon}
            alt=""
            style={{
              width: '16px',
              height: '16px',
              objectFit: 'contain'
            }}
            onError={handleImageError}
          />
        ) : (
          <span style={{ fontSize: '14px' }}>
            {formattedSource.icon}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        
        {/* Title */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: '500',
            marginBottom: '0.25rem',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {formattedSource.title}
        </div>
        
        {/* Domain */}
        <div
          style={{
            color: '#a0aec0',
            fontSize: '0.8rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '0.25rem'
          }}
        >
          {formattedSource.domain}
        </div>

        {/* Full URL (truncated) */}
        {formattedSource.url && (
          <div
            style={{
              color: '#718096',
              fontSize: '0.75rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 0.8
            }}
          >
            {formattedSource.url}
          </div>
        )}
      </div>

      {/* External link icon */}
      {formattedSource.url && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#a0aec0"
          style={{ 
            flexShrink: 0, 
            marginTop: '2px',
            transition: 'all 0.2s ease'
          }}
        >
          <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
        </svg>
      )}
    </>
  );

  const baseStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(74, 85, 104, 0.3)',
    borderRadius: '12px',
    padding: '1rem',
    cursor: formattedSource.url ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'block',
    animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`
  };

  const hoverHandlers = {
    onMouseEnter: (e) => {
      if (formattedSource.url) {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(74, 85, 104, 0.5)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      e.currentTarget.style.borderColor = 'rgba(74, 85, 104, 0.3)';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  return (
    <>
      {formattedSource.url ? (
        <a
          href={formattedSource.url}
          {...(!isMobile && { target: "_blank" })}
          rel="noopener noreferrer"
          style={baseStyle}
          {...hoverHandlers}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            {CardContent}
          </div>
        </a>
      ) : (
        <div style={baseStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            {CardContent}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default SourceCard;