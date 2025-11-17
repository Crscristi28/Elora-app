// 🤖 ModelSelectorPopup.jsx
// Minimalist model selector with radio-style selection

import React from 'react';

const ModelSelectorPopup = ({ isOpen, onClose, currentModel, onModelChange, isDark }) => {
  if (!isOpen) return null;

  const models = [
    {
      id: 'gemini-2.5-flash',
      name: 'Elora Flash',
      emoji: '⚡',
    },
    {
      id: 'claude-haiku-4.5',
      name: 'Elora Core',
      emoji: '🔶',
    },
    {
      id: 'claude-sonnet-4.5',
      name: 'Elora Think',
      emoji: '🧠',
    },
  ];

  const handleSelectModel = (modelId) => {
    onModelChange(modelId);
    onClose();
  };

  // Radio circle component
  const RadioCircle = ({ selected }) => (
    <div style={{
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    }}>
      {selected && (
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isDark ? '#FFFFFF' : '#000000',
        }} />
      )}
    </div>
  );

  return (
    <>
      {/* Popup */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px', // Above InputBar
          right: '70px', // To the right of AIControlsPopup
          minWidth: '200px',
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

        {/* Model Items */}
        <div style={{ padding: '6px' }}>
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelectModel(model.id)}
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
                <span style={{ fontSize: '18px' }}>{model.emoji}</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                }}>
                  {model.name}
                </span>
              </div>
              <RadioCircle selected={currentModel === model.id} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ModelSelectorPopup;
