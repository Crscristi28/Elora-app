// 🗑️ Delete Account Modal - Permanent account deletion with confirmation
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useKeyboardAwareModal } from '../../hooks/useKeyboardAwareModal';

const DeleteAccountModal = ({ isOpen, onClose, onDeleteAccount }) => {
  const { isDark, isLight } = useTheme();
  const [confirmText, setConfirmText] = useState('');
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 📱 Keyboard-aware positioning (shifts modal up when keyboard appears)
  const modalOffset = useKeyboardAwareModal(isOpen);

  const handleClose = () => {
    setConfirmText('');
    setConfirmCheck(false);
    setError('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!confirmCheck) {
      setError('Please check the confirmation box');
      return;
    }

    setLoading(true);

    try {
      await onDeleteAccount();
      // No need to call handleClose - user will be signed out and redirected
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '450px',
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
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.3s ease-out',
        transform: `translateY(${modalOffset}px)`,
        transition: 'transform 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={28} style={{ color: '#ef4444' }} />
            <h2 style={{
              color: isLight ? '#000000' : 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0
            }}>
              Delete Account
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
              opacity: loading ? 0.5 : 1
            }}
          >
            ×
          </button>
        </div>

        {/* Warning Message */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            color: '#ef4444',
            fontSize: '0.95rem',
            margin: 0,
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            This action cannot be undone!
          </p>
          <p style={{
            color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Deleting your account will permanently remove:
          </p>
          <ul style={{
            color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            margin: '0.5rem 0 0 0',
            paddingLeft: '1.25rem',
            lineHeight: '1.6'
          }}>
            <li>All your conversations and chat history</li>
            <li>All uploaded files and generated content</li>
            <li>Your profile and account settings</li>
            <li>All associated data from our servers</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Checkbox Confirmation */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}>
            <input
              type="checkbox"
              checked={confirmCheck}
              onChange={(e) => setConfirmCheck(e.target.checked)}
              disabled={loading}
              style={{
                width: '18px',
                height: '18px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            />
            <span style={{
              color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem'
            }}>
              I understand this action is permanent and irreversible
            </span>
          </label>

          {/* Text Confirmation */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              Type <strong style={{ color: '#ef4444' }}>DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isDark
                  ? 'rgba(0, 0, 0, 0.4)'
                  : isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(0, 0, 0, 0.3)',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: isLight ? '#000000' : 'white',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                cursor: loading ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  e.target.style.backgroundColor = isDark ? 'rgba(0, 0, 0, 0.4)' : isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.4)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDark
                  ? 'rgba(255, 255, 255, 0.2)'
                  : isLight
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)';
                e.target.style.backgroundColor = isDark
                  ? 'rgba(0, 0, 0, 0.4)'
                  : isLight
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(0, 0, 0, 0.3)';
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: isLight
                  ? 'rgba(0, 0, 0, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: isLight
                  ? '1px solid rgba(0, 0, 0, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: isLight ? '#000000' : 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || confirmText !== 'DELETE' || !confirmCheck}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: (loading || confirmText !== 'DELETE' || !confirmCheck)
                  ? 'rgba(239, 68, 68, 0.5)'
                  : '#ef4444',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: (loading || confirmText !== 'DELETE' || !confirmCheck) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: (loading || confirmText !== 'DELETE' || !confirmCheck) ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading && confirmText === 'DELETE' && confirmCheck) {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && confirmText === 'DELETE' && confirmCheck) {
                  e.target.style.backgroundColor = '#ef4444';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </form>
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

        input::placeholder {
          color: ${isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)'};
        }
      `}</style>
    </div>
  );
};

export default DeleteAccountModal;
