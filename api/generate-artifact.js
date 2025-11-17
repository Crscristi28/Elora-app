// 🎨 Artifact Generation API - Return HTML content (frontend uploads like PDF)
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, html_content, artifact_type = 'app' } = req.body;

    if (!title || !html_content) {
      return res.status(400).json({ error: 'Title and html_content are required' });
    }

    console.log('🎨 [ARTIFACT] Generating artifact:', { title, type: artifact_type });
    console.log('📄 [ARTIFACT] HTML content size:', html_content.length, 'chars');

    // Return HTML as base64 (like PDF does)
    const base64Html = Buffer.from(html_content, 'utf-8').toString('base64');
    const timestamp = Date.now();
    const filename = `artifact-${timestamp}-${title.replace(/[^a-z0-9]/gi, '_')}.html`;

    console.log('✅ [ARTIFACT] Artifact generated:', title);

    return res.status(200).json({
      success: true,
      title,
      filename,
      base64: base64Html,
      timestamp,
      artifact_type
    });

  } catch (error) {
    console.error('❌ [ARTIFACT] Generation error:', error);
    return res.status(500).json({
      error: 'Artifact generation failed',
      message: error.message
    });
  }
}
