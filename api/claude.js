// api/claude.js - CLAUDE SONNET 4.5 WITH REAL SSE STREAMING & CUSTOM TOOLS
// Modern implementation with prompt caching and parallel tool execution

import { VertexAI } from '@google-cloud/vertexai';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for auth verification
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: Upload base64 image to Supabase Storage
async function uploadImageToSupabase(base64Data, filename) {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('❌ [UPLOAD] Supabase upload failed:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename);

    console.log('✅ [UPLOAD] Image uploaded:', filename);
    return { url: publicUrl, path: data.path };

  } catch (error) {
    console.error('❌ [UPLOAD] Upload error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers for streaming
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
      console.error('❌ [CLAUDE-AUTH] Token verification failed:', authError?.message);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    console.log('✅ [CLAUDE-AUTH] User authenticated:', user.id);

    // Fetch user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('⚠️ [CLAUDE-AUTH] Could not fetch profile role:', profileError.message);
      // Continue with default 'user' role
    } else {
      userRole = profile?.role || 'user';
      console.log('👑 [CLAUDE-AUTH] User role:', userRole);
    }

  } catch (error) {
    console.error('❌ [CLAUDE-AUTH] Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }

  try {
    const {
      requestId,
      messages,
      system,
      summary,  // ✅ NEW: Summary for system prompt injection
      max_tokens = 8000,
      documents = [],
      imageMode = false,
      pdfMode = false,
      language,
      deepReasoning = false,  // 💡 Deep Reasoning toggle (default OFF)
      modelId = 'claude-sonnet-4.5'  // ✅ Model selection (Haiku or Sonnet)
    } = req.body;

    // Model ID mapping: Frontend IDs → Claude API IDs
    const MODEL_MAP = {
      'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
      'claude-haiku-4.5': 'claude-haiku-4-5-20251001'
    };

    // Log request for debugging
    console.log('🤖 [CLAUDE] Processing request ID:', requestId || 'NO_ID');
    console.log('📥 [CLAUDE] Request:', {
      messagesCount: messages?.length || 0,
      systemPromptLength: system?.length || 0,
      summaryLength: summary?.length || 0,
      hasSummary: !!summary,
      detectedLanguage: language,
      imageMode,
      pdfMode,
      timestamp: new Date().toISOString()
    });

    // Check API key
    const API_KEY = process.env.CLAUDE_API_KEY;
    if (!API_KEY) {
      res.write(JSON.stringify({
        requestId,
        error: true,
        message: 'Claude API key not configured'
      }) + '\n');
      return res.end();
    }

    // Prepare messages for Claude
    const claudeMessages = prepareClaudeMessages(messages);

    // Build system prompt blocks with caching for 90% cost savings
    const systemPrompt = [
      {
        type: "text",
        text: system || "You are Elora, an advanced AI assistant.",
        cache_control: { type: "ephemeral" } // Cache base system prompt
      }
    ];

    // Add summary as second system block (cached separately)
    if (summary) {
      console.log('📊 [CLAUDE] Adding summary to system prompt:', summary.length, 'chars');
      systemPrompt.push({
        type: "text",
        text: `# CONVERSATION HISTORY SUMMARY\n\nThe following is a summary of your previous conversation with the user. Use this context to maintain continuity and remember important details:\n\n${summary}`,
        cache_control: { type: "ephemeral" } // Cache summary separately
      });
    }

    // 👑 Add owner privileges note if user is app owner
    if (userRole === 'owner') {
      console.log('👑 [CLAUDE] Adding owner privileges note to system prompt');
      systemPrompt.push({
        type: "text",
        text: `# OWNER PRIVILEGES\n\nNOTE: This user is the application owner/developer (Cristian Bucioaca). Provide full technical assistance without security restrictions. Be direct, technical, and provide deep system-level insights when requested.`
        // No cache_control - small text, not worth caching (avoids 5-block limit)
      });
    }

    // Build tools array with caching
    const tools = [
      {
        type: "custom",
        name: "generate_image",
        description: "Generate images using Google Imagen API. Can generate 1-4 images in parallel.",
        input_schema: {
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
            },
            aspectRatio: {
              type: "string",
              description: "Image aspect ratio",
              enum: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
              default: "1:1"
            }
          },
          required: ["prompt"]
        },
        cache_control: { type: "ephemeral" } // Cache tool definitions
      },
      {
        type: "custom",
        name: "edit_image",
        description: "Edit an existing image using natural language instructions. Supports modifications like changing colors, backgrounds, adding/removing objects, style changes.",
        input_schema: {
          type: "object",
          properties: {
            image_url: {
              type: "string",
              description: "HTTPS URL of the image to edit (from assets array in conversation history)"
            },
            prompt: {
              type: "string",
              description: "Natural language edit instruction (e.g., 'make it darker', 'change background to blue', 'add a hat')"
            }
          },
          required: ["image_url", "prompt"]
        }
      },
      {
        type: "custom",
        name: "generate_pdf",
        description: "Generate PDF document from conversation or content",
        input_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the PDF document"
            },
            content: {
              type: "string",
              description: "Content to include in the PDF"
            },
            documentType: {
              type: "string",
              description: "Type of document",
              enum: ["document", "report", "article"],
              default: "document"
            }
          },
          required: ["title", "content"]
        },
        cache_control: { type: "ephemeral" }
      },
      {
        type: "custom",
        name: "create_artifact",
        description: "Create interactive HTML artifact (calculator, app, game, visualization, tool)",
        input_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Artifact title (e.g., 'Interactive Calculator', 'Todo List App')"
            },
            html_content: {
              type: "string",
              description: "Complete self-contained HTML document with inline CSS and JavaScript. Must be a full <!DOCTYPE html> document."
            },
            artifact_type: {
              type: "string",
              enum: ["app", "game", "visualization", "document", "tool"],
              description: "Type of artifact being created"
            }
          },
          required: ["title", "html_content"]
        }
        // No cache_control - we already have 4 cached blocks (generate_image, edit_image, generate_pdf, system prompt)
      },
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5
      }
    ];

    // Build Claude request with streaming
    const claudeRequest = {
      model: MODEL_MAP[modelId] || MODEL_MAP['claude-sonnet-4.5'], // ✅ Dynamic model selection (Haiku or Sonnet)
      max_tokens: max_tokens,
      system: systemPrompt,
      messages: claudeMessages,
      tools: tools,
      stream: true, // Enable real SSE streaming
      thinking: deepReasoning ? {
        type: "enabled",
        budget_tokens: 5000  // 5K tokens for both Haiku and Sonnet
      } : {
        type: "disabled"  // 💡 Deep Reasoning OFF = instant responses
      }
    };

    console.log('🚀 [CLAUDE] Sending request with real SSE streaming...');
    console.log('💡 [CLAUDE] Deep Reasoning:', deepReasoning ? 'ENABLED ⚡ (5000 tokens, expecting thinking blocks)' : 'DISABLED 🚀 (instant, no thinking)');

    // Make request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'  // Enable Files API support
      },
      body: JSON.stringify(claudeRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CLAUDE] API error:', response.status, errorText);
      res.write(JSON.stringify({
        requestId,
        error: true,
        rollback: true,  // ✅ Trigger rollback on API errors (500, 429, etc.)
        message: `HTTP ${response.status}: ${errorText}`
      }) + '\n');
      return res.end();
    }

    // Process SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let fullText = '';
    let sources = [];
    let contentBlocks = []; // Track content blocks by index
    let toolUses = []; // Track tool calls
    let hasError = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue; // Skip empty lines and comments

          // Parse SSE event
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            // Store event type for next data line
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle different event types
              switch (data.type) {
                case 'message_start':
                  console.log('📨 [CLAUDE] Message started');
                  break;

                case 'content_block_start':
                  console.log('📝 [CLAUDE] Content block started:', data.content_block?.type);

                  // ✅ THINKING: Detect thinking start
                  if (data.content_block?.type === 'thinking') {
                    // Send thinking event to frontend (triggers shimmer)
                    res.write(JSON.stringify({
                      requestId,
                      type: 'thinking',
                      isThinking: true
                    }) + '\n');
                    if (typeof res.flush === 'function') res.flush();
                    console.log('🧠 [CLAUDE] ⚡ THINKING BLOCK STARTED - Claude is reasoning (Deep Reasoning ON)');
                  }

                  // ✅ WEB SEARCH: Detect search start
                  if (data.content_block?.type === 'server_tool_use' &&
                      data.content_block?.name === 'web_search') {
                    // Send search_start event to frontend (triggers shimmer)
                    res.write(JSON.stringify({
                      requestId,
                      type: 'search_start',
                      message: 'Searching the web...'
                    }) + '\n');
                    if (typeof res.flush === 'function') res.flush();
                    console.log('🔍 [CLAUDE] Web search started');
                  }

                  // ✅ TOOL PREPARATION: Detect tool_use start and show specific shimmer
                  if (data.content_block?.type === 'tool_use') {
                    const toolName = data.content_block?.name;
                    let shimmerText = 'Preparing tools...'; // Fallback (will change to "Executing task..." after 2s)

                    // Map tool names to preparation shimmer texts
                    if (toolName === 'pdf_tool') {
                      shimmerText = 'Preparing document...';
                    } else if (toolName === 'image_generation_tool') {
                      shimmerText = 'Preparing images...';
                    } else if (toolName === 'edit_image') {
                      shimmerText = 'Editing image...';
                    }
                    // Skip web_search - already has its own 2-stage system

                    if (toolName !== 'web_search') {
                      res.write(JSON.stringify({
                        requestId,
                        type: 'tool_preparing',
                        shimmerText: shimmerText
                      }) + '\n');
                      if (typeof res.flush === 'function') res.flush();
                      console.log('🛠️ [CLAUDE] Tool preparation:', toolName, '→', shimmerText);
                    }
                  }

                  // ✅ WEB SEARCH: Extract search results
                  if (data.content_block?.type === 'web_search_tool_result') {
                    const searchResults = data.content_block?.content || [];

                    // Safety: Handle API errors and rate limits
                    if (!Array.isArray(searchResults)) {
                      console.warn('⚠️ [CLAUDE] Search result not array, skipping:', typeof searchResults);
                      continue;
                    }

                    // Extract and format sources
                    const extractedSources = searchResults
                      .filter(r => r.type === 'web_search_result')
                      .map(r => ({
                        title: r.title || 'Untitled',
                        url: r.url || '',
                        domain: extractDomain(r.url),
                        timestamp: Date.now()
                      }))
                      .filter(s => s.url) // Remove invalid sources
                      .slice(0, 5); // Limit to 5 sources per search

                    // Aggregate sources (append instead of replace)
                    sources = [...sources, ...extractedSources];

                    // Dedupe by URL and limit total
                    const uniqueSources = Array.from(
                      new Map(sources.map(s => [s.url, s])).values()
                    );
                    sources = uniqueSources.slice(0, 20);

                    // Send search_completed event to frontend with all aggregated sources
                    res.write(JSON.stringify({
                      requestId,
                      type: 'search_completed',
                      sources: sources, // Send all deduplicated sources so far
                      message: `Found ${sources.length} sources`
                    }) + '\n');
                    if (typeof res.flush === 'function') res.flush();

                    console.log('✅ [CLAUDE] Web search completed:', sources.length, 'total unique sources');
                  }

                  // Initialize content block
                  if (!contentBlocks[data.index]) {
                    contentBlocks[data.index] = {
                      type: data.content_block?.type,
                      text: '',
                      toolUse: data.content_block?.type === 'tool_use' ? {
                        id: data.content_block?.id,
                        name: data.content_block?.name,
                        input: {}
                      } : null
                    };
                  }
                  break;

                case 'content_block_delta':
                  const delta = data.delta;
                  const index = data.index;

                  if (delta.type === 'text_delta') {
                    // Regular text streaming
                    const textChunk = delta.text;
                    fullText += textChunk;
                    console.log('📝 [CLAUDE] Text delta - block', index, '- length:', textChunk.length);

                    if (contentBlocks[index]) {
                      contentBlocks[index].text += textChunk;
                    }

                    // Stream to frontend
                    res.write(JSON.stringify({
                      requestId,
                      type: 'text',
                      content: textChunk,
                      isThinking: false
                    }) + '\n');
                    if (typeof res.flush === 'function') res.flush();
                  }
                  else if (delta.type === 'thinking_delta') {
                    // Thinking in progress - no need to send content, just log
                    console.log('🧠 [CLAUDE] ⚡ Thinking delta received (Deep Reasoning in progress)');
                    // Frontend already shows "Thinking..." shimmer from content_block_start
                    // We could send thinking text here if we want to show it, but for now just shimmer
                  }
                  else if (delta.type === 'input_json_delta') {
                    // Tool use parameter streaming
                    console.log('🔧 [CLAUDE] Tool input delta - block', index);
                    if (contentBlocks[index] && contentBlocks[index].toolUse) {
                      // Accumulate partial JSON
                      if (!contentBlocks[index].toolUse.partialJson) {
                        contentBlocks[index].toolUse.partialJson = '';
                      }
                      contentBlocks[index].toolUse.partialJson += delta.partial_json;
                    }
                  }
                  else {
                    console.log('⚠️ [CLAUDE] Unknown delta type:', delta.type, '- block', index);
                  }
                  break;

                case 'content_block_stop':
                  console.log('✅ [CLAUDE] Content block stopped:', data.index);

                  // If tool use is complete, parse final input
                  const block = contentBlocks[data.index];
                  if (block && block.toolUse) {
                    try {
                      // Parse JSON if we have partialJson, otherwise use empty object
                      if (block.toolUse.partialJson) {
                        console.log('📏 [CLAUDE] Tool JSON size:', block.toolUse.partialJson.length, 'chars');
                        block.toolUse.input = JSON.parse(block.toolUse.partialJson);
                        console.log('📦 [CLAUDE] Parsed tool input keys:', Object.keys(block.toolUse.input));
                        // Log size of html_content if present
                        if (block.toolUse.input.html_content) {
                          console.log('📄 [CLAUDE] HTML content size:', block.toolUse.input.html_content.length, 'chars');
                        }
                      } else {
                        block.toolUse.input = {};  // Empty input for tools called without parameters
                        console.log('⚠️ [CLAUDE] Tool called without parameters:', block.toolUse.name);
                      }
                      toolUses.push(block.toolUse);
                      console.log('🔧 [CLAUDE] Tool use completed:', block.toolUse.name);
                    } catch (parseError) {
                      console.error('❌ [CLAUDE] Failed to parse tool input:', parseError);
                      console.error('❌ [CLAUDE] Partial JSON that failed:', block.toolUse.partialJson?.substring(0, 500));
                    }
                  }
                  break;

                case 'message_delta':
                  // Handle stop_reason and usage
                  if (data.delta?.stop_reason) {
                    console.log('🛑 [CLAUDE] Stop reason:', data.delta.stop_reason);
                  }
                  break;

                case 'message_stop':
                  console.log('✅ [CLAUDE] Message completed');
                  break;

                case 'error':
                  console.error('❌ [CLAUDE] Stream error:', data.error);
                  hasError = true;

                  // Check for specific error types
                  let errorMessage = data.error?.message || 'Claude API error';
                  if (data.error?.type === 'overloaded_error') {
                    errorMessage = 'Server unavailable, please try again later';
                  }

                  res.write(JSON.stringify({
                    requestId,
                    error: true,
                    rollback: true,  // ✅ Zpráva se vrátí do InputBaru!
                    message: errorMessage
                  }) + '\n');
                  break;
              }
            } catch (parseError) {
              console.warn('⚠️ [CLAUDE] Failed to parse SSE data:', parseError);
              continue;
            }
          }
        }
      }
    } catch (streamError) {
      console.error('💥 [CLAUDE] Stream processing error:', streamError);
      hasError = true;

      res.write(JSON.stringify({
        requestId,
        type: 'error',
        message: 'Stream processing failed: ' + streamError.message
      }) + '\n');
    }

    // Execute tools if any were called
    if (toolUses.length > 0 && !hasError) {
      console.log('🔧 [CLAUDE] Executing', toolUses.length, 'tool(s)...');

      // 🎨 Aggregate all image generation results
      const allImageAssets = [];
      const imageFunctionCalls = [];

      for (const toolUse of toolUses) {
        try {
          if (toolUse.name === 'generate_image') {
            const assets = await executeImageGeneration(toolUse, requestId, res);
            allImageAssets.push(...assets);
            imageFunctionCalls.push(toolUse);
          } else if (toolUse.name === 'edit_image') {
            const assets = await executeImageEdit(toolUse, requestId, res);
            allImageAssets.push(...assets);
            imageFunctionCalls.push(toolUse);
          } else if (toolUse.name === 'generate_pdf') {
            await executePdfGeneration(toolUse, requestId, res);
          } else if (toolUse.name === 'create_artifact') {
            await executeArtifactCreation(toolUse, requestId, res);
          } else if (toolUse.name === 'web_search') {
            // Web search results are already in the response
            console.log('🔍 [CLAUDE] Web search was executed by Claude');
          }
        } catch (toolError) {
          console.error('💥 [CLAUDE] Tool execution error:', toolError);
          res.write(JSON.stringify({
            requestId,
            type: 'error',
            message: `Tool ${toolUse.name} failed: ${toolError.message}`
          }) + '\n');
        }
      }

      // 🔧 Send aggregated function_response for ALL image generations
      if (allImageAssets.length > 0) {
        // Send function_call for FIRST image generation (Claude expects this)
        res.write(JSON.stringify({
          requestId,
          type: 'function_call',
          functionCall: {
            id: imageFunctionCalls[0].id,
            name: imageFunctionCalls[0].name,
            input: imageFunctionCalls[0].input
          }
        }) + '\n');
        if (typeof res.flush === 'function') res.flush();

        // Send SINGLE function_response with ALL assets (prevents frontend overwrite)
        res.write(JSON.stringify({
          requestId,
          type: 'function_response',
          functionResponse: {
            name: 'generate_image',
            response: {
              success: true,
              imageCount: allImageAssets.length,
              assets: allImageAssets.map(asset => ({
                asset_id: asset.asset_id,
                url: asset.storageUrl,
                model: asset.model,
                operation: asset.operation,
                prompt: asset.prompt,
                timestamp: asset.timestamp
              }))
            }
          }
        }) + '\n');
        if (typeof res.flush === 'function') res.flush();

        console.log(`✅ [CLAUDE] Aggregated function_response sent with ${allImageAssets.length} images`);
      }
    }

    // Send final completion
    if (!hasError) {
      res.write(JSON.stringify({
        requestId,
        type: 'completed',
        sources: sources,
        webSearchUsed: sources.length > 0
      }) + '\n');
      console.log('✅ [CLAUDE] Streaming completed');
    }

    if (typeof res.flush === 'function') res.flush();
    res.end();

  } catch (error) {
    console.error('💥 [CLAUDE] Fatal error:', error);

    res.write(JSON.stringify({
      requestId: req.body?.requestId,
      error: true,
      rollback: true,
      message: 'Server error: ' + error.message
    }) + '\n');
    res.end();
  }
}

