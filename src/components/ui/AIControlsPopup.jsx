// 🎛️ src/components/ui/AIControlsPopup.jsx
// AI Controls minimalist popup - Claude-inspired design

import React, { useRef, useEffect, useState } from 'react';
import { Palette, Lightbulb, Search, ExternalLink, Settings, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ModelSelectorPopup from './ModelSelectorPopup';

const AIControlsPopup = ({ isOpen, onClose, isImageMode, onToggleImageMode, deepReasoning, onToggleDeepReasoning, currentModel, onModelChange, buttonRef }) => {
  const { isDark, isLight } = useTheme();
  const popupRef = useRef(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [position, setPosition] = useState({ bottom: 60, left: 10 });

  // Calculate position above the button
  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        bottom: window.innerHeight - rect.top + 8, // 8px gap above button
        left: rect.left,
      });
    }
  }, [buttonRef, isOpen]);

  // Close popup and model selector when clicking outside
  useEffect(() => {
    if (!isOpen) {
      setShowModelSelector(false); // Close model selector when main popup closes
      return;
    }

    // Don't add click listener if model selector is open
    if (showModelSelector) {
      return;
    }

    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        buttonRef?.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
        setShowModelSelector(false);
      }
    };

    // Add listener after a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, showModelSelector, buttonRef]);

  if (!isOpen) return null;

  // Helper: Get model display name
  const getModelDisplayName = (modelId) => {
    const models = {
      'gemini-2.5-flash': { name: 'Elora Flash', emoji: '⚡' },
      'claude-haiku-4.5': { name: 'Elora Core', emoji: '🔶' },
      'claude-sonnet-4.5': { name: 'Elora Think', emoji: '🧠' },
    };
    return models[modelId] || models['gemini-2.5-flash'];
  };

  // iOS-style toggle component (static for now)
  const Toggle = ({ enabled, disabled }) => {
    return (
      <div style={{
        width: '51px',
        height: '31px',
        borderRadius: '31px',
        background: disabled
          ? 'rgba(120, 120, 128, 0.16)'
          : enabled
            ? '#34C759' // iOS green
            : 'rgba(120, 120, 128, 0.32)',
        position: 'relative',
        transition: 'background 0.3s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}>
        <div style={{
          width: '27px',
          height: '27px',
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '2px',
          left: enabled ? '22px' : '2px',
          transition: 'left 0.3s ease',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.16)',
        }} />
      </div>
    );
  };

  return (
    <>
      {/* Popup */}
      <div
        ref={popupRef}
        style={{
          position: 'fixed',
          bottom: `${position.bottom}px`,
          left: `${position.left}px`,
          minWidth: '280px',
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

        {/* Menu Items */}
        <div style={{ padding: '6px' }}>

          {/* SECTION 1: Google Services */}

          {/* Calendar */}
          <button
            onClick={() => console.log('📅 Calendar integration - Coming soon!')}
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
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" fill="#4285F4"/>
              </svg>
              <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }}>
                Calendar
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}>
              <span style={{ fontSize: '13px' }}>Connect</span>
              <ExternalLink size={14} />
            </div>
          </button>

          {/* Gmail */}
          <button
            onClick={() => console.log('📧 Gmail integration - Coming soon!')}
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
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#EA4335"/>
              </svg>
              <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }}>
                Gmail
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}>
              <span style={{ fontSize: '13px' }}>Connect</span>
              <ExternalLink size={14} />
            </div>
          </button>

          {/* Drive */}
          <button
            onClick={() => console.log('💾 Drive integration - Coming soon!')}
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
                Drive
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}>
              <span style={{ fontSize: '13px' }}>Connect</span>
              <ExternalLink size={14} />
            </div>
          </button>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              margin: '4px 8px',
            }}
          />

          {/* SECTION 2: AI Features */}

          {/* Image mode */}
          <div
            onClick={() => onToggleImageMode && onToggleImageMode()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background 0.15s',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Palette size={18} strokeWidth={2} style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }} />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
              }}>
                Image mode
              </span>
            </div>
            <Toggle enabled={isImageMode} disabled={false} />
          </div>

          {/* Deep reasoning */}
          <div
            onClick={() => onToggleDeepReasoning && onToggleDeepReasoning()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background 0.15s',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lightbulb size={18} strokeWidth={2} style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }} />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
              }}>
                Deep reasoning
              </span>
            </div>
            <Toggle enabled={deepReasoning} disabled={false} />
          </div>

          {/* Deep research - Soon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              opacity: 0.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <Search size={18} strokeWidth={2} style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }} />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
              }}>
                Deep research
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
          </div>

          {/* Model */}
          <button
            onClick={() => setShowModelSelector(true)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={18} strokeWidth={2} style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }} />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
              }}>
                Model
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '13px',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              }}>
                {getModelDisplayName(currentModel).name}
              </span>
              <ChevronRight size={16} style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }} />
            </div>
          </button>

        </div>
      </div>

      {/* Model Selector Popup */}
      <ModelSelectorPopup
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        currentModel={currentModel}
        onModelChange={onModelChange}
        isDark={isDark}
      />
    </>
  );
};

export default AIControlsPopup;
