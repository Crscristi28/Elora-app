import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// 🖼️ Lazy Image Component with IntersectionObserver
const LazyImage = ({ image, index, isLoaded, isSelected, onLoad, onClick, selectionMode, placeholderColor }) => {
  const imgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before image enters viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
      observer.disconnect(); // Completely destroy observer to free memory
    };
  }, []);

  return (
    <div
      ref={imgRef}
      onClick={() => onClick(image, index)}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        backgroundColor: placeholderColor,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: isSelected
          ? '3px solid #007AFF'
          : '1px solid transparent',
        transition: 'border 0.2s ease'
      }}
    >
      {/* Placeholder skeleton */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: placeholderColor,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      )}

      {/* Actual image - only render if visible */}
      {isVisible && (
        <img
          src={image.url}
          alt={`Generated image ${index + 1}`}
          onLoad={() => onLoad(image.url)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}

      {/* Selection checkbox overlay - only show in selection mode */}
      {selectionMode && isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#007AFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path
              d="M1 5L5 9L13 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

const GalleryModal = ({ isOpen, onClose, images = [], onOpenGalleryLightbox }) => {
  const { isDark, isLight, isElora } = useTheme();
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Reset selection AND loaded images when modal opens/closes (prevent memory leak)
  useEffect(() => {
    if (isOpen) {
      setSelectedImages(new Set());
      setLoadedImages(new Set()); // Clear loaded state to free memory
      setSelectionMode(false); // Reset selection mode
    } else {
      // Clear state when closing to free memory
      setLoadedImages(new Set());
      setSelectedImages(new Set());
      setSelectionMode(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // iOS scroll lock
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageLoad = (imageUrl) => {
    setLoadedImages(prev => new Set([...prev, imageUrl]));
  };

  const handleImageClick = (image, index) => {
    if (selectionMode) {
      // Selection mode: toggle selection
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(image.url)) {
          newSet.delete(image.url);
        } else {
          newSet.add(image.url);
        }
        return newSet;
      });
    } else {
      // Normal mode: open lightbox with ALL images (Gallery stays open underneath)
      if (onOpenGalleryLightbox) {
        onOpenGalleryLightbox(image.url, images);
      }
    }
  };

  const handleMakeImage = () => {
    if (selectedImages.size > 0) {
      console.log('🎨 [GALLERY] Activating Image Mode with images:', Array.from(selectedImages));
      // TODO: Activate Image Mode in InputBar with selected images
      onClose();
    }
  };

  // Theme-based colors
  const backgroundColor = isDark
    ? '#000000' // Černá pro dark mode
    : isLight
      ? '#FDFBF7' // Tmavší cream z hlavní theme
      : '#1a237e'; // Modrá pro omnia mode

  const headerColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : isLight
      ? 'rgba(255, 107, 53, 0.08)' // Jemně oranžová pro header v light mode
      : 'rgba(255, 255, 255, 0.05)';

  const textColor = isLight ? '#000000' : '#ffffff'; // Černý v light, bílý v dark/omnia

  const placeholderColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : isLight
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.05)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor,
        zIndex: 9000, // Lower than YARL lightbox default (~9999)
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          background: headerColor,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.5rem',
            cursor: 'pointer',
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : isLight
                ? 'rgba(0, 0, 0, 0.08)'
                : 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
          }}
        >
          <X size={24} />
        </button>

        {/* Title - with orange tint */}
        <h1
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#FF6B35', // Jemně oranžová
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            letterSpacing: '0.5px'
          }}
        >
          Elora Gallery
        </h1>

        {/* SELECT button - better design */}
        <button
          onClick={() => setSelectionMode(!selectionMode)}
          style={{
            background: selectionMode
              ? '#007AFF'
              : isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : isLight
                  ? 'rgba(255, 107, 53, 0.15)'
                  : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            color: selectionMode
              ? '#ffffff'
              : isDark
                ? '#ffffff'
                : isLight
                  ? '#FF6B35'
                  : '#ffffff',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: selectionMode ? '0 2px 8px rgba(0, 122, 255, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (selectionMode) {
              e.target.style.background = '#0066DD';
            } else {
              e.target.style.opacity = '0.8';
            }
          }}
          onMouseLeave={(e) => {
            if (selectionMode) {
              e.target.style.background = '#007AFF';
            } else {
              e.target.style.opacity = '1';
            }
          }}
        >
          {selectionMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      {/* GRID CONTENT */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0.5rem',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {images.length === 0 ? (
          // Empty state
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: textColor,
              opacity: 0.5,
              padding: '2rem'
            }}
          >
            <p style={{ fontSize: '1rem', textAlign: 'center' }}>
              No images yet. Generate some images to see them here!
            </p>
          </div>
        ) : (
          // 3-column grid with lazy loading
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.25rem',
              width: '100%'
            }}
          >
            {images.map((image, index) => {
              const isLoaded = loadedImages.has(image.url);
              const isSelected = selectedImages.has(image.url);

              return (
                <LazyImage
                  key={`${image.url}-${index}`}
                  image={image}
                  index={index}
                  isLoaded={isLoaded}
                  isSelected={isSelected}
                  onLoad={handleImageLoad}
                  onClick={handleImageClick}
                  selectionMode={selectionMode}
                  placeholderColor={placeholderColor}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM BUTTON - only in selection mode */}
      {selectionMode && selectedImages.size > 0 && (
        <div
          style={{
            padding: '1rem',
            background: headerColor,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderTop: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : isLight
                ? '1px solid rgba(0, 0, 0, 0.1)'
                : '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <button
            onClick={handleMakeImage}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#007AFF',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            Make image ({selectedImages.size} selected)
          </button>
        </div>
      )}

      {/* Pulse animation for skeleton */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default GalleryModal;
