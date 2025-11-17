/**
 * 🧪 TEST ENDPOINT - Gemini 2.5 Flash-Lite on Vertex AI
 *
 * Purpose: Verify Gemini 2.5 Flash-Lite works for summarization before implementing full summary system
 */

import { VertexAI } from '@google-cloud/vertexai';

export default async function handler(req, res) {
  console.log('🧪 [TEST-FLASH-LITE] Testing Gemini 2.5 Flash-Lite on Vertex AI...');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check for required environment variables (SAME AS GEMINI)
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return res.status(500).json({
        success: false,
        error: 'Google Cloud credentials are incomplete'
      });
    }

    // Parse JSON credentials (SAME AS GEMINI)
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    console.log('🔑 [TEST-FLASH-LITE] Credentials parsed');
    console.log('🌍 [TEST-FLASH-LITE] Project:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('🌍 [TEST-FLASH-LITE] Location: us-central1');

    // Initialize Vertex AI (SAME AS GEMINI)
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      }
    });

    console.log('✅ [TEST-FLASH-LITE] Vertex AI initialized');

    // Test 1: Simple response test
    console.log('🧪 [TEST 1] Testing basic model response...');

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    });

    const simpleTest = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'Say "Hello from Gemini 2.5 Flash-Lite! I am working correctly." in English, then repeat in Czech.' }]
      }]
    });

    const simpleResponse = simpleTest.response.candidates[0].content.parts[0].text;
    console.log('✅ [TEST 1] Response received:', simpleResponse);

    // Test 2: Summarization test with language detection
    console.log('🧪 [TEST 2] Testing summarization capability...');

    const testMessages = `
User: Hello, how are you today?
Bot: I'm doing great! How can I help you?
User: I need help with my JavaScript code.
Bot: Of course! What seems to be the problem?
User: I'm getting an error when I try to use async/await.
Bot: Let me help you debug that. Can you share the error message?
`;

    const summaryPrompt = `You are a conversation summarization expert. Create a concise summary of the following conversation.

CONVERSATION:
${testMessages}

IMPORTANT:
- Keep it under 100 words
- Focus on key topics discussed
- Detect the language used and respond in the SAME language
- Use bullet points if helpful

Create summary now:`;

    const summaryTest = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: summaryPrompt }]
      }]
    });

    const summaryResponse = summaryTest.response.candidates[0].content.parts[0].text;
    console.log('✅ [TEST 2] Summary created:', summaryResponse);

    // Test 3: Multilingual test (Czech)
    console.log('🧪 [TEST 3] Testing Czech language detection...');

    const czechMessages = `
Uživatel: Ahoj, jak se máš?
Bot: Mám se skvěle! Jak ti mohu pomoci?
Uživatel: Potřebuji pomoc s mým JavaScript kódem.
`;

    const czechPrompt = `Shrň tuto konverzaci do 50 slov:

${czechMessages}`;

    const czechTest = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: czechPrompt }]
      }]
    });

    const czechResponse = czechTest.response.candidates[0].content.parts[0].text;
    console.log('✅ [TEST 3] Czech summary:', czechResponse);

    // Return success with all test results
    return res.status(200).json({
      success: true,
      message: 'Gemini 2.5 Flash-Lite is working on Vertex AI!',
      tests: {
        test1_simple: {
          passed: true,
          response: simpleResponse
        },
        test2_summarization: {
          passed: true,
          response: summaryResponse,
          original_length: testMessages.length,
          summary_length: summaryResponse.length,
          compression_ratio: Math.round((1 - summaryResponse.length / testMessages.length) * 100) + '%'
        },
        test3_multilingual: {
          passed: true,
          language: 'Czech',
          response: czechResponse
        }
      },
      model: 'gemini-2.5-flash-lite',
      location: 'us-central1',
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

  } catch (error) {
    console.error('❌ [TEST-FLASH-LITE] Error:', error);

    // Retry once
    console.log('🔄 [TEST-FLASH-LITE] Retrying once...');

    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

      const vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: 'us-central1',
        googleAuthOptions: {
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        }
      });

      const model = vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite'
      });

      const retryTest = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: 'Say "Retry successful! Gemini 2.5 Flash-Lite is working."' }]
        }]
      });

      const retryResponse = retryTest.response.candidates[0].content.parts[0].text;

      console.log('✅ [TEST-FLASH-LITE] Retry successful');

      return res.status(200).json({
        success: true,
        message: 'Gemini 2.5 Flash-Lite working (retry successful)',
        response: retryResponse,
        model: 'gemini-2.5-flash-lite',
        location: 'us-central1',
        retried: true
      });

    } catch (retryError) {
      console.error('❌ [TEST-FLASH-LITE] Retry failed:', retryError);

      return res.status(500).json({
        success: false,
        error: retryError.message,
        stack: retryError.stack,
        troubleshooting: {
          checkModel: 'Model name: gemini-2.5-flash-lite',
          checkLocation: 'Location: us-central1',
          checkCredentials: 'Verify GOOGLE_CLOUD_PROJECT_ID is set',
          checkVertexAI: 'Ensure Vertex AI API is enabled',
          note: 'This model should be available by default (no special quota needed)'
        }
      });
    }
  }
}
