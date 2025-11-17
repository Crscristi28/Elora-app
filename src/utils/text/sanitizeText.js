// 📁 src/utils/sanitizeText.js
// 🎵 SIMPLE SANITIZATION pro ElevenLabs TTS
// 🔧 SIMPLE FIX: Remove all emoji, keep essentials

export default function sanitizeText(text, language = 'cs') {
  if (!text || typeof text !== 'string') return '';
  
  let processedText = text;
  
  // 🚫 MARKDOWN CLEANUP - UNIVERSAL
  processedText = processedText
    .replace(/\*\*([^*]+)\*\*/g, '$1')           // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')               // Remove *italic*
    .replace(/#{1,6}\s*/g, '')                   // Remove ### headers
    .replace(/`([^`]+)`/g, '$1')                 // Remove `inline code`
    .replace(/```[\s\S]*?```/g, '')              // Remove ```code blocks```
    .replace(/_([^_]+)_/g, '$1')                 // Remove _underline_
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')    // Remove [links](url)
    .replace(/~~([^~]+)~~/g, '$1');              // Remove ~~strikethrough~~
  
  switch (language.toLowerCase()) {
    
    case 'ro': // 🇷🇴 RUMUNŠTINA
      processedText = processedText
        // === REMOVE ALL EMOJI ===
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
        
        // === PROCENTA ===
        .replace(/(\d+)\s*%/gi, '$1 la sută')
        
        // === TEPLOTA ===
        .replace(/(\d+)[\s]*°C/gi, '$1 grade Celsius')
        .replace(/(\d+)[\s]*°F/gi, '$1 grade Fahrenheit')
        .replace(/(\d+)[\s]*°/gi, '$1 grade')
        
        // === ČAS ===
        .replace(/(\d{1,2}):(\d{2})/g, '$1 și $2 minute')
        
        // === MĚNY ===
        .replace(/(\d+)\s*€/gi, '$1 euro')
        .replace(/(\d+)\s*\$/gi, '$1 dolari')
        .replace(/(\d+)\s*USD/gi, '$1 dolari americani')
        
        // === DESETINNÁ ČÍSLA ===
        .replace(/(\d+)[.,](\d+)/g, '$1 virgulă $2')
        
        // === JEDNOTKY ===
        .replace(/(\d+)\s*km\/h/gi, '$1 kilometri pe oră')
        .replace(/(\d+)\s*kg/gi, '$1 kilograme')
        
        // === ZKRATKY ===
        .replace(/\betc\.?\b/gi, 'și așa mai departe')
        .replace(/\bex\.?\b/gi, 'de exemplu')
        
        // === CLEANUP ===
        .replace(/\s+/g, ' ')
        .trim();
      break;
      
    case 'en': // 🇺🇸 ANGLIČTINA
      processedText = processedText
        // === REMOVE ALL EMOJI ===
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
        
        // === PERCENTAGES ===
        .replace(/(\d+)\s*%/gi, '$1 percent')
        
        // === TEMPERATURE ===
        .replace(/(\d+)[\s]*°C/gi, '$1 degrees Celsius')
        .replace(/(\d+)[\s]*°F/gi, '$1 degrees Fahrenheit')
        .replace(/(\d+)[\s]*°/gi, '$1 degrees')
        
        // === TIME ===
        .replace(/(\d{1,2}):(\d{2})/g, '$1 hours and $2 minutes')
        
        // === CURRENCY ===
        .replace(/(\d+)\s*\$/gi, '$1 dollars')
        .replace(/(\d+)\s*€/gi, '$1 euros')
        .replace(/(\d+)\s*USD/gi, '$1 US dollars')
        
        // === DECIMALS ===
        .replace(/(\d+)[.,](\d+)/g, '$1 point $2')
        
        // === UNITS ===
        .replace(/(\d+)\s*km\/h/gi, '$1 kilometers per hour')
        .replace(/(\d+)\s*kg/gi, '$1 kilograms')
        
        // === ABBREVIATIONS ===
        .replace(/\betc\.?\b/gi, 'et cetera')
        .replace(/\be\.g\.?\b/gi, 'for example')
        .replace(/\bvs\.?\b/gi, 'versus')
        
        // === CLEANUP ===
        .replace(/\s+/g, ' ')
        .trim();
      break;
      
    default: // 🇨🇿 ČEŠTINA
      processedText = processedText
        // === REMOVE ALL EMOJI ===
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
        
        // === LOWERCASE FIX ===
        .toLowerCase()  // DŮLEŽITÁ → důležitá
        
        // === PROCENTA ===
        .replace(/(\d+)\s*%/gi, '$1 procent')
        
        // === TEPLOTA ===
        .replace(/(\d+)[\s]*°C/gi, '$1 stupňů Celsia')
        .replace(/(\d+)[\s]*°F/gi, '$1 stupňů Fahrenheita')
        .replace(/(\d+)[\s]*°/gi, '$1 stupňů')
        
        // === ČAS ===
        .replace(/(\d{1,2}):(\d{2})/g, '$1 hodin $2 minut')
        
        // === MĚNY ===
        .replace(/(\d+)\s*Kč/gi, '$1 korun českých')
        .replace(/(\d+)\s*€/gi, '$1 eur')
        .replace(/(\d+)\s*\$/gi, '$1 dolarů')
        .replace(/(\d+)\s*USD/gi, '$1 amerických dolarů')
        
        // === DESETINNÁ ČÍSLA ===
        .replace(/(\d+)[.,](\d+)/g, '$1 celá $2')
        
        // === JEDNOTKY ===
        .replace(/(\d+)\s*km\/h/gi, '$1 kilometrů za hodinu')
        .replace(/(\d+)\s*kg/gi, '$1 kilogramů')
        
        // === ZKRATKY ===
        .replace(/\bnapř\.?\b/gi, 'například')
        .replace(/\batd\.?\b/gi, 'a tak dále')
        .replace(/\bapod\.?\b/gi, 'a podobně')
        .replace(/\btj\.?\b/gi, 'to jest')
        .replace(/\btzn\.?\b/gi, 'to znamená')
        .replace(/\bresp\.?\b/gi, 'respektive')
        .replace(/\btzv\.?\b/gi, 'takzvaný')
        
        // === CLEANUP ===
        .replace(/\s+/g, ' ')
        .trim();
      break;
  }
  
  return processedText;
}

// 🔧 cleanMarkdownForUI - Keep for UI display
export function cleanMarkdownForUI(text) {
  if (!text || typeof text !== 'string') return '';
  
  let cleanText = text;
  
  cleanText = cleanText
    .replace(/\*([^*]+)\*/g, '$1')         // Remove *italic*
    .replace(/#{1,6}\s*/g, '')             // Remove ### headers
    .replace(/`([^`]+)`/g, '$1')           // Remove `inline code`
    .replace(/```[\s\S]*?```/g, '')        // Remove ```code blocks```
    .replace(/_([^_]+)_/g, '$1')           // Remove _underline_
    .replace(/~~([^~]+)~~/g, '$1');        // Remove ~~strikethrough~~

  cleanText = cleanText
    .replace(/:\s*•/g, ':\n•')             // Add newline before bullets after colons
    .replace(/•\s+/g, '\n• ')              // Normalize bullet spacing
    .replace(/\s*•\s*/g, '\n• ')           // Clean up bullet spacing
    .replace(/([.!?])\s*•/g, '$1\n• ')     // Add newline after sentences before bullets
    .replace(/([a-zA-Z])\s*•/g, '$1\n• ')  // Add newline between words and bullets
    .replace(/\n{3,}/g, '\n\n')            // Max 2 newlines
    .replace(/\n{2,}/g, '\n')              // Actually, max 1 newline for cleaner look
    .replace(/^\n+/, '')                   // Remove leading newlines
    .replace(/\n+$/, '');                  // Remove trailing newlines

  return cleanText.trim();
}