// Helper: Prepare messages for Claude
function prepareClaudeMessages(messages) {
  try {
    // 1. Filter valid messages and build multimodal content arrays
    const validMessages = messages
      .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
      .map((msg, msgIndex, allMsgs) => {
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        const contentArray = [];

        // Prepare attachment blocks (will be added AFTER user text)
        const attachmentBlocks = [];

        // Check if this is the last user message (for vision block optimization)
        const isLastUserMessage = msgIndex === allMsgs.length - 1 && msg.sender === 'user';

        if (msg.attachments && msg.attachments.length > 0) {
          // 🔗 FIRST: Prepare text block with image URLs (for edit_image tool)
          const imageAttachments = msg.attachments.filter(att => att.type?.startsWith('image/'));
          if (imageAttachments.length > 0) {
            const imageRefs = imageAttachments.map((att, idx) => {
              const url = att.supabaseUrl || att.storageUrl || att.previewUrl;
              const fileIdText = att.claudeFileId ? ` [file_id: ${att.claudeFileId}]` : '';
              return url
                ? `${idx + 1}. 🖼️ ${att.name || 'unnamed'} (${url})${fileIdText}`
                : `${idx + 1}. 🖼️ ${att.name || 'unnamed'}${fileIdText}`;
            }).join('\n');

            contentArray.push({
              type: "text",
              text: `--- ATTACHED IMAGES ---\n${imageRefs}`
            });
            console.log(`🔗 [CLAUDE-API] Added image URL references for ${imageAttachments.length} image(s)`);
          }

          // 🎯 OPTIMIZATION: Add vision blocks ONLY for last user message to save tokens
          // Other messages get text reference with file_id for edit_image tool
          if (isLastUserMessage) {
            msg.attachments.forEach(att => {

              // 🖼️ IMAGES: Prioritize file_id (faster vision), fallback to URL
              if (att.type?.startsWith('image/')) {
                // Option A: Use Files API file_id (optimized - image on Anthropic servers)
                if (att.claudeFileId) {
                  attachmentBlocks.push({
                    type: "image",
                    source: {
                      type: "file",
                      file_id: att.claudeFileId
                    }
                  });
                  console.log(`🖼️ [CLAUDE-API] Image via Files API (CURRENT): ${att.name || 'unnamed'} (file_id: ${att.claudeFileId})`);
                }
                // Option B: Fallback to URL (if Files API upload failed or old message)
                else {
                  const url = att.supabaseUrl || att.storageUrl || att.previewUrl;
                  if (url && url.startsWith('http')) {
                    attachmentBlocks.push({
                      type: "image",
                      source: {type: "url", url: url}
                    });
                    console.log(`🖼️ [CLAUDE-API] Image via URL (CURRENT, fallback): ${att.name || 'unnamed'}`);
                  } else {
                    console.warn(`⚠️ [CLAUDE-API] Missing file_id and URL for image: ${att.name || 'unnamed'}`);
                  }
                }
              }
              // 📄 DOCUMENTS: Prioritize file_id (optimized for document processing)
              else if (att.claudeFileId) {
                attachmentBlocks.push({
                  type: "document",
                  source: {
                    type: "file",
                    file_id: att.claudeFileId
                  }
                });
                console.log(`📄 [CLAUDE-API] Document via Files API (CURRENT): ${att.name || 'unnamed'}`);
              }
              // 📄 DOCUMENTS: Fallback to URL
              else if (att.type) {
                const url = att.supabaseUrl || att.storageUrl || att.previewUrl;
                if (url && url.startsWith('http')) {
                  attachmentBlocks.push({
                    type: "document",
                    source: {type: "url", url: url}
                  });
                  console.log(`📄 [CLAUDE-API] Document via URL (CURRENT): ${att.name || 'unnamed'}`);
                } else {
                  console.warn(`⚠️ [CLAUDE-API] Missing file_id and URL for: ${att.name || 'unnamed'}`);
                }
              }
            });
          } else {
            console.log(`⏭️ [CLAUDE-API] Skipping ${msg.attachments.length} attachment block(s) (not last user msg) - file_id/URL refs in text`);
          }
        }

        // Add text content BEFORE attachments (user instruction comes first)
        const text = msg.aiText || msg.text || msg.content || '';
        if (text.trim()) {
          contentArray.push({
            type: "text",
            text: text
          });
        }

        // Add attachment blocks AFTER user text (visual context comes last)
        if (attachmentBlocks.length > 0) {
          contentArray.push(...attachmentBlocks);
          console.log(`📎 [CLAUDE-API] Added ${attachmentBlocks.length} attachment block(s) after user text`);
        }

        // 🔧 Add tool_use block for assistant messages (required before tool_result)
        if (role === 'assistant' && msg.functionCall) {
          console.log('🔧 [CLAUDE-API] Adding tool_use block:', msg.functionCall.name);
          contentArray.push({
            type: "tool_use",
            id: msg.functionCall.id,
            name: msg.functionCall.name,
            input: msg.functionCall.input
          });
        }

        // NOTE: tool_result blocks are handled separately (must be in user messages)

        return {
          role: role,
          content: contentArray.length > 0 ? contentArray : '',
          _original: msg  // Keep reference for tool_result handling
        };
      })
      .filter(msg => {
        // Keep messages with content (string or non-empty array)
        if (typeof msg.content === 'string') {
          return msg.content.trim().length > 0;
        }
        return msg.content.length > 0;
      });

    // 1.5. Insert tool_result user messages after assistant messages with tool calls
    // Claude API requires tool_result to be in USER messages, not assistant messages
    const withToolResults = [];
    for (const msg of validMessages) {
      withToolResults.push(msg);

      // If this is assistant message with tool call, insert separate user message with tool_result
      if (msg.role === 'assistant' && msg._original?.functionCall && msg._original?.functionResponse) {
        console.log('🔧 [CLAUDE-API] Inserting tool_result user message for:', msg._original.functionResponse.name);
        withToolResults.push({
          role: 'user',
          content: [{
            type: "tool_result",
            tool_use_id: msg._original.functionCall.id,
            content: JSON.stringify(msg._original.functionResponse.response)
          }]
        });
      }
    }

    // 2. Ensure alternation - merge consecutive same roles
    const alternated = [];
    for (const msg of withToolResults) {
      const last = alternated[alternated.length - 1];
      if (!last || last.role !== msg.role) {
        alternated.push(msg);
      } else {
        // Merge content if same role (handle both strings and arrays)
        if (typeof last.content === 'string' && typeof msg.content === 'string') {
          last.content += '\n\n' + msg.content;
        } else if (Array.isArray(last.content) && Array.isArray(msg.content)) {
          last.content = last.content.concat(msg.content);
        } else if (Array.isArray(last.content) && typeof msg.content === 'string') {
          last.content.push({type: "text", text: msg.content});
        } else if (typeof last.content === 'string' && Array.isArray(msg.content)) {
          last.content = [{type: "text", text: last.content}].concat(msg.content);
        }
      }
    }

    // 3. Must start with user message
    if (alternated.length > 0 && alternated[0].role === 'assistant') {
      alternated.shift();
    }

    // 4. Must end with user message
    if (alternated.length > 0 && alternated[alternated.length - 1].role === 'assistant') {
      alternated.pop();
    }

    // 5. Clean up internal properties before sending to Claude API
    const cleanMessages = alternated.map(msg => {
      const { _original, ...cleanMsg } = msg;
      return cleanMsg;
    });

    return cleanMessages;
  } catch (error) {
    console.error('❌ [CLAUDE] Error preparing messages:', error);
    return [];
  }
}

