// api/openai.js

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

  try {
    console.log('🧠 OpenAI API call via Vercel');
    
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Messages musí být array'
      });
    }

    const API_KEY = process.env.OPENAI_API_KEY;
    
    if (!API_KEY) {
      console.error('❌ OPENAI_API_KEY not set');
      return res.status(500).json({ 
        error: 'Configuration error',
        message: 'OpenAI API key not configured'
      });
    }

    console.log('🚀 Volám OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1000
      })
    });

    console.log('📡 OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      
      return res.status(response.status).json({ 
        error: 'OpenAI API error',
        status: response.status,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('✅ OpenAI API success');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response:', data);
      return res.status(500).json({
        error: 'Invalid response from OpenAI'
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('💥 OpenAI function error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message
    });
  }
}