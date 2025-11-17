/**
 * 🗑️ DELETE ACCOUNT - Complete user account deletion
 *
 * Deletes user from Supabase auth.users table
 * Cascade deletes will remove all associated data:
 * - profiles table (ON DELETE CASCADE)
 * - chats table (ON DELETE CASCADE)
 * - messages table (ON DELETE CASCADE via chats)
 */

import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with admin privileges
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  console.log(`🗑️ [DELETE-ACCOUNT] Deleting user account: ${userId}`);

  try {
    // Delete user from auth.users (cascades to profiles, chats, messages)
    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error(`❌ [DELETE-ACCOUNT] Failed for ${userId}:`, error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    console.log(`✅ [DELETE-ACCOUNT] Successfully deleted user: ${userId}`);
    return res.status(200).json({
      success: true,
      userId,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error(`💥 [DELETE-ACCOUNT] Unexpected error for ${userId}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unexpected error during account deletion'
    });
  }
}
