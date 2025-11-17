/**
 * 🔄 Message Conversion Utilities
 * 
 * Helper functions for converting message formats between different AI services
 */

// 🤖 Convert our message format to OpenAI API format
export const convertMessagesForOpenAI = (messages) => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text || ''
  }));
};

// 🤖 Convert our message format to Claude API format (for future use)
export const convertMessagesForClaude = (messages) => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text || ''
  }));
};

// 🤖 Convert our message format to Gemini API format (for future use)
export const convertMessagesForGemini = (messages) => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text || '' }]
  }));
};