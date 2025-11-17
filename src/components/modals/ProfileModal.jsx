// 👤 ProfileModal.jsx - User Profile Edit Modal
import React, { useState, useEffect } from 'react';
import { X, User, Check } from 'lucide-react';
import { getTranslation } from '../../utils/text/translations';
import { profileService } from '../../services/profile/profileService';
import { useTheme } from '../../contexts/ThemeContext';
import { useKeyboardAwareModal } from '../../hooks/useKeyboardAwareModal';

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  uiLanguage = 'cs',
  onSave 
}) => {
  const t = getTranslation(uiLanguage);
  const { isDark, isLight, isElora } = useTheme();
  const [fullName, setFullName] = useState('');
  const [callMeName, setCallMeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // 📱 Keyboard-aware positioning (shifts modal up when keyboard appears)
  const modalOffset = useKeyboardAwareModal(isOpen);

  // Add CSS to remove iOS focus styles
  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.id = 'profile-modal-focus-fix';
      style.textContent = `
        .profile-modal input:focus,
        .profile-modal button:focus,
        .profile-modal button:active,
        .profile-modal button:focus-visible,
        .profile-modal button:focus-within {
          outline: none !important;
          outline-style: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
          -webkit-tap-highlight-color: transparent !important;
          -webkit-focus-ring-color: transparent !important;
          -webkit-appearance: none !important;
          box-shadow: none !important;
        }
        .profile-modal input {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-focus-ring-color: transparent !important;
          -webkit-appearance: none !important;
          outline: none !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById('profile-modal-focus-fix');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isOpen]);

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await profileService.loadProfile();
      setFullName(profile.full_name || '');
      setCallMeName(profile.name || '');
    } catch (error) {
      console.error('❌ [PROFILE] Error loading profile data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!fullName.trim() && !callMeName.trim()) return;
    
    setIsLoading(true);
    try {
      const profileData = {
        full_name: fullName.trim() || null,
        name: callMeName.trim() || null
      };
      
      await profileService.saveProfile(profileData);
      
      // Call parent callback if provided
      if (onSave) {
        await onSave(profileData);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ [PROFILE] Profile save failed:', error);
      // You could add error toast here
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
        {/* MODAL CONTENT */}
        <div
          className="profile-modal"
          style={{
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            margin: '2rem',
            background: isDark
              ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(10, 10, 10, 0.95))'
              : isElora
                ? 'linear-gradient(135deg, rgba(0, 4, 40, 0.95), rgba(0, 78, 146, 0.90))'
                : '#FDFBF7',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : isLight
                ? '1px solid rgba(0, 0, 0, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
            position: 'relative',
            transform: `translateY(${modalOffset}px)`,
            transition: 'transform 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: isDark
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : isLight
                ? '1px solid rgba(0, 0, 0, 0.15)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <User size={20} style={{ color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)' }} />
              <h2 style={{
                margin: 0,
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                {t('profile')}
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                borderRadius: '8px',
                color: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
                e.target.style.background = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';
                e.target.style.background = 'none';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* CONTENT */}
          <div style={{
            padding: '1.5rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {isLoadingProfile ? (
              /* Loading Profile Data */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                gap: '1rem'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: isLight
                    ? '2px solid rgba(0, 0, 0, 0.3)'
                    : '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: isLight ? '2px solid #000000' : '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                  color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  {t('loadingProfile')}
                </p>
              </div>
            ) : (
              <>
                {/* Full Name Field */}
            <div>
              <label style={{
                display: 'block',
                color: isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                {t('fullName')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={
                  t('howYouWantToBeDisplayed')
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.2)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = isLight ? 'rgba(255, 107, 53, 0.5)' : 'rgba(255, 255, 255, 0.3)';
                  e.target.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            {/* Call Me Field */}
            <div>
              <label style={{
                display: 'block',
                color: isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                {t('aiGreeting')}
              </label>
              <input
                type="text"
                value={callMeName}
                onChange={(e) => setCallMeName(e.target.value)}
                placeholder={
                  t('howAiShouldAddressYou')
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.2)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: isLight ? '#000000' : '#ffffff',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = isLight ? 'rgba(255, 107, 53, 0.5)' : 'rgba(255, 255, 255, 0.3)';
                  e.target.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? 'rgba(255, 255, 255, 0.5)'
                      : 'rgba(255, 255, 255, 0.05)';
                }}
              />
              <p style={{
                margin: '0.5rem 0 0 0',
                color: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem'
              }}>
                {t('exampleNicknames')}
              </p>
            </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: isDark
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : isLight
                ? '1px solid rgba(0, 0, 0, 0.15)'
                : '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                background: 'none',
                border: isLight
                  ? '1px solid rgba(0, 0, 0, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.05)'
                      : 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.3)'
                    : 'rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.background = 'none';
                  e.target.style.borderColor = isLight
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              {t('cancel')}
            </button>

            <button
              onClick={handleSave}
              disabled={isLoading || (!fullName.trim() && !callMeName.trim())}
              style={{
                background: (isLoading || (!fullName.trim() && !callMeName.trim()))
                  ? 'rgba(255, 255, 255, 0.1)'
                  : isLight
                    ? '#ff6b35'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: (isLoading || (!fullName.trim() && !callMeName.trim())) ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: (isLoading || (!fullName.trim() && !callMeName.trim())) ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading && (fullName.trim() || callMeName.trim())) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = isLight
                    ? '0 4px 15px rgba(255, 107, 53, 0.4)'
                    : '0 4px 15px rgba(102, 126, 234, 0.4)';
                  if (isLight) {
                    e.target.style.background = '#e55a1f';
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  if (isLight && (fullName.trim() || callMeName.trim())) {
                    e.target.style.background = '#ff6b35';
                  }
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Check size={14} />
                  {t('save')}
                </>
              )}
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
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ProfileModal;