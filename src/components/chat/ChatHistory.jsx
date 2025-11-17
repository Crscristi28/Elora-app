// 📚 CHAT HISTORY COMPONENT  
// IndexedDB-based chat history with async operations

import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Clock, MessageCircle } from 'lucide-react';
import chatDB from '../../services/storage/chatDB';

const ChatHistory = ({ 
  isVisible, 
  onClose, 
  onLoadChat, 
  currentChatId,
  onNewChat 
}) => {
  const [chatHistories, setChatHistories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible) {
      loadChatHistories();
    }
  }, [isVisible]);

  const loadChatHistories = async () => {
    setLoading(true);
    try {
      const histories = await chatDB.getChatTitles();
      setChatHistories(histories);
    } catch (error) {
      console.error('Error loading chat histories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId, event) => {
    event.stopPropagation(); // Prevent loading the chat
    if (confirm('Opravdu chcete smazat tento chat?')) {
      await chatDB.deleteChat(chatId);
      loadChatHistories(); // Refresh list
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Dnes ${date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Včera ${date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('cs-CZ', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
        onClick={onClose}
      />
      
      {/* Chat History Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '320px',
        height: '100vh',
        backgroundColor: 'rgba(21, 32, 54, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: 0,
            }}>
              Chat History
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
          
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={16} />
            Nový chat
          </button>
        </div>

        {/* Chat List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          {loading ? (
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              textAlign: 'center',
              padding: '2rem',
            }}>
              Načítám...
            </div>
          ) : chatHistories.length === 0 ? (
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              textAlign: 'center',
              padding: '2rem',
            }}>
              <MessageCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Zatím žádné chaty</p>
            </div>
          ) : (
            chatHistories.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  onLoadChat(chat.id);
                  onClose();
                }}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: chat.id === currentChatId 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (chat.id !== currentChatId) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (chat.id !== currentChatId) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <div style={{
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  marginBottom: '0.25rem',
                  lineHeight: '1.2',
                  wordBreak: 'break-word',
                }}>
                  {chat.title}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {formatDate(chat.updatedAt)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{chat.messageCount} zpráv</span>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(239, 68, 68, 0.7)',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'rgba(239, 68, 68, 1)';
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHistory;