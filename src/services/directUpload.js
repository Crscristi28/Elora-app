// Direct upload service for Google Cloud Storage
// Allows uploading files directly from browser to GCS, bypassing Vercel's 4.5MB limit

/**
 * Upload file directly to Google Cloud Storage using signed URL
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Upload result with file URLs
 */
export async function uploadDirectToGCS(file, onProgress = null) {
  try {
    // Step 1: Get signed upload URL from our API
    console.log(`📤 [DIRECT-UPLOAD] Getting upload URL for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const urlResponse = await fetch('/api/get-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size
      })
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json();
      throw new Error(error.message || 'Failed to get upload URL');
    }

    const { uploadUrl, downloadUrl, fileName, gcsUri, publicUrl, originalName } = await urlResponse.json();
    console.log(`✅ [DIRECT-UPLOAD] Got upload URL for GCS file: ${fileName}`);

    // Step 2: Upload file directly to GCS
    console.log(`⬆️ [DIRECT-UPLOAD] Starting direct upload to GCS...`);
    console.log(`📍 [DIRECT-UPLOAD] Upload URL: ${uploadUrl.substring(0, 100)}...`);
    
    const uploadResponse = await uploadWithProgress(uploadUrl, file, onProgress);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ [DIRECT-UPLOAD] Upload failed (${uploadResponse.status}): ${errorText}`);
      throw new Error(`Upload failed with status: ${uploadResponse.status} - ${errorText || uploadResponse.statusText}`);
    }

    console.log(`✅ [DIRECT-UPLOAD] File uploaded successfully to GCS`);

    // Return all the URLs and metadata
    return {
      success: true,
      fileName,
      originalName,
      gcsUri,        // gs:// format for Vertex AI
      publicUrl,     // https:// format for browser
      downloadUrl,   // Signed URL for downloading
      fileSize: file.size,
      fileType: file.type
    };

  } catch (error) {
    console.error('❌ [DIRECT-UPLOAD] Upload error:', error);
    throw error;
  }
}

/**
 * Upload file with progress tracking
 * @param {string} url - The signed upload URL
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Response>}
 */
async function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round(percentComplete)
          });
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      // Parse headers string into object
      const headersString = xhr.getAllResponseHeaders();
      const headersArray = headersString.trim().split('\r\n').map(line => {
        const parts = line.split(': ');
        return [parts[0], parts.slice(1).join(': ')];
      }).filter(([key]) => key);
      
      resolve(new Response(xhr.response, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers(headersArray)
      }));
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    // Start upload
    xhr.open('PUT', url);
    const contentType = file.type || 'application/octet-stream';
    console.log(`📤 [XHR-UPLOAD] Setting Content-Type: ${contentType}`);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

/**
 * Process document after it's uploaded to GCS
 * @param {string} gcsUri - The GCS URI (gs://) of the uploaded file
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} Processing result
 */
export async function processGCSDocument(gcsUri, originalName) {
  try {
    console.log(`🔄 [DIRECT-UPLOAD] Processing document from GCS: ${gcsUri}`);
    
    const response = await fetch('/api/process-document-gcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gcsUri,
        originalName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Document processing failed');
    }

    const result = await response.json();
    console.log(`✅ [DIRECT-UPLOAD] Document processed successfully`);
    
    return result;
  } catch (error) {
    console.error('❌ [DIRECT-UPLOAD] Processing error:', error);
    throw error;
  }
}

/**
 * Check if file should use direct upload (based on size)
 * @param {File} file - The file to check
 * @returns {boolean} True if should use direct upload
 */
export function shouldUseDirectUpload(file) {
  const DIRECT_UPLOAD_THRESHOLD = 3 * 1024 * 1024; // 3 MB (to be safe with Vercel's 4.5MB limit)
  return file.size > DIRECT_UPLOAD_THRESHOLD;
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}