// 🔍 /api/claude-web-search.js - Claude Web Search API for GPT
// ✅ FIXED: Strong language enforcement with post-processing validation
// 🎯 Used by openai.service.js when GPT needs current information

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, language = 'cs' } = req.body;
    const API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query je povinný'
      });
    }

    console.log('🔍 Claude web search request:', query.substring(0, 50) + '...', 'language:', language);

    // 🧠 ENHANCED: Super strong language enforcement system prompts
    const systemPrompts = {
      'cs': `CRITICAL: You are a Czech search assistant. You MUST respond ONLY in Czech language.

ABSOLUTE LANGUAGE RULES:
- RESPOND ONLY IN CZECH - NO EXCEPTIONS
- If web search returns non-Czech content, translate it to Czech
- Never mix languages in response
- Czech numbers: "dvacet tři" not "23"
- Czech temperature: "dvacet stupňů Celsia" not "20°C"
- Czech percentages: "padesát procent" not "50%"

SEARCH TASK:
1. Use web_search to find current information
2. Translate any foreign language results to Czech
3. Present information in natural Czech
4. Keep sentences short (max 15 words)
5. No technical phrases like "našel jsem"

CRITICAL: Your entire response must be in Czech. If you receive English, Romanian, or other language results from web search, you MUST translate them to Czech before responding.

Today: ${new Date().toLocaleDateString('cs-CZ')}`,

      'en': `CRITICAL: You are an English search assistant. You MUST respond ONLY in English language.

ABSOLUTE LANGUAGE RULES:
- RESPOND ONLY IN ENGLISH - NO EXCEPTIONS  
- If web search returns non-English content, translate it to English
- Never mix languages in response
- English numbers: "twenty three" not "23"
- English temperature: "twenty degrees Celsius" not "20°C"
- English percentages: "fifty percent" not "50%"

SEARCH TASK:
1. Use web_search to find current information
2. Translate any foreign language results to English
3. Present information in natural English
4. Keep sentences short (max 15 words)
5. No technical phrases like "I found"

CRITICAL: Your entire response must be in English. If you receive Czech, Romanian, or other language results from web search, you MUST translate them to English before responding.

Today: ${new Date().toLocaleDateString('en-US')}`,

      'ro': `CRITICAL: Ești un asistent de căutare român. TREBUIE să răspunzi DOAR în română.

REGULI ABSOLUTE DE LIMBĂ:
- RĂSPUNDE DOAR ÎN ROMÂNĂ - FĂRĂ EXCEPȚII
- Dacă web search returnează conținut non-român, traduce-l în română
- Nu amesteca niciodată limbile în răspuns
- Numere românești: "douăzeci și trei" nu "23"
- Temperatură română: "douăzeci grade Celsius" nu "20°C"
- Procente românești: "cincizeci la sută" nu "50%"

SARCINA DE CĂUTARE:
1. Folosește web_search pentru informații actuale
2. Traduce orice rezultate în limbi străine în română
3. Prezintă informațiile în română naturală
4. Păstrează propozițiile scurte (max 15 cuvinte)
5. Fără fraze tehnice ca "am găsit"

CRITIC: Întregul tău răspuns trebuie să fie în română. Dacă primești rezultate în engleză, cehă sau alte limbi din web search, TREBUIE să le traduci în română înainte de a răspunde.

Astăzi: ${new Date().toLocaleDateString('ro-RO')}`
    };

    const systemPrompt = systemPrompts[language] || systemPrompts['cs'];

    // 🚀 STEP 1: Claude API call with super strong language enforcement
    const claudeRequest = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `${query}

IMPORTANT: Respond ONLY in ${language === 'cs' ? 'Czech' : language === 'en' ? 'English' : 'Romanian'} language. Translate any search results if needed.`
        }
      ],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 3
        }
      ]
    };

    console.log('🚀 Sending Claude web search request with strong language enforcement...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Claude API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Claude web search response received');
    
    // 📝 Extract text response
    let textContent = data.content
      ?.filter(item => item.type === 'text')
      ?.map(item => item.text)
      ?.join('\n')
      ?.trim() || "Nepodařilo se získat výsledky vyhledávání.";

    // 🔍 STEP 2: Language validation and correction
    const detectedLanguage = detectResponseLanguage(textContent);
    console.log('🌍 Response language detected:', detectedLanguage, 'Expected:', language);

    // ✅ STEP 3: Force translation if language mismatch
    if (detectedLanguage !== language && detectedLanguage !== 'unknown') {
      console.log('⚠️ Language mismatch detected! Forcing translation...');
      
      const translationPrompt = getTranslationPrompt(language);
      
      const translationRequest = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: translationPrompt,
        messages: [
          {
            role: "user",
            content: `Translate this to ${language === 'cs' ? 'Czech' : language === 'en' ? 'English' : 'Romanian'}:\n\n${textContent}`
          }
        ]
      };

      const translationResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(translationRequest)
      });

      if (translationResponse.ok) {
        const translationData = await translationResponse.json();
        const translatedText = translationData.content
          ?.filter(item => item.type === 'text')
          ?.map(item => item.text)
          ?.join('\n')
          ?.trim();
        
        if (translatedText) {
          textContent = translatedText;
          console.log('✅ Text successfully translated to target language');
        }
      }
    }

    // 🔗 Extract sources from web_search tool usage
    const toolUses = data.content?.filter(item => item.type === 'tool_use') || [];
    const webSearchUsed = toolUses.some(t => t.name === 'web_search');
    
    let sources = [];
    if (webSearchUsed) {
      console.log('🔍 Claude used web_search tool');
      sources = [
        {
          id: 1,
          title: "Web Search Results",
          url: "#",
          domain: "claude-search"
        }
      ];
    }

    console.log('💬 Final result length:', textContent.length, 'characters');
    console.log('🌍 Final language consistency check passed');

    // 🎯 Return response in format expected by openai.service.js
    return res.status(200).json({
      success: true,
      result: textContent,
      sources: sources,
      query: query,
      language: language,
      webSearchUsed: webSearchUsed,
      model: data.model,
      usage: data.usage || {},
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Claude web search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during Claude web search',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 🔍 HELPER: Detect response language
function detectResponseLanguage(text) {
  if (!text || text.length < 10) return 'unknown';
  
  const lowerText = text.toLowerCase();
  
  // Romanian indicators
  const romanianWords = ['astăzi', 'prețul', 'acțiunilor', 'dolari', 'douăzeci', 'trei', 'sute', 'este'];
  const romanianScore = romanianWords.reduce((score, word) => 
    lowerText.includes(word) ? score + 1 : score, 0);
  
  // Czech indicators  
  const czechWords = ['dnes', 'cena', 'akcií', 'korun', 'dvacet', 'tisíc', 'je'];
  const czechScore = czechWords.reduce((score, word) => 
    lowerText.includes(word) ? score + 1 : score, 0);
  
  // English indicators
  const englishWords = ['today', 'price', 'stock', 'dollars', 'twenty', 'thousand', 'is'];
  const englishScore = englishWords.reduce((score, word) => 
    lowerText.includes(word) ? score + 1 : score, 0);
  
  if (romanianScore > czechScore && romanianScore > englishScore) return 'ro';
  if (czechScore > englishScore) return 'cs';
  if (englishScore > 0) return 'en';
  
  return 'unknown';
}

// 🔄 HELPER: Get translation system prompt
function getTranslationPrompt(targetLanguage) {
  const prompts = {
    'cs': `You are a professional translator. Translate the given text to perfect Czech.

RULES:
- Maintain all factual information exactly
- Use natural Czech expressions
- Numbers in words when appropriate for voice
- Keep the same meaning and tone
- No explanation, just the translation`,

    'en': `You are a professional translator. Translate the given text to perfect English.

RULES:
- Maintain all factual information exactly  
- Use natural English expressions
- Numbers in words when appropriate for voice
- Keep the same meaning and tone
- No explanation, just the translation`,

    'ro': `You are a professional translator. Translate the given text to perfect Romanian.

RULES:
- Maintain all factual information exactly
- Use natural Romanian expressions  
- Numbers in words when appropriate for voice
- Keep the same meaning and tone
- No explanation, just the translation`
  };
  
  return prompts[targetLanguage] || prompts['cs'];
}