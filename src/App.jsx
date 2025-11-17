// 🚀 OMNIA - APP.JSX PART 1/3 - IMPORTS + STATE + EFFECTS (REDESIGNED)
// ✅ ADDED: ChatSidebar + NewChatButton imports
// ✅ ADDED: welcomeTexts for multilingual welcome
// ✅ SIMPLIFIED: Removed complex scroll system
// 🎯 UNCHANGED: Všechny původní importy a funkčnost
// 🆕 STREAMING: Added streamingUtils import

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import './App.css';
import { Virtuoso } from 'react-virtuoso';
import MDEditor from '@uiw/react-md-editor';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

// 🖼️ YARL - Yet Another React Lightbox with plugins
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";

// 🔧 IMPORT SERVICES (MODULAR)
import { claudeService, openaiService, geminiService } from './services/ai';
import { elevenLabsService } from './services/voice';
import authService from './services/auth/supabaseAuth'; // 🔐 Auth service
import { chatSyncService } from './services/sync/chatSync.js'; // 🔄 Chat sync service
import RealtimeService from './services/sync/realtimeSync.js'; // 🔄 Realtime sync service (Phase 2 smoke test)
import { supabase } from './services/supabase/client.js'; // 🔄 Supabase client for Realtime
import { consentService } from './services/consent/consentService.js'; // 📋 Consent tracking service

// 🔧 IMPORT UTILS (MODULAR + STREAMING)
import { uiTexts, getTranslation, detectLanguage, sanitizeText } from './utils/text';
import { DEVICE_ID } from './utils/deviceId.js'; // 📱 Device ID for Realtime deduplication
import { shouldTriggerSummarization, getMessagesToSummarize, buildContextForElora } from './utils/contextBuilder'; // 📊 Summary system
import { syncStrategy } from './services/sync/syncStrategy'; // 🎯 Sync strategy manager
import { sessionManager } from './services/storage';
import chatDB, { db } from './services/storage/chatDB'; // 💾 IndexedDB for chat history
import { smartIncrementalSave } from './services/storage/smartSave.js';
import { crashMonitor } from './utils/crashMonitor';
import { streamMessageWithEffect, smartScrollToBottom } from './utils/ui'; // 🆕 STREAMING
import mobileAudioManager from './utils/MobileAudioManager.js'; // 🎵 Mobile audio handling
import * as styles from './styles/ChatStyles.js'; // 🎨 All chat styles
import { generateMessageId } from './utils/messageUtils.js'; // 📝 Message utilities
import { welcomeTexts, getTimeBasedGreeting } from './constants/welcomeTexts.js'; // 🌍 Welcome texts
import { createNotificationSystem } from './utils/notificationUtils.js'; // 🔔 Notifications
import { convertFileToBase64 } from './utils/fileUtils.js'; // 📁 File utilities
import { uploadToSupabaseStorage, uploadBase64ToSupabaseStorage } from './services/storage/supabaseStorage.js'; // 📦 Supabase Storage
import { getUploadErrorMessages } from './constants/errorMessages.js'; // 🚨 Error messages
import { uploadDirectToGCS, processGCSDocument, shouldUseDirectUpload, formatFileSize } from './services/directUpload.js'; // 🗂️ Direct upload to GCS
import { scrollToUserMessageAt, scrollToLatestMessage, scrollToBottom, scrollToMessageByUuid } from './utils/scrollUtils.js'; // 📜 Scroll utilities
import { convertMessagesForOpenAI } from './utils/messageConverters.js'; // 🔄 Message format converters

// 🔧 IMPORT UI COMPONENTS (MODULAR)
import { SettingsDropdown, OmniaLogo, MiniOmniaLogo, OfflineIndicator, SplashScreen } from './components/ui';

import { VoiceScreen } from './components/chat';
import MessageItem from './components/chat/MessageItem';

// 🆕 IMPORT INPUT BAR (MODULAR)
import { InputBar } from './components/input';

// 🔗 IMPORT SOURCES COMPONENTS (UNCHANGED)
import { SourcesModal } from './components/sources';

// 🆕 NEW COMPONENTS - Added for redesign
import { ChatSidebar } from './components/layout';
import DocumentViewer from './components/modals/DocumentViewer.jsx'; // 📄 Document viewer
import PdfViewer from './components/PdfViewer.jsx'; // 📚 Secure PDF viewer (react-pdf)
import AuthModal from './components/auth/AuthModal.jsx'; // 🔐 Auth modal
import ResetPasswordModal from './components/auth/ResetPasswordModal.jsx'; // 🔐 Reset password modal
import TermsConsentModal from './components/modals/TermsConsentModal.jsx'; // 📋 Terms consent modal
 // 🌐 Website component

// 📶 HOOKS - For offline detection
import { useOnlineStatus } from './hooks/useOnlineStatus';

// 🎨 THEME CONTEXT
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// 🆕 SENTENCE SPLITTER (UNCHANGED)

// ✅ CONSOLE CLEANUP: Vite automatically removes console.log in production builds

// Main App Component wrapped with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// App Content that uses theme context
function AppContent() {
  const { theme, isDark, isLight, isElora } = useTheme();

  // 🎨 UPDATE STATUS BAR COLOR based on theme
  useEffect(() => {
    // Update theme-color meta tag (single universal tag)
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    let themeColor;
    if (isLight) {
      themeColor = '#FDFBF7'; // Light mode (darker cream) - MAIN THEME
    } else if (isDark) {
      themeColor = '#000000'; // Dark mode
    } else if (isElora) {
      themeColor = '#0055aa'; // Omnia mode (blue gradient)
    }

    // Update single tag
    if (metaTheme) {
      metaTheme.setAttribute('content', themeColor);
    }

    // 🔍 DEBUG: Log theme changes
    console.log('🎨 [THEME DEBUG]', {
      theme,
      isDark,
      isLight: !isDark && !isElora,
      isElora,
      themeColor,
      deviceDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      metaTagValue: metaTheme?.getAttribute('content'),
      statusBarStyle: document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content')
    });

    // Update apple status bar style
    const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBar) {
      // Always use 'default' to respect theme-color for ALL themes
      // This prevents black-translucent from overriding light themes when switching
      appleStatusBar.setAttribute('content', 'default');
    }

    // 🍎 iOS 26 IAV Fix - Set data-theme for CSS variables (use actual theme name)
    document.documentElement.setAttribute('data-theme', theme);

    // 🍎 Body transparent - background handled by main container
    document.body.style.backgroundColor = 'transparent';
  }, [theme, isDark, isElora]);

  // 📊 BASIC STATE (UNCHANGED)
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [model, setModel] = useState(() => {
    const savedModel = sessionManager.getSelectedModel();
    return savedModel || 'gemini-2.5-flash'; // Gemini as default (cost-effective)
  });
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const inputRef = useRef();
  const messagesRef = useRef();
  const uploadedDocumentsRef = useRef();
  // Ref for tracking parallel upload progress to prevent race conditions
  const parallelUploadInProgress = useRef(false);
  // Ref for web search shimmer timeout (2.5s delay for "Getting results...")
  const searchShimmerTimeout = useRef(null);
  // 🔄 Ref for Realtime sync service (Phase 3)
  const realtimeServiceRef = useRef(null);

  // 🎤 VOICE STATE (UNCHANGED)
  const [showVoiceScreen, setShowVoiceScreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [lightboxState, setLightboxState] = useState({ open: false, index: 0, slides: [] }); // For YARL lightbox
  const [documentViewer, setDocumentViewer] = useState({ isOpen: false, document: null }); // For document viewer
  const [pdfViewerData, setPdfViewerData] = useState({ isOpen: false, url: null, title: null, filename: null }); // For secure PDF viewer
  const [isRecordingSTT, setIsRecordingSTT] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  
  // 🆕 MODEL SWITCH STATE FOR VOICE (UNCHANGED)
  const [previousModel, setPreviousModel] = useState(null);
  
  // 🌍 LANGUAGE & UI STATE - SYNC WITH UI DETECTION
  const [userLanguage, setUserLanguage] = useState(() => sessionManager.getUILanguage());
  const [uiLanguage, setUILanguage] = useState(() => sessionManager.getUILanguage());
  
  // 🔗 SOURCES STATE (UNCHANGED)
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [currentSources, setCurrentSources] = useState([]);

  
  // 🆕 NEW SIDEBAR STATE - Added for redesign
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  
  // 🔐 AUTH STATE - for Supabase authentication
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [showTermsConsent, setShowTermsConsent] = useState(false); // 📋 Terms consent modal state
  const currentChatIdRef = useRef(null); // 🔧 useRef backup to prevent race condition
  const [chatHistories, setChatHistories] = useState([]);
  
  // 🔄 Sync dirty tracking - for 30s incremental sync
  const [syncDirtyChats, setSyncDirtyChats] = useState(new Set());
  
  // 📦 UPLOAD QUEUE SYSTEM - Smart delayed uploads
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isAIStreaming, setIsAIStreaming] = useState(false);
  
  // 🔄 Sync AI streaming state with main streaming state
  useEffect(() => {
    setIsAIStreaming(streaming);
    
    // Only process generated content uploads when AI streaming ends (user files handled in InputBar)
    if (!streaming && uploadQueue.length > 0) {
      console.log('🎯 [UPLOAD-TRIGGER] AI streaming ended, processing generated content uploads in 2s');
      setTimeout(() => {
        const generatedQueue = uploadQueue.filter(item =>
          item.type === 'generated_image' || item.type === 'generated_pdf'
        );
        if (generatedQueue.length > 0) {
          processUploadQueue(0);
        }
      }, 2000);
    }
  }, [streaming, uploadQueue]);

  // 🎬 SPLASH SCREEN STATE - PWA startup animation
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  // 🔧 Helper functions for safe chatId management
  const updateCurrentChatId = (newId) => {
    setCurrentChatId(newId);
    currentChatIdRef.current = newId;
  };

  const getSafeChatId = () => {
    // Prefer ref over state as it's more stable during re-renders
    const safeId = currentChatIdRef.current || currentChatId;
    if (!safeId) {
      console.error('⚠️ [CRITICAL] Both currentChatId and ref are null!', {
        state: currentChatId,
        ref: currentChatIdRef.current,
        stack: new Error().stack
      });
    }
    return safeId;
  };
  
  // 🆕 STREAMING STATE - For controlling streaming effect
  const [stopStreamingRef, setStopStreamingRef] = useState(null);
  
  // 📄 BATCH LOADING STATE - For pagination
  
  // 🎨 BREATHING ANIMATION - Removed for performance (now using CSS only)
  
  // 🔽 SCROLL TO BOTTOM - Show button when user scrolled up
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const prevScrollButtonState = useRef(false); // ✅ Prevent unnecessary setState in rangeChanged
  const [shouldFollowOutput, setShouldFollowOutput] = useState(true); // Follow output when chat opens
  
  // Reset followOutput when switching chats or loading new messages
  useEffect(() => {
    setShouldFollowOutput(true);
    
    // Explicitly scroll to bottom when chat opens
    if (virtuosoRef.current && messages.length > 0) {
      // Small delay to ensure Virtuoso is ready
      setTimeout(() => {
        virtuosoRef.current.scrollToIndex({
          index: messages.length - 1,
          behavior: 'smooth'
        });
      }, 100);
    }
    
    // Disable followOutput after a short delay 
    const timer = setTimeout(() => {
      setShouldFollowOutput(false);
    }, 1500); // 1.5 seconds to scroll to bottom, then disable
    
    return () => clearTimeout(timer);
  }, [currentChatId]); // Trigger only when switching chats
  
  // ❌ REMOVED: All scroll limit logic - keeping only spacer
  
  // 🎨 IMAGE GENERATION STATE - For switching between chat and image modes
  const [isImageMode, setIsImageMode] = useState(false);

  // 💡 DEEP REASONING STATE - For Claude thinking mode
  const [deepReasoningEnabled, setDeepReasoningEnabled] = useState(() => {
    // Load from localStorage on mount (synced with InputBar)
    const saved = localStorage.getItem('deepReasoning');
    const enabled = saved === 'true';
    console.log(`💡 [DEEP-REASONING] Initial state loaded from localStorage: ${enabled ? 'ON' : 'OFF'}`);
    return enabled;
  });

  // 📊 SHOW SUMMARY STATE - For hiding/showing summary cards and shimmer
  const [showSummary, setShowSummary] = useState(() => {
    const saved = localStorage.getItem('showSummary');
    return saved === null ? false : saved === 'true'; // Default: OFF
  });

  // 🔄 PWA UPDATE STATE - For handling app updates

  // 📶 ONLINE STATUS - For offline detection
  const { isOnline, isOffline, connectionType, connectionInfo} = useOnlineStatus();
  
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  
  // 📄 Smart document context management - tracks which documents AI can currently see
  const [activeDocumentContexts, setActiveDocumentContexts] = useState([]);
  
  // 📱 DEVICE STATE (UNCHANGED)
  const currentAudioRef = useRef(null);
  const endOfMessagesRef = useRef(null);
  const sttRecorderRef = useRef(null);
  const mainContentRef = useRef(null);
  const virtuosoRef = useRef(null);
  
  const isMobile = window.innerWidth <= 1200;
  const t = getTranslation(uiLanguage);

  // 💾 SAVE SELECTED MODEL TO LOCALSTORAGE
  useEffect(() => {
    sessionManager.saveSelectedModel(model);
  }, [model]);

  // 🔄 PWA UPDATE EVENT LISTENERS
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('🔍 Setting up PWA event listeners...');
    
    // Service Worker is now handled automatically
  }, []);

  // 🔄 REALTIME CALLBACK HANDLERS (Phase 3)
  // These functions handle real-time events from Supabase

  /**
   * Handle new chat inserted (from another device or this device)
   * Updates chatHistories state and ensures IndexedDB consistency
   */
  const handleRealtimeNewChat = async (chat) => {
    console.log('🆕 [REALTIME] New chat detected:', {
      id: chat.id,
      title: chat.title,
      created_at: chat.created_at
    });

    try {
      // 1️⃣ DIRECT INDEXEDDB WRITE (bypass syncInProgress lock)
      const chatData = {
        id: chat.id,
        title: chat.title,
        createdAt: new Date(chat.created_at).getTime(),
        updatedAt: new Date(chat.updated_at).getTime(),
        messageCount: 0 // Empty initially, will be updated when messages sync
      };

      console.log('💾 [REALTIME] Writing chat to IndexedDB:', chat.id);
      await db.chats.put(chatData); // Upsert - prevents duplicates thanks to primary key
      console.log('✅ [REALTIME] Chat saved to IndexedDB:', chat.id);

      // 2️⃣ UPDATE REACT STATE (with duplicate check)
      setChatHistories(prev => {
        const exists = prev.some(c => c.id === chat.id);
        if (exists) {
          console.log('⚠️ [REALTIME] Chat already in React state, skipping UI update');
          return prev;
        }

        console.log('✅ [REALTIME] Adding chat to React state:', chat.id);
        return [chatData, ...prev]; // Prepend to show at top
      });

      // 3️⃣ UPDATE lastGlobalDownloadSync (tell pool sync we got this)
      const chatTimestamp = new Date(chat.created_at);
      const currentLastSync = localStorage.getItem('lastGlobalDownloadSync');
      const currentLastSyncDate = currentLastSync ? new Date(currentLastSync) : new Date(0);

      if (chatTimestamp > currentLastSyncDate) {
        localStorage.setItem('lastGlobalDownloadSync', chat.created_at);
        console.log(`⏰ [REALTIME] Updated lastSync: ${chat.created_at} (pool sync won't re-fetch)`);
      } else {
        console.log(`⏰ [REALTIME] Skipped lastSync update (event older than current: ${currentLastSync})`);
      }

      console.log('🎯 [REALTIME] New chat handled successfully:', chat.id);
    } catch (error) {
      console.error('❌ [REALTIME] Error handling new chat:', error);
      console.error('❌ [REALTIME] Failed chat data:', chat);
    }
  };

  /**
   * Handle chat updated (title changed, etc.)
   * Updates existing chat in chatHistories state
   */
  const handleRealtimeUpdateChat = async (chat, oldChat) => {
    console.log('📝 [REALTIME] Chat updated:', {
      id: chat.id,
      oldTitle: oldChat?.title,
      newTitle: chat.title
    });

    try {
      // 1️⃣ UPDATE INDEXEDDB (get existing chat, update metadata)
      console.log('💾 [REALTIME] Updating chat in IndexedDB:', chat.id);
      const existingChat = await db.chats.get(chat.id);

      if (existingChat) {
        // Update with new metadata
        const updatedChatData = {
          ...existingChat,
          title: chat.title,
          updatedAt: new Date(chat.updated_at).getTime()
        };
        await db.chats.put(updatedChatData); // Upsert
        console.log('✅ [REALTIME] Chat updated in IndexedDB:', chat.id);
      } else {
        // Chat doesn't exist locally - create it (edge case: update event arrives before insert)
        console.log('⚠️ [REALTIME] Chat not found in IndexedDB, creating:', chat.id);
        await db.chats.put({
          id: chat.id,
          title: chat.title,
          createdAt: new Date(chat.created_at).getTime(),
          updatedAt: new Date(chat.updated_at).getTime(),
          messageCount: 0
        });
      }

      // 2️⃣ UPDATE REACT STATE
      setChatHistories(prev => {
        const updated = prev.map(c =>
          c.id === chat.id
            ? { ...c, title: chat.title, updatedAt: new Date(chat.updated_at).getTime() }
            : c
        );

        // Check if chat exists in state
        const exists = prev.some(c => c.id === chat.id);
        if (!exists) {
          // Edge case: update arrived before insert, add to state
          console.log('⚠️ [REALTIME] Chat not in React state, adding:', chat.id);
          return [{
            id: chat.id,
            title: chat.title,
            createdAt: new Date(chat.created_at).getTime(),
            updatedAt: new Date(chat.updated_at).getTime(),
            messageCount: 0
          }, ...prev];
        }

        console.log('✅ [REALTIME] Chat updated in React state:', chat.id);
        return updated;
      });

      // 3️⃣ UPDATE lastGlobalDownloadSync
      const chatTimestamp = new Date(chat.updated_at);
      const currentLastSync = localStorage.getItem('lastGlobalDownloadSync');
      const currentLastSyncDate = currentLastSync ? new Date(currentLastSync) : new Date(0);

      if (chatTimestamp > currentLastSyncDate) {
        localStorage.setItem('lastGlobalDownloadSync', chat.updated_at);
        console.log(`⏰ [REALTIME] Updated lastSync: ${chat.updated_at}`);
      }

      console.log('🎯 [REALTIME] Chat update handled successfully:', chat.id);
    } catch (error) {
      console.error('❌ [REALTIME] Error handling chat update:', error);
      console.error('❌ [REALTIME] Failed chat data:', chat);
    }
  };

  /**
   * Handle chat deleted (from another device)
   * Removes chat from chatHistories state
   */
  const handleRealtimeDeleteChat = async (chat) => {
    console.log('🗑️ [REALTIME] Chat deleted:', {
      id: chat.id,
      title: chat.title
    });

    try {
      // 0️⃣ CHECK IF CHAT EXISTS (may already be deleted on Device A)
      const existingChat = await db.chats.get(chat.id);
      if (!existingChat) {
        console.log('⏭️ [REALTIME] Chat already deleted locally, skipping');
        return;
      }

      // 1️⃣ DELETE FROM INDEXEDDB (use skipSync to avoid re-deleting on Supabase)
      // This will ATOMICALLY delete chat + all messages
      console.log('💾 [REALTIME] Deleting chat from IndexedDB:', chat.id);
      await chatDB.deleteChat(chat.id, { skipSync: true });
      console.log('✅ [REALTIME] Chat deleted from IndexedDB:', chat.id);

      // 2️⃣ UPDATE REACT STATE
      setChatHistories(prev => {
        const filtered = prev.filter(c => c.id !== chat.id);
        console.log('✅ [REALTIME] Chat removed from React state:', chat.id);
        return filtered;
      });

      // 3️⃣ CLEAR MESSAGES IF CURRENTLY OPEN
      if (currentChatIdRef.current === chat.id) {
        console.log('⚠️ [REALTIME] Currently open chat was deleted, clearing messages');
        setMessages([]);
        // Note: Don't clear currentChatId - let user create new chat naturally
      }

      console.log('🎯 [REALTIME] Chat deletion handled successfully:', chat.id);
    } catch (error) {
      console.error('❌ [REALTIME] Error handling chat deletion:', error);
      console.error('❌ [REALTIME] Failed chat data:', chat);
    }
  };

  // 🔄 REALTIME MESSAGE HANDLERS (for messages table)
  // Handle new message from Realtime (multi-device sync)

  /**
   * Handle new message inserted via Realtime
   * Saves to IndexedDB and updates React state if message belongs to current chat
   */
  const handleRealtimeNewMessage = async (message) => {
    console.log('💬 [REALTIME] New message detected:', {
      uuid: message.id,
      chatId: message.chat_id,
      sender: message.sender,
      text: message.content?.substring(0, 50)
    });

    try {
      // 1️⃣ WRITE MESSAGE TO INDEXEDDB
      // ✅ EXACT MAPPING from pool sync (chatSync.js line 468-482)
      const messageData = {
        uuid: message.id, // Supabase 'id' → IndexedDB 'uuid'
        id: message.id, // ✅ FIX: Also populate id field for context builder compatibility
        chatId: message.chat_id,
        timestamp: new Date(message.timestamp).getTime(), // Convert timestamptz to bigint
        sender: message.sender,
        text: message.content, // ✅ Supabase 'content' → IndexedDB 'text'
        type: message.type || 'text',
        device_id: message.device_id, // 📱 Device ID for deduplication
        attachments: message.attachments,
        image: message.image,
        images: message.images,
        pdf: message.pdf,
        artifact: message.artifact || null, // 🎨 ARTIFACTS: Save HTML artifact data
        sources: message.sources || null,
        hasMetadata: message.has_metadata || !!(message.metadata && message.metadata.summaryContent),
        metadata: message.metadata || null
      };

      console.log('💾 [REALTIME] Writing message to IndexedDB:', message.id);
      await db.messages.put(messageData); // Upsert
      console.log('✅ [REALTIME] Message saved to IndexedDB');

      // 2️⃣ UPDATE CHAT METADATA (increment messageCount)
      const chat = await db.chats.get(message.chat_id);
      if (chat) {
        await db.chats.update(message.chat_id, {
          messageCount: (chat.messageCount || 0) + 1,
          updatedAt: new Date(message.timestamp).getTime()
        });
        console.log('✅ [REALTIME] Chat messageCount updated');
      }

      // 3️⃣ UPDATE REACT STATE (only if message belongs to CURRENT chat)
      console.log('🔍 [DEBUG] currentChatIdRef.current:', currentChatIdRef.current);
      console.log('🔍 [DEBUG] message.chat_id:', message.chat_id);
      console.log('🔍 [DEBUG] Match:', currentChatIdRef.current === message.chat_id);

      if (currentChatIdRef.current === message.chat_id) {
        console.log('📱 [REALTIME] Message for current chat, updating UI');
        setMessages(prev => {
          console.log('🔍 [DEBUG] Current messages in state:', prev.length);
          console.log('🔍 [DEBUG] Checking for duplicate:', {
            uuid: messageData.uuid,
            device_id: messageData.device_id,
            sender: messageData.sender
          });

          // 🛡️ DEFENSE IN DEPTH: Dual-layer deduplication
          // PRIMARY DEFENSE: device_id check (skip own messages - 99% of cases)
          if (messageData.device_id && messageData.device_id === DEVICE_ID) {
            console.log('🟡 [REALTIME] Skipping own message (device_id match)');
            return prev;
          }

          // SECONDARY DEFENSE: UUID check (edge cases: NULL device_id, multi-tab, race conditions)
          const exists = prev.some(m => m.uuid === messageData.uuid);
          if (exists) {
            console.log('🟡 [REALTIME] Skipping duplicate (UUID match)');
            return prev;
          }

          console.log('✅ [REALTIME] Adding new message to state (from different device)');
          return [...prev, messageData];
        });
      } else {
        console.log('📦 [REALTIME] Message for different chat, saved to IndexedDB only');
        console.log('🔍 [DEBUG] Will appear when user opens chat:', message.chat_id);
      }

      // 4️⃣ UPDATE lastGlobalDownloadSync
      const msgTimestamp = new Date(message.timestamp);
      const currentLastSync = localStorage.getItem('lastGlobalDownloadSync');
      const currentLastSyncDate = currentLastSync ? new Date(currentLastSync) : new Date(0);

      if (msgTimestamp > currentLastSyncDate) {
        localStorage.setItem('lastGlobalDownloadSync', message.timestamp);
        console.log(`⏰ [REALTIME] Updated lastSync: ${message.timestamp}`);
      }

      console.log('🎯 [REALTIME] New message handled successfully');
    } catch (error) {
      console.error('❌ [REALTIME] Error handling new message:', error);
      console.error('❌ [REALTIME] Failed message data:', message);
    }
  };

  /**
   * Handle message update via Realtime
   */
  const handleRealtimeUpdateMessage = async (message) => {
    console.log('📝 [REALTIME] Message updated:', message.id);

    try {
      // 1️⃣ UPDATE IN INDEXEDDB
      // ✅ EXACT MAPPING from pool sync
      const existingMessage = await db.messages.get(message.id);
      if (existingMessage) {
        await db.messages.put({
          ...existingMessage,
          text: message.content,           // ✅ Supabase 'content' → IndexedDB 'text'
          timestamp: new Date(message.timestamp).getTime(),
          attachments: message.attachments,
          image: message.image,
          images: message.images,
          sources: message.sources || null,
          hasMetadata: message.has_metadata || !!(message.metadata && message.metadata.summaryContent),
          metadata: message.metadata || null
        });
        console.log('✅ [REALTIME] Message updated in IndexedDB');
      }

      // 2️⃣ UPDATE REACT STATE (if in current chat)
      if (currentChatIdRef.current === message.chat_id) {
        setMessages(prev =>
          prev.map(m =>
            m.uuid === message.id
              ? { ...m, text: message.content, timestamp: new Date(message.timestamp).getTime() }
              : m
          )
        );
        console.log('✅ [REALTIME] Message updated in React state');
      }

      console.log('🎯 [REALTIME] Message update handled successfully');
    } catch (error) {
      console.error('❌ [REALTIME] Error handling message update:', error);
    }
  };

  /**
   * Handle message deletion via Realtime
   */
  const handleRealtimeDeleteMessage = async (message) => {
    console.log('🗑️ [REALTIME] Message deleted:', message.id);

    try {
      // 1️⃣ DELETE FROM INDEXEDDB (always delete for security - prevent orphaned messages)
      // ✅ Use message.id (Supabase UUID)
      await db.messages.delete(message.id);
      console.log('✅ [REALTIME] Message deleted from IndexedDB');

      // 2️⃣ UPDATE CHAT METADATA (decrement messageCount)
      // Note: Chat might already be deleted ATOMICALLY by handleRealtimeDeleteChat
      // This is OK - messages are cleaned up by CASCADE DELETE
      try {
        if (message.chat_id) {
          const chat = await db.chats.get(message.chat_id);
          if (chat && chat.messageCount > 0) {
            await db.chats.update(message.chat_id, {
              messageCount: chat.messageCount - 1
            });
            console.log('✅ [REALTIME] Chat messageCount decremented');
          }
        }
      } catch (chatError) {
        // Chat doesn't exist (already deleted ATOMICALLY) - this is expected
        console.log('⏭️ [REALTIME] Chat already deleted, skipping messageCount update');
      }

      // 3️⃣ UPDATE REACT STATE (if in current chat)
      if (currentChatIdRef.current === message.chat_id) {
        setMessages(prev => prev.filter(m => m.uuid !== message.id));
        console.log('✅ [REALTIME] Message removed from React state');
      }

      console.log('🎯 [REALTIME] Message deletion handled successfully');
    } catch (error) {
      console.error('❌ [REALTIME] Error handling message deletion:', error);
    }
  };

  // 🔐 AUTH INITIALIZATION - Test Supabase connection
  useEffect(() => {
    let subscription;
    
    const initAuth = async () => {
      console.log('🔐 Testing Supabase auth connection...');
      
      try {
        // Get current user if exists
        const currentUser = await authService.getCurrentUser();
        console.log('👤 Current user:', currentUser?.email || 'Not logged in');
        setUser(currentUser);

        // 🧹 CLEANUP: If user not logged in, clear orphaned IndexedDB data
        // This handles: account deletion, global sign-out from other device, session expiration
        if (!currentUser) {
          const localChats = await chatDB.getAllChats();
          if (localChats.length > 0) {
            console.log(`🧹 [CLEANUP] User not logged in but found ${localChats.length} orphaned chats in IndexedDB`);
            console.log('🗑️ [CLEANUP] Clearing orphaned data...');
            await chatDB.clearAllData();
            console.log('✅ [CLEANUP] Orphaned IndexedDB data cleared');
          }
        }

        // ⚡ Smart sync: Full sync if DB is empty, incremental if has data
        if (currentUser) {
          // Check if IndexedDB is empty (after sign out or fresh install)
          const localChats = await chatDB.getAllChats();

          if (localChats.length === 0) {
            console.log('📥 [SYNC] Empty IndexedDB detected, starting FULL sync...');
            chatSyncService.clearSyncCooldown();
            try {
              await chatSyncService.fullSync();
            } catch (error) {
              console.error('❌ [SYNC] Full sync failed:', error);
            }
          } else {
            console.log('⚡ [SYNC] Local chats found, starting incremental sync...');
            chatSyncService.clearSyncCooldown();
            try {
              await chatSyncService.backgroundSync(); // Now calls incrementalSync() internally
            } catch (error) {
              console.error('❌ [SYNC] Background sync failed:', error);
            }
          }

          // 🔄 [REALTIME] Initialize Realtime sync service (Phase 3 - Production)
          console.log('🔄 [REALTIME] Initializing real-time sync...');
          try {
            const realtimeService = new RealtimeService(supabase, currentUser.id);

            // Subscribe to chats table changes with production callbacks
            realtimeService.subscribe('chats', {
              onInsert: handleRealtimeNewChat,
              onUpdate: handleRealtimeUpdateChat,
              onDelete: handleRealtimeDeleteChat
            });

            // Subscribe to messages table changes (multi-device message sync)
            realtimeService.subscribe('messages', {
              onInsert: handleRealtimeNewMessage,
              onUpdate: handleRealtimeUpdateMessage,
              onDelete: handleRealtimeDeleteMessage
            });

            // Store reference for cleanup and access from other functions
            realtimeServiceRef.current = realtimeService;
            syncStrategy.setRealtimeService(realtimeService); // ✅ Register with strategy

            console.log('✅ [REALTIME] Real-time sync initialized successfully');
          } catch (error) {
            console.error('❌ [REALTIME] Initialization failed:', error);
          }

          // 📱 iOS PWA Recovery: Restore last active chat from localStorage
          try {
            const savedChatId = sessionManager.getCurrentChatId();
            if (savedChatId) {
              console.log('📱 [iOS-PWA] Found saved chat ID, attempting restore:', savedChatId);

              // Check if chat exists in IndexedDB
              const chatData = await chatDB.getAllMessagesForChat(savedChatId);
              if (chatData && chatData.messages.length > 0) {
                console.log('✅ [iOS-PWA] Restoring chat with', chatData.messages.length, 'messages');

                // Restore chat state
                setMessages(chatData.messages);
                updateCurrentChatId(savedChatId);

                console.log('✅ [iOS-PWA] Chat restored successfully');
              } else {
                console.log('⚠️ [iOS-PWA] Saved chat not found in IndexedDB, starting fresh');
              }
            }
          } catch (restoreError) {
            console.error('❌ [iOS-PWA] Chat restore failed:', restoreError);
            // Don't block app if restore fails
          }
        }

        // Listen to auth changes
        // Track if we're already signed in to avoid PWA wake sync loops
        let isAlreadySignedIn = !!currentUser; // Set to true if user already logged in
        
        subscription = authService.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth event:', event);
          console.log('🔄 Session user:', session?.user?.email || 'No user in session');
          setUser(session?.user || null);
          
          // 🔄 Start background sync ONLY for real logins, not PWA wake events
          if (session?.user && event === 'SIGNED_IN') {
            if (isAlreadySignedIn) {
              // PWA wake with existing session - skip unnecessary sync
              console.log('✅ [SYNC] PWA wake with existing session, skipping unnecessary sync');
              return;
            }

            // Real login - do full sync with ghost cleanup (only time we need full sync)
            console.log('🚀 [SYNC] Real user login, starting full sync with ghost cleanup...');
            isAlreadySignedIn = true;
            try {
              await chatSyncService.fullSync(); // Only genuine first login needs full sync
            } catch (error) {
              console.error('❌ [SYNC] Full sync failed:', error);
            }

            // 🔄 [REALTIME] Initialize Realtime after login (if not already initialized)
            if (!realtimeServiceRef.current) {
              console.log('🔄 [REALTIME] Initializing real-time sync after login...');
              try {
                const realtimeService = new RealtimeService(supabase, session.user.id);

                // Subscribe to chats table changes with production callbacks
                realtimeService.subscribe('chats', {
                  onInsert: handleRealtimeNewChat,
                  onUpdate: handleRealtimeUpdateChat,
                  onDelete: handleRealtimeDeleteChat
                });

                // Subscribe to messages table changes (multi-device message sync)
                realtimeService.subscribe('messages', {
                  onInsert: handleRealtimeNewMessage,
                  onUpdate: handleRealtimeUpdateMessage,
                  onDelete: handleRealtimeDeleteMessage
                });

                // Store reference for cleanup and access from other functions
                realtimeServiceRef.current = realtimeService;
                syncStrategy.setRealtimeService(realtimeService); // ✅ Register with strategy

                console.log('✅ [REALTIME] Real-time sync initialized successfully after login');
              } catch (error) {
                console.error('❌ [REALTIME] Initialization failed after login:', error);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            // Reset flag on logout
            isAlreadySignedIn = false;

            // 🔄 [REALTIME] Cleanup Realtime on logout
            if (realtimeServiceRef.current) {
              console.log('🧹 [REALTIME] Cleaning up subscriptions on logout...');
              realtimeServiceRef.current.unsubscribeAll();
              realtimeServiceRef.current = null;
            }
          }
        });
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        setAuthLoading(false);
        console.log('✅ Auth loading complete');
      }
    };
    
    initAuth();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      // 🔄 [REALTIME] Cleanup Realtime subscriptions
      if (realtimeServiceRef.current) {
        console.log('🧹 [REALTIME] Cleaning up subscriptions...');
        realtimeServiceRef.current.unsubscribeAll();
        realtimeServiceRef.current = null;
      }
    };
  }, []);

  // 📋 TERMS CONSENT CHECK - Show modal if user hasn't accepted terms
  useEffect(() => {
    const checkConsent = async () => {
      if (user && !authLoading) {
        console.log('📋 [CONSENT] Checking terms consent for user:', user.id);

        try {
          const needsConsent = await consentService.needsAnyConsent(user.id);

          if (needsConsent) {
            console.log('⚠️ [CONSENT] User needs to accept terms - showing modal');
            setShowTermsConsent(true);
          } else {
            console.log('✅ [CONSENT] User has already accepted terms');
            setShowTermsConsent(false);
          }
        } catch (error) {
          console.error('❌ [CONSENT] Error checking consent:', error);
          // On error, don't show modal (fail-safe - let user continue)
        }
      } else if (!user) {
        // No user logged in - hide modal
        setShowTermsConsent(false);
      }
    };

    checkConsent();
  }, [user, authLoading]);

  // 🆕 AUDIO INITIALIZATION (UNCHANGED)
  useEffect(() => {
    mobileAudioManager.initialize();
    
    const handleUserInteraction = () => {
      if (!userHasInteracted) {
        setUserHasInteracted(true);
        console.log('👆 First user interaction detected');
        mobileAudioManager.unlockAudioContext();
      }
    };
    
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [userHasInteracted]);

  // 🔍 WEB SEARCH SHIMMER CLEANUP
  useEffect(() => {
    return () => {
      if (searchShimmerTimeout.current) {
        clearTimeout(searchShimmerTimeout.current);
      }
    };
  }, []);

  // ⚙️ INITIALIZATION (UNCHANGED)
  useEffect(() => {
    // Track PWA mode
    if (window.navigator.standalone) {
      crashMonitor.trackPWAEvent('standalone_mode', { source: 'iOS' });
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
      crashMonitor.trackPWAEvent('standalone_mode', { source: 'PWA' });
    }
    
    // Session management removed - using only IndexedDB for chat persistence

    const savedUILanguage = sessionManager.getUILanguage();
    if (savedUILanguage && uiTexts[savedUILanguage]) {
      setUILanguage(savedUILanguage);
    }
  }, []);

  // 🔄 AUTO-SAVE useEffect - Saves when needsAutoSave flag is set
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    // Only trigger if message has needsAutoSave flag and is not streaming
    if (lastMessage?.needsAutoSave && !lastMessage.isStreaming) {
      console.log('🔄 [AUTO-SAVE] needsAutoSave flag detected, saving to IndexedDB...');

      // Save with final state (guaranteed by React)
      checkAutoSave(messages, currentChatId);

      // Clear the needsAutoSave flag to prevent duplicate saves
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.needsAutoSave) {
          delete updated[lastIdx].needsAutoSave;
        }
        return updated;
      });
    }
  }, [messages, currentChatId]);

  // 🆕 SIMPLE SCROLL - NO AUTO-SCROLL! User controls everything
  // Scroll will only happen when user sends message (in handleSend)

  const shouldHideLogo = messages.length > 0;// 🚀 OMNIA - APP.JSX PART 2/3 - UTILITY FUNCTIONS + MESSAGE HANDLING (REDESIGNED)
// ✅ ADDED: Sidebar handlers
// 🎯 UNCHANGED: Všechny původní funkce (TTS, STT, AI conversation)
// 🆕 STREAMING: Modified Claude message handling with streaming effect

// 🔔 NOTIFICATION SYSTEM
  const { showNotification } = createNotificationSystem();
  
  // 📦 UPLOAD QUEUE MANAGEMENT
  const addToUploadQueue = (file, type, messageTimestamp, attachmentIndex, chatId) => {
    const queueItem = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      file,
      type, // 'user_file', 'generated_image', or 'generated_pdf'
      messageTimestamp,
      attachmentIndex,
      chatId,
      addedAt: Date.now()
    };
    
    setUploadQueue(prev => [...prev, queueItem]);
    console.log(`📦 [UPLOAD-QUEUE] Added ${type}:`, queueItem.id);
  };
  
  const processUploadQueue = async (delay = 0) => {
    if (uploadQueue.length === 0) return;
    
    console.log(`📦 [UPLOAD-QUEUE] Processing ${uploadQueue.length} items after ${delay}ms delay`);
    
    setTimeout(async () => {
      const queueToProcess = [...uploadQueue];
      setUploadQueue([]); // Clear queue
      
      for (const item of queueToProcess) {
        try {
          if (item.type === 'generated_image') {
            await processGeneratedImageUpload(item);
          } else if (item.type === 'generated_pdf') {
            await processGeneratedPdfUpload(item);
          }
          // ❌ REMOVED: user_file processing - now handled by background upload
        } catch (error) {
          console.error(`📦 [UPLOAD-QUEUE] Failed to upload ${item.id}:`, error);
        }
      }
    }, delay);
  };
  
  // ❌ REMOVED: processUserFileUpload - now handled by background upload in InputBar
  
  const processGeneratedImageUpload = async (item) => {
    console.log(`🎨 [DELAYED-UPLOAD] Processing generated image:`, item.id);
    
    const uploadResult = await uploadBase64ToSupabaseStorage(
      item.file.base64Data, 
      item.file.fileName, 
      'generated-images'
    );
    
    // Update message with storage URL using image timestamp
    setMessages(prev => prev.map(msg => 
      msg.image && msg.image.timestamp === item.messageTimestamp ? {
        ...msg,
        image: {
          ...msg.image,
          storageUrl: uploadResult.publicUrl,
          storagePath: uploadResult.path
        }
      } : msg
    ));
    
    console.log(`✅ [DELAYED-UPLOAD] Generated image uploaded:`, uploadResult.fileName);
  };

  const processGeneratedPdfUpload = async (item) => {
    console.log(`📄 [DELAYED-UPLOAD] Processing generated PDF:`, item.id);

    const uploadResult = await uploadBase64ToSupabaseStorage(
      item.file.base64Data,
      item.file.fileName,
      'generated-pdfs-temp'
    );

    // Update message with storage URL using PDF timestamp
    setMessages(prev => prev.map(msg =>
      msg.pdf && msg.pdf.timestamp === item.messageTimestamp ? {
        ...msg,
        pdf: {
          ...msg.pdf,
          storageUrl: uploadResult.publicUrl,
          storagePath: uploadResult.path
        }
      } : msg
    ));

    console.log(`✅ [DELAYED-UPLOAD] Generated PDF uploaded:`, uploadResult.fileName);
  };

  // 🔗 SOURCES MODAL HANDLERS (UNCHANGED)
  const handleSourcesClick = (sources) => {
    console.log('🔗 Opening sources modal with:', sources.length, 'sources');
    setCurrentSources(sources);
    setSourcesModalOpen(true);
  };

  // 📚 PDF VIEWER HANDLER
  const handlePdfView = (pdfData) => {
    console.log('📚 Opening PDF viewer with:', pdfData.title || pdfData.filename);
    setPdfViewerData({
      isOpen: true,
      url: pdfData.url,
      title: pdfData.title,
      filename: pdfData.filename
    });
  };

  const handleSourcesModalClose = () => {
    console.log('🔗 Closing sources modal');
    setSourcesModalOpen(false);
    setCurrentSources([]);
  };



  // 🔐 AUTH HANDLERS
  const handleSignOut = async () => {
    try {
      // 🧹 STEP 1: Clear IndexedDB first (prevent data mixing between users)
      console.log('🧹 Clearing IndexedDB before logout...');
      await chatDB.clearAllData();
      
      // 🧹 STEP 2: Clear all React state immediately
      setMessages([]);
      setCurrentChatId(null);
      setChatHistories([]);
      sessionManager.clearSession();
      consentService.clearLocalStorageCache(); // Clear consent cache
      
      // 🔐 STEP 3: Sign out from Supabase
      const { error } = await authService.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        return;
      }
      
      // ✅ STEP 4: Clear user and close UI
      console.log('✅ User signed out successfully with clean IndexedDB');
      setUser(null);
      
      // Close sidebar
      setShowChatSidebar(false);
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  // 🗑️ DELETE ACCOUNT HANDLER - Complete account deletion
  const handleDeleteAccount = async () => {
    try {
      console.log('🗑️ [DELETE-ACCOUNT] Starting account deletion...');

      if (!user) {
        throw new Error('No user logged in');
      }

      // STEP 1: Delete all chats from IndexedDB + Storage + Claude Files + Supabase
      console.log('🗑️ [DELETE-ACCOUNT] Step 1: Deleting local data and storage files...');
      const allChats = await chatDB.getAllChats();
      console.log(`🗑️ [DELETE-ACCOUNT] Found ${allChats.length} chats to delete`);

      for (const chat of allChats) {
        // deleteChat handles:
        // - Claude Files API cleanup
        // - Storage bucket cleanup (attachments, images, PDFs)
        // - IndexedDB deletion (chat + messages)
        // - Supabase sync deletion (with CASCADE to messages)
        await chatDB.deleteChat(chat.id, { skipSync: false });
      }

      console.log('✅ [DELETE-ACCOUNT] Step 1 complete: Local data and files deleted');

      // STEP 2: Delete account from Supabase auth.users (cascades to profiles)
      console.log('🗑️ [DELETE-ACCOUNT] Step 2: Deleting account from Supabase...');
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account from server');
      }

      console.log('✅ [DELETE-ACCOUNT] Step 2 complete: Account deleted from Supabase');

      // STEP 3: Sign out (clears any remaining IndexedDB data and React state)
      console.log('🗑️ [DELETE-ACCOUNT] Step 3: Signing out...');
      await handleSignOut();

      console.log('✅ [DELETE-ACCOUNT] Account deletion complete!');
      console.log('👋 User account has been permanently deleted');

    } catch (error) {
      console.error('❌ [DELETE-ACCOUNT] Error:', error);
      throw error; // Re-throw to show error in DeleteAccountModal
    }
  };

  // 🔐 RESET PASSWORD HANDLER
  const handleResetPassword = () => {
    setShowResetPasswordModal(true);
  };

  // 🤖 MODEL CHANGE HANDLER - Update model and save to localStorage
  const handleModelChange = (newModel) => {
    console.log(`🤖 [MODEL] Switching to: ${newModel}`);
    setModel(newModel);
    sessionManager.saveSelectedModel(newModel);
  };

  // 🔐 AUTH SUCCESS HANDLER - Clear cooldown and sync immediately
  const handleAuthSuccess = async (authenticatedUser) => {
    console.log('✅ User authenticated successfully:', authenticatedUser?.email);
    
    // Set the user first
    setUser(authenticatedUser);
    
    // Clear sync cooldown for immediate sync
    chatSyncService.clearSyncCooldown();
    
    // Start immediate full sync for the new user (first time setup)
    console.log('🚀 [SYNC] Starting immediate full sync for new user signup...');
    try {
      await chatSyncService.fullSync(); // New user needs full sync setup
    } catch (error) {
      console.error('❌ [SYNC] Initial sync failed:', error);
    }
  };

  // 📋 TERMS CONSENT HANDLERS
  const handleTermsAccept = async () => {
    try {
      console.log('📋 [CONSENT] User accepted terms - saving to Supabase...');

      // Save consent to Supabase (version 'v1.0' matches SQL terms_version)
      await consentService.acceptAll('v1.0'); // Accepts both terms AND privacy

      console.log('✅ [CONSENT] Terms acceptance saved successfully');

      // Close modal
      setShowTermsConsent(false);
    } catch (error) {
      console.error('❌ [CONSENT] Failed to save consent:', error);
      throw error; // Re-throw to show error in modal
    }
  };

  const handleTermsDecline = () => {
    console.log('⚠️ [CONSENT] User declined terms');

    // Show alert and sign out user
    alert(getTranslation(uiLanguage)('termsConsentRequired'));

    // Clear consent cache before sign out
    consentService.clearLocalStorageCache();

    // Sign out user since they can't use app without accepting
    authService.signOut();
  };

  // 🆕 SIDEBAR HANDLERS - NEW for redesign
  const handleSidebarOpen = () => {
    setShowChatSidebar(true);
    // LAZY LOADING: Načti JEN metadata chatů (názvy) - BEZ celých zpráv
    loadChatTitles();
  };

  const handleSidebarClose = () => {
    setShowChatSidebar(false);
  };


  const handleNewChatKeepSidebar = async () => {
    // Same as handleSidebarNewChat but keeps sidebar open
    // ❌ REMOVED problematic save - prevents chat resurrection after delete
    handleNewChat();
    const newKeepSidebarId = chatDB.generateChatId();
    updateCurrentChatId(newKeepSidebarId);
    // ❌ REMOVED: loadChatHistories() - historie se aktualizuje lazy
    // Note: sidebar stays open
  };

  // 📚 CHAT TITLES FUNCTION - Only metadata, no full messages
  const loadChatTitles = async () => {
    try {
      const startTime = performance.now();
      
      const titles = await chatDB.getChatTitles(); // ONLY titles/metadata - NO messages
      setChatHistories(titles);
      
      const loadTime = performance.now() - startTime;
      
    } catch (error) {
      console.error('❌ [MONITOR] Error loading chat titles:', error);
      setChatHistories([]); // Fallback to empty array
    }
  };

  const handleSelectChat = async (chatId, messageUuid = null) => {
    crashMonitor.trackChatOperation('switch_chat_start', { fromChatId: currentChatId, toChatId: chatId, scrollToUuid: messageUuid });
    try {
      // ✅ SAVE POINT #2: Save current chat before switching
      if (currentChatId && messages.length > 0) {
        const wasSaved = await smartIncrementalSave(currentChatId, messages);
        if (wasSaved) {
          setSyncDirtyChats(prev => new Set(prev).add(currentChatId));
        }
        if (wasSaved) {
          crashMonitor.trackIndexedDB('save', currentChatId, true);
        }
      }
      
      // 📖 Load selected chat - V2 BOTTOM-FIRST LOADING
      
      // V2: Load ALL messages for chat (unlimited - Virtuoso optimized)
      const chatData = await chatDB.getAllMessagesForChat(chatId);
      if (!chatData || chatData.messages.length === 0) {
        crashMonitor.trackIndexedDB('load', chatId, false, new Error('Chat not found or empty'));
        console.warn('⚠️ [MONITOR-V2] Chat not found or empty:', chatId);
        return;
      }
      
      console.log(`✅ [MONITOR-V2] V2 Loading successful: ${chatData.messages.length}/${chatData.totalCount} messages`);
      console.log(`🎯 [MONITOR-V2] BOTTOM-FIRST: Chat opens on latest messages, ${chatData.hasMore ? 'has' : 'no'} older messages`);
      
      // V2 chatData structure is already correct: { messages, totalCount, hasMore, loadedRange }
      
      if (chatData && chatData.messages.length > 0) {
        // 🔄 ATOMIC UPDATE: Replace old chat with new one in single step
        // ✅ This prevents Virtuoso from seeing empty state between chats
        console.log('🔄 [MEMORY] Atomically replacing chat in RAM');
        setMessages(chatData.messages);
        updateCurrentChatId(chatId);
        setIsImageMode(false); // Reset image mode when switching chats
        // V2: No offset tracking needed - using timestamp-based pagination
        crashMonitor.trackIndexedDB('load', chatId, true);
        crashMonitor.trackChatOperation('switch_chat_success', {
          chatId,
          messageCount: chatData.messages.length,
          totalMessages: chatData.totalCount,
          hasMore: chatData.hasMore
        });

        // 🔍 SCROLL TO SPECIFIC MESSAGE if UUID provided (from search)
        if (messageUuid) {
          setTimeout(() => {
            scrollToMessageByUuid(virtuosoRef, chatData.messages, messageUuid);
          }, 150); // Small delay to ensure Virtuoso is ready
        }

        // ✅ REMOVED: setTimeout scroll - was causing race condition with other scroll logic
      } else if (chatData && chatData.messages.length === 0) {
        // 🧹 MEMORY CLEAR: Empty chat - ensure RAM is clean
        setMessages([]);
        updateCurrentChatId(chatId);
        setIsImageMode(false); // Reset image mode when switching chats
        // V2: No offset tracking needed
        } else {
        crashMonitor.trackIndexedDB('load', chatId, false, new Error('Chat not found'));
        console.warn('⚠️ [MONITOR] Chat not found:', chatId);
      }
      
    } catch (error) {
      crashMonitor.trackChatOperation('switch_chat_failed', { 
        error: error.message, 
        fromChatId: currentChatId, 
        toChatId: chatId 
      });
      console.error('❌ [MONITOR] Chat switch failed:', error);
      // No localStorage fallback - IndexedDB only
    }
  };


  // 🔄 INITIALIZATION - Create chat ID but don't load messages (lazy loading)
  React.useEffect(() => {
    const initializeChat = async () => {
      
      let chatIdToUse = currentChatId;
      
      if (!chatIdToUse) {
        const newId = chatDB.generateChatId();
        updateCurrentChatId(newId);
        chatIdToUse = newId;
      } else {
      }
      
      // ✅ LAZY LOADING: Don't load messages at startup - only when user selects chat
      setMessages([]);
    };
    
    initializeChat();
  }, []);

  // ❌ REMOVED: Auto-scroll useEffect - scroll now handled directly in handleSend functions
  // This prevents conflicts between multiple scroll systems

  // 💾 Strategic save point #5: PWA lifecycle handler with Realtime reconnect + ghost cleanup
  React.useEffect(() => {
    const handleVisibilityChange = async () => {

      // ═══════════════════════════════════════════════════
      // 📱 PWA → BACKGROUND (minimize/app switch)
      // ═══════════════════════════════════════════════════
      if (document.hidden) {
        console.log('📱 [PWA-LIFECYCLE] App going to background');

        // 1️⃣ Save current chat
        if (currentChatId && messages.length > 0) {
          await smartIncrementalSave(currentChatId, messages);
          sessionManager.saveCurrentChatId(currentChatId);

          // 2️⃣ Immediate pool sync (don't wait for timer!)
          try {
            console.log('💾 [PWA-BACKGROUND] Immediate pool sync before background');
            await chatSyncService.autoSyncMessage(currentChatId);
            console.log('✅ [PWA-BACKGROUND] Sync successful');
          } catch (error) {
            console.warn('⚠️ [PWA-BACKGROUND] Sync failed, will retry on foreground');
            setSyncDirtyChats(prev => new Set(prev).add(currentChatId));
          }
        }

        // 3️⃣ Enable pool sync mode
        syncStrategy.setPWABackground(true);
        console.log('🔄 [PWA-BACKGROUND] Pool sync mode ENABLED');
      }

      // ═══════════════════════════════════════════════════
      // 📱 PWA → FOREGROUND (restore)
      // ═══════════════════════════════════════════════════
      else {
        console.log('📱 [PWA-LIFECYCLE] App returning to foreground');

        // 1️⃣ Mark as foreground
        syncStrategy.setPWABackground(false);

        // 2️⃣ Check Realtime health
        if (realtimeServiceRef.current) {
          const isHealthy = realtimeServiceRef.current.isHealthy();
          console.log(`🔍 [PWA-FOREGROUND] Realtime health: ${isHealthy ? '✅' : '❌'}`);

          // 3️⃣ If unhealthy → reconnect
          if (!isHealthy) {
            console.log('🔄 [PWA-FOREGROUND] Attempting Realtime reconnect...');

            try {
              const reconnected = await realtimeServiceRef.current.reconnect();

              if (reconnected) {
                console.log('✅ [PWA-FOREGROUND] Realtime reconnected successfully');
                syncStrategy.checkStrategy(); // Will disable pool if healthy

                // ✅ GHOST CLEANUP after successful reconnect
                console.log('👻 [PWA-FOREGROUND] Running ghost cleanup...');
                try {
                  const { chatSyncService } = await import('./services/sync/chatSync.js');
                  const deletedCount = await chatSyncService.syncDeletedChats();

                  if (deletedCount > 0) {
                    console.log(`✅ [PWA-FOREGROUND] Cleaned ${deletedCount} ghost chats`);

                    // Reload chat list if ghosts were deleted
                    loadChatTitles();
                  } else {
                    console.log('✅ [PWA-FOREGROUND] No ghost chats found');
                  }
                } catch (ghostError) {
                  console.error('❌ [PWA-FOREGROUND] Ghost cleanup failed:', ghostError);
                }

              } else {
                console.warn('⚠️ [PWA-FOREGROUND] Realtime reconnect failed');
              }
            } catch (error) {
              console.error('❌ [PWA-FOREGROUND] Reconnect error:', error);
            }
          } else {
            console.log('✅ [PWA-FOREGROUND] Realtime already healthy');
            syncStrategy.checkStrategy();
          }
        }

        // 4️⃣ Download missed messages (WebSocket can't deliver events during background)
        // ALWAYS sync regardless of Realtime health - WebSocket missed events need pool sync
        if (navigator.onLine) {
          console.log('📥 [PWA-FOREGROUND] Downloading missed messages from background');
          await chatSyncService.backgroundSync().catch(err =>
            console.error('❌ [PWA-FOREGROUND] Pool sync failed:', err)
          );
        }
      }
    };

    const handleBeforeUnload = () => {
      // Emergency backup for PWA force close - also uses smart save
      if (currentChatId && messages.length > 0) {
        
        smartIncrementalSave(currentChatId, messages).then(() => {
          setSyncDirtyChats(prev => new Set(prev).add(currentChatId));
        }).catch(error => {
          console.error('❌ Failed emergency smart save on close:', error);
        });
        
        sessionManager.saveCurrentChatId(currentChatId);
      }
    };

    // 📱 iOS PWA Recovery: pagehide event for external link navigation
    const handlePageHide = (event) => {
      // iOS PWA fires pagehide when navigating to external link
      // Save current chat ID to localStorage (survives PWA restart)
      if (currentChatId) {
        sessionManager.saveCurrentChatId(currentChatId);
        console.log('📱 [iOS-PWA] State saved on pagehide');
      }
    };

    // 📱 iOS PWA Recovery: pageshow event for BFCache restoration
    const handlePageShow = (event) => {
      if (event.persisted) {
        // Page restored from BFCache (backward-forward cache)
        console.log('📱 [iOS-PWA] Page restored from BFCache');
        // State should be preserved, but trigger sync check
        if (navigator.onLine && realtimeServiceRef.current) {
          chatSyncService.backgroundSync().catch(err =>
            console.error('❌ [BFCache] Sync failed:', err)
          );
        }
      }
    };

    // PWA Hybrid save system: both events use smartIncrementalSave (prevents duplicates)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Keep beforeunload as emergency backup for PWA force close
    window.addEventListener('beforeunload', handleBeforeUnload);
    // iOS PWA: pagehide for external navigation, pageshow for BFCache
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [currentChatId, messages, syncDirtyChats]);

  // 🎨 BREATHING ANIMATION - Pure CSS animation (performance optimized)
  // Note: Removed JavaScript animation loop to improve performance by ~95%

  // ✅ 30s polling timer REMOVED - replaced with event-driven syncs
  // Event triggers for pool sync:
  // - PWA background → immediate sync
  // - PWA foreground → sync if Realtime failed
  // - Realtime failure → immediate sync
  // - Network comeback → immediate sync
  // - First message → conditional sync (if pool mode)

  // 🔍 REALTIME HEALTH MONITOR (60s diagnostics + auto-recovery)
  useEffect(() => {
    const healthCheckInterval = setInterval(async () => {
      // Only run when app in foreground
      if (realtimeServiceRef.current && !document.hidden) {
        const status = syncStrategy.getStatus();

        console.log('🔍 [HEALTH-CHECK]', {
          realtimeHealthy: status.realtimeHealthy,
          usePoolSync: status.usePoolSync,
          isPWABackground: status.isPWABackground,
          timeSincePoolSync: status.timeSincePoolSync
        });

        // Auto-reconnect if unhealthy (and not in background)
        if (!status.realtimeHealthy && !status.isPWABackground) {
          console.log('⚠️ [HEALTH-CHECK] Realtime unhealthy, attempting reconnect...');

          const reconnected = await realtimeServiceRef.current.reconnect();

          if (reconnected) {
            console.log('✅ [HEALTH-CHECK] Reconnect successful');
            syncStrategy.checkStrategy();

            // Ghost cleanup after reconnect
            try {
              const { chatSyncService } = await import('./services/sync/chatSync.js');
              const deletedCount = await chatSyncService.syncDeletedChats();

              if (deletedCount > 0) {
                console.log(`🗑️ [HEALTH-CHECK] Removed ${deletedCount} ghost chats`);
                loadChatTitles();
              }
            } catch (error) {
              console.error('❌ [HEALTH-CHECK] Ghost cleanup failed:', error);
            }
          } else {
            console.error('❌ [HEALTH-CHECK] Reconnect failed, pool sync will continue');
          }
        }

        // Emergency sync if pool mode active + dirty chats exist
        if (status.usePoolSync && syncDirtyChats.size > 0 && navigator.onLine) {
          console.log('🚨 [HEALTH-CHECK] Emergency pool sync for dirty chats');

          try {
            await chatSyncService.backgroundSync();
            console.log('✅ [HEALTH-CHECK] Emergency sync successful');
          } catch (error) {
            console.error('❌ [HEALTH-CHECK] Emergency sync failed:', error);
          }
        }
      }
    }, 60000); // Run every 60 seconds

    return () => clearInterval(healthCheckInterval);
  }, [syncDirtyChats]); // Re-create if dirty chats change

  // 🌐 NETWORK CHANGE HANDLER (online/offline detection)
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 [NETWORK] Connection restored');

      // Immediate pool sync for dirty chats
      if (syncDirtyChats.size > 0) {
        console.log('💾 [NETWORK] Immediate pool sync for dirty chats');

        try {
          await chatSyncService.backgroundSync();
          console.log('✅ [NETWORK] Sync successful');
        } catch (error) {
          console.error('❌ [NETWORK] Sync failed:', error);
        }
      }

      // Check Realtime health and reconnect if needed
      if (realtimeServiceRef.current && !document.hidden) {
        const isHealthy = realtimeServiceRef.current.isHealthy();

        if (!isHealthy) {
          console.log('🔄 [NETWORK] Attempting Realtime reconnect...');

          const reconnected = await realtimeServiceRef.current.reconnect();

          if (reconnected) {
            console.log('✅ [NETWORK] Realtime reconnected');
            syncStrategy.checkStrategy();
          } else {
            console.warn('⚠️ [NETWORK] Realtime reconnect failed, pool sync active');
          }
        }
      }
    };

    const handleOffline = () => {
      console.log('🌐 [NETWORK] Connection lost');
      // No action needed - Realtime will auto-disconnect
      // Pool sync will activate automatically via strategy
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncDirtyChats]);

  // 🔄 AUTO-SAVE HELPER - volá se po přidání AI response
  const checkAutoSave = async (allMessages, chatId = currentChatId) => {

    if (!chatId || allMessages.length === 0) {
      return allMessages;
    }

    // 📊 [DEBUG] Check if summary metadata is present in messages
    const messagesWithSummary = allMessages.filter(msg => msg.hasMetadata && msg.metadata?.summaryContent);
    if (messagesWithSummary.length > 0) {
      console.log('📊 [SAVE] Saving', messagesWithSummary.length, 'messages with summary metadata');
      messagesWithSummary.forEach((msg, idx) => {
        console.log(`📊 [SAVE] Summary ${idx + 1}:`, {
          id: msg.id,
          hasSummary: !!msg.metadata?.summaryContent,
          summarizedCount: msg.metadata?.summarizedCount
        });
      });
    }
    
    // 🆕 CRITICAL SAVE: First conversation protection (user + bot)
    if (allMessages.length === 2) {
      console.log('💾 [CRITICAL-SAVE] First conversation, saving immediately');

      try {
        await smartIncrementalSave(chatId, allMessages);

        // 🚀 IMMEDIATE SYNC: Upload to Supabase instantly (triggers Realtime)
        try {
          await chatSyncService.autoSyncMessage(chatId);
          console.log('✅ [FIRST-MSG] Uploaded to Supabase, Realtime triggered');

          // Success → remove from dirty chats (no need for pool sync retry)
          setSyncDirtyChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(chatId);
            return newSet;
          });
        } catch (syncError) {
          // Failed → add to dirty chats (pool sync timer will retry)
          console.error('❌ [FIRST-MSG] Failed, queued for pool sync retry:', syncError);
          setSyncDirtyChats(prev => new Set(prev).add(chatId));
        }

      } catch (error) {
        console.error('❌ [CRITICAL-SAVE] First message save failed:', error);

        // 🔄 ROLLBACK: IndexedDB save failed → remove from UI, restore to input
        const lastUserMessage = [...allMessages].reverse().find(m => m.sender === 'user');

        if (lastUserMessage) {
          // Remove user + bot messages from state
          setMessages(prev => prev.slice(0, -2));

          // Restore user text to input bar
          setInput(lastUserMessage.text);

          // Show error notification
          showNotification('Failed to save message. Please try again.', 'error');
        }

        return allMessages.slice(0, -2);  // Return state without failed messages
      }
      return allMessages;
    }
    
    // 💾 AUTO-SAVE - každá zpráva pro maximální bezpečnost
    if (allMessages.length > 0) {
      try {
        await smartIncrementalSave(chatId, allMessages);

        // 🚀 IMMEDIATE SYNC: Upload to Supabase instantly (triggers Realtime)
        try {
          await chatSyncService.autoSyncMessage(chatId);
          console.log('✅ [IMMEDIATE-SYNC] Uploaded to Supabase, Realtime triggered');

          // Success → remove from dirty chats (no need for pool sync retry)
          setSyncDirtyChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(chatId);
            return newSet;
          });
        } catch (syncError) {
          // Failed → add to dirty chats (pool sync timer will retry in 30s)
          console.error('❌ [IMMEDIATE-SYNC] Failed, queued for pool sync retry:', syncError);
          setSyncDirtyChats(prev => new Set(prev).add(chatId));
        }
      } catch (error) {
        console.error(`❌ [AUTO-SAVE] FAILED:`, error);

        // 🔄 ROLLBACK: IndexedDB save failed → remove from UI, restore to input
        const lastUserMessage = [...allMessages].reverse().find(m => m.sender === 'user');

        if (lastUserMessage) {
          // Remove user + bot messages from state
          setMessages(prev => prev.slice(0, -2));

          // Restore user text to input bar
          setInput(lastUserMessage.text);

          // Show error notification
          showNotification('Failed to save message. Please try again.', 'error');
        }
      }
    }
    
    // 🪟 SLIDING WINDOW - Memory management handled by loadOlderMessages only
    // Removed fixed RAM cleanup to prevent conflicts with scroll loading
    
    return allMessages; // No cleanup, return original
  };

  // ❌ REMOVED: Auto-scroll useEffect - caused scrolling on AI responses too
  // Now scroll happens ONLY when user sends message, in handleSend function


  // ❌ REMOVED: Problematic auto-save useEffect that caused UI freezing
  // 📝 Chat saving moved to strategic moments (user send, stream end, chat switch, etc.)
  // 🚀 This eliminates localStorage blocking during AI streaming

  // 🎵 TTS GENERATION - USING SAME LOGIC AS VOICEBUTTON (UNCHANGED)
  const generateAudioForSentence = async (sentence, language) => {
    try {
      console.log('🎵 Generating audio for sentence:', sentence.substring(0, 30) + '...');
      console.log('🌍 Target language:', language);
      
      let textToSpeak = sentence;
      const hasProblematicPatterns = /\d+[.,]\d+|%|\d+°C|\d+:\d+|\d+Kč|\d+€|\d+\$|km\/h|AI|API|0W-30|1\.?\s*července|2\.?\s*července|[ěščřžýáíéůú]/i.test(sentence);
      
      if (hasProblematicPatterns) {
        textToSpeak = sanitizeText(sentence);
        console.log('🔧 Applied sanitizeText (same as VoiceButton):', {
          original: sentence.substring(0, 50),
          sanitized: textToSpeak.substring(0, 50)
        });
      }
      
      // 🔧 ENABLED: ElevenLabs TTS as primary with Google fallback
      console.log('🎵 Using elevenLabsService.generateSpeech (same as VoiceButton)');
      
      try {
        const audioBlob = await elevenLabsService.generateSpeech(textToSpeak);
        console.log('✅ ElevenLabs TTS success in generateAudioForSentence');
        return audioBlob;
      } catch (error) {
        console.warn('⚠️ ElevenLabs TTS failed, using Google TTS fallback...', error);
        
        // 🔧 FALLBACK: Use Google TTS with language detection
        const actualLanguage = detectLanguage(textToSpeak);
        console.log('🌍 Language detection for Google fallback:', {
          parameterLanguage: language,
          detectedFromText: actualLanguage,
          using: actualLanguage
        });
        
        const googleResponse = await fetch('/api/google-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ 
            text: textToSpeak,  // Use sanitized text
            language: actualLanguage, // Use detected language from text!
            voice: 'natural'
          })
        });
        
        if (!googleResponse.ok) {
          throw new Error(`Google TTS fallback failed: ${googleResponse.status}`);
        }
        
        console.log('✅ Google TTS fallback success');
        return await googleResponse.blob();
      }
      
    } catch (error) {
      console.error('💥 Google TTS failed:', error);
      throw error;
    }
  };

  // 🎵 VOICE PROCESSING - WEB AUDIO API VIA MOBILE AUDIO MANAGER
  const processVoiceResponse = async (responseText, language) => {
    console.log('🎵 Processing voice response - WEB AUDIO API MODE:', {
      textLength: responseText.length,
      language: language
    });
    
    try {
      const audioBlob = await generateAudioForSentence(responseText, language);
      
      // Use mobileAudioManager with Web Audio API (maintains unlocked context)
      setIsAudioPlaying(true);
      await mobileAudioManager.playAudio(audioBlob);
      setIsAudioPlaying(false);
      
      console.log('✅ Web Audio API playing successfully via mobileAudioManager');
      
    } catch (error) {
      console.error('❌ Failed to generate/play audio via Web Audio API:', error);
      setIsAudioPlaying(false);
    }
  };

  // 🎤 STT FUNCTIONS (UNCHANGED)
  const startSTTRecording = async () => {
    try {
      console.log('🎤 Starting ElevenLabs STT recording...');
      setIsRecordingSTT(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Audio level monitoring for reactive dots
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!isRecordingSTT) return;
        
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 50, 1);
        setAudioLevel(normalizedLevel);
        
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      sttRecorderRef.current = mediaRecorder;
      const audioChunks = [];
      const startTime = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingDuration = Date.now() - startTime;
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setIsRecordingSTT(false);
        setAudioLevel(0);
        
        if (recordingDuration < 1000) {
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        if (audioBlob.size < 1000) {
          return;
        }
        
        await processSTTAudio(audioBlob);
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);

    } catch (error) {
      console.error('❌ STT Recording setup error:', error);
      setIsRecordingSTT(false);
      setAudioLevel(0);
      showNotification('Could not access microphone', 'error');
    }
  };

  const stopSTTRecording = () => {
    if (sttRecorderRef.current && sttRecorderRef.current.state === 'recording') {
      sttRecorderRef.current.stop();
    }
    
    mobileAudioManager.unlockAudioContext();
    console.log('🔓 Audio unlocked via stop interaction');
  };

  const processSTTAudio = async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // 🔧 Try ElevenLabs STT first (primary)
      let response = await fetch('/api/elevenlabs-stt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: arrayBuffer
      });

      let data;
      let usedService = 'ElevenLabs';

      // 🔧 If ElevenLabs fails, try Google STT as fallback
      if (!response.ok) {
        console.warn('⚠️ ElevenLabs STT failed, trying Google STT fallback...');
        
        response = await fetch('/api/google-stt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: arrayBuffer
        });
        usedService = 'Google';
      }

      if (!response.ok) {
        throw new Error(`Speech-to-Text failed: HTTP ${response.status}`);
      }

      data = await response.json();
      
      if (data.success && data.text && data.text.trim()) {
        const transcribedText = data.text.trim();
        setInput(transcribedText);
      } else {
        throw new Error('Speech recognition failed');
      }

    } catch (error) {
      console.error('💥 STT processing error:', error);
      showNotification('Speech recognition error - please try again', 'error');
    }
  };

  const toggleSTT = () => {
    if (loading || streaming) return;
    
    if (isRecordingSTT) {
      stopSTTRecording();
    } else {
      startSTTRecording();
    }
  };

  // 🔧 UTILITY FUNCTIONS (UNCHANGED)
  const handleNewChat = async () => {
    crashMonitor.trackChatOperation('new_chat_start', { currentChatId, messageCount: messages.length });
    try {
      // ❌ REMOVED problematic save - prevents chat resurrection (same fix as handleNewChatKeepSidebar)

      // 🆕 STREAMING: Stop any ongoing streaming
      if (stopStreamingRef) {
        stopStreamingRef();
        setStopStreamingRef(null);
      }
      
      mobileAudioManager.stop();
      setIsAudioPlaying(false);
      currentAudioRef.current = null;
      
      if (streaming) setStreaming(false);
      if (isListening) setIsListening(false);
      if (isRecordingSTT) stopSTTRecording();
      
      // 🔗 Close sources modal on new chat
      setSourcesModalOpen(false);
      setCurrentSources([]);
      
      sessionManager.clearSession();
      setMessages([]);
      setUserLanguage('en');
      
      // 📄 Clear document states to prevent context leakage
      setActiveDocumentContexts([]);
      setUploadedDocuments([]);
      
      // 🎨 Reset image mode to prevent cross-chat contamination
      setIsImageMode(false);
      
    
      // Create new chat ID for history tracking
      const newChatId = chatDB.generateChatId();
      updateCurrentChatId(newChatId);
      
      crashMonitor.trackChatOperation('new_chat_success', { newChatId });
      
    } catch (error) {
      crashMonitor.trackChatOperation('new_chat_failed', { error: error.message });
      console.error('❌ [MONITOR] New chat preparation failed:', error);
      // Fallback - still create new chat but without IndexedDB save
      const newChatId = chatDB.generateChatId();
      updateCurrentChatId(newChatId);
    }
  };



  // 🆕 VOICE SCREEN OPEN/CLOSE WITH GEMINI FORCE (UPDATED)
  const handleVoiceScreenOpen = async () => {
    setShowVoiceScreen(true);
    
    if (model !== 'gemini-2.5-flash') {
      console.log('🎤 Voice mode: Auto-switching to Gemini for cost-effective responses');
      setPreviousModel(model);
      setModel('gemini-2.5-flash');
    }
    
    console.log('🔓 Attempting audio unlock on VoiceScreen open...');
    try {
      await mobileAudioManager.unlockAudioContext();
      console.log('✅ VoiceScreen audio unlock completed');
    } catch (error) {
      console.error('❌ VoiceScreen audio unlock failed:', error);
    }
  };

  const handleVoiceScreenClose = () => {
    // 🔧 CRITICAL: Stop all audio playback when closing voice chat
    console.log('🛑 Stopping all audio playback on voice chat close...');
    mobileAudioManager.stop();
    setIsAudioPlaying(false);
    
    setShowVoiceScreen(false);
    
    if (previousModel && previousModel !== 'gemini-2.5-flash') {
      console.log('🔄 Voice closed: Restoring previous model:', previousModel);
      setModel(previousModel);
      setPreviousModel(null);
    }
  };

  useEffect(() => {
    inputRef.current = input;
    messagesRef.current = messages;
    uploadedDocumentsRef.current = uploadedDocuments;
  }, [input, messages, uploadedDocuments]);


// 🤖 AI CONVERSATION - WITH STREAMING EFFECT
  const handleSend = useCallback(async (textInput, fromVoice = false) => {
    // ❌ REMOVED: Scroll limit logic

    const currentInput = inputRef.current;
    const currentMessages = messagesRef.current;
    const currentDocuments = uploadedDocumentsRef.current;

    const finalTextInput = textInput || currentInput;

    // 🔄 ROLLBACK: Save original text for potential restoration
    const originalUserText = finalTextInput;

    if (!finalTextInput.trim() || loading) {
      return;
    }

    // 🔒 CRITICAL: Set loading immediately to prevent race condition
    setLoading(true);

    // Use original text without newline replacement (preserves markdown table structure)
    const userMessageText = finalTextInput;

    // 📶 Check if offline - prevent sending
    if (isOffline) {
      console.warn('📵 Cannot send message - device is offline');
      setLoading(false); // Reset loading on offline
      return;
    }

    crashMonitor.trackChatOperation('send_message_start', {
      model,
      messageLength: finalTextInput.length,
      fromVoice,
      currentChatId
    });

    // Variables for final save point
    let responseText = '';
    let sourcesToSave = [];

    // 🆕 STREAMING: Stop any ongoing streaming
    if (stopStreamingRef) {
      stopStreamingRef();
      setStopStreamingRef(null);
    }

    // Language detection removed - let Gemini handle language naturally via system prompt

    mobileAudioManager.stop();
    setIsAudioPlaying(false);
    currentAudioRef.current = null;

    if (!fromVoice) setInput('');

    try {
      // 🔴 [DEBUG] Track currentChatId state at handleSend start
      
      // 🎯 ENSURE CHAT ID EXISTS - use safe getter to prevent race condition
      let activeChatId = getSafeChatId();
      
      if (!activeChatId) {
        // Extra safety check - if we have messages, we should have a chat ID
        if (currentMessages.length > 0) {
          console.error('❌ [CRITICAL] Have messages but no chat ID! This should not happen!');
          // Try to recover by generating new ID
          activeChatId = chatDB.generateChatId();
          updateCurrentChatId(activeChatId);
          console.warn('⚠️ [RECOVERY] Generated emergency chat ID:', activeChatId);
        } else {
          // Normal case - truly a new chat
          activeChatId = chatDB.generateChatId();
          updateCurrentChatId(activeChatId);
          console.log('✅ [NEW CHAT] Created new chat ID:', activeChatId);
        }
      }
      
      const userTimestamp = Date.now();
      const userMessage = {
  id: generateMessageId(),
  sender: 'user',
  text: userMessageText,
  timestamp: userTimestamp
};

      let messagesWithUser = [...currentMessages, userMessage];
      setMessages(messagesWithUser);

      // 🔼 SCROLL TO THIS USER MESSAGE immediately after adding it (fixed large spacer)
      const newUserMessageIndex = messagesWithUser.length - 1; // Index nové user zprávy
      
      scrollToUserMessageAt(virtuosoRef, newUserMessageIndex); // Scroll to the new user message

      // ❌ REMOVED: Old auto-save from handleSend - moved to AI response locations

      // ✅ REMOVED: First message save logic - using only auto-save every 10 messages

      // 🎨 IMAGE GENERATION MODE
      if (isImageMode) {
        // Set loading states same as normal chat
        setLoading(true);
        setStreaming(true);
        
        // Add bot message for Gemini response (Omnia will respond with personality)
        const imageGenBotMessageId = generateMessageId();

        const imageGenBotMessage = {
          id: imageGenBotMessageId,
          sender: 'bot',
          text: '',
          shimmerText: "Being creative...",
          isStreaming: true,
          timestamp: Date.now()
        };
        
        const messagesWithImageIndicator = [...messagesWithUser, imageGenBotMessage];
        setMessages(messagesWithImageIndicator);

        // 🧠 Build smart context for Image Mode (same as normal chat)
        // Check if ANY summary exists in messages
        const hasSummary = messagesWithUser.some(msg => msg.hasMetadata && msg.metadata?.summaryContent);

        // Get context with summary separated for system prompt injection
        const contextResult = hasSummary
          ? buildContextForElora(currentMessages, userMessageText)
          : { summary: null, messages: messagesWithUser };

        const { summary: conversationSummary, messages: contextMessages } = contextResult;

        console.log('🎯 [IMAGE-CONTEXT] Using', hasSummary ? 'SMART CONTEXT' : 'FULL HISTORY');
        console.log('🎯 [IMAGE-CONTEXT] Has summary:', hasSummary);
        console.log('🎯 [IMAGE-CONTEXT] Summary length:', conversationSummary?.length || 0, 'chars');
        console.log('🎯 [IMAGE-CONTEXT] Messages sent to', model === 'gemini-2.5-flash' ? 'Gemini' : 'Claude', ':', contextMessages.length);

        try {
          // Call Gemini with imageMode flag instead of direct Imagen
          let responseText = '';
          let generatedImages = [];
          let pendingUploads = []; // ✅ Track async upload operations

          // Direct streaming variable (Anthropic best practice)
          let accumulatedTextImage = ''; // Accumulated text for direct display

          const isClaude = model.startsWith('claude-');  // ✅ Detects both Haiku and Sonnet
          const result = await (isClaude ? claudeService : geminiService).sendMessage(
            contextMessages,
            (chunk, extra = {}) => {
              // 🛠️ Handle tool preparation (shows shimmer during tool latency)
              if (extra?.type === 'tool_preparing' && extra?.shimmerText) {
                console.log('🛠️ [IMAGE MODE] Tool preparing:', extra.shimmerText);
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === imageGenBotMessageId && msg.isStreaming
                      ? { ...msg, shimmerText: extra.shimmerText }
                      : msg
                  )
                );

                // ✅ Two-stage system for fallback "Preparing tools..."
                if (extra.shimmerText === 'Preparing tools...') {
                  setTimeout(() => {
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === imageGenBotMessageId && msg.shimmerText === 'Preparing tools...'
                          ? { ...msg, shimmerText: 'Executing task...' }
                          : msg
                      )
                    );
                  }, 2000); // Change to "Executing task..." after 2 seconds
                }

                return; // Don't process as text
              }

              // 🚀 DIRECT STREAMING: Append chunk immediately (Anthropic best practice)
              if (chunk) {
                accumulatedTextImage += chunk;

                // Update message with new text immediately
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === imageGenBotMessageId
                      ? { ...msg, text: accumulatedTextImage, shimmerText: undefined }
                      : msg
                  )
                );
              }

              // Handle generated images from tool call
              if (extra && extra.images && extra.images.length > 0) {
                // ✅ FIX: Add global index and APPEND base64 for sequential + fallback
                const startIndex = generatedImages.length;
                const newImages = extra.images.map((img, i) => ({
                  ...img,
                  index: startIndex + i  // Global index: 0, 1, 2...
                }));
                generatedImages = [...generatedImages, ...newImages];  // APPEND with index
                console.log('🎨 Images received in Image Mode:', newImages.length, '(total:', generatedImages.length, ')');

                // Show shimmer indicator while uploading
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === imageGenBotMessageId
                      ? {
                          ...msg,
                          generatingImages: true,
                          expectedImageCount: (msg.expectedImageCount || 0) + newImages.length
                        }
                      : msg
                  )
                );

                // Start upload immediately in parallel with text streaming for ALL images
                console.log(`🚀 Starting parallel upload for ${newImages.length} images during streaming...`);
                parallelUploadInProgress.current = true;

                // Upload using global index from image object
                const uploadPromises = newImages.map(async (imageData) => {
                  if (imageData.base64 && imageData.mimeType) {
                    console.log(`🚀 Starting parallel upload for image ${imageData.index + 1}/${generatedImages.length}...`);

                    try {
                      const imageTimestamp = Date.now();
                      const uploadResult = await uploadBase64ToSupabaseStorage(
                        imageData.base64,
                        `generated-${imageTimestamp}-${imageData.index}.png`,
                        'generated-images'
                      );

                      if (uploadResult && uploadResult.publicUrl) {
                        console.log(`✅ Image ${imageData.index + 1} upload completed`);
                        return {
                          storageUrl: uploadResult.publicUrl,
                          storagePath: uploadResult.path,
                          mimeType: imageData.mimeType,
                          timestamp: imageTimestamp,
                          index: imageData.index  // Global index from image object!
                        };
                      }
                    } catch (error) {
                      console.error(`💥 Image ${imageData.index + 1} upload failed:`, error);
                      return null;
                    }
                  }
                  return null;
                });

                // Wait for all uploads to complete
                const imageUploadPromise = Promise.all(uploadPromises).then(uploadResults => {
                  const successfulUploads = uploadResults.filter(result => result !== null);
                  console.log(`✅ All parallel uploads completed: ${successfulUploads.length}/${extra.images.length} successful`);

                  // Hide generating indicator now that uploads are done
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === imageGenBotMessageId
                        ? { ...msg, generatingImages: false }
                        : msg
                    )
                  );

                  // ✅ FIX: REPLACE base64 with URLs (not append - prevents duplicates!)
                  generatedImages = generatedImages.map(img => {
                    const uploaded = successfulUploads.find(u => u.index === img.index);
                    return uploaded || img;  // Replace with URL if uploaded, keep base64 if not (for fallback)
                  }).sort((a, b) => a.index - b.index);
                  console.log(`✅ All parallel uploads completed, ${successfulUploads.length} base64 images replaced with URLs`);

                  // Mark parallel upload as complete
                  parallelUploadInProgress.current = false;
                }).catch(error => {
                  console.error('💥 Parallel uploads failed:', error);
                  // Mark parallel upload as complete even on error
                  parallelUploadInProgress.current = false;
                });

                // ✅ Track upload Promise for unified save point
                pendingUploads.push(imageUploadPromise);

                // ✅ Display Promise - wait for polling logic to add images to state
                const imageDisplayPromise = new Promise((resolve) => {
                  const checkDisplay = setInterval(() => {
                    const msg = messagesRef.current.find(m => m.id === imageGenBotMessageId);
                    if (msg?.image || msg?.images) {
                      clearInterval(checkDisplay);
                      console.log('✅ [IMAGE MODE] Images displayed in state, display Promise resolved');
                      resolve();
                    }
                  }, 50); // Check every 50ms
                });
                pendingUploads.push(imageDisplayPromise);
              }

              // 🎯 STREAM COMPLETION LOGIC
              if (extra.completed) {
                // Hide loading indicators immediately (same as normal chat)
                setLoading(false);
                setStreaming(false);

                console.log('🎯 [IMAGE] Stream finished, accumulated text length:', accumulatedTextImage.length, 'chars');

                // 🔄 ROLLBACK: Check if stream produced no content AND no pending tool outputs
                if (accumulatedTextImage === '' && pendingUploads.length === 0) {
                  console.error('❌ [IMAGE MODE] Stream failed - no content or tool outputs received, initiating rollback');

                  // Remove the failed messages (user + bot)
                  setMessages(prev => prev.slice(0, -2));

                  // Restore user text to input
                  setInput(userMessageText);

                  // Show error notification
                  showNotification('Image generation failed. Please try again.', 'error');

                  // Don't save to DB - rollback complete
                  console.log('✅ [IMAGE MODE] Rollback complete - messages removed');
                  return;
                } else if (accumulatedTextImage === '') {
                  // ✅ No text but we have tool outputs (images) - this is valid!
                  console.log('✅ [IMAGE MODE] Stream complete with images only (no text)');
                }

                // Normal completion - finalize message with shimmerText cleared
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === imageGenBotMessageId
                      ? {
                          ...msg,
                          text: accumulatedTextImage,
                          isStreaming: false,
                          shimmerText: undefined, // ✅ Clear shimmer indicators
                        }
                      : msg
                  )
                );

                // Store final response text
                responseText = accumulatedTextImage;

                console.log('🎯 [IMAGE] Direct streaming complete');

                // Display ALL images after uploads complete (similar to normal chat)
                if (generatedImages && generatedImages.length > 0) {
                  // Check if all images have been uploaded
                  const allImagesHaveStorageUrl = generatedImages.every(img => img.storageUrl);

                  if (allImagesHaveStorageUrl && !parallelUploadInProgress.current) {
                    console.log(`✅ ${generatedImages.length} images already uploaded, displaying now`);

                    // For single image, use singular 'image' property
                    if (generatedImages.length === 1) {
                      setMessages(prev => prev.map(msg =>
                        msg.id === imageGenBotMessageId
                          ? {
                              ...msg,
                              text: accumulatedTextImage,
                              image: generatedImages[0],
                              isStreaming: false,
                              generatingImages: false
                            }
                          : msg
                      ));
                    } else {
                      // For multiple images, use plural 'images' property
                      setMessages(prev => prev.map(msg =>
                        msg.id === imageGenBotMessageId
                          ? {
                              ...msg,
                              text: accumulatedTextImage,
                              images: generatedImages,
                              isStreaming: false,
                              generatingImages: false
                            }
                          : msg
                      ));
                    }
                  } else {
                    // Wait for parallel uploads to complete
                    console.log('⏳ [IMAGE MODE] Waiting for parallel uploads to complete...');

                    // Polling function to check upload status
                    const checkUploadsComplete = setInterval(() => {
                      if (!parallelUploadInProgress.current && generatedImages.every(img => img.storageUrl)) {
                        clearInterval(checkUploadsComplete);
                        console.log(`✅ [IMAGE MODE] All uploads completed, displaying ${generatedImages.length} images`);

                        if (generatedImages.length === 1) {
                          setMessages(prev => prev.map(msg =>
                            msg.id === imageGenBotMessageId
                              ? {
                                  ...msg,
                                  text: accumulatedTextImage,
                                  image: generatedImages[0],
                                  isStreaming: false,
                                  generatingImages: false
                                }
                              : msg
                          ));
                        } else {
                          setMessages(prev => prev.map(msg =>
                            msg.id === imageGenBotMessageId
                              ? {
                                  ...msg,
                                  text: accumulatedTextImage,
                                  images: generatedImages,
                                  isStreaming: false,
                                  generatingImages: false
                                }
                              : msg
                          ));
                        }
                      }
                    }, 100); // Check every 100ms
                  }
                }

                // ✅ UNIFIED SAVE POINT - Wait for ALL async operations
                if (pendingUploads.length > 0) {
                  console.log(`⏳ [IMAGE MODE] Waiting for ${pendingUploads.length} pending upload(s) before saving...`);
                  Promise.all(pendingUploads)
                    .then(() => {
                      const completionTimestamp = Date.now();
                      console.log('✅ [IMAGE MODE] All uploads complete, setting needsAutoSave flag');
                      console.log(`🕐 [TIMESTAMP-FIX] Message completed at: ${new Date(completionTimestamp).toISOString()}`);
                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === imageGenBotMessageId
                            ? {
                                ...msg,
                                needsAutoSave: true,
                                timestamp: completionTimestamp,
                                shimmerText: undefined, // ✅ Clear any remaining shimmer
                              }
                            : msg
                        )
                      );
                    })
                    .catch(error => {
                      const completionTimestamp = Date.now();
                      console.error('💥 [IMAGE MODE] Upload failed, saving anyway:', error);
                      console.log(`🕐 [TIMESTAMP-FIX] Message completed (with error) at: ${new Date(completionTimestamp).toISOString()}`);
                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === imageGenBotMessageId
                            ? {
                                ...msg,
                                needsAutoSave: true,
                                timestamp: completionTimestamp,
                                shimmerText: undefined, // ✅ Clear any remaining shimmer
                              }
                            : msg
                        )
                      );
                    });
                } else {
                  // No pending uploads - set flag immediately (text-only response)
                  const completionTimestamp = Date.now();
                  console.log('✅ [IMAGE MODE] No pending uploads, setting needsAutoSave flag immediately');
                  console.log(`🕐 [TIMESTAMP-FIX] Text-only message completed at: ${new Date(completionTimestamp).toISOString()}`);
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === imageGenBotMessageId
                        ? {
                            ...msg,
                            needsAutoSave: true,
                            timestamp: completionTimestamp,
                            shimmerText: undefined, // ✅ Clear any remaining shimmer
                          }
                        : msg
                    )
                  );
                }
              }
            },
            null, // No search callback needed
            null, // No image generation callback needed (handled internally)
            null, // No PDF generation callback needed
            null, // No artifact creation callback needed
            [], // documents
            true, // imageMode = true
            false, // pdfMode
            conversationSummary, // summary (from hierarchical memory)
            deepReasoningEnabled, // 💡 Deep Reasoning toggle
            model // ✅ Model selection (needed for Claude: Haiku or Sonnet)
          );

          // Hide loading indicators
          setLoading(false);
          setStreaming(false);
          
        } catch (imageError) {
          const completionTimestamp = Date.now();
          console.error('💥 Image generation error:', imageError);
          console.log(`🕐 [TIMESTAMP-FIX] Message completed (fatal error) at: ${new Date(completionTimestamp).toISOString()}`);

          // Update existing message with error and set needsAutoSave
          setMessages(prev => prev.map(msg =>
            msg.id === imageGenBotMessageId
              ? {
                  ...msg,
                  text: `❌ Failed to generate image: ${imageError.message}`,
                  isStreaming: false,
                  needsAutoSave: true,  // ✅ Set flag for useEffect to save
                  timestamp: completionTimestamp
                }
              : msg
          ));
          
          // Hide loading indicators same as normal chat
          setLoading(false);
          setStreaming(false);
          
          showNotification('Image generation error', 'error');
        }
        
        // Keep image mode active (user can toggle it off manually)
        return;
      }

      // Using global responseText variable

      if (model === 'gpt-4o') {
        const openAIMessages = convertMessagesForOpenAI(messagesWithUser);
        
        const response = await openaiService.sendMessage(openAIMessages, detectedLang);
        responseText = (typeof response === 'object' && response.text) ? response.text : response;
        sourcesToSave = [];
        
        // 🆕 STREAMING: Use streaming effect for GPT too
        const stopFn = streamMessageWithEffect(
          responseText,
          setMessages,
          messagesWithUser,
          mainContentRef.current,
          [] // GPT doesn't have sources yet
        );
        setStopStreamingRef(() => stopFn);
        
        const finalMessages = [...messagesWithUser, { 
          id: generateMessageId(),
          sender: 'bot', 
          text: responseText,
          sources: [],
          isStreaming: false
        }];

        // ❌ REMOVED: Save after OpenAI response (to prevent race conditions)
        
        // 🔍 DEBUG: Check TTS conditions for GPT
        
        if (fromVoice && responseText) {
          console.log('🎵 GPT response complete, processing voice...');
          setTimeout(async () => {
            await processVoiceResponse(responseText, detectedLang);
          }, 500);
        } else {
        }
      }
      else {
        // 🌍 Language detection for summary system
        const detectedLang = detectLanguage(finalTextInput);
        console.log('🌍 Detected language for AI:', detectedLang);

        // 🧠 Smart document filtering logic
        let currentActiveDocs = [...activeDocumentContexts];

        // Update timestamps for mentioned documents
        currentActiveDocs = currentActiveDocs.map(doc => {
          if (finalTextInput.toLowerCase().includes(doc.name.toLowerCase())) {
            return { 
              ...doc, 
              lastAccessedTimestamp: Date.now(), 
              lastAccessedMessageIndex: messagesWithUser.length 
            };
          }
          return doc;
        });

        // Filter out old/irrelevant documents based on time and message count
        currentActiveDocs = currentActiveDocs.filter(doc => {
          const timeSinceUpload = Date.now() - doc.uploadTimestamp;
          const timeSinceLastAccess = Date.now() - doc.lastAccessedTimestamp;
          const messagesSinceUpload = messagesWithUser.length - doc.lastAccessedMessageIndex;
          const messagesSinceLastAccess = messagesWithUser.length - doc.lastAccessedMessageIndex;
          
          // Rule 1: Very recent upload (5 messages OR 10 minutes from upload)
          const isVeryRecentUpload = messagesSinceUpload <= 5 || timeSinceUpload < 10 * 60 * 1000;
          
          // Rule 2: Recently mentioned (7 messages OR 15 minutes since last access)
          const isRecentlyMentioned = messagesSinceLastAccess <= 7 || timeSinceLastAccess < 15 * 60 * 1000;
          
          // Rule 3: Explicit forget command (optional feature)
          const explicitlyForget = finalTextInput.toLowerCase().includes(`zapomeň na ${doc.name.toLowerCase()}`);
          if (explicitlyForget) {
            // showNotification(`Zapomínám na dokument "${doc.name}".`, 'info');
            return false;
          }
          
          return isVeryRecentUpload || isRecentlyMentioned;
        });

        // Update the state with filtered documents
        setActiveDocumentContexts(currentActiveDocs);

        // Create filtered document list for AI
        const documentsToPassToGemini = currentActiveDocs.map(doc => ({ 
          geminiFileUri: doc.uri, 
          name: doc.name 
        }));
        
        // 🚀 TRUE PROGRESSIVE STREAMING - Omnia Plan Implementation
        let geminiSources = [];
        let generatedImages = []; // For tool-generated images
        let generatedPdfs = []; // For tool-generated PDFs
        let generatedArtifacts = []; // For tool-generated HTML artifacts
        const botMessageId = generateMessageId();
        const botTimestamp = Date.now() + 100; // +100ms to ensure bot comes after user

        // Direct streaming variables (Anthropic best practice)
        let accumulatedText = ''; // Accumulated text for direct display
        let pendingUploads = []; // ✅ Track all async upload operations for unified save point

        // 🔍 Clear any leftover search timeout from previous message
        if (searchShimmerTimeout.current) {
          clearTimeout(searchShimmerTimeout.current);
          searchShimmerTimeout.current = null;
        }

        // 🧠 Thinking mode tracking
        let thinkingStartTime = null; // When thinking started (for timer)
        
        // Add bot message with shimmer indicator immediately
        setMessages(prev => [...prev, {
          id: botMessageId,
          sender: 'bot',
          text: '', // Empty text
          shimmerText: "Just a sec...", // Shimmer indicator
          sources: [],
          isStreaming: true,
          timestamp: botTimestamp,
          hasMetadata: false, // Will be set to true if summary is created
          metadata: {} // Will contain summaryContent and summarizedCount if triggered
        }]);


        // ❌ REMOVED: PDF keyword detection (will be handled by Intent Classifier + Background Agent)

        // 📊 SUMMARY SYSTEM - Check if we should create a summary
        let summaryContent = null;
        let summarizedMessageCount = 0;

        if (shouldTriggerSummarization(messagesWithUser)) {
          console.log('🚀 [SUMMARY] Trigger detected! Creating summary IN PARALLEL...');

          // Show "Compacting conversation..." shimmer (only if user wants to see it)
          if (showSummary) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId
                  ? { ...msg, shimmerText: "Compacting conversation..." }
                  : msg
              )
            );
          }

          // Get messages to summarize and previous summary
          const { previousSummary, messagesToSummarize } = getMessagesToSummarize(messagesWithUser);

          console.log('📊 [SUMMARY] Previous summary exists:', !!previousSummary);
          console.log('📊 [SUMMARY] Messages to summarize:', messagesToSummarize.length);

          // 🚀 Start summarization in PARALLEL (no await - don't block!)
          fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              previousSummary,
              messages: messagesToSummarize
              // Language auto-detected by Flash-Lite from messages
            })
          })
          .then(res => res.json())
          .then(summaryData => {
            if (summaryData.success) {
              summaryContent = summaryData.summary;
              summarizedMessageCount = summaryData.metadata.messageCount;

              console.log('✅ [SUMMARY] Summary created successfully (parallel)');
              console.log('📊 [SUMMARY] Compression:', summaryData.metadata.compressionRatio);
              console.log('📊 [SUMMARY] Summary content length:', summaryContent.length, 'chars');
              console.log('📊 [SUMMARY] Summarized', summarizedMessageCount, 'messages');

              // Update bot message with metadata (main response may already be streaming!)
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId
                    ? {
                        ...msg,
                        hasMetadata: true,
                        metadata: {
                          summaryContent: summaryContent,
                          summarizedCount: summarizedMessageCount
                        }
                      }
                    : msg
                )
              );

              console.log('📊 [SUMMARY] Metadata added to bot message:', botMessageId);
            } else {
              console.error('❌ [SUMMARY] Failed to create summary:', summaryData.error);
            }
          })
          .catch(summaryError => {
            console.error('❌ [SUMMARY] Error:', summaryError);
          });

          console.log('🚀 [SUMMARY] Summarization started in background, continuing to main response...');
        }

        // Build smart context for Claude (summary separately + recent messages)
        // Check if ANY summary exists in messages (not just if we created one now)
        const hasSummary = messagesWithUser.some(msg => msg.hasMetadata && msg.metadata?.summaryContent);

        // Get context with summary separated for Claude system prompt injection
        const contextResult = hasSummary
          ? buildContextForElora(currentMessages, finalTextInput)
          : { summary: null, messages: messagesWithUser };

        const { summary: conversationSummary, messages: contextMessages } = contextResult;

        console.log('🎯 [CONTEXT] Using', hasSummary ? 'SMART CONTEXT' : 'FULL HISTORY');
        console.log('🎯 [CONTEXT] Has summary:', hasSummary);
        console.log('🎯 [CONTEXT] Summary length:', conversationSummary?.length || 0, 'chars');
        console.log('🎯 [CONTEXT] Messages sent to Claude:', contextMessages.length);
        console.log(`💡 [DEEP-REASONING] Calling Claude API with: ${deepReasoningEnabled ? 'ON ⚡' : 'OFF 🚀'}`);

        // 🔍 Track search completion for spacing fix
        let searchJustCompleted = false;
        let textLengthWhenSearchStarted = -1; // Track text length BEFORE search starts

        const isClaude = model.startsWith('claude-');  // ✅ Detects both Haiku and Sonnet
        const result = await (isClaude ? claudeService : geminiService).sendMessage(
          contextMessages,
          (chunk, extra = {}) => {
            // 🧠 Handle thinking mode detection with simple progressive shimmer
            if (extra?.isThinking) {
              // 🔍 Skip thinking shimmer if REAL search is active (check actual searchingWeb flag)
              const currentMessage = messagesRef.current.find(msg => msg.id === botMessageId);
              if (currentMessage?.searchingWeb) {
                return; // Don't overwrite search shimmer with thinking shimmer
              }

              // First thinking chunk - set "Thinking..." and start timer
              if (!thinkingStartTime) {
                thinkingStartTime = Date.now();

                // Show "Thinking..." immediately
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, shimmerText: "Thinking..." }
                      : msg
                  )
                );

                // After 2.5s, change to "Preparing answer..."
                setTimeout(() => {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId && msg.shimmerText
                        ? { ...msg, shimmerText: "Preparing answer..." }
                        : msg
                    )
                  );
                }, 2500);
              }

              return; // Don't process chunk (thinking has no text)
            }

            // 🛠️ Handle tool preparation (shows shimmer during tool latency)
            if (extra?.type === 'tool_preparing' && extra?.shimmerText) {
              console.log('🛠️ [DEBUG] Tool preparing:', extra.shimmerText);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId && msg.isStreaming
                    ? { ...msg, shimmerText: extra.shimmerText }
                    : msg
                )
              );

              // ✅ Two-stage system for fallback "Preparing tools..."
              if (extra.shimmerText === 'Preparing tools...') {
                setTimeout(() => {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId && msg.shimmerText === 'Preparing tools...'
                        ? { ...msg, shimmerText: 'Executing task...' }
                        : msg
                    )
                  );
                }, 2000); // Change to "Executing task..." after 2 seconds
              }

              return; // Don't process as text
            }

            // 🚀 DIRECT STREAMING: Append chunk immediately (Anthropic best practice)
            if (chunk) {
              // 🔍 Add spacing after search completion ONLY if text existed BEFORE search started
              if (searchJustCompleted && textLengthWhenSearchStarted > 0) {
                accumulatedText += '\n\n';
                searchJustCompleted = false;
              }

              accumulatedText += chunk;

              // Update message with new text immediately
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, text: accumulatedText, shimmerText: undefined }
                    : msg
                )
              );
            }

            // Handle both sources and images from extra parameter
            if (Array.isArray(extra) && extra.length > 0) {
              // Old format: sources as array
              geminiSources = extra;
            } else if (extra && typeof extra === 'object') {
              // Handle web search completion
              if (extra.searchCompleted) {
                console.log('✅ [SEARCH] Web search completed, clearing timeout');
                // Clear shimmer timeout
                if (searchShimmerTimeout.current) {
                  clearTimeout(searchShimmerTimeout.current);
                  searchShimmerTimeout.current = null;
                }
                // Hide search shimmer and store sources
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? {
                          ...msg,
                          searchingWeb: false,
                          sources: extra.sources || []
                        }
                      : msg
                  )
                );
                // Also store in geminiSources for final save
                if (extra.sources && extra.sources.length > 0) {
                  geminiSources = extra.sources;
                }
                // 🔍 Set flag for spacing fix on next chunk
                searchJustCompleted = true;
              }
              // New format: object with sources and/or images
              if (extra.sources && extra.sources.length > 0 && !extra.searchCompleted) {
                geminiSources = extra.sources;
              }
              if (extra.images && extra.images.length > 0) {
                // ✅ FIX: Add global index and APPEND base64 for sequential + fallback
                const startIndex = generatedImages.length;
                const newImages = extra.images.map((img, i) => ({
                  ...img,
                  index: startIndex + i  // Global index: 0, 1, 2...
                }));
                generatedImages = [...generatedImages, ...newImages];  // APPEND with index
                console.log('🎨 Images received in normal mode:', newImages.length, '(total:', generatedImages.length, ')');

                // Show "Generating X images..." indicator
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? {
                          ...msg,
                          generatingImages: true,
                          expectedImageCount: (msg.expectedImageCount || 0) + newImages.length
                        }
                      : msg
                  )
                );

                // Start upload immediately in parallel with text streaming for ALL images
                console.log(`🚀 Starting parallel upload for ${newImages.length} images during streaming...`);
                parallelUploadInProgress.current = true;

                // Upload using global index from image object
                const uploadPromises = newImages.map(async (imageData) => {
                  if (imageData.base64 && imageData.mimeType) {
                    console.log(`🚀 Starting parallel upload for image ${imageData.index + 1}/${generatedImages.length}...`);

                    try {
                      const imageTimestamp = Date.now();
                      const uploadResult = await uploadBase64ToSupabaseStorage(
                        imageData.base64,
                        `generated-${imageTimestamp}-${imageData.index}.png`,
                        'generated-images'
                      );

                      if (uploadResult && uploadResult.publicUrl) {
                        console.log(`✅ Image ${imageData.index + 1} upload completed`);
                        return {
                          storageUrl: uploadResult.publicUrl,
                          storagePath: uploadResult.path,
                          mimeType: imageData.mimeType,
                          timestamp: imageTimestamp,
                          index: imageData.index  // Global index from image object!
                        };
                      }
                    } catch (error) {
                      console.error(`💥 Image ${imageData.index + 1} upload failed:`, error);
                      return null;
                    }
                  }
                  return null;
                });

                // Wait for all uploads to complete
                const imageUploadPromise = Promise.all(uploadPromises).then(uploadResults => {
                  const successfulUploads = uploadResults.filter(result => result !== null);
                  console.log(`✅ All parallel uploads completed: ${successfulUploads.length}/${extra.images.length} successful`);

                  // Hide generating indicator now that uploads are done
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId
                        ? { ...msg, generatingImages: false }
                        : msg
                    )
                  );

                  // ✅ FIX: REPLACE base64 with URLs (not append - prevents duplicates!)
                  generatedImages = generatedImages.map(img => {
                    const uploaded = successfulUploads.find(u => u.index === img.index);
                    return uploaded || img;  // Replace with URL if uploaded, keep base64 if not (for fallback)
                  }).sort((a, b) => a.index - b.index);
                  console.log(`✅ All parallel uploads completed, ${successfulUploads.length} base64 images replaced with URLs`);

                  // Don't display images here - wait for streaming to complete
                  // Images will be displayed by completion logic

                  // Mark parallel upload as complete
                  parallelUploadInProgress.current = false;
                }).catch(error => {
                  console.error('💥 Parallel uploads failed:', error);
                  // Mark parallel upload as complete even on error
                  parallelUploadInProgress.current = false;
                });

                // ✅ Track this Promise for unified save point
                pendingUploads.push(imageUploadPromise);

                // ✅ Display Promise - wait for polling logic to add images to state
                const imageDisplayPromise = new Promise((resolve) => {
                  const checkDisplay = setInterval(() => {
                    const msg = messagesRef.current.find(m => m.id === botMessageId);
                    if (msg?.image || msg?.images) {
                      clearInterval(checkDisplay);
                      console.log('✅ Images displayed in state, display Promise resolved');
                      resolve();
                    }
                  }, 50); // Check every 50ms
                });
                pendingUploads.push(imageDisplayPromise);
              }
              // Handle PDF generation from tool calls
              if (extra.pdf) {
                const pdfData = extra.pdf;
                const pdfTimestamp = Date.now();

                console.log('📄 PDF received:', pdfData.title);

                // ✅ Backend sends base64
                let processedBase64 = pdfData.base64;

                // Optional: Verify PDF header for debugging
                try {
                  const verifyBytes = atob(processedBase64);
                  const headerCheck = verifyBytes.substring(0, 4);
                  console.log('🔍 [PDF-CHECK] Header:', headerCheck, headerCheck === '%PDF' ? '✅ Valid PDF' : '⚠️ Not a PDF');
                } catch (error) {
                  console.warn('⚠️ [PDF-CHECK] Could not verify PDF header:', error.message);
                }

                // ✅ Upload FIRST, then assign with URL only (no base64 in IndexedDB)
                console.log('🚀 Starting PDF upload during streaming...');
                const pdfUploadPromise = uploadBase64ToSupabaseStorage(
                  processedBase64,
                  `generated-${pdfTimestamp}-${pdfData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
                  'generated-pdfs-temp'
                ).then(uploadResult => {
                  console.log('✅ [UPLOAD] PDF uploaded, updating message with URL');

                  // ✅ Assign PDF with URL only (no base64)
                  const uploadedPdfData = {
                    title: pdfData.title,
                    filename: pdfData.filename || `${pdfData.title}.pdf`,
                    storageUrl: uploadResult.publicUrl,
                    storagePath: uploadResult.path,
                    timestamp: pdfTimestamp
                  };

                  generatedPdfs = [uploadedPdfData];

                  // ✅ Update message in state with URL
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId
                        ? { ...msg, pdf: uploadedPdfData }
                        : msg
                    )
                  );

                  console.log('✅ PDF with URL ready (save deferred to unified save point)');
                }).catch(error => {
                  console.error('💥 PDF upload failed:', error);
                });

                // ✅ Track this Promise for unified save point
                pendingUploads.push(pdfUploadPromise);
              }
              // Handle artifact creation (SAME AS PDF - upload from frontend!)
              if (extra.artifact) {
                const artifactData = extra.artifact;
                const artifactTimestamp = Date.now();

                console.log('🎨 [ARTIFACT] Artifact received:', artifactData.title);

                // ✅ Backend sends base64 HTML (like PDF)
                let processedBase64 = artifactData.base64;

                // ✅ Upload FIRST, then assign with URL only (no base64 in IndexedDB)
                console.log('🚀 [ARTIFACT] Starting HTML upload during streaming...');
                const artifactUploadPromise = uploadBase64ToSupabaseStorage(
                  processedBase64,
                  artifactData.filename || `artifact-${artifactTimestamp}-${artifactData.title.replace(/[^a-z0-9]/gi, '_')}.html`,
                  'attachments' // Same bucket as other files
                ).then(uploadResult => {
                  console.log('✅ [ARTIFACT-UPLOAD] HTML uploaded, updating message with URL');

                  // ✅ Assign artifact with URL only (no base64)
                  const uploadedArtifactData = {
                    title: artifactData.title,
                    filename: artifactData.filename,
                    storageUrl: uploadResult.publicUrl,
                    storagePath: uploadResult.path,
                    timestamp: artifactTimestamp
                  };

                  generatedArtifacts = [uploadedArtifactData];

                  // ✅ Update message in state with URL
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId
                        ? { ...msg, artifact: uploadedArtifactData }
                        : msg
                    )
                  );

                  console.log('✅ [ARTIFACT] Artifact with URL ready (save deferred to unified save point)');
                }).catch(error => {
                  console.error('💥 [ARTIFACT] Upload failed:', error);
                });

                // ✅ Track this Promise for unified save point
                pendingUploads.push(artifactUploadPromise);
              }
              // 🔧 Handle function call events (for memory persistence)
              if (extra.functionCall) {
                console.log('🔧 [MEMORY] Function call captured:', extra.functionCall.name);
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? {
                          ...msg,
                          functionCall: extra.functionCall,
                          hasFunctionCall: true
                        }
                      : msg
                  )
                );
              }
              // 🔧 Handle function response events (for memory persistence)
              if (extra.functionResponse) {
                console.log('🔧 [MEMORY] Function response captured:', extra.functionResponse.name);
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageId
                      ? {
                          ...msg,
                          functionResponse: extra.functionResponse
                        }
                      : msg
                  )
                );
              }
            }

            // 🎯 STREAM COMPLETION LOGIC
            if (extra.completed) {
              // Hide loading indicators
              setLoading(false);
              setStreaming(false);

              // 🔍 Clear search timeout if still active (prevent leaking to next message)
              if (searchShimmerTimeout.current) {
                clearTimeout(searchShimmerTimeout.current);
                searchShimmerTimeout.current = null;
              }

              console.log('🎯 Stream finished, accumulated text length:', accumulatedText.length, 'chars');

              // 🔄 ROLLBACK: Check if stream produced no content AND no pending tool outputs
              if (accumulatedText === '' && pendingUploads.length === 0) {
                console.error('❌ Stream failed - no content or tool outputs received, initiating rollback');

                // Remove the failed messages (user + bot with span indicator)
                setMessages(prev => prev.slice(0, -2));

                // Restore user text to input
                setInput(originalUserText);

                // Show error notification
                showNotification('Something went wrong. Please try again.', 'error');

                // Don't save to DB - rollback complete
                console.log('✅ Rollback complete - messages removed, text restored to input');
                return;
              } else if (accumulatedText === '') {
                // ✅ No text but we have tool outputs (PDF/images) - this is valid!
                console.log('✅ Stream complete with tool outputs only (no text)');
              }

              // Normal completion - stream had content
              // Finalize message and show generating indicator if images expected AND not already uploaded
              const shouldShowGenerating = generatedImages &&
                                          generatedImages.length > 0 &&
                                          !generatedImages.every(img => img.storageUrl);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId
                    ? {
                        ...msg, // 📊 This preserves hasMetadata and metadata from earlier!
                        isStreaming: false,
                        shimmerText: undefined, // ✅ Clear shimmer indicators
                        sources: geminiSources,
                        ...(shouldShowGenerating && {
                          generatingImages: true,
                          expectedImageCount: generatedImages.length  // Total accumulated count
                        })
                      }
                    : msg
                )
              );

              // Process images FIRST, then save to DB
              setTimeout(async () => {
                // Check if images were already processed during streaming
                if (generatedImages && generatedImages.length > 0) {
                  // Check if all images have been uploaded during streaming
                  const allImagesHaveStorageUrl = generatedImages.every(img => img.storageUrl);

                  if (allImagesHaveStorageUrl && !parallelUploadInProgress.current) {
                    console.log(`✅ ${generatedImages.length} images already uploaded during streaming, progressive display starting`);

                    // For single image, display immediately (no change)
                    if (generatedImages.length === 1) {
                      setMessages(currentMessages => {
                        const lastMessage = currentMessages[currentMessages.length - 1];
                        if (lastMessage && lastMessage.sender === 'bot') {
                          const updatedMessage = {
                            ...lastMessage,
                            image: generatedImages[0]
                          };
                          console.log(`✅ Single image displayed after streaming`);
                          return [...currentMessages.slice(0, -1), updatedMessage];
                        }
                        return currentMessages;
                      });
                    } else {
                      // For multiple images, display all at once with skeletons
                      setMessages(currentMessages => {
                        const lastMessage = currentMessages[currentMessages.length - 1];
                        if (lastMessage && lastMessage.sender === 'bot') {
                          const updatedMessage = {
                            ...lastMessage,
                            images: generatedImages // Show all images at once
                          };
                          console.log(`✅ All ${generatedImages.length} images displayed at once with skeletons`);
                          return [...currentMessages.slice(0, -1), updatedMessage];
                        }
                        return currentMessages;
                      });
                    }
                  } else if (!parallelUploadInProgress.current) {
                    // Some images need fallback upload (parallel uploads may have failed) and parallel upload is not in progress
                    console.log(`🎨 Fallback: uploading ${generatedImages.length} images in completion...`);

                    const uploadPromises = generatedImages.map(async (imageData, index) => {
                      if (imageData.storageUrl) {
                        // Already uploaded
                        return imageData;
                      } else if (imageData.base64 && imageData.mimeType) {
                        console.log(`🎨 Fallback: uploading image ${index + 1}/${generatedImages.length}...`);

                        try {
                          const imageTimestamp = Date.now();
                          const uploadResult = await uploadBase64ToSupabaseStorage(
                            imageData.base64,
                            `generated-${imageTimestamp}-${index}.png`,
                            'generated-images'
                          );

                          if (uploadResult && uploadResult.publicUrl) {
                            return {
                              storageUrl: uploadResult.publicUrl,
                              storagePath: uploadResult.path,
                              mimeType: imageData.mimeType,
                              timestamp: imageTimestamp,
                              index: index
                            };
                          }
                        } catch (uploadError) {
                          console.error(`💥 Fallback upload failed for image ${index + 1}:`, uploadError);
                          return null;
                        }
                      }
                      return null;
                    });

                    Promise.all(uploadPromises).then(uploadResults => {
                      const successfulUploads = uploadResults.filter(result => result !== null);
                      const sortedImages = successfulUploads.sort((a, b) => a.index - b.index);

                      // Update message with all fallback uploads
                      setMessages(currentMessages => {
                        const lastMessage = currentMessages[currentMessages.length - 1];
                        if (lastMessage && lastMessage.sender === 'bot') {
                          const updatedMessage = {
                            ...lastMessage,
                            // Use conditional logic: single image vs multiple images
                            ...(sortedImages.length === 1
                              ? { image: sortedImages[0] }    // Single image - use existing 'image' field
                              : { images: sortedImages }      // Multiple images - use 'images' array
                            )
                          };
                          console.log(`✅ ${sortedImages.length} fallback images displayed`);
                          return [...currentMessages.slice(0, -1), updatedMessage];
                        }
                        return currentMessages;
                      });

                      // ✅ FIX: REPLACE base64 with URLs after fallback upload
                      generatedImages = generatedImages.map(img => {
                        const uploaded = sortedImages.find(u => u.index === img.index);
                        return uploaded || img;  // Replace with URL if uploaded, keep if not
                      }).sort((a, b) => a.index - b.index);
                    });
                  } else {
                    // Parallel upload is in progress, wait for it to complete then display images
                    console.log(`⏳ Waiting for parallel upload to complete before displaying images...`);

                    // Poll until parallel upload is done
                    const waitForUpload = setInterval(() => {
                      if (!parallelUploadInProgress.current && generatedImages && generatedImages.length > 0) {
                        clearInterval(waitForUpload);

                        // Check if parallel upload was successful (images have URLs)
                        console.log(`🔍 Checking if ${generatedImages.length} images have URLs after parallel upload...`);
                        const allHaveUrl = generatedImages.every(img => img.storageUrl);
                        console.log(`📊 URL check result: ${generatedImages.filter(img => img.storageUrl).length}/${generatedImages.length} images have URLs`);

                        if (allHaveUrl) {
                          console.log(`✅ Parallel upload successful, displaying ${generatedImages.length} images with URLs`);

                          // Display images now that upload is complete
                          if (generatedImages.length === 1) {
                          // Single image
                          setMessages(currentMessages => {
                            const lastMessage = currentMessages[currentMessages.length - 1];
                            if (lastMessage && lastMessage.sender === 'bot') {
                              const updatedMessage = {
                                ...lastMessage,
                                image: generatedImages[0]
                              };
                              console.log(`✅ Single image displayed after waiting for parallel upload`);
                              return [...currentMessages.slice(0, -1), updatedMessage];
                            }
                            return currentMessages;
                          });
                        } else {
                          // Multiple images
                          setMessages(currentMessages => {
                            const lastMessage = currentMessages[currentMessages.length - 1];
                            if (lastMessage && lastMessage.sender === 'bot') {
                              const updatedMessage = {
                                ...lastMessage,
                                images: generatedImages
                              };
                              console.log(`✅ All ${generatedImages.length} images displayed after waiting for parallel upload`);
                              return [...currentMessages.slice(0, -1), updatedMessage];
                            }
                            return currentMessages;
                          });
                        }
                        } else {
                          // Parallel upload failed, start fallback upload
                          console.log(`❌ Parallel upload failed, starting fallback upload for ${generatedImages.length} images`);

                          const uploadPromises = generatedImages.map(async (imageData, index) => {
                            if (imageData.base64 && imageData.mimeType) {
                              try {
                                const imageTimestamp = Date.now();
                                const uploadResult = await uploadBase64ToSupabaseStorage(
                                  imageData.base64,
                                  `generated-${imageTimestamp}-${index}.png`,
                                  'generated-images'
                                );

                                if (uploadResult && uploadResult.publicUrl) {
                                  return {
                                    storageUrl: uploadResult.publicUrl,
                                    storagePath: uploadResult.path,
                                    mimeType: imageData.mimeType,
                                    timestamp: imageTimestamp,
                                    index: index
                                  };
                                }
                              } catch (error) {
                                console.error(`💥 Fallback upload failed for image ${index + 1}:`, error);
                              }
                            }
                            return null;
                          });

                          Promise.all(uploadPromises).then(results => {
                            const successfulUploads = results.filter(result => result !== null);
                            const sortedImages = successfulUploads.sort((a, b) => a.index - b.index);

                            // ✅ FIX: REPLACE base64 with URLs after fallback upload
                            generatedImages = generatedImages.map(img => {
                              const uploaded = sortedImages.find(u => u.index === img.index);
                              return uploaded || img;  // Replace with URL if uploaded, keep if not
                            }).sort((a, b) => a.index - b.index);

                            console.log(`✅ Fallback upload completed: ${sortedImages.length}/${generatedImages.length} successful`);

                            // Now display the images with fallback URLs
                            if (sortedImages.length === 1) {
                              setMessages(currentMessages => {
                                const lastMessage = currentMessages[currentMessages.length - 1];
                                if (lastMessage && lastMessage.sender === 'bot') {
                                  const updatedMessage = {
                                    ...lastMessage,
                                    image: sortedImages[0]
                                  };
                                  return [...currentMessages.slice(0, -1), updatedMessage];
                                }
                                return currentMessages;
                              });
                            } else {
                              setMessages(currentMessages => {
                                const lastMessage = currentMessages[currentMessages.length - 1];
                                if (lastMessage && lastMessage.sender === 'bot') {
                                  const updatedMessage = {
                                    ...lastMessage,
                                    images: sortedImages
                                  };
                                  return [...currentMessages.slice(0, -1), updatedMessage];
                                }
                                return currentMessages;
                              });
                            }
                          });
                        }
                      }
                    }, 100); // Check every 100ms
                  }
                }

                // Process PDFs after images (only if not already processed with URL)
                if (generatedPdfs && generatedPdfs.length > 0) {
                  const pdfData = generatedPdfs[0];

                  // ✅ Guard: Skip if PDF already has storageUrl (already processed during streaming)
                  if (pdfData.storageUrl) {
                    console.log('📄 PDF already processed with URL during streaming, skipping completion processing');
                  } else {
                    console.log('📄 Processing PDF in completion (fallback):', pdfData.title);

                    // Update message with PDF data
                    setMessages(currentMessages => {
                      const lastMessage = currentMessages[currentMessages.length - 1];
                      if (lastMessage && lastMessage.sender === 'bot') {
                        const updatedMessage = {
                          ...lastMessage,
                          pdf: pdfData
                        };
                        console.log('✅ PDF added to message');
                        return [...currentMessages.slice(0, -1), updatedMessage];
                      }
                      return currentMessages;
                    });
                  }
                }

                // Process artifacts (already has URL from backend, just ensure it's in message)
                if (generatedArtifacts && generatedArtifacts.length > 0) {
                  const artifactData = generatedArtifacts[0];
                  console.log('🎨 [COMPLETION] Processing artifact in completion:', artifactData.title);
                  console.log('🎨 [COMPLETION] Artifact data:', JSON.stringify(artifactData, null, 2));

                  // Ensure message has artifact data (should already be there from streaming)
                  setMessages(currentMessages => {
                    const lastMessage = currentMessages[currentMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'bot' && !lastMessage.artifact) {
                      const updatedMessage = {
                        ...lastMessage,
                        artifact: artifactData
                      };
                      console.log('✅ Artifact added to message in completion');
                      return [...currentMessages.slice(0, -1), updatedMessage];
                    }
                    console.log('✅ Artifact already in message from streaming');
                    return currentMessages;
                  });
                }

                // ✅ UNIFIED SAVE POINT - Wait for ALL async operations
                if (pendingUploads.length > 0) {
                  console.log(`⏳ Waiting for ${pendingUploads.length} pending upload(s) before saving...`);
                  Promise.all(pendingUploads)
                    .then(() => {
                      const completionTimestamp = Date.now();
                      console.log('✅ All uploads complete, setting needsAutoSave flag');
                      console.log(`🕐 [TIMESTAMP-FIX] Claude multi-tool message completed at: ${new Date(completionTimestamp).toISOString()}`);
                      // Set needsAutoSave flag instead of direct save
                      // useEffect will handle the save with correct state
                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === botMessageId
                            ? { ...msg, needsAutoSave: true, timestamp: completionTimestamp }
                            : msg
                        )
                      );
                    })
                    .catch(error => {
                      const completionTimestamp = Date.now();
                      console.error('💥 Upload failed, saving anyway:', error);
                      console.log(`🕐 [TIMESTAMP-FIX] Claude message completed (with upload error) at: ${new Date(completionTimestamp).toISOString()}`);
                      // Set flag even on error
                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === botMessageId
                            ? { ...msg, needsAutoSave: true, timestamp: completionTimestamp }
                            : msg
                        )
                      );
                    });
                } else {
                  // No pending uploads - set flag immediately (text-only response)
                  const completionTimestamp = Date.now();
                  console.log('✅ No pending uploads, setting needsAutoSave flag immediately');
                  console.log(`🕐 [TIMESTAMP-FIX] Claude text-only message completed at: ${new Date(completionTimestamp).toISOString()}`);
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId
                        ? { ...msg, needsAutoSave: true, timestamp: completionTimestamp }
                        : msg
                    )
                  );
                }
              }, 100);

              console.log('🎯 Direct streaming complete');
            }
          },
          () => {
            console.log('🔍 [DEBUG] Web search callback triggered! Updating shimmer to "Searching the web..."');
            // 🔍 Snapshot text length BEFORE search starts (for spacing logic)
            textLengthWhenSearchStarted = accumulatedText.length;
            console.log('🔍 [DEBUG] Text length before search:', textLengthWhenSearchStarted);

            // Update shimmer text to "Searching the web..."
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId && msg.isStreaming
                  ? { ...msg, searchingWeb: true, shimmerText: "Searching the web..." }
                  : msg
              )
            );

            // After 2.5s, change to "Getting results..."
            searchShimmerTimeout.current = setTimeout(() => {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId && msg.searchingWeb
                    ? { ...msg, shimmerText: "Getting results..." }
                    : msg
                )
              );
            }, 2500);
          },
          () => {
            console.log('🎨 [DEBUG] Image generation callback triggered! Updating shimmer to "Being creative..."');
            // Update shimmer text to "Being creative..."
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId && msg.isStreaming
                  ? { ...msg, shimmerText: "Being creative..." }
                  : msg
              )
            );
          },
          () => {
            console.log('📄 [DEBUG] PDF generation callback triggered! Updating shimmer to "Generating document..."');
            // Update shimmer text to "Generating document..."
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId && msg.isStreaming
                  ? { ...msg, shimmerText: "Generating document..." }
                  : msg
              )
            );
          },
          () => {
            console.log('🎨 [DEBUG] Artifact creation callback triggered! Updating shimmer to "Creating artifact..."');
            // Update shimmer text to "Creating artifact..."
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId && msg.isStreaming
                  ? { ...msg, shimmerText: "Creating artifact..." }
                  : msg
              )
            );
          },
          documentsToPassToGemini,
          false, // imageMode
          false, // pdfMode (no longer auto-detected)
          conversationSummary, // ✅ Pass summary for Claude system prompt injection
          deepReasoningEnabled, // 💡 Deep Reasoning toggle
          model // ✅ Model selection (needed for Claude: Haiku or Sonnet)
        );

        // Use final result for saving
        responseText = result.text;
        const sources = geminiSources.length > 0 ? geminiSources : (result.sources || []);
        sourcesToSave = sources;
        
        console.log('🎯 GEMINI FINAL SOURCES:', sources);

        // Images are already processed during streaming via callback
        // No need to process them again from result.images

        // Messages already updated via streaming, just check auto-save
        // COMMENTED OUT - This was causing flash effect by duplicating the message
        // const currentMessages = [...messagesWithUser, { 
        //   id: generateMessageId(),
        //   sender: 'bot', 
        //   text: responseText,
        //   sources: sources,
        //   isStreaming: false,
        //   timestamp: botTimestamp // Use same timestamp as streaming
        // }];
        
        // 🔄 Check auto-save after AI response
        // MOVED TO word-by-word animation completion
        // const cleanedMessages = await checkAutoSave(currentMessages, activeChatId);
        // setMessages(cleanedMessages);
        
        // ❌ REMOVED: Scroll limit activation

        // ❌ REMOVED: Save after Gemini response (to prevent race conditions)
        
        
        if (fromVoice && responseText) {
          console.log('🎵 AI response complete, processing voice...');
          setTimeout(async () => {
            await processVoiceResponse(responseText, detectedLang);
          }, 500);
        } else {
        }
      }

    } catch (err) {
      crashMonitor.trackChatOperation('send_message_failed', { 
        error: err.message, 
        model, 
        stack: err.stack 
      });
      console.error('💥 API call error:', err);
      
      // 🔄 ROLLBACK: ANY error should trigger rollback to prevent stuck span indicator
      // Remove the user and bot messages with span indicator from state
      setMessages(prev => {
        // Find and remove last 2 messages (user + bot with span indicator or streaming state)
        const lastBotMessage = prev[prev.length - 1];
        const needsRollback = lastBotMessage?.isStreaming ||
                             lastBotMessage?.text?.includes('chat-loading-dots') ||
                             lastBotMessage?.text?.includes('shimmer-skeleton') ||
                             lastBotMessage?.text?.includes('•') ||
                             lastBotMessage?.text === '';
        
        if (needsRollback) {
          console.log('🔄 [ROLLBACK] Removing failed messages after error:', err.message);
          return prev.slice(0, -2);
        }
        return prev;
      });
      
      // Restore original text to input bar if we have it
      if (originalUserText) {
        setInput(originalUserText);
      }
      
      // Show user-friendly error message based on error type
      const errorLower = err.message?.toLowerCase() || '';
      
      let errorMessage;
      if (errorLower.includes('fail') || errorLower.includes('network') || errorLower.includes('fetch') || !navigator.onLine) {
        errorMessage = 'Connection lost - please check your internet and try again';
      } else if (errorLower.includes('429') || errorLower.includes('too many')) {
        errorMessage = 'Too many requests - please wait a moment and try again';
      } else if (errorLower.includes('500') || errorLower.includes('503') || errorLower.includes('server')) {
        errorMessage = 'Server error - please try again in a few moments';
      } else if (errorLower.includes('quota') || errorLower.includes('limit')) {
        errorMessage = 'API limit reached - please try again later';
      } else if (errorLower.includes('timeout')) {
        errorMessage = 'Request timed out - please try again';
      } else {
        // Generic fallback for unknown errors
        errorMessage = 'Something went wrong - please try again';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
      setStreaming(false);
      
      // ✅ SINGLE SAVE POINT - Only save when conversation is complete
      if (currentChatId && responseText && !fromVoice) {
        try {
          console.log('💾 [MONITOR] Saving completed conversation:', {
            chatId: currentChatId,
            messageCount: messages.length + 2, // user + AI
            model: model,
            timestamp: new Date().toISOString()
          });
          
          const finalMessages = [...currentMessages, 
            { id: generateMessageId(), sender: 'user', text: finalTextInput },
            { id: generateMessageId(), sender: 'bot', text: responseText, sources: sourcesToSave || [] }
          ];
          
          // ❌ REMOVED: zbytečné save po každé zprávě - save jen na 4 místech!
          // ❌ REMOVED: zbytečné loadChatHistories - aktualizuje se jen při switch
          
          crashMonitor.trackIndexedDB('conversation_updated', currentChatId, true);
          crashMonitor.trackChatOperation('send_message_success', { 
            model, 
            responseLength: responseText.length,
            sourcesCount: sourcesToSave?.length || 0 
          });
          
        } catch (error) {
          crashMonitor.trackIndexedDB('save_conversation', currentChatId, false, error);
          console.error('❌ [MONITOR] IndexedDB save failed:', {
            error: error.message,
            stack: error.stack,
            chatId: currentChatId,
            timestamp: new Date().toISOString()
          });
          
          // No localStorage fallback - IndexedDB save failed but we continue
          sessionManager.saveCurrentChatId(currentChatId);
        }
      } else if (responseText) {
        crashMonitor.trackChatOperation('send_message_success', { 
          model, 
          responseLength: responseText.length,
          fromVoice: true 
        });
      }
    }
  }, [model, isImageMode, deepReasoningEnabled]);

  const handleTranscript = useCallback(async (text, confidence = 1.0) => {
    console.log('🎙️ Voice transcript received:', { text, confidence });
    
    const detectedLang = detectLanguage(text);
    setUserLanguage(detectedLang);
    console.log('🌍 Voice detected language:', detectedLang);
    
    if (showVoiceScreen) {
      await handleSend(text, true);
    } else {
      setInput(text);
    }
  }, [showVoiceScreen, handleSend]);

  // Create slides array from all images in current conversation
  const getAllImagesFromChat = useCallback(() => {
    const slides = [];

    messages.forEach(msg => {
      // Generated single image (from image mode)
      if (msg.image) {
        const imageUrl = msg.image.storageUrl || (msg.image.base64 ? `data:${msg.image.mimeType};base64,${msg.image.base64}` : null);
        if (imageUrl) {
          slides.push({
            src: imageUrl,
            alt: `Generated: ${msg.text.slice(0, 30)}...`,
            title: `Generated: ${msg.text.slice(0, 30)}...`
          });
        }
      }

      // Generated multiple images (2-4 images from tool)
      if (msg.images && msg.images.length > 0) {
        msg.images.forEach((image, index) => {
          const imageUrl = image.storageUrl || (image.base64 ? `data:${image.mimeType};base64,${image.base64}` : image);
          if (imageUrl) {
            slides.push({
              src: imageUrl,
              alt: `Generated ${index + 1}: ${msg.text.slice(0, 30)}...`,
              title: `Generated ${index + 1}: ${msg.text.slice(0, 30)}...`
            });
          }
        });
      }

      // User uploaded attachments (images)
      if (msg.attachments) {
        msg.attachments.forEach(attachment => {
          if (attachment.type?.startsWith('image/')) {
            // Use previewUrl (1024px optimized) for UI, NOT storageUrl (original 5MB+)
            // storageUrl is ONLY for AI processing
            const imageUrl = attachment.previewUrl || attachment.storageUrl;
            if (imageUrl) {
              slides.push({
                src: imageUrl,
                alt: attachment.name,
                title: attachment.name
              });
            }
          }
        });
      }
    });

    return slides;
  }, [messages]);

  // Open lightbox for single image preview (InputBar)
  const openSingleImageLightbox = useCallback((imageUrl, imageName) => {
    const singleSlide = [{ src: imageUrl, alt: imageName, title: imageName }];
    setLightboxState({
      open: true,
      index: 0,
      slides: singleSlide
    });
  }, []);

  // Open lightbox with all chat images navigation (MessageItem)
  const openLightbox = useCallback((imageUrl, imageName) => {
    const slides = getAllImagesFromChat();
    const index = slides.findIndex(slide => slide.src === imageUrl);

    if (index !== -1) {
      setLightboxState({ open: true, index, slides });
    } else {
      // Fallback - add this image to slides if not found
      slides.push({ src: imageUrl, alt: imageName, title: imageName });
      setLightboxState({ open: true, index: slides.length - 1, slides });
    }
  }, [getAllImagesFromChat]);

  // 🖼️ Open lightbox from Gallery with ALL images (allows navigation)
  const openGalleryLightbox = useCallback((clickedUrl, allImages) => {
    // Convert Gallery images to YARL slides format
    const slides = allImages.map(img => ({
      src: img.url,
      alt: img.chatName || 'Generated image',
      title: img.chatName || 'Generated image'
    }));

    // Find index of clicked image
    const index = slides.findIndex(slide => slide.src === clickedUrl);

    setLightboxState({
      open: true,
      index: index !== -1 ? index : 0,
      slides
    });
  }, []);

  // Close lightbox
  const closeLightbox = () => {
    setLightboxState({ open: false, index: 0, slides: [] });
  };

  // 🔄 Helper function to convert File object to base64 string


  // Custom code component for syntax highlighting
// 🚀 OMNIA - APP.JSX PART 3/3 - JSX RENDER (REDESIGNED podle fotky)
// ✅ NEW: Single gradient background + fixed top buttons + multilingual welcome
// ✅ NEW: Logo zmizí po první zprávě + clean layout
// 🎯 UNCHANGED: Chat messages, sources, copy buttons - vše stejné


// Helper function to check supported file extensions (fallback for MIME type detection)
const isFileExtensionSupported = (fileName) => {
  if (!fileName) return false;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  const supportedExtensions = [
    // Documents
    'pdf',
    // Images
    'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'tif', 'gif',
    // Text files
    'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'htm',
    'xml', 'yaml', 'yml', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go',
    'sql', 'csv', 'log', 'config', 'ini', 'env'
  ];
  
  return supportedExtensions.includes(extension);
};

const handleDocumentUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  const messages = getUploadErrorMessages(userLanguage);
  
  // Check if it's supported format
  const supportedTypes = [
    // Documents
    'application/pdf',        // PDF
    // Images  
    'image/png',             // PNG  
    'image/jpeg',            // JPEG/JPG
    'image/bmp',             // BMP
    'image/tiff',            // TIFF/TIF
    'image/gif',             // GIF
    // Text files
    'text/plain',            // TXT
    'text/markdown',         // MD
    'application/json',      // JSON
    'application/javascript', // JS
    'text/javascript',       // JS (alternative)
    'text/jsx',              // JSX
    'text/typescript',       // TS/TSX
    'text/css',              // CSS
    'text/html'              // HTML
  ];
  
  // Check MIME type or fallback to file extension for better compatibility
  const isSupported = supportedTypes.includes(file.type) || 
                      isFileExtensionSupported(file.name);
  
  if (!isSupported) {
    showNotification(messages.pdfOnly, 'error');
    return;
  }
  
  // Check file size - now supporting much larger files with direct upload
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB for direct upload
  if (file.size > MAX_FILE_SIZE) {
    showNotification(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB`, 'error');
    return;
  }

  // Check daily upload limit - increased for direct upload
  const DAILY_LIMIT = 200 * 1024 * 1024; // 200 MB daily limit with direct upload
  const todayUploaded = JSON.parse(localStorage.getItem('dailyUploads') || '{"date": "", "bytes": 0}');
  const today = new Date().toDateString();

  // Reset if new day
  if (todayUploaded.date !== today) {
    todayUploaded.date = today;
    todayUploaded.bytes = 0;
  }

  // Check if adding this file would exceed daily limit
  if (todayUploaded.bytes + file.size > DAILY_LIMIT) {
    const remainingMB = Math.max(0, (DAILY_LIMIT - todayUploaded.bytes) / (1024 * 1024)).toFixed(1);
    showNotification(`Daily upload limit exceeded. Remaining: ${remainingMB} MB`, 'error');
    return;
  }
  
  setLoading(true);
  console.log(`📤 [UPLOAD] Starting upload: ${file.name} (${formatFileSize(file.size)})`);
  
  // Decide upload method based on file size and type
  const useDirectUpload = shouldUseDirectUpload(file);
  console.log(`🎯 [UPLOAD] Using ${useDirectUpload ? 'DIRECT' : 'TRADITIONAL'} upload method`);
  
  try {
    let result;
    
    if (useDirectUpload) {
      // 🚀 DIRECT UPLOAD TO GCS - bypasses Vercel limits
      
      // Progress callback for user feedback
      const onProgress = (progress) => {
        console.log(`⬆️ [DIRECT-UPLOAD] Progress: ${progress.percent}% (${formatFileSize(progress.loaded)}/${formatFileSize(progress.total)})`);
        // TODO: Add progress UI if needed
      };
      
      // Upload directly to GCS
      const uploadResult = await uploadDirectToGCS(file, onProgress);
      
      // Process document from GCS
      console.log('🔄 [DIRECT-UPLOAD] Processing document...');
      result = await processGCSDocument(uploadResult.gcsUri, uploadResult.originalName);
      
      // Add GCS metadata to result
      result.gcsUri = uploadResult.gcsUri;
      result.publicUrl = uploadResult.publicUrl;
      
    } else {
      // 🔄 TRADITIONAL UPLOAD via Vercel API
      console.log('🔄 [TRADITIONAL-UPLOAD] Using traditional upload...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      result = await response.json();
    }
    
    console.log('✅ [UPLOAD] Document processing completed');
    
    // Upload to Gemini File API (works for both upload methods)
    console.log('🔄 [UPLOAD] Uploading for AI analysis...');
    
    const geminiResponse = await fetch('/api/upload-to-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfUrl: result.originalPdfUrl || result.gcsUri,
        originalName: result.originalName
      })
    });

    if (!geminiResponse.ok) {
      throw new Error('Failed to upload to Gemini');
    }

    const geminiResult = await geminiResponse.json();
    console.log('✅ [UPLOAD] AI upload completed');

    // Save document reference with Gemini file URI
    const newDoc = {
      id: Date.now(),
      name: result.originalName,
      documentUrl: result.documentUrl,
      originalPdfUrl: result.originalPdfUrl || result.gcsUri,
      geminiFileUri: geminiResult.fileUri,
      fileName: result.fileName || file.name,
      pageCount: result.pageCount || 0,
      preview: result.preview || '',
      uploadMethod: useDirectUpload ? 'direct-gcs' : 'traditional',
      uploadedAt: new Date()
    };

    setUploadedDocuments(prev => [...prev, newDoc]);

    // ✅ Add document to active AI context
    setActiveDocumentContexts(prev => [
      ...prev.filter(d => d.uri !== geminiResult.fileUri), // Prevent duplicates
      {
        uri: geminiResult.fileUri,
        name: result.originalName,
        uploadTimestamp: Date.now(),
        lastAccessedTimestamp: Date.now(),
        lastAccessedMessageIndex: messages.length + 1
      }
    ]);

    // Update daily upload tracking
    todayUploaded.bytes += file.size;
    localStorage.setItem('dailyUploads', JSON.stringify(todayUploaded));

    // Add hidden context message for AI (not visible to user)
    const hiddenContextMessage = {
      id: generateMessageId(),
      sender: 'system',
      text: `📄 Dokument "${result.originalName}" byl úspěšně nahrán (${result.pageCount || 0} stran, ${formatFileSize(file.size)}). AI má plný přístup k dokumentu a může jej analyzovat.`,
      isHidden: true
    };

    // Add to messages context but don't display to user
    setMessages(prev => [...prev, hiddenContextMessage]);
    
    console.log(`✅ [UPLOAD] Successfully uploaded: ${file.name} via ${useDirectUpload ? 'direct GCS' : 'traditional'} method`);
    
  } catch (error) {
    console.error('❌ [UPLOAD] Document upload error:', error);
    showNotification(error.message || 'Document processing error', 'error');
  } finally {
    setLoading(false);
  }
};

