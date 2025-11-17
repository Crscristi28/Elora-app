/**
 * 📊 CONVERSATION SUMMARIZATION ENDPOINT
 *
 * Uses Gemini 2.5 Flash-Lite for cost-effective hierarchical summarization
 * Part of Omnia's memory system to maintain constant token costs
 */

import { VertexAI } from '@google-cloud/vertexai';
import { SUMMARIZATION_PROMPT } from '../src/prompts/summarization.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { previousSummary, messages } = req.body;

    console.log('📊 [SUMMARIZE] Starting summarization...');
    console.log('📊 [SUMMARIZE] Previous summary exists:', !!previousSummary);
    console.log('📊 [SUMMARIZE] Messages to summarize:', messages?.length || 0);

    // Validate input
    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No messages provided for summarization'
      });
    }

    // Check credentials
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return res.status(500).json({
        success: false,
        error: 'Google Cloud credentials are incomplete'
      });
    }

    // Parse credentials
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      }
    });

    console.log('✅ [SUMMARIZE] Vertex AI initialized');

    // Build conversation text from messages
    const conversationText = messages.map(msg => {
      const role = msg.sender === 'user' ? 'User' : 'Elora';
      const content = msg.text || msg.content || '';
      return `${role}: ${content}`;
    }).join('\n');

    // Build user message with previous summary (if exists)
    let userMessage = '';

    if (previousSummary) {
      userMessage = `Previous summary:
${previousSummary}

New messages:
${conversationText}

Create a new summary that compresses the previous summary and adds information from new messages. Maximum 500 words, plain text only.`;
    } else {
      userMessage = `Conversation:
${conversationText}

Create a summary. Maximum 500 words, plain text only.`;
    }

    console.log('🤖 [SUMMARIZE] Calling Gemini 2.5 Flash-Lite...');

    // Initialize model with system instruction
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SUMMARIZATION_PROMPT
    });

    // Generate summary
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }],
      generationConfig: {
        maxOutputTokens: 2000,  // ~1500 words max
        temperature: 0.3,       // Lower for more focused summaries
        topP: 0.8,
        topK: 40
      }
    });

    const summaryText = result.response.candidates[0].content.parts[0].text;

    console.log('✅ [SUMMARIZE] Summary created successfully');
    console.log('📊 [SUMMARIZE] Summary length:', summaryText.length, 'characters');
    console.log('📊 [SUMMARIZE] Original length:', conversationText.length, 'characters');
    console.log('📊 [SUMMARIZE] Compression ratio:',
      Math.round((1 - summaryText.length / conversationText.length) * 100) + '%'
    );

    return res.status(200).json({
      success: true,
      summary: summaryText,
      metadata: {
        messageCount: messages.length,
        originalLength: conversationText.length,
        summaryLength: summaryText.length,
        compressionRatio: Math.round((1 - summaryText.length / conversationText.length) * 100) + '%',
        hadPreviousSummary: !!previousSummary,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [SUMMARIZE] Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