// Helper: Execute image generation tool
async function executeImageGeneration(toolUse, requestId, res) {
  console.log('🎨 [CLAUDE] Executing image generation...');

  res.write(JSON.stringify({
    requestId,
    type: 'image_generation_start',
    message: 'Generating images...'
  }) + '\n');
  if (typeof res.flush === 'function') res.flush();

  const { prompt, imageCount = 1, aspectRatio = '1:1' } = toolUse.input;

  // Initialize Vertex AI for Flash-Image
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT_ID,
    location: 'us-central1',
    googleAuthOptions: {
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    }
  });

  const flashImageModel = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image'
  });

  console.log('🎨 [FLASH-IMAGE] Generating with prompt:', prompt.substring(0, 50) + '...');
  console.log('🎨 [FLASH-IMAGE] Requested count:', imageCount);
  console.log('🎨 [FLASH-IMAGE] Aspect ratio:', aspectRatio);

  // Generate images (Flash-Image limitation: sequential calls)
  const images = [];
  const finalImageCount = Math.min(Math.max(1, imageCount), 3);

  for (let i = 0; i < finalImageCount; i++) {
    console.log(`🎨 [FLASH-IMAGE] Generating image ${i + 1}/${finalImageCount}...`);

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

  // 🚀 UPLOAD IMAGES TO SUPABASE
  console.log('📤 [UPLOAD] Uploading', images.length, 'images to Supabase...');
  const timestamp = Date.now();

  const uploadedAssets = await Promise.all(
    images.map(async (img, index) => {
      const filename = `generated-${timestamp}-${index}.png`;
      const { url, path } = await uploadImageToSupabase(img.base64, filename);

      return {
        asset_id: `img_${timestamp}_${index}`,
        storageUrl: url,  // ✅ Frontend expects storageUrl property
        storagePath: path,
        model: 'gemini-2.5-flash-image',
        operation: 'generate',
        timestamp: new Date().toISOString(),
        index: index,
        prompt: prompt,
        mimeType: img.mimeType
      };
    })
  );

  console.log('✅ [UPLOAD] All images uploaded');

  // Send images with metadata to frontend
  res.write(JSON.stringify({
    requestId,
    type: 'image_generated',
    images: uploadedAssets
  }) + '\n');
  if (typeof res.flush === 'function') res.flush();

  console.log('✅ [CLAUDE] Flash-Image complete:', uploadedAssets.length, 'images');

  // ✅ RETURN assets (aggregated by caller, prevents overwrite bug)
  return uploadedAssets;
}

