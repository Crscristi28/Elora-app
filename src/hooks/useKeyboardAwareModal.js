// 📱 useKeyboardAwareModal.js - Hook for keyboard-aware modal positioning
// Detects virtual keyboard and shifts modal up using transform (no scroll needed!)

import { useState, useEffect } from 'react';

/**
 * Hook that detects virtual keyboard appearance and calculates modal offset
 *
 * @param {boolean} isOpen - Whether the modal is currently open
 * @returns {number} translateY - Vertical offset in pixels to shift modal up
 *
 * Usage:
 * const modalOffset = useKeyboardAwareModal(isOpen);
 * <div style={{ transform: `translateY(${modalOffset}px)` }}>Modal content</div>
 */
export const useKeyboardAwareModal = (isOpen) => {
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setTranslateY(0);
      return;
    }

    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if Visual Viewport API is supported
    if (!window.visualViewport) {
      console.warn('⚠️ [KEYBOARD] Visual Viewport API not supported');
      return;
    }

    const handleViewportResize = () => {
      // Calculate how much the viewport height has reduced
      const windowHeight = window.innerHeight;
      const viewportHeight = window.visualViewport.height;
      const keyboardHeight = windowHeight - viewportHeight;

      // If keyboard is visible (viewport reduced by more than 150px)
      if (keyboardHeight > 150) {
        // Shift modal up by half the keyboard height to keep it visible
        const offset = -(keyboardHeight * 0.4);
        console.log(`⌨️ [KEYBOARD] Detected keyboard height: ${keyboardHeight}px, offsetting modal by ${offset}px`);
        setTranslateY(offset);
      } else {
        // Keyboard hidden, reset position
        setTranslateY(0);
      }
    };

    // Listen for viewport resize (keyboard show/hide)
    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);

    // Initial check
    handleViewportResize();

    // Cleanup
    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportResize);
      window.visualViewport.removeEventListener('scroll', handleViewportResize);
      setTranslateY(0);
    };
  }, [isOpen]);

  return translateY;
};

export default useKeyboardAwareModal;
