// 📱 IMAGE CONTEXT MENU - Custom mobile context menu for Imagen images
// Long press menu with Share, Save, Copy actions

import React from 'react';
import { Share, Download, Copy, X } from 'lucide-react';

const ImageContextMenu = ({ 
  isOpen, 
  onClose, 
  imageData, 
  imageName,
  position = { x: 0, y: 0 }
}) => {
  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        // Convert base64 to blob for sharing
        const response = await fetch(imageData);
        const blob = await response.blob();
        const file = new File([blob], imageName || 'generated-image.png', { type: 'image/png' });
        
        await navigator.share({
          files: [file],
          title: 'Generated Image',
          text: 'Check out this AI-generated image!'
        });
      } else {
        // Fallback: copy to clipboard
        await handleCopy();
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback to copy
      await handleCopy();
    }
    onClose();
  };

  const handleSave = () => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = imageName || `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Save failed:', error);
    }
    onClose();
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        console.log('Image copied to clipboard');
      } else {
        // Fallback: copy data URL to text clipboard
        await navigator.clipboard.writeText(imageData);
        console.log('Image data copied to clipboard');
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
    onClose();
  };

  // Calculate menu position to stay on screen
  const menuStyle = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - 200),
    left: Math.min(position.x, window.innerWidth - 200),
    zIndex: 1002,
    minWidth: '180px',
    maxWidth: '220px'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1001,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      
      {/* Menu */}
      <div style={{
        ...menuStyle,
        borderRadius: '12px',
        backgroundColor: 'rgba(55, 65, 81, 0.95)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        animation: 'fadeInScale 0.2s ease-out'
      }}>
        {/* Share */}
        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <Share size={18} color="#60A5FA" />
          <span>Share Image</span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <Download size={18} color="#10B981" />
          <span>Save to Device</span>
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <Copy size={18} color="#F59E0B" />
          <span>Copy Image</span>
        </button>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          margin: '4px 0'
        }} />

        {/* Cancel */}
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <X size={18} color="#EF4444" />
          <span>Cancel</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default ImageContextMenu;