// 📶 useOnlineStatus.js - Network status detection hook
// ✅ Detects online/offline status changes
// 🚀 React hook for PWA offline support

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Initial state from navigator.onLine
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [connectionType, setConnectionType] = useState(() => {
    // Try to get connection info if available
    if (typeof navigator !== 'undefined' && navigator.connection) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  });

  useEffect(() => {
    console.log('📶 Setting up online/offline listeners');

    const handleOnline = () => {
      console.log('✅ Network connection restored');
      setIsOnline(true);
      
      // Update connection type if available
      if (navigator.connection) {
        setConnectionType(navigator.connection.effectiveType || 'unknown');
      }
    };

    const handleOffline = () => {
      console.log('❌ Network connection lost');
      setIsOnline(false);
    };

    const handleConnectionChange = () => {
      if (navigator.connection) {
        const newType = navigator.connection.effectiveType || 'unknown';
        console.log('📶 Connection type changed:', newType);
        setConnectionType(newType);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes (if supported)
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  // Additional connection info
  const connectionInfo = {
    type: connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
    isFastConnection: connectionType === '4g' || connectionType === '5g'
  };

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    connectionInfo
  };
}