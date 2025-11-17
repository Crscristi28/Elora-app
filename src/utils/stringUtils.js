/**
 * 🔤 STRING UTILITIES
 * Safe string operations that handle emoji and surrogate pairs correctly
 */

/**
 * Safely truncate string without breaking emoji or surrogate pairs
 *
 * Problem: JavaScript strings use UTF-16 encoding where emoji are represented
 * as surrogate pairs (2 code units). Using substring() or slice() can split
 * an emoji in half, creating invalid Unicode that breaks JSON serialization.
 *
 * Example:
 *   "Hello 🎨".substring(0, 7) → "Hello �" (broken emoji!)
 *   safeSlice("Hello 🎨", 7) → "Hello 🎨" (safe!)
 *
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length in characters (not code units)
 * @returns {string} - Safely truncated string
 */
export const safeSlice = (str, maxLength) => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;

  // Array.from() properly handles surrogate pairs by treating each emoji
  // as a single character instead of 2 UTF-16 code units
  const chars = Array.from(str);

  // If the string has fewer actual characters than maxLength, return as-is
  if (chars.length <= maxLength) return str;

  // Slice the character array and join back to string
  return chars.slice(0, maxLength).join('');
};

/**
 * Get the true character count (respecting emoji as single characters)
 *
 * @param {string} str - String to count
 * @returns {number} - Number of characters (emoji count as 1)
 */
export const getCharacterCount = (str) => {
  if (!str || typeof str !== 'string') return 0;
  return Array.from(str).length;
};

/**
 * Check if a string ends with a broken surrogate pair
 *
 * @param {string} str - String to check
 * @returns {boolean} - True if ends with incomplete surrogate
 */
export const hasBrokenSurrogate = (str) => {
  if (!str || typeof str !== 'string' || str.length === 0) return false;

  const lastChar = str.charCodeAt(str.length - 1);
  // High surrogate: 0xD800-0xDBFF (first half of emoji)
  // Low surrogate: 0xDC00-0xDFFF (second half of emoji)
  // If string ends with high surrogate without low, it's broken
  return lastChar >= 0xD800 && lastChar <= 0xDBFF;
};

// 🧪 DEVELOPMENT TESTING
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.stringUtils = {
    safeSlice,
    getCharacterCount,
    hasBrokenSurrogate,

    // Test function
    test: () => {
      console.log('🧪 [STRING-UTILS] Testing emoji-safe string operations...');

      const testCases = [
        { input: 'Hello 🎨 World', length: 10, expected: 'Hello 🎨 Wo' },
        { input: '😂😂😂🎨', length: 3, expected: '😂😂😂' },
        { input: 'Image mode je proto abys vytvořila obrázky 😂😂😂🎨 and more', length: 50, expected: 'Image mode je proto abys vytvořila obrázky 😂😂😂🎨' },
        { input: 'No emoji here', length: 8, expected: 'No emoji' },
        { input: 'Short', length: 100, expected: 'Short' }
      ];

      testCases.forEach((test, i) => {
        const result = safeSlice(test.input, test.length);
        const passed = result === test.expected;
        console.log(`Test ${i + 1}:`, passed ? '✅' : '❌');
        console.log('  Input:', test.input);
        console.log('  Length:', test.length);
        console.log('  Expected:', test.expected);
        console.log('  Got:', result);
        console.log('  Character count:', getCharacterCount(result));
        console.log('  Broken surrogate:', hasBrokenSurrogate(result));
      });

      // Test broken surrogate detection
      const brokenString = 'Hello ' + String.fromCharCode(0xD83C); // High surrogate only
      console.log('\nBroken surrogate test:', hasBrokenSurrogate(brokenString) ? '✅ Detected' : '❌ Not detected');

      return 'Tests complete! Check console for results.';
    }
  };

  console.log('🧪 [STRING-UTILS] Dev tools loaded: stringUtils.test()');
}
