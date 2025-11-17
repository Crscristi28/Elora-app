// Upload file to Claude Files API via Supabase URL
// Streams file from Supabase → Claude Files API
// Returns file_id for use in Messages API

import axios from 'axios';
import FormData from 'form-data';

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

  const { supabaseUrl, fileName, mimeType } = req.body;

  if (!supabaseUrl || !fileName || !mimeType) {
    return res.status(400).json({
      error: 'Missing required fields: supabaseUrl, fileName, mimeType'
    });
  }

  console.log('📤 [CLAUDE-FILES-API] Starting upload:', fileName);

  try {
    // Step 1: Download file from Supabase
    console.log('⬇️ [CLAUDE-FILES-API] Downloading from Supabase:', supabaseUrl);
    const fileResponse = await fetch(supabaseUrl);

    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch from Supabase: ${fileResponse.status}`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ [CLAUDE-FILES-API] Downloaded:', buffer.length, 'bytes');

    // Step 2: Prepare FormData for Claude Files API (form-data package)
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: fileName,
      contentType: mimeType
    });

    // Step 3: Upload to Claude Files API using AXIOS
    console.log('⬆️ [CLAUDE-FILES-API] Uploading to Anthropic with axios...');

    const response = await axios.post(
      'https://api.anthropic.com/v1/files',
      formData,
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14',
          ...formData.getHeaders()  // Axios correctly handles boundary
        }
      }
    );

    const data = response.data;
    console.log('✅ [CLAUDE-FILES-API] Upload successful! file_id:', data.id);

    return res.json({
      fileId: data.id,
      fileName: data.filename,
      mimeType: data.mime_type,
      sizeBytes: data.size_bytes
    });

  } catch (error) {
    console.error('💥 [CLAUDE-FILES-API] Upload error:', error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data?.error?.message || error.message,
      details: 'Failed to upload to Claude Files API',
      anthropicError: error.response?.data
    });
  }
}
