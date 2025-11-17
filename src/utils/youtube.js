// 🎥 YouTube utility functions for URL detection and embed generation

/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
export const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    // Standard watch URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube Shorts
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Mobile URLs
    /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // YouTube Music
    /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Check if URL is a valid YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if YouTube URL
 */
export const isYouTubeUrl = (url) => {
  return extractYouTubeVideoId(url) !== null;
};

/**
 * Generate YouTube embed URL from video ID
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Embed options
 * @returns {string} - YouTube embed URL
 */
export const generateYouTubeEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return '';
  
  const {
    autoplay = 0,
    controls = 1,
    modestbranding = 1,
    rel = 0,
    start = null
  } = options;
  
  let embedUrl = `https://www.youtube.com/embed/${videoId}?`;
  const params = new URLSearchParams({
    autoplay: autoplay.toString(),
    controls: controls.toString(),
    modestbranding: modestbranding.toString(),
    rel: rel.toString()
  });
  
  if (start && typeof start === 'number') {
    params.append('start', start.toString());
  }
  
  return embedUrl + params.toString();
};

/**
 * Generate YouTube thumbnail URL
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (maxresdefault, hqdefault, mqdefault, sddefault)
 * @returns {string} - YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (videoId, quality = 'hqdefault') => {
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Find all YouTube URLs in text
 * @param {string} text - Text to search
 * @returns {Array} - Array of {url, videoId, startIndex, endIndex}
 */
export const findYouTubeUrls = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const urlPattern = /(https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+(?:[^\s]*)?)/g;
  const matches = [];
  let match;
  
  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0];
    const videoId = extractYouTubeVideoId(url);
    
    if (videoId) {
      matches.push({
        url: url,
        videoId: videoId,
        startIndex: match.index,
        endIndex: match.index + url.length
      });
    }
  }
  
  return matches;
};