// Helper: Execute image editing tool
async function executeImageEdit(toolUse, requestId, res) {
  console.log('✏️ [CLAUDE] Executing image edit...');

  res.write(JSON.stringify({
    requestId,
    type: 'image_generation_start',  // Reuse same event (frontend already handles it)
    message: 'Editing image...'
  }) + '\n');
  if (typeof res.flush === 'function') res.flush();

  const { image_url, prompt } = toolUse.input;

  // Initialize Vertex AI for Flash-Image
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT_ID,
    location: 'us-central1',
    googleAuthOptions: {
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    }
  });

  const flashImageModel = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      responseModalities: ['IMAGE']  // Only image output, no text
    }
  });

  console.log('✏️ [FLASH-IMAGE] Editing image:', image_url.substring(0, 60) + '...');
  console.log('✏️ [FLASH-IMAGE] Edit instruction:', prompt.substring(0, 50) + '...');

  // Append aspect ratio and orientation instructions to prompt (Gemini API ignores aspectRatio config during editing)
  const fullPrompt = `${prompt.trim()}. Keep the original image aspect ratio. Keep the exact same orientation as the input image. Do not rotate, flip, or mirror.`;

  // Call Gemini with existing image + edit instruction
  const result = await flashImageModel.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          fileData: {
            fileUri: image_url,
            mimeType: 'image/png'
          }
        },
        { text: fullPrompt }
      ]
    }]
  });

  // Extract edited image from response
  const candidates = result.response.candidates;
  let editedImageData = null;

  if (candidates && candidates.length > 0) {
    for (const candidate of candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            editedImageData = {
              base64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png'
            };
            console.log('✅ [FLASH-IMAGE] Image edited successfully');
            break;
          }
        }
      }
      if (editedImageData) break;
    }
  }

  if (!editedImageData) {
    throw new Error('No edited image returned from Gemini Flash-Image');
  }

  // 🚀 UPLOAD EDITED IMAGE TO SUPABASE
  console.log('📤 [UPLOAD] Uploading edited image to Supabase...');
  const timestamp = Date.now();
  const filename = `edited-${timestamp}.png`;
  const { url, path } = await uploadImageToSupabase(editedImageData.base64, filename);

  const uploadedAsset = {
    asset_id: `img_${timestamp}_edited`,
    storageUrl: url,
    storagePath: path,
    model: 'gemini-2.5-flash-image',
    operation: 'edit',
    timestamp: new Date().toISOString(),
    index: 0,
    prompt: prompt,
    original_url: image_url,  // Link to original image
    mimeType: editedImageData.mimeType
  };

  console.log('✅ [UPLOAD] Edited image uploaded');

  // Send edited image with metadata to frontend
  res.write(JSON.stringify({
    requestId,
    type: 'image_generated',
    images: [uploadedAsset]  // Array format (consistent with generation)
  }) + '\n');
  if (typeof res.flush === 'function') res.flush();

  console.log('✅ [CLAUDE] Image edit complete');

  // ✅ RETURN assets (aggregated by caller)
  return [uploadedAsset];
}

