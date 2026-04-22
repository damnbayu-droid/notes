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

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return { url: publicUrl };
  } catch (err: any) {
    console.error('Storage Engine Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * AI Offloading Storage Engine (v16.0.0)
 * Handles persistent storage of massive code/prompt payloads.
 */
export async function uploadOffloadedFile(
  userId: string,
  content: string,
  extension: string = 'md'
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const bucketName = 'editor_assets'; // Utilizing existing verified bucket
  
  // Deterministic Fingerprint for deduplication
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const path = `offloaded/${userId}/${hashHex}.${extension}`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, content, {
        contentType: extension === 'md' ? 'text/markdown' : 'text/plain',
        upsert: true // Allow overwriting same content (idempotent)
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return { url: publicUrl };
  } catch (err: any) {
    console.error('Offloading Storage Failure:', err.message);
    return { error: err.message };
  }
}

/**
 * PDF Sharing Engine (v18.4.0)
 * Uploads edited manuscripts for public sharing.
 */
export async function uploadSharedPDF(
  userId: string,
  blob: Blob,
  fileName: string
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const bucketName = 'editor_assets';
  
  const fingerprint = crypto.randomUUID();
  const path = `shared_manuscripts/${userId}/${fingerprint}_${fileName}`;

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(path, blob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return { url: publicUrl };
  } catch (error) {
    const err = error as Error;
    console.error('PDF Sharing Storage Failure:', err.message);
    return { error: err.message };
  }
}
