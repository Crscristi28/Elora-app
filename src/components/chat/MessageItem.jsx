// 🎨 MessageItem.jsx - Individual message rendering component
// ✅ Extracted from App.jsx to reduce file size and improve maintainability

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';

// Import components that are used in message rendering
import MessageRenderer from '../MessageRenderer';
import { SourcesButton } from '../sources';
import { VoiceButton, CopyButton, ChatOmniaLogo, ShimmerText } from '../ui';
import PdfViewer from '../PdfViewer';
import SummaryCard from './SummaryCard'; // 📊 Summary card component

// Import utilities
import { detectLanguage } from '../../utils/text';
import { getViewerType } from '../../utils/fileTypeUtils';

// Import styles
import * as styles from '../../styles/ChatStyles.js';

const MessageItem = ({
  msg,
  index,
  isDark,
  isLight,
  onPreviewImage,
  onDocumentView,
  onPdfView,
  onSourcesClick,
  onAudioStateChange,
  showSummary = true
}) => {
  // State for uploaded PDF viewer
  const [uploadedPdfData, setUploadedPdfData] = useState(null);

  // State for expandable user bubble
  const [isUserBubbleExpanded, setIsUserBubbleExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const userBubbleRef = useRef(null);
  const textWrapperRef = useRef(null);

  // Extract styles from ChatStyles.js
  const { 
    userMessageContainerStyle, 
    botMessageContainerStyle,
    loadingContainerStyle,
    loadingBoxStyle,
    userContainerStyle,
    userBubbleStyle,
    botContainerStyle,
    botHeaderStyle,
    botNameStyle,
    loadingAnimationContainerStyle,
    loadingSpinnerStyle,
    loadingTextStyleStreaming,
    loadingTextStyleNormal,
    loadingDotsContainerStyle,
    loadingDotStyle,
    loadingDot2Style,
    loadingDot3Style,
    imageStyle,
    userAttachmentsContainerStyle,
    userAttachmentWrapperStyle
  } = styles;

  // Detect if user bubble needs expand button
  useEffect(() => {
    if (textWrapperRef.current && msg.sender === 'user' && msg.text) {
      const element = textWrapperRef.current;
      // Check if content is taller than maxHeight
      const isTruncated = element.scrollHeight > element.clientHeight;
      setShowExpandButton(isTruncated);
    }
  }, [msg.text, msg.sender]);

  // PHASE 1: Memoized callbacks for performance
  const handleExpandBubble = useCallback(() => {
    setIsUserBubbleExpanded(true);
  }, []);

  const handleImagePreview = useCallback((imageData) => {
    onPreviewImage(imageData);
  }, [onPreviewImage]);

  const handleDocumentViewOpen = useCallback((docData) => {
    onDocumentView(docData);
  }, [onDocumentView]);

  const handleClosePdf = useCallback(() => {
    setUploadedPdfData(null);
  }, []);

  // PHASE 2: Memoized styles for performance
  const computedUserBubbleStyle = useMemo(() => ({
    ...userBubbleStyle,
    backgroundColor: isDark
      ? 'rgba(255, 255, 255, 0.1)'
      : isLight
        ? '#f5f0e6'
        : 'rgba(255, 255, 255, 0.1)',
    color: isDark
      ? '#ffffff'
      : isLight
        ? '#000000'
        : '#ffffff',
    border: isDark
      ? '1px solid rgba(255, 255, 255, 0.2)'
      : isLight
        ? '1px solid rgba(0, 0, 0, 0.1)'
        : '1px solid rgba(255, 255, 255, 0.2)',
    maxHeight: 'none',
    overflowY: 'visible',
  }), [isDark, isLight, userBubbleStyle]);

  const computedTextWrapperStyle = useMemo(() => ({
    maxHeight: isUserBubbleExpanded ? 'none' : userBubbleStyle.maxHeight,
    overflowY: isUserBubbleExpanded ? 'visible' : 'hidden',
    transition: 'max-height 0.3s ease-in-out',
  }), [isUserBubbleExpanded, userBubbleStyle.maxHeight]);

  const computedBotContainerStyle = useMemo(() => ({
    ...botContainerStyle,
    color: isDark ? '#FFFFFF' : (isLight ? '#000000' : '#FFFFFF')
  }), [isDark, isLight, botContainerStyle]);

  return (
    <div 
      key={msg.id || `fallback_${index}`} 
      data-sender={msg.sender}
      style={msg.sender === 'user' ? userMessageContainerStyle : botMessageContainerStyle}
    >
      {/* COMMENTED OUT - Using animate-pulse indicator in message text instead */}
      {/* {msg.isLoading ? (
        <div style={loadingContainerStyle}>
          <div style={loadingBoxStyle}>
            <div style={loadingAnimationContainerStyle}>
              <div style={loadingSpinnerStyle}></div>
              <span style={msg.isStreaming ? loadingTextStyleStreaming : loadingTextStyleNormal}>
                {msg.isStreaming ? (
                  <span style={loadingDotsContainerStyle}>
                    <span style={loadingDotStyle}>●</span>
                    <span style={loadingDot2Style}>●</span>
                    <span style={loadingDot3Style}>●</span>
                  </span>
                ) : msg.text}
              </span>
            </div>
          </div>
        </div>
      ) : */}
      {msg.sender === 'user' ? (
        <div style={userContainerStyle}>
          {/* User text bubble */}
          {msg.text && (
            <div
              ref={userBubbleRef}
              style={computedUserBubbleStyle}>
              {/* Text wrapper - truncated when collapsed */}
              <div
                ref={textWrapperRef}
                style={computedTextWrapperStyle}>
                <MessageRenderer
                  content={msg.text || ''}
                  isDark={isDark}
                  isLight={isLight}
                />
              </div>

              {/* Show full text button - OUTSIDE text wrapper, ALWAYS visible */}
              {showExpandButton && !isUserBubbleExpanded && (
                <div
                  onClick={handleExpandBubble}
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    opacity: 0.8,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                  Show full text
                </div>
              )}
            </div>
          )}
          
          {/* File attachments - separate display for generated vs uploaded */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="hide-scrollbar" style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              width: '100%',
              paddingTop: '1rem',
              overflowX: 'auto',
              overflowY: 'hidden'
            }}>
              {msg.attachments.map((attachment, index) => {
                // Generated images display as large standalone images
                if (attachment.isGenerated && attachment.type && attachment.type.startsWith('image/')) {
                  return (
                    <div
                      key={index}
                      style={userAttachmentWrapperStyle}
                    >
                      <img
                        src={attachment.previewUrl || attachment.storageUrl}
                        alt={attachment.name}
                        decoding="async"
                        onClick={() => {
                          onPreviewImage({
                            url: attachment.previewUrl || attachment.storageUrl,
                            name: attachment.name
                          });
                        }}
                        style={imageStyle}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.02) translateZ(0)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1) translateZ(0)';
                        }}
                        onLoad={() => {
                          // Image loaded - scroll handled by useEffect
                        }}
                      />
                    </div>
                  );
                }
                
                // Upload attachments - smart viewer selection
                const viewerType = getViewerType(attachment.type, attachment.name);
                const isImage = attachment.type && attachment.type.startsWith('image/');
                
                return (
                <div
                  key={index}
                  onClick={() => {
                    // Route to appropriate viewer based on file type
                    if (viewerType === 'image') {
                      onPreviewImage({
                        url: attachment.previewUrl || attachment.storageUrl,
                        name: attachment.name
                      });
                    } else if (viewerType === 'pdf') {
                      // Use new secure PdfViewer (react-pdf) for uploaded PDFs
                      console.log('📄 [PDF] Opening uploaded PDF via PdfViewer:', attachment.name);
                      onPdfView({
                        url: attachment.storageUrl || attachment.previewUrl,
                        title: attachment.name,
                        filename: attachment.name
                      });
                    } else {
                      onDocumentView({
                        isOpen: true,
                        document: {
                          url: attachment.storageUrl || attachment.previewUrl,
                          name: attachment.name,
                          mimeType: attachment.type,
                          base64: attachment.base64
                        }
                      });
                    }
                  }}
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: 'white',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isImage ? (
                    /* Image thumbnail - 200x200 @2x retina, fill entire chip */
                    <img
                      src={attachment.thumbnailUrl || attachment.storageUrl}
                      alt={attachment.name}
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    /* Document preview */
                    <>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '12px',
                        textAlign: 'center',
                        padding: '8px',
                        wordBreak: 'break-word',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        {attachment.name}
                      </div>
                    </>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div
          style={computedBotContainerStyle}>
          <div style={botHeaderStyle}>
            <span style={botNameStyle}>
              <ChatOmniaLogo size={18} />
              Elora
            </span>
          </div>

          {/* 🎨 SHIMMER INDICATOR (BEFORE TEXT) - Show when shimmerText exists but no text content yet */}
          {msg.shimmerText && !msg.text && (
            <div style={{ paddingTop: '0.5rem' }}>
              <ShimmerText text={msg.shimmerText} />
            </div>
          )}

          {/* 📊 SUMMARY CARD - Show when message has summary metadata AND user wants to see it */}
          {showSummary && msg.hasMetadata && msg.metadata?.summaryContent && (
            <div style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', minHeight: '70px' }}>
              <SummaryCard
                summaryContent={msg.metadata.summaryContent}
                summarizedCount={msg.metadata.summarizedCount}
              />
            </div>
          )}

          {/* 📝 MESSAGE TEXT - Always show when text exists (removed !msg.shimmerText condition) */}
          {msg.text && (
            <MessageRenderer
              content={msg.text}
              isDark={isDark}
              isLight={isLight}
            />
          )}

          {/* 🎨 SHIMMER INDICATOR (AFTER TEXT) - Show below text when searching/generating */}
          {msg.shimmerText && msg.text && (
            <div style={{ paddingTop: '0.5rem' }}>
              <ShimmerText text={msg.shimmerText} />
            </div>
          )}
          
          {/* 🎨 GENERATED IMAGES - Display after text with loading skeleton */}
          {/* Image generation indicator - show before skeleton */}
          {msg.generatingImages && (
            <div style={{
              paddingTop: '1rem',
              paddingBottom: '1rem'
            }}>
              <div style={{
                background: isDark
                  ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.3) 75%)'
                  : isLight
                    ? 'linear-gradient(90deg, rgba(0, 0, 0, 0.3) 25%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.3) 75%)'
                    : 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.3) 75%)',
                backgroundSize: '200% 100%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontSize: '14px',
                fontWeight: '500',
                animation: 'shimmer-skeleton 2s infinite',
                display: 'inline-block'
              }}>
                Generating {msg.expectedImageCount || ''} image{(msg.expectedImageCount || 1) > 1 ? 's' : ''}...
              </div>
            </div>
          )}

          {/* Single image - use existing component */}
          {msg.image && !msg.images && <GeneratedImageWithSkeleton msg={msg} onPreviewImage={onPreviewImage} imageStyle={imageStyle} />}

          {/* Multiple images - use gallery component */}
          {msg.images && msg.images.length > 0 && <GeneratedImagesGallery msg={msg} onPreviewImage={onPreviewImage} imageStyle={imageStyle} />}

          {/* 📄 PDF VIEWER - Display view link for both generated and uploaded PDFs */}
          {msg.pdf && <PdfViewComponent msg={msg} onDocumentView={onDocumentView} isLight={isLight} />}
          {uploadedPdfData && (
            <PdfViewComponent
              msg={msg}
              isLight={isLight}
              onDocumentView={onDocumentView}
              uploadedPdfData={uploadedPdfData}
              onCloseUploadedPdf={handleClosePdf}
            />
          )}

          {/* 🎨 ARTIFACT VIEWER - Display interactive HTML artifacts */}
          {msg.artifact && <ArtifactViewComponent msg={msg} isLight={isLight} />}

          {/* 🔘 ACTION BUTTONS - Always reserve space to prevent Virtuoso height jumping */}
          <div style={{
            display: 'flex',
            gap: '0px',
            paddingTop: '1rem',
            justifyContent: 'flex-start',
            opacity: msg.isStreaming ? 0 : 1,
            pointerEvents: msg.isStreaming ? 'none' : 'auto',
            transition: 'opacity 0.3s ease'
          }}>
            <VoiceButton
              text={msg.text}
              onAudioStart={() => onAudioStateChange(true)}
              onAudioEnd={() => onAudioStateChange(false)}
              isDark={isDark}
              isLight={isLight}
            />
            <CopyButton
              text={msg.text}
              language={detectLanguage(msg.text)}
              isDark={isDark}
              isLight={isLight}
            />
            <SourcesButton
              sources={msg.sources || []}
              onClick={() => onSourcesClick(msg.sources || [])}
              language={detectLanguage(msg.text)}
              isDark={isDark}
              isLight={isLight}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 🎨 Generated Image with Loading Skeleton Component
const GeneratedImageWithSkeleton = ({ msg, onPreviewImage, imageStyle }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = msg.image.storageUrl || (msg.image.base64 ? `data:${msg.image.mimeType};base64,${msg.image.base64}` : msg.image);

  return (
    <div style={{
      paddingTop: '1rem',
      paddingBottom: '1rem',
      borderRadius: '12px',
      overflow: 'hidden',
      maxWidth: '100%'
    }}>
      {/* Loading Skeleton */}
      {!imageLoaded && (
        <div
          className="image-skeleton"
          style={{
            width: '100%',
            maxWidth: '280px',
            aspectRatio: '1/1',
            background: 'linear-gradient(90deg, rgba(200, 200, 200, 0.3) 25%, rgba(220, 220, 220, 0.4) 50%, rgba(200, 200, 200, 0.3) 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(120, 120, 120, 0.8)',
            fontSize: '14px',
            animation: 'shimmer-skeleton 2s infinite',
            boxSizing: 'border-box'
          }}>
          Loading image...
        </div>
      )}

      {/* Actual Image */}
      <img
        src={imageUrl}
        alt={`Generated image for: ${msg.text}`}
        decoding="async"
        onClick={() => {
          onPreviewImage({
            url: imageUrl,
            name: `Generated: ${msg.text.slice(0, 30)}...`
          });
        }}
        style={{
          ...imageStyle,
          width: '100%',
          maxWidth: '280px',
          aspectRatio: '1/1',
          objectFit: 'cover',
          display: imageLoaded ? 'block' : 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.02) translateZ(0)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1) translateZ(0)';
        }}
        onLoad={() => {
          setImageLoaded(true);
        }}
      />

    </div>
  );
};

