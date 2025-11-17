// api/imagen.js - IMAGEN 4.0 FOR OMNIA
// 🎨 Image generation using Google Cloud Vertex AI Imagen 4.0

export default async function handler(req, res) {
  // CORS headers - same as gemini.js
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, imageCount = 1 } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Check for required environment variables - same as gemini.js
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return res.status(500).json({ error: 'Google Cloud credentials are incomplete' });
    }

    // Parse JSON credentials - same as gemini.js
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    

    // Prepare the request body according to Imagen API docs
    const requestBody = {
      instances: [
        {
          prompt: prompt.trim()
        }
      ],
      parameters: {
        sampleCount: Math.min(Math.max(1, imageCount), 4), // Limit 1-4 images
        aspectRatio: "1:1", // Square images
        outputMimeType: "image/png"
      }
    };

    // Build the Imagen API URL
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = 'us-central1'; // Same as gemini.js
    const model = 'imagen-4.0-generate-001';
    
    const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

    // Get access token using Google Auth Library
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();


    // Call Imagen API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('💥 Imagen API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Imagen API error: ${response.status}`,
        details: errorText
      });
    }

    const result = await response.json();

    // Process the response
    if (!result.predictions || result.predictions.length === 0) {
      return res.status(500).json({ error: 'No images generated' });
    }

    // Extract images from predictions
    const images = result.predictions.map((prediction, index) => ({
      id: `img_${Date.now()}_${index}`,
      base64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || 'image/png',
      enhancedPrompt: prediction.prompt || prompt // Some models return enhanced prompt
    }));


    // Return success response
    return res.status(200).json({
      success: true,
      prompt: prompt,
      images: images,
      count: images.length
    });

  } catch (error) {
    console.error('💥 Imagen generation error:', error);
    return res.status(500).json({ 
      error: 'Server error during image generation',
      message: error.message 
    });
  }
}