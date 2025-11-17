// 🚀 InputBar.jsx - PŘESNĚ PODLE UI.MD
// ✅ Textarea nahoře, 4 kulatá tlačítka dole
// ✅ Žádné experimenty, čistý jednoduchý kód

import React, { useState, useRef, useEffect } from 'react';
import { Plus, SlidersHorizontal, Mic, Send, AudioWaveform } from 'lucide-react';
import { getTranslation } from '../../utils/text';
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from '../../services/storage/supabaseStorage.js';
import { uploadDirectToGCS } from '../../services/directUpload.js';
import { generateImageUrls } from '../../utils/imageUrls.js';
import { useTheme } from '../../contexts/ThemeContext';
import AIControlsPopup from '../ui/AIControlsPopup';
import AttachmentPopup from './AttachmentPopup';

// Using Lucide React icons instead of custom SVG components

// 🔄 Helper: Detekce orientace (portrait/landscape)
const getOrientation = () => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

// 📱 Helper: Načtení saved keyboard heights z localStorage
const loadKeyboardHeights = () => {
  const saved = localStorage.getItem('keyboardHeights');
  return saved ? JSON.parse(saved) : { portrait: [], landscape: [] };
};

const InputBar = ({
  input,
  setInput,
  onSend,
  onSendWithDocuments, // NEW: Send text + documents
  onSTT,
  onVoiceScreen,
  onImageGenerate,
  onToggleDeepReasoning, // NEW: Callback for Deep Reasoning toggle
  onModelChange, // NEW: Callback for model change
  onDocumentUpload,
  isLoading,
  isRecording,
  isAudioPlaying,
  isImageMode = false,
  uiLanguage = 'cs',
  onPreviewImage,
  audioLevel = 0,
  model = 'gemini-2.5-flash', // 🤖 NEW: Current AI model
  showScrollToBottom = false, // ✅ Show scroll to bottom button
  onScrollToBottom // ✅ Callback to scroll to bottom
}) => {
  // THEME HOOK
  const { theme, isDark, isLight } = useTheme();

  // Icon color helper - Dark mode: white, Light-test: black, Light: white
  const getIconColor = () => {
    if (isDark) return 'rgba(255, 255, 255, 0.7)';
    if (isLight) return 'rgba(0, 0, 0, 0.7)';
    return 'rgba(255, 255, 255, 0.7)';
  };

  // LOCAL STATE FOR INPUT - Performance optimization
  const [localInput, setLocalInput] = useState('');
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0); // Store actual keyboard height
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const [showAIControls, setShowAIControls] = useState(false); // AI Controls popup state
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false); // Attachment popup state
  const [deepReasoning, setDeepReasoning] = useState(() => {
    // Load from localStorage, default: false (OFF)
    const saved = localStorage.getItem('deepReasoning');
    return saved === 'true';
  });
  const plusButtonRef = useRef(null);
  const aiControlsButtonRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingDocsRef = useRef(pendingDocuments); // 🔧 Ref for cleanup closure fix

  // 🔧 DURABLE KEYBOARD STATE: useRef persists across re-renders
  // 🍎 iOS 26 IAB (Input Accessory Bar): SOUČÁST celkové výšky!
  // visualViewport.height shrinks to accommodate keyboard + IAB
  // calculatedHeight = baselineInnerHeight - viewport.height = CELKOVÁ výška (403px)
  // InputBar bottom: 403px → clearuje keyboard I IAB dohromady

  // Best-guess defaults for cold start (prevents first-tap scroll)
  // PWA vs Browser detection (needs to be before savedKeyboardHeightRef)
  const isPWAStatic = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isTabletStatic = window.innerWidth >= 768;
  const isPortraitStatic = window.innerHeight > window.innerWidth;

  const DEFAULT_KEYBOARD_HEIGHT = isTabletStatic
    ? 337  // iPad: always 337
    : (isPWAStatic
        ? (isPortraitStatic ? 403 : null)  // iPhone PWA: portrait=403, landscape=změří se
        : (isPortraitStatic ? 337 : null)  // iPhone Browser: portrait=337, landscape=změří se
      );

  const savedKeyboardHeightRef = useRef(DEFAULT_KEYBOARD_HEIGHT); // Start with text keyboard
  const hasEverOpenedKeyboardRef = useRef(false); // Track if keyboard has been opened at least once
  const viewportDimensionsRef = useRef({ width: window.visualViewport?.width || 0, height: window.visualViewport?.height || 0 });
  const baselineHeightsRef = useRef({ portrait: null, landscape: null }); // 🔄 Baseline per orientation
  // Modern feature detection (2025) - podle Omnia doporučení
  const hasTouchScreen = navigator.maxTouchPoints > 0;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const needsVirtualKeyboard = hasTouchScreen && isCoarsePointer;

  // 🍎 Device & Context Detection
  // PWA vs Browser detection
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  // Tablet detection (iPad = 768px+)
  const isTablet = window.innerWidth >= 768;
  // iPhone detection for IAB (Input Accessory Bar) handling
  const isIPhone = /iPhone/.test(navigator.platform) || /iPhone/.test(navigator.userAgent);

  const t = getTranslation(uiLanguage);
  
  // Auto-resize textarea
  const autoResize = (textarea) => {
    if (!textarea) return;
    
    const minHeight = needsVirtualKeyboard ? 50 : 60;
    const maxHeight = 200;
    
    // If empty, reset to minHeight immediately
    if (!textarea.value.trim()) {
      textarea.style.height = minHeight + 'px';
      return;
    }
    
    // Reset height to get the correct scrollHeight
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    
    // Set height to content height, clamped between min and max
    const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
    textarea.style.height = newHeight + 'px';
  };
  
  // Audio-reactive listening placeholder with infinite animation
  const [dotCount, setDotCount] = useState(0);
  
  // Animate dots when recording
  React.useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setDotCount(prev => (prev + 1) % 4); // 0, 1, 2, 3, then repeat
      }, 500); // Change every 500ms
    } else {
      setDotCount(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const getListeningPlaceholder = () => {
    const baseDots = '.'.repeat(dotCount);
    
    // Audio-reactive: add extra dots based on volume
    let extraDots = '';
    if (audioLevel > 0.6) {
      extraDots = '•••';
    } else if (audioLevel > 0.3) {
      extraDots = '••';
    } else if (audioLevel > 0.1) {
      extraDots = '•';
    }
    
    return `${t('listening')}${baseDots}${extraDots}`;
  };
  
  // Synchronize with parent input prop (for STT/Voice compatibility)
  React.useEffect(() => {
    // Only sync if parent input is different and not empty
    // This handles STT/Voice setting the input from App.jsx
    if (input && input !== localInput) {
      console.log('📝 [InputBar] Syncing input from parent:', input);
      setLocalInput(input);
      // Auto-resize after setting new input
      setTimeout(() => {
        if (textareaRef.current) {
          autoResize(textareaRef.current);
        }
      }, 0);
    }
  }, [input]);

  // Auto-resize on mount and when localInput changes externally
  React.useEffect(() => {
    if (textareaRef.current && localInput) {
      autoResize(textareaRef.current);
    }
  }, [localInput]);

  // Desktop detection with resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Keyboard detection - Android VirtualKeyboard API + iOS Visual Viewport fallback
  useEffect(() => {
    if (!needsVirtualKeyboard) return;

    // 🔧 BASELINE: Now stored per orientation in baselineHeightsRef (portrait/landscape)
    // Initialized dynamically in handleViewportChange when needed

    // ✅ ANDROID - VirtualKeyboard API (Chrome 94+)
    if ('virtualKeyboard' in navigator) {
      // Opt-in to handle keyboard overlays manually
      navigator.virtualKeyboard.overlaysContent = true;

      const handleGeometryChange = () => {
        const { height } = navigator.virtualKeyboard.boundingRect;
        setKeyboardHeight(height);
        setIsKeyboardVisible(height > 0);
      };

      navigator.virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);

      return () => {
        navigator.virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange);
      };
    }

    // ✅ iOS - Visual Viewport API with iOS 17 delay workaround
    if (!window.visualViewport) return;

    let isClosing = false; // Flag to ignore viewport changes during keyboard dismiss
    let debounceTimer = null; // 🔧 DEBOUNCE: Wait for iOS to finish both phases (keyboard + accessory bar)
    // 🔧 savedKeyboardHeight moved to useRef (line 70) for durability across re-renders

    const handleViewportChange = () => {
      const viewport = window.visualViewport;

      // ✅ ONLY track keyboard when OUR textarea is focused
      if (document.activeElement !== textareaRef.current) {
        return;
      }

      // 🔄 Detekuj orientaci a zkontroluj localStorage
      const currentOrientation = getOrientation();
      const savedHeights = loadKeyboardHeights();

      // ✅ RESTORE: Pokud už MAM saved values → použij je místo měření!
      if (savedHeights[currentOrientation].length > 0) {
        const savedTextHeight = savedHeights[currentOrientation][0];
        savedKeyboardHeightRef.current = savedTextHeight;
        setIsKeyboardVisible(true);
        setKeyboardHeight(savedTextHeight);
        console.log(`📱 [RESTORED ${currentOrientation.toUpperCase()}]`, savedTextHeight, 'px from localStorage');
        return; // SKIP měření!
      }

      // ❌ Nemám saved values → ZMĚŘ:
      // Nastav baseline pro tuto orientaci (pokud ještě není)
      if (!baselineHeightsRef.current[currentOrientation]) {
        baselineHeightsRef.current[currentOrientation] = window.innerHeight;
        console.log(`📐 [BASELINE ${currentOrientation.toUpperCase()}]`, window.innerHeight, 'px');
      }

      const baselineInnerHeight = baselineHeightsRef.current[currentOrientation];
      const calculatedHeight = baselineInnerHeight - viewport.height;

      // ❌ IGNORE all viewport changes during keyboard dismiss (blur handles it)
      if (isClosing) {
        return;
      }

      // ✅ FOCUS CHECK: Only when keyboard is DISMISSING (height < 50px)
      // During OPEN (height >= 50), skip focus check to avoid race condition
      if (calculatedHeight < 50) {
        const textarea = document.querySelector('textarea[placeholder*="Chat"]');
        if (document.activeElement !== textarea) {
          // Keyboard closing and textarea not focused - safe to reset
          if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
          }

          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
          return;
        }
      }

      // 🔧 DEBOUNCE: Wait for iOS to finish rendering both keyboard + accessory bar
      // iOS renders in 2 phases: keyboard (335px) → accessory bar (+68px = 403px)
      // We wait 100ms for viewport to stabilize, then use final value
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        console.log('📏 [KEYBOARD] Calculated height:', calculatedHeight, 'px');

        // 🎯 INTELLIGENT KEYBOARD DETECTION - Learns from measurements
        // ❌ Blacklist: IAB transition artifacts (ignore these values)
        // ✅ Range check: 200-456px (portrait max emoji = 456px)
        // 💾 localStorage: Save measured values per orientation (portrait/landscape)
        // 🔄 Auto-detect: text vs emoji (53px difference)

        const IAB_TRANSITION_JUNK = [335, 368, 388, 420]; // iOS IAB rendering artifacts
        const orientation = getOrientation();
        const savedHeightsData = loadKeyboardHeights();

        if (calculatedHeight >= 200 && calculatedHeight <= 456) {
          if (!IAB_TRANSITION_JUNK.includes(calculatedHeight)) {
            // ✅ Valid height - ACCEPT and SAVE
            savedKeyboardHeightRef.current = calculatedHeight;
            hasEverOpenedKeyboardRef.current = true;

            // 💾 Save to localStorage (organized by orientation)
            if (!savedHeightsData[orientation].includes(calculatedHeight)) {
              savedHeightsData[orientation].push(calculatedHeight);
              savedHeightsData[orientation].sort((a, b) => a - b);
              localStorage.setItem('keyboardHeights', JSON.stringify(savedHeightsData));
              console.log(`💾 [SAVED ${orientation.toUpperCase()}]`, calculatedHeight, 'px', '→', savedHeightsData[orientation]);
            }

            console.log(`✅ [ACCEPTED ${orientation.toUpperCase()}]`, calculatedHeight, 'px');
          } else {
            // ⏭️ IGNORE IAB transition artifacts
            console.log('⏭️ [IGNORED] IAB transition:', calculatedHeight, '- keeping:', savedKeyboardHeightRef.current);
            return;
          }
        } else {
          // ⏭️ IGNORE out of range values
          console.log('⏭️ [IGNORED] Out of range:', calculatedHeight, '- keeping:', savedKeyboardHeightRef.current);
          return;
        }

        const isVisible = calculatedHeight > 30;

        setIsKeyboardVisible(isVisible);
        setKeyboardHeight(isVisible ? calculatedHeight : 0);

        debounceTimer = null;
      }, 100); // 100ms debounce - wait for iOS accessory bar to render
    };

    // 🔧 iOS 17 FIX: Instant focus handler (no 600ms wait for resize)
    const handleFocus = () => {
      // Use saved keyboard height immediately (bypass 600ms iOS 17 delay)
      if (savedKeyboardHeightRef.current > 30) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(savedKeyboardHeightRef.current);
      }
    };

    const handleBlur = () => {
      isClosing = true;

      // Reset UI state (but NOT savedKeyboardHeightRef!)
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      // 🔧 DURABLE STATE: savedKeyboardHeightRef stays intact for next focus

      // Reset flag after iOS keyboard dismiss animation completes (~500ms)
      setTimeout(() => {
        isClosing = false;
      }, 500);
    };

    // ✅ ORIENTATION CHANGE: Only reset if viewport dimensions actually changed
    const handleOrientationChange = () => {
      const newWidth = window.visualViewport?.width || 0;
      const newHeight = window.visualViewport?.height || 0;
      const oldDimensions = viewportDimensionsRef.current;

      if (newWidth !== oldDimensions.width || newHeight !== oldDimensions.height) {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        savedKeyboardHeightRef.current = 0; // Reset on actual rotation
        viewportDimensionsRef.current = { width: newWidth, height: newHeight };
      }
    };

    // ✅ APP GOES TO BACKGROUND: Reset keyboard state (iOS closes keyboard without blur event!)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 [BACKGROUND] App hidden - resetting InputBar to 0');

        // Force blur textarea
        if (textareaRef.current) {
          textareaRef.current.blur();
        }

        // Reset UI completely
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        isClosing = true; // Prevent viewport changes during background

        // Reset closing flag after delay
        setTimeout(() => {
          isClosing = false;
        }, 500);
      }
    };

    // ✅ iOS SPECIFIC: pagehide event (more reliable on iOS than visibilitychange)
    const handlePageHide = () => {
      console.log('📱 [PAGEHIDE] App minimized - resetting InputBar to 0');

      // Force blur textarea
      if (textareaRef.current) {
        textareaRef.current.blur();
      }

      // Reset UI completely
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    // Use textareaRef to ensure we only track THIS InputBar's textarea
    const textarea = textareaRef.current;
    if (!textarea) {
      console.warn('📱 [KEYBOARD-iOS] Textarea ref not ready yet');
      return;
    }

    // Add all listeners including iOS 17 instant focus handler
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('visibilitychange', handleVisibilityChange); // 🔧 App background
    window.addEventListener('pagehide', handlePageHide); // 🔧 iOS specific
    textarea.addEventListener('focus', handleFocus); // 🔧 iOS 17 FIX: Instant response
    textarea.addEventListener('blur', handleBlur);

    console.log('✅ [SETUP] iOS keyboard detection with iOS 17 workaround + background listeners active');

    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('blur', handleBlur);
    };
  }, [needsVirtualKeyboard]);

  // 🚫 CHECK IF ALL UPLOADS ARE COMPLETED
  const allUploadsCompleted = pendingDocuments.every(doc => doc.uploadStatus === 'completed');
  const canSend = (localInput.trim() || pendingDocuments.length > 0) && allUploadsCompleted;
  
  const handleSendMessage = () => {
    // Don't send if uploads are still pending
    if (pendingDocuments.length > 0 && !allUploadsCompleted) {
      console.log('⏳ Cannot send - uploads still pending');
      return;
    }

    if (pendingDocuments.length > 0) {
      // Send with documents (only if all uploads completed)
      if (onSendWithDocuments) {
        onSendWithDocuments(localInput, pendingDocuments);

        // 🧹 FIX MEMORY LEAK: Revoke all blob URLs before clearing chips
        pendingDocuments.forEach(doc => {
          const blobUrl = previewUrlsRef.current.get(doc.id);
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            previewUrlsRef.current.delete(doc.id);
          }
        });

        setPendingDocuments([]); // Clear chips after sending
        setLocalInput(''); // Clear local input

        // 🔧 iOS FIX: Close keyboard after sending (for scroll to work!)
        if (textareaRef.current) {
          textareaRef.current.blur();
          console.log('⌨️ [SEND] Keyboard closed after message sent');
        }

        // Reset textarea size after sending
        setTimeout(() => {
          if (textareaRef.current) {
            autoResize(textareaRef.current);
          }
        }, 0);
      }
    } else if (localInput.trim() && onSend) {
      // Regular text-only send - pass the text up
      onSend(localInput);
      setLocalInput(''); // Clear local input after sending

      // 🔧 iOS FIX: Close keyboard after sending (for scroll to work!)
      if (textareaRef.current) {
        textareaRef.current.blur();
        console.log('⌨️ [SEND] Keyboard closed after message sent');
      }

      // Reset textarea size after sending
      setTimeout(() => {
        if (textareaRef.current) {
          autoResize(textareaRef.current);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (!needsVirtualKeyboard && e.key === 'Enter' && !e.shiftKey && !isLoading && canSend) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Deep Reasoning toggle handler
  const handleToggleDeepReasoning = () => {
    const newValue = !deepReasoning;
    setDeepReasoning(newValue);
    localStorage.setItem('deepReasoning', newValue.toString());
    console.log(`💡 [DEEP-REASONING] Toggled to: ${newValue ? 'ON' : 'OFF'}`);

    // Notify App.jsx of the change
    if (onToggleDeepReasoning) {
      onToggleDeepReasoning(newValue);
    }
  };

  // Handle document upload to chips ONLY
  const handleDocumentUploadToChips = (event) => {
    const files = Array.from(event.target.files || []);

    // 🔥 FIX: BATCH setState instead of loop setState to prevent UI freeze!
    const baseTimestamp = Date.now();
    const newChips = files.map((file, index) => {
      // Format file size properly
      let formattedSize = 'Unknown size';
      if (file.size !== undefined && file.size !== null && typeof file.size === 'number' && !isNaN(file.size)) {
        const sizeInBytes = file.size;

        if (sizeInBytes < 1024) {
          formattedSize = `${sizeInBytes}B`;
        } else if (sizeInBytes < 1024 * 1024) {
          formattedSize = `${(sizeInBytes / 1024).toFixed(1)}KB`;
        } else {
          formattedSize = `${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB`;
        }
      }

      // Enhanced chip structure for background upload
      return {
        id: baseTimestamp + index, // Unique ID for each file
        name: file.name,
        size: formattedSize,
        file: file, // Store file for later upload
        uploadStatus: 'pending', // 'pending' | 'uploading' | 'completed' | 'error'
        supabaseUrl: null,
        supabasePath: null, // Pro cleanup
        geminiFileUri: null,
        gcsUri: null
      };
    });

    // 🎨 CREATE PREVIEW URLs FIRST (before setState, so they're ready when chips render!)
    newChips.forEach(chip => {
      const url = URL.createObjectURL(chip.file);
      previewUrlsRef.current.set(chip.id, url);
    });

    // ✅ SINGLE setState for ALL files (NOW preview URLs are ready!)
    setPendingDocuments(prev => [...prev, ...newChips]);

    // 🚀 START TWO-PHASE UPLOADS after React renders chips
    // Phase 1: All storage uploads parallel → Phase 2: All API calls parallel
    setTimeout(() => {
      uploadInPhases(newChips);
    }, 0);

    // Clear the file input for next time
    event.target.value = '';
  };

  // 🚀 TWO-PHASE UPLOAD - All storage uploads first, then all API calls
  const uploadInPhases = async (chips) => {
    console.log(`🚀 [PHASE-UPLOAD] Starting two-phase upload for ${chips.length} files (Model: ${model})`);

    // Mark all as uploading
    setPendingDocuments(prev => prev.map(doc => {
      const chip = chips.find(c => c.id === doc.id);
      return chip ? { ...doc, uploadStatus: 'uploading' } : doc;
    }));

    // PHASE 1: All storage uploads (Supabase + GCS) in parallel
    console.log(`📤 [PHASE 1] Starting all storage uploads...`);
    const storageResults = await Promise.allSettled(
      chips.map(async (chip) => {
        try {
          // Supabase upload (always needed)
          const supabaseResult = await uploadToSupabaseStorage(chip.file, 'attachments');
          console.log(`✅ [PHASE 1] Supabase completed for: ${chip.name}`);

          // GCS upload (only for Gemini)
          let gcsResult = null;
          if (model.startsWith('gemini-')) {
            gcsResult = await uploadDirectToGCS(chip.file);
            console.log(`✅ [PHASE 1] GCS completed for: ${chip.name}`);
          }

          return {
            chipId: chip.id,
            chipName: chip.name,
            file: chip.file,
            supabaseResult,
            gcsResult
          };
        } catch (error) {
          console.error(`❌ [PHASE 1] Storage upload failed for ${chip.name}:`, error);
          throw error;
        }
      })
    );

    console.log(`✅ [PHASE 1] All storage uploads completed`);

    // PHASE 2: All API calls (Claude/Gemini Files API) in parallel
    console.log(`📤 [PHASE 2] Starting all API calls...`);
    const apiResults = await Promise.allSettled(
      storageResults.map(async (result, index) => {
        if (result.status === 'rejected') {
          // Skip failed storage uploads
          const chip = chips[index];
          setPendingDocuments(prev => prev.map(doc =>
            doc.id === chip.id ? { ...doc, uploadStatus: 'error' } : doc
          ));
          return null;
        }

        const { chipId, chipName, file, supabaseResult, gcsResult } = result.value;

        try {
          if (model.startsWith('claude-')) {
            // Claude Files API call
            const claudeResponse = await fetch('/api/upload-claude-via-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                supabaseUrl: supabaseResult.publicUrl,
                fileName: file.name,
                mimeType: file.type
              })
            });

            if (!claudeResponse.ok) {
              throw new Error('Claude Files API upload failed');
            }

            const claudeData = await claudeResponse.json();
            console.log(`✅ [PHASE 2] Claude API completed for: ${chipName}`);

            // Generate optimized URLs for images
            const isImage = file.type.startsWith('image/');
            const imageUrls = isImage
              ? generateImageUrls(supabaseResult.publicUrl)
              : { storageUrl: supabaseResult.publicUrl, thumbnailUrl: null, previewUrl: null };

            // Update with file_id + image URLs
            setPendingDocuments(prev => prev.map(doc =>
              doc.id === chipId ? {
                ...doc,
                uploadStatus: 'completed',
                supabaseUrl: supabaseResult.publicUrl,
                supabasePath: supabaseResult.path,
                storageUrl: imageUrls.storageUrl,
                thumbnailUrl: imageUrls.thumbnailUrl,
                previewUrl: imageUrls.previewUrl,
                claudeFileId: claudeData.fileId,
                modelType: 'claude'
              } : doc
            ));

          } else {
            // Gemini Files API call
            const geminiResponse = await fetch('/api/upload-to-gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pdfUrl: gcsResult.gcsUri,
                originalName: gcsResult.originalName
              })
            });

            if (!geminiResponse.ok) {
              throw new Error('Gemini upload failed');
            }

            const geminiData = await geminiResponse.json();
            console.log(`✅ [PHASE 2] Gemini API completed for: ${chipName}`);

            // Generate optimized URLs for images
            const isImage = file.type.startsWith('image/');
            const imageUrls = isImage
              ? generateImageUrls(supabaseResult.publicUrl)
              : { storageUrl: supabaseResult.publicUrl, thumbnailUrl: null, previewUrl: null };

            // Update with file URI + image URLs
            setPendingDocuments(prev => prev.map(doc =>
              doc.id === chipId ? {
                ...doc,
                uploadStatus: 'completed',
                supabaseUrl: supabaseResult.publicUrl,
                supabasePath: supabaseResult.path,
                storageUrl: imageUrls.storageUrl,
                thumbnailUrl: imageUrls.thumbnailUrl,
                previewUrl: imageUrls.previewUrl,
                gcsUri: gcsResult.gcsUri,
                geminiFileUri: geminiData.fileUri,
                modelType: 'gemini'
              } : doc
            ));
          }

        } catch (error) {
          console.error(`❌ [PHASE 2] API call failed for ${chipName}:`, error);
          setPendingDocuments(prev => prev.map(doc =>
            doc.id === chipId ? { ...doc, uploadStatus: 'error' } : doc
          ));
        }
      })
    );

    console.log(`✅ [PHASE 2] All API calls completed`);
    console.log(`🎉 [PHASE-UPLOAD] Two-phase upload finished for ${chips.length} files`);
  };

  // 🗑️ CLEANUP FUNCTION - Remove document and cleanup cloud files
  const handleRemoveDocument = async (docId) => {
    const docToRemove = pendingDocuments.find(doc => doc.id === docId);

    if (!docToRemove) return;

    console.log(`🗑️ [CLEANUP] Removing document: ${docToRemove.name}`);

    // Cleanup preview URL from Ref
    const previewUrl = previewUrlsRef.current.get(docId);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrlsRef.current.delete(docId);
    }

    // Remove from UI first for immediate feedback
    setPendingDocuments(prev => prev.filter(d => d.id !== docId));

    // Cleanup cloud files in background
    try {
      // Cleanup Supabase Storage
      if (docToRemove.supabasePath) {
        console.log(`🗑️ [CLEANUP] Deleting from Supabase: ${docToRemove.supabasePath}`);
        await deleteFromSupabaseStorage(docToRemove.supabasePath, 'attachments');
      }

      // Cleanup Claude Files API (prevents 100GB limit)
      if (docToRemove.claudeFileId) {
        console.log(`🗑️ [CLEANUP] Deleting from Claude Files API: ${docToRemove.claudeFileId}`);
        try {
          const response = await fetch('/api/delete-claude-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: docToRemove.claudeFileId })
          });

          if (response.ok) {
            console.log(`✅ [CLEANUP] Claude file deleted: ${docToRemove.claudeFileId}`);
          } else {
            console.warn(`⚠️ [CLEANUP] Claude file delete failed (may already be deleted)`);
          }
        } catch (err) {
          console.error(`❌ [CLEANUP] Claude file delete error:`, err);
        }
      }

      // TODO: Add GCS cleanup if there's a delete API
      // TODO: Add Gemini file cleanup if there's a delete API

      console.log(`✅ [CLEANUP] Successfully cleaned up: ${docToRemove.name}`);
    } catch (error) {
      console.error(`❌ [CLEANUP] Failed to cleanup cloud files for: ${docToRemove.name}`, error);
      // Don't show error to user - file is already removed from UI
    }
  };

  // 🔧 UPDATE REF - Keep ref in sync with state (fixes stale closure bug)
  React.useEffect(() => {
    pendingDocsRef.current = pendingDocuments;
  }, [pendingDocuments]);

  // 🚮 CLEANUP ON UNMOUNT - Remove unused files from cloud
  React.useEffect(() => {
    return () => {
      // ✅ FIX: Read from ref (not stale closure) to get ACTUAL pending docs
      console.log('🔍 [UNMOUNT-CLEANUP] Checking pending docs:', pendingDocsRef.current);
      pendingDocsRef.current.forEach(doc => {
        if (doc.uploadStatus === 'completed') {
          console.log(`🚮 [UNMOUNT-CLEANUP] Cleaning up unsent file: ${doc.name}`);
          handleRemoveDocument(doc.id);
        }
      });
    };
  }, []); // Empty dependency = cleanup on unmount only, but reads fresh ref!

  // UNIFIED BUTTON STYLE - KULATÉ PODLE UI.MD
  const buttonSize = needsVirtualKeyboard ? 36 : 44;
  const iconSize = needsVirtualKeyboard ? 20 : 24;

  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  // 🚀 PERFORMANCE: Store preview URLs in Ref (created once per file, not on every render)
  const previewUrlsRef = useRef(new Map());

  // 🧹 CLEANUP: Revoke all URLs on component unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  return (
    <>
      {/* HLAVNÍ KONTEJNER */}
      <div
        className="input-bar-container"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const fakeEvent = { target: { files } };
            handleDocumentUploadToChips(fakeEvent);
          }
        }}
        style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : 'translateY(0)',
        background: 'transparent', // Transparent - let body background show through padding
        willChange: 'transform', // GPU acceleration for transform
        // NO transition - instant lift to prevent text jumping into chat area
        padding: needsVirtualKeyboard ? '0.5rem' :
          (window.innerWidth <= 1200 ? '0.5rem' : '1.5rem'), // Tablet: 0.5rem, Desktop: 1.5rem
        paddingBottom: window.innerWidth <= 768
          ? (needsVirtualKeyboard ? (keyboardHeight > 0 ? '0.5rem' : '1rem') : '1rem') // Mobile logic - use keyboardHeight instead of isKeyboardVisible
          : window.innerWidth <= 1200
          ? (needsVirtualKeyboard ? (keyboardHeight > 0 ? '0.5rem' : '1.5rem') : '1.5rem') // Tablet logic - use keyboardHeight instead of isKeyboardVisible
          : '1.8rem', // Desktop: 1.8rem
        zIndex: 10, // Above chat area, below pop-ups
      }}>

        {/* 🌫️ BOTTOM BLUR WRAPPER - Blurs text in keyboard gaps, moves with InputBar */}
        <div style={{
          position: 'absolute',
          top: 'calc(100% - 20px)', // Starts 20px from bottom of InputBar (covers all gaps)
          left: 0,
          right: 0,
          height: '200px', // Extends 200px down
          backdropFilter: 'blur(2px)', // Very subtle blur - text visible but muted
          WebkitBackdropFilter: 'blur(2px)',
          pointerEvents: 'none',
          zIndex: -1, // Behind InputBar content
        }} />

        {/* 🔽 SCROLL TO BOTTOM BUTTON - Above InputBar */}
        {showScrollToBottom && onScrollToBottom && (
          <button
            onClick={onScrollToBottom}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 20px)', // ✅ 20px above wrapper (outside Virtuoso padding)
              left: '50%',
              transform: 'translateX(-50%) translateZ(0)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: isDark
                ? 'rgba(255, 255, 255, 0.06)' // Průhledná bílá
                : isLight
                  ? '#FDFBF7' // ✅ Cream barva jako light mode
                  : 'rgba(255, 255, 255, 0.06)', // Omnia mode - průhledná bílá
              backdropFilter: isLight ? 'blur(5px)' : 'blur(20px)', // ✅ Minimální blur pro light mode
              WebkitBackdropFilter: isLight ? 'blur(5px)' : 'blur(20px)',
              boxShadow: isLight
                ? '0 4px 15px rgba(0, 0, 0, 0.15)' // Lighter shadow for light mode
                : '0 8px 25px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 12, // Above InputBar (10)
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (isLight) {
                e.currentTarget.style.background = '#F5F3EF'; // ✅ Mírně tmavší cream
              } else {
                e.currentTarget.style.background = 'rgba(96, 165, 250, 0.15)';
              }
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.1) translateZ(0)';
            }}
            onMouseLeave={(e) => {
              if (isLight) {
                e.currentTarget.style.background = '#FDFBF7'; // ✅ Zpět na cream
              } else {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }
              e.currentTarget.style.transform = 'translateX(-50%) scale(1) translateZ(0)';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isLight ? '#000000' : 'rgba(255, 255, 255, 0.8)'} // ✅ Černé šipky v light mode
              strokeWidth="2"
            >
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </button>
        )}

        <div style={{
          maxWidth: window.innerWidth <= 768 ? '100%'
            : window.innerWidth <= 1200 ? '80%' // Tablet: 80% width
            : '900px', // Desktop: keep 900px
          margin: '0 auto',
        }}>
          
          {/* GLASS CONTAINER */}
          <div style={{
            background: isDark
              ? 'rgba(0, 0, 0, 0.6)' // Dark mode: black glass
              : 'rgba(255, 255, 255, 0.15)', // Light mode: subtle white glass (more visible)
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.15)' // Dark mode: slightly brighter border
              : '1px solid rgba(255, 255, 255, 0.08)', // Light mode: current border
            boxShadow: isDark
              ? '0 12px 40px rgba(0, 0, 0, 0.8)' // Dark mode: deeper shadow
              : '0 12px 40px rgba(0, 0, 0, 0.4)', // Light mode: current shadow
            paddingTop: '0.8rem', // ✅ Reduced - less space above textarea
            paddingBottom: '0.3rem', // ✅ Reduced - less space below buttons
            paddingLeft: '1rem',
            paddingRight: '1rem',
          }}>
            
            {/* DOCUMENT PREVIEW CARDS */}
            {pendingDocuments.length > 0 && (
              <div className="hide-scrollbar" style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '12px',
                overflowX: 'auto',
                overflowY: 'hidden',
                marginBottom: '0.5rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                {pendingDocuments.map((doc) => {
                  const isImage = doc.file && doc.file.type.startsWith('image/');
                  const fileExtension = doc.name.split('.').pop()?.toUpperCase() || 'FILE';
                  
                  let longPressTimer = null;
                  
                  const handleTouchStart = () => {
                    longPressTimer = setTimeout(() => {
                      // Show custom fullscreen preview instead of iframe
                      if (isImage) {
                        const cachedUrl = previewUrlsRef.current.get(doc.id);
                        if (cachedUrl) {
                          onPreviewImage({
                            url: cachedUrl,
                            name: doc.name
                          });
                        }
                      }
                    }, 500);
                  };
                  
                  const handleTouchEnd = () => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      longPressTimer = null;
                    }
                  };
                  
                  return (
                    <div
                      key={doc.id}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={handleTouchStart}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                      style={{
                        position: 'relative',
                        width: '100px',
                        height: '100px',
                        flexShrink: 0,
                        // 🎨 SIMPLE BACKGROUND - no complex gradients
                        background: doc.uploadStatus === 'error'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : isLight
                            ? 'rgba(255, 107, 53, 0.15)'
                            : 'rgba(255, 255, 255, 0.1)',
                        border: doc.uploadStatus === 'error'
                          ? '2px solid #ef4444'
                          : isDark
                            ? '1px solid rgba(255, 255, 255, 0.15)'
                            : isLight
                              ? '1px solid rgba(255, 107, 53, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        // Simple opacity based on upload status
                        opacity: doc.uploadStatus === 'error' ? 0.7
                          : doc.uploadStatus === 'uploading' ? 0.6
                          : 1.0,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      {/* X Button */}
                      <button
                        onClick={() => handleRemoveDocument(doc.id)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          width: '18px',
                          height: '18px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          zIndex: 1,
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 4L4 12M4 4L12 12"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {/* Spinner for uploading state */}
                      {doc.uploadStatus === 'uploading' && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '24px',
                          height: '24px',
                          border: '3px solid rgba(255, 255, 255, 0.2)',
                          borderTop: isLight ? '3px solid rgba(255, 107, 53, 0.8)' : '3px solid rgba(59, 130, 246, 0.8)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          zIndex: 2,
                        }} />
                      )}

                      {isImage ? (
                        /* Image thumbnail - use ONLY blob URL in InputBar */
                        <img
                          src={previewUrlsRef.current.get(doc.id)}
                          alt={doc.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        /* Document preview */
                        <>
                          <div style={{
                            color: isLight ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            fontSize: '12px',
                            textAlign: 'center',
                            padding: '8px',
                            wordBreak: 'break-word',
                            lineHeight: '1.2',
                            maxHeight: '60%',
                            overflow: 'hidden',
                          }}>
                            {doc.name}
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                          }}>
                            {fileExtension}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* TEXTAREA NAHOŘE */}
            <style>{`
              .omnia-chat-input::placeholder {
                color: ${isRecording ? '#ff4444' : (isDark ? 'rgba(255, 255, 255, 0.6)' : (isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'))};
                opacity: 1;
              }

              /* Spinner animation for uploading files */
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <textarea
              className="omnia-chat-input"
              ref={textareaRef}
              value={localInput}
              onChange={(e) => {
                setLocalInput(e.target.value);
                autoResize(e.target);
              }}
              onMouseDown={needsVirtualKeyboard ? (e) => {
                // 🔧 CONDITIONAL PRE-LIFT: Only after keyboard has been opened at least once
                // First open (app start): Skip pre-lift, let iOS measure actual device keyboard height
                // Second+ open: Use pre-lift with measured height, Safari won't scroll body (no jump!)
                if (hasEverOpenedKeyboardRef.current && savedKeyboardHeightRef.current > 0) {
                  console.log('👆 [PRE-LIFT] Second+ open - using saved height:', savedKeyboardHeightRef.current);
                  setIsKeyboardVisible(true);
                  setKeyboardHeight(savedKeyboardHeightRef.current);
                } else {
                  console.log('⏭️ [SKIP PRE-LIFT] First open - learning keyboard height for this device');
                }

                // 🔧 TRIGGER FOCUS: Open keyboard
                // preventScroll prevents additional scroll attempts
                e.currentTarget.focus({ preventScroll: true });
              } : undefined}
              onClick={!needsVirtualKeyboard ? (e) => {
                // Desktop fallback - onClick works fine
                e.target.focus({ preventScroll: true });
              } : undefined}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? getListeningPlaceholder() : (isLoading ? t('omniaPreparingResponse') : t('chatPlaceholder'))}
              disabled={isLoading}
              rows={1}
              style={{
                width: '100%',
                minHeight: needsVirtualKeyboard ? '50px' : '60px',
                maxHeight: '200px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: isDark
                  ? 'rgba(255, 255, 255, 0.95)' // Dark mode: white text
                  : isLight
                    ? 'rgba(0, 0, 0, 0.9)' // Light-test mode: black text
                    : 'rgba(255, 255, 255, 0.9)', // Light mode: white text
                caretColor: isDark ? 'white' : isLight ? 'black' : 'white', // Cursor color
                fontSize: needsVirtualKeyboard ? '16px' : '18px',
                fontFamily: 'inherit',
                resize: 'none',
                lineHeight: '1.3', // ✅ Adjusted from 1.1 - better readability between lines
                padding: '0.2rem', // ✅ Top/left/right padding
                paddingBottom: '0.2rem', // ✅ Bottom padding instead of margin
              }}
            />
            
            {/* 4 TLAČÍTKA DOLE */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              
              {/* LEFT SIDE BUTTONS */}
              <div style={{
                display: 'flex',
                gap: needsVirtualKeyboard ? '8px' : '12px',
              }}>
                {/* 1. PLUS BUTTON */}
                <button
                  ref={plusButtonRef}
                  // 🔧 iOS FIX: Use onMouseDown (fires BEFORE blur) instead of onClick (fires AFTER blur)
                  onMouseDown={needsVirtualKeyboard ? (e) => {
                    if (isLoading) return;
                    e.preventDefault(); // Prevent blur on textarea
                    console.log('📎 [PLUS-MOUSEDOWN] Plus button pressed - opening popup');

                    // Close keyboard first
                    if (textareaRef.current) {
                      textareaRef.current.blur();
                    }

                    // Open attachment popup (keyboard closing in background)
                    setTimeout(() => {
                      setShowAttachmentPopup(true);
                    }, 0); // No delay - instant popup
                  } : undefined}
                  // Desktop fallback - onClick works fine there
                  onClick={!needsVirtualKeyboard ? () => {
                    if (isLoading) return;
                    console.log('📎 [PLUS-CLICK] Plus button pressed - opening popup');
                    setShowAttachmentPopup(true);
                  } : undefined}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                  title={t('multimodalFeatures')}
                >
                  <Plus size={iconSize} strokeWidth={2} style={{ color: getIconColor() }} />
                </button>
                
                {/* 2. SLIDERS BUTTON (AI Controls Menu) */}
                <button
                  ref={aiControlsButtonRef}
                  onClick={() => setShowAIControls(!showAIControls)}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                  title="AI Controls"
                >
                  <SlidersHorizontal size={iconSize} strokeWidth={2} style={{ color: getIconColor() }} />
                </button>
              </div>
              
              {/* RIGHT SIDE BUTTONS */}
              <div style={{
                display: 'flex',
                gap: needsVirtualKeyboard ? '8px' : '12px',
              }}>
                {/* 4. MIKROFON BUTTON */}
                <button
                  // Mobile: hold-to-talk
                  onTouchStart={needsVirtualKeyboard && !isLoading && !isAudioPlaying ? onSTT : undefined}
                  onTouchEnd={needsVirtualKeyboard && isRecording ? onSTT : undefined}
                  // Desktop: click-to-toggle  
                  onClick={!needsVirtualKeyboard ? onSTT : undefined}
                  disabled={isLoading || isAudioPlaying}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: isLoading || isAudioPlaying ? 'not-allowed' : 'pointer',
                    opacity: isLoading || isAudioPlaying ? 0.5 : 1,
                  }}
                  title={isRecording ? 'Stop Recording' : (needsVirtualKeyboard ? 'Hold to speak' : 'Voice Input')}
                >
                  <Mic
                    size={iconSize}
                    strokeWidth={2}
                    style={{
                      color: isRecording ? '#EF4444' : getIconColor()
                    }}
                  />
                </button>
                
                {/* 5. DYNAMIC BUTTON */}
                <button
                  // 🔧 iOS FIX: Use onMouseDown (fires BEFORE blur) instead of onClick (fires AFTER blur)
                  // This prevents InputBar from closing before message is sent
                  onMouseDown={needsVirtualKeyboard ? (e) => {
                    if (isLoading || (pendingDocuments.length > 0 && !allUploadsCompleted)) return;
                    e.preventDefault(); // Prevent blur on textarea
                    console.log('📤 [SEND-MOUSEDOWN] Send button pressed (BEFORE blur)');
                    if (canSend) {
                      handleSendMessage();
                    } else {
                      onVoiceScreen();
                    }
                  } : undefined}
                  // Desktop fallback - onClick works fine there
                  onClick={!needsVirtualKeyboard ? (canSend ? handleSendMessage : onVoiceScreen) : undefined}
                  disabled={isLoading || (pendingDocuments.length > 0 && !allUploadsCompleted)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: (isLoading || (pendingDocuments.length > 0 && !allUploadsCompleted)) ? 'not-allowed' : 'pointer',
                    opacity: (isLoading || (pendingDocuments.length > 0 && !allUploadsCompleted)) ? 0.5 : 1,
                  }}
                  title={canSend ? 'Send Message' : (pendingDocuments.length > 0 && !allUploadsCompleted) ? 'Uploading files...' : 'Voice Chat'}
                >
                  {(localInput.trim() || pendingDocuments.length > 0) ?
                    <Send size={iconSize} strokeWidth={2} style={{ color: getIconColor() }} /> :
                    <AudioWaveform size={iconSize} strokeWidth={2} style={{ color: getIconColor() }} />
                  }
                </button>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Popup */}
      <AttachmentPopup
        isOpen={showAttachmentPopup}
        onClose={() => setShowAttachmentPopup(false)}
        isDark={isDark}
        buttonRef={plusButtonRef}
        onUploadFiles={() => {
          // Open native file picker
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = '.pdf,.png,.jpg,.jpeg,.bmp,.tiff,.tif,.gif,.txt,application/pdf,image/png,image/jpeg,image/bmp,image/tiff,image/gif,text/plain';
          input.onchange = handleDocumentUploadToChips;
          input.click();
        }}
      />

      {/* AI Controls Popup */}
      <AIControlsPopup
        isOpen={showAIControls}
        onClose={() => setShowAIControls(false)}
        isImageMode={isImageMode}
        onToggleImageMode={onImageGenerate}
        deepReasoning={deepReasoning}
        onToggleDeepReasoning={handleToggleDeepReasoning}
        currentModel={model}
        onModelChange={onModelChange}
        buttonRef={aiControlsButtonRef}
      />

    </>
  );
};

export default React.memo(InputBar);