// 🔧 AboutModal.jsx - About modal with legal documents submenu
import React from 'react';
import { X, ChevronDown, FileText, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const AboutModal = ({
  isOpen,
  onClose,
  uiLanguage = 'cs'
}) => {
  const { isDark, isLight, isElora } = useTheme();

  if (!isOpen) return null;

  // Responsive sizing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const containerStyle = isMobile ? {
    width: '100vw',
    height: '100vh',
    borderRadius: 0
  } : {
    width: '90vw',
    maxWidth: '600px',
    maxHeight: '85vh',
    borderRadius: '16px'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* MODAL CONTENT - Responsive Centered */}
      <div
        style={{
          ...containerStyle,
          background: isDark
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(10, 10, 10, 0.95))'
            : isElora
              ? 'linear-gradient(135deg, rgba(0, 4, 40, 0.95), rgba(0, 78, 146, 0.90))'
              : '#FDFBF7', // Light mode: solid darker cream (consistent)
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: isMobile ? 'slideUp 0.3s ease-out' : 'scaleIn 0.3s ease-out',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER - Fixed Top (like UserSettingsModal) */}
        <div style={{
          padding: '2rem 2rem 1rem',
          borderBottom: isLight
            ? '1px solid rgba(0, 0, 0, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'transparent',
              border: 'none',
              color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent !important',
              WebkitFocusRingColor: 'transparent !important',
              boxShadow: 'none !important',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              padding: '0.25rem',
              borderRadius: '6px',
              fontSize: '1.25rem',
              lineHeight: 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
            }}
          >
            <X size={20} />
          </button>

          {/* Title */}
          <h1 style={{
            color: isLight ? '#000000' : 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0'
          }}>
            About Elora
          </h1>
        </div>

        {/* SCROLLABLE CONTENT (like UserSettingsModal) */}
        <div style={{
          flex: 1,
          padding: '1.5rem 2rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>

          {/* App Info */}
          <div style={{
            background: isLight
              ? 'rgba(255, 255, 255, 0.5)'
              : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: isDark
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              color: isLight ? '#000000' : 'white',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 1rem 0'
            }}>
              Elora One AI
            </h3>
            <p style={{
              color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              margin: '0 0 1rem 0'
            }}>
              Elora One AI is your personal AI assistant that thinks global and answers local.
            </p>

            <p style={{
              color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              margin: 0
            }}>
              Powered by{' '}
              <a
                href="https://www.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: isLight ? '#ff6b35' : '#00d4ff',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
              >
                Anthropic
              </a>
              ,{' '}
              <a
                href="https://openai.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: isLight ? '#ff6b35' : '#00d4ff',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
              >
                OpenAI
              </a>
              ,{' '}
              <a
                href="https://ai.google"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: isLight ? '#ff6b35' : '#00d4ff',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
              >
                Google
              </a>
              ,{' '}
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: isLight ? '#ff6b35' : '#00d4ff',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
              >
                ElevenLabs
              </a>
              .
            </p>
          </div>

          {/* Legal Documents Section */}
          <div>
            <h3 style={{
              color: isLight ? '#000000' : 'white',
              fontSize: '1rem',
              fontWeight: '600',
              margin: '0 0 0.75rem 0'
            }}>
              Legal Documents
            </h3>

            {/* Important Data Processing Disclaimer - moved here */}
            <div style={{
              background: isLight
                ? 'rgba(255, 193, 7, 0.15)'
                : 'rgba(255, 193, 7, 0.1)',
              borderRadius: '12px',
              border: isLight
                ? '1px solid rgba(255, 152, 0, 0.4)'
                : '1px solid rgba(255, 193, 7, 0.3)',
              padding: '1rem',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                color: isLight ? '#e65100' : '#ffc107',
                fontSize: '0.9rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⚠️ Important: Third-Party Data Processing
              </h4>
              <p style={{
                color: isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                margin: '0 0 0.75rem 0'
              }}>
                When using Elora One AI, your conversations and data are processed by third-party AI providers through their respective APIs. <strong>We are not responsible for how these providers handle your data.</strong>
              </p>
              <p style={{
                color: isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                margin: 0
              }}>
                For detailed information about their data processing practices, please visit their privacy policies:
              </p>
              <div style={{
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                fontSize: '0.85rem'
              }}>
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    color: isLight ? '#ff6b35' : '#00d4ff',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    padding: '0.25rem 0',
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    textDecoration: 'none',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s ease',
                    width: '100%',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                  onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
                >
                  • Anthropic Privacy Policy
                </a>
                <a
                  href="https://openai.com/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    color: isLight ? '#ff6b35' : '#00d4ff',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    padding: '0.25rem 0',
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    textDecoration: 'none',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s ease',
                    width: '100%',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                  onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
                >
                  • OpenAI Privacy Policy
                </a>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    color: isLight ? '#ff6b35' : '#00d4ff',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    padding: '0.25rem 0',
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    textDecoration: 'none',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s ease',
                    width: '100%',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                  onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
                >
                  • Google Privacy Policy
                </a>
                <a
                  href="https://elevenlabs.io/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'transparent',
                    color: isLight ? '#ff6b35' : '#00d4ff',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    padding: '0.25rem 0',
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    textDecoration: 'none',
                    borderBottom: '1px solid transparent',
                    transition: 'border-color 0.2s ease',
                    width: '100%',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.style.borderBottomColor = isLight ? '#ff6b35' : '#00d4ff'}
                  onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
                >
                  • ElevenLabs Privacy Policy
                </a>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>

              {/* Terms of Service */}
              <a
                href="https://omniaai.app/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  background: isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: isDark
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.75rem',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = isLight
                    ? '#EFE0CC'
                    : 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.25)'
                    : 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <FileText size={16} style={{ opacity: 0.7 }} />
                <span style={{ flex: 1 }}>Terms of Service</span>
                <ChevronDown
                  size={14}
                  style={{
                    opacity: 0.6,
                    transform: 'rotate(-90deg)'
                  }}
                />
              </a>

              {/* Privacy Policy */}
              <a
                href="https://omniaai.app/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  background: isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: isDark
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.75rem',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = isLight
                    ? '#EFE0CC'
                    : 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.25)'
                    : 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Shield size={16} style={{ opacity: 0.7 }} />
                <span style={{ flex: 1 }}>Privacy Policy</span>
                <ChevronDown
                  size={14}
                  style={{
                    opacity: 0.6,
                    transform: 'rotate(-90deg)'
                  }}
                />
              </a>

              {/* Authentication & Security */}
              <a
                href="https://omniaai.app/security"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  background: isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.75rem',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = isLight
                    ? '#EFE0CC'
                    : 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.25)'
                    : 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Shield size={16} style={{ opacity: 0.7 }} />
                <span style={{ flex: 1 }}>Authentication &amp; Security</span>
                <ChevronDown
                  size={14}
                  style={{
                    opacity: 0.6,
                    transform: 'rotate(-90deg)'
                  }}
                />
              </a>

              {/* GDPR Compliance */}
              <a
                href="https://omniaai.app/gdpr"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  background: isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.75rem',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = isLight
                    ? '#EFE0CC'
                    : 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.25)'
                    : 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Shield size={16} style={{ opacity: 0.7 }} />
                <span style={{ flex: 1 }}>GDPR Compliance</span>
                <ChevronDown
                  size={14}
                  style={{
                    opacity: 0.6,
                    transform: 'rotate(-90deg)'
                  }}
                />
              </a>
            </div>
          </div>

          {/* Version Info */}
          <div style={{
            background: isLight
              ? 'rgba(255, 255, 255, 0.5)'
              : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: isDark
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.75rem',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <p style={{
              color: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.8rem',
              margin: 0
            }}>
              Version 2.0 • Built with ❤️ for AI enthusiasts
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AboutModal;
