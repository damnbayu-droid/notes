/**
 * Neural Image Processor (v7.7.0)
 * Optimized for High-Fidelity WebP conversion & AI Readability.
 */

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  format: 'image/webp';
}

/**
 * Converts any image file to an optimized WebP blob.
 * Handles resizing to prevent database/storage bloat.
 */
export async function processImageForNeural(
  file: File, 
  maxWidth = 2000, 
  quality = 0.8
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let width = img.width;
      let height = img.height;
      
      // Calculate scaling to maintain aspect ratio within maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Neural Machine Failure: Could not initialize canvas context.'));
        return;
      }
      
      // Draw image to canvas with high-quality scaling
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to WebP blob
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Neural Machine Failure: Conversion to WebP failed.'));
          return;
        }
        
        resolve({
          blob,
          width,
          height,
          format: 'image/webp'
        });
      }, 'image/webp', quality);
    };
    
    img.onerror = () => {
      reject(new Error('Neural Machine Failure: Image loading failed. Trace node corrupted.'));
    };
  });
}