// 📄 PDF View Component (for both generated and uploaded PDFs)
const PdfViewComponent = ({ msg, onDocumentView, uploadedPdfData = null, onCloseUploadedPdf = null, isLight = false }) => {
  const [showCleanPdf, setShowCleanPdf] = React.useState(false);
  const [pdfDataUrl, setPdfDataUrl] = React.useState('');
  const [longPressTimer, setLongPressTimer] = React.useState(null);

  // Determine if this is generated or uploaded PDF
  const isGeneratedPdf = !!msg.pdf;
  const isUploadedPdf = !!uploadedPdfData;

  const handleViewPdf = () => {
    if (isGeneratedPdf && msg.pdf) {
      console.log('🔍 [PDF-VIEWER] Opening generated PDF:', msg.pdf);

      // PDF object with fallback chain (like images)
      if (msg.pdf.storageUrl) {
        console.log('📄 [PDF-VIEWER] Using storage URL');
        setPdfDataUrl(msg.pdf.storageUrl);
        setShowCleanPdf(true);
      } else if (msg.pdf.base64) {
        console.log('📄 [PDF-VIEWER] Using base64 fallback');
        const dataUrl = `data:application/pdf;base64,${msg.pdf.base64}`;
        setPdfDataUrl(dataUrl);
        setShowCleanPdf(true);
      } else if (typeof msg.pdf === 'string') {
        // Backward compatibility: string URL format
        console.log('📄 [PDF-VIEWER] Using legacy string format');
        setPdfDataUrl(msg.pdf);
        setShowCleanPdf(true);
      } else {
        console.error('❌ [PDF-VIEWER] No PDF data available');
      }
    } else if (isUploadedPdf && uploadedPdfData) {
      console.log('📄 [PDF-VIEWER] Using uploaded PDF data');
      // Use uploaded PDF data directly
      const url = uploadedPdfData.url || uploadedPdfData.base64;
      setPdfDataUrl(url);
      setShowCleanPdf(true);
    }
  };

  const handleTouchStart = (e) => {
    // Start long press timer
    const timer = setTimeout(() => {
      // Long press detected - prepare for native context menu
      let dataUrl = null;
      let filename = 'document.pdf';

      if (isGeneratedPdf && msg.pdf && msg.pdf.base64) {
        // PDF base64 is already properly processed in App.jsx - use directly
        dataUrl = `data:application/pdf;base64,${msg.pdf.base64}`;
        filename = msg.pdf.filename || `${msg.pdf.title || 'document'}.pdf`;
      } else if (isUploadedPdf && uploadedPdfData) {
        dataUrl = uploadedPdfData.url || uploadedPdfData.base64;
        filename = uploadedPdfData.name || 'document.pdf';
      }

      if (dataUrl) {
        // Create invisible link for native context menu
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        document.body.appendChild(link);

        // Trigger context menu on the link
        const contextEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        });
        link.dispatchEvent(contextEvent);

        setTimeout(() => document.body.removeChild(link), 100);
      }
    }, 500); // 500ms for long press

    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div style={{
      paddingTop: '1rem',
      paddingBottom: '0.5rem'
    }}>
      <div
        onClick={handleViewPdf}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: isLight ? 'rgba(255, 107, 53, 0.15)' : 'rgba(59, 130, 246, 0.1)',
          border: isLight ? '1px solid rgba(255, 107, 53, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          maxWidth: '300px'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = isLight ? 'rgba(255, 107, 53, 0.25)' : 'rgba(59, 130, 246, 0.15)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = isLight ? 'rgba(255, 107, 53, 0.15)' : 'rgba(59, 130, 246, 0.1)';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        {/* PDF Icon */}
        <div style={{
          fontSize: '24px',
          color: isLight ? '#ff6b35' : '#3b82f6'
        }}>
          📄
        </div>

        {/* PDF Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: isLight ? '#000000' : '#fff',
            paddingBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '250px'
          }}>
            {(() => {
              const title = isGeneratedPdf ? (msg.pdf.title || 'Generated PDF') : (uploadedPdfData?.name || 'PDF Document');
              // Ensure .pdf suffix is visible even when truncated
              if (title.length > 40 && !title.endsWith('.pdf')) {
                return `${title.slice(0, 37)}....pdf`;
              }
              return title;
            })()}
          </div>
          <div style={{
            fontSize: '12px',
            color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
          }}>
            Click to view PDF
          </div>
        </div>

      </div>

      {/* Clean PDF Viewer */}
      <PdfViewer
        isOpen={showCleanPdf}
        onClose={() => {
          setShowCleanPdf(false);
          setPdfDataUrl(null); // 🧹 MEMORY: Clear data URL from state to free RAM
          if (isUploadedPdf && onCloseUploadedPdf) {
            onCloseUploadedPdf();
          }
        }}
        pdfData={{
          url: pdfDataUrl,
          title: isGeneratedPdf ? (msg.pdf.title || 'Generated PDF') : (uploadedPdfData?.name || 'PDF Document'),
          filename: isGeneratedPdf ? msg.pdf.filename : uploadedPdfData?.name
        }}
      />
    </div>
  );
};

