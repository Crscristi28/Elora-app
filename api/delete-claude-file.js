/**
 * 🗑️ DELETE CLAUDE FILE - Cleanup Files API storage
 *
 * Deletes file from Claude Files API when user deletes chat/message
 * Prevents 100 GB storage limit from being reached
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: 'Missing fileId parameter' });
  }

  console.log(`🗑️ [DELETE-FILE] Deleting from Files API: ${fileId}`);

  try {
    const response = await fetch(`https://api.anthropic.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ [DELETE-FILE] Failed for ${fileId}:`, response.status, error);

      // Don't throw - file might already be deleted or expired
      // Just log and continue
      return res.status(200).json({
        success: false,
        fileId,
        status: response.status,
        message: 'File deletion failed (may already be deleted)'
      });
    }

    console.log(`✅ [DELETE-FILE] Successfully deleted: ${fileId}`);
    return res.status(200).json({ success: true, fileId });

  } catch (error) {
    console.error(`💥 [DELETE-FILE] Error deleting ${fileId}:`, error);

    // Don't throw - continue with chat deletion even if Files API fails
    return res.status(200).json({
      success: false,
      fileId,
      error: error.message
    });
  }
}
