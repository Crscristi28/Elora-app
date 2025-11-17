import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import '@uiw/react-md-editor/markdown-editor.css';
import 'katex/dist/katex.css';

// Import YouTube utilities and component
import { findYouTubeUrls } from '../utils/youtube';
import { YouTubeEmbed } from './ui';

// Error boundary for MDEditor crashes during streaming
class MarkdownErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('MDEditor render error (likely incomplete markdown during streaming):', error);
  }

  componentDidUpdate(prevProps) {
    // Reset error state when content changes (streaming continues)
    if (this.state.hasError && prevProps.fallback !== this.props.fallback) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      // During streaming, show raw text if markdown fails
      return <div style={{ whiteSpace: 'pre-wrap' }}>{this.props.fallback}</div>;
    }
    return this.props.children;
  }
}


// Aggressive preprocessing for better visual during streaming
const preprocessStreamingText = (text) => {
  if (!text) return '';

  // More comprehensive replacements
  let processed = text
    // Bullets
    .replace(/^[\s]*[•·∙‣⁃]\s*/gm, '• ')  // Normalize all bullet types
    .replace(/\n[\s]*[•·∙‣⁃]\s*/g, '\n• ')
    .replace(/^[\s]*[*-]\s+/gm, '• ')     // Convert * and - to bullets
    .replace(/\n[\s]*[*-]\s+/g, '\n• ')
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '$1')      // Remove bold markers
    // Headers (temporary removal)
    .replace(/^#{1,6}\s+/gm, '')          // Remove header markers
    // Code blocks (temporary simplification)
    .replace(/```[\s\S]*?```/g, '[Code block]')
    .replace(/`([^`]+)`/g, '$1');         // Remove inline code markers

  return processed;
};

/**
 * Parse content into segments - text and YouTube embeds
 * @param {string} content - Message content
 * @returns {Array} - Array of {type: 'text'|'youtube', content: string, videoId?: string}
 */
const parseContentSegments = (content) => {
  if (!content) return [{ type: 'text', content: '' }];
  
  const youtubeUrls = findYouTubeUrls(content);
  if (youtubeUrls.length === 0) {
    return [{ type: 'text', content }];
  }
  
  const segments = [];
  let lastIndex = 0;
  
  youtubeUrls.forEach((match) => {
    // Add text before YouTube URL
    if (match.startIndex > lastIndex) {
      const textContent = content.slice(lastIndex, match.startIndex);
      if (textContent.trim()) {
        segments.push({ type: 'text', content: textContent });
      }
    }
    
    // Add YouTube embed
    segments.push({ 
      type: 'youtube', 
      content: match.url,
      videoId: match.videoId 
    });
    
    lastIndex = match.endIndex;
  });
  
  // Add remaining text after last YouTube URL
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex);
    if (textContent.trim()) {
      segments.push({ type: 'text', content: textContent });
    }
  }
  
  return segments;
};

const MessageRenderer = ({ content, className = "text-white", isStreaming = false, isDark = false, isLight = false }) => {
  // TEMPORARILY DISABLED: Transition causes scroll jumping with Virtuoso
  // const [isTransitioning, setIsTransitioning] = React.useState(false);
  // const prevStreamingRef = React.useRef(isStreaming);

  // // Detect transition from streaming to final
  // React.useEffect(() => {
  //   if (prevStreamingRef.current && !isStreaming) {
  //     setIsTransitioning(true);
  //     const timer = setTimeout(() => setIsTransitioning(false), 300);
  //     return () => clearTimeout(timer);
  //   }
  //   prevStreamingRef.current = isStreaming;
  // }, [isStreaming]);

  // Parse content into segments for YouTube embed support
  const segments = React.useMemo(() => {
    return parseContentSegments(content);
  }, [content]);

  // Unified rendering - same for streaming and final
  // Text color logic: Dark mode → white, Light-test → black, Light → white
  const textColor = isDark ? '#ffffff' : (isLight ? '#000000' : '#ffffff');

  // Bold text color logic: Dark → white, Light-test → black, Light → yellow
  const boldColor = isDark ? '#ffffff' : (isLight ? '#000000' : '#facc15');

  // Color mode for MDEditor: Always dark for code blocks (best readability)
  const colorMode = 'dark';

  return (
    <div className={className} style={{ color: textColor }} data-color-mode={colorMode}>
      <div className={`markdown-container ${isStreaming ? 'is-streaming' : ''}`} data-color-mode={colorMode}>
        {segments.map((segment, index) => (
          segment.type === 'youtube' ? (
            <YouTubeEmbed
              key={`youtube-${index}-${segment.videoId}`}
              videoId={segment.videoId}
              title="YouTube video"
            />
          ) : (
            <MarkdownErrorBoundary key={`boundary-${index}`} fallback={segment.content}>
              <MDEditor.Markdown
                key={`text-${index}`}
                source={segment.content}
                style={{
                  backgroundColor: 'transparent',
                  color: 'inherit'
                }}
                data-color-mode={colorMode}
                remarkPlugins={[
                  [remarkMath, { singleDollarTextMath: true }], // Enable inline math with $ and display math with $$
                  remarkGfm
                ]}
                rehypePlugins={[rehypeKatex]}
              />
            </MarkdownErrorBoundary>
          )
        ))}
      </div>

      <style>{`
        /* Bold text styling with GPU acceleration to prevent rendering artifacts */
        .markdown-container strong,
        .markdown-container .w-md-editor-text strong,
        .markdown-container .w-md-editor-text b,
        .w-md-editor-text strong,
        .w-md-editor-text b {
          color: ${boldColor} !important;
          font-weight: bold !important;
          /* GPU acceleration for smooth bold text rendering */
          transform: translateZ(0);
          will-change: auto;
          backface-visibility: hidden;
          /* Prevent text measurement artifacts during streaming */
          contain: layout style;
          /* Force consistent rendering */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Enhanced GPU acceleration for bold text during streaming */
        .markdown-container.is-streaming strong,
        .markdown-container.is-streaming .w-md-editor-text strong,
        .markdown-container.is-streaming .w-md-editor-text b {
          will-change: transform, opacity !important;
        }
        
        /* List styling - CONSISTENT and STABLE formatting */
        .markdown-container .w-md-editor-text ul,
        .markdown-container .w-md-editor-text ol {
          padding: 0.75rem 0 0.75rem 1.5rem;
          list-style-position: inside;
        }
        .markdown-container .w-md-editor-text li {
          padding: 0 0.25rem 0.5rem 0.25rem;
          line-height: 1.6;
        }
        .markdown-container .w-md-editor-text ul li {
          list-style-type: disc; /* Level 1: plný kruh ● */
        }
        .markdown-container .w-md-editor-text ul ul li {
          list-style-type: circle; /* Level 2: prázdný kruh ○ */
        }
        .markdown-container .w-md-editor-text ul ul ul li {
          list-style-type: square; /* Level 3: čtvereček ■ */
        }
        .markdown-container .w-md-editor-text ol li {
          list-style-type: decimal;
        }
        /* Ensure bullets are properly sized and positioned */
        .markdown-container .w-md-editor-text ul li::marker {
          font-size: 1em;
          color: inherit;
        }
        .markdown-container .w-md-editor-text ol li::marker {
          font-size: 1em;
          color: inherit;
          font-weight: normal;
        }
        /* Nested lists */
        .markdown-container .w-md-editor-text ul ul,
        .markdown-container .w-md-editor-text ol ol,
        .markdown-container .w-md-editor-text ul ol,
        .markdown-container .w-md-editor-text ol ul {
          padding: 0.5rem 0 0.5rem 1.25rem;
        }
        
        /* Paragraph styling - STABLE formatting */
        .markdown-container .w-md-editor-text p {
          line-height: 1.5;
          padding: 0.5rem 0;
        }
        .markdown-container .w-md-editor-text p:first-child {
          padding-top: 0;
        }
        .markdown-container .w-md-editor-text p:last-child {
          padding-bottom: 0;
        }
        
        /* Container stability - prevent layout shifts + GPU acceleration */
        .markdown-container {
          min-height: 1.5em;
          overflow-wrap: break-word;
          word-wrap: break-word;
          /* GPU acceleration for smooth rendering */
          transform: translateZ(0);
          backface-visibility: hidden;
          /* Text rendering optimization */
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          /* Safari font synthesis fix - prevent fake bold rendering */
          font-synthesis: none;
        }

        /* GPU acceleration only during streaming - prevent memory leaks */
        .markdown-container.is-streaming {
          will-change: transform;
        }

        /* Hide HR elements during streaming to prevent flickering separators */
        .markdown-container.is-streaming .w-md-editor-text hr,
        .markdown-container.is-streaming .wmde-markdown hr {
          display: none !important;
        }

        /* Clean up GPU resources after streaming */
        .markdown-container:not(.is-streaming) {
          will-change: auto;
        }
        
        /* List and paragraph spacing coordination */
        .markdown-container .w-md-editor-text p + ul,
        .markdown-container .w-md-editor-text p + ol {
          padding-top: 0.25rem;
        }
        .markdown-container .w-md-editor-text ul + p,
        .markdown-container .w-md-editor-text ol + p {
          padding-top: 0.5rem;
        }
        
        /* Code block styling - Seamless with app background */
        .markdown-container pre,
        .markdown-container .w-md-editor-text pre,
        .w-md-editor-text-pre .wmde-markdown pre,
        .wmde-markdown pre,
        [data-color-mode="light"] pre,
        [data-color-mode="dark"] pre {
          background-color: ${isLight ? '#F5F5F5' : '#1a1a1a'} !important;
          border: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'} !important;
          border-radius: 6px !important;
          padding: 1rem !important;
          color: ${isLight ? '#24292e' : '#f3f4f6'} !important;
        }
        .markdown-container code,
        .markdown-container .w-md-editor-text code,
        .wmde-markdown code,
        [data-color-mode="light"] code,
        [data-color-mode="dark"] code {
          background-color: ${isLight ? '#EBEBEB' : '#2a2a2a'} !important;
          color: ${isLight ? '#24292e' : '#f3f4f6'} !important;
          padding: 0.2em 0.4em !important;
          border-radius: 3px !important;
        }
        .markdown-container pre code,
        .markdown-container .w-md-editor-text pre code,
        .wmde-markdown pre code,
        [data-color-mode="light"] pre code,
        [data-color-mode="dark"] pre code {
          background-color: transparent !important;
          color: ${isLight ? '#24292e' : '#f3f4f6'} !important;
          padding: 0 !important;
        }

        /* Force override MDEditor's light mode */
        [data-color-mode="light"] .markdown-container * {
          color-scheme: dark !important;
        }
        
        /* Syntax highlighting colors - GitHub Light theme */
        .markdown-container .token.keyword,
        [data-color-mode="light"] .token.keyword {
          color: ${isLight ? '#d73a49' : '#f97316'} !important; /* Red - keywords (return, const, if) */
        }
        .markdown-container .token.string,
        [data-color-mode="light"] .token.string {
          color: ${isLight ? '#005cc5' : '#84cc16'} !important; /* Blue - strings */
        }
        .markdown-container .token.number,
        [data-color-mode="light"] .token.number {
          color: ${isLight ? '#b31d28' : '#06b6d4'} !important; /* Red-brown - numbers */
        }
        .markdown-container .token.comment,
        [data-color-mode="light"] .token.comment {
          color: ${isLight ? '#6a737d' : '#94a3b8'} !important; /* Gray-green - comments */
        }
        .markdown-container .token.function,
        [data-color-mode="light"] .token.function {
          color: ${isLight ? '#6f42c1' : '#fbbf24'} !important; /* Purple - functions */
        }
        .markdown-container .token.operator,
        .markdown-container .token.boolean,
        [data-color-mode="light"] .token.operator,
        [data-color-mode="light"] .token.boolean {
          color: ${isLight ? '#e36209' : '#e5e7eb'} !important; /* Orange - operators, booleans */
        }
        .markdown-container .token.punctuation,
        [data-color-mode="light"] .token.punctuation {
          color: ${isLight ? '#24292e' : '#e5e7eb'} !important; /* Dark gray - punctuation */
        }

        /* Catch-all for any uncolored tokens in light mode - force dark gray */
        .markdown-container .wmde-markdown code *,
        .markdown-container .w-md-editor-text code *,
        [data-color-mode="light"] .wmde-markdown code *,
        [data-color-mode="light"] .w-md-editor-text code * {
          color: ${isLight ? '#24292e' : 'inherit'} !important;
        }

        /* Additional token types - GitHub Light theme */
        .markdown-container .token.property,
        .markdown-container .token.attr-name,
        [data-color-mode="light"] .token.property,
        [data-color-mode="light"] .token.attr-name {
          color: ${isLight ? '#24292e' : '#84cc16'} !important; /* Dark gray - properties/attributes */
        }
        .markdown-container .token.tag,
        [data-color-mode="light"] .token.tag {
          color: ${isLight ? '#22863a' : '#84cc16'} !important; /* Green - HTML tags */
        }
        .markdown-container .token.attr-value,
        [data-color-mode="light"] .token.attr-value {
          color: ${isLight ? '#005cc5' : '#84cc16'} !important; /* Blue - attribute values */
        }
        .markdown-container .token.class-name,
        .markdown-container .token.maybe-class-name,
        [data-color-mode="light"] .token.class-name,
        [data-color-mode="light"] .token.maybe-class-name {
          color: ${isLight ? '#005cc5' : '#fbbf24'} !important; /* Blue - class names/components */
        }
        .markdown-container .token.constant,
        [data-color-mode="light"] .token.constant {
          color: ${isLight ? '#b31d28' : '#06b6d4'} !important; /* Red-brown - constants */
        }
        .markdown-container .token.unit,
        [data-color-mode="light"] .token.unit {
          color: ${isLight ? '#22863a' : '#84cc16'} !important; /* Green - CSS units (px, em) */
        }
        .markdown-container .token.variable,
        .markdown-container .token.parameter,
        [data-color-mode="light"] .token.variable,
        [data-color-mode="light"] .token.parameter {
          color: ${isLight ? '#e36209' : '#e5e7eb'} !important; /* Orange - variables/parameters */
        }

        /* Disable text selection during streaming to prevent blue line artifact */
        .markdown-container.is-streaming {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }

        /* Ensure selection is enabled after streaming completes */
        .markdown-container:not(.is-streaming) {
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
        }

        /* TABLE STYLING - ChatGPT style (horizontal dividers only, no vertical borders) */
        /* ULTRA AGGRESSIVE - override ALL MDEditor defaults */

        /* FORCE transparent background on ALL table elements + horizontal scroll on table only */
        .markdown-container table,
        .markdown-container .w-md-editor-text table,
        .markdown-container .wmde-markdown table,
        .markdown-container .w-md-editor-text-pre table,
        .w-md-editor-text table,
        .wmde-markdown table,
        [data-color-mode="dark"] table,
        [data-color-mode="light"] table {
          display: block !important;
          width: max-content !important;
          margin: 1rem 0 !important;
          border-collapse: collapse !important;
          background-color: transparent !important;
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }

        /* FORCE NO borders and transparent background on ALL cells */
        .markdown-container table th,
        .markdown-container table td,
        .markdown-container .w-md-editor-text table th,
        .markdown-container .w-md-editor-text table td,
        .markdown-container .wmde-markdown table th,
        .markdown-container .wmde-markdown table td,
        .w-md-editor-text table th,
        .w-md-editor-text table td,
        .wmde-markdown table th,
        .wmde-markdown table td,
        [data-color-mode="dark"] table th,
        [data-color-mode="dark"] table td,
        [data-color-mode="light"] table th,
        [data-color-mode="light"] table td {
          border: none !important;
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          padding: 6px 12px !important;
          text-align: left !important;
          vertical-align: top !important;
          background-color: transparent !important;
          background: none !important;
          color: ${textColor} !important;
          white-space: normal !important;
          word-wrap: break-word !important;
          min-width: 200px !important;
          max-width: 400px !important;
          box-shadow: none !important;
        }

        /* FORCE horizontal dividers only on rows */
        .markdown-container table tr,
        .markdown-container .w-md-editor-text table tr,
        .markdown-container .wmde-markdown table tr,
        .w-md-editor-text table tr,
        .wmde-markdown table tr,
        [data-color-mode="dark"] table tr,
        [data-color-mode="light"] table tr {
          border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} !important;
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          background-color: transparent !important;
          background: none !important;
        }

        /* FORCE thicker border on header */
        .markdown-container table thead th,
        .markdown-container .w-md-editor-text table thead th,
        .markdown-container .wmde-markdown table thead th,
        .w-md-editor-text table thead th,
        .wmde-markdown table thead th,
        [data-color-mode="dark"] table thead th,
        [data-color-mode="light"] table thead th {
          font-weight: 600 !important;
          border-bottom: 2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} !important;
        }

        /* Alternate row background - very subtle */
        .markdown-container table tbody tr:nth-child(even),
        .markdown-container .w-md-editor-text table tbody tr:nth-child(even),
        .markdown-container .wmde-markdown table tbody tr:nth-child(even),
        .w-md-editor-text table tbody tr:nth-child(even),
        .wmde-markdown table tbody tr:nth-child(even) {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'} !important;
        }
      `}</style>
    </div>
  );
};


export default React.memo(MessageRenderer);