// 🎨 Artifact View Component
const ArtifactViewComponent = ({ msg, isLight = false }) => {
  const [showFullScreen, setShowFullScreen] = React.useState(false);
  const [htmlContent, setHtmlContent] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('app'); // 'app' or 'code'

  if (!msg.artifact) return null;

  const handleOpenArtifact = async () => {
    setShowFullScreen(true);
    setLoading(true);

    try {
      // Fetch HTML from Supabase
      const response = await fetch(msg.artifact.storageUrl);
      let html = await response.text();

      // Remove CSP meta tags that might block inline styles/scripts
      html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*content=["'][^"']*Content-Security-Policy[^"']*["'][^>]*>/gi, '');

      setHtmlContent(html);
    } catch (error) {
      console.error('Failed to load artifact:', error);
      setHtmlContent('<html><body><h1>Failed to load artifact</h1></body></html>');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${msg.artifact.title.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      paddingTop: '1rem',
      paddingBottom: '0.5rem'
    }}>
      <div
        onClick={handleOpenArtifact}
        style={{
          backgroundColor: isLight ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.15)',
          border: isLight ? '1px solid rgba(147, 51, 234, 0.3)' : '1px solid rgba(147, 51, 234, 0.4)',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          maxWidth: '400px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isLight ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isLight ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.15)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Mini iframe preview */}
        <div style={{
          height: '200px',
          width: '100%',
          backgroundColor: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <iframe
            src={msg.artifact.storageUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              pointerEvents: 'none', // Disable interaction in preview
              transform: 'scale(1)',
              transformOrigin: 'top left'
            }}
            sandbox="allow-scripts allow-same-origin"
            title="Artifact Preview"
          />
          {/* Overlay to capture clicks */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3) 100%)'
          }} />
        </div>

        {/* Title bar */}
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>🎨</span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: isLight ? '#000' : '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {msg.artifact.title}
          </span>
        </div>
      </div>

      {/* Full screen modal with HTML loaded via srcdoc (bypasses CSP) */}
      {/* 🚀 PORTAL: Render modal at document.body to escape stacking context */}
      {showFullScreen && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header with controls - Minimal design like Claude.ai */}
          <div style={{
            height: '48px',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            position: 'relative'
          }}>
            {/* Left-aligned Title with ellipsis */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              flex: 1,
              overflow: 'hidden',
              marginRight: '120px'
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>🎨</span>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>{msg.artifact.title}</span>
            </div>

            {/* Controls - Absolute positioned on right */}
            <div style={{
              position: 'absolute',
              right: '16px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              {/* App/Code toggle - Icon only */}
              <button
                onClick={() => setViewMode(viewMode === 'app' ? 'code' : 'app')}
                title={viewMode === 'app' ? 'View Code' : 'View App'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                {viewMode === 'app' ? 'Code' : 'App'}
              </button>

              {/* Download button - Icon only */}
              <button
                onClick={handleDownload}
                disabled={!htmlContent}
                title="Download HTML"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  color: htmlContent ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                  fontSize: '18px',
                  cursor: htmlContent ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (htmlContent) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = htmlContent ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
                }}
              >
                ↓
              </button>

              {/* Close button */}
              <button
                onClick={() => setShowFullScreen(false)}
                title="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#fff',
                fontSize: '16px'
              }}>
                Loading artifact...
              </div>
            ) : htmlContent ? (
              viewMode === 'app' ? (
                <iframe
                  srcDoc={htmlContent}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads"
                  allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
                  title={msg.artifact.title}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'auto',
                  backgroundColor: '#1e1e1e',
                  padding: '20px'
                }}>
                  <pre style={{
                    margin: 0,
                    color: '#d4d4d4',
                    fontSize: '14px',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {htmlContent}
                  </pre>
                </div>
              )
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#fff',
                fontSize: '16px'
              }}>
                Click to load artifact
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// 🎨 Generated Images Gallery Component for Multiple Images
const GeneratedImagesGallery = ({ msg, onPreviewImage, imageStyle }) => {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const images = msg.images || [];
  const imageCount = images.length;

  const handleImageLoad = (index) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  const getGridStyle = () => {
    switch (imageCount) {
      case 2: return { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' };
      case 3: return { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' };
      case 4: return { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' };
      default: return { display: 'grid', gridTemplateColumns: '1fr', gap: '8px' };
    }
  };

  return (
    <div style={{
      paddingTop: '1rem',
      paddingBottom: '1rem',
      borderRadius: '12px',
      overflow: 'hidden',
      maxWidth: '100%'
    }}>
      <div style={{ ...getGridStyle(), maxWidth: '600px' }}>
        {images.map((image, index) => {
          const imageUrl = image.storageUrl || (image.base64 ? `data:${image.mimeType};base64,${image.base64}` : image);
          const isLoaded = loadedImages.has(index);

          return (
            <div key={index} style={{ position: 'relative', aspectRatio: '1/1' }}>
              {/* Loading Skeleton */}
              {!isLoaded && (
                <div
                  className="image-skeleton"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    background: 'linear-gradient(90deg, rgba(200, 200, 200, 0.3) 25%, rgba(220, 220, 220, 0.4) 50%, rgba(200, 200, 200, 0.3) 75%)',
                    backgroundSize: '200% 100%',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(120, 120, 120, 0.8)',
                    fontSize: '12px',
                    animation: 'shimmer-skeleton 2s infinite',
                    boxSizing: 'border-box'
                  }}>
                  {index + 1}
                </div>
              )}

              {/* Actual Image */}
              <img
                src={imageUrl}
                alt={`Generated image ${index + 1} for: ${msg.text}`}
                decoding="async"
                onClick={() => {
                  onPreviewImage({
                    url: imageUrl,
                    name: `Generated ${index + 1}: ${msg.text.slice(0, 30)}...`
                  });
                }}
                onLoad={() => handleImageLoad(index)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isLoaded ? 1 : 0,
                  ...imageStyle
                }}
                onError={(e) => {
                  console.error(`Failed to load image ${index + 1}:`, imageUrl);
                  handleImageLoad(index); // Remove skeleton even on error
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(MessageItem);
