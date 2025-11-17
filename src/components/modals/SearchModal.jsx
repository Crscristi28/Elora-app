// 🔍 SearchModal.jsx - Search chats modal
// Clean design with empty state, results, and no results states
// Theme-aware (dark/light mode)

import React, { useState, useEffect } from 'react';
import { Search, X, MessageCircle } from 'lucide-react';
import { getTranslation } from '../../utils/text/translations';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../services/storage/chatDB';

const SearchModal = ({
  isOpen,
  onClose,
  chatHistory = [],
  onSelectChat,
  currentChatId = null,
  uiLanguage = 'cs'
}) => {
  const { theme, isDark, isLight } = useTheme();
  const t = getTranslation(uiLanguage);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 📝 Helper: Extract snippet from text around matching query
  const getSnippet = (text, query, contextLength = 60) => {
    if (!text || !query) return '';
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return '';

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);

    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  };

  // ✨ Helper: Highlight matching text in string (returns JSX)
  const highlightText = (text, query) => {
    if (!text || !query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
      <>
        {before}
        <strong style={{ fontWeight: '700', color: isLight ? '#000000' : '#ffffff' }}>
          {match}
        </strong>
        {highlightText(after, query)}
      </>
    );
  };

  // 🔍 SEARCH LOGIC - Search in title + message content with snippets
  useEffect(() => {
    const performSearch = async () => {
      const query = searchQuery.trim();

      if (query === '') {
        setSearchResults([]);
        return;
      }

      const queryLower = query.toLowerCase();

      // 1. Search in chat titles
      const titleMatches = chatHistory.filter(chat =>
        chat.title?.toLowerCase().includes(queryLower)
      );

      // 2. Search in message content
      const allMessages = await db.messages.toArray();
      const messageMatches = allMessages.filter(msg =>
        msg.text?.toLowerCase().includes(queryLower)
      );

      // 3. Group messages by chatId and create enriched results
      const messagesByChatId = {};
      messageMatches.forEach(msg => {
        if (!messagesByChatId[msg.chatId]) {
          messagesByChatId[msg.chatId] = [];
        }
        messagesByChatId[msg.chatId].push(msg);
      });

      // 4. Merge results with metadata
      const titleMatchIds = new Set(titleMatches.map(c => c.id));
      const allMatchingChatIds = new Set([...titleMatchIds, ...Object.keys(messagesByChatId)]);

      // Create enriched results with UP TO 3 snippets per chat
      const results = chatHistory
        .filter(chat => allMatchingChatIds.has(chat.id))
        .map(chat => {
          const messagesInChat = messagesByChatId[chat.id] || [];
          const matchCount = messagesInChat.length;

          // Get up to 3 snippets with their UUIDs
          const matches = messagesInChat.slice(0, 3).map(msg => ({
            uuid: msg.uuid,
            snippet: getSnippet(msg.text, query)
          }));

          return {
            ...chat,
            matchCount,
            matches, // Array of {uuid, snippet} objects (max 3)
            matchedInTitle: titleMatchIds.has(chat.id)
          };
        });

      setSearchResults(results);
    };

    performSearch();
  }, [searchQuery, chatHistory]);

  if (!isOpen) return null;

  const displayedChats = searchResults;

  return (
    <>
      {/* OVERLAY */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />

      {/* MODAL CONTENT */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2001,
          display: 'flex',
          flexDirection: 'column',
          background: isLight ? '#FDFBF7' : 'rgba(0, 0, 0, 0.98)',
          color: isLight ? '#000000' : '#ffffff'
        }}
      >
        {/* HEADER - Search Input + Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            borderBottom: isLight
              ? '1px solid rgba(0, 0, 0, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            flexShrink: 0
          }}
        >
          {/* Search Input */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isLight
                ? '#F5F5F5'
                : 'rgba(255, 255, 255, 0.08)',
              border: isLight
                ? '1px solid rgba(0, 0, 0, 0.1)'
                : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '12px 16px',
              height: '48px', // ✅ Fixed height
              boxSizing: 'border-box' // ✅ Include padding/border in height
            }}
          >
            <Search size={20} style={{ opacity: 0.6, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: isLight ? '#000000' : '#ffffff',
                fontSize: '1rem',
                fontFamily: 'inherit',
                height: '100%' // ✅ Fill parent height
              }}
            />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLight
                ? 'rgba(0, 0, 0, 0.05)'
                : 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* EMPTY STATE - No search query */}
          {searchQuery.trim() === '' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                textAlign: 'center',
                minHeight: '50vh'
              }}
            >
              <Search
                size={48}
                style={{
                  opacity: 0.3,
                  marginBottom: '1rem'
                }}
              />
              <div
                style={{
                  fontSize: '1rem',
                  color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'
                }}
              >
                Start typing to search...
              </div>
            </div>
          )}

          {/* RESULTS - Chat title + up to 3 snippets */}
          {searchQuery.trim() !== '' && displayedChats.length > 0 && (
            <div style={{ padding: '16px' }}>
              {displayedChats.map((chat, chatIndex) => (
                <div key={chat.id || chatIndex} style={{ marginBottom: '16px' }}>
                  {/* Chat Title (always shown once) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: isLight ? '#000000' : '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      padding: '8px 16px',
                      marginBottom: '4px'
                    }}
                  >
                    <MessageCircle size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}
                    >
                      {highlightText(chat.title || `Chat ${chatIndex + 1}`, searchQuery)}
                    </span>
                    {chat.matchCount > 3 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        +{chat.matchCount - 3} more
                      </span>
                    )}
                  </div>

                  {/* Snippets (up to 3 clickable items) */}
                  {chat.matches && chat.matches.length > 0 ? (
                    chat.matches.map((match, matchIndex) => (
                      <button
                        key={match.uuid || matchIndex}
                        onClick={() => {
                          onSelectChat(chat.id, match.uuid);
                          onClose();
                        }}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px 8px 40px', // Extra left padding for indent
                          cursor: 'pointer',
                          outline: 'none',
                          textAlign: 'left',
                          transition: 'background 0.2s ease',
                          fontSize: '0.85rem',
                          color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isLight
                            ? 'rgba(239, 224, 204, 0.3)'
                            : 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {match.snippet || 'No preview available'}
                      </button>
                    ))
                  ) : chat.matchedInTitle ? (
                    // Matched in title only - show message count
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                        paddingLeft: '40px',
                        padding: '8px 16px 8px 40px'
                      }}
                    >
                      {chat.messageCount || 0} messages
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* NO RESULTS STATE */}
          {searchQuery.trim() !== '' && displayedChats.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                textAlign: 'center',
                minHeight: '50vh'
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  opacity: 0.3
                }}
              >
                🚫
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'
                }}
              >
                No results for "{searchQuery}"
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchModal;
