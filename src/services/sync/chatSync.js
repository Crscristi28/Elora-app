// 🔄 CHAT SYNC SERVICE - IndexedDB ↔ Supabase with UUID Schema
// Synchronizes chats between local IndexedDB and cloud Supabase database
// Following Omnia's UUID design with UPSERT for duplicate protection

import { supabase, isSupabaseReady } from '../supabase/client.js';
import { authService } from '../auth/supabaseAuth.js';
import chatDB from '../storage/chatDB.js';
import { DEVICE_ID } from '../../utils/deviceId.js';
import { deleteFromSupabaseStorage } from '../storage/supabaseStorage.js';

class ChatSyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.lastSyncTimestamp = localStorage.getItem('lastSyncTimestamp') || '0';
    this.syncInProgress = false;
    
    // Listen to network changes - incremental sync only (no full sync corruption)
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.backgroundSync(); // Now calls incrementalSync() - no batch corruption
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    console.log('🔄 [SYNC-UUID] ChatSyncService initialized with UUID schema');
  }

  // 🔐 Get current user ID for auth-scoped operations
  async getCurrentUserId() {
    try {
      const user = await authService.getCurrentUser();
      return user?.id || null;
    } catch (error) {
      console.error('❌ [SYNC-UUID] Error getting current user:', error);
      return null;
    }
  }

  // 👤 Ensure user profile exists (auto-create if needed)
  async ensureUserProfile() {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!profile) {
        // Auto-create profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: null,
            avatar_url: null
          });

        if (error) {
          console.error('❌ [SYNC-UUID] Error creating profile:', error);
          return false;
        }
        
        console.log('✅ [SYNC-UUID] Auto-created user profile');
      }

      return true;
    } catch (error) {
      console.error('❌ [SYNC-UUID] Error ensuring profile:', error);
      return false;
    }
  }

  // 📤 Upload local chat to Supabase with UUID schema
  async uploadChat(chatId) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [SYNC-UUID] Supabase not configured - sync disabled');
      throw new Error('Supabase configuration missing');
    }
    
    if (!this.isOnline) {
      console.log('📶 [SYNC-UUID] Offline - queuing chat for sync');
      this.queueChatForSync(chatId);
      return false;
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn('👤 [SYNC-UUID] User not authenticated - sync disabled');
      throw new Error('User authentication required for sync');
    }

    // Ensure profile exists
    const profileReady = await this.ensureUserProfile();
    if (!profileReady) return false;

    try {
      console.log(`📤 [SYNC-UUID] Uploading chat: ${chatId}`);
      
      // Get chat metadata from IndexedDB
      const localChats = await chatDB.getAllChats();
      const chatMetadata = localChats.find(c => c.id === chatId);
      
      if (!chatMetadata) {
        console.warn(`⚠️ [SYNC-UUID] Chat not found in IndexedDB: ${chatId}`);
        return false;
      }

      // Get all messages for this chat
      const { messages } = await chatDB.getAllMessagesForChat(chatId);
      
      console.log(`📋 [SYNC-UUID] Found ${messages.length} messages for chat: ${chatId}`);

      // Upload chat metadata with original IndexedDB ID (text format)
      const chatData = {
        id: chatId, // Use original IndexedDB chat ID
        user_id: userId,
        title: chatMetadata.title || 'Untitled Chat', // ✅ Fallback for missing title
        created_at: new Date(chatMetadata.createdAt || Date.now()).toISOString(), // ✅ Fallback timestamp
        updated_at: new Date(chatMetadata.updatedAt || Date.now()).toISOString()  // ✅ Fallback timestamp
      };

      // ✅ VALIDATION: Check if chatData is valid before sending to Supabase
      if (!chatData.id || !chatData.user_id) {
        console.error('❌ [SYNC-UUID] Invalid chat data - missing required fields:', chatData);
        return false;
      }

      console.log('📤 [SYNC-UUID] Chat data to upload:', {
        id: chatData.id,
        title: chatData.title,
        created_at: chatData.created_at,
        updated_at: chatData.updated_at
      });

      // Upsert chat (insert or update)
      const { error: chatError } = await supabase
        .from('chats')
        .upsert(chatData, { onConflict: 'id' });

      if (chatError) {
        console.error('❌ [SYNC-UUID] Error uploading chat metadata:', chatError);
        console.error('❌ [SYNC-UUID] Failed chat data:', JSON.stringify(chatData, null, 2));
        return false;
      }

      // 🚀 TIMESTAMP-BASED SYNC OPTIMIZATION
      // Get last sync timestamp for this chat (if exists)
      const lastSyncKey = `lastSync_${chatId}`;
      const lastSyncTimestamp = localStorage.getItem(lastSyncKey);
      
      let newMessages;
      
      if (lastSyncTimestamp) {
        // ⚡ OPTIMIZED: Filter messages by timestamp (much faster)
        const lastSyncTime = new Date(lastSyncTimestamp).getTime();
        newMessages = messages.filter(localMsg => 
          new Date(localMsg.timestamp).getTime() > lastSyncTime
        );
        
        console.log(`⚡ [SYNC-UUID] Using timestamp-based sync. Last sync: ${lastSyncTimestamp}, found ${newMessages.length} new messages`);
      } else {
        // 🐌 FALLBACK: Use content-based check for first sync (backward compatibility)
        console.log(`🐌 [SYNC-UUID] First sync for chat ${chatId} - using content-based check`);
        
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('content, sender, timestamp')
          .eq('chat_id', chatId);

        newMessages = messages.filter(localMsg => 
          !existingMessages?.some(existing => 
            existing.content === localMsg.text && 
            existing.sender === localMsg.sender
          )
        );
      }

      if (newMessages.length === 0) {
        console.log(`✅ [SYNC-UUID] No new messages to upload for chat: ${chatId}`);
        return true;
      }

      console.log(`📤 [SYNC-UUID] Uploading ${newMessages.length} new messages (${messages.length - newMessages.length} already exist)`);

      // 🔧 FIXED: Upload messages INDIVIDUALLY to preserve exact timestamp ordering
      // No batch processing = no timestamp corruption
      let uploadedCount = 0;

      for (const msg of newMessages) {
        // Transform attachments to store only URLs, not base64
        let attachmentsForDB = null;
        if (msg.attachments && Array.isArray(msg.attachments)) {
          attachmentsForDB = msg.attachments.map(att => ({
            name: att.name,
            size: att.size,
            type: att.type,
            storageUrl: att.storageUrl, // Use Storage URL instead of base64
            storagePath: att.storagePath,
            thumbnailUrl: att.thumbnailUrl, // Optimized thumbnail for chips
            previewUrl: att.previewUrl,     // Optimized preview for modal
            claudeFileId: att.claudeFileId, // Claude Files API file_id for deletion
            modelType: att.modelType        // Track which model uploaded the file
            // ❌ REMOVED: base64 field - not stored in database
          }));
        }
        
        // Transform image to store only URL, not base64
        let imageForDB = null;
        if (msg.image) {
          if (typeof msg.image === 'string') {
            // If image is already a URL (old format), keep it
            imageForDB = msg.image;
          } else if (msg.image.storageUrl) {
            // New format - store full object for deletion support
            imageForDB = {
              storageUrl: msg.image.storageUrl,
              storagePath: msg.image.storagePath,
              mimeType: msg.image.mimeType || 'image/png',
              timestamp: msg.image.timestamp,
              index: msg.image.index
            };
          } else if (msg.image.base64 && !msg.image.storageUrl) {
            // Fallback: if no Storage URL but has base64, skip storing (old data)
            console.warn(`⚠️ [SYNC] Image without Storage URL found, skipping: ${msg.uuid}`);
            imageForDB = null;
          }
        }

        // Transform images array to store full objects for deletion support
        let imagesForDB = null;
        if (msg.images && Array.isArray(msg.images)) {
          imagesForDB = msg.images.map(image => {
            if (typeof image === 'string') {
              // If image is already a URL (old format), keep it
              return image;
            } else if (image.storageUrl) {
              // New format - store full object for deletion support
              return {
                storageUrl: image.storageUrl,
                storagePath: image.storagePath,
                mimeType: image.mimeType || 'image/png',
                timestamp: image.timestamp,
                index: image.index
              };
            } else if (image.base64 && !image.storageUrl) {
              // Fallback: if no Storage URL but has base64, skip storing (old data)
              console.warn(`⚠️ [SYNC] Image in images array without Storage URL found, skipping: ${msg.uuid}`);
              return null;
            }
            return null;
          }).filter(url => url !== null); // Remove null entries

          // If no valid images, set to null
          if (imagesForDB.length === 0) {
            imagesForDB = null;
          }
        }

        // Transform PDF to minimal object (like images) with offline support
        let pdfForDB = null;
        if (msg.pdf && msg.pdf.storageUrl) {
          pdfForDB = {
            title: msg.pdf.title || 'Generated PDF',
            storageUrl: msg.pdf.storageUrl,
            base64: msg.pdf.base64 || null  // Optional offline fallback
          };
          console.log(`📄 [SYNC] Storing PDF object: ${msg.pdf.title}`);
        } else if (msg.pdf && !msg.pdf.storageUrl) {
          // Skip PDF without Storage URL (like images)
          console.warn(`⚠️ [SYNC] PDF without Storage URL found, skipping: ${msg.uuid}`);
          pdfForDB = null;
        }

        // Transform Artifact to minimal object (SAME AS PDF!)
        let artifactForDB = null;
        if (msg.artifact && msg.artifact.storageUrl) {
          artifactForDB = {
            title: msg.artifact.title || 'Generated Artifact',
            filename: msg.artifact.filename,
            storageUrl: msg.artifact.storageUrl,
            storagePath: msg.artifact.storagePath,
            timestamp: msg.artifact.timestamp
          };
          console.log(`🎨 [SYNC] Storing Artifact object: ${msg.artifact.title}`);
        } else if (msg.artifact && !msg.artifact.storageUrl) {
          console.warn(`⚠️ [SYNC] Artifact without Storage URL found, skipping: ${msg.uuid}`);
          artifactForDB = null;
        }

        const messageToUpload = {
          id: msg.uuid, // Use UUID from IndexedDB (stable ID)
          chat_id: chatId, // Use original chat ID
          user_id: userId,
          device_id: DEVICE_ID, // 📱 DEVICE ID: Used to prevent duplicate messages in Realtime sync
          content: msg.text, // ✅ IndexedDB 'text' → Supabase 'content'
          sender: msg.sender,
          timestamp: new Date(msg.timestamp).toISOString(), // Client timestamp for correct ordering
          synced: true,
          type: msg.type || 'text',
          attachments: attachmentsForDB,
          image: imageForDB,
          images: imagesForDB,
          pdf: pdfForDB,
          artifact: artifactForDB, // 🎨 ARTIFACTS: Upload HTML artifact data
          sources: msg.sources || null, // 🔍 SOURCES: Upload web search citations (JSONB)
          has_metadata: msg.hasMetadata || false, // 📊 SUMMARY: Sync metadata flag
          metadata: msg.metadata || null           // 📊 SUMMARY: Sync summary metadata (JSONB)
        };


        // Upload individually - no batch corruption
        const { error: messageError } = await supabase
          .from('messages')
          .upsert([messageToUpload], { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (messageError) {
          console.error(`❌ [SYNC-UUID] Error uploading individual message ${msg.uuid}:`, messageError);
          return false;
        }

        uploadedCount++;
      }

      console.log(`✅ [SYNC-UUID] Successfully uploaded chat: ${chatId} (${uploadedCount} messages)`);
      
      // 🚀 SAVE SYNC TIMESTAMP for next optimization
      const syncTimestamp = new Date().toISOString();
      localStorage.setItem(`lastSync_${chatId}`, syncTimestamp);
      console.log(`⏰ [SYNC-UUID] Saved sync timestamp: ${syncTimestamp}`);
      
      return true;

    } catch (error) {
      console.error(`❌ [SYNC-UUID] Error uploading chat ${chatId}:`, error);
      return false;
    }
  }

  // 📥 Download chats from Supabase to IndexedDB with UUID schema
  async downloadChats(forceFullDownload = false) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [SYNC-UUID] Supabase not configured - download disabled');
      throw new Error('Supabase configuration missing');
    }
    
    if (!this.isOnline) {
      console.log('📶 [SYNC-UUID] Offline - cannot download');
      return false;
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn('👤 [SYNC-UUID] User not authenticated - download disabled');
      throw new Error('User authentication required for sync');
    }

    try {
      console.log('📥 [SYNC-UUID] Downloading chats from Supabase...');

      // Get all user's chats from Supabase
      const { data: remoteChats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (chatsError) {
        console.error('❌ [SYNC-UUID] Error fetching chats:', chatsError);
        return false;
      }

      if (!remoteChats || remoteChats.length === 0) {
        console.log('📭 [SYNC-UUID] No chats found in Supabase');
        return true;
      }

      console.log(`📋 [SYNC-UUID] Found ${remoteChats.length} chats in Supabase`);

      // 🚀 BATCH QUERIES OPTIMIZATION
      // Instead of N queries (one per chat), use 1 query for all messages
      console.log('⚡ [SYNC-UUID] Using batch query for all messages...');
      
      // Get last download timestamp for incremental sync
      const lastDownloadTime = localStorage.getItem('lastGlobalDownloadSync');
      
      // Build query with optional timestamp filter
      let messagesQuery = supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId);
      
      // Add incremental filter if we have a last sync time AND not forcing full download
      if (lastDownloadTime && !forceFullDownload) {
        messagesQuery = messagesQuery.gt('timestamp', lastDownloadTime);
        console.log(`⚡ [SYNC-UUID] Incremental download: messages after ${lastDownloadTime}`);
      } else {
        console.log(`⚡ [SYNC-UUID] Full download: ${forceFullDownload ? 'forced' : 'no previous sync timestamp'}`);
      }
      
      // Paginated query to avoid timeout with large datasets
      let allRemoteMessages = [];
      let from = 0;
      const limit = 100;
      
      while (true) {
        const { data: batch, error: batchError } = await messagesQuery
          .range(from, from + limit - 1)
          .order('timestamp', { ascending: true })
          .order('sender', { ascending: false }); // user před bot při stejném timestamp
        
        if (batchError) {
          console.error('❌ [SYNC-UUID] Error fetching messages batch:', batchError);
          return false;
        }
        
        if (!batch || batch.length === 0) {
          break; // No more messages
        }
        
        allRemoteMessages = [...allRemoteMessages, ...batch];
        from += limit;
        
        console.log(`📥 [SYNC-UUID] Downloaded ${allRemoteMessages.length} messages...`);
      }

      // Group messages by chat_id locally (much faster than N database queries)
      const messagesByChat = {};
      if (allRemoteMessages) {
        allRemoteMessages.forEach(msg => {
          if (!messagesByChat[msg.chat_id]) {
            messagesByChat[msg.chat_id] = [];
          }
          messagesByChat[msg.chat_id].push(msg);
        });
      }

      console.log(`⚡ [SYNC-UUID] Fetched ${allRemoteMessages?.length || 0} messages with 1 query, grouped into ${Object.keys(messagesByChat).length} chats`);

      // Process each chat with its pre-fetched messages
      for (const remoteChat of remoteChats) {
        const chatMessages = messagesByChat[remoteChat.id] || [];
        await this.processChatWithMessages(remoteChat, chatMessages);
      }

      // Clean up orphaned chats (exist locally but not in Supabase)
      const localChats = await chatDB.getAllChats();
      const orphanedChats = localChats.filter(local => 
        !remoteChats.some(remote => remote.id === local.id)
      );

      if (orphanedChats.length > 0) {
        console.log(`🧹 [SYNC-UUID] Found ${orphanedChats.length} orphaned chats to clean up`);
        for (const chat of orphanedChats) {
          await chatDB.deleteChat(chat.id, { skipSync: true });
          console.log(`🗑️ [SYNC-UUID] Cleaned up deleted chat: ${chat.id}`);
        }
      }

      // Update last sync timestamp
      this.lastSyncTimestamp = Date.now().toString();
      localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp);
      
      // Save last download timestamp for incremental sync
      if (allRemoteMessages && allRemoteMessages.length > 0) {
        // Find the latest timestamp from downloaded messages
        const latestTimestamp = allRemoteMessages.reduce((max, msg) => {
          return msg.timestamp > max ? msg.timestamp : max;
        }, allRemoteMessages[0].timestamp);
        
        localStorage.setItem('lastGlobalDownloadSync', latestTimestamp);
        console.log(`⏰ [SYNC-UUID] Saved download sync timestamp: ${latestTimestamp}`);
      }

      console.log(`✅ [SYNC-UUID] Successfully downloaded ${remoteChats.length} chats and cleaned ${orphanedChats.length} orphaned chats`);
      return true;

    } catch (error) {
      console.error('❌ [SYNC-UUID] Error downloading chats:', error);
      return false;
    }
  }

  // 📥 Process chat with pre-fetched messages (optimized batch version)
  async processChatWithMessages(remoteChat, remoteMessages) {
    try {
      const chatId = remoteChat.id;
      console.log(`📥 [SYNC-UUID] Processing ${remoteMessages.length} messages for chat: ${chatId}`);

      if (!remoteMessages || remoteMessages.length === 0) {
        console.log(`📭 [SYNC-UUID] No messages found for chat: ${chatId}`);
        return;
      }

      // Convert Supabase format to IndexedDB format with proper schema mapping
      const localMessages = remoteMessages.map(msg => ({
        uuid: msg.id, // Store Supabase UUID as primary key in IndexedDB
        id: msg.id, // ✅ FIX: Also populate id field for context builder compatibility
        timestamp: new Date(msg.timestamp).getTime(), // Convert timestamptz to bigint
        sender: msg.sender,
        text: msg.content, // ✅ Supabase 'content' → IndexedDB 'text'
        type: msg.type || 'text',
        attachments: msg.attachments,
        image: msg.image,
        images: msg.images,
        pdf: msg.pdf,
        artifact: msg.artifact, // 🎨 ARTIFACTS: Download HTML artifact data
        sources: msg.sources || null, // 🔍 SOURCES: Download web search citations
        // ✅ FIX: Detect hasMetadata from metadata field presence (robust fallback)
        hasMetadata: msg.has_metadata || !!(msg.metadata && msg.metadata.summaryContent),
        metadata: msg.metadata || null // 📊 SUMMARY: Download summary metadata (JSONB)
      }));
      
      // Sort messages by timestamp to ensure correct order (with secondary sort for safety)
      localMessages.sort((a, b) => {
        if (a.timestamp === b.timestamp) {
          // user před bot při stejném timestamp (extra ochrana proti starým datům)
          return a.sender === 'user' ? -1 : 1;
        }
        return a.timestamp - b.timestamp;
      });
      console.log(`📋 [SYNC-UUID] Sorted ${localMessages.length} messages chronologically`);

      // Use the same chat ID from Supabase (no conversion needed)
      const localChatId = remoteChat.id;

      // Save messages using IndexedDB's existing logic (skip sync to prevent loop)
      // ✅ Pass original Supabase timestamps to preserve chronological order
      await chatDB.saveChatV2(
        localChatId,
        localMessages,
        remoteChat.title,
        true,  // skipSync
        new Date(remoteChat.created_at).getTime(),  // ✅ Original createdAt timestamp
        new Date(remoteChat.updated_at).getTime()   // ✅ Original updatedAt timestamp
      );

      console.log(`✅ [SYNC-UUID] Downloaded ${localMessages.length} messages for chat: ${chatId}`);

    } catch (error) {
      console.error(`❌ [SYNC-UUID] Error downloading chat messages:`, error);
    }
  }

  // 🔄 Full bidirectional sync
  async fullSync() {
    if (this.syncInProgress) {
      console.log('⏳ [SYNC-UUID] Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    const startTime = performance.now();

    try {
      console.log('🔄 [SYNC-UUID] Starting full bidirectional sync...');

      // Step 1: Clean up ghost chats FIRST (prevent resurrection)
      const ghostsExorcised = await this.syncDeletedChats();
      if (ghostsExorcised > 0) {
        console.log(`👻 [SYNC-UUID] Exorcised ${ghostsExorcised} ghost chats before sync`);
      }

      // Step 2: Upload remaining clean local chats to Supabase
      const localChats = await chatDB.getAllChats();
      console.log(`📤 [SYNC-UUID] Uploading ${localChats.length} local chats...`);

      let uploadedCount = 0;
      for (const chat of localChats) {
        const success = await this.uploadChat(chat.id);
        if (success) uploadedCount++;
      }

      console.log(`✅ [SYNC-UUID] Uploaded ${uploadedCount}/${localChats.length} chats`);

      // Step 3: Download all remote chats from Supabase (force full download)
      await this.downloadChats(true);

      const duration = Math.round(performance.now() - startTime);
      console.log(`🎯 [SYNC-UUID] Full sync completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ [SYNC-UUID] Error during full sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // 👻 Clean up ghost chats (exist locally but not in Supabase - deleted elsewhere)
  async syncDeletedChats() {
    if (!isSupabaseReady() || !this.isOnline) {
      console.log('📶 [SYNC-UUID] Not ready for ghost cleanup (offline or Supabase not ready)');
      return 0;
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.log('👤 [SYNC-UUID] User not authenticated, skipping ghost cleanup');
      return 0;
    }

    try {
      console.log('👻 [SYNC-UUID] Starting ghost chat cleanup...');

      // Get current truth from Supabase
      const { data: supabaseChats, error: supabaseError } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', userId);

      if (supabaseError) {
        console.error('❌ [SYNC-UUID] Error fetching Supabase chats for cleanup:', supabaseError);
        return 0;
      }

      // Get local IndexedDB state
      const localChats = await chatDB.getAllChats();
      
      // Find ghost chats (exist locally but NOT in Supabase - deleted elsewhere)
      const ghostChats = localChats.filter(local =>
        !supabaseChats.some(remote => remote.id === local.id)
      );

      if (ghostChats.length === 0) {
        console.log('✅ [SYNC-UUID] No ghost chats found');
        return 0;
      }

      console.log(`🧹 [SYNC-UUID] Found ${ghostChats.length} ghost chats to exorcise`);

      // Exorcise the ghosts (delete from local IndexedDB only)
      for (const ghostChat of ghostChats) {
        await chatDB.deleteChat(ghostChat.id, { skipSync: true });
        console.log(`🗑️ [SYNC-UUID] Exorcised ghost chat: ${ghostChat.id}`);
      }

      console.log(`✅ [SYNC-UUID] Ghost cleanup complete - exorcised ${ghostChats.length} ghosts`);
      return ghostChats.length;

    } catch (error) {
      console.error('❌ [SYNC-UUID] Error during ghost cleanup:', error);
      return 0;
    }
  }

  // 🚀 Background sync (called when app loads or network comes back)
  async backgroundSync() {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.log('👤 [SYNC-UUID] User not authenticated, skipping background sync');
      return;
    }

    if (!isSupabaseReady() || !this.isOnline) {
      console.log('📶 [SYNC-UUID] Not ready for background sync (offline or Supabase not ready)');
      return;
    }

    console.log('⚡ [SYNC-UUID] Starting incremental background sync...');
    await this.incrementalSync();
  }

  // ⚡ True incremental sync - only new/dirty data, no batch corruption
  async incrementalSync() {
    if (this.syncInProgress) {
      console.log('⏳ [SYNC-UUID] Incremental sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    const startTime = performance.now();

    try {
      console.log('⚡ [SYNC-UUID] Starting incremental sync (no full sync, no batch corruption)...');

      // Step 0: Ghost cleanup (prevent deleted chats from resurrecting)
      const ghostsExorcised = await this.syncDeletedChats();
      if (ghostsExorcised > 0) {
        console.log(`👻 [SYNC-UUID] Exorcised ${ghostsExorcised} ghost chats (deleted on other devices)`);
      }

      // Step 1: Process sync queue for individual dirty chats (no batch processing)
      const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      if (syncQueue.length > 0) {
        console.log(`📤 [SYNC-UUID] Processing ${syncQueue.length} queued chats individually...`);
        
        for (const chatId of syncQueue) {
          try {
            await this.autoSyncMessage(chatId); // Individual upload, not batch
          } catch (error) {
            console.error(`❌ [SYNC-UUID] Error syncing queued chat ${chatId}:`, error);
          }
        }
        
        // Clear processed queue
        localStorage.removeItem('syncQueue');
      }

      // Step 2: Download only new messages since last sync (incremental)
      await this.downloadChats();

      const duration = Math.round(performance.now() - startTime);
      console.log(`✅ [SYNC-UUID] Incremental sync completed in ${duration}ms (no full sync, no corruption)`);

    } catch (error) {
      console.error('❌ [SYNC-UUID] Error during incremental sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 🗑️ Extract path from Supabase Storage URL
   * @param {string} url - Full Supabase Storage URL
   * @returns {string|null} - Extracted file path or null
   */
  extractPathFromUrl(url) {
    if (!url) return null;
    // URL format: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  }

  /**
   * 🗑️ Delete Storage files for messages from Supabase
   * @param {Array} messages - Array of message objects
   */
  async deleteStorageFilesForMessages(messages) {
    const filesToDelete = [];

    console.log(`🗑️ [STORAGE] Checking ${messages.length} Supabase messages for files...`);

    // Extrahuj file paths ze všech zpráv
    messages.forEach(msg => {
      // Attachments - mají storagePath přímo
      if (msg.attachments && Array.isArray(msg.attachments)) {
        msg.attachments.forEach(att => {
          if (att.storagePath) {
            filesToDelete.push({
              path: att.storagePath,
              bucket: 'attachments',
              type: 'attachment'
            });
          }
        });
      }

      // Generated images (plural) - use storagePath from object
      if (msg.images && Array.isArray(msg.images)) {
        msg.images.forEach(img => {
          // Conservative: Only delete new format (object with storagePath)
          if (typeof img === 'object' && img.storagePath) {
            filesToDelete.push({
              path: img.storagePath,
              bucket: 'generated-images',
              type: 'image'
            });
          }
          // Old format (string URL) is ignored - accept orphans
        });
      }

      // Generated image (singular) - use storagePath from object
      if (msg.image && typeof msg.image === 'object' && msg.image.storagePath) {
        // Conservative: Only delete new format (object with storagePath)
        filesToDelete.push({
          path: msg.image.storagePath,
          bucket: 'generated-images',
          type: 'image'
        });
        // Old format (string URL) is ignored - accept orphans
      }

      // Generated PDF - parsovat URL
      if (msg.pdf && msg.pdf.storageUrl) {
        const path = this.extractPathFromUrl(msg.pdf.storageUrl);
        if (path) {
          filesToDelete.push({
            path,
            bucket: 'generated-pdfs-temp',
            type: 'pdf'
          });
        }
      }
    });

    console.log(`🗑️ [STORAGE] Found ${filesToDelete.length} files to delete from Supabase Storage`);

    // Smaž soubory
    let deleted = 0, failed = 0;
    for (const file of filesToDelete) {
      try {
        await deleteFromSupabaseStorage(file.path, file.bucket);
        console.log(`✅ [STORAGE] Deleted ${file.type}: ${file.path}`);
        deleted++;
      } catch (error) {
        console.error(`❌ [STORAGE] Failed to delete ${file.type} ${file.path}:`, error);
        failed++;
      }
    }

    console.log(`🗑️ [STORAGE] Supabase cleanup: ${deleted} deleted, ${failed} failed`);
  }

  // 🗑️ Delete chat from Supabase (called when user deletes chat)
  async deleteChat(chatId) {
    if (!isSupabaseReady()) {
      console.warn('⚠️ [SYNC-UUID] Supabase not configured - delete sync disabled');
      return false;
    }
    
    if (!this.isOnline) {
      console.log('📶 [SYNC-UUID] Offline - cannot delete from Supabase');
      return false;
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn('👤 [SYNC-UUID] User not authenticated - delete sync disabled');
      return false;
    }

    try {
      console.log(`🗑️ [SYNC-UUID] Deleting chat from Supabase: ${chatId}`);

      // 🗑️ STEP 1: Fetch messages and delete Storage files BEFORE deleting from DB
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('attachments, images, pdf')
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (fetchError) {
        console.error('❌ [SYNC-UUID] Error fetching messages for file cleanup:', fetchError);
      } else if (messages && messages.length > 0) {
        await this.deleteStorageFilesForMessages(messages);
      } else {
        console.log('ℹ️ [SYNC-UUID] No files to delete (no messages found)');
      }

      // 🗑️ STEP 2: Delete chat from Supabase (messages CASCADE automatically)
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId); // Security: only delete own chats

      if (error) {
        console.error('❌ [SYNC-UUID] Error deleting chat from Supabase:', error);
        return false;
      }

      console.log(`✅ [SYNC-UUID] Successfully deleted chat from Supabase: ${chatId}`);
      return true;

    } catch (error) {
      console.error(`❌ [SYNC-UUID] Error during chat deletion sync: ${error}`);
      return false;
    }
  }

  // 📱 Auto-sync after saving message (called from chatDB hook)
  async autoSyncMessage(chatId) {
    const userId = await this.getCurrentUserId();
    if (!userId || !this.isOnline || !isSupabaseReady()) {
      // Queue for later sync when conditions are met
      this.queueChatForSync(chatId);
      return;
    }

    // Upload this specific chat immediately
    await this.uploadChat(chatId);
  }

  // 📝 Queue chat for sync when offline
  queueChatForSync(chatId) {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    if (!queue.includes(chatId)) {
      queue.push(chatId);
      localStorage.setItem('syncQueue', JSON.stringify(queue));
      console.log(`📝 [SYNC-UUID] Queued chat for sync: ${chatId}`);
    }
  }

  // 📊 Get sync status
  getSyncStatus() {
    const queueSize = JSON.parse(localStorage.getItem('syncQueue') || '[]').length;
    return {
      isOnline: this.isOnline,
      supabaseReady: isSupabaseReady(),
      syncInProgress: this.syncInProgress,
      lastSyncTimestamp: this.lastSyncTimestamp,
      queuedSyncs: queueSize
    };
  }

  // 🧹 Clear sync cooldown (for immediate sync after login)
  clearSyncCooldown() {
    localStorage.removeItem('lastSyncTime');
    localStorage.removeItem('lastSyncTimestamp');
    console.log('🧹 [SYNC-UUID] Sync cooldown cleared - ready for immediate sync');
  }
}

// Export singleton instance
export const chatSyncService = new ChatSyncService();

// 🐛 DEVELOPMENT DEBUGGING HELPERS
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.eloraSync = {
    // Test upload single chat
    async testUpload(chatId) {
      if (!chatId) {
        const chats = await chatDB.getAllChats();
        chatId = chats[0]?.id;
        console.log('🧪 Using first available chat:', chatId);
      }
      
      if (!chatId) {
        console.error('❌ No chats found to test upload');
        return false;
      }
      
      console.log('🧪 Testing upload for chat:', chatId);
      return await chatSyncService.uploadChat(chatId);
    },
    
    // Test download all chats
    async testDownload() {
      console.log('🧪 Testing download from Supabase...');
      return await chatSyncService.downloadChats();
    },
    
    // Test full sync
    async testFullSync() {
      console.log('🧪 Testing full bidirectional sync...');
      return await chatSyncService.fullSync();
    },
    
    // Get sync status
    status() {
      const status = chatSyncService.getSyncStatus();
      console.table(status);
      return status;
    },
    
    // Manual sync trigger
    async sync() {
      await chatSyncService.backgroundSync();
    }
  };
  
  console.log('🔄 ELORA SYNC UUID DEBUG: Use window.eloraSync.* for testing');
}

export default chatSyncService;