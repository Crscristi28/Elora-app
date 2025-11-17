/**
 * 🖼️ Supabase Image Transformation URLs
 *
 * Generates optimized image URLs using Supabase's /render/image/ endpoint
 * for thumbnails and previews without storing multiple files.
 */

/**
 * Generate optimized image URLs from Supabase Storage URL
 *
 * @param {string} supabaseUrl - Original Supabase Storage URL
 * @returns {Object} Object with storageUrl, thumbnailUrl, previewUrl
 *
 * @example
 * const urls = generateImageUrls('https://xyz.supabase.co/storage/v1/object/public/attachments/photo.jpg');
 * // Returns:
 * // {
 * //   storageUrl: 'https://.../object/public/attachments/photo.jpg',      // Original
 * //   thumbnailUrl: 'https://.../render/image/public/attachments/photo.jpg?width=160&quality=80&format=webp',
 * //   previewUrl: 'https://.../render/image/public/attachments/photo.jpg?width=1280&quality=85&format=webp'
 * // }
 */
export function generateImageUrls(supabaseUrl) {
  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    console.error('❌ [IMAGE-URLS] Invalid supabaseUrl:', supabaseUrl);
    return {
      storageUrl: supabaseUrl,
      thumbnailUrl: null,
      previewUrl: null
    };
  }

  // Replace /object/ with /render/image/ to use Supabase transformation API
  const renderBase = supabaseUrl.replace('/object/', '/render/image/');

  return {
    storageUrl: supabaseUrl,  // Original for AI processing
    thumbnailUrl: `${renderBase}?width=200&height=200&resize=cover&quality=80`,    // For 100px chips @2x retina (20-30KB, auto WebP, fill)
    previewUrl: `${renderBase}?width=1024&resize=contain&quality=85`               // For modal (80-150KB, auto WebP, preserve aspect)
  };
}
