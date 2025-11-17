/**
 * 📁 File Utilities
 * 
 * Helper functions for file handling, upload, and base64 conversion
 */

// 🔄 Convert file to base64 data URL
export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};