/**
 * 🎯 MARKDOWN-AWARE CHUNKING FUNCTION
 * 
 * Backup copy from api/gemini.js for future frontend implementation
 * Intelligent chunking that preserves markdown structure integrity
 */

export function createMarkdownChunks(text) {
  if (!text) return [];
  
  const chunks = [];
  let currentPos = 0;
  
  while (currentPos < text.length) {
    let chunk = '';
    let nextPos = currentPos;
    
    // Check for different markdown patterns
    const remainingText = text.slice(currentPos);
    
    // 1. Code blocks (```) - complete block
    if (remainingText.startsWith('```')) {
      const endPos = remainingText.indexOf('```', 3);
      if (endPos > -1) {
        chunk = remainingText.slice(0, endPos + 3);
        nextPos = currentPos + chunk.length;
      } else {
        // Incomplete code block - take what we have
        chunk = remainingText;
        nextPos = text.length;
      }
    }
    // 2. Headers (complete line)
    else if (remainingText.match(/^#{1,6}\s/)) {
      const lineEnd = remainingText.indexOf('\n');
      chunk = lineEnd > -1 ? remainingText.slice(0, lineEnd + 1) : remainingText;
      nextPos = currentPos + chunk.length;
    }
    // 3. Blockquotes (>) - complete line
    else if (remainingText.match(/^>\s/)) {
      const lineEnd = remainingText.indexOf('\n');
      chunk = lineEnd > -1 ? remainingText.slice(0, lineEnd + 1) : remainingText;
      nextPos = currentPos + chunk.length;
    }
    // 4. Bullet point lines (complete with newline)
    else if (remainingText.match(/^[\s]*[•·∙‣⁃\*\-]\s+/)) {
      const lineEnd = remainingText.indexOf('\n');
      chunk = lineEnd > -1 ? remainingText.slice(0, lineEnd + 1) : remainingText;
      nextPos = currentPos + chunk.length;
    }
    // 5. Numbered list lines
    else if (remainingText.match(/^\s*\d+\.\s/)) {
      const lineEnd = remainingText.indexOf('\n');
      chunk = lineEnd > -1 ? remainingText.slice(0, lineEnd + 1) : remainingText;
      nextPos = currentPos + chunk.length;
    }
    // 6. Bold text (complete **text**)
    else if (remainingText.startsWith('**')) {
      const endPos = remainingText.indexOf('**', 2);
      if (endPos > -1) {
        chunk = remainingText.slice(0, endPos + 2) + ' ';
        nextPos = currentPos + chunk.length;
      } else {
        // Incomplete bold - take the rest as plain text
        chunk = remainingText;
        nextPos = text.length;
      }
    }
    // 7. Italic text with underscore (_text_)
    else if (remainingText.startsWith('_') && !remainingText.startsWith('__')) {
      const endPos = remainingText.indexOf('_', 1);
      if (endPos > -1) {
        chunk = remainingText.slice(0, endPos + 1) + ' ';
        nextPos = currentPos + chunk.length;
      } else {
        // Incomplete italic - take the rest as plain text
        chunk = remainingText;
        nextPos = text.length;
      }
    }
    // 8. Italic text with asterisk (*text*)
    else if (remainingText.startsWith('*') && !remainingText.startsWith('**')) {
      const endPos = remainingText.indexOf('*', 1);
      if (endPos > -1) {
        chunk = remainingText.slice(0, endPos + 1) + ' ';
        nextPos = currentPos + chunk.length;
      } else {
        // Incomplete italic - take the rest as plain text
        chunk = remainingText;
        nextPos = text.length;
      }
    }
    // 9. Inline code (complete `code`)
    else if (remainingText.startsWith('`') && !remainingText.startsWith('```')) {
      const endPos = remainingText.indexOf('`', 1);
      if (endPos > -1) {
        chunk = remainingText.slice(0, endPos + 1) + ' ';
        nextPos = currentPos + chunk.length;
      } else {
        // Incomplete code - take the rest as plain text
        chunk = remainingText;
        nextPos = text.length;
      }
    }
    // 10. Links [text](url)
    else if (remainingText.startsWith('[')) {
      const linkMatch = remainingText.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        chunk = linkMatch[0] + ' ';
        nextPos = currentPos + chunk.length;
      } else {
        // Not a complete link, treat as plain text
        chunk = remainingText;
        nextPos = text.length;
      }
    }
    // 11. Plain text: send everything remaining as one chunk
    else {
      chunk = remainingText;
      nextPos = text.length;
    }
    
    if (chunk) {
      chunks.push(chunk);
    }
    
    currentPos = nextPos;
    
    // Prevent infinite loop
    if (nextPos <= currentPos) {
      currentPos++;
    }
  }
  
  return chunks;
}