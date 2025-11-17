// 📦 Supabase Storage Service
// Handles file uploads to Supabase Storage instead of storing base64 in database

import { supabase } from '../supabase/client.js';

/**
 * Upload file to Supabase Storage
 * @param {File|Blob} file - The file to upload
 * @param {string} bucket - Bucket name ('attachments' or 'generated-images')
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadToSupabaseStorage(file, bucket = 'attachments') {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    // Extract just the filename from potentially full path (fixes screenshot issue)
    const originalName = file.name || 'unknown';
    const nameOnly = originalName.includes('/') 
      ? originalName.split('/').pop() 
      : originalName;
    const extension = nameOnly.split('.').pop() || 'bin';
    
    const fileName = `${timestamp}-${random}.${extension}`;
    
    console.log(`📤 [STORAGE] Uploading to Supabase Storage: ${fileName} to bucket: ${bucket}`);

    // Upload file to Supabase Storage (owner is set automatically by Supabase)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ [STORAGE] Upload error:', error);
      throw error;
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    console.log(`✅ [STORAGE] File uploaded successfully: ${publicUrl}`);
    
    return {
      success: true,
      fileName,
      publicUrl,
      bucket,
      path: data.path
    };
    
  } catch (error) {
    console.error('❌ [STORAGE] Upload failed:', error);
    throw error;
  }
}

/**
 * Upload base64 data to Supabase Storage
 * @param {string} base64Data - Base64 encoded data (with or without data URI prefix)
 * @param {string} fileName - Original filename
 * @param {string} bucket - Bucket name
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadBase64ToSupabaseStorage(base64Data, fileName, bucket = 'attachments') {
  try {

    // Remove data URI prefix if present
    const base64 = base64Data.replace(/^data:.*?;base64,/, '');

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      console.error('❌ [STORAGE-DEBUG] Invalid base64 format detected!');
      throw new Error('Invalid base64 format');
    }

    // Convert base64 to blob
    const byteCharacters = atob(base64);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Check PDF header (should start with %PDF)
    if (fileName.toLowerCase().endsWith('.pdf')) {
      const firstBytes = new TextDecoder().decode(byteArray.slice(0, 4));
      if (firstBytes !== '%PDF') {
        console.error('❌ [STORAGE-DEBUG] Invalid PDF header! Expected "%PDF", got:', firstBytes);
      }
    }

    // Detect MIME type from data URI or infer from filename
    let mimeType = 'application/octet-stream';
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:(.*?);base64,/);
      if (match) {
        mimeType = match[1];
      }
    } else if (fileName.toLowerCase().endsWith('.pdf')) {
      // Infer MIME type for PDF files when not in data URI
      mimeType = 'application/pdf';
    }

    const blob = new Blob([byteArray], { type: mimeType });

    // Create File object from blob
    const file = new File([blob], fileName, { type: mimeType });

    // Upload using the regular upload function
    return await uploadToSupabaseStorage(file, bucket);
    
  } catch (error) {
    console.error('❌ [STORAGE] Base64 upload failed:', error);
    throw error;
  }
}

/**
 * Get public URL for a file in Supabase Storage
 * @param {string} path - File path in bucket
 * @param {string} bucket - Bucket name
 * @returns {string} Public URL
 */
export function getPublicUrl(path, bucket = 'attachments') {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
}

/**
 * Download file from Supabase Storage
 * @param {string} path - File path in bucket
 * @param {string} bucket - Bucket name
 * @returns {Promise<Blob>} File as blob
 */
export async function downloadFromSupabaseStorage(path, bucket = 'attachments') {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      console.error('❌ [STORAGE] Download error:', error);
      throw error;
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ [STORAGE] Download failed:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} path - File path in bucket
 * @param {string} bucket - Bucket name
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromSupabaseStorage(path, bucket = 'attachments') {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('❌ [STORAGE] Delete error:', error);
      throw error;
    }
    
    console.log(`✅ [STORAGE] File deleted: ${path} from ${bucket}`);
    return true;
    
  } catch (error) {
    console.error('❌ [STORAGE] Delete failed:', error);
    return false;
  }
}

export default {
  uploadToSupabaseStorage,
  uploadBase64ToSupabaseStorage,
  getPublicUrl,
  downloadFromSupabaseStorage,
  deleteFromSupabaseStorage
};