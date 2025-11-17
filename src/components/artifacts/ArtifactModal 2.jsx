import React, { useState } from 'react';

/**
 * ArtifactModal - Fullscreen modal viewer for artifacts
 * Displays HTML in iframe with toolbar (View/Code toggle, Copy, Close)
 */
const ArtifactModal = ({
  isOpen,
  onClose,
  title,
  identifier,
  content,
  artifactType
}) => {
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'code'
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '12px 12px 0 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: '#ffffff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '0.125rem'
            }}
          >
            {identifier}.html
          </div>
        </div>

        {/* View/Code Toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
          style={{
            padding: '0.5rem 0.75rem',
            background: viewMode === 'preview' ? 'rgba(250, 204, 21, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: viewMode === 'preview' ? '#facc15' : 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = viewMode === 'preview'
              ? 'rgba(250, 204, 21, 0.15)'
              : 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = viewMode === 'preview'
              ? 'rgba(250, 204, 21, 0.1)'
              : 'rgba(255, 255, 255, 0.05)';
          }}
        >
          {viewMode === 'preview' ? '👁️ View' : '</> Code'}
        </button>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          style={{
            padding: '0.5rem 0.75rem',
            background: copySuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: copySuccess ? '#22c55e' : 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '70px'
          }}
          onMouseEnter={(e) => {
            if (!copySuccess) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copySuccess) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          {copySuccess ? '✓ Copied' : 'Copy'}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '36px',
            height: '36px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          ✕
        </button>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          background: '#1e1e1e',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {viewMode === 'preview' ? (
          // Preview Mode - iframe
          <iframe
            srcDoc={content}
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#ffffff'
            }}
            title={title}
          />
        ) : (
          // Code Mode - scrollable code view
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              padding: '1rem',
              fontFamily: 'Monaco, Courier New, monospace',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              color: '#f3f4f6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {content}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* ESC key support */
        @media (max-width: 768px) {
          /* Mobile: Add swipe-to-dismiss hint */
        }
      `}</style>
    </div>
  );
};

export default ArtifactModal;
