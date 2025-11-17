import React, { useRef, useEffect } from 'react';
import { Paperclip } from 'lucide-react';
import { SiGithub } from 'react-icons/si';

/**
 * AttachmentPopup - Elegant pop-up menu for file attachments
 *
 * Design inspired by Claude's attachment menu.
 * Appears above the plus button with glassmorphism effect.
 */
const AttachmentPopup = ({ isOpen, onClose, onUploadFiles, isDark, buttonRef }) => {
  if (!isOpen) return null;

  // Calculate position above the plus button
  const [position, setPosition] = React.useState({ bottom: 60, left: 10 });
  const popupRef = useRef(null);

  React.useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        bottom: window.innerHeight - rect.top + 8, // 8px gap above button
        left: rect.left,
      });
    }
  }, [buttonRef, isOpen]);

  // 🔧 Click-outside detection (allows chat scrolling)
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to prevent immediate close on open
    const timer = setTimeout(() => {
      const handleClickOutside = (e) => {
        // Close if click is outside popup AND outside plus button
        if (
          popupRef.current &&
          !popupRef.current.contains(e.target) &&
          buttonRef?.current &&
          !buttonRef.current.contains(e.target)
        ) {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, onClose, buttonRef]);

  return (
    <>
      {/* Pop-up Menu - NO backdrop (allows chat scrolling) */}
      <div
        ref={popupRef}
        style={{
          position: 'fixed',
          bottom: `${position.bottom}px`,
          left: `${position.left}px`,
          minWidth: '240px',
          backgroundColor: isDark ? 'rgba(40, 40, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          borderRadius: '12px',
          boxShadow: isDark
            ? '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 4px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(20px)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'fadeSlideIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Menu Items */}
        <div style={{ padding: '6px' }}>

          {/* Add from Google Drive - COMING SOON (first) */}
          <button
            onClick={() => {
              // TODO: Implement Google Drive integration
              console.log('🔵 Google Drive integration - Coming soon!');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: 'none',
              background: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }}>
                Add from Google Drive
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginLeft: '16px',
            }}>
              Soon
            </span>
          </button>

          {/* Add from GitHub - COMING SOON (second) */}
          <button
            onClick={() => {
              // TODO: Implement GitHub integration
              console.log('⚫ GitHub integration - Coming soon!');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: 'none',
              background: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <SiGithub size={18} style={{ color: isDark ? '#FFFFFF' : '#181717' }} />
              <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }}>
                Add from GitHub
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginLeft: '16px',
            }}>
              Soon
            </span>
          </button>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              margin: '4px 8px',
            }}
          />

          {/* Upload files - ACTIVE (LAST - file picker opens at bottom) */}
          <button
            onClick={() => {
              onUploadFiles();
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              border: 'none',
              background: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <Paperclip size={18} strokeWidth={2} />
            <span>Upload files</span>
          </button>

        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(4px);
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

export default AttachmentPopup;