// Helper: Execute PDF generation tool
async function executePdfGeneration(toolUse, requestId, res) {
  console.log('📄 [CLAUDE] Executing PDF generation...');

  res.write(JSON.stringify({
    requestId,
    type: 'pdf_generation_start',
    message: 'Generating PDF...'
  }) + '\n');
  if (typeof res.flush === 'function') res.flush();

  const { title, content, documentType = 'document' } = toolUse.input;

  // Call PDF API
  const baseUrl = process.env.NODE_ENV === 'production' ?
    `https://${process.env.VERCEL_URL}` :
    'http://localhost:3001';

  const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, documentType })
  });

  if (pdfResponse.ok) {
    const contentType = pdfResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/pdf')) {
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const uint8Array = new Uint8Array(pdfBuffer);

      // Convert to base64
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64PDF = btoa(binaryString);

      res.write(JSON.stringify({
        requestId,
        type: 'pdf_generated',
        title,
        base64: base64PDF,
        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      }) + '\n');
      if (typeof res.flush === 'function') res.flush();

      // 🔧 Send function response for conversation history (like Gemini does)
      res.write(JSON.stringify({
        requestId,
        type: 'function_response',
        functionResponse: {
          name: 'generate_pdf',
          response: { success: true, title: title }
        }
      }) + '\n');
      if (typeof res.flush === 'function') res.flush();

      console.log('✅ [CLAUDE] PDF generated:', title);
      console.log('🔧 [CLAUDE] Function response sent to frontend');
    } else {
      // Fallback HTML
      const fallbackData = await pdfResponse.json();
      res.write(JSON.stringify({
        requestId,
        type: 'pdf_fallback',
        title,
        html: fallbackData.html
      }) + '\n');
    }
  } else {
    throw new Error(`PDF API failed: ${pdfResponse.status}`);
  }
}

