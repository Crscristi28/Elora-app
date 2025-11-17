// apiServices.js - KOMPLETNÍ SOUBOR

import { useState } from 'react';

// CLAUDE API CALL
const sendToClaude = async (message, conversationHistory = []) => {
  try {
    console.log('🔄 Volám Claude přes Vercel...');
    
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response structure');
    }

    return data.content[0].text;

  } catch (error) {
    console.error('💥 Claude error:', error);
    throw error;
  }
};

// OPENAI API CALL
const sendToOpenAI = async (message, conversationHistory = []) => {
  try {
    console.log('🔄 Volám OpenAI přes Vercel...');
    
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure');
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error('💥 OpenAI error:', error);
    throw error;
  }
};

// CUSTOM HOOK PRO AI CHAT
export const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedAI, setSelectedAI] = useState('claude');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (text = inputText) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      let response;
      if (selectedAI === 'claude') {
        response = await sendToClaude(text, conversationHistory);
      } else {
        response = await sendToOpenAI(text, conversationHistory);
      }

      setMessages(prev => [
        ...prev,
        { role: 'user', content: text, timestamp: Date.now() },
        { role: 'assistant', content: response, ai: selectedAI, timestamp: Date.now() }
      ]);

      setInputText('');

    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message);
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: text, timestamp: Date.now() },
        { 
          role: 'assistant', 
          content: `Chyba: ${error.message}`,
          error: true,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    inputText,
    setInputText,
    selectedAI,
    setSelectedAI,
    isLoading,
    error,
    sendMessage,
    clearChat
  };
};

// HLAVNÍ CHAT KOMPONENTA
export const ChatComponent = () => {
  const {
    messages,
    inputText,
    setInputText,
    selectedAI,
    setSelectedAI,
    isLoading,
    error,
    sendMessage,
    clearChat
  } = useAIChat();

  const handleSendMessage = () => {
    sendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="header mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">OMNIA</h1>
        <p className="text-gray-600">AI asistent online</p>
      </div>

      {/* AI Selector */}
      <div className="ai-selector mb-4 flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedAI('claude')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedAI === 'claude' 
                ? 'bg-purple-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🤖 Claude
          </button>
          <button
            onClick={() => setSelectedAI('openai')}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedAI === 'openai' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🧠 GPT-4
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="status mb-4 text-center">
        <span className="text-sm text-gray-500">
          Používáš: {selectedAI === 'claude' ? 'Claude 3.5 Sonnet' : 'GPT-4'}
        </span>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="ml-4 text-sm text-red-500 hover:text-red-700"
          >
            🗑️ Vymazat chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="messages mb-4 h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <div className="text-6xl mb-4">💬</div>
            <p>Začni konverzaci s {selectedAI === 'claude' ? 'Claude' : 'GPT-4'}</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : msg.error 
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              {msg.ai && !msg.error && (
                <div className="text-xs opacity-70 mb-1">
                  {msg.ai === 'claude' ? '🤖 Claude' : '🧠 GPT-4'}
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.timestamp && (
                <div className="text-xs opacity-50 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-gray-600">
                  {selectedAI === 'claude' ? 'Claude' : 'GPT-4'} přemýšlí...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="input-area">
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Zeptej se ${selectedAI === 'claude' ? 'Claude' : 'GPT-4'}... (Enter = odeslat)`}
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-600 transition-colors"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 text-center">
          Omnia online • Vercel deployment • {selectedAI === 'claude' ? 'Claude API' : 'OpenAI API'}
        </div>
      </div>
    </div>
  );
};

// DEFAULT EXPORT
export default ChatComponent;