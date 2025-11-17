// 📋 Terms Consent Modal - GDPR-compliant consent tracking
// IMPORTANT: This is a BLOCKING modal - user cannot dismiss without accepting
import React, { useState } from 'react';
import { FileText, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const TermsConsentModal = ({
  isOpen,
  onAccept,
  onDecline,
  uiLanguage,
  getTranslation
}) => {
  const { isDark, isLight } = useTheme();
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = getTranslation(uiLanguage);

  const handleAccept = async () => {
    setError('');

    if (!isChecked) {
      setError(t('termsConsentRequired'));
      return;
    }

    setLoading(true);

    try {
      await onAccept();
      // Modal will close automatically after successful save
    } catch (err) {
      setError(err.message || 'Failed to save consent. Please try again.');
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      // Default behavior: show message that user cannot use app
      alert(t('termsConsentRequired'));
    }
  };

  if (!isOpen) return null;

  // Get language-specific terms and privacy URLs
  const getDocUrl = (doc) => {
    const langSuffix = uiLanguage === 'en' ? '' : `-${uiLanguage}`;
    return `/${doc}${langSuffix}.html`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10002, // Higher than other modals - this is critical
      animation: 'fadeIn 0.3s ease-out',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: isDark
          ? 'rgba(0, 0, 0, 0.98)'
          : isLight
            ? '#FDFBF7'
            : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.15)'
          : isLight
            ? '1px solid rgba(0, 0, 0, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
        animation: 'slideUp 0.3s ease-out',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            padding: '0.75rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f97316, #fb923c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} style={{ color: 'white' }} />
          </div>
          <h2 style={{
            color: isLight ? '#000000' : 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0,
            flex: 1
          }}>
            {t('termsConsentTitle')}
          </h2>
        </div>

        {/* Body Text */}
        <p style={{
          color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.8)',
          fontSize: '1rem',
          lineHeight: '1.6',
          marginBottom: '1.5rem'
        }}>
          {t('termsConsentBody')}
        </p>

        {/* Links to Documents */}
        <div style={{
          background: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : isLight
              ? 'rgba(0, 0, 0, 0.05)'
              : 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <a
              href={getDocUrl('terms')}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#f97316',
                textDecoration: 'none',
                fontSize: '0.95rem',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'background 0.2s',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <FileText size={18} />
              <span>→ {t('termsConsentTermsLink')}</span>
            </a>

            <a
              href={getDocUrl('privacy')}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#f97316',
                textDecoration: 'none',
                fontSize: '0.95rem',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'background 0.2s',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Shield size={18} />
              <span>→ {t('termsConsentPrivacyLink')}</span>
            </a>
          </div>
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          padding: '0.75rem',
          borderRadius: '12px',
          background: isDark
            ? 'rgba(255, 255, 255, 0.03)'
            : isLight
              ? 'rgba(0, 0, 0, 0.03)'
              : 'rgba(255, 255, 255, 0.02)',
          border: `2px solid ${isChecked ? '#f97316' : 'transparent'}`,
          transition: 'all 0.2s'
        }}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              cursor: 'pointer',
              accentColor: '#f97316',
              flexShrink: 0
            }}
          />
          <span style={{
            color: isLight ? '#1f2937' : 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.95rem',
            lineHeight: '1.5'
          }}>
            {t('termsConsentCheckbox')}
          </span>
        </label>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <p style={{
              color: '#ef4444',
              fontSize: '0.9rem',
              margin: 0
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={handleDecline}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.875rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '12px',
              border: isDark
                ? '2px solid rgba(255, 255, 255, 0.2)'
                : isLight
                  ? '2px solid rgba(0, 0, 0, 0.2)'
                  : '2px solid rgba(255, 255, 255, 0.15)',
              background: 'transparent',
              color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.8)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.03)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {t('termsConsentDecline')}
          </button>

          <button
            onClick={handleAccept}
            disabled={!isChecked || loading}
            style={{
              flex: 1,
              padding: '0.875rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              background: (!isChecked || loading)
                ? 'rgba(249, 115, 22, 0.3)'
                : 'linear-gradient(135deg, #f97316, #fb923c)',
              color: 'white',
              cursor: (!isChecked || loading) ? 'not-allowed' : 'pointer',
              opacity: (!isChecked || loading) ? 0.5 : 1,
              transition: 'all 0.2s',
              boxShadow: (isChecked && !loading)
                ? '0 4px 12px rgba(249, 115, 22, 0.4)'
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (isChecked && !loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = (isChecked && !loading)
                ? '0 4px 12px rgba(249, 115, 22, 0.4)'
                : 'none';
            }}
          >
            {loading ? t('termsConsentLoading') : t('termsConsentAccept')}
          </button>
        </div>

        {/* Footer Notice */}
        <p style={{
          color: isLight ? '#9ca3af' : 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.8rem',
          textAlign: 'center',
          marginTop: '1.5rem',
          marginBottom: 0,
          lineHeight: '1.4'
        }}>
          {t('termsConsentRequired')}
        </p>
      </div>
    </div>
  );
};

export default TermsConsentModal;
