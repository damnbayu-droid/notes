import { createClient } from './client';

/**
 * Neural Asset Storage Engine (v7.7.0)
 * Handles high-fidelity asset uploads to Supabase Storage.
 */

const BUCKET_NAME = 'editor_assets';

/**
 * Neural Asset Storage Engine (v9.6.0)
 * Optimized for high-fidelity WebP ingestion to conserve storage nodes.
 */
export async function uploadNoteAsset(
  userId: string,
  blob: Blob,
  fileName: string
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  
  // Synthesize a unique neural fingerprint for the asset
  const fingerprint = crypto.randomUUID();
  const extension = fileName.split('.').pop() || 'webp';
  const path = `${userId}/${fingerprint}.${extension}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob, {
        contentType: blob.type,
        upsert: false
      });

    if (error) throw error;

    // Retrieve the public universal link
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return { url: publicUrl };
  } catch (err: any) {
    console.error('Storage Engine Failure:', err.message);
    return { error: err.message };
  }
}
