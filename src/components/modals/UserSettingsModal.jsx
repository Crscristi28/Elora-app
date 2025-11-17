// 🔧 UserSettingsModal.jsx - Native-style Settings Modal with inline pickers
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Check, User, DollarSign, Globe, LogOut, Info, Palette, Lock, Settings } from 'lucide-react';
import { getTranslation } from '../../utils/text/translations';
import { useTheme } from '../../contexts/ThemeContext';
import ResetPasswordModal from '../auth/ResetPasswordModal';
import ProfileModal from './ProfileModal';
import PricingModal from './PricingModal';
import AboutModal from './AboutModal';
import ModelSelectorModal from './ModelSelectorModal';
import DeleteAccountModal from './DeleteAccountModal';

const UserSettingsModal = ({
  isOpen,
  onClose,
  user,
  uiLanguage = 'cs',
  setUILanguage,
  onSignOut,
  onResetPassword,
  onDeleteAccount,
  currentModel = 'gemini-2.5-flash',
  onModelChange,
  onShowSummaryChange
}) => {
  const t = getTranslation(uiLanguage);
  const { theme, setTheme, isLight, isDark, isElora, isSystemTheme } = useTheme();

  // Sub-modals
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showModelSelectorModal, setShowModelSelectorModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Inline dropdowns
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Advanced settings
  const [showSummary, setShowSummary] = useState(() => {
    const saved = localStorage.getItem('showSummary');
    return saved === null ? false : saved === 'true'; // Default: false (OFF)
  });

  const themeDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setShowThemeDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showThemeDropdown || showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeDropdown, showLanguageDropdown]);

  // Language options
  const languageOptions = [
    { code: 'cs', flag: '🇨🇿', label: 'Čeština' },
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'ro', flag: '🇷🇴', label: 'Română' },
    { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' },
    { code: 'pl', flag: '🇵🇱', label: 'Polski' }
  ];

  // Theme options
  const themeOptions = [
    { value: 'system', label: 'System' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'elora', label: 'Elora' }
  ];

  // Get current theme display
  const getCurrentThemeLabel = () => {
    if (isSystemTheme) return 'System';
    if (isDark) return 'Dark';
    if (isLight) return 'Light';
    if (isElora) return 'Elora';
    return 'System';
  };

  // Get current language display
  const getCurrentLanguage = () => {
    return languageOptions.find(lang => lang.code === uiLanguage) || languageOptions[0];
  };

  const handleThemeSelect = (themeValue) => {
    setTheme(themeValue);
    setShowThemeDropdown(false);
  };

  const handleLanguageSelect = (langCode) => {
    setUILanguage(langCode);
    setShowLanguageDropdown(false);
  };

  const handleSummaryToggle = () => {
    const newValue = !showSummary;
    setShowSummary(newValue);
    localStorage.setItem('showSummary', newValue.toString());
    onShowSummaryChange && onShowSummaryChange(newValue); // Notify parent (App.jsx)
  };

  // Toggle component
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

  if (!isOpen) return null;

  // Responsive container styles
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const containerStyle = isMobile ? {
    width: '100vw',
    height: '100vh',
    borderRadius: 0
  } : {
    width: '90vw',
    maxWidth: '500px',
    maxHeight: '85vh',
    borderRadius: '16px'
  };

  return (
    <>
      {/* Sub-modals */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          uiLanguage={uiLanguage}
          onSave={() => {
            // Profile updated - could refresh user data here if needed
            console.log('Profile updated');
          }}
        />
      )}
      {showResetPasswordModal && (
        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => setShowResetPasswordModal(false)}
          onResetPassword={onResetPassword}
          uiLanguage={uiLanguage}
        />
      )}
      {showPricingModal && (
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
        />
      )}
      {showAboutModal && (
        <AboutModal
          isOpen={showAboutModal}
          onClose={() => setShowAboutModal(false)}
          uiLanguage={uiLanguage}
        />
      )}
      {showModelSelectorModal && (
        <ModelSelectorModal
          isOpen={showModelSelectorModal}
          onClose={() => setShowModelSelectorModal(false)}
          currentModel={currentModel}
          onModelChange={onModelChange}
        />
      )}
      {showDeleteAccountModal && (
        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          onDeleteAccount={onDeleteAccount}
        />
      )}

      {/* MODAL OVERLAY */}
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
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* MODAL CONTENT */}
        <div
          className="user-settings-modal"
          style={{
            ...containerStyle,
            background: isDark
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(20, 20, 20, 0.95))'
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
          {/* HEADER */}
          <div style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : isLight
                ? '1px solid rgba(0, 0, 0, 0.1)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <h1 style={{
              color: isLight ? '#000000' : '#ffffff',
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: 0
            }}>
              Settings
            </h1>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = isLight ? '#000000' : '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {/* APPEARANCE SECTION */}
            <div style={{
              padding: '1rem 1.5rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Appearance
            </div>

            {/* Theme Row */}
            <div style={{ position: 'relative' }} ref={themeDropdownRef}>
              <button
                onClick={() => {
                  setShowThemeDropdown(!showThemeDropdown);
                  setShowLanguageDropdown(false);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.03)'
                      : 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <Palette size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
                <span style={{
                  flex: 1,
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}>
                  Theme
                </span>
                <span style={{
                  color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem',
                  marginRight: '0.25rem'
                }}>
                  {getCurrentThemeLabel()}
                </span>
                <ChevronRight size={16} style={{ color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)' }} />
              </button>

              {/* Theme Dropdown */}
              {showThemeDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '1rem',
                  minWidth: '200px',
                  background: isDark
                    ? 'rgba(30, 30, 30, 0.98)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.98)'
                      : 'rgba(0, 20, 40, 0.98)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  animation: 'dropdownSlide 0.2s ease-out'
                }}>
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleThemeSelect(option.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        borderBottom: isDark
                          ? '1px solid rgba(255, 255, 255, 0.05)'
                          : isLight
                            ? '1px solid rgba(0, 0, 0, 0.05)'
                            : '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : isLight
                            ? 'rgba(0, 0, 0, 0.05)'
                            : 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={{
                        flex: 1,
                        color: isLight ? '#000000' : '#ffffff',
                        fontSize: '0.9rem',
                        textAlign: 'left'
                      }}>
                        {option.label}
                      </span>
                      {(option.value === 'system' && isSystemTheme) ||
                       (option.value === theme) ? (
                        <Check size={16} style={{ color: isLight ? '#ff6b35' : '#68d391' }} />
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* LOCALIZATION SECTION */}
            <div style={{
              padding: '1rem 1.5rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.5rem'
            }}>
              Localization
            </div>

            {/* Language Row */}
            <div style={{ position: 'relative' }} ref={languageDropdownRef}>
              <button
                onClick={() => {
                  setShowLanguageDropdown(!showLanguageDropdown);
                  setShowThemeDropdown(false);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.03)'
                      : 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <Globe size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
                <span style={{
                  flex: 1,
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: '400'
                }}>
                  Language
                </span>
                <span style={{
                  color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem',
                  marginRight: '0.25rem'
                }}>
                  {getCurrentLanguage().flag} {getCurrentLanguage().label}
                </span>
                <ChevronRight size={16} style={{ color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)' }} />
              </button>

              {/* Language Dropdown */}
              {showLanguageDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '1rem',
                  minWidth: '220px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  background: isDark
                    ? 'rgba(30, 30, 30, 0.98)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.98)'
                      : 'rgba(0, 20, 40, 0.98)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000,
                  animation: 'dropdownSlide 0.2s ease-out',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  {languageOptions.map((lang, index) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        borderBottom: index < languageOptions.length - 1
                          ? (isDark
                              ? '1px solid rgba(255, 255, 255, 0.05)'
                              : isLight
                                ? '1px solid rgba(0, 0, 0, 0.05)'
                                : '1px solid rgba(255, 255, 255, 0.05)')
                          : 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : isLight
                            ? 'rgba(0, 0, 0, 0.05)'
                            : 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                      <span style={{
                        flex: 1,
                        color: isLight ? '#000000' : '#ffffff',
                        fontSize: '0.9rem',
                        textAlign: 'left'
                      }}>
                        {lang.label}
                      </span>
                      {lang.code === uiLanguage && (
                        <Check size={16} style={{ color: isLight ? '#ff6b35' : '#68d391' }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ACCOUNT SECTION */}
            <div style={{
              padding: '1rem 1.5rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.5rem'
            }}>
              Account
            </div>

            {/* Profile Row */}
            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <User size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
              <span style={{
                flex: 1,
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                Profile
              </span>
              <ChevronRight size={16} style={{ color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)' }} />
            </button>

            {/* Reset Password Row */}
            <button
              onClick={() => setShowResetPasswordModal(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <Lock size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
              <span style={{
                flex: 1,
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                {t('resetPassword')}
              </span>
              <ChevronRight size={16} style={{ color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)' }} />
            </button>

            {/* Sign Out Row */}
            <button
              onClick={onSignOut}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={20} style={{ color: '#ef4444' }} />
              <span style={{
                flex: 1,
                color: '#ef4444',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                {t('signOut')}
              </span>
            </button>

            {/* Delete Account Row */}
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} style={{ color: '#dc2626' }} />
              <span style={{
                flex: 1,
                color: '#dc2626',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                Delete Account
              </span>
            </button>

            {/* SUBSCRIPTION SECTION */}
            <div style={{
              padding: '1rem 1.5rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.5rem'
            }}>
              Subscription
            </div>

            {/* Your Plan Row */}
            <button
              onClick={() => setShowPricingModal(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <DollarSign size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
              <span style={{
                flex: 1,
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                Your Plan
              </span>
              <span style={{
                color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.9rem',
                marginRight: '0.25rem'
              }}>
                Free
              </span>
              <ChevronRight size={16} style={{ color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)' }} />
            </button>

            {/* ADVANCED SECTION */}
            <div style={{
              padding: '1rem 1.5rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.5rem'
            }}>
              Advanced
            </div>

            {/* AI Models Row */}
            <button
              onClick={() => setShowModelSelectorModal(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <Settings size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
              <span style={{
                flex: 1,
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                AI Models
              </span>
              <ChevronRight size={16} style={{ color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)' }} />
            </button>

            {/* Show Summary Row */}
            <div
              onClick={handleSummaryToggle}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <Settings size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
              <span style={{
                flex: 1,
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                Show summary
              </span>
              <Toggle enabled={showSummary} disabled={false} />
            </div>

            {/* INFORMATION SECTION */}
            <div style={{
              padding: '1rem 1.5rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.5rem'
            }}>
              Information
            </div>

            {/* About Row */}
            <button
              onClick={() => setShowAboutModal(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                marginBottom: '2rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.03)'
                    : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <Info size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)' }} />
              <span style={{
                flex: 1,
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '0.95rem',
                fontWeight: '400'
              }}>
                About Omnia
              </span>
              <ChevronRight size={16} style={{ color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)' }} />
            </button>
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

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
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

export default UserSettingsModal;
