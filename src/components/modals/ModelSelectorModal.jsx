// src/components/modals/ModelSelectorModal.jsx
// AI Model Selector Modal - Choose between Gemini and Claude models

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ModelSelectorModal = ({ isOpen, onClose, currentModel, onModelChange }) => {
  const { isDark, isLight } = useTheme();
  const [selectedModel, setSelectedModel] = useState(currentModel);

  useEffect(() => {
    setSelectedModel(currentModel);
  }, [currentModel]);

  if (!isOpen) return null;

  const handleSave = () => {
    onModelChange(selectedModel);
    onClose();
  };

  const models = [
    {
      id: 'gemini-2.5-flash',
      name: 'Elora Flash',
      emoji: '⚡',
      description: 'Lightning-fast responses for quick questions. Great for creative work and simple assistance.'
    },
    {
      id: 'claude-haiku-4.5',
      name: 'Elora Core',
      emoji: '🔶',
      description: 'Perfect balance of speed, reliability, and quality. Best for most daily tasks with strong capabilities.'
    },
    {
      id: 'claude-sonnet-4.5',
      name: 'Elora Think',
      emoji: '🧠',
      description: 'Advanced reasoning for complex problems. Best for coding, analysis, and deep thinking.'
    }
  ];

  const backgroundColor = isDark
    ? 'rgba(0, 0, 0, 0.98)'
    : isLight
      ? 'rgba(255, 255, 255, 0.98)'
      : 'rgba(30, 41, 59, 0.98)';

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : isLight
      ? 'rgba(0, 0, 0, 0.1)'
      : 'rgba(71, 85, 105, 0.3)';

  const textColor = isLight ? '#000000' : '#ffffff';
  const subtextColor = isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDark
        ? 'rgba(0, 0, 0, 0.8)'
        : isLight
          ? 'rgba(0, 0, 0, 0.4)'
          : 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
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
      `}</style>

      <div style={{
        background: backgroundColor,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: isDark
          ? '0 20px 60px rgba(0, 0, 0, 0.8)'
          : '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease-out',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: textColor
          }}>
            AI Models
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : isLight
                  ? 'rgba(0, 0, 0, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={20} color={subtextColor} />
          </button>
        </div>

        {/* Model Options */}
        <div style={{ padding: '1rem' }}>
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                border: `2px solid ${selectedModel === model.id
                  ? (isDark ? '#60A5FA' : '#3B82F6')
                  : borderColor
                }`,
                background: selectedModel === model.id
                  ? (isDark
                    ? 'rgba(96, 165, 250, 0.1)'
                    : isLight
                      ? 'rgba(59, 130, 246, 0.05)'
                      : 'rgba(96, 165, 250, 0.1)')
                  : 'transparent',
                cursor: 'pointer',
                marginBottom: '0.75rem',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                {/* Radio Button */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedModel === model.id
                    ? (isDark ? '#60A5FA' : '#3B82F6')
                    : borderColor
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  transition: 'all 0.2s ease'
                }}>
                  {selectedModel === model.id && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: isDark ? '#60A5FA' : '#3B82F6'
                    }} />
                  )}
                </div>

                {/* Model Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: textColor,
                    marginBottom: '0.25rem'
                  }}>
                    {model.name} {model.emoji}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: subtextColor,
                    lineHeight: '1.5'
                  }}>
                    {model.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: subtextColor,
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : isLight
                  ? 'rgba(0, 0, 0, 0.05)'
                  : 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: isDark ? '#60A5FA' : '#3B82F6',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? '#3B82F6' : '#2563EB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? '#60A5FA' : '#3B82F6';
            }}
          >
            <Check size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelSelectorModal;