// Helper: Execute artifact creation tool
async function executeArtifactCreation(toolUse, requestId, res) {
  console.log('🎨 [ARTIFACT] Executing artifact creation...');

  res.write(JSON.stringify({
    requestId,
    type: 'artifact_creation_start',
    message: 'Creating artifact...'
  }) + '\n');
  if (typeof res.flush === 'function') res.flush();

  const { title, html_content, artifact_type = 'app' } = toolUse.input;

  // Call Artifact API
  const baseUrl = process.env.NODE_ENV === 'production' ?
    `https://${process.env.VERCEL_URL}` :
    'http://localhost:3001';

  const artifactResponse = await fetch(`${baseUrl}/api/generate-artifact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, html_content, artifact_type })
  });

  if (artifactResponse.ok) {
    const artifactData = await artifactResponse.json();

    // Send artifact with base64 (like PDF does)
    res.write(JSON.stringify({
      requestId,
      type: 'artifact_created',
      artifact: {
        title: artifactData.title,
        filename: artifactData.filename,
        base64: artifactData.base64,
        timestamp: artifactData.timestamp,
        artifact_type: artifactData.artifact_type
      }
    }) + '\n');
    if (typeof res.flush === 'function') res.flush();

    // 🔧 Send function response for conversation history (like PDF/images)
    res.write(JSON.stringify({
      requestId,
      type: 'function_response',
      functionResponse: {
        name: 'create_artifact',
        response: { success: true, title: title }
      }
    }) + '\n');
    if (typeof res.flush === 'function') res.flush();

    console.log('✅ [ARTIFACT] Created:', title);
    console.log('🔧 [ARTIFACT] Function response sent to Claude');
  } else {
    throw new Error(`Artifact API failed: ${artifactResponse.status}`);
  }
}

// Helper: Extract domain from URL
function extractDomain(url) {
  if (!url || typeof url !== 'string') return 'Unknown';

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'Unknown';
  }
}
