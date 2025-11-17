// 🎨 ChatSidebar.jsx - GPT-style sidebar pro History + Settings
// ✅ Clean professional design podle fotky
// 🚀 Animované slide-in/out, responsive

import React, { useState, useEffect } from 'react';
import { MessageCircle, MessageCirclePlus, Check, X, ChevronDown, LogOut, User, Trash2, Settings, Images, FolderOpen, Search } from 'lucide-react';
import { getTranslation } from '../../utils/text/translations';
import chatDB from '../../services/storage/chatDB';
import UserSettingsModal from '../modals/UserSettingsModal';
import GalleryModal from '../modals/GalleryModal';
import SearchModal from '../modals/SearchModal';
import { useTheme } from '../../contexts/ThemeContext';

const ChatSidebar = ({
  isOpen,
  onClose,
  onNewChatKeepSidebar = () => {}, // New chat without closing sidebar
  uiLanguage = 'cs',
  setUILanguage,
  chatHistory = [],
  onSelectChat,
  currentChatId = null,
  onChatDeleted = () => {}, // Callback to refresh history after deletion
  user = null, // Current user object
  onSignOut = () => {}, // Sign out handler
  onResetPassword = () => {}, // Reset password handler
  onDeleteAccount = () => {}, // Delete account handler
  onPreviewImage = () => {}, // Image preview handler for Gallery (single image)
  onOpenGalleryLightbox = () => {}, // Gallery lightbox with ALL images
  currentModel = 'gemini-2.5-flash', // Current AI model
  onModelChange = () => {}, // Model change handler
  onShowSummaryChange = () => {} // Show summary toggle handler
}) => {
  const isMobile = window.innerWidth <= 768;
  const t = getTranslation(uiLanguage);
  const { theme, isDark, isLight, isElora } = useTheme();
  
  // Long press state
  const [longPressTimer, setLongPressTimer] = useState(null);

  // Modal states
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, chatId: null, chatTitle: '' });
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  
  // 🔧 Reset expansion states when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      // Modal states are handled separately
    }
  }, [isOpen]);
  
  // 👤 USER HELPERS
  const getUserInitials = (email) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };
  
  const getDisplayEmail = (email) => {
    if (!email) return '';
    if (email.length <= 20) return email;
    const [local, domain] = email.split('@');
    return `${local.slice(0, 8)}...@${domain}`;
  };

  // 📱 CLOSE ON OVERLAY CLICK
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 🌍 LANGUAGE OPTIONS
  const languageOptions = [
    { code: 'cs', label: 'Čeština', flag: 'CZ' },
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'ro', label: 'Română', flag: 'RO' }
  ];

  const handleLanguageChange = (langCode) => {
    setUILanguage(langCode);
    // Auto-close on mobile after selection
    if (isMobile) {
      setTimeout(() => onClose(), 300);
    }
  };

  const handleChatSelect = (chatId) => {
    onSelectChat(chatId);
    onClose(); // Always close after selecting chat
  };

  // 🗑️ LONG PRESS DELETE FUNCTIONALITY
  const handleLongPressStart = (chatId, chatTitle) => {
    const timer = setTimeout(() => {
      handleDeleteChat(chatId, chatTitle);
    }, 800); // 800ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 🗑️ DELETE MODAL HANDLERS
  const openDeleteModal = (chatId, chatTitle) => {
    setDeleteModal({ isOpen: true, chatId, chatTitle });
  };
  
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, chatId: null, chatTitle: '' });
  };
  
  const confirmDeleteChat = async () => {
    const { chatId } = deleteModal;

    // If deleting the current chat, start new chat but keep sidebar open
    const isDeletingCurrentChat = chatId === currentChatId;

    // ✅ Close modal immediately (optimistic UI)
    closeDeleteModal();

    // ✅ Clear React state immediately (instant UI feedback)
    onChatDeleted(chatId);

    if (isDeletingCurrentChat) {
      onNewChatKeepSidebar(); // This will clear messages and start fresh but keep sidebar open
    }

    // ✅ Delete in background (non-blocking)
    chatDB.deleteChat(chatId).catch(error => {
      console.error('❌ Error deleting chat:', error);
    });
  };

  const handleDeleteChat = async (chatId, chatTitle) => {
    // Keep old confirm for long press (backward compatibility)
    const confirmText = t('deleteConfirmShort').replace('{title}', chatTitle);
      
    if (confirm(confirmText)) {
      // If deleting the current chat, start new chat but keep sidebar open
      const isDeletingCurrentChat = chatId === currentChatId;
      
      // 🚨 FIX: Call onChatDeleted BEFORE other operations to clear React state first
      onChatDeleted(chatId); // Clear React state immediately
      
      await chatDB.deleteChat(chatId);
      
      if (isDeletingCurrentChat) {
        onNewChatKeepSidebar(); // This will clear messages and start fresh but keep sidebar open
      }
      
      // Note: Sidebar stays open, no automatic chat selection
    }
    // Whether confirmed or cancelled, sidebar stays open
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 🌫️ OVERLAY */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          backdropFilter: 'blur(2px)',
          opacity: isOpen ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={handleOverlayClick}
      />
      
      {/* 📋 SIDEBAR */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: isMobile ? '85%' : '320px',
          maxWidth: isMobile ? '300px' : '320px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(20, 20, 20, 0.95))' // Dark mode: black gradient
            : isElora
              ? 'linear-gradient(135deg, rgba(0, 4, 40, 0.95), rgba(0, 78, 146, 0.90))' // Omnia mode: blue gradient
              : '#FDFBF7', // Light mode: solid darker cream (consistent)
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'none',
          borderRight: isLight
            ? '1px solid rgba(0, 0, 0, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1001,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        
        {/* 📱 HEADER */}
        <div style={{
          padding: '1.5rem 1.25rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: isLight ? '#000000' : '#ffffff',
              margin: 0,
              letterSpacing: '0.02em'
            }}>
              Menu
            </h2>
            
            {/* ❌ CLOSE BUTTON */}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                outline: 'none',
                padding: '0.25rem',
                borderRadius: '6px',
                fontSize: '1.25rem',
                lineHeight: 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                e.target.style.background = 'transparent';
              }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 🎯 FIXED TOP BUTTONS - ChatGPT Style (NO CARDS) */}
        <div style={{
          flexShrink: 0,
          padding: '0.5rem 0 0.75rem',
          borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.08)'
        }}>

          {/* ✏️ NEW CHAT - Transparent button */}
          <button
            onClick={() => {
              onNewChatKeepSidebar();
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: isLight ? '#000000' : '#ffffff',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <MessageCirclePlus size={20} strokeWidth={2} />
            <span>{t('newChat')}</span>
          </button>

          {/* 🔍 SEARCH CHATS - Opens SearchModal */}
          <button
            onClick={() => setShowSearchModal(true)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: isLight ? '#000000' : '#ffffff',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Search size={20} strokeWidth={2} />
            <span>Search chats</span>
          </button>

          {/* 🖼️ GALLERY - Transparent button */}
          <button
            onClick={async () => {
              console.log('🖼️ [GALLERY] Opening gallery modal...');
              const images = await chatDB.getAllImages();
              console.log(`🖼️ [GALLERY] Loaded ${images.length} images`);
              setGalleryImages(images);
              setShowGalleryModal(true);
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: isLight ? '#000000' : '#ffffff',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Images size={20} strokeWidth={2} />
            <span>Gallery</span>
          </button>
        </div>

        {/* 📜 SCROLLABLE CONTENT */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}>

          {/* 📁 PROJECTS SECTION */}
          <div style={{ padding: '16px 0' }}>
            {/* Section Label */}
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0 16px 8px',
              userSelect: 'none'
            }}>
              Projects
            </div>

            {/* Projects Button - Disabled */}
            <button
              disabled
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'not-allowed',
                outline: 'none',
                textAlign: 'left',
                opacity: 0.6
              }}
            >
              <FolderOpen size={18} strokeWidth={2} />
              <span style={{ flex: 1 }}>Projects</span>
              <span style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)'
              }}>
                soon
              </span>
            </button>
          </div>

          {/* 📏 DIVIDER */}
          <div style={{
            height: '1px',
            background: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)',
            margin: '8px 16px'
          }} />

          {/* 💬 CHATS SECTION */}
          <div style={{ padding: '16px 0' }}>
            {/* Section Label */}
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '600',
              color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0 16px 8px',
              userSelect: 'none'
            }}>
              Chats
            </div>

            {/* Chat List */}
            <div>
              {chatHistory.length === 0 ? (
                <div style={{
                  padding: '1rem 16px',
                  color: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  {t('noConversations')}
                </div>
              ) : (
                chatHistory.map((chat, index) => (
                  <button
                    key={chat.id || index}
                    onClick={() => handleChatSelect(chat.id)}
                    onTouchStart={() => handleLongPressStart(chat.id, chat.title)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchCancel={handleLongPressEnd}
                    onMouseDown={() => handleLongPressStart(chat.id, chat.title)}
                    onMouseUp={handleLongPressEnd}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      margin: '2px 0',
                      // ✅ ACTIVE CHAT = card with background
                      background: currentChatId === chat.id
                        ? (isDark
                            ? 'rgba(255, 255, 255, 0.15)'
                            : isLight
                              ? '#F5F5F5'
                              : 'rgba(255, 255, 255, 0.12)')
                        : 'transparent', // ✅ INACTIVE = transparent, no hover
                      border: currentChatId === chat.id
                        ? (isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.15)')
                        : 'none',
                      borderRadius: '8px',
                      color: isLight ? '#000000' : '#ffffff',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'none', // No hover animation
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      userSelect: 'none',
                      WebkitUserSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      // Show delete button on hover (desktop)
                      const deleteBtn = e.currentTarget.querySelector('button');
                      if (deleteBtn && !isMobile) {
                        deleteBtn.style.opacity = '1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      // Hide delete button when not hovering (desktop)
                      const deleteBtn = e.currentTarget.querySelector('button');
                      if (deleteBtn && !isMobile) {
                        deleteBtn.style.opacity = '0';
                      }
                      handleLongPressEnd();
                    }}
                  >
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {chat.title || `Chat ${index + 1}`}
                    </span>

                    {/* DELETE BUTTON (🗑️) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(chat.id, chat.title || `Chat ${index + 1}`);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isLight ? '#DC2626' : 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isMobile ? 1 : 0,
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = 'rgba(255, 100, 100, 0.8)';
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = isLight ? '#DC2626' : 'rgba(255, 255, 255, 0.4)';
                        e.currentTarget.style.opacity = isMobile ? '1' : '0';
                      }}
                      title={t('deleteChat')}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>
        
        {/* 👤 USER SECTION - FIXED BOTTOM */}
        {user && (
          <div style={{
            flexShrink: 0,
            borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* USER MAIN CARD - CLICKABLE */}
            <div style={{ padding: '1rem 0.5rem 1.5rem' }}>
              <button
                onClick={() => setShowUserSettingsModal(true)}
                style={{
                  width: '100%',
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.08)' // Dark mode: slightly brighter
                    : isLight
                      ? '#F5F5F5' // Light mode: čistá světlá šedá
                      : 'rgba(255, 255, 255, 0.05)', // Omnia mode
                  borderRadius: '12px',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.15)' // Dark mode: brighter border
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.1)' // Light-test: black border
                      : '1px solid rgba(255, 255, 255, 0.1)', // Light mode: current
                  padding: '0.75rem',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : isLight
                      ? '#EBEBEB'
                      : 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : isLight
                      ? '#F5F5F5'
                      : 'rgba(255, 255, 255, 0.05)';
                }}
              >
                {/* USER AVATAR */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  {getUserInitials(user.email)}
                </div>
                
                {/* USER INFO */}
                <div style={{
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: isLight ? '#000000' : '#ffffff',
                    marginBottom: '0.125rem'
                  }}>
                    {t('signedInAs')}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getDisplayEmail(user.email)}
                  </div>
                </div>
                
                {/* SETTINGS ICON */}
                <Settings
                  size={16}
                  style={{
                    opacity: 0.6,
                    color: isLight ? '#000000' : '#ffffff'
                  }}
                />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 🗑️ DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <>
          {/* MODAL OVERLAY */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={closeDeleteModal}
          >
            {/* MODAL CONTENT */}
            <div
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(10, 10, 10, 0.95))'
                  : isElora
                    ? 'linear-gradient(135deg, rgba(0, 4, 40, 0.95), rgba(0, 78, 146, 0.90))'
                    : 'linear-gradient(135deg, rgba(253, 251, 247, 0.98), rgba(253, 251, 247, 0.95))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : isLight
                    ? '1px solid rgba(0, 0, 0, 0.1)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1.5rem',
                minWidth: '280px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div style={{
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: isLight ? '#000000' : '#ffffff',
                  marginBottom: '0.5rem'
                }}>
                  {t('deleteChat')}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.4'
                }}>
                  {t('deleteConfirmation').replace('{title}', deleteModal.chatTitle)}
                </div>
              </div>
              
              {/* MODAL BUTTONS */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                {/* CANCEL BUTTON */}
                <button
                  onClick={closeDeleteModal}
                  style={{
                    background: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : isLight
                        ? 'rgba(0, 0, 0, 0.08)'
                        : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    color: isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = isDark
                      ? 'rgba(255, 255, 255, 0.18)'
                      : isLight
                        ? 'rgba(0, 0, 0, 0.15)'
                        : 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = isLight ? '#000000' : '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : isLight
                        ? 'rgba(0, 0, 0, 0.08)'
                        : 'rgba(255, 255, 255, 0.08)';
                    e.target.style.color = isLight ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  {t('cancel')}
                </button>
                
                {/* DELETE BUTTON */}
                <button
                  onClick={confirmDeleteChat}
                  style={{
                    background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                    e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #DC2626, #B91C1C)';
                    e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* GALLERY MODAL */}
      <GalleryModal
        isOpen={showGalleryModal}
        onClose={() => {
          setShowGalleryModal(false);
          // Clear images array to free memory
          setTimeout(() => setGalleryImages([]), 300); // Wait for modal close animation
        }}
        images={galleryImages}
        onOpenGalleryLightbox={onOpenGalleryLightbox}
      />

      {/* USER SETTINGS MODAL */}
      {showUserSettingsModal && (
        <UserSettingsModal
          isOpen={showUserSettingsModal}
          onClose={() => setShowUserSettingsModal(false)}
          user={user}
          uiLanguage={uiLanguage}
          setUILanguage={setUILanguage}
          onResetPassword={onResetPassword}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteAccount}
          currentModel={currentModel}
          onModelChange={onModelChange}
          onShowSummaryChange={onShowSummaryChange}
        />
      )}

      {/* SEARCH MODAL */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        chatHistory={chatHistory}
        onSelectChat={(chatId, messageUuid) => {
          onSelectChat(chatId, messageUuid);  // Open chat + scroll to message
          onClose();                           // Close ChatSidebar
        }}
        currentChatId={currentChatId}
        uiLanguage={uiLanguage}
      />
    </>
  );
};

export default ChatSidebar;