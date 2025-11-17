// 🎨 ELORA AI SPLASH SCREEN - Custom Logo Design
// 🚀 Clean design with custom AI brain logo and smooth animations

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import packageJson from '../../../package.json';

const EloraSplashScreen = ({ isVisible, onComplete }) => {
  const { isDark, isElora, isLight } = useTheme();
  const [fadeOut, setFadeOut] = React.useState(false);
  const [showLogo, setShowLogo] = React.useState(false);
  const [showText, setShowText] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      // Show logo after 300ms
      setTimeout(() => setShowLogo(true), 300);

      // Show text after logo (1.2s total)
      setTimeout(() => setShowText(true), 1200);

      // Start fade out after 3s
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onComplete(), 600);
      }, 3000);

      return () => {
        clearTimeout(fadeTimer);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }

        @keyframes logoGlow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.3)) blur(0px);
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(140, 82, 255, 0.5)) blur(0px);
          }
        }

        @keyframes rotateGradient {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.05);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>

      {/* Main Splash Container */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: isDark
          ? '#000000'
          : isElora
            ? '#0055aa'
            : '#FDFBF7', // Cream for light mode
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        opacity: fadeOut ? 0 : 1,
        filter: fadeOut ? 'blur(10px)' : 'blur(0px)',
        transform: fadeOut ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 600ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        overflow: 'hidden'
      }}>

        {/* Logo Container with Enhanced Effects */}
        <div style={{
          marginBottom: '140px',
          marginTop: window.innerHeight > window.innerWidth ? '-120px' : '-80px', // Portrait: higher, Landscape: normal
          opacity: showLogo ? 1 : 0,
          transform: showLogo ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
          filter: showLogo ? 'blur(0px)' : 'blur(10px)',
          transition: 'all 800ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          position: 'relative'
        }}>

          {/* Animated Gradient Border */}
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '-12px',
            width: '184px',
            height: '184px',
            borderRadius: '50%',
            background: `conic-gradient(from 0deg,
              #00d4ff 0deg,
              #0099ff 60deg,
              #4d79ff 120deg,
              #8c52ff 180deg,
              #b833ff 240deg,
              #ff33cc 300deg,
              #00d4ff 360deg
            )`,
            animation: showLogo ? 'rotateGradient 4s linear infinite' : 'none',
            opacity: showLogo ? 0.8 : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: 1
          }}>
            {/* Inner mask for border effect */}
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              width: '174px',
              height: '174px',
              borderRadius: '50%',
              background: isDark ? '#000000' : isElora ? '#0055aa' : '#FDFBF7'
            }} />
          </div>

          {/* Pulsing Ring 1 */}
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: '176px',
            height: '176px',
            borderRadius: '50%',
            border: '2px solid rgba(0, 212, 255, 0.3)',
            animation: showLogo ? 'pulseRing 2s ease-out infinite' : 'none',
            opacity: showLogo ? 1 : 0,
            transition: 'opacity 1s ease-in-out 0.5s',
            zIndex: 0
          }} />

          {/* Pulsing Ring 2 */}
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: '176px',
            height: '176px',
            borderRadius: '50%',
            border: '2px solid rgba(140, 82, 255, 0.2)',
            animation: showLogo ? 'pulseRing 2s ease-out infinite 1s' : 'none',
            opacity: showLogo ? 1 : 0,
            transition: 'opacity 1s ease-in-out 0.8s',
            zIndex: 0
          }} />

          {/* Main Logo */}
          <img
            src="/images/omnia-icon.png"
            alt="Elora AI Icon"
            style={{
              width: '160px',
              height: '160px',
              maxWidth: '50vw',
              objectFit: 'contain',
              borderRadius: '50%',
              boxShadow: `
                0 0 25px rgba(0, 212, 255, 0.4),
                0 0 50px rgba(140, 82, 255, 0.3),
                inset 0 0 25px rgba(255, 255, 255, 0.1)
              `,
              position: 'relative',
              zIndex: 2,
              animation: showLogo ? 'logoGlow 3s ease-in-out infinite' : 'none'
            }}
          />
        </div>

        {/* Text Container */}
        <div style={{
          textAlign: 'center',
          opacity: showText ? 1 : 0,
          transform: showText ? 'translateY(0)' : 'translateY(30px)',
          filter: showText ? 'blur(0px)' : 'blur(5px)',
          transition: 'all 600ms cubic-bezier(0.4, 0.0, 0.2, 1) 0.2s'
        }}>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: '700',
            background: isLight
              ? 'linear-gradient(135deg, #000000 0%, #ff6b35 50%, #e55a1f 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #8c52ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.3rem',
            margin: '0 0 20px 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textShadow: isLight ? '0 0 30px rgba(255, 107, 53, 0.3)' : '0 0 30px rgba(0, 212, 255, 0.3)'
          }}>
            ELORA AI
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
            fontWeight: '300',
            color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.2rem',
            margin: '0 0 15px 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textTransform: 'uppercase'
          }}>
            Intelligence made simple
          </p>

          {/* Powered by Elenor */}
          <p style={{
            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
            fontWeight: '400',
            color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.1rem',
            margin: 0,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Powered by Elenor
          </p>

          {/* App Version */}
          <p style={{
            fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
            fontWeight: '300',
            color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.05rem',
            margin: '5rem 0 0 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            v{packageJson.version}
          </p>
        </div>

      </div>
    </>
  );
};

export default EloraSplashScreen;