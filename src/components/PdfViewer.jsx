// 📚 Direct PDF.js Viewer Component
// Using pdfjs-dist directly (no react-pdf wrapper) for better stability

import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfViewer = ({
  isOpen,
  onClose,
  pdfData, // { url, title, filename }
}) => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.0); // User zoom (CSS transform)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const RENDER_SCALE = 2.0; // High quality canvas rendering (fixed)

  // Load PDF document
  useEffect(() => {
    if (!isOpen || !pdfData?.url) return;

    console.log('📚 [PDF-VIEWER] Loading PDF:', pdfData.url);
    setLoading(true);
    setError(null);
    setPdf(null);
    setCurrentPage(1);
    setZoom(1.0);

    const loadingTask = pdfjsLib.getDocument(pdfData.url);

    loadingTask.promise
      .then((loadedPdf) => {
        console.log('✅ [PDF-VIEWER] PDF loaded, pages:', loadedPdf.numPages);
        setPdf(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ [PDF-VIEWER] Load error:', err);
        setError(err.message || 'Failed to load PDF');
        setLoading(false);
      });

    return () => {
      loadingTask.destroy();
    };
  }, [isOpen, pdfData?.url]);

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current || loading) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Cancel any pending render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    console.log('🎨 [PDF-VIEWER] Rendering page:', currentPage, 'render scale:', RENDER_SCALE);

    pdf.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);

      renderTaskRef.current.promise
        .then(() => {
          console.log('✅ [PDF-VIEWER] Page rendered successfully');
          renderTaskRef.current = null;
        })
        .catch((err) => {
          if (err.name === 'RenderingCancelledException') {
            console.log('⏭️ [PDF-VIEWER] Render cancelled (expected)');
          } else {
            console.error('❌ [PDF-VIEWER] Render error:', err);
          }
        });
    });
  }, [pdf, currentPage, loading]); // zoom is CSS only, doesn't affect render

  if (!isOpen) return null;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = pdfData.url;
      link.download = pdfData.filename || `${pdfData.title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ [PDF-VIEWER] Download failed:', error);
    }
  };

  const modalBody = () => (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onClick={onClose}
    >
      {/* Header - compact for mobile */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.25rem',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 10000
        }}
      >
        {/* Page navigation */}
        {numPages > 0 && (
          <>
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                color: 'white',
                padding: '8px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage <= 1 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={12} />
            </button>

            <div style={{
              color: 'white',
              fontSize: '13px',
              padding: '0 4px',
              minWidth: '50px',
              textAlign: 'center'
            }}>
              {currentPage}/{numPages}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                color: 'white',
                padding: '8px',
                cursor: currentPage >= numPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage >= numPages ? 0.5 : 1
              }}
            >
              <ChevronRight size={12} />
            </button>
          </>
        )}

        {/* Zoom controls */}
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '8px',
            cursor: zoom <= 0.5 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: zoom <= 0.5 ? 0.5 : 1
          }}
        >
          <ZoomOut size={12} />
        </button>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3.0}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '8px',
            cursor: zoom >= 3.0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: zoom >= 3.0 ? 0.5 : 1
          }}
        >
          <ZoomIn size={12} />
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <Download size={12} />
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* PDF Canvas */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem',
          backgroundColor: 'rgba(128, 128, 128, 0.2)'
        }}
      >
        {loading && (
          <div style={{
            color: 'white',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Loading PDF...
          </div>
        )}

        {error && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}
          />
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalBody(), document.body);
};

export default PdfViewer;
