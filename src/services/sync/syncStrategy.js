/**
 * 🎯 Sync Strategy Manager
 *
 * Coordinates Realtime (primary) and Pool sync (fallback)
 * Event-driven architecture - NO polling!
 *
 * Strategy Rules:
 * 1. PWA background → ALWAYS pool mode
 * 2. No Realtime service → pool mode
 * 3. Realtime unhealthy → pool mode
 * 4. Realtime healthy → disable pool
 */
class SyncStrategy {
  constructor() {
    this.realtimeService = null;
    this.usePoolSync = true; // Start with pool until Realtime proven healthy
    this.isPWABackground = false;
    this.lastPoolSync = 0;
    this.lastStateChange = Date.now();
  }

  /**
   * Register Realtime service for health checks
   *
   * @param {Object} service - RealtimeService instance
   */
  setRealtimeService(service) {
    this.realtimeService = service;
    this.checkStrategy();
  }

  /**
   * Mark PWA lifecycle state
   *
   * @param {boolean} isBackground - True if app in background
   */
  setPWABackground(isBackground) {
    const wasBackground = this.isPWABackground;
    this.isPWABackground = isBackground;
    this.lastStateChange = Date.now();

    if (wasBackground !== isBackground) {
      console.log(`📱 [STRATEGY] PWA ${isBackground ? 'background' : 'foreground'}`);
    }

    this.checkStrategy();
  }

  /**
   * Check and update sync strategy
   *
   * @returns {boolean} True if pool sync should be used
   */
  checkStrategy() {
    const previousState = this.usePoolSync;

    // RULE 1: PWA background → ALWAYS pool mode
    if (this.isPWABackground) {
      this.usePoolSync = true;

      if (!previousState) {
        console.log('🔄 [STRATEGY] PWA background → Pool sync ENABLED');
      }

      return this.usePoolSync;
    }

    // RULE 2: No Realtime service → pool mode
    if (!this.realtimeService) {
      this.usePoolSync = true;
      return this.usePoolSync;
    }

    // RULE 3: Realtime unhealthy → pool mode
    if (!this.realtimeService.isHealthy()) {
      this.usePoolSync = true;

      if (!previousState) {
        console.log('⚠️ [STRATEGY] Realtime unhealthy → Pool sync ENABLED');
      }

      return this.usePoolSync;
    }

    // RULE 4: Realtime healthy → disable pool
    this.usePoolSync = false;

    if (previousState) {
      console.log('✅ [STRATEGY] Realtime healthy → Pool sync DISABLED');
    }

    return this.usePoolSync;
  }

  /**
   * Should pool sync run? (event-driven check)
   *
   * @returns {boolean} True if pool sync should be active
   */
  shouldUsePoolSync() {
    return this.checkStrategy();
  }

  /**
   * Is Realtime currently primary?
   *
   * @returns {boolean} True if Realtime is active sync method
   */
  isRealtimePrimary() {
    return !this.usePoolSync;
  }

  /**
   * Should skip pool sync? (deduplication - prevent sync spam)
   *
   * @returns {boolean} True if pool sync was too recent
   */
  shouldSkipPoolSync() {
    // Skip if pool sync was < 3 seconds ago
    const timeSinceLastSync = Date.now() - this.lastPoolSync;
    return timeSinceLastSync < 3000;
  }

  /**
   * Mark pool sync completed (for deduplication)
   */
  markPoolSyncComplete() {
    this.lastPoolSync = Date.now();
  }

  /**
   * Get status for debugging
   *
   * @returns {Object} Current strategy status
   */
  getStatus() {
    return {
      usePoolSync: this.usePoolSync,
      isPWABackground: this.isPWABackground,
      realtimeHealthy: this.realtimeService?.isHealthy() || false,
      lastStateChange: this.lastStateChange,
      timeSincePoolSync: Date.now() - this.lastPoolSync
    };
  }
}

// Export singleton instance
export const syncStrategy = new SyncStrategy();
