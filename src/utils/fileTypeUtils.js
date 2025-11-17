/**
 * 📁 File Type Detection Utilities
 * 
 * Helper functions for detecting and categorizing file types
 */

// 🔍 Detect file type from MIME type and filename
export const getFileType = (mimeType, fileName) => {
  // First try by file extension
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'image';
    }
    
    // PDF
    if (ext === 'pdf') {
      return 'pdf';
    }
    
    // Text files
    if (['txt', 'md', 'markdown', 'text'].includes(ext)) {
      return 'text';
    }
    
    // Word documents
    if (['doc', 'docx'].includes(ext)) {
      return 'word';
    }
    
    // Other document types
    if (['rtf', 'odt'].includes(ext)) {
      return 'document';
    }
    
    // Spreadsheets
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return 'spreadsheet';
    }
    
    // Presentations
    if (['ppt', 'pptx'].includes(ext)) {
      return 'presentation';
    }
  }
  
  // Fallback to MIME type
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('text')) return 'text';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  }
  
  return 'unknown';
};

// 🖼️ Check if file is an image
export const isImageFile = (mimeType, fileName) => {
  return getFileType(mimeType, fileName) === 'image';
};

// 📄 Check if file is a document (non-image)
export const isDocumentFile = (mimeType, fileName) => {
  const type = getFileType(mimeType, fileName);
  return type !== 'image' && type !== 'unknown';
};

// 📝 Check if file can be viewed inline
export const canViewInline = (mimeType, fileName) => {
  const type = getFileType(mimeType, fileName);
  return ['image', 'pdf', 'text'].includes(type);
};

// 🎨 Get file icon based on type
export const getFileIcon = (mimeType, fileName) => {
  const type = getFileType(mimeType, fileName);
  
  switch (type) {
    case 'image': return '🖼️';
    case 'pdf': return '📄';
    case 'text': return '📝';
    case 'word': return '📘';
    case 'spreadsheet': return '📊';
    case 'presentation': return '📈';
    default: return '📎';
  }
};

// 🎯 Get appropriate viewer for file type
export const getViewerType = (mimeType, fileName) => {
  const type = getFileType(mimeType, fileName);
  
  switch (type) {
    case 'image': return 'image';
    case 'pdf': return 'pdf';
    case 'text': return 'text';
    case 'word':
    case 'spreadsheet':
    case 'presentation':
    case 'document':
      return 'document';
    default: return 'download';
  }
};