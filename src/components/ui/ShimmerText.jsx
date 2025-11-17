// 🎨 ShimmerText.jsx - Animated shimmer loading indicator
// Theme-aware shimmer that works in all modes

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ShimmerText = ({ text = "Just a sec..." }) => {
  const { isDark, isLight } = useTheme();

  // Theme-aware shimmer colors: Dark → white, Light-test → black, Light → white
  const shimmerColors = isDark
    ? 'rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.3) 75%'
    : isLight
      ? 'rgba(0, 0, 0, 0.3) 25%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.3) 75%'
      : 'rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.3) 75%';

  return (
    <span
      style={{
        background: `linear-gradient(90deg, ${shimmerColors})`,
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontSize: '14px',
        fontWeight: '500',
        animation: 'shimmer-skeleton 2s infinite',
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
};

export default ShimmerText;