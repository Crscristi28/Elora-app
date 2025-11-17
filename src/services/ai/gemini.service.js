// 🤖 GEMINI SERVICE - ELORA 2.0 WITH GOOGLE SEARCH GROUNDING
// 🎯 Smart, human-like assistant with Google Search integration
// 🔥 Google native search grounding for current data

import { profileService } from '../profile/profileService.js';
import { authService } from '../auth/supabaseAuth.js';
import detectLanguage from '../../utils/text/smartLanguageDetection.js';
import { getEloraSystemPrompt } from '../../prompts/omnia.js';
import { safeSlice } from '../../utils/stringUtils.js';

const geminiService = {
  async sendMessage(messages, onStreamUpdate = null, onSearchStart = null, onImageGenerationStart = null, onPdfGenerationStart = null, documents = [], imageMode = false, pdfMode = false, summary = null, deepReasoning = false) {
    try {
      // Generate unique request ID for concurrent user isolation
      const requestId = Date.now() + '-' + Math.random().toString(36).substring(2, 11);
      console.log('🤖 Elora Gemini 2.5 Flash - Google Grounding [ID:', requestId, ']');
      
      const geminiMessages = this.prepareGeminiMessages(messages);

      // Detect language from last user message for backend processing
      const lastUserMessage = messages[messages.length - 1];
      const detectedLanguage = detectLanguage(lastUserMessage?.text || lastUserMessage?.content || '');

      const systemPrompt = await this.getEloraPrompt(imageMode, detectedLanguage);

      // Log summary status for debugging (same as Claude)
      if (summary) {
        console.log('📊 [GEMINI] Sending summary to backend:', summary.length, 'chars');
      } else {
        console.log('📊 [GEMINI] No summary to send');
      }

      // Get auth token for server-side role detection
      const session = await authService.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated - session required');
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          requestId: requestId,
          messages: geminiMessages,
          system: systemPrompt,
          summary: summary,  // ✅ Send summary separately for system prompt injection
          max_tokens: 8000,
          documents: documents,
          imageMode: imageMode,
          pdfMode: pdfMode,
          language: detectedLanguage,
          deepReasoning: deepReasoning  // 💡 Deep Reasoning toggle
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API failed: HTTP ${response.status}`);
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
                  console.log('⚠️ Ignoring chunk from different request:', data.requestId);
                  continue;
                }
                
                // 🧠 Handle thinking chunks
                if (data.type === 'thinking' && data.isThinking) {
                  console.log('🧠 Thinking mode detected for request:', requestId);
                  if (onStreamUpdate) {
                    // Pass thinking signal to callback via third parameter
                    onStreamUpdate('', { isThinking: true });
                  }
                }
                else if (data.type === 'text' && data.content) {
                  fullText += data.content;
                  if (onStreamUpdate) {
                    // Pass isThinking: false for normal text chunks
                    onStreamUpdate(data.content, { isThinking: false });
                  }
                }
                else if (data.type === 'search_start') {
                  console.log('🔍 Google Search detected for request:', requestId);
                  if (onSearchStart) {
                    onSearchStart();
                  }
                }
                else if (data.type === 'image_generation_start') {
                  console.log('🎨 Image generation start detected for request:', requestId);
                  if (onImageGenerationStart) {
                    onImageGenerationStart();
                  }
                }
                else if (data.type === 'pdf_generation_start') {
                  console.log('📄 PDF generation start detected for request:', requestId);
                  if (onPdfGenerationStart) {
                    onPdfGenerationStart();
                  }
                }
                else if (data.type === 'tool_preparing') {
                  console.log('🛠️ [GEMINI] Tool preparing:', data.shimmerText);
                  if (onStreamUpdate) {
                    onStreamUpdate('', {
                      type: 'tool_preparing',
                      shimmerText: data.shimmerText
                    });
                  }
                }
                else if (data.type === 'image_generated') {
                  console.log('🎨 Images received from tool call:', data.images?.length);
                  if (data.images) {
                    generatedImages = data.images;
                    if (onStreamUpdate) {
                      // Pass images as third parameter
                      onStreamUpdate('', { images: data.images });  // ✅ Streaming continues
                    }
                  }
                }
                else if (data.type === 'pdf_generated') {
                  console.log('📄 PDF received from tool call:', data.title);
                  const pdfData = {
                    title: data.title,
                    base64: data.base64,
                    filename: data.filename
                  };
                  if (onStreamUpdate) {
                    // Pass PDF as third parameter
                    onStreamUpdate('', { pdf: pdfData });  // ✅ Streaming continues
                  }
                }
                else if (data.type === 'pdf_fallback') {
                  console.log('📄 PDF fallback received (HTML format):', data.title);
                  console.log('⚠️ Puppeteer failed on Vercel, falling back to HTML content');

                  // Show user message about fallback
                  const fallbackMessage = '⚠️ PDF generation temporarily unavailable on Vercel (Puppeteer limitations). PDF content generated as HTML format.';
                  if (onStreamUpdate) {
                    onStreamUpdate(fallbackMessage, {
                      fallbackMessage: true,
                      htmlContent: data.html,
                      title: data.title
                    });
                  }
                }
                else if (data.type === 'function_call') {
                  console.log('🔧 Function call detected:', data.functionCall?.name);
                  if (onStreamUpdate) {
                    // Pass function call info to frontend for storage
                    onStreamUpdate('', { functionCall: data.functionCall });
                  }
                }
                else if (data.type === 'function_response') {
                  console.log('🔧 Function response received:', data.functionResponse?.name);
                  if (onStreamUpdate) {
                    // Pass function response info to frontend for storage
                    onStreamUpdate('', { functionResponse: data.functionResponse });
                  }
                }
                else if (data.type === 'search_completed') {
                  console.log('✅ [GEMINI] Search completed, sources:', data.sources?.length || 0);
                  if (data.sources) {
                    sourcesExtracted = data.sources;
                    if (onStreamUpdate) {
                      // Pass searchCompleted flag to clear shimmer
                      onStreamUpdate('', {
                        searchCompleted: true,
                        sources: data.sources
                      });
                    }
                  }
                }
                else if (data.type === 'completed') {
                  if (data.webSearchUsed) {
                    sourcesExtracted = this.extractGoogleSources(data);
                  }

                  if (onStreamUpdate) {
                    onStreamUpdate('', { completed: true, sources: sourcesExtracted }); // Completion signal with sources
                  }
                }
                else if (data.error) {
                  // Check if this is a rollback error (429, server issues, etc.)
                  if (data.rollback) {
                    const rollbackError = new Error(data.message || 'Service error - please try again');
                    rollbackError.isRollback = true; // Mark for App.jsx rollback handling
                    throw rollbackError;
                  } else {
                    throw new Error(data.message || 'Streaming error');
                  }
                }

              } catch (parseError) {
                // Re-throw rollback errors - don't swallow them
                if (parseError.isRollback) {
                  throw parseError;
                }
                // Continue for actual JSON parse errors
                continue;
              }
            }
          }
        }
      } catch (streamError) {
        console.error('💥 Streaming read error:', streamError);
        throw streamError;
      }

      return {
        text: fullText,
        sources: sourcesExtracted,
        webSearchUsed: sourcesExtracted.length > 0,
        images: generatedImages
      };

    } catch (error) {
      console.error('💥 Gemini error:', error);
      throw error;
    }
  },

  prepareGeminiMessages(messages) {
    try {
      const validMessages = messages.filter(msg =>
        msg.sender === 'user' || msg.sender === 'bot'
      );

      let geminiMessages = validMessages.map(msg => {
        // Use aiText for AI processing if available, otherwise fall back to text
        const messageText = msg.aiText || msg.text || '';

        // Base message object
        const geminiMsg = {
          sender: msg.sender,
          text: messageText,
          content: messageText
        };

        // Include function call if exists
        if (msg.hasFunctionCall && msg.functionCall) {
          geminiMsg.functionCall = msg.functionCall;
        }

        // Include function response if exists
        if (msg.functionResponse) {
          geminiMsg.functionResponse = msg.functionResponse;
        }

        return geminiMsg;
      });

      // Return all messages from current chat (no artificial limit)
      // Each chat is isolated, so full context is preserved per chat
      return geminiMessages;

    } catch (error) {
      console.error('Error preparing Gemini messages:', error);
      const lastUserMessage = messages.filter(msg => msg.sender === 'user').slice(-1);
      return lastUserMessage.map(msg => {
        const messageText = msg.aiText || msg.text || '';
        return {
          sender: 'user',
          text: messageText,
          content: messageText
        };
      });
    }
  },

  // 🔗 GOOGLE SOURCES EXTRACTION - Adapted for Gemini grounding metadata
  extractGoogleSources(data) {
    try {
      console.log('🔍 Extracting Google sources from Gemini data');
      
      let rawSources = [];
      
      // Method 1: Direct sources array from Gemini API
      if (data.sources && Array.isArray(data.sources)) {
        rawSources = data.sources;
      }
      // Method 2: Google grounding sources
      else if (data.groundingSources && Array.isArray(data.groundingSources)) {
        rawSources = data.groundingSources;
      }
      // Method 3: Search results
      else if (data.webSearchResults && Array.isArray(data.webSearchResults)) {
        rawSources = data.webSearchResults;
      }
      
      if (rawSources.length === 0) {
        return [];
      }
      
      // Clean and format sources
      const cleanSources = rawSources
        .filter(source => source && typeof source === 'object')
        .map(source => {
          const url = source.url || source.link || source.href || '';
          const title = source.title || source.name || source.headline || 'Google Search Result';
          const snippet = source.snippet || source.description || '';
          
          if (!url || !this.isValidUrl(url)) {
            return null;
          }
          
          return {
            title: this.cleanTitle(title),
            url: this.cleanUrl(url),
            domain: this.extractDomain(url),
            snippet: this.cleanSnippet(snippet),
            timestamp: source.timestamp || Date.now()
          };
        })
        .filter(source => source !== null)
        .slice(0, 20); // Limit to 20 sources (backend sends up to 20 deduplicated)
      
      return cleanSources;
      
    } catch (error) {
      console.error('💥 Error extracting Google sources:', error);
      return [];
    }
  },

  // Helper functions for sources
  cleanTitle(title) {
    if (!title || typeof title !== 'string') return 'Google Search Result';
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

  cleanSnippet(snippet) {
    if (!snippet || typeof snippet !== 'string') return '';
    return snippet.trim().replace(/\s+/g, ' ').slice(0, 200);
  },

  extractDomain(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return 'google.com';
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

  // 🎯 OMNIA PROMPT OPTIMIZED FOR GEMINI WITH GOOGLE SEARCH (UPDATED VERSION)
  async getEloraPrompt(imageMode = false) {
    // Get user's preferred name for personalization
    const userName = await profileService.getUserNameForAI();

    if (userName) {
      console.log(`🎯 [GEMINI] Using personalized prompt with user name: "${userName}"`);
    } else {
      console.log('🎯 [GEMINI] Using default prompt (no user name set)');
    }

    return getEloraSystemPrompt(userName, imageMode);
  },

  // Simplified search message (if needed)
  getSearchMessage(language) {
    const messages = {
      'cs': 'Hledám...',
      'en': 'Searching...',
      'ro': 'Caut...',
      'de': 'Suche...',
      'ru': 'Ищу...',
      'pl': 'Szukam...'
    };
    return messages[language] || 'Searching...';
  }
};

export default geminiService;