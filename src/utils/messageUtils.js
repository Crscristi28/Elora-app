/**
 * 📝 Message Utilities
 * 
 * Helper functions for message handling and ID generation
 */

// 🆔 Generate unique message ID for Virtuoso
export const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;