// 📄 HANDLE SEND WITH DOCUMENTS
const handleSendWithDocuments = useCallback(async (text, documents) => {
  // ❌ REMOVED: Scroll limit logic

  const currentMessages = messagesRef.current;
  const currentDocuments = uploadedDocumentsRef.current;
  const currentLoading = loading;
  const currentStreaming = streaming;

  // 🔄 ROLLBACK: Save original text for potential restoration
  const originalUserText = text;

  // 🛡️ Safety check: Ensure documents is always an array
  const safeDocuments = documents || [];

  console.log('📤 Sending with documents:', text, safeDocuments);

  if (!text.trim() && safeDocuments.length === 0) {
    return;
  }
  if (currentLoading || currentStreaming) {
    return;
  }

  // 🔒 CRITICAL: Set loading immediately to prevent race condition
  setLoading(true);
  setStreaming(true);

  // 🎯 ENSURE CHAT ID EXISTS - same logic as normal handleSend
  let activeChatId = getSafeChatId();
  
  if (!activeChatId) {
    activeChatId = chatDB.generateChatId();
    updateCurrentChatId(activeChatId);
    console.log('🆕 [DOC-SEND] Created new chat for documents:', activeChatId);
  }
  
  // Create attachments using prepared URLs or fallback to file processing
  const attachments = await Promise.all(safeDocuments.map(async (doc) => {
    // 🚀 CHECK IF DOCUMENT IS ALREADY UPLOADED (from background upload)
    // For Gemini: has geminiFileUri + supabaseUrl + gcsUri
    // For Claude: has claudeFileId + supabaseUrl
    if (doc.supabaseUrl || doc.geminiFileUri || doc.claudeFileId) {
      console.log(`✅ [PREPARED-DOC] Using pre-uploaded URLs for: ${doc.name} (modelType: ${doc.modelType || 'unknown'})`);

      return {
        name: doc.name,
        size: doc.size || 'Unknown size',
        type: doc.file?.type || 'application/octet-stream',
        storageUrl: doc.storageUrl || doc.supabaseUrl, // Original for AI
        thumbnailUrl: doc.thumbnailUrl, // 160px WebP for chips (images only)
        previewUrl: doc.previewUrl || doc.supabaseUrl, // 1280px WebP for display (images only)
        storagePath: doc.supabasePath,
        geminiFileUri: doc.geminiFileUri, // Only for Gemini (undefined for Claude)
        gcsUri: doc.gcsUri, // Only for Gemini (undefined for Claude)
        claudeFileId: doc.claudeFileId, // Only for Claude (undefined for Gemini)
        modelType: doc.modelType, // Track which model this doc is for
        // Don't include _tempFile since we already have cloud URLs
        preparationMethod: 'background-upload' // Track how it was prepared
      };
    }
    
    // 🔄 FALLBACK - Process file if not pre-uploaded (safety)
    console.log(`⏳ [FALLBACK-DOC] Processing file traditionally: ${doc.name}`);
    
    // Start base64 conversion for persistence (non-blocking)
    const base64Promise = convertFileToBase64(doc.file).catch(error => {
      console.error(`Base64 conversion failed for ${doc.name}:`, error);
      return null;
    });
    
    // Wait for base64 to be ready
    const base64Data = await base64Promise;
    
    return {
      name: doc.name,
      size: doc.file.size,
      type: doc.file.type,
      previewUrl: base64Data, // Use base64 directly, no blob URL
      base64Promise: base64Promise, // Will resolve to base64 string
      storageUrl: null, // Will be added after background upload
      storagePath: null,
      // file: REMOVED - no File objects for IndexedDB compatibility
      _tempFile: doc.file // Temporary reference for upload, will be removed
    };
  }));
  
  // Add user message to chat immediately (with persistent attachment data)
  const userTimestamp = Date.now();
  const userMessage = {
    id: generateMessageId(),
    sender: 'user',
    text: text.trim(), // Keep empty if no text - no default message
    attachments: attachments, // Use new persistent base64 format
    timestamp: userTimestamp
  };
  
  // Add message and get current state
  let currentMessagesWithUser;
  setMessages(prev => {
    currentMessagesWithUser = [...prev, userMessage];
    return currentMessagesWithUser;
  });

  // 🔼 SCROLL TO THIS USER MESSAGE immediately after adding it (with documents, fixed large spacer)
  const newUserMessageIndex = currentMessagesWithUser.length - 1; // Index nové user zprávy
  
  scrollToUserMessageAt(virtuosoRef, newUserMessageIndex); // Scroll to the new user message

  // ❌ REMOVED: Upload queue for user files - now handled by background upload in InputBar

  // ❌ REMOVED: DOC-AUTO-SAVE - using unified auto-save system instead (every 10 messages)

  try {
    // Process documents for AI (base64 conversion happens in background)
    // We'll wait a bit for base64 to be ready, but not for storage upload
    
    // Wait for base64 conversions that were started during attachment creation
    const base64WaitPromises = attachments.map((att, index) => {
      if (att.base64Promise) {
        return att.base64Promise.then(base64Data => {
          // Update attachment with base64 for persistence
          setMessages(prev => prev.map(msg => 
            msg.timestamp === userTimestamp ? {
              ...msg,
              attachments: msg.attachments.map((a, i) => 
                i === index ? {...a, base64: base64Data} : a
              )
            } : msg
          ));
          return base64Data;
        });
      }
      return Promise.resolve(null);
    });
    
    // Wait for base64 conversions (quick operation)
    const base64Results = await Promise.all(base64WaitPromises);
    
    // 🚀 CATEGORIZE FILES FOR OPTIMIZED PROCESSING
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',  // Only .txt files supported for text
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/bmp',
      'image/tiff',
      'image/gif'
    ];
    
    const textFileTypes = [
      'text/plain'  // Only .txt files are supported by Gemini File API
    ];
    
    const imageFileTypes = [
      'image/png',
      'image/jpeg', 
      'image/jpg',
      'image/bmp',
      'image/tiff',
      'image/gif',
      'image/webp'
    ];
    
    // Categorize files for different processing approaches
    const textFiles = [];
    const imageFiles = [];
    const documentFiles = [];
    const preUploadedFiles = []; // 🚀 Files already uploaded via background upload
    
    safeDocuments.forEach((doc, index) => {
      if (!doc.file) return;
      
      // 🚀 CHECK IF ALREADY UPLOADED via background upload
      // Accept either Supabase-only (Claude) or full pipeline (Gemini)
      if (doc.supabaseUrl || doc.geminiFileUri) {
        preUploadedFiles.push({ doc, index });
        return; // Skip traditional processing
      }
      
      // Validate file format
      const isSupported = supportedTypes.includes(doc.file.type) || 
                          isFileExtensionSupported(doc.file.name);
      
      if (!isSupported) {
        throw new Error(`Unsupported format: ${doc.file.name}`);
      }
      
      // Categorize based on file type
      const isTextFile = textFileTypes.includes(doc.file.type) || 
                        doc.file.name.match(/\.(txt|md|json|csv|html|css|js|jsx|ts|tsx|xml|yml|yaml|log|conf|cfg|ini)$/i);
      
      const isImageFile = imageFileTypes.includes(doc.file.type) || 
                         doc.file.name.match(/\.(png|jpg|jpeg|bmp|tiff|tif|gif|webp)$/i);
      
      if (isTextFile) {
        textFiles.push({ doc, index });
      } else if (isImageFile) {
        imageFiles.push({ doc, index });
      } else {
        documentFiles.push({ doc, index });
      }
    });
    
    console.log(`📂 File categorization: ${preUploadedFiles.length} pre-uploaded, ${textFiles.length} text, ${imageFiles.length} images, ${documentFiles.length} documents`);
    
    // Process files by category for optimal performance
    const processedDocuments = [];
    
    // 🚀 PROCESS PRE-UPLOADED FILES (already have all URLs)
    for (const { doc, index } of preUploadedFiles) {
      console.log(`✅ [PRE-UPLOADED] Adding prepared file: ${doc.name}`);
      
      const preparedDoc = {
        id: Date.now() + Math.random(),
        name: doc.name,
        geminiFileUri: doc.geminiFileUri, // Already prepared
        gcsUri: doc.gcsUri,
        supabaseUrl: doc.supabaseUrl, // Already on Supabase
        processingMethod: 'background-upload-prepared',
        uploadedAt: new Date()
      };
      
      processedDocuments.push(preparedDoc);
      console.log(`✅ [PRE-UPLOADED] Ready for AI: ${doc.name}`);
    }
    
    // 1️⃣ PROCESS TEXT FILES VIA GCS (same as documents, but skip Document AI)
    for (const { doc, index } of textFiles) {
      console.log(`📝 [GCS] Uploading text file to GCS: ${doc.file.name}`);
      
      try {
        // Upload text file to GCS (same as documents)
        const uploadResult = await uploadDirectToGCS(doc.file);
        
        console.log('📝 Text file uploaded to GCS - sending to AI for analysis');
        
        // Upload to Gemini File API (same as documents, but skip Document AI processing)
        const geminiResponse = await fetch('/api/upload-to-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfUrl: uploadResult.gcsUri,
            originalName: uploadResult.originalName
          })
        });
        
        if (!geminiResponse.ok) {
          throw new Error('Failed to upload text file to Gemini');
        }
        
        const geminiResult = await geminiResponse.json();
        
        // Create text file document with Gemini URI (same structure as documents)
        const newDoc = {
          id: Date.now() + Math.random(),
          name: uploadResult.originalName,
          documentUrl: null, // Text files don't have document URL
          originalPdfUrl: uploadResult.gcsUri,
          geminiFileUri: geminiResult.fileUri, // Clean URI reference
          processingMethod: 'gcs-text-upload',
          metadata: {
            size: doc.file.size,
            type: doc.file.type,
            lastModified: doc.file.lastModified,
            gcsUri: uploadResult.gcsUri,
            publicUrl: uploadResult.publicUrl
          },
          uploadedAt: new Date()
        };
        
        processedDocuments.push(newDoc);
        console.log(`✅ [GCS] Text file processed with geminiFileUri: ${doc.file.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to process text file via GCS:`, error);
        throw new Error(`Failed to process text file: ${doc.file.name}`);
      }
    }
    
    // 2️⃣ PROCESS IMAGES IN PARALLEL (fastest approach)
    if (imageFiles.length > 0) {
      console.log(`🖼️ [PARALLEL] Processing ${imageFiles.length} images simultaneously`);
      
      const imagePromises = imageFiles.map(async ({ doc, index }) => {
        console.log(`🖼️ [IMAGE] Direct GCS upload for visual analysis: ${doc.file.name}`);
        
        try {
          // Upload directly to GCS (no /api/process-document needed for images)
          console.log(`🚀 Uploading ${doc.file.name} directly to GCS for AI analysis`);
          const uploadResult = await uploadDirectToGCS(doc.file);

          console.log(`🖼️ Image uploaded to GCS - sending to AI for visual analysis: ${doc.file.name}`);
          
          // Upload to Gemini for visual analysis using GCS URI
          const geminiResponse = await fetch('/api/upload-to-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfUrl: uploadResult.gcsUri, // Use GCS URI directly
              originalName: uploadResult.originalName
            })
          });
          
          if (!geminiResponse.ok) {
            throw new Error('Failed to process image for visual analysis');
          }
          
          const geminiResult = await geminiResponse.json();
          
          // Create document with Gemini URI for visual analysis
          const newDoc = {
            id: Date.now() + Math.random(),
            name: uploadResult.originalName,
            gcsUri: uploadResult.gcsUri,
            publicUrl: uploadResult.publicUrl,
            geminiFileUri: geminiResult.fileUri,
            uploadMethod: 'direct-gcs-image',
            processingMethod: 'image-visual-analysis-parallel',
            uploadedAt: new Date()
          };
          
          console.log(`✅ [PARALLEL] Image completed: ${doc.file.name}`);
          return newDoc;
          
        } catch (error) {
          console.error(`❌ Failed to process image via parallel GCS:`, error);
          throw new Error(`Failed to process image: ${doc.file.name}`);
        }
      });
      
      // Wait for all images to complete in parallel
      const imageResults = await Promise.all(imagePromises);
      processedDocuments.push(...imageResults);
      
      console.log(`✅ [PARALLEL] All ${imageFiles.length} images completed simultaneously`);
    }
    
    // 3️⃣ PROCESS DOCUMENTS SEQUENTIALLY (rate limits)  
    for (const { doc, index } of documentFiles) {
      console.log(`📄 [SEQUENTIAL] Processing document file: ${doc.file.name}`);
      
      // Decide upload method based on file size
      const useDirectUpload = shouldUseDirectUpload(doc.file);
      console.log(`🎯 Processing ${doc.file.name} via ${useDirectUpload ? 'DIRECT' : 'TRADITIONAL'} upload`);
      
      let result;
      
      if (useDirectUpload) {
        // 🚀 DIRECT UPLOAD TO GCS for large files
        const uploadResult = await uploadDirectToGCS(doc.file);
        result = await processGCSDocument(uploadResult.gcsUri, uploadResult.originalName);
        
        // Add GCS metadata to result
        result.gcsUri = uploadResult.gcsUri;
        result.publicUrl = uploadResult.publicUrl;
        
      } else {
        // 🔄 TRADITIONAL UPLOAD for smaller files
        const formData = new FormData();
        formData.append('file', doc.file);
        
        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Document processing failed');
        }
        
        result = await response.json();
      }
      
      console.log('📄 Document - uploading for AI analysis');
      
      // Upload to Gemini for document files
      const geminiResponse = await fetch('/api/upload-to-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl: result.originalPdfUrl || result.gcsUri,
          originalName: result.originalName
        })
      });
      
      if (!geminiResponse.ok) {
        throw new Error('Failed to process document');
      }
      
      const geminiResult = await geminiResponse.json();
      
      // Create document with Gemini URI for document files
      const newDoc = {
        id: Date.now() + Math.random(),
        name: result.originalName,
        documentUrl: result.documentUrl,
        originalPdfUrl: result.originalPdfUrl || result.gcsUri,
        geminiFileUri: geminiResult.fileUri,
        fileName: result.fileName,
        pageCount: result.pageCount,
        preview: result.preview,
        uploadMethod: useDirectUpload ? 'direct-gcs' : 'traditional',
        processingMethod: 'document-sequential',
        uploadedAt: new Date()
      };
      
      processedDocuments.push(newDoc);
      console.log(`✅ [SEQUENTIAL] Document completed: ${doc.file.name}`);
    }
    
    // Now send to AI with text and the processed documents
    if (text.trim() || processedDocuments.length > 0) {
      // Let Gemini auto-detect language from input
      
      // Use the cleaned messages if cleanup happened, otherwise use current
      const messagesWithUser = currentMessagesWithUser || [...currentMessages, userMessage];
      
      // Get current uploaded documents (including newly processed ones)
      const allDocuments = [...currentDocuments, ...processedDocuments];
      
      // Combine existing and new documents BEFORE sending to AI
      // Include both Gemini files (images/documents) AND text files (with extractedText)
      const newActiveDocuments = processedDocuments
        .map(doc => {
          if (doc.geminiFileUri) {
            // Images and documents with Gemini URI
            return {
              uri: doc.geminiFileUri,
              name: doc.name,
              uploadTimestamp: Date.now(),
              lastAccessedTimestamp: Date.now(),
              lastAccessedMessageIndex: messagesWithUser.length,
              type: 'gemini-file'
            };
          } else if (doc.extractedText) {
            // Text files with direct content
            return {
              name: doc.name,
              extractedText: doc.extractedText,
              uploadTimestamp: Date.now(),
              lastAccessedTimestamp: Date.now(),
              lastAccessedMessageIndex: messagesWithUser.length,
              type: 'text-content'
            };
          }
          return null;
        })
        .filter(doc => doc !== null);
      
      const allActiveDocuments = [...activeDocumentContexts, ...newActiveDocuments];
      
      // Apply same filtering logic as in handleSend
      let filteredActiveDocs = allActiveDocuments;
      
      // Update timestamps for mentioned documents
      filteredActiveDocs = filteredActiveDocs.map(doc => {
        if ((text || '').toLowerCase().includes(doc.name.toLowerCase())) {
          return { 
            ...doc, 
            lastAccessedTimestamp: Date.now(), 
            lastAccessedMessageIndex: messagesWithUser.length 
          };
        }
        return doc;
      });

      // Filter out old/irrelevant documents based on time and message count
      filteredActiveDocs = filteredActiveDocs.filter(doc => {
        const timeSinceUpload = Date.now() - doc.uploadTimestamp;
        const timeSinceLastAccess = Date.now() - doc.lastAccessedTimestamp;
        const messagesSinceUpload = messagesWithUser.length - doc.lastAccessedMessageIndex;
        const messagesSinceLastAccess = messagesWithUser.length - doc.lastAccessedMessageIndex;
        
        // Rule 1: Very recent upload (5 messages OR 10 minutes from upload)
        const isVeryRecentUpload = messagesSinceUpload <= 5 || timeSinceUpload < 10 * 60 * 1000;
        
        // Rule 2: Recently mentioned (7 messages OR 15 minutes since last access)
        const isRecentlyMentioned = messagesSinceLastAccess <= 7 || timeSinceLastAccess < 15 * 60 * 1000;
        
        // Rule 3: Explicit forget command
        const explicitlyForget = (text || '').toLowerCase().includes(`zapomeň na ${doc.name.toLowerCase()}`);
        if (explicitlyForget) {
          // showNotification(`Zapomínám na dokument "${doc.name}".`, 'info');
          return false;
        }
        
        return isVeryRecentUpload || isRecentlyMentioned;
      });

      // 📊 SUMMARY SYSTEM - Build smart context (same as normal chat)
      // Check if ANY summary exists in messages
      const hasSummary = messagesWithUser.some(msg => msg.hasMetadata && msg.metadata?.summaryContent);

      // Get context with summary separated for Claude system prompt injection
      const contextResult = hasSummary
        ? buildContextForElora(currentMessages, text)
        : { summary: null, messages: messagesWithUser };

      const { summary: conversationSummary, messages: contextMessages } = contextResult;

      console.log('🎯 [DOCS-CONTEXT] Using', hasSummary ? 'SMART CONTEXT' : 'FULL HISTORY');
      console.log('🎯 [DOCS-CONTEXT] Has summary:', hasSummary);
      console.log('🎯 [DOCS-CONTEXT] Summary length:', conversationSummary?.length || 0, 'chars');
      console.log('🎯 [DOCS-CONTEXT] Messages sent:', contextMessages.length);

      // Prepare messages for AI - ALWAYS add document context when documents are present
      const messagesForAI = contextMessages.map((msg, index) => {
        // Detect last user message by index instead of reference (fixes summary mode where buildContextForElora creates new message)
        const isLastUserMessage = msg.sender === 'user' && index === contextMessages.length - 1;

        if (isLastUserMessage && processedDocuments.length > 0) {
          // Separate text files (embed content) from other files (reference only)
          const textFiles = processedDocuments.filter(doc => doc.processingMethod === 'direct-text-extraction');
          const otherFiles = processedDocuments.filter(doc => doc.processingMethod !== 'direct-text-extraction');

          // Build document context
          let documentContext = '';

          // Add text file contents directly
          if (textFiles.length > 0) {
            documentContext += '\n\n--- TEXT FILE CONTENTS ---\n';
            textFiles.forEach(doc => {
              documentContext += `\n📝 ${doc.name}:\n`;
              documentContext += '```\n';
              documentContext += doc.extractedText || '[Empty file]';
              documentContext += '\n```\n';
            });
          }

          // Images/PDFs are sent as attachments via backend
          // Only text files need documentContext embedding above

          // Create separate texts: one for UI display, one for AI processing
          const displayText = text.trim();
          const aiText = text.trim()
            ? `${text.trim()}${documentContext}`  // User text + embedded text files
            : documentContext;  // Just embedded text files (or empty)

          console.log('   - Original text:', `"${text.trim()}"`);
          console.log('   - Text files:', textFiles.length);
          console.log('   - Other files:', otherFiles.length);
          console.log('   - Display text for user:', `"${displayText}"`);
          console.log('   - AI text with context:', `"${aiText}"`);

          return {
            ...msg,
            text: displayText,      // User sees clean message
            aiText: aiText,         // AI gets full context
            attachments: userMessage.attachments || []  // ✅ Copy attachments from original userMessage (critical for Claude with summary)
          };
        }
        return msg;
      });

      // Backend handles all file context (text blocks + attachments)
      // No hidden message needed

      // No streaming for document uploads - same as regular Gemini chat

      // 🚀 TRUE PROGRESSIVE STREAMING FOR DOCUMENTS - Same as normal streaming
      let geminiSourcesForDocs = [];
      let generatedImagesForDocs = [];  // ✅ Track generated/edited images
      let generatedPdfsForDocs = [];    // ✅ Track generated PDFs
      let generatedArtifactsForDocs = []; // ✅ Track generated HTML artifacts
      const pendingUploadsForDocs = []; // ✅ Track pending uploads (images/PDFs)
      const botMessageIdDocs = generateMessageId();
      const botTimestampDocs = Date.now() + 100; // +100ms to ensure bot comes after user

      // Progressive streaming variables for documents
      // Direct streaming variable (Anthropic best practice)
      let accumulatedTextDocs = ''; // Accumulated text for direct display
      
      // Add bot message with shimmer indicator immediately
      setMessages(prev => [...prev, {
        id: botMessageIdDocs,
        sender: 'bot',
        text: '',
        shimmerText: "Analyzing...",
        sources: [],
        isStreaming: true,
        timestamp: botTimestampDocs
      }]);

      const isClaude = model.startsWith('claude-');  // ✅ Detects both Haiku and Sonnet

      // Thinking tracking variables (for Deep Reasoning)
      let thinkingStartTimeDocs = null;

      // Web search tracking variables
      let searchJustCompletedDocs = false;
      let textLengthWhenSearchStartedDocs = -1;

      const result = await (isClaude ? claudeService : geminiService).sendMessage(
        messagesForAI,
        (chunk, extra = {}) => {
          // 🧠 Handle Deep Reasoning thinking chunks (Claude only)
          if (extra?.isThinking) {
            console.log('🧠 [DOCS] Deep Reasoning thinking chunk detected');

            // Check if search shimmer is active
            const currentMessage = messagesRef.current.find(msg => msg.id === botMessageIdDocs);
            if (currentMessage?.searchingWeb) {
              return; // Don't overwrite search shimmer
            }

            // First thinking chunk - set "Thinking..." and start timer
            if (!thinkingStartTimeDocs) {
              thinkingStartTimeDocs = Date.now();

              // Show "Thinking..." immediately
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageIdDocs
                    ? { ...msg, shimmerText: "Thinking..." }
                    : msg
                )
              );

              // After 2.5s, change to "Preparing answer..."
              setTimeout(() => {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageIdDocs && msg.shimmerText
                      ? { ...msg, shimmerText: "Preparing answer..." }
                      : msg
                  )
                );
              }, 2500);
            }

            return; // Don't process chunk (thinking has no text)
          }

          // 🛠️ Handle tool preparation (shows shimmer during tool latency)
          if (extra?.type === 'tool_preparing' && extra?.shimmerText) {
            console.log('🛠️ [DOCS] Tool preparing:', extra.shimmerText);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageIdDocs && msg.isStreaming
                  ? { ...msg, shimmerText: extra.shimmerText }
                  : msg
              )
            );

            // ✅ Two-stage system for fallback "Preparing tools..."
            if (extra.shimmerText === 'Preparing tools...') {
              setTimeout(() => {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === botMessageIdDocs && msg.shimmerText === 'Preparing tools...'
                      ? { ...msg, shimmerText: 'Executing task...' }
                      : msg
                  )
                );
              }, 2000);
            }

            return; // Don't process as text
          }

          // 🚀 DIRECT STREAMING: Append chunk immediately (Anthropic best practice)
          if (chunk) {
            // 🔍 Add spacing after search completion ONLY if text existed BEFORE search started
            if (searchJustCompletedDocs && textLengthWhenSearchStartedDocs > 0) {
              accumulatedTextDocs += '\n\n';
              searchJustCompletedDocs = false;
            }

            accumulatedTextDocs += chunk;

            // Update message with new text immediately
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageIdDocs
                  ? { ...msg, text: accumulatedTextDocs, shimmerText: undefined }
                  : msg
              )
            );
          }

          // Handle sources
          if (extra.sources && extra.sources.length > 0) {
            geminiSourcesForDocs = extra.sources;
            // 🔍 Set flag for spacing fix on next chunk
            searchJustCompletedDocs = true;
          }

          // ✅ Handle images (generate_image + edit_image tools)
          if (extra.images && extra.images.length > 0) {
            const startIndex = generatedImagesForDocs.length;
            const newImages = extra.images.map((img, i) => ({
              ...img,
              index: startIndex + i
            }));
            generatedImagesForDocs = [...generatedImagesForDocs, ...newImages];
            console.log('🎨 [DOCS] Images received:', newImages.length, '(total:', generatedImagesForDocs.length, ')');

            // Start upload immediately in parallel
            console.log(`🚀 [DOCS] Starting parallel upload for ${newImages.length} images...`);

            const uploadPromises = newImages.map(async (imageData) => {
              if (imageData.base64 && imageData.mimeType) {
                console.log(`🚀 [DOCS] Starting upload for image ${imageData.index + 1}/${generatedImagesForDocs.length}...`);

                try {
                  const imageTimestamp = Date.now();
                  const uploadResult = await uploadBase64ToSupabaseStorage(
                    imageData.base64,
                    `generated-${imageTimestamp}-${imageData.index}.png`,
                    'generated-images'
                  );

                  if (uploadResult && uploadResult.publicUrl) {
                    console.log(`✅ [DOCS] Image ${imageData.index + 1} upload completed`);
                    return {
                      storageUrl: uploadResult.publicUrl,
                      storagePath: uploadResult.path,
                      mimeType: imageData.mimeType,
                      timestamp: imageTimestamp,
                      index: imageData.index
                    };
                  }
                } catch (error) {
                  console.error(`💥 [DOCS] Image ${imageData.index + 1} upload failed:`, error);
                  return null;
                }
              }
              return null;
            });

            const imageUploadPromise = Promise.all(uploadPromises).then(uploadResults => {
              const successfulUploads = uploadResults.filter(result => result !== null);
              console.log(`✅ [DOCS] All uploads completed: ${successfulUploads.length}/${extra.images.length} successful`);

              // Hide generating indicator
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageIdDocs
                    ? { ...msg, generatingImages: false }
                    : msg
                )
              );

              // Replace base64 with URLs
              generatedImagesForDocs = generatedImagesForDocs.map(img => {
                const uploaded = successfulUploads.find(u => u.index === img.index);
                return uploaded || img;
              }).sort((a, b) => a.index - b.index);
              console.log(`✅ [DOCS] ${successfulUploads.length} images replaced with URLs`);

            }).catch(error => {
              console.error('💥 [DOCS] Parallel uploads failed:', error);
            });

            pendingUploadsForDocs.push(imageUploadPromise);

            // Display Promise
            const imageDisplayPromise = new Promise((resolve) => {
              const checkDisplay = setInterval(() => {
                const msg = messagesRef.current.find(m => m.id === botMessageIdDocs);
                if (msg?.image || msg?.images) {
                  clearInterval(checkDisplay);
                  console.log('✅ [DOCS] Images displayed in state');
                  resolve();
                }
              }, 50);
            });
            pendingUploadsForDocs.push(imageDisplayPromise);
          }

          // ✅ Handle PDF generation
          if (extra.pdf) {
            const pdfData = extra.pdf;
            const pdfTimestamp = Date.now();
            console.log('📄 [DOCS] PDF received:', pdfData.title);

            let processedBase64 = pdfData.base64;

            // Upload PDF
            console.log('🚀 [DOCS] Starting PDF upload...');
            const pdfUploadPromise = uploadBase64ToSupabaseStorage(
              processedBase64,
              `generated-${pdfTimestamp}-${pdfData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
              'generated-pdfs-temp'
            ).then(uploadResult => {
              console.log('✅ [DOCS] PDF uploaded, updating message');

              const uploadedPdfData = {
                title: pdfData.title,
                filename: pdfData.filename || `${pdfData.title}.pdf`,
                storageUrl: uploadResult.publicUrl,
                storagePath: uploadResult.path,
                timestamp: pdfTimestamp
              };

              generatedPdfsForDocs = [uploadedPdfData];

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageIdDocs
                    ? { ...msg, pdf: uploadedPdfData }
                    : msg
                )
              );

              console.log('✅ [DOCS] PDF ready');
            }).catch(error => {
              console.error('💥 [DOCS] PDF upload failed:', error);
            });

            pendingUploadsForDocs.push(pdfUploadPromise);
          }

          // Handle artifact creation (SAME AS PDF - upload from frontend!)
          if (extra.artifact) {
            const artifactData = extra.artifact;
            const artifactTimestamp = Date.now();

            console.log('🎨 [DOCS] Artifact received:', artifactData.title);

            // ✅ Backend sends base64 HTML (like PDF)
            let processedBase64 = artifactData.base64;

            // ✅ Upload FIRST, then assign with URL only
            console.log('🚀 [DOCS] Starting HTML upload...');
            const artifactUploadPromise = uploadBase64ToSupabaseStorage(
              processedBase64,
              artifactData.filename || `artifact-${artifactTimestamp}-${artifactData.title.replace(/[^a-z0-9]/gi, '_')}.html`,
              'attachments'
            ).then(uploadResult => {
              console.log('✅ [DOCS] HTML uploaded, updating message with URL');

              const uploadedArtifactData = {
                title: artifactData.title,
                filename: artifactData.filename,
                storageUrl: uploadResult.publicUrl,
                storagePath: uploadResult.path,
                timestamp: artifactTimestamp
              };

              generatedArtifactsForDocs = [uploadedArtifactData];

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageIdDocs
                    ? { ...msg, artifact: uploadedArtifactData }
                    : msg
                )
              );

              console.log('✅ [DOCS] Artifact ready');
            }).catch(error => {
              console.error('💥 [DOCS] Artifact upload failed:', error);
            });

            pendingUploadsForDocs.push(artifactUploadPromise);
          }

          // ✅ Handle function call events (for memory persistence)
          if (extra.functionCall) {
            console.log('🔧 [DOCS] Function call captured:', extra.functionCall.name);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageIdDocs
                  ? {
                      ...msg,
                      functionCall: extra.functionCall,
                      hasFunctionCall: true
                    }
                  : msg
              )
            );
          }

          // ✅ Handle function response events (for memory persistence)
          if (extra.functionResponse) {
            console.log('🔧 [DOCS] Function response captured:', extra.functionResponse.name);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageIdDocs
                  ? {
                      ...msg,
                      functionResponse: extra.functionResponse
                    }
                  : msg
              )
            );
          }

          // 🎯 STREAM COMPLETION LOGIC
          if (extra.completed) {
            // Hide loading indicators
            setLoading(false);
            setStreaming(false);

            console.log('🎯 [DOCS] Stream finished, accumulated text length:', accumulatedTextDocs.length, 'chars');

            // 🔄 ROLLBACK: Check if stream failed (empty content AND no tool outputs)
            if (accumulatedTextDocs === '' && pendingUploadsForDocs.length === 0) {
              console.error('❌ [DOCS] Stream failed - no content or tool outputs received, initiating rollback');

              // Remove both user and bot messages from state (don't save to DB)
              setMessages(prev => prev.slice(0, -2));

              // Restore original text to input bar
              setInput(originalUserText);

              // Show error notification
              showNotification('Something went wrong. Please try again.', 'error');
              return;
            } else if (accumulatedTextDocs === '') {
              // ✅ No text but we have tool outputs (PDF/images) - this is valid!
              console.log('✅ [DOCS] Stream complete with tool outputs only (no text)');
            }

            // Finalize message and show generating indicator if images expected
            const shouldShowGenerating = generatedImagesForDocs &&
                                        generatedImagesForDocs.length > 0 &&
                                        !generatedImagesForDocs.every(img => img.storageUrl);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageIdDocs
                  ? {
                      ...msg,
                      isStreaming: false,
                      shimmerText: undefined,
                      sources: geminiSourcesForDocs,
                      ...(shouldShowGenerating && {
                        generatingImages: true,
                        expectedImageCount: generatedImagesForDocs.length
                      })
                    }
                  : msg
              )
            );

            // Process images FIRST, then save to DB
            setTimeout(async () => {
              // Handle image display
              if (generatedImagesForDocs && generatedImagesForDocs.length > 0) {
                const allImagesHaveStorageUrl = generatedImagesForDocs.every(img => img.storageUrl);

                if (allImagesHaveStorageUrl) {
                  console.log(`✅ [DOCS] ${generatedImagesForDocs.length} images already uploaded, displaying...`);

                  setMessages(currentMessages => {
                    const lastMessage = currentMessages[currentMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'bot') {
                      const updatedMessage = {
                        ...lastMessage,
                        ...(generatedImagesForDocs.length === 1
                          ? { image: generatedImagesForDocs[0] }
                          : { images: generatedImagesForDocs }
                        )
                      };
                      console.log(`✅ [DOCS] ${generatedImagesForDocs.length} images displayed`);
                      return [...currentMessages.slice(0, -1), updatedMessage];
                    }
                    return currentMessages;
                  });
                }
              }

              // ✅ Wait for ALL pending uploads (images + PDFs) before saving
              if (pendingUploadsForDocs.length > 0) {
                console.log(`⏳ [DOCS] Waiting for ${pendingUploadsForDocs.length} pending uploads before saving...`);
                await Promise.all(pendingUploadsForDocs);
                console.log('✅ [DOCS] All pending uploads complete');
              }

              // Save to DB after all uploads complete
              const finalMessages = messagesRef.current;
              await checkAutoSave(finalMessages, activeChatId);
            }, 100);

            console.log('🎯 [DOCS] Direct streaming complete');
          }
        },
        () => {
          console.log('🔍 [DEBUG-DOCS] Web search callback triggered! Updating shimmer to "Searching the web..."');
          // 🔍 Snapshot text length BEFORE search starts (for spacing logic)
          textLengthWhenSearchStartedDocs = accumulatedTextDocs.length;
          console.log('🔍 [DEBUG-DOCS] Text length before search:', textLengthWhenSearchStartedDocs);

          // Update shimmer text to "Searching the web..."
          setMessages(prev =>
            prev.map(msg =>
              msg.id === botMessageIdDocs && msg.isStreaming
                ? { ...msg, searchingWeb: true, shimmerText: "Searching the web..." }
                : msg
            )
          );

          // After 2.5s, change to "Getting results..."
          searchShimmerTimeout.current = setTimeout(() => {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageIdDocs && msg.searchingWeb
                  ? { ...msg, shimmerText: "Getting results..." }
                  : msg
              )
            );
          }, 2500);
        },
        () => {
          console.log('🎨 [DEBUG-DOCS] Image generation callback triggered! Updating shimmer to "Being creative..."');
          // Update shimmer text to "Being creative..."
          setMessages(prev =>
            prev.map(msg =>
              msg.id === botMessageIdDocs && msg.isStreaming
                ? { ...msg, shimmerText: "Being creative..." }
                : msg
            )
          );
        },
        null, // No PDF generation callback needed
        // 🤖 MODEL-AWARE PARAMETERS (different signatures for Claude vs Gemini)
        isClaude
          ? null  // CLAUDE: artifact creation callback (6th param)
          : // GEMINI: documents array (6th param - no artifact callback)
            filteredActiveDocs.map(doc => {
              if (doc.type === 'gemini-file') {
                return { geminiFileUri: doc.uri, name: doc.name };
              } else if (doc.type === 'text-content') {
                return { name: doc.name, extractedText: doc.extractedText };
              }
              // Fallback for existing documents (without type)
              return { geminiFileUri: doc.uri, name: doc.name };
            }),
        isClaude
          ? []  // CLAUDE: empty documents array (7th param - gets from message.attachments)
          : false, // GEMINI: imageMode (7th param)
        isClaude
          ? false  // CLAUDE: imageMode (8th param)
          : false, // GEMINI: pdfMode (8th param)
        isClaude
          ? false  // CLAUDE: pdfMode (9th param)
          : conversationSummary, // GEMINI: summary (9th param)
        isClaude
          ? conversationSummary  // CLAUDE: summary (10th param)
          : deepReasoningEnabled, // GEMINI: deepReasoning (10th param - FINAL)
        isClaude
          ? deepReasoningEnabled  // CLAUDE: deepReasoning (11th param)
          : undefined, // GEMINI: no more params
        isClaude
          ? model  // CLAUDE: model selection (12th param - Haiku or Sonnet)
          : undefined // GEMINI: no model param
      );


      // Update uploadedDocuments state AFTER successful AI response
      if (processedDocuments.length > 0) {
        setUploadedDocuments(prev => [...prev, ...processedDocuments]);
      }
      
      // Update activeDocumentContexts with the filtered list
      setActiveDocumentContexts(filteredActiveDocs);
      
      // Messages already updated via streaming, no need to duplicate
      // COMMENTED OUT - This was causing flash effect for documents
      // const cleanedText = result.text;
      // const currentMessagesFromState = messagesRef.current;
      // const currentMessages = [...currentMessagesFromState, {
      //   id: generateMessageId(),
      //   sender: 'bot',
      //   text: cleanedText,
      //   timestamp: botTimestampDocs,
      //   sources: result.sources || [],
      //   isStreaming: false
      // }];
      // const cleanedMessages = await checkAutoSave(currentMessages, activeChatId);
      // setMessages(cleanedMessages);
      
      // ❌ REMOVED: Scroll limit activation
    }
    
  } catch (error) {
    console.error('Send with documents error:', error);
    
    // 🔄 ROLLBACK: ANY error should trigger rollback to prevent stuck span indicator
    // Remove the user and bot messages with span indicator from state
    setMessages(prev => {
      // Find and remove last 2 messages (user + bot with span indicator or streaming state)
      const lastBotMessage = prev[prev.length - 1];
      const needsRollback = lastBotMessage?.isStreaming ||
                           lastBotMessage?.text?.includes('chat-loading-dots') ||
                           lastBotMessage?.text?.includes('shimmer-skeleton') ||
                           lastBotMessage?.text?.includes('•') ||
                           lastBotMessage?.text === '';
      
      if (needsRollback) {
        console.log('🔄 [ROLLBACK-DOCS] Removing failed messages after error:', error.message);
        return prev.slice(0, -2);
      }
      return prev;
    });
    
    // Restore original text to input bar
    if (originalUserText) {
      setInput(originalUserText);
    }
    
    // Show user-friendly error message based on error type
    const errorLower = error.message?.toLowerCase() || '';
    const messages = getUploadErrorMessages(userLanguage);
    
    let errorMessage;
    if (errorLower.includes('fail') || errorLower.includes('network') || errorLower.includes('fetch') || !navigator.onLine) {
      errorMessage = 'Connection lost - please check your internet and try again';
    } else if (errorLower.includes('429') || errorLower.includes('too many')) {
      errorMessage = 'Too many requests - please wait a moment and try again';
    } else if (errorLower.includes('500') || errorLower.includes('503') || errorLower.includes('server')) {
      errorMessage = 'Server error - please try again in a few moments';
    } else if (errorLower.includes('quota') || errorLower.includes('limit')) {
      errorMessage = 'API limit reached - please try again later';
    } else if (errorLower.includes('timeout')) {
      errorMessage = 'Request timed out - please try again';
    } else if (errorLower.includes('document') || errorLower.includes('upload')) {
      errorMessage = messages.processing || 'Document processing error - please try again';
    } else {
      // Generic fallback for unknown errors
      errorMessage = 'Something went wrong - please try again';
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    setLoading(false);
    setStreaming(false);
    // Clear input after sending
    setInput('');
  }
}, [model, isImageMode, deepReasoningEnabled]);

// 🎯 MODEL CHANGE HANDLER - Optimized with useCallback
// handleModelChange removed - model selector removed

// 🔍 DEBUG: Detailní analýza dat pro Virtuoso

// 🔒 PREVENT DOCUMENT SCROLL - Keep at 0 when keyboard opens
useEffect(() => {
  const preventScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

    if (scrollTop > 0) {
      // iOS scrolled - reset immediately
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  // Listen on scroll event
  window.addEventListener('scroll', preventScroll, { passive: false });

  return () => {
    window.removeEventListener('scroll', preventScroll);
  };
}, []);

// 🎯 STYLE CONSTANTS - Prevent inline style object recreation that causes re-renders

// Style constants still needed in App.jsx (MessageItem styles now in component)
const {
  // Model dropdown styles removed - model selector removed
  mainContainerStyle,
  topHeaderStyle,
  hamburgerButtonStyle,
  newChatButtonStyle,
  // floatingHamburgerButtonStyle removed - using inline theme-aware styling now
  mainContentStyle,
  messagesContainerStyle,
  welcomeScreenStyle,
  welcomeTextContainerStyle,
  welcomeTitleStyle,
  welcomeSubtitleStyle,
  chatMessagesWrapperStyle,
  virtuosoFooterStyle,
  virtuosoInlineStyle
} = styles;



// 🎯 VIRTUOSO COMPONENTS - Header spacer + Footer
const virtuosoComponents = React.useMemo(() => ({
  Header: () => <div style={{ height: '65px' }} />, // Spacer so first message stops below overlay
  Footer: () => <div style={virtuosoFooterStyle} />,
  List: React.forwardRef((props, ref) => (
    <div {...props} ref={ref} style={{...props.style}} />
  ))
}), [virtuosoFooterStyle]);


// 🎨 JSX RENDER
  
  return (
    <>
      {/* 🎬 SPLASH SCREEN - PWA startup animation */}
      <SplashScreen
        isVisible={showSplashScreen}
        onComplete={() => {
          console.log('✅ Splash screen completed');
          setShowSplashScreen(false);
        }}
      />

      {/* 🔐 AUTH MODAL - zobrazí se po splash screenu když není přihlášený */}
      {!showSplashScreen && !user && !authLoading && (
        <AuthModal 
          onSuccess={handleAuthSuccess}
          onForgotPassword={(email) => {
            // Close auth modal and open reset password modal
            setResetPasswordEmail(email || '');
            setShowResetPasswordModal(true);
            console.log('Opening reset password modal for:', email || 'no email provided');
          }}
          uiLanguage={uiLanguage}
        />
      )}

      {/* 🔐 RESET PASSWORD MODAL */}
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setResetPasswordEmail('');
        }}
        user={user}
        initialEmail={resetPasswordEmail}
        uiLanguage={uiLanguage}
      />

      {/* 📋 TERMS CONSENT MODAL - BLOKUJÍCÍ, zobrazí se pokud user ještě nesouhlasil */}
      {user && showTermsConsent && (
        <TermsConsentModal
          isOpen={showTermsConsent}
          onAccept={handleTermsAccept}
          onDecline={handleTermsDecline}
          uiLanguage={uiLanguage}
          getTranslation={getTranslation}
        />
      )}

      {/* ✨ FLOATING HAMBURGER BUTTON - iOS 26 Liquid Glass style */}
      <button
        onClick={handleSidebarOpen}
        disabled={loading || streaming}
        style={{
          position: 'fixed',
          top: '6px',
          left: '16px',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          // iOS 26 Liquid Glass: highlight gradient + base layer
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%), rgba(253, 251, 247, 0.15)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%), rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: (loading || streaming) ? 'not-allowed' : 'pointer',
          opacity: (loading || streaming) ? 0.5 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          outline: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          if (!loading && !streaming) {
            e.target.style.opacity = '0.7';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !streaming) {
            e.target.style.opacity = '1';
          }
        }}
        title={t('chatHistory')}
      >
        <Menu
          size={20}
          strokeWidth={2}
          color={isLight ? '#000000' : '#ffffff'} // Theme-aware icon color
        />
      </button>

      {/* 🌫️ TOP DIM OVERLAY - mask-image fade for smooth transition */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '65px',
        background: isLight ? 'rgba(253, 251, 247, 0.40)' : 'rgba(0, 0, 0, 0.40)', // Solid color
        maskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 100%)', // Smooth fade
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 20%, transparent 100%)',
        backdropFilter: 'blur(1px)', // Subtle blur for smoothness
        WebkitBackdropFilter: 'blur(1px)',
        pointerEvents: 'none',
        zIndex: 999,
      }} />

      {/* 🎨 MAIN APP - Background container (no longer contains top bar) */}
      <div style={{
          ...mainContainerStyle,
          // 🔒 REMOVED minHeight: 100vh - was causing scrollable overflow when combined with paddingTop
          // mainContainerStyle already has flex: 1 to fill available space
          background: isListening
            ? (isDark
              ? '#000000' // Dark mode active - pure black
              : isLight
                ? '#FDFBF7' // Light-test mode - cream background
                : 'linear-gradient(135deg, #000428, #004e92, #009ffd, #00d4ff)') // Light mode active
            : (isDark
              ? '#000000' // Dark mode normal - pure black
              : isLight
                ? '#FDFBF7' // Light-test mode - cream background
                : 'linear-gradient(135deg, #000428, #004e92, #009ffd)'), // Light mode normal
          // ✅ MOVED: paddingTop and paddingBottom moved to chatMessagesWrapper
        }}>

      {/* 🎨 MAIN CONTENT AREA */}
      <main 
        ref={mainContentRef}
        style={mainContentStyle}
      >
        <div style={messagesContainerStyle}>
          
          {/* 🎨 WELCOME SCREEN - když nejsou zprávy */}
          {messages.length === 0 && (
            <div style={{
              ...welcomeScreenStyle,
              gap: isMobile ? '1.5rem' : '2rem'
            }}>
              
              
              {/* 🌍 MULTILINGUAL WELCOME TEXT */}
              <div style={welcomeTextContainerStyle}>
                <h1 className="text-shadow-lg shadow-white/30 drop-shadow-lg" style={{
                  ...welcomeTitleStyle,
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  color: isDark ? '#ffffff' : (isLight ? '#000000' : '#ffffff'),
                }}>
                  {getTimeBasedGreeting(uiLanguage)}
                </h1>

                <p className="text-shadow shadow-white/20 drop-shadow" style={{
                  ...welcomeSubtitleStyle,
                  fontSize: isMobile ? '1rem' : '1.2rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.8)' : (isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)'),
                }}>
                  {welcomeTexts[uiLanguage]?.subtitle || welcomeTexts.cs.subtitle}
                </p>
              </div>
            </div>
          )}


          {/* 💬 CHAT MESSAGES - WRAPPER */}
          <div style={{
            ...chatMessagesWrapperStyle,
            // Safe area only - Virtuoso Header provides 70px spacer for overlay
            paddingTop: 'env(safe-area-inset-top, 0px)',
            // paddingBottom removed - replaced by bottom overlay gradient
          }}>
            <Virtuoso
              ref={virtuosoRef}
              style={virtuosoInlineStyle}
              overscan={200}
              increaseViewportBy={{ top: 80, bottom: 40 }}
              defaultItemHeight={300}
              components={virtuosoComponents}
              computeItemKey={useCallback((index, item) => {
                // Use message UUID for better React reconciliation
                return item?.uuid || `fallback-${index}`;
              }, [])}
              // ❌ REMOVED: All scroll limit logic
            data={React.useMemo(() => {
              const filtered = messages.filter(msg => !msg.isHidden);

              // COMMENTED OUT - Using animate-pulse indicator in message text instead
              // if (loading || streaming) {
              //   return [...filtered, {
              //     id: 'loading-indicator',
              //     sender: 'bot',
              //     text: streaming ? 'Streaming...' : (isSearching ? t('searching') : t('thinking')),
              //     isLoading: true,
              //     isStreaming: streaming
              //   }];
              // }
              return filtered;
            }, [messages])}
            itemContent={useCallback((index, msg) => (
              <MessageItem
                msg={msg}
                index={index}
                isDark={isDark}
                isLight={isLight}
                onPreviewImage={(imageData) => openLightbox(imageData.url, imageData.name)}
                onDocumentView={setDocumentViewer}
                onPdfView={handlePdfView}
                onSourcesClick={handleSourcesClick}
                onAudioStateChange={setIsAudioPlaying}
                showSummary={showSummary}
              />
            ), [isDark, isLight, openLightbox, setDocumentViewer, handlePdfView, handleSourcesClick, setIsAudioPlaying, showSummary])} // Close itemContent function
            followOutput={false}
            rangeChanged={useCallback((range) => {
              // Hide button when user can see the last message
              if (range && messages.length > 0) {
                const isLastMessageVisible = range.endIndex >= (messages.length - 1);
                const shouldShow = !isLastMessageVisible;

                // ✅ Only call setState if value actually changed (prevents rerender on every scroll frame)
                if (prevScrollButtonState.current !== shouldShow) {
                  prevScrollButtonState.current = shouldShow;
                  setShowScrollToBottom(shouldShow);
                }
              }
            }, [messages.length, setShowScrollToBottom])}
          />
          </div>
          {/* End of Virtuoso wrapper with padding */}
          
          <div ref={endOfMessagesRef} />
        </div>
      </main>

      {/* 📝 INPUT BAR - Scroll button now inside InputBar */}
      <InputBar
        input={input}
        setInput={setInput}
        onSend={(text) => handleSend(text)}
        onSTT={toggleSTT}
        onVoiceScreen={handleVoiceScreenOpen}
        onImageGenerate={() => setIsImageMode(prev => !prev)}
        onToggleDeepReasoning={(enabled) => {
          setDeepReasoningEnabled(enabled);
          console.log(`💡 [DEEP-REASONING] State updated: ${enabled ? 'ON ⚡ (thinking enabled)' : 'OFF 🚀 (instant responses)'}`);
        }}
        onModelChange={handleModelChange}
        onDocumentUpload={handleDocumentUpload}
        onSendWithDocuments={handleSendWithDocuments}
        isLoading={loading || streaming}
        isRecording={isRecordingSTT}
        isAudioPlaying={isAudioPlaying}
        isImageMode={isImageMode}
        uiLanguage={uiLanguage}
        onPreviewImage={(imageData) => openSingleImageLightbox(imageData.url, imageData.name)}
        audioLevel={audioLevel}
        model={model}
        showScrollToBottom={showScrollToBottom} // ✅ Show scroll button when user scrolled up
        onScrollToBottom={() => scrollToBottom(virtuosoRef)} // ✅ Scroll to bottom callback
      />

      {/* 📋 CHAT SIDEBAR - NEW! */}
      <ChatSidebar
        isOpen={showChatSidebar}
        onClose={handleSidebarClose}
        onNewChatKeepSidebar={handleNewChatKeepSidebar}
        uiLanguage={uiLanguage}
        setUILanguage={setUILanguage}
        chatHistory={chatHistories}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        onPreviewImage={(imageData) => openSingleImageLightbox(imageData.url, imageData.name)}
        onOpenGalleryLightbox={openGalleryLightbox}
        onChatDeleted={(deletedChatId) => {
          // Remove deleted chat from current metadata without reloading all
          setChatHistories(prev => prev.filter(chat => chat.id !== deletedChatId));

          // 🚨 CRITICAL FIX: Clear messages state if we deleted current chat
          // This prevents async save operations from recreating deleted chat
          if (deletedChatId === currentChatId) {
            console.log('🗑️ Clearing messages state for deleted current chat:', deletedChatId);
            setMessages([]);
          }
        }}
        user={user}
        onSignOut={handleSignOut}
        onResetPassword={handleResetPassword}
        onDeleteAccount={handleDeleteAccount}
        currentModel={model}
        onModelChange={handleModelChange}
        onShowSummaryChange={(enabled) => {
          setShowSummary(enabled);
          console.log(`📊 [SHOW-SUMMARY] State updated: ${enabled ? 'ON' : 'OFF'}`);
        }}
      />

      {/* 🎤 VOICE SCREEN - UNCHANGED */}
      <VoiceScreen 
        isOpen={showVoiceScreen}
        onClose={handleVoiceScreenClose}
        onTranscript={handleTranscript}
        isLoading={loading}
        isAudioPlaying={isAudioPlaying || mobileAudioManager.isPlaying}
        uiLanguage={uiLanguage}
        messages={messages}
        audioManager={mobileAudioManager}
      />

      {/* 🔗 SOURCES MODAL - UNCHANGED */}
      <SourcesModal 
        isOpen={sourcesModalOpen}
        onClose={handleSourcesModalClose}
        sources={currentSources}
        language={uiLanguage}
      />

      {/* 🎨 STYLES - UNCHANGED + nové animace */}
      <style>{`
        * { box-sizing: border-box; }
        html {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          touch-action: pan-x pan-y !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          touch-action: pan-x !important;
        }
        #root {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          overflow: hidden !important;
        }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px) translateZ(0); } 100% { opacity: 1; transform: translateY(0) translateZ(0); } }
        @keyframes fadeIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes omnia-pulse { 0%, 100% { box-shadow: 0 0 15px rgba(100, 50, 255, 0.8); transform: scale(1) translateZ(0); } 50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.9); transform: scale(1.05) translateZ(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes omnia-listening { 0% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.6); } 50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.9); } 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.6); } }
        
        /* Hide scrollbar for attachment cards */
        .hide-scrollbar {
          scrollbar-width: none;           /* Firefox */
          -ms-overflow-style: none;        /* Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;                   /* Chrome/Safari */
        }
        
        /* User message markdown styles */
        .user-message-content .markdown-container {
          max-width: 100%;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .user-message-content .markdown-container strong {
          color: #60A5FA !important;
          font-weight: bold !important;
        }
        .user-message-content .markdown-container code {
          background-color: rgba(0, 0, 0, 0.2) !important;
          color: #93C5FD !important;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .user-message-content .markdown-container pre {
          background-color: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin: 0.5rem 0;
          overflow-x: auto;
          max-width: 100%;
        }
        .user-message-content .markdown-container pre code {
          background-color: transparent !important;
          color: #E5E7EB !important;
          padding: 0;
          white-space: pre;
          word-break: normal;
        }
        .user-message-content .markdown-container ul,
        .user-message-content .markdown-container ol {
          margin-left: 1rem !important;
          color: white !important;
        }
        
        * { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 768px) { input { font-size: 16px !important; } button { min-height: 44px; min-width: 44px; } }
        
        /* Dynamic Island & Notch Specific Optimizations */
        @supports (top: env(safe-area-inset-top)) {
          /* iPhone 14 Pro/15 Pro Dynamic Island */
          @media screen and (device-width: 393px) and (device-height: 852px) {
            .header-area { padding-top: max(1rem, env(safe-area-inset-top)); }
          }
          /* iPhone X/11/12/13 Notch */
          @media screen and (device-width: 375px) and (device-height: 812px) {
            .header-area { padding-top: max(1rem, env(safe-area-inset-top)); }
          }
          /* iPhone Plus models with notch */
          @media screen and (device-width: 414px) and (device-height: 896px) {
            .header-area { padding-top: max(1rem, env(safe-area-inset-top)); }
          }
        }
        
        /* Status bar theming for PWA */
        @media (display-mode: standalone) {
          body {
            background: ${isDark
              ? '#000000'
              : isElora
                ? 'linear-gradient(135deg, #000428, #004e92, #009ffd)'
                : '#FDFBF7'};
          }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(26, 32, 44, 0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(74, 85, 104, 0.8); border-radius: 4px; }
        button { -webkit-user-select: none; user-select: none; }
        input:focus { outline: none !important; }
      `}</style>
      
      {/* 🖼️ YARL LIGHTBOX - Modern image viewer with zoom, download & fullscreen */}
      <Lightbox
        open={lightboxState.open}
        close={closeLightbox}
        slides={lightboxState.slides.length > 0 ? lightboxState.slides : getAllImagesFromChat()}
        index={lightboxState.index}
        plugins={[Zoom, Download, Fullscreen]}
        zoom={{
          maxZoomPixelRatio: 3,      // Maximum 3x zoom
          zoomInMultiplier: 2,        // Zoom speed
          doubleTapDelay: 300,        // Double tap for zoom on mobile
          doubleClickDelay: 300,      // Double click for zoom on desktop
          scrollToZoom: true          // Mouse wheel zoom
        }}
      />
      
      {/* 📄 DOCUMENT VIEWER */}
      <DocumentViewer
        isOpen={documentViewer.isOpen}
        onClose={() => setDocumentViewer({ isOpen: false, document: null })}
        document={documentViewer.document}
        uiLanguage={uiLanguage}
      />

      {/* 📚 SECURE PDF VIEWER (react-pdf) */}
      <PdfViewer
        isOpen={pdfViewerData.isOpen}
        onClose={() => setPdfViewerData({ isOpen: false, url: null, title: null, filename: null })}
        pdfData={{
          url: pdfViewerData.url,
          title: pdfViewerData.title,
          filename: pdfViewerData.filename
        }}
      />
      
      {/* 📶 OFFLINE INDICATOR */}
      <OfflineIndicator
        isOnline={isOnline}
        connectionType={connectionType}
        connectionInfo={connectionInfo}
        uiLanguage={uiLanguage}
        position="top-left"
      />

      </div>
    </>
  );
};

export default App;