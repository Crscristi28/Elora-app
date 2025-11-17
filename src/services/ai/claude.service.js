// 🤖 CLAUDE SERVICE - MODERNIZED FOR SONNET 4.5
// 🎯 Real SSE streaming with custom tools support
// 💰 Prompt caching for 90% cost savings
// 🔥 Parallel tool execution

import { profileService } from '../profile/profileService.js';
import { authService } from '../auth/supabaseAuth.js';
import detectLanguage from '../../utils/text/smartLanguageDetection.js';
import { getEloraClaudeSystemPrompt } from '../../prompts/omnia-claude-optimized.js';
import { safeSlice } from '../../utils/stringUtils.js';

const claudeService = {
  async sendMessage(messages, onStreamUpdate = null, onSearchStart = null, onImageGenerationStart = null, onPdfGenerationStart = null, onArtifactCreationStart = null, documents = [], imageMode = false, pdfMode = false, summary = null, deepReasoning = false, model = 'claude-sonnet-4.5') {
    try {
      // Generate unique request ID for concurrent user isolation
      const requestId = Date.now() + '-' + Math.random().toString(36).substring(2, 11);
      console.log('🤖 Claude Sonnet 4.5 - Real SSE Streaming [ID:', requestId, ']');
      console.log(`💡 [CLAUDE] Deep Reasoning: ${deepReasoning ? 'ON ⚡ (expecting thinking chunks)' : 'OFF 🚀 (no thinking)'}`);

      const claudeMessages = this.prepareClaudeMessages(messages);

      // Detect language from last user message
      const lastUserMessage = messages[messages.length - 1];
      const detectedLanguage = detectLanguage(lastUserMessage?.text || lastUserMessage?.content || '');

      const systemPrompt = await this.getEloraPrompt();

      // Log summary status for debugging
      if (summary) {
        console.log('📊 [CLAUDE] Sending summary to backend:', summary.length, 'chars');
      } else {
        console.log('📊 [CLAUDE] No summary to send');
      }

      // Get auth token for server-side role detection
      const session = await authService.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated - session required');
      }

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          requestId: requestId,
          messages: claudeMessages,
          system: systemPrompt,
          summary: summary,  // ✅ Send summary separately for system prompt injection
          max_tokens: 8000,
          documents: documents,
          imageMode: imageMode,
          pdfMode: pdfMode,
          language: detectedLanguage,
          deepReasoning: deepReasoning,  // 💡 Deep Reasoning toggle
          modelId: model  // ✅ Model selection (Haiku or Sonnet)
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API failed: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let fullText = '';
      let buffer = '';
      let sourcesExtracted = [];
      let generatedImages = [];

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);

                // Only process chunks that belong to this request
                if (data.requestId && data.requestId !== requestId) {
                  console.log('⚠️ [CLAUDE] Ignoring chunk from different request:', data.requestId);
                  continue;
                }

                // Handle thinking chunks
                if (data.type === 'thinking' && data.isThinking) {
                  console.log('🧠 [CLAUDE] ⚡ THINKING CHUNK DETECTED - Deep Reasoning is ON');
                  if (onStreamUpdate) {
                    onStreamUpdate('', { isThinking: true });
                  }
                }
                else if (data.type === 'text' && data.content) {
                  fullText += data.content;
                  if (onStreamUpdate) {
                    onStreamUpdate(data.content, { isThinking: false });
                  }
                }
                else if (data.type === 'search_start') {
                  console.log('🔍 [CLAUDE] Web search detected');
                  if (onSearchStart) {
                    onSearchStart();
                  }
                }
                else if (data.type === 'search_completed') {
                  console.log('✅ [CLAUDE] Web search completed:', data.sources?.length, 'sources');
                  if (data.sources) {
                    sourcesExtracted = data.sources;
                    if (onStreamUpdate) {
                      onStreamUpdate('', {
                        searchCompleted: true,
                        sources: data.sources
                      });
                    }
                  }
                }
                else if (data.type === 'image_generation_start') {
                  console.log('🎨 [CLAUDE] Image generation start');
                  if (onImageGenerationStart) {
                    onImageGenerationStart();
                  }
                }
                else if (data.type === 'pdf_generation_start') {
                  console.log('📄 [CLAUDE] PDF generation start');
                  if (onPdfGenerationStart) {
                    onPdfGenerationStart();
                  }
                }
                else if (data.type === 'tool_preparing') {
                  console.log('🛠️ [CLAUDE] Tool preparing:', data.shimmerText);
                  if (onStreamUpdate) {
                    onStreamUpdate('', {
                      type: 'tool_preparing',
                      shimmerText: data.shimmerText
                    });
                  }
                }
                else if (data.type === 'image_generated') {
                  console.log('🎨 [CLAUDE] Images received:', data.images?.length);
                  if (data.images) {
                    generatedImages.push(...data.images);  // ✅ Accumulate images from multiple tool calls
                    if (onStreamUpdate) {
                      onStreamUpdate('', { images: data.images });  // ✅ Streaming continues
                    }
                  }
                }
                else if (data.type === 'function_call') {
                  console.log('🔧 [CLAUDE] Function call received:', data.functionCall?.name);
                  if (onStreamUpdate && data.functionCall) {
                    onStreamUpdate('', { functionCall: data.functionCall });
                  }
                }
                else if (data.type === 'function_response') {
                  console.log('🔧 [CLAUDE] Function response received:', data.functionResponse?.name);
                  if (onStreamUpdate && data.functionResponse) {
                    onStreamUpdate('', { functionResponse: data.functionResponse });
                  }
                }
                else if (data.type === 'pdf_generated') {
                  console.log('📄 [CLAUDE] PDF received:', data.title);
                  const pdfData = {
                    title: data.title,
                    base64: data.base64,
                    filename: data.filename
                  };
                  if (onStreamUpdate) {
                    onStreamUpdate('', { pdf: pdfData });  // ✅ Streaming continues
                  }
                }
                else if (data.type === 'pdf_fallback') {
                  console.log('📄 [CLAUDE] PDF fallback (HTML):', data.title);
                  const fallbackMessage = '⚠️ PDF generation temporarily unavailable. Content generated as HTML format.';
                  if (onStreamUpdate) {
                    onStreamUpdate(fallbackMessage, {  // ✅ Streaming continues
                      fallbackMessage: true,
                      htmlContent: data.html,
                      title: data.title
                    });
                  }
                }
                else if (data.type === 'artifact_created') {
                  console.log('🎨 [CLAUDE] Artifact created:', data.artifact.title);
                  if (onStreamUpdate) {
                    onStreamUpdate('', { artifact: data.artifact });  // ✅ Streaming continues
                  }
                }
                else if (data.type === 'artifact_creation_start') {
                  console.log('🎨 [CLAUDE] Artifact creation start');
                  if (onArtifactCreationStart) {
                    onArtifactCreationStart();
                  }
                }
                else if (data.type === 'completed') {
                  if (data.webSearchUsed) {
                    sourcesExtracted = this.extractSearchSources(data);
                  }

                  if (onStreamUpdate) {
                    onStreamUpdate('', { completed: true, sources: sourcesExtracted });
                  }
                }
                else if (data.error) {
                  // Check if this is a rollback error
                  if (data.rollback) {
                    const rollbackError = new Error(data.message || 'Service error - please try again');
                    rollbackError.isRollback = true;
                    throw rollbackError;
                  } else {
                    throw new Error(data.message || 'Streaming error');
                  }
                }

              } catch (parseError) {
                // Re-throw rollback errors
                if (parseError.isRollback) {
                  throw parseError;
                }
                // Continue for JSON parse errors
                continue;
              }
            }
          }
        }
      } catch (streamError) {
        console.error('💥 [CLAUDE] Streaming read error:', streamError);
        throw streamError;
      }

      return {
        text: fullText,
        sources: sourcesExtracted,
        webSearchUsed: sourcesExtracted.length > 0,
        images: generatedImages
      };

    } catch (error) {
      console.error('💥 [CLAUDE] Error:', error);
      throw error;
    }
  },

  prepareClaudeMessages(messages) {
    try {
      const validMessages = messages.filter(msg =>
        msg.sender === 'user' || msg.sender === 'bot'
      );

      let claudeMessages = validMessages.map(msg => {
        // Use aiText for AI processing if available
        const messageText = msg.aiText || msg.text || '';

        const claudeMsg = {
          sender: msg.sender,
          text: messageText,
          content: messageText,
          attachments: msg.attachments || []  // ✅ PRESERVE ATTACHMENTS!
        };

        // ✅ PRESERVE FUNCTION CALL/RESPONSE (like Gemini does)
        if (msg.hasFunctionCall && msg.functionCall) {
          claudeMsg.hasFunctionCall = msg.hasFunctionCall;
          claudeMsg.functionCall = msg.functionCall;
        }
        if (msg.functionResponse) {
          claudeMsg.functionResponse = msg.functionResponse;
        }

        return claudeMsg;
      });

      // Return all messages from current chat (no artificial limit)
      // Each chat is isolated, so full context is preserved per chat
      return claudeMessages;

    } catch (error) {
      console.error('❌ [CLAUDE] Error preparing messages:', error);
      const lastUserMessage = messages.filter(msg => msg.sender === 'user').slice(-1);
      return lastUserMessage.map(msg => {
        const messageText = msg.aiText || msg.text || '';
        const claudeMsg = {
          sender: 'user',
          text: messageText,
          content: messageText,
          attachments: msg.attachments || []  // ✅ PRESERVE ATTACHMENTS!
        };

        // ✅ PRESERVE FUNCTION CALL/RESPONSE (like Gemini does)
        if (msg.hasFunctionCall && msg.functionCall) {
          claudeMsg.hasFunctionCall = msg.hasFunctionCall;
          claudeMsg.functionCall = msg.functionCall;
        }
        if (msg.functionResponse) {
          claudeMsg.functionResponse = msg.functionResponse;
        }

        return claudeMsg;
      });
    }
  },

  // 🔗 SOURCES EXTRACTION - Keeping the working implementation
  extractSearchSources(data) {
    try {
      console.log('🔍 [CLAUDE] Extracting sources from Claude data');

      let rawSources = [];

      // Method 1: Direct sources array
      if (data.sources && Array.isArray(data.sources)) {
        rawSources = data.sources;
      }
      // Method 2: Web search results
      else if (data.webSearchResults && Array.isArray(data.webSearchResults)) {
        rawSources = data.webSearchResults;
      }
      // Method 3: Search data nested
      else if (data.searchData && data.searchData.sources) {
        rawSources = data.searchData.sources;
      }
      // Method 4: Tool results
      else if (data.toolResults && Array.isArray(data.toolResults)) {
        rawSources = data.toolResults
          .filter(result => result.type === 'web_search')
          .flatMap(result => result.sources || result.results || []);
      }

      if (rawSources.length === 0) {
        return [];
      }

      // Clean and format sources
      const cleanSources = rawSources
        .filter(source => source && typeof source === 'object')
        .map(source => {
          const url = source.url || source.link || source.href || '';
          const title = source.title || source.name || source.headline || 'Untitled';

          if (!url || !this.isValidUrl(url)) {
            return null;
          }

          return {
            title: this.cleanTitle(title),
            url: this.cleanUrl(url),
            domain: this.extractDomain(url),
            timestamp: source.timestamp || Date.now()
          };
        })
        .filter(source => source !== null)
        .slice(0, 20); // Limit to 20 sources (backend sends up to 20 deduplicated)

      return cleanSources;

    } catch (error) {
      console.error('💥 [CLAUDE] Error extracting sources:', error);
      return [];
    }
  },

  // Helper functions for sources
  cleanTitle(title) {
    if (!title || typeof title !== 'string') return 'Untitled';
    return safeSlice(title.trim().replace(/\s+/g, ' '), 100);
  },

  cleanUrl(url) {
    if (!url || typeof url !== 'string') return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.href;
    } catch (error) {
      return url;
    }
  },

  extractDomain(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return 'Unknown';
    }
  },

  isValidUrl(url) {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  // 🎯 GET ELORA PROMPT FOR CLAUDE
  async getEloraPrompt() {
    // Get user's preferred name for personalization
    const userName = await profileService.getUserNameForAI();

    if (userName) {
      console.log(`🎯 [CLAUDE] Using personalized prompt with user name: "${userName}"`);
    } else {
      console.log('🎯 [CLAUDE] Using default prompt (no user name set)');
    }

    return getEloraClaudeSystemPrompt(userName);
  }
};

export default claudeService;
