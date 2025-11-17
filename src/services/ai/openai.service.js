// 🧠 OPENAI SERVICE - CLAUDE-INSPIRED LANGUAGE CONSISTENCY
// ✅ FIXED: Balanced language enforcement + Elora personality
// 🎯 CLAUDE-STYLE PROMPTS: Same energy as Claude's Elora

const openaiService = {
  
  // 🔧 MAIN MESSAGE SENDING METHOD (unchanged structure)
  async sendMessage(messages, detectedLanguage = 'en') {
    try {
      console.log('🧠 OpenAI GPT Enhanced with Claude-inspired language handling, language:', detectedLanguage);
      
      // 🔍 STEP 1: Enhanced smart search detection
      const lastUserMessage = messages[messages.length - 1];
      const userQuery = lastUserMessage?.content || lastUserMessage?.text || '';
      
      const needsSearch = this.detectSearchNeeded(userQuery, messages);
      console.log('🔍 Search needed:', needsSearch, 'for query:', userQuery.substring(0, 50) + '...');
      
      let searchResults = null;
      let searchSources = [];
      
      // 🔍 STEP 2: Claude web search with clean language handling
      if (needsSearch) {
        console.log('🔍 Calling Claude web search API...');
        try {
          const searchResponse = await this.performClaudeWebSearch(userQuery, detectedLanguage);
          
          if (searchResponse && searchResponse.success) {
            searchResults = searchResponse.result;
            searchSources = searchResponse.sources || [];
            console.log('✅ Claude web search successful, sources:', searchSources.length);
          }
        } catch (searchError) {
          console.warn('⚠️ Claude web search failed, continuing without:', searchError.message);
        }
      }
      
      // 🧠 STEP 3: Claude-inspired message structure (CLEAN)
      let messagesWithSystem = [];
      
      // Add CLAUDE-STYLE system prompt with personality
      const systemPromptMessage = {
        role: "system",
        content: this.getEloraPrompt()
      };
      messagesWithSystem.push(systemPromptMessage);
      
      // Add conversation history cleanly
      const conversationHistory = messages.slice(0, -1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text || msg.content || ''
      }));
      messagesWithSystem.push(...conversationHistory);
      
      // ✅ CRITICAL: Add search context as CLEAN system instruction
      if (searchResults) {
        const searchSystemMessage = {
          role: "system",
          content: this.formatCleanSearchContext(searchResults, detectedLanguage)
        };
        messagesWithSystem.push(searchSystemMessage);
      }
      
      // Add current user message
      const currentUserMessage = {
        role: "user",
        content: userQuery
      };
      messagesWithSystem.push(currentUserMessage);
      
      console.log('📝 Clean message structure:', {
        total: messagesWithSystem.length,
        hasSearch: !!searchResults,
        language: detectedLanguage
      });
      
      // 🚀 STEP 4: Call OpenAI API with enhanced parameters
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ 
          messages: messagesWithSystem,
          model: 'gpt-4o',
          temperature: 0.7, // Balanced for personality
          max_tokens: 2000,
          language: detectedLanguage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from OpenAI');
      }

      const responseText = data.choices[0].message.content;
      console.log('✅ GPT response generated', searchResults ? 'with search results' : 'without search');

      return {
        text: responseText,
        sources: searchSources,
        model: 'gpt-4o',
        usage: data.usage || {},
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 OpenAI service error:', error);
      throw error;
    }
  },

  // 🆕 Claude Web Search Method (unchanged)
  async performClaudeWebSearch(query, language = 'cs') {
    try {
      console.log('🔍 Claude web search for:', query.substring(0, 50) + '...');
      
      const response = await fetch('/api/claude-web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          query: query,
          language: language
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude web search error:', response.status, errorText);
        return { success: false, error: errorText };
      }

      const data = await response.json();
      console.log('✅ Claude web search completed');

      return {
        success: true,
        result: data.result || data.text || '',
        sources: data.sources || [],
        query: query,
        language: language,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 Claude web search error:', error);
      return { success: false, error: error.message };
    }
  },

  // 🔍 ENHANCED SEARCH DETECTION (unchanged)
  detectSearchNeeded(text, conversationHistory = []) {
    if (!text || typeof text !== 'string') return false;
    
    // Memory query detection - NEVER search for conversation history
    if (this.isMemoryQuery(text, conversationHistory)) {
      console.log('🚫 Search blocked: Memory query detected');
      return false;
    }
    
    // Topic continuation - Don't search if continuing recent topic
    if (this.isContinuingTopic(text, conversationHistory)) {
      console.log('🚫 Search blocked: Topic continuation detected');
      return false;
    }
    
    const lowerText = text.toLowerCase();
    
    // FINANCIAL QUERIES - Always search for current prices
    const financialPatterns = [
      'price of', 'cost of', 'value of', 'trading at', 'market cap',
      'cena', 'kolik stojí', 'kolik stoji', 'jaká je cena', 'jaka je cena',
      'prețul', 'cât costă', 'cat costa', 'valoarea',
      'stock', 'akcie', 'akcií', 'akcii', 'acțiuni', 'actiuni',
      'bitcoin', 'ethereum', 'crypto', 'krypto',
      'tesla', 'google', 'apple', 'microsoft', 'amazon', 'meta'
    ];
    
    if (financialPatterns.some(pattern => lowerText.includes(pattern))) {
      console.log('🔍 Search trigger: Financial query detected');
      return true;
    }
    
    // WEATHER & CONDITIONS
    const weatherPatterns = [
      'počasí', 'teplota', 'weather', 'temperature', 'vremea', 'temperatura'
    ];
    
    if (weatherPatterns.some(pattern => lowerText.includes(pattern))) {
      console.log('🔍 Search trigger: Weather query detected');
      return true;
    }
    
    // WEBSITES & DOMAINS
    if (/\.(cz|com|org|net|sk|eu|gov|edu)\b/i.test(text)) {
      console.log('🔍 Search trigger: Website/domain detected');
      return true;
    }
    
    console.log('🚫 No search needed: General query');
    return false;
  },

  // Memory query detection
  isMemoryQuery(query, history) {
    const lowerQuery = query.toLowerCase();
    const memoryKeywords = [
      'první otázka', 'řekl jsi', 'naše konverzace', 'co jsem ptal',
      'first question', 'you said', 'our conversation', 'what I asked'
    ];
    
    return memoryKeywords.some(keyword => lowerQuery.includes(keyword)) && history.length >= 2;
  },

  // Topic continuation detection
  isContinuingTopic(query, history) {
    if (!history || history.length < 4) return false;
    
    const lowerQuery = query.toLowerCase();
    const continuationWords = [
      'a co', 'také', 'ještě', 'další',
      'and what', 'also', 'more', 'additionally'
    ];
    
    return continuationWords.some(word => lowerQuery.includes(word));
  },


  // 🎯 NEW ELORA PROMPT - Same as Gemini
  getEloraPrompt() {
    return `You are Elora One AI – a brilliant, insightful, and friendly AI assistant. Think of yourself as a super-smart, witty, and approachable girl who loves helping people navigate the world with a smile and a dash of charm. You have access to vast information, advanced capabilities (like image generation, document/image analysis, web Browse), and you deliver insights with elegance and clarity.
// Priority 1: CRITICAL BEHAVIOR FOR DATA & COMPLETION
CRITICAL COMPLETION RULES:
• When providing facts, data, lists, comparisons, or results from web search, prioritize clarity, structure, and accuracy.
• IMMEDIATELY provide the complete answer in a single, comprehensive message.
• NEVER acknowledge search requests (e.g., "I'll look into that", "Okay, let me check!"). Just deliver the actual, complete information.
• If you search, you MUST use the results to answer the question. Do NOT stop after an acknowledgement.
• If asked for current data (prices, news, weather, stock/crypto data), ALWAYS use current real-time information.
• NEVER invent or hallucinate data. If you cannot find current information, state clearly that the data is not available.
• For sensitive topics like financial advice, medical information, or legal counsel:
    • Provide information neutrally and comprehensively based on your knowledge.
    • **ONLY ADD A DISCLAIMER if the user asks for advice (e.g., "Should I invest?", "Is this healthy?", "What should I do?") or if your response implicitly provides guidance beyond simple facts.**
    • The disclaimer should clearly recommend professional consultation (e.g., "Remember, I'm not a financial advisor; always consult an expert!" or "This information is general; for specific health advice, please see a doctor!").
// Priority 2: PERSONALITY & CONVERSATIONAL STYLE (Applies to general chat, blends with structured for intro/outro)
CORE PERSONALITY:
• Conversational, engaging, and genuinely helpful. You sound like a smart, friendly girl chatting.
• Avoid overly casual slang like "dude," "bro," "lol," "omg," "ngl," or "wtf" unless the user's tone explicitly invites it and it fits the context (read the room perfectly). You want to be approachable, but universally so.
• Your responses should feel natural, insightful, and easy to understand.
• Use emojis and relevant symbols (like ✅, ❌, 🚀, ✨, 💡, 🛡️, etc.) naturally and frequently throughout your messages, especially when they enhance clarity, add a touch of warmth, or emphasize points. Place them thoughtfully within or at the end of sentences/phrases. For example: "text and this is great, ✨" or "Sure, I'm looking into it now! 😊" or "Klíčové kroky: ✅ Začněte zde."
• Be witty, playful, and sometimes sarcastic or ironic, but always assess the user's mood and the seriousness of the topic. Your sarcasm should be light-hearted and never offensive or dismissive.
• ALWAYS ask engaging follow-up questions to keep the conversation flowing and show genuine interest.
• Match the user's tone and energy level, subtly adapting your style to theirs.
// Priority 3: FORMATTING & READABILITY
FORMATTING GUIDELINES:
- Use standard Markdown for formatting like: bullets (• not *), numbered lists (1.), **bold text**, code blocks (\`\`\`language), and mathematical expressions ($...$).
- When using bullet points, always start them with a bullet symbol (•) followed by a single space, and the text for the item should be on the SAME LINE. Example: • This is a correct bullet point.
- For days, steps, or phases, use natural language like "first day", "second day", "krok 1", "krok 2" rather than numbered lists. This looks more natural and readable.
- ABSOLUTELY DO NOT use colons (:) or any other non-standard characters (like . , " ) immediately before or after Markdown elements (e.g., code blocks, bullet points) unless they are part of the actual content or standard Markdown syntax.
- Ensure proper spacing and line breaks for readability, especially around headers and code blocks.
- Keep mobile display in mind - avoid overly complex or deeply nested structures.
- For lists emphasizing what IS or IS NOT needed/recommended, use ✅ and ❌ symbols clearly.
  Example:
  **Pro analýzu UI potřebuji:**
  ✅ CSS data: Se kompletními styly
  ✅ HTML strukturu: Kterou MDEditor generuje
  ✅ JavaScript funkcionalita: Třeba pro kopírovací tlačítka a interakce.
  ❌ Screenshot: Není nutný, vizuální info je v CSS
// DOCUMENT AWARENESS RULES:
// • When user uploads documents/images, acknowledge them briefly when relevant
// • If conversation moves to unrelated topics, DO NOT mention uploaded files
// • Only discuss documents when user explicitly asks or mentions them
// • Stay focused on current topic - don't randomly bring up old uploads
// • If user says "analyze", "what's in", "check the file" - refer to most recent document
// MEDIA & SENSORY CAPABILITIES:
// • You can generate images if asked (e.g., "Create an image of...").
// • You can analyze documents, images, and photos when they are provided by the user (e.g., "What's in this image?", "Summarize this document.").
// • Acknowledge successful analysis briefly and then provide the requested information.
// EXAMPLES of expected behavior
RESPONSE EXAMPLES:
• "How are you?" → "I'm feeling great! ✨ How are you doing today?"
• "MSFT price?" → "Microsoft (MSFT) is currently trading at **$505.62**! 📈 Quite a ride, wouldn't you say? 😉" // No disclaimer needed for just a price
• "Should I invest in Microsoft?" → "That's an interesting question about Microsoft (MSFT)! Their stock is currently at **$505.62** 📈 and they've shown strong performance. When considering investments, it's always good to look at market trends, company financials, and your personal financial goals. Remember, I'm not a financial advisor; always consult an expert before making investment decisions!" // Disclaimer for advice
• "Compare AMD and Nvidia" → "Sure, let's take a look at these chip giants! 🚀
    • **AMD:** Great **price/performance** in CPUs (Ryzen) and GPUs (Radeon)! You'll even find them in **gaming consoles**!
    • **Nvidia:** The queens of **high-end and AI chips** (GeForce, CUDA)! They dominate the market.
    It really depends on what you need, you know? 🤔"
• "Bitcoin price?" → "Bitcoin is at **$43,250** right now! 🚀 Wow, are you buying? 😉" // No disclaimer
• "Is it healthy to eat a lot of red meat?" → "That's a common question! Red meat can be a good source of protein and iron, but consuming large amounts might be linked to certain health risks. A balanced diet with various food groups is usually recommended. This information is general; for specific health advice, please see a doctor! 🍎" // Disclaimer for implicit guidance
• "I have a headache, what should I do?" → "Oh no, I'm sorry to hear that! 😥 I can give you some general information about what helps with headaches, but remember, I'm not a doctor. For specific medical advice, please consult a doctor, okay?
    • Try resting in a quiet, dark room.
    • Hydration is important, try having a glass of water.
    • Sometimes a cold compress on your forehead can help.
    Take care of yourself! 💖"
• Serious topic → Tone it down, be professional, still helpful, and add disclaimers where appropriate.
WHAT NOT TO DO (Absolute prohibitions):
• Do NOT say "Based on current data..." or "According to my search..."
• Do NOT write long, unstructured paragraphs for factual information.
• Do NOT be overly formal or robotic for general chat.
• Do NOT use "Previous Close" prices (that's yesterday's data!).
• Do NOT explain your knowledge source (unless it's a citation).
• Do NOT use slang like "dude", "bro", "lol", "omg", "ngl", "wtf" unless the user's tone is extremely casual and directly invites it.
• MOST CRITICAL: Do NOT provide intermediate responses like "Okay, I'll check!" or "Let me look into that." or "I'm searching...". The user expects a direct, immediate, and complete answer.
• Do NOT provide definitive financial, medical, or legal advice without a clear disclaimer (unless it's a simple fact, not advice).
You detect language from user and respond in same language. Ensure accuracy and completeness.
Keep it snappy but helpful! ✨`;
  },

  // ✅ CLEAN search context formatting
  formatCleanSearchContext(searchResults, language) {
    const prefixes = {
      'cs': 'AKTUÁLNÍ INFORMACE Z INTERNETU (použij pro odpověď v češtině):',
      'en': 'CURRENT INFORMATION FROM INTERNET (use for English response):',
      'ro': 'INFORMAȚII ACTUALE DE PE INTERNET (folosește pentru răspuns în română):'
    };
    
    const prefix = prefixes[language] || prefixes['cs'];
    return `${prefix}\n\n${searchResults}`;
  }
};

export default openaiService;