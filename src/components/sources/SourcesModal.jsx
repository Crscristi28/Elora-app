// 📁 src/components/sources/SourcesModal.jsx
// 🔗 Bottom sheet modal for displaying sources

import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getFaviconUrl, getFallbackIcon } from './sourcesUtils.js';

// Extract domain from URL
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Source item component - clean list style
const SourceItem = ({ source, index, isLight, isLastItem }) => {
  const [imageError, setImageError] = useState(false);
  const faviconUrl = getFaviconUrl(source.url);
  const fallbackIcon = getFallbackIcon(source.url);
  const domain = extractDomain(source.url || '');

  return (
    <a
      href={source.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px 0',
        borderBottom: isLastItem ? 'none' : (isLight
          ? '1px solid rgba(0, 0, 0, 0.08)'
          : '1px solid rgba(255, 255, 255, 0.08)'),
        textDecoration: 'none',
        transition: 'background-color 0.2s ease',
        marginLeft: '-20px',
        marginRight: '-20px',
        paddingLeft: '20px',
        paddingRight: '20px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isLight
          ? 'rgba(0, 0, 0, 0.02)'
          : 'rgba(255, 255, 255, 0.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Favicon */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px',
          overflow: 'hidden'
        }}
      >
        {faviconUrl && !imageError ? (
          <img
            src={faviconUrl}
            alt=""
            style={{
              width: '20px',
              height: '20px',
              objectFit: 'contain'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span style={{ fontSize: '16px' }}>
            {fallbackIcon}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div
          style={{
            color: isLight ? '#000000' : '#ffffff',
            fontSize: '15px',
            fontWeight: '400',
            lineHeight: '1.4',
            marginBottom: '4px'
          }}
        >
          {source.title || 'Untitled'}
        </div>

        {/* Domain */}
        <div
          style={{
            color: isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)',
            fontSize: '13px',
            lineHeight: '1.3'
          }}
        >
          {domain}
        </div>
      </div>
    </a>
  );
};

const SourcesModal = ({ isOpen, onClose, sources = [], language = 'cs' }) => {
  const { isLight } = useTheme();
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle ESC key and backdrop click
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (dragStart === null) return;

    const currentY = e.touches[0].clientY;
    const offset = currentY - dragStart;

    // Only allow dragging down
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // If dragged more than 100px, close modal
    if (dragOffset > 100) {
      onClose();
    }

    // Reset drag state
    setDragStart(null);
    setDragOffset(0);
  };

  if (!isOpen) return null;

  const getTitle = () => {
    const titles = {
      'cs': 'Zdroje',
      'en': 'Sources',
      'ro': 'Surse'
    };
    return titles[language] || titles['cs'];
  };

  const getSubtitle = () => {
    const subtitles = {
      'cs': 'Citace',
      'en': 'Citations',
      'ro': 'Citări'
    };
    return subtitles[language] || subtitles['cs'];
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10001,
          background: isLight ? '#FFFFFF' : '#1a1a1a',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          animation: isOpen && dragOffset === 0 ? 'slideUpFromBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Drag Handle */}
        <div
          style={{
            padding: '12px 0 8px 0',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={onClose}
        >
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '0 20px 16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            style={{
              margin: 0,
              color: isLight ? '#000000' : '#ffffff',
              fontSize: '20px',
              fontWeight: '600'
            }}
          >
            {getTitle()}
          </h2>

          {/* Close button (X) - desktop only */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? '#000000' : '#ffffff',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isLight
                ? 'rgba(0, 0, 0, 0.1)'
                : 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Sources List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 20px 20px 20px',
            minHeight: '200px'
          }}
        >
          {sources.map((source, index) => (
            <SourceItem
              key={index}
              source={source}
              index={index}
              isLight={isLight}
              isLastItem={index === sources.length - 1}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUpFromBottom {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default SourcesModal;