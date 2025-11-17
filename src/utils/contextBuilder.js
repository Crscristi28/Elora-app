/**
 * 🧠 CONTEXT BUILDER - Smart context management for Elora
 *
 * Handles:
 * - Summary trigger detection (when to create new summary)
 * - Context building for Elora (summary + recent messages)
 * - Message extraction for summarization
 */

// Constants for summarization trigger
const TRIGGER_THRESHOLD = 29;  // Optimized threshold for better context management
const KEEP_RECENT_BEFORE_SUMMARY = 5;  // MUST BE ODD! Ensures context starts with user message (prevents orphaned tool_result in Claude API)

/**
 * Check if we should trigger summarization
 * @param {Array} messages - All messages in current chat
 * @returns {boolean} - True if we should create a summary
 */
export const shouldTriggerSummarization = (messages) => {
  if (!messages || messages.length === 0) return false;

  // Find the last summary message
  const lastSummaryIndex = messages.findLastIndex(
    msg => msg.hasMetadata && msg.metadata?.summaryContent
  );

  // Calculate messages since last summary
  const messagesSinceSummary = lastSummaryIndex === -1
    ? messages.length  // No summary yet, count all messages
    : messages.length - lastSummaryIndex - 1;  // Count after last summary

  console.log('🔍 [CONTEXT] Summary trigger check:', {
    totalMessages: messages.length,
    lastSummaryIndex,
    messagesSinceSummary,
    threshold: TRIGGER_THRESHOLD,
    shouldTrigger: messagesSinceSummary >= TRIGGER_THRESHOLD
  });

  return messagesSinceSummary >= TRIGGER_THRESHOLD;
};

/**
 * Get messages to summarize and previous summary (if exists)
 * @param {Array} messages - All messages in current chat
 * @returns {Object} - { previousSummary, messagesToSummarize }
 */
export const getMessagesToSummarize = (messages) => {
  if (!messages || messages.length === 0) {
    return { previousSummary: null, messagesToSummarize: [] };
  }

  // Find the last summary message
  const lastSummaryIndex = messages.findLastIndex(
    msg => msg.hasMetadata && msg.metadata?.summaryContent
  );

  if (lastSummaryIndex === -1) {
    // First summary: summarize ALL messages (no orphaned messages)
    const messagesToSummarize = messages;

    console.log('📊 [SUMMARY] First summary:', {
      totalMessages: messages.length,
      messagesToSummarize: messagesToSummarize.length,
      hasPreviousSummary: false
    });

    return {
      previousSummary: null,
      messagesToSummarize
    };
  } else {
    // Subsequent summaries: summarize ALL since last summary (no orphaned messages)
    // This ensures complete hierarchical compression
    const previousSummary = messages[lastSummaryIndex].metadata.summaryContent;
    const allSinceLastSummary = messages.slice(lastSummaryIndex + 1);
    const messagesToSummarize = allSinceLastSummary;

    console.log('📊 [SUMMARY] Hierarchical summary:', {
      totalMessages: messages.length,
      lastSummaryAt: lastSummaryIndex,
      sinceLastSummary: allSinceLastSummary.length,
      messagesToSummarize: messagesToSummarize.length,
      hasPreviousSummary: true,
      previousSummaryLength: previousSummary?.length || 0
    });

    return {
      previousSummary,
      messagesToSummarize
    };
  }
};

/**
 * Build smart context for AI models (Claude/Gemini)
 * Returns summary separately for system prompt injection (Claude)
 * @param {Array} messages - All messages in current chat
 * @param {string} currentMessage - The user's current message
 * @returns {Object} - { summary: string|null, messages: Array }
 */
export const buildContextForElora = (messages, currentMessage) => {
  if (!messages || messages.length === 0) {
    // No history, just current message
    return {
      summary: null,
      messages: [{
        sender: 'user',
        text: currentMessage
      }]
    };
  }

  // 1. Find latest summary (max 1 due to hierarchical compression)
  const latestSummary = messages.slice().reverse().find(
    msg => msg.hasMetadata && msg.metadata?.summaryContent
  );

  // 2. Extract summary text (will be passed separately to backend)
  const summaryText = latestSummary ? latestSummary.metadata.summaryContent : null;

  if (summaryText) {
    console.log('📊 [CONTEXT] Found summary for system prompt');
    console.log('📊 [CONTEXT] Summary length:', summaryText.length, 'chars');
  }

  // 3. Find messages around summary (4 before + FROM summary onwards)
  let recentMessages;

  if (latestSummary) {
    const lastSummaryIndex = messages.findIndex(msg => msg.id === latestSummary.id);

    // Get 4 messages BEFORE summary (for context continuity and detail)
    const startIndex = Math.max(0, lastSummaryIndex - KEEP_RECENT_BEFORE_SUMMARY);
    const messagesBeforeSummary = messages.slice(startIndex, lastSummaryIndex);

    // Get ALL messages FROM summary onwards (including summary message itself)
    const messagesFromSummary = messages.slice(lastSummaryIndex);

    // Filter out any additional summary messages (defensive, keep only the one we want)
    const filteredFrom = messagesFromSummary.filter(
      msg => !msg.metadata?.summaryContent || msg.id === latestSummary.id
    );

    // Combine: 4 before + FROM summary onwards
    recentMessages = [...messagesBeforeSummary, ...filteredFrom];

    console.log('🎯 [CONTEXT] Messages with summary:', {
      beforeSummary: messagesBeforeSummary.length,
      fromSummary: filteredFrom.length,
      totalSending: recentMessages.length
    });
  } else {
    // No summary yet - take ALL messages (no limit!)
    recentMessages = messages;

    console.log('🎯 [CONTEXT] No summary, using all messages:', recentMessages.length);
  }

  // 4. Build final messages array (clean conversation without summary injection)
  const contextMessages = [
    ...recentMessages,
    {
      sender: 'user',
      text: currentMessage
    }
  ];

  console.log('🎯 [CONTEXT] Final context:', {
    hasSummary: !!summaryText,
    summaryLength: summaryText?.length || 0,
    messagesCount: contextMessages.length,
    estimatedTokens: estimateTokens(contextMessages)
  });

  // Return summary separately for Claude system prompt injection
  return {
    summary: summaryText,
    messages: contextMessages
  };
};

/**
 * Estimate token count for context (rough approximation)
 * @param {Array} messages - Context messages
 * @returns {number} - Estimated tokens
 */
const estimateTokens = (messages) => {
  const totalChars = messages.reduce((sum, msg) => {
    return sum + (msg.text?.length || msg.content?.length || 0);
  }, 0);

  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(totalChars / 4);
};

/**
 * Get counter info for debugging
 * @param {Array} messages - All messages in current chat
 * @returns {Object} - Counter info
 */
export const getCounterInfo = (messages) => {
  if (!messages || messages.length === 0) {
    return {
      totalMessages: 0,
      lastSummaryIndex: -1,
      messagesSinceSummary: 0,
      threshold: TRIGGER_THRESHOLD,
      willTrigger: false
    };
  }

  const lastSummaryIndex = messages.findLastIndex(
    msg => msg.hasMetadata && msg.metadata?.summaryContent
  );

  const messagesSinceSummary = lastSummaryIndex === -1
    ? messages.length
    : messages.length - lastSummaryIndex - 1;

  return {
    totalMessages: messages.length,
    lastSummaryIndex,
    messagesSinceSummary,
    threshold: TRIGGER_THRESHOLD,
    willTrigger: messagesSinceSummary >= TRIGGER_THRESHOLD,
    progress: `${messagesSinceSummary}/${TRIGGER_THRESHOLD}`
  };
};
