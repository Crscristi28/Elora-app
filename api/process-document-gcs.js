import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gcsUri, originalName } = req.body;

    if (!gcsUri || !originalName) {
      return res.status(400).json({ error: 'Missing required fields: gcsUri, originalName' });
    }

    console.log(`📄 [PROCESS-GCS] Processing document: ${originalName} from ${gcsUri}`);

    // Check if file is plain text format - handle directly
    if (isPlainTextFile(originalName)) {
      console.log('📝 [PROCESS-GCS] Detected plain text file - processing directly');
      const textResult = await processPlainTextFromGCS(gcsUri, originalName);
      return res.status(200).json(textResult);
    }

    console.log('🔍 [PROCESS-GCS] Using Google Document AI for non-text file');

    // Initialize services
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const client = new DocumentProcessorServiceClient({
      credentials: credentials,
      apiEndpoint: `${process.env.DOCUMENT_AI_LOCATION}-documentai.googleapis.com`
    });

    const storage = new Storage({
      credentials: credentials,
      projectId: credentials.project_id
    });

    const projectId = credentials.project_id;
    const location = process.env.DOCUMENT_AI_LOCATION;
    const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;

    // Construct processor path
    const name = client.processorPath(projectId, location, processorId);

    // Extract bucket and file path from GCS URI
    const gcsMatch = gcsUri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (!gcsMatch) {
      throw new Error('Invalid GCS URI format');
    }

    const bucketName = gcsMatch[1];
    const filePath = gcsMatch[2];

    // Read file from GCS
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const [fileContent] = await file.download();

    // Determine MIME type from file extension
    const mimeType = getMimeTypeFromFileName(originalName);

    // Create request for Document AI
    const request = {
      name: name,
      rawDocument: {
        content: fileContent.toString('base64'),
        mimeType: mimeType,
      },
    };

    console.log(`🤖 [PROCESS-GCS] Sending to Document AI (${mimeType})`);

    // Process document with Document AI
    const [result] = await client.processDocument(request);
    const { document } = result;

    console.log(`✅ [PROCESS-GCS] Document AI processed ${document.pages?.length || 0} pages`);

    // Save extracted text to GCS (optional - for caching)
    const timestamp = Date.now();
    const textFileName = `documents/processed/${timestamp}-${originalName}.txt`;
    const textFile = bucket.file(textFileName);
    
    await textFile.save(document.text || '', {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          originalName: originalName,
          originalGcsUri: gcsUri,
          processedAt: new Date().toISOString(),
          pageCount: document.pages ? document.pages.length.toString() : '0'
        }
      }
    });

    // Generate signed URL for text content
    const [textUrl] = await textFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Return results
    return res.status(200).json({
      success: true,
      extractedText: document.text || '',
      documentUrl: textUrl,
      originalPdfUrl: gcsUri, // Original file GCS URI
      fileName: textFileName,
      pageCount: document.pages ? document.pages.length : 0,
      preview: document.text ? document.text.substring(0, 200) + '...' : '',
      originalName: originalName,
      processingMethod: 'google-document-ai-gcs'
    });

  } catch (error) {
    console.error('❌ [PROCESS-GCS] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process document from GCS',
      message: error.message 
    });
  }
}

/**
 * Check if file is a plain text format based on filename
 */
function isPlainTextFile(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const textExtensions = [
    'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 
    'css', 'scss', 'html', 'htm', 'xml', 'yaml', 'yml',
    'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go',
    'sql', 'csv', 'log', 'config', 'ini', 'env'
  ];
  return textExtensions.includes(extension);
}

/**
 * Process plain text file directly from GCS
 */
async function processPlainTextFromGCS(gcsUri, originalName) {
  try {
    const startTime = Date.now();
    
    // Initialize Cloud Storage
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const storage = new Storage({
      credentials: credentials,
      projectId: credentials.project_id
    });

    // Extract bucket and file path from GCS URI
    const gcsMatch = gcsUri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (!gcsMatch) {
      throw new Error('Invalid GCS URI format');
    }

    const bucketName = gcsMatch[1];
    const filePath = gcsMatch[2];

    // Read file from GCS
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const [fileContent] = await file.download();
    const textContent = fileContent.toString('utf8');

    const duration = Date.now() - startTime;
    console.log(`✅ [PROCESS-GCS-TEXT] Processed ${originalName} in ${duration}ms, ${textContent.length} characters`);

    // Return format compatible with Document AI response
    return {
      success: true,
      extractedText: textContent,
      originalName: originalName,
      documentUrl: null,
      originalPdfUrl: gcsUri,
      processingMethod: 'direct-text-extraction-gcs',
      metadata: {
        fileName: originalName,
        fileSize: fileContent.length,
        extension: originalName.split('.').pop()?.toLowerCase(),
        characterCount: textContent.length,
        lineCount: textContent.split('\n').length,
        processedAt: new Date().toISOString(),
        processingDuration: duration
      }
    };

  } catch (error) {
    console.error('❌ [PROCESS-GCS-TEXT] Error:', error);
    throw error;
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromFileName(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'txt': 'text/plain',
    'rtf': 'application/rtf'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}