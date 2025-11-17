// 📝 TEXT PROCESSOR - Handle plain text file formats
// Processes text-based files that don't require Google Document AI

/**
 * Check if file is a plain text format
 * @param {File} file - File object to check
 * @returns {boolean} - True if file is plain text format
 */
export const isPlainTextFile = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const textExtensions = [
    'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 
    'css', 'scss', 'html', 'htm', 'xml', 'yaml', 'yml',
    'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go',
    'sql', 'csv', 'log', 'config', 'ini', 'env'
  ];
  
  return textExtensions.includes(extension) || 
         file.type.startsWith('text/') ||
         file.type === 'application/json' ||
         file.type === 'application/javascript';
};

/**
 * Extract text content from plain text file
 * @param {File} file - Text file to process
 * @returns {Promise<Object>} - Processed document data
 */
export const processPlainTextFile = async (file) => {
  const startTime = performance.now();
  
  try {
    console.log(`📝 [TEXT-PROCESSOR] Processing plain text file: ${file.name} (${Math.round(file.size/1024)}KB)`);
    
    // Read file content as text
    const textContent = await file.text();
    const duration = Math.round(performance.now() - startTime);
    
    console.log(`✅ [TEXT-PROCESSOR] Text extracted in ${duration}ms, ${textContent.length} characters`);
    
    // Return format compatible with Google Document AI response
    return {
      success: true,
      extractedText: textContent,
      originalName: file.name,
      documentUrl: null, // No URL for text files
      originalPdfUrl: null, // No PDF conversion needed
      fileType: 'text',
      processingMethod: 'direct-text-extraction',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extension: file.name.split('.').pop()?.toLowerCase(),
        characterCount: textContent.length,
        lineCount: textContent.split('\n').length,
        processedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ [TEXT-PROCESSOR] Error processing text file:', error);
    
    return {
      success: false,
      error: error.message,
      originalName: file.name,
      fileType: 'text',
      processingMethod: 'direct-text-extraction'
    };
  }
};

/**
 * Get human-readable file type description
 * @param {string} extension - File extension
 * @returns {string} - Readable description
 */
export const getFileTypeDescription = (extension) => {
  const descriptions = {
    'txt': 'Text Document',
    'md': 'Markdown Document', 
    'json': 'JSON Data',
    'js': 'JavaScript Code',
    'jsx': 'React Component',
    'ts': 'TypeScript Code',
    'tsx': 'TypeScript React Component',
    'css': 'Stylesheet',
    'scss': 'Sass Stylesheet',
    'html': 'HTML Document',
    'htm': 'HTML Document',
    'xml': 'XML Document',
    'yaml': 'YAML Configuration',
    'yml': 'YAML Configuration',
    'py': 'Python Code',
    'java': 'Java Code',
    'cpp': 'C++ Code',
    'c': 'C Code',
    'h': 'Header File',
    'php': 'PHP Code',
    'rb': 'Ruby Code',
    'go': 'Go Code',
    'sql': 'SQL Script',
    'csv': 'CSV Data',
    'log': 'Log File',
    'config': 'Configuration File',
    'ini': 'INI Configuration',
    'env': 'Environment Variables'
  };
  
  return descriptions[extension] || 'Text File';
};

// 🧪 DEVELOPMENT TESTING
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.textProcessor = {
    isPlainText: isPlainTextFile,
    process: processPlainTextFile,
    getDescription: getFileTypeDescription,
    
    // Test function
    test: async () => {
      // Create test text file
      const testContent = `// Test JavaScript file
function hello() {
  console.log('Hello from text processor!');
}

export default hello;`;
      
      const testFile = new File([testContent], 'test.js', { type: 'text/javascript' });
      
      console.log('🧪 [TEXT-PROCESSOR] Testing...');
      console.log('Is plain text:', isPlainTextFile(testFile));
      
      const result = await processPlainTextFile(testFile);
      console.log('Processing result:', result);
      
      return result;
    }
  };
  
  console.log('🧪 [TEXT-PROCESSOR] Dev tools loaded: textProcessor.test()');
}