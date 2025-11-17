// 🔧 SESSION MANAGEMENT - Simplified for UI settings only
// Handles localStorage and sessionStorage for basic app persistence
// 📝 Chat History moved to chatDB.js (IndexedDB) for better performance

const sessionManager = {
  // 🗑️ Clear current session data
  clearSession() {
    sessionStorage.removeItem('elora-session-id');
    console.log('🗑️ Session cleared completely');
  },

  // 🎨 Theme preference (light/dark)
  saveTheme(theme) {
    localStorage.setItem('elora-theme', theme);
  },

  getTheme() {
    return localStorage.getItem('elora-theme'); // Return null if not set, for auto-detection
  },

  // 🌍 UI Language preference
  saveUILanguage(language) {
    localStorage.setItem('elora-ui-language', language);
  },

  getUILanguage() {
    const savedLanguage = localStorage.getItem('elora-ui-language');
    if (savedLanguage) {
      return savedLanguage;
    }
    
    // Detect system language if no saved preference
    try {
      const systemLang = navigator.language || navigator.userLanguage || 'cs';
      const langCode = systemLang.toLowerCase().split('-')[0];
      
      // Map system language to supported languages - EXPANDED to 13 languages
      const supportedLanguages = ['cs', 'en', 'ro', 'de', 'ru', 'pl', 'hu', 'sk', 'es', 'it', 'bg', 'fr', 'pt'];
      if (supportedLanguages.includes(langCode)) {
        return langCode;
      }
    } catch (error) {
      console.log('System language detection failed:', error);
    }
    
    // Fallback to Czech
    return 'cs';
  },


  // 🤖 Selected AI model preference
  saveSelectedModel(model) {
    localStorage.setItem('elora-selected-model', model);
  },

  getSelectedModel() {
    return localStorage.getItem('elora-selected-model');
  },

  // 💾 Save current chat ID for recovery (localStorage survives PWA restart)
  saveCurrentChatId(chatId) {
    try {
      localStorage.setItem('elora-current-chat-id', chatId);
      console.log('💾 [RECOVERY] Current chat ID saved to localStorage');
    } catch (error) {
      console.error('❌ [RECOVERY] Failed to save chat ID:', error);
    }
  },

  // 📖 Get current chat ID
  getCurrentChatId() {
    try {
      return localStorage.getItem('elora-current-chat-id');
    } catch (error) {
      console.error('❌ [RECOVERY] Failed to get chat ID:', error);
      return null;
    }
  }

  // ❌ REMOVED: All chat history methods moved to chatDB.js
  // - saveChatHistory() → chatDB.saveChat()
  // - getAllChatHistories() → chatDB.getAllChats()
  // - getChatHistory() → chatDB.getChat()
  // - deleteChatHistory() → chatDB.deleteChat()
  // - generateChatTitle() → chatDB.generateChatTitle()
  // - generateChatId() → chatDB.generateChatId()
};

export default sessionManager;