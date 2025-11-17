// 🔄 REALTIME SYNC SERVICE - Supabase Realtime WebSocket subscriptions
// Handles real-time multi-device synchronization for chats and messages
// Uses WebSocket connection to receive instant notifications when data changes

import { supabase } from '../supabase/client.js';

/**
 * RealtimeService - Manages Supabase Realtime subscriptions
 *
 * Features:
 * - Generic subscribe() method for any table
 * - User filtering (only receive events for current user)
 * - Connection state tracking
 * - Error handling with try-catch
 * - Cleanup on logout (unsubscribeAll)
 *
 * Architecture:
 * - Dependency injection (supabase client + userId passed in constructor)
 * - Map-based subscription tracking (easy to add/remove subscriptions)
 * - Callback pattern (caller provides handlers for INSERT/UPDATE/DELETE)
 */
class RealtimeService {
  /**
   * Constructor - Initialize the Realtime service
   *
   * @param {Object} supabaseClient - Supabase client instance
   * @param {string} userId - Current user ID (for filtering events)
   */
  constructor(supabaseClient, userId) {
    // Store dependencies
    this.supabase = supabaseClient;
    this.userId = userId;

    // Track all active subscriptions (Map: tableName -> channel)
    this.subscriptions = new Map();

    // Track connection state for each subscription (Map: tableName -> status)
    this.connectionState = new Map();

    // Track callbacks for each subscription (Map: tableName -> callbacks object)
    // CRITICAL: Needed for reconnect() to restore callbacks after unsubscribe
    this.callbacks = new Map();

    // ✅ Health monitoring
    this.lastSuccessfulSync = Date.now(); // Track last successful event
    this.reconnectAttempts = 0; // Track reconnection attempts

    console.log('🔄 [REALTIME] Service initialized for user:', userId);
  }

  /**
   * Subscribe to real-time changes in a table
   *
   * @param {string} tableName - Table name to subscribe to (e.g., 'chats', 'messages')
   * @param {Object} callbacks - Callback functions for different events
   * @param {Function} callbacks.onInsert - Called when new row is inserted
   * @param {Function} callbacks.onUpdate - Called when row is updated
   * @param {Function} callbacks.onDelete - Called when row is deleted
   * @param {Object} options - Additional options
   * @param {string} options.filter - Custom filter (default: user_id=eq.${userId})
   *
   * Example usage:
   *   realtimeService.subscribe('chats', {
   *     onInsert: (chat) => console.log('New chat:', chat),
   *     onUpdate: (chat) => console.log('Updated chat:', chat),
   *     onDelete: (chat) => console.log('Deleted chat:', chat)
   *   });
   */
  subscribe(tableName, callbacks, options = {}) {
    // Check if already subscribed to this table
    if (this.subscriptions.has(tableName)) {
      console.warn(`⚠️ [REALTIME] Already subscribed to ${tableName}, skipping`);
      return;
    }

    // Set default filter: only events for current user
    const filter = options.filter || `user_id=eq.${this.userId}`;

    console.log(`🔌 [REALTIME] Subscribing to ${tableName} changes (filter: ${filter})`);

    // Create WebSocket channel for this table
    const channel = this.supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: tableName,
          filter: filter // Only receive events for current user
        },
        (payload) => {
          // ✅ Update health monitoring
          this.lastSuccessfulSync = Date.now();
          this.reconnectAttempts = 0;

          // When event arrives, delegate to handleChange()
          this.handleChange(tableName, payload, callbacks);
        }
      )
      .subscribe((status) => {
        // Track connection state
        this.connectionState.set(tableName, status);

        // Log connection status
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [REALTIME] Connected to ${tableName} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [REALTIME] Connection error for ${tableName}`);
        } else if (status === 'TIMED_OUT') {
          console.error(`⏱️ [REALTIME] Connection timeout for ${tableName}`);
        } else {
          console.log(`🔌 [REALTIME] ${tableName} status: ${status}`);
        }
      });

    // Store channel reference for later cleanup
    this.subscriptions.set(tableName, channel);

    // Store callbacks for reconnect() recovery
    this.callbacks.set(tableName, callbacks);
  }

  /**
   * Handle real-time change event
   *
   * @param {string} tableName - Table that changed
   * @param {Object} payload - Event payload from Supabase
   * @param {Object} callbacks - Callback functions provided by caller
   *
   * Payload structure:
   *   {
   *     eventType: 'INSERT' | 'UPDATE' | 'DELETE',
   *     new: { ... },  // New row data (for INSERT and UPDATE)
   *     old: { ... }   // Old row data (for UPDATE and DELETE)
   *   }
   */
  handleChange(tableName, payload, callbacks) {
    try {
      // Extract event details
      const { eventType, new: newRecord, old: oldRecord } = payload;

      console.log(`📡 [REALTIME] ${tableName} ${eventType}:`, {
        eventType,
        newRecord: newRecord ? `${newRecord.id || 'unknown'}` : null,
        oldRecord: oldRecord ? `${oldRecord.id || 'unknown'}` : null
      });

      // Route to appropriate callback based on event type
      switch (eventType) {
        case 'INSERT':
          // New row was inserted
          if (callbacks.onInsert && typeof callbacks.onInsert === 'function') {
            callbacks.onInsert(newRecord);
          }
          break;

        case 'UPDATE':
          // Existing row was updated
          if (callbacks.onUpdate && typeof callbacks.onUpdate === 'function') {
            callbacks.onUpdate(newRecord, oldRecord);
          }
          break;

        case 'DELETE':
          // Row was deleted
          if (callbacks.onDelete && typeof callbacks.onDelete === 'function') {
            callbacks.onDelete(oldRecord);
          }
          break;

        default:
          console.warn(`⚠️ [REALTIME] Unknown event type: ${eventType}`);
      }
    } catch (error) {
      // CRITICAL: Catch errors to prevent subscription crash
      console.error(`❌ [REALTIME] Error handling ${tableName} change:`, error);
      console.error('Payload that caused error:', payload);

      // Don't throw - we want to keep the subscription alive
      // Individual callback errors shouldn't crash the entire realtime system
    }
  }

  /**
   * Unsubscribe from a specific table
   *
   * @param {string} tableName - Table to unsubscribe from
   *
   * Removes the WebSocket channel and cleans up tracking Maps
   */
  unsubscribe(tableName) {
    const channel = this.subscriptions.get(tableName);

    if (channel) {
      // Remove the channel from Supabase
      this.supabase.removeChannel(channel);

      // Clean up tracking Maps
      this.subscriptions.delete(tableName);
      this.connectionState.delete(tableName);
      this.callbacks.delete(tableName);

      console.log(`❌ [REALTIME] Unsubscribed from ${tableName}`);
    } else {
      console.warn(`⚠️ [REALTIME] No active subscription for ${tableName}`);
    }
  }

  /**
   * Unsubscribe from ALL tables
   *
   * IMPORTANT: Call this on logout to prevent memory leaks!
   *
   * Removes all active WebSocket channels and clears tracking Maps
   */
  unsubscribeAll() {
    console.log(`🔌 [REALTIME] Unsubscribing from all channels (${this.subscriptions.size} active)`);

    // Iterate through all active subscriptions
    this.subscriptions.forEach((channel, tableName) => {
      // Remove each channel
      this.supabase.removeChannel(channel);
      console.log(`❌ [REALTIME] Unsubscribed from ${tableName}`);
    });

    // Clear all tracking Maps
    this.subscriptions.clear();
    this.connectionState.clear();
    this.callbacks.clear();

    console.log('✅ [REALTIME] All subscriptions cleaned up');
  }

  /**
   * Get connection state for a specific table
   *
   * @param {string} tableName - Table to check
   * @returns {string} Connection state: 'SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', or 'disconnected'
   *
   * Useful for debugging and showing connection status in UI
   */
  getConnectionState(tableName) {
    return this.connectionState.get(tableName) || 'disconnected';
  }

  /**
   * ✅ Health check: Are ALL critical subscriptions healthy?
   *
   * @returns {boolean} True if Realtime is working properly
   *
   * Checks WebSocket connection state (SUBSCRIBED) for critical tables.
   * NOTE: Does NOT check "time since last event" - WebSocket can be idle and still healthy!
   */
  isHealthy() {
    const criticalTables = ['chats', 'messages'];

    // Check: All critical tables must be SUBSCRIBED
    for (const table of criticalTables) {
      const state = this.getConnectionState(table);
      if (state !== 'SUBSCRIBED') {
        console.warn(`⚠️ [REALTIME-HEALTH] ${table} not healthy: ${state}`);
        return false;
      }
    }

    console.log('✅ [REALTIME-HEALTH] All systems healthy');
    return true;
  }

  /**
   * ✅ Reconnect ALL subscriptions (PWA foreground recovery)
   *
   * @returns {Promise<boolean>} True if reconnection successful
   *
   * Use cases:
   * - PWA returns from background
   * - Network comes back online
   * - Health check detects failure
   */
  async reconnect() {
    console.log('🔄 [REALTIME-RECONNECT] Starting reconnect...');

    // Increment attempt counter
    this.reconnectAttempts++;

    if (this.reconnectAttempts > 3) {
      console.error('❌ [REALTIME-RECONNECT] Max attempts (3) reached, giving up');
      return false;
    }

    // Backup current callbacks (from this.callbacks, NOT from subscription objects)
    const callbacksBackup = new Map(this.callbacks);

    console.log(`🔄 [REALTIME-RECONNECT] Backed up ${callbacksBackup.size} subscriptions`);

    // Unsubscribe all
    this.unsubscribeAll();

    // Wait 500ms for clean disconnect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Resubscribe with original callbacks
    for (const [tableName, callbacks] of callbacksBackup) {
      await this.subscribe(tableName, callbacks);
    }

    console.log('🔄 [REALTIME-RECONNECT] Resubscription complete');

    // Wait 1s for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if healthy now
    const isHealthy = this.isHealthy();
    console.log(`🔍 [REALTIME-RECONNECT] Health after reconnect: ${isHealthy ? '✅ Healthy' : '❌ Failed'}`);

    return isHealthy;
  }

  /**
   * Get all active subscriptions
   *
   * @returns {Array<string>} Array of table names with active subscriptions
   *
   * Useful for debugging
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

export default RealtimeService;
