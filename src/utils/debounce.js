// 🕐 Debounce Utility
// Delays function execution until after a specified wait time has elapsed
// since the last time it was invoked. Useful for rate-limiting rapid events.

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay (default: 300ms)
 * @returns {Function} - The debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   console.log('Searching for:', query);
 * }, 500);
 *
 * debouncedSearch('hello'); // Will execute after 500ms of no more calls
 */
export function debounce(func, wait = 300) {
  let timeoutId;

  return function debounced(...args) {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export default debounce;
