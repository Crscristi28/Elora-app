/**
 * 📄 Document Viewer Component
 * 
 * Universal document viewer for PDF, text, Word documents
 * Supports multiple formats with appropriate viewers
 */

import React, { useState, useEffect } from 'react';
import { X, Download, FileText, File } from 'lucide-react';

const DocumentViewer = ({ 
  isOpen, 
  onClose, 
  document, // { url, name, mimeType, base64 }
  uiLanguage = 'cs'
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI texts
  const texts = {
    cs: {
      loading: 'Načítám dokument...',
      error: 'Document loading error',
      download: 'Stáhnout',
      close: 'Zavřít'
    },
    en: {
      loading: 'Loading document...',
      error: 'Error loading document',
      download: 'Download',
      close: 'Close'
    },
    ro: {
      loading: 'Se încarcă documentul...',
      error: 'Eroare la încărcarea documentului',
      download: 'Descarcă',
      close: 'Închide'
    }
  };

  const t = texts[uiLanguage] || texts.cs;

  // Detect file type
  const getFileType = (mimeType, name) => {
    if (!mimeType && name) {
      const ext = name.toLowerCase().split('.').pop();
      if (['pdf'].includes(ext)) return 'pdf';
      if (['txt', 'md', 'text'].includes(ext)) return 'text';
      if (['doc', 'docx'].includes(ext)) return 'word';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    }
    
    if (mimeType) {
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('text')) return 'text';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
      if (mimeType.includes('image')) return 'image';
    }
    
    return 'unknown';
  };

  // Download handler
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = document.url || document.base64;
      link.download = document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Load document content
  useEffect(() => {
    if (!isOpen || !document) return;

    setLoading(true);
    setError(null);

    const fileType = getFileType(document.mimeType, document.name);

    try {
      switch (fileType) {
        case 'text':
          // Decode base64 text
          if (document.base64 && document.base64.startsWith('data:')) {
            const base64Data = document.base64.split(',')[1];
            const decodedText = atob(base64Data);
            setContent(decodedText);
          } else {
            setContent('Text content not available');
          }
          break;

        case 'pdf':
          // Use native browser PDF viewer via iframe
          setContent('PDF_IFRAME');
          break;

        case 'word':
          // For Word documents, show info that it needs to be downloaded
          setContent('WORD_DOWNLOAD');
          break;

        default:
          setContent('UNSUPPORTED');
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isOpen, document]);

  if (!isOpen) return null;

  const fileType = getFileType(document?.mimeType, document?.name);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease',
        transform: 'translateZ(0)',
      }}
    >
      {/* Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 10000,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'white',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {fileType === 'pdf' && <FileText size={20} />}
          {fileType === 'text' && <FileText size={20} />}
          {fileType !== 'pdf' && fileType !== 'text' && <File size={20} />}
          <span>{document?.name || 'Document'}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <Download size={16} />
            {t.download}
          </button>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'white',
            fontSize: '16px'
          }}>
            {t.loading}
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: '#ff6b6b',
            fontSize: '16px'
          }}>
            {t.error}: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Text content */}
            {fileType === 'text' && content !== 'UNSUPPORTED' && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#333',
                padding: '2rem',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                overflow: 'auto'
              }}>
                {content}
              </div>
            )}

            {/* PDF iframe viewer */}
            {fileType === 'pdf' && content === 'PDF_IFRAME' && (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <iframe
                  src={document.url || document.base64}
                  title={document.name || 'PDF Document'}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: 'white',
                    overflow: 'auto'
                  }}
                />
              </div>
            )}

            {/* Word document info */}
            {fileType === 'word' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '1rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <File size={64} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '18px' }}>
                    Word Document
                  </h3>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
                    Click download to view this document
                  </p>
                </div>
              </div>
            )}

            {/* Unsupported format */}
            {content === 'UNSUPPORTED' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '1rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <File size={64} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '18px' }}>
                    Unsupported Format
                  </h3>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
                    Click download to view this file
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;