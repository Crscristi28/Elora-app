export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfUrl, originalName } = req.body;
  console.log('🔍 Received pdfUrl:', pdfUrl);

  if (!pdfUrl) {
    return res.status(400).json({ error: 'PDF URL is required' });
  }

  try {
    let gcsUri;
    
    // Handle both gs:// and https:// URL formats
    if (pdfUrl.startsWith('gs://')) {
      // Already in GCS format (from direct upload)
      gcsUri = pdfUrl;
      console.log('✅ Already in GCS format:', gcsUri);
    } else if (pdfUrl.includes('storage.googleapis.com')) {
      // Convert HTTPS URL to GCS format (from traditional upload)
      const urlParts = pdfUrl.split('?')[0]; // Remove query parameters
      const pathMatch = urlParts.match(/storage\.googleapis\.com\/([^\/]+)\/(.+)$/);
      
      if (!pathMatch) {
        throw new Error('Invalid HTTPS Cloud Storage URL format');
      }
      
      const bucket = pathMatch[1];
      const filePath = pathMatch[2];
      gcsUri = `gs://${bucket}/${filePath}`;
      console.log('🔄 Converted HTTPS to GCS format:', gcsUri);
    } else {
      throw new Error('Unsupported URL format. Expected gs:// or https://storage.googleapis.com/');
    }
    
    console.log('Vertex AI will use Cloud Storage file:', gcsUri);
    console.log('🎯 Returning gcsUri:', gcsUri);

    // Vertex AI může číst přímo z Cloud Storage!
    // Nemusíme nic uploadovat
    
    return res.status(200).json({
      success: true,
      fileUri: gcsUri, // gs:// format pro Vertex AI
      fileName: originalName
    });

  } catch (error) {
    console.error('Cloud Storage URI error:', error);
    return res.status(500).json({ 
      error: 'Failed to process Cloud Storage URI',
      message: error.message 
    });
  }
}