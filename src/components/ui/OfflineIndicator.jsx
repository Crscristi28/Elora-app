// 📶 OfflineIndicator.jsx - Network status indicator component
// ✅ Shows offline/online status with visual feedback
// 🚀 PWA-friendly network status indicator

import React from 'react';
import { WifiOff, Wifi, Signal, SignalHigh, SignalLow } from 'lucide-react';

const OfflineIndicator = ({ 
  isOnline = true,
  connectionType = 'unknown',
  connectionInfo = {},
  uiLanguage = 'cs',
  position = 'top-right' // 'top-right', 'bottom-right', 'top-left', 'bottom-left'
}) => {
  
  const texts = {
    cs: {
      offline: 'Offline',
      online: 'Online',
      reconnecting: 'Připojování...',
      slowConnection: 'Pomalé připojení',
      fastConnection: 'Rychlé připojení'
    },
    en: {
      offline: 'Offline',
      online: 'Online', 
      reconnecting: 'Reconnecting...',
      slowConnection: 'Slow connection',
      fastConnection: 'Fast connection'
    },
    ro: {
      offline: 'Offline',
      online: 'Online',
      reconnecting: 'Reconectare...',
      slowConnection: 'Conexiune lentă',
      fastConnection: 'Conexiune rapidă'
    }
  };

  const t = texts[uiLanguage] || texts.cs;

  // Get appropriate icon based on connection
  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff size={14} />;
    }

    if (connectionInfo.isSlowConnection) {
      return <SignalLow size={14} />;
    }
    
    if (connectionInfo.isFastConnection) {
      return <SignalHigh size={14} />;
    }

    return <Wifi size={14} />;
  };

  // Get status text
  const getStatusText = () => {
    if (!isOnline) {
      return t.offline;
    }
    
    if (connectionInfo.isSlowConnection) {
      return t.slowConnection;
    }
    
    if (connectionInfo.isFastConnection) {
      return t.fastConnection;
    }
    
    return t.online;
  };

  // Get colors based on status
  const getColors = () => {
    if (!isOnline) {
      return {
        bg: 'rgba(239, 68, 68, 0.9)', // red
        border: 'rgba(239, 68, 68, 0.3)',
        text: '#ffffff'
      };
    }
    
    if (connectionInfo.isSlowConnection) {
      return {
        bg: 'rgba(251, 146, 60, 0.9)', // orange
        border: 'rgba(251, 146, 60, 0.3)',
        text: '#ffffff'
      };
    }
    
    return {
      bg: 'rgba(34, 197, 94, 0.9)', // green
      border: 'rgba(34, 197, 94, 0.3)',
      text: '#ffffff'
    };
  };

  // Position styles
  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 1500,
      margin: '12px'
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: 0, left: 0 };
      case 'top-right':
        return { ...base, top: 0, right: 0 };
      case 'bottom-left':
        return { ...base, bottom: 0, left: 0 };
      case 'bottom-right':
        return { ...base, bottom: 0, right: 0 };
      default:
        return { ...base, top: 0, right: 0 };
    }
  };

  const colors = getColors();

  // Don't show indicator if online and good connection (optional)
  if (isOnline && !connectionInfo.isSlowConnection) {
    return null; // Hide when everything is fine
  }

  return (
    <div
      style={{
        ...getPositionStyles(),
        background: colors.bg,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${colors.border}`,
        borderRadius: '20px',
        padding: '6px 12px',
        color: colors.text,
        fontSize: '12px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: !isOnline ? 'pulse 2s infinite' : 'none'
      }}
      title={`Connection: ${connectionType} | Status: ${getStatusText()}`}
    >
      {getIcon()}
      <span>{getStatusText()}</span>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default OfflineIndicator;