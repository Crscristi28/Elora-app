// 📱 DEVICE ID UTILITY
// Generates and stores unique device identifier for Realtime deduplication
// Used to prevent duplicate messages when Realtime broadcasts back to sender

/**
 * Get or generate unique device ID
 *
 * Purpose:
 * - Each device (browser instance) has unique ID
 * - Messages include device_id when uploaded to Supabase
 * - Realtime callbacks skip messages with matching device_id
 * - Prevents duplicates on sender device
 *
 * Storage:
 * - Stored in localStorage (persists across sessions)
 * - Format: device_${timestamp}_${random}
 * - Unique per browser/device (not per tab!)
 *
 * @returns {string} Device ID (e.g., "device_1706374800000_abc123def")
 */
export const getDeviceId = () => {
  const STORAGE_KEY = 'elora_device_id';

  // Check if device_id already exists
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    // Generate new device_id
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    deviceId = `device_${timestamp}_${random}`;

    // Store for future use
    localStorage.setItem(STORAGE_KEY, deviceId);
    console.log('🆕 [DEVICE-ID] Generated new device ID:', deviceId);
  } else {
    console.log('♻️ [DEVICE-ID] Using existing device ID:', deviceId);
  }

  return deviceId;
};

/**
 * Get current device ID (must be initialized first)
 * Throws error if not initialized - use getDeviceId() instead
 *
 * @returns {string} Device ID
 */
export const getCurrentDeviceId = () => {
  const deviceId = localStorage.getItem('elora_device_id');

  if (!deviceId) {
    console.error('❌ [DEVICE-ID] Device ID not initialized! Call getDeviceId() first.');
    throw new Error('Device ID not initialized');
  }

  return deviceId;
};

/**
 * Reset device ID (for debugging/testing)
 * Generates new ID on next getDeviceId() call
 */
export const resetDeviceId = () => {
  localStorage.removeItem('elora_device_id');
  console.log('🔄 [DEVICE-ID] Device ID reset - will generate new ID on next use');
};

// Export singleton device ID (initialized on module load)
export const DEVICE_ID = getDeviceId();

// 🐛 DEVELOPMENT DEBUGGING
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.eloraDeviceId = {
    get: getDeviceId,
    current: getCurrentDeviceId,
    reset: resetDeviceId,

    // Show current device ID
    show() {
      const id = getCurrentDeviceId();
      console.log('📱 Current Device ID:', id);
      return id;
    }
  };

  console.log('🔧 DEVICE ID DEBUG: Use window.eloraDeviceId.* for testing');
}
