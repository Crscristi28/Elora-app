// 🎥 YouTubeEmbed.jsx - YouTube video embed component
import React, { useState } from 'react';

const YouTubeEmbed = ({ videoId, title = "YouTube video", className = "" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  if (!videoId) return null;
  
  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  if (hasError) {
    return (
      <div className={`youtube-embed-error ${className}`} style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        color: '#ff6b6b',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
        <div>Failed to load YouTube video</div>
        <a 
          href={`https://youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            color: '#60A5FA', 
            textDecoration: 'underline',
            fontSize: '0.9rem'
          }}
        >
          Open on YouTube
        </a>
      </div>
    );
  }
  
  return (
    <div className={`youtube-embed-container ${className}`} style={{
      position: 'relative',
      width: '100%',
      maxWidth: '560px',
      aspectRatio: '16/9',
      margin: '1rem 0',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(0, 0, 0, 0.3)'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid #60A5FA',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}
      
      <iframe
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default YouTubeEmbed;