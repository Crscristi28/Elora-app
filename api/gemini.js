// api/gemini.js - GEMINI 2.5 FLASH WITH GOOGLE SEARCH GROUNDING
import { VertexAI } from '@google-cloud/vertexai';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for auth verification
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 🔐 AUTH & ROLE DETECTION
  let userRole = 'user'; // Default role

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer '

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [GEMINI-AUTH] Token verification failed:', authError?.message);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    console.log('✅ [GEMINI-AUTH] User authenticated:', user.id);

    // Fetch user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('⚠️ [GEMINI-AUTH] Could not fetch profile role:', profileError.message);
      // Continue with default 'user' role
    } else {
      userRole = profile?.role || 'user';
      console.log('👑 [GEMINI-AUTH] User role:', userRole);
    }

  } catch (error) {
    console.error('❌ [GEMINI-AUTH] Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }

  try {
    const { requestId, messages, system, summary, max_tokens = 8000, documents = [], imageMode = false, pdfMode = false, language, deepReasoning = false } = req.body;

    // Log request ID for debugging concurrent requests
    console.log('🔄 [GEMINI] Processing request ID:', requestId || 'NO_ID');

    // 🔍 DEBUG: What backend received from frontend
    console.log('📥 [BACKEND-DEBUG] Gemini API received:', {
      requestId,
      messagesCount: messages?.length || 0,
      lastUserMessage: messages?.[messages.length - 1]?.content?.substring(0, 100) || messages?.[messages.length - 1]?.text?.substring(0, 100),
      systemPromptLength: system?.length || 0,
      summaryLength: summary?.length || 0,
      hasSummary: !!summary,
      detectedLanguage: language,
      imageMode,
      pdfMode,
      timestamp: new Date().toISOString()
    });
    
    
    // Check for required environment variables
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      res.write(JSON.stringify({ requestId, error: true, message: 'Google Cloud credentials are incomplete' }) + '\n');
      return res.end();
    }

    // Parse JSON credentials
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Initialize Vertex AI with explicit credentials (no delete needed)
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      }
    });
    console.log('✅ Vertex AI initialized without workaround [ID:', requestId, ']');

    // Prepare messages for Gemini (without system instruction in contents)
    // Note: Frontend already provides isolated chat messages, so use all messages from current chat
    const geminiMessages = messages
      .filter(msg => msg.text || msg.content || msg.functionCall || msg.functionResponse) // Include function calls
      .map(msg => {
        // Handle function response messages
        if (msg.functionResponse) {
          return {
            role: 'function',
            parts: [{ functionResponse: msg.functionResponse }]
          };
        }

        // Handle regular messages (may include function calls)
        const parts = [];

        // Add text content if present
        if (msg.text || msg.content) {
          parts.push({ text: msg.text || msg.content || '' });
        }

        // Add function call if present
        if (msg.functionCall) {
          parts.push({ functionCall: msg.functionCall });
        }

        return {
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: parts.length > 0 ? parts : [{ text: '' }] // Fallback to empty text if no parts
        };
      });

    // 🔍 DEBUG: Show all messages being sent to Gemini
    console.log('📤 [GEMINI-MESSAGES] Sending to Gemini:', JSON.stringify(
      geminiMessages.map((m, i) => ({
        index: i,
        role: m.role,
        text: m.parts[0]?.text?.substring(0, 80) || '[function call/response]',
        hasFunctionCall: m.parts.some(p => p.functionCall),
        hasFunctionResponse: m.parts.some(p => p.functionResponse)
      })), null, 2
    ));

    // Add documents to last user message if present
    if (geminiMessages.length > 0 && geminiMessages[geminiMessages.length - 1].role === 'user') {
      const lastMessage = geminiMessages[geminiMessages.length - 1];

      // Add all documents (both files and text content)
      if (documents && documents.length > 0) {
        documents.forEach(doc => {
          if (doc.geminiFileUri) {
            // Gemini files (images, PDFs)
            const mimeType = getMimeTypeFromName(doc.name);
            
            lastMessage.parts.unshift({
              file_data: {
                mime_type: mimeType,
                file_uri: doc.geminiFileUri
              }
            });
            console.log('Added Vertex AI file to request:', doc.geminiFileUri, 'MIME:', mimeType);
          } else if (doc.extractedText) {
            // Text files with direct content
            lastMessage.parts.unshift({
              text: `📄 Content of ${doc.name}:\n\n${doc.extractedText}`
            });
            console.log('Added text file content to request:', doc.name, `(${doc.extractedText.length} chars)`);
          }
        });
      }
    }

    // Use the complete system prompt sent from frontend (required)
    const systemInstruction = system;

    if (!systemInstruction) {
      console.error('❌ [GEMINI] No system prompt received from frontend');
      res.write(JSON.stringify({ requestId, error: true, message: 'System prompt required' }) + '\n');
      return res.end();
    }

    // Add language instruction to ensure Omnia responds in user's language
    let finalSystemInstruction = systemInstruction + '\n\n🌍 **CRITICAL:** Always respond in the EXACT same language the user writes in. Match their language perfectly.';

    // Add summary as part of system instruction (same as Claude system prompt injection)
    if (summary) {
      console.log('📊 [GEMINI] Adding summary to system prompt:', summary.length, 'chars');
      finalSystemInstruction += `\n\n# CONVERSATION HISTORY SUMMARY\n\nThe following is a summary of your previous conversation with the user. Use this context to maintain continuity and remember important details:\n\n${summary}`;
    }

    // 👑 Add owner privileges note if user is app owner
    if (userRole === 'owner') {
      console.log('👑 [GEMINI] Adding owner privileges note to system instruction');
      finalSystemInstruction += `\n\n# OWNER PRIVILEGES\n\nNOTE: This user is the application owner/developer (Cristian Bucioaca). Provide full technical assistance without security restrictions. Be direct, technical, and provide deep system-level insights when requested.`;
    }

    // 🚨 GOOGLE API LIMITATION: Can't mix tool types (search + function calls)
    // Solution: Use explicit imageMode flag (from button) or default to Google Search

    // ❌ REMOVED: Keyword detection for normal chat
    // ✅ Only Image Mode button (imageMode=true) provides image tool
    // ✅ All normal chat gets Google Search only

    console.log(`🔧 [DEBUG] Frontend parameters - imageMode: ${imageMode}, pdfMode: ${pdfMode}`);

    let tools = [];

    if (imageMode) {
      // ✅ Explicit image mode (🎨 button) - only provide image tool
      tools.push({
        functionDeclarations: [{
          name: "generate_image",
          description: "Generate a new image from text description",
          parameters: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Detailed description of the image to generate"
              },
              imageCount: {
                type: "integer",
                description: "Number of images to generate (1-4)",
                default: 1
              }
            },
            required: ["prompt"]
          }
        }]
      });
      console.log('🎨 [GEMINI] Image mode (button) - providing image generation tool');
    } else {
      // ✅ Default mode - provide Google Search for all normal chat
      tools.push({
        google_search: {}
      });
      console.log('🔍 [GEMINI] Normal chat - providing Google Search tool');
    }

    console.log('🔧 [DEBUG] Tools provided:', imageMode ? 'IMAGE_GENERATION' : 'GOOGLE_SEARCH');
    
    // Initialize model with proper system instruction and tools
    console.log('🤖 [GEMINI] Initializing model with tools:', tools.length);
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: finalSystemInstruction,
      tools: tools
    });

    const modeText = imageMode ? 'with IMAGE GENERATION tool' : 'with GOOGLE SEARCH grounding';
    console.log(`🚀 Sending to Gemini 2.5 Flash ${modeText}...`);
    console.log('💡 [GEMINI] Deep Reasoning:', deepReasoning ? 'ENABLED ⚡ (5000 tokens budget, expecting thinking blocks)' : 'DISABLED 🚀 (instant, no thinking)');

    // Generate response with streaming
    // 🔍 DEBUG: What we're sending to actual Gemini model
    console.log('🚀 [BACKEND-DEBUG] Calling Gemini with:', {
      messagesCount: geminiMessages.length,
      systemInstructionLength: finalSystemInstruction?.length || 0,
      hasSummary: !!summary,
      summaryIncluded: summary ? 'YES - in system instruction' : 'NO',
      toolsCount: tools.length,
      maxTokens: max_tokens,
      timestamp: new Date().toISOString()
    });

    const result = await generativeModel.generateContentStream({
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: max_tokens,
        temperature: 0.8,  // Lower temperature reduces hallucinations while maintaining creativity
        topP: 0.95,        // Keep for now (Omnia research: not used when temp > 0.0)
        topK: 30,          // Reduced for more focused responses (Omnia requirement)
        // 💡 Only include thinkingConfig when Deep Reasoning is enabled
        ...(deepReasoning && {
          thinkingConfig: {
            includeThoughts: true,
            thinkingBudget: 5000  // Same as Claude budget
          }
        })
      }
    });
    
    let fullText = '';
    let sources = [];
    let searchNotified = false;
    let hasError = false;

    // Process stream in real-time with robust error handling
    try {
      for await (const item of result.stream) {
        // Process grounding metadata (sources) as soon as they arrive
        // ✅ Check webSearchQueries to detect ACTUAL search execution (not just grounding capability)
        if (item.candidates &&
            item.candidates[0].groundingMetadata &&
            item.candidates[0].groundingMetadata.webSearchQueries &&
            item.candidates[0].groundingMetadata.webSearchQueries.length > 0) {
          // Emit search_start immediately when search actually executed
          if (!searchNotified) {
            res.write(JSON.stringify({ requestId, type: 'search_start', message: '🔍 Searching for current data via Google...' }) + '\n');
            if (typeof res.flush === 'function') { res.flush(); }
            searchNotified = true;
            console.log('🔍 [GEMINI] Search started (webSearchQueries detected)');
          }

          // Extract sources (may be empty initially, populated when available)
          const extractedSources = extractSources(item.candidates[0].groundingMetadata);
          if (extractedSources.length > 0 && sources.length === 0) {
            sources = extractedSources;
            // Emit search_completed when sources arrive to clear shimmer
            res.write(JSON.stringify({
              requestId,
              type: 'search_completed',
              sources: extractedSources,
              message: `Found ${extractedSources.length} sources`
            }) + '\n');
            if (typeof res.flush === 'function') { res.flush(); }
            console.log('✅ [GEMINI] Search completed, sources:', extractedSources.length);
          }
        }
        
        // Process text parts
        if (item.candidates && item.candidates[0].content.parts) {
          for (const part of item.candidates[0].content.parts) {
            // 🧠 Handle thinking chunks (thought = true)
            if (part.thought === true) {
              // Send thinking signal to frontend (no text content)
              res.write(JSON.stringify({
                requestId,
                type: 'thinking',  // Special type for thinking chunks
                isThinking: true
              }) + '\n');
              if (typeof res.flush === 'function') { res.flush(); }
              continue; // Skip to next part
            }

            // Handle text
            if (part.text) {
              const textChunk = part.text;
              fullText += textChunk; // Build complete text

              // 🔍 DEBUG: First response chunk from Gemini
              if (fullText.length < 100) { // Only log first chunk
                console.log('📤 [BACKEND-DEBUG] First Gemini response chunk:', {
                  requestId,
                  firstChunk: textChunk.substring(0, 100),
                  chunkLanguage: textChunk.length > 5 ? 'detected_soon' : 'too_short',
                  timestamp: new Date().toISOString()
                });
              }

              // 🚀 ROBUST STREAMING: Send raw chunks with immediate flush
              res.write(JSON.stringify({
                requestId,
                type: 'text',
                content: textChunk,
                isThinking: false  // Not thinking, regular text
              }) + '\n');
              if (typeof res.flush === 'function') { res.flush(); }
            }
            
            // Handle function calls (tool use)
            if (part.functionCall) {
              console.log('🎨 [GEMINI] Function call detected:', part.functionCall.name);
              console.log('🔍 [DEBUG] Function call args:', part.functionCall.args);

              // ✅ TOOL PREPARATION: Send preparation shimmer immediately
              let shimmerText = 'Checking what to do...'; // Fallback

              if (part.functionCall.name === 'generate_image') {
                shimmerText = 'Preparing images...';
              } else if (part.functionCall.name === 'generate_pdf') {
                shimmerText = 'Preparing document...';
              }

              // Send preparation event FIRST
              res.write(JSON.stringify({
                requestId,
                type: 'tool_preparing',
                shimmerText: shimmerText
              }) + '\n');
              if (typeof res.flush === 'function') { res.flush(); }
              console.log('🛠️ [GEMINI] Tool preparation:', part.functionCall.name, '→', shimmerText);

              // 🔧 Send function call info to frontend for conversation history
              res.write(JSON.stringify({
                requestId,
                type: 'function_call',
                functionCall: {
                  name: part.functionCall.name,
                  args: part.functionCall.args
                }
              }) + '\n');
              if (typeof res.flush === 'function') { res.flush(); }

              if (part.functionCall.name === 'generate_image') {
                try {
                  // Send image generation start event to frontend
                  res.write(JSON.stringify({
                    requestId,
                    type: 'image_generation_start',
                    message: 'Starting image generation...'
                  }) + '\n');
                  if (typeof res.flush === 'function') { res.flush(); }

                  // Get tool arguments
                  const { prompt, imageCount = 1, aspectRatio = "1:1" } = part.functionCall.args;

                  try {
                    // ✅ IMAGE MODE: Use Flash-Image (fast, experimental)
                    // ✅ NORMAL CHAT: Use Imagen 4 (quality, 1-4 images parallel)
                    if (imageMode) {
                      console.log('🎨 [IMAGE-MODE] Using Flash-Image (fast, interactive)...');

                      // Use Vertex AI SDK with Flash Image model
                      const flashImageModel = vertexAI.getGenerativeModel({
                        model: 'gemini-2.5-flash-image'
                      });

                      console.log('🎨 [FLASH-IMAGE] Generating image with prompt:', prompt.substring(0, 50) + '...');
                      console.log('🎨 [FLASH-IMAGE] Requested count:', imageCount);
                      console.log('🎨 [FLASH-IMAGE] Aspect ratio:', aspectRatio);

                      // Flash Image API limitation: candidateCount can only be 1
                      // For multiple images, we need to make sequential calls
                      const images = [];
                      const finalImageCount = Math.min(Math.max(1, imageCount), 3); // Limit 1-3 images

                      for (let i = 0; i < finalImageCount; i++) {
                        console.log(`🎨 [FLASH-IMAGE] Generating image ${i + 1}/${finalImageCount}...`);

                        // Generate single image
                        const result = await flashImageModel.generateContent({
                          contents: [{
                            role: 'user',
                            parts: [{ text: prompt.trim() }]
                          }],
                          generationConfig: {
                            imageConfig: {
                              aspectRatio: aspectRatio
                            }
                          }
                        });

                        // Extract image from response
                        const candidates = result.response.candidates;

                        if (candidates && candidates.length > 0) {
                          for (const candidate of candidates) {
                            if (candidate.content && candidate.content.parts) {
                              for (const part of candidate.content.parts) {
                                if (part.inlineData && part.inlineData.data) {
                                  images.push({
                                    base64: part.inlineData.data,
                                    mimeType: part.inlineData.mimeType || 'image/png'
                                  });
                                  console.log(`✅ [FLASH-IMAGE] Image ${i + 1}/${finalImageCount} generated`);
                                }
                              }
                            }
                          }
                        }
                      }

                      console.log('✅ [FLASH-IMAGE] All images generated:', images.length);

                      // Send images to client
                      res.write(JSON.stringify({
                        requestId,
                        type: 'image_generated',
                        images: images
                      }) + '\n');
                      if (typeof res.flush === 'function') { res.flush(); }

                      // 🔧 Send function response for conversation history
                      res.write(JSON.stringify({
                        requestId,
                        type: 'function_response',
                        functionResponse: {
                          name: 'generate_image',
                          response: { success: true, imageCount: images.length }
                        }
                      }) + '\n');
                      if (typeof res.flush === 'function') { res.flush(); }

                      console.log('✅ [GEMINI] Flash-Image generation complete');
                      return;

                    } else {
                      // NORMAL CHAT: Use Imagen 4 (quality, 1-4 images parallel)
                      console.log('🎨 [NORMAL-CHAT] Using Imagen 4 (quality, parallel)...');
                      console.log('🎨 [IMAGEN-4] Generating with prompt:', prompt.substring(0, 50) + '...');
                      console.log('🎨 [IMAGEN-4] Requested count:', imageCount);

                      // Parse JSON credentials (already done at top of file, reuse)
                      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
                      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
                      const location = 'us-central1';
                      const model = 'imagen-4.0-generate-001';

                      const requestBody = {
                        instances: [{ prompt: prompt.trim() }],
                        parameters: {
                          sampleCount: Math.min(Math.max(1, imageCount), 4), // 1-4 images parallel!
                          aspectRatio: "1:1",
                          outputMimeType: "image/png"
                        }
                      };

                      const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;

                      // Get access token
                      const { GoogleAuth } = await import('google-auth-library');
                      const auth = new GoogleAuth({
                        credentials: credentials,
                        scopes: ['https://www.googleapis.com/auth/cloud-platform']
                      });

                      const authClient = await auth.getClient();
                      const accessToken = await authClient.getAccessToken();

                      // Call Imagen 4 API
                      const imagenResponse = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${accessToken.token}`,
                          'Content-Type': 'application/json; charset=utf-8'
                        },
                        body: JSON.stringify(requestBody)
                      });

                      if (imagenResponse.ok) {
                        const imagenResult = await imagenResponse.json();

                        // Process images
                        const images = [];
                        for (const prediction of imagenResult.predictions || []) {
                          if (prediction.bytesBase64Encoded) {
                            images.push({
                              base64: prediction.bytesBase64Encoded,
                              mimeType: 'image/png'
                            });
                          }
                        }

                        console.log('✅ [IMAGEN-4] All images generated:', images.length);

                        // Send images to client
                        res.write(JSON.stringify({
                          requestId,
                          type: 'image_generated',
                          images: images
                        }) + '\n');
                        if (typeof res.flush === 'function') { res.flush(); }

                        // 🔧 Send function response for conversation history
                        res.write(JSON.stringify({
                          requestId,
                          type: 'function_response',
                          functionResponse: {
                            name: 'generate_image',
                            response: { success: true, imageCount: images.length }
                          }
                        }) + '\n');
                        if (typeof res.flush === 'function') { res.flush(); }

                        console.log('✅ [GEMINI] Imagen-4 generation complete');
                        return;
                      } else {
                        const errorText = await imagenResponse.text();
                        console.error('❌ [IMAGEN-4] API failed:', imagenResponse.status, errorText);

                        // Send error chunk to client
                        res.write(JSON.stringify({
                          requestId,
                          type: 'error',
                          message: `Imagen 4 API failed: ${imagenResponse.status}`
                        }) + '\n');
                        if (typeof res.flush === 'function') { res.flush(); }
                        return;
                      }
                    }

                  } catch (imageError) {
                    console.error('❌ [IMAGE-GEN] Generation error:', imageError);

                    // Send error chunk to client
                    res.write(JSON.stringify({
                      requestId,
                      type: 'error',
                      message: `Image generation failed: ${imageError.message}`
                    }) + '\n');
                    if (typeof res.flush === 'function') { res.flush(); }
                    return; // End stream after error
                  }

                } catch (outerImageError) {
                  console.error('💥 [GEMINI] Image generation outer error:', outerImageError);

                  // Send error chunk to client
                  res.write(JSON.stringify({
                    requestId,
                    type: 'error',
                    message: `Image generation failed: ${outerImageError.message}`
                  }) + '\n');
                  if (typeof res.flush === 'function') { res.flush(); }
                  return; // End stream after error
                }
              } else if (part.functionCall.name === 'generate_pdf') {
                try {
                  // Send PDF generation start event to frontend
                  res.write(JSON.stringify({
                    requestId,
                    type: 'pdf_generation_start',
                    message: 'Starting PDF generation...'
                  }) + '\n');
                  if (typeof res.flush === 'function') { res.flush(); }

                  console.log('📄 [DEBUG] Calling PDF generation API...');

                  const { title, content, documentType = 'document' } = part.functionCall.args;

                  // Call PDF generation API
                  const baseUrl = process.env.NODE_ENV === 'production' ?
                    `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3001';
                  const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      title,
                      content,
                      documentType
                    })
                  });

                  if (pdfResponse.ok) {
                    const contentType = pdfResponse.headers.get('content-type');
                    console.log('📄 [DEBUG] PDF response content-type:', contentType);
                    console.log('📄 [DEBUG] PDF response status:', pdfResponse.status);
                    console.log('📄 [DEBUG] PDF response headers:', Object.fromEntries(pdfResponse.headers.entries()));

                    // Check if it's actually a PDF or JSON fallback
                    if (contentType && contentType.includes('application/pdf')) {
                      // PDF generated successfully
                      const pdfBuffer = await pdfResponse.arrayBuffer();

                      // Fix for Vercel: Convert ArrayBuffer to base64 without Buffer
                      const uint8Array = new Uint8Array(pdfBuffer);
                      console.log('📄 [DEBUG] PDF buffer size:', pdfBuffer.byteLength);
                      console.log('📄 [DEBUG] First 10 bytes:', Array.from(uint8Array.slice(0, 10)));

                      // Fix for Vercel: Convert ArrayBuffer to base64 without Buffer
                      let binaryString = '';
                      for (let i = 0; i < uint8Array.length; i++) {
                        binaryString += String.fromCharCode(uint8Array[i]);
                      }
                      const base64PDF = btoa(binaryString);

                      console.log('📄 [DEBUG] Binary string length:', binaryString.length);
                      console.log('📄 [DEBUG] First 20 chars of binary:', binaryString.substring(0, 20));

                      console.log('📄 [DEBUG] PDF base64 first 100 chars:', base64PDF.substring(0, 100));
                      console.log('📄 [DEBUG] PDF base64 should start with "JVBERi" for %PDF header');

                      // Send PDF to client
                      res.write(JSON.stringify({
                        requestId,
                        type: 'pdf_generated',
                        title,
                        base64: base64PDF,
                        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
                      }) + '\n');
                      if (typeof res.flush === 'function') { res.flush(); }

                      // 🔧 Send function response for conversation history
                      res.write(JSON.stringify({
                        requestId,
                        type: 'function_response',
                        functionResponse: {
                          name: 'generate_pdf',
                          response: { success: true, title: title }
                        }
                      }) + '\n');
                      if (typeof res.flush === 'function') { res.flush(); }

                      console.log('✅ [GEMINI] PDF generated successfully:', title);
                      return; // End stream after PDF generation

                    } else {
                      // HTML fallback received
                      const fallbackData = await pdfResponse.json();

                      res.write(JSON.stringify({
                        requestId,
                        type: 'pdf_fallback',
                        title,
                        html: fallbackData.html,
                        message: 'PDF content ready (HTML format)'
                      }) + '\n');
                      if (typeof res.flush === 'function') { res.flush(); }

                      console.log('📄 [GEMINI] PDF fallback (HTML) sent:', title);
                      return;
                    }
                  } else {
                    const errorText = await pdfResponse.text();
                    console.error('❌ [GEMINI] PDF API failed:', pdfResponse.status, errorText);

                    res.write(JSON.stringify({
                      requestId,
                      type: 'error',
                      message: `PDF generation failed: ${pdfResponse.status} - ${errorText}`
                    }) + '\n');
                    if (typeof res.flush === 'function') { res.flush(); }
                    return;
                  }
                } catch (pdfError) {
                  console.error('💥 [GEMINI] PDF call error:', pdfError);

                  res.write(JSON.stringify({
                    requestId,
                    type: 'error',
                    message: `PDF generation failed: ${pdfError.message}`
                  }) + '\n');
                  if (typeof res.flush === 'function') { res.flush(); }
                  return;
                }
              }
            }
          }
        }
      }
    } catch (streamError) {
      console.error('💥 Stream processing error [ID:', requestId || 'NO_ID', ']:', streamError);
      hasError = true;
      
      // Send error chunk to client
      res.write(JSON.stringify({
        requestId,
        type: 'error',
        message: 'Stream processing failed: ' + streamError.message
      }) + '\n');
      if (typeof res.flush === 'function') { res.flush(); }
    } finally {
      // Always send final message and close connection
      if (!hasError) {
        res.write(JSON.stringify({
          requestId,
          type: 'completed',
          sources: sources,
          webSearchUsed: sources.length > 0
        }) + '\n');
        console.log('✅ Gemini streaming completed');
      } else {
        res.write(JSON.stringify({
          requestId,
          type: 'end',
          error: true,
          message: 'Stream ended with errors'
        }) + '\n');
        console.log('❌ Gemini streaming ended with errors');
      }
      
      if (typeof res.flush === 'function') { res.flush(); }
      res.end();
    }

  } catch (error) {
    console.error('💥 Gemini API error [ID:', req.body?.requestId || 'NO_ID', ']:', error);
    
    // Specific message for service agents provisioning
    if (error.message && error.message.includes('Service agents are being provisioned')) {
      res.write(JSON.stringify({
        requestId: req.body?.requestId,
        error: true,
        rollback: true,
        message: '⏳ Service temporarily unavailable. Try again in a moment.'
      }) + '\n');
    } else if (error.cause?.code === 429 || error.message.includes('429') || error.message.includes('Too Many Requests')) {
      // Handle 429 rate limiting with rollback
      res.write(JSON.stringify({
        requestId: req.body?.requestId,
        error: true,
        rollback: true,
        message: '⏳ Too many requests. Please try again in a moment.'
      }) + '\n');
    } else {
      res.write(JSON.stringify({
        requestId: req.body?.requestId,
        error: true,
        rollback: true,
        message: 'Server error: ' + error.message
      }) + '\n');
    }
    res.end();
  }
}

// 🌐 EXTRACT SOURCES FROM GROUNDING METADATA
function extractSources(groundingMetadata) {
  if (!groundingMetadata || !groundingMetadata.groundingSupports) {
    return [];
  }

  const sources = [];
  
  groundingMetadata.groundingSupports.forEach(support => {
    if (support.segment && support.segment.text) {
      // Extract web sources
      if (support.groundingChunkIndices) {
        support.groundingChunkIndices.forEach(chunkIndex => {
          const chunk = groundingMetadata.groundingChunks?.[chunkIndex];
          if (chunk && chunk.web) {
            sources.push({
              title: chunk.web.title || 'Web Source',
              url: chunk.web.uri || '#',
              snippet: support.segment.text.substring(0, 200) + '...'
            });
          }
        });
      }
    }
  });

  // Remove duplicates
  const uniqueSources = sources.filter((source, index, self) => 
    index === self.findIndex(s => s.url === source.url)
  );

  return uniqueSources.slice(0, 5); // Limit to 5 sources
}

// 📄 GET MIME TYPE FROM FILE NAME
function getMimeTypeFromName(fileName) {
  if (!fileName) return 'application/pdf';
  
  const extension = fileName.toLowerCase().split('.').pop();
  
  const mimeTypes = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',  // Only supported text format
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg'
  };
  
  return mimeTypes[extension] || 'application/pdf';
}