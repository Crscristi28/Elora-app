// 🎨 Theme Context for Light/Dark mode management
import React, { createContext, useContext, useState, useEffect } from 'react';
import sessionManager from '../services/storage/sessionManager';
import debounce from '../utils/debounce';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Helper function to detect system theme preference
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // fallback to cream light mode
  };

  // Initialize theme with system detection as default
  const [theme, setTheme] = useState(() => {
    const savedTheme = sessionManager.getTheme();

    // If no saved preference OR saved as 'system', use system detection
    if (!savedTheme || savedTheme === 'system') {
      const systemTheme = getSystemTheme();
      console.log('🎨 Using system theme detection:', systemTheme);
      return systemTheme;
    }

    // Manual theme selection
    console.log('🎨 Using manual theme preference:', savedTheme);
    return savedTheme;
  });

  // Track if user is using system theme (not manual selection)
  const [isSystemTheme, setIsSystemTheme] = useState(() => {
    const savedTheme = sessionManager.getTheme();
    return !savedTheme || savedTheme === 'system';
  });

  // Listen for system theme changes only when in system mode
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && isSystemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleSystemThemeChange = (e) => {
        // 🛡️ iOS FIX: Ignore theme changes when app is in background
        // iOS fires spurious prefers-color-scheme events during visibility changes
        if (document.hidden) {
          console.log('🎨 Ignoring theme change during background (iOS protection)');
          return;
        }

        const newSystemTheme = e.matches ? 'dark' : 'light';
        console.log('🎨 System theme changed to:', newSystemTheme);
        setTheme(newSystemTheme);
      };

      // 🎯 Debounce handler to prevent rapid-fire iOS events (300ms)
      const debouncedHandler = debounce(handleSystemThemeChange, 300);

      // ✅ Use modern addEventListener API (addListener is deprecated)
      mediaQuery.addEventListener('change', debouncedHandler);
      return () => mediaQuery.removeEventListener('change', debouncedHandler);
    }
  }, [isSystemTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🎨 User manually changed theme to:', newTheme);
    setIsSystemTheme(false); // Disable system theme mode
    sessionManager.saveTheme(newTheme);
    setTheme(newTheme);
  };

  const setThemeManually = (newTheme) => {
    console.log('🎨 User manually set theme to:', newTheme);

    if (newTheme === 'system') {
      // Switch to system theme mode
      setIsSystemTheme(true);
      sessionManager.saveTheme('system');
      const systemTheme = getSystemTheme();
      setTheme(systemTheme);
    } else {
      // Manual theme selection
      setIsSystemTheme(false);
      sessionManager.saveTheme(newTheme);
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    setTheme: setThemeManually, // Use manual version for UI
    toggleTheme,
    isLight: theme === 'light', // Cream is the main light mode
    isDark: theme === 'dark',
    isElora: theme === 'elora', // Blue gradient mode
    isSystemTheme, // true if following system theme
    systemTheme: getSystemTheme()
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};