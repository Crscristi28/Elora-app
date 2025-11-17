// 📁 src/components/sources/sourcesUtils.js
// 🔗 Utility functions for sources handling

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} - Domain name
 */
export const extractDomain = (url) => {
  if (!url || typeof url !== 'string') return 'Unknown';
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    // Fallback for malformed URLs
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
    return match ? match[1] : 'Unknown';
  }
};

/**
 * Format source title - truncate if too long
 * @param {string} title - Source title
 * @param {number} maxLength - Maximum length (default 60)
 * @returns {string} - Formatted title
 */
export const formatSourceTitle = (title, maxLength = 60) => {
  if (!title || typeof title !== 'string') return 'Untitled';
  
  if (title.length <= maxLength) return title;
  
  return title.slice(0, maxLength - 3).trim() + '...';
};

/**
 * Validate if URL is accessible
 * @param {string} url - URL to validate
 * @returns {boolean} - Is valid URL
 */
export const validateSourceUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get favicon URL using Google Favicon API
 * @param {string} url - Source URL
 * @returns {string} - Favicon URL or null
 */
export const getFaviconUrl = (url) => {
  if (!validateSourceUrl(url)) return null;

  try {
    const domain = extractDomain(url);
    // Google Favicon API - 99% reliability, auto-finds correct favicon
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (error) {
    return null;
  }
};

/**
 * Get fallback icon based on domain
 * @param {string} url - Source URL
 * @returns {string} - Emoji icon
 */
export const getFallbackIcon = (url) => {
  if (!url) return '🌐';
  
  const domain = extractDomain(url).toLowerCase();
  
  // Domain-specific icons
  const domainIcons = {
    'wikipedia.org': '📚',
    'youtube.com': '🎥',
    'twitter.com': '🐦',
    'x.com': '🐦',
    'reddit.com': '💬',
    'github.com': '💻',
    'stackoverflow.com': '💻',
    'medium.com': '📝',
    'bloomberg.com': '📈',
    'reuters.com': '📰',
    'bbc.com': '📺',
    'cnn.com': '📺',
    'coindesk.com': '₿',
    'cointelegraph.com': '₿',
    'google.com': '🔍',
    'openai.com': '🤖',
    'anthropic.com': '🤖'
  };
  
  // Check for exact domain match
  if (domainIcons[domain]) {
    return domainIcons[domain];
  }
  
  // Check for partial matches
  for (const [key, icon] of Object.entries(domainIcons)) {
    if (domain.includes(key.split('.')[0])) {
      return icon;
    }
  }
  
  // Default fallback
  return '🌐';
};

/**
 * Format source object for display
 * @param {object} source - Raw source object
 * @returns {object} - Formatted source
 */
export const formatSource = (source) => {
  if (!source || typeof source !== 'object') {
    return {
      title: 'Unknown Source',
      url: '',
      domain: 'Unknown',
      icon: '🌐'
    };
  }
  
  const url = source.url || source.link || '';
  const title = source.title || source.name || '';
  
  return {
    title: formatSourceTitle(title),
    url: url,
    domain: extractDomain(url),
    icon: getFallbackIcon(url),
    favicon: getFaviconUrl(url)
  };
};

/**
 * Process array of sources
 * @param {array} sources - Array of raw sources
 * @returns {array} - Array of formatted sources
 */
export const processSources = (sources) => {
  if (!Array.isArray(sources)) return [];
  
  return sources
    .filter(source => source && (source.url || source.link))
    .map(formatSource)
    .filter(source => source.url); // Remove invalid sources
};