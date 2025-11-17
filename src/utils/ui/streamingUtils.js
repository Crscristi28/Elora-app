// 🎯 ELORA STREAMING UTILITIES
// Smart text streaming with typing effect + intelligent scroll management

/**
* Stream words with natural typing effect
* @param {string} fullText - Complete text to stream
* @param {function} onUpdate - Callback with current visible text
* @param {object} options - Streaming options
* @returns {function} Stop function to cancel streaming
*/
export const streamWords = (fullText, onUpdate, options = {}) => {
 const {
   baseDelay = 50,        // Base delay between words (ms)
   punctuationDelay = 100, // Extra delay after . ! ?
   paragraphDelay = 200,   // Extra delay after paragraph
   speedVariation = 0.3,   // Random variation (0-1)
   adaptive = true         // Speed up for long texts
 } = options;

 // Split text into words while preserving structure
 const words = fullText.split(/(\s+)/).filter(w => w.length > 0);
 let currentIndex = 0;
 let currentText = '';
 let isStopped = false;

 // Calculate adaptive speed based on text length
 const adaptiveMultiplier = adaptive && words.length > 100 
   ? Math.max(0.3, 1 - (words.length - 100) / 500)
   : 1;

 const processNextWord = () => {
   if (isStopped || currentIndex >= words.length) {
     onUpdate(fullText, false); // Ensure final text is complete
     return;
   }

   // Add next word
   currentText += words[currentIndex];
   onUpdate(currentText, true);

   // Calculate delay for next word
   let delay = baseDelay * adaptiveMultiplier;

   // Add variation for natural feel
   if (speedVariation > 0) {
     delay *= (1 + (Math.random() - 0.5) * speedVariation);
   }

   // Check for punctuation
   const lastChar = words[currentIndex].trim().slice(-1);
   if (['.', '!', '?'].includes(lastChar)) {
     delay += punctuationDelay;
   }

   // Check for paragraph (double newline)
   if (words[currentIndex].includes('\n\n')) {
     delay += paragraphDelay;
   }

   currentIndex++;
   
   // Schedule next word
   setTimeout(processNextWord, delay);
 };

 // Start streaming
 processNextWord();

 // Return stop function
 return () => {
   isStopped = true;
   onUpdate(fullText, false);
 };
};

/**
* Measure text height before rendering (prevents jumping)
* @param {string} text - Text to measure
* @param {object} containerStyles - Container CSS styles
* @param {number} maxWidth - Maximum width in pixels
* @returns {Promise<number>} Height in pixels
*/
export const measureTextHeight = async (text, containerStyles = {}, maxWidth = 800) => {
 return new Promise((resolve) => {
   // Create invisible measuring element
   const measurer = document.createElement('div');
   
   // Apply same styles as real message container
   Object.assign(measurer.style, {
     position: 'absolute',
     visibility: 'hidden',
     width: `${maxWidth}px`,
     padding: '1.6rem',
     fontSize: '0.95rem',
     lineHeight: '1.6',
     whiteSpace: 'normal',
     fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Inter", sans-serif',
     ...containerStyles
   });

   // Add text and measure
   measurer.textContent = text;
   document.body.appendChild(measurer);

   // Use requestAnimationFrame for accurate measurement
   requestAnimationFrame(() => {
     const height = measurer.offsetHeight;
     document.body.removeChild(measurer);
     resolve(height);
   });
 });
};

/**
* Check if user is at bottom of scroll container
* @param {HTMLElement} container - Scroll container element
* @param {number} threshold - Pixels from bottom to consider "at bottom"
* @returns {boolean}
*/
export const isUserAtBottom = (container, threshold = 100) => {
 if (!container) return true;
 
 const { scrollTop, scrollHeight, clientHeight } = container;
 const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
 
 return distanceFromBottom <= threshold;
};

/**
* Smart scroll to bottom with user preference detection
* @param {HTMLElement} container - Scroll container element
* @param {object} options - Scroll options
*/
export const smartScrollToBottom = (container, options = {}) => {
 const {
   behavior = 'smooth',
   threshold = 100,
   force = false,
   delay = 0
 } = options;

 if (!container) return;

 const scrollAction = () => {
   // Only scroll if user is already near bottom or force is true
   if (force || isUserAtBottom(container, threshold)) {
     container.scrollTo({
       top: container.scrollHeight,
       behavior: behavior
     });
   }
 };

 if (delay > 0) {
   setTimeout(scrollAction, delay);
 } else {
   scrollAction();
 }
};

/**
* Create a smooth message appearance effect
* @param {string} messageId - Unique message identifier
* @param {number} duration - Animation duration in ms
*/
export const animateMessageAppearance = (messageId, duration = 400) => {
 const element = document.querySelector(`[data-message-id="${messageId}"]`);
 if (!element) return;

 // Initial state
 element.style.opacity = '0';
 element.style.transform = 'translateY(20px)';
 element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

 // Trigger animation
 requestAnimationFrame(() => {
   element.style.opacity = '1';
   element.style.transform = 'translateY(0)';
 });
};

/**
* Debounced scroll handler for performance
* @param {function} callback - Function to call on scroll
* @param {number} delay - Debounce delay in ms
* @returns {function} Debounced scroll handler
*/
export const createScrollHandler = (callback, delay = 100) => {
 let timeoutId;
 let lastScrollTop = 0;

 return (event) => {
   const container = event.target;
   const currentScrollTop = container.scrollTop;
   const direction = currentScrollTop > lastScrollTop ? 'down' : 'up';
   
   lastScrollTop = currentScrollTop;

   clearTimeout(timeoutId);
   timeoutId = setTimeout(() => {
     callback({
       scrollTop: currentScrollTop,
       direction,
       isAtBottom: isUserAtBottom(container),
       container
     });
   }, delay);
 };
};

/**
* Stream message with all effects combined
* @param {string} text - Message text
* @param {function} setMessages - React setState function
* @param {array} previousMessages - Previous messages array
* @param {HTMLElement} scrollContainer - Scroll container ref
* @param {array} sources - Message sources for attribution
* @returns {function} Stop streaming function
*/
export const streamMessageWithEffect = (
 text, 
 setMessages, 
 previousMessages, 
 scrollContainer,
 sources = []
) => {
 // 🔍 DEBUG: Word-by-word streaming to see what happens during typing
 return streamWords(text, (currentText, isStreaming) => {
   setMessages([
     ...previousMessages,
     { 
       sender: 'bot', 
       text: currentText, 
       isStreaming: isStreaming,
       sources: sources
     }
   ]);

   // Smart scroll during streaming - DISABLED for ChatGPT style scrolling
   // if (scrollContainer && !isStreaming) {
   //   smartScrollToBottom(scrollContainer, {
   //     threshold: 150,
   //     behavior: 'smooth'
   //   });
   // }
 }, {
   baseDelay: 50,        // Slower for debugging
   punctuationDelay: 100,
   adaptive: true
 });
};

/**
* Utility to handle emoji and special characters in scroll
* @param {string} text - Text to check
* @returns {boolean} Has problematic content
*/
export const hasProblematicContent = (text) => {
 // Check for emoji, code blocks, or tall unicode characters
 const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
 const codeBlockRegex = /```[\s\S]*?```/g;
 const tallCharRegex = /[\u{1F1E6}-\u{1F1FF}]|[\u{2190}-\u{21FF}]/gu;
 
 return emojiRegex.test(text) || codeBlockRegex.test(text) || tallCharRegex.test(text);
};

// Export all utilities
export default {
 streamWords,
 measureTextHeight,
 isUserAtBottom,
 smartScrollToBottom,
 animateMessageAppearance,
 createScrollHandler,
 streamMessageWithEffect,
 hasProblematicContent
};