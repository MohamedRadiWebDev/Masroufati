/**
 * Image compression utility for receipt images
 * Optimizes file size while maintaining readability for Arabic text
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
  maxSizeKB?: number;
}

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1600,
  quality: 0.8,
  format: 'jpeg',
  maxSizeKB: 500, // 500KB max for receipts
};

/**
 * Compresses an image file while preserving readability
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    let imageUrl: string;
    
    if (!ctx) {
      reject(new Error('Canvas 2D context not supported'));
      return;
    }
    
    const cleanup = () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
    
    img.onload = async () => {
      try {
        const result = await tryCompressWithStrategy(img, canvas, ctx, file, opts as Required<CompressionOptions>);
        cleanup();
        resolve(result);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    
    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };
    
    imageUrl = URL.createObjectURL(file);
    img.src = imageUrl;
  });
}

/**
 * Advanced compression strategy with multiple fallback options
 */
async function tryCompressWithStrategy(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  originalFile: File,
  opts: Required<CompressionOptions>
): Promise<File> {
  let currentWidth = opts.maxWidth;
  let currentHeight = opts.maxHeight;
  let currentQuality = opts.quality;
  let currentFormat = opts.format;
  const maxAttempts = 8;
  let bestResult: File | null = null;
  const webpSupported = await isWebPSupported();
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Calculate dimensions while maintaining aspect ratio
    const { width: newWidth, height: newHeight } = calculateOptimalDimensions(
      img.width,
      img.height,
      currentWidth,
      currentHeight
    );
    
    // Ensure minimum dimensions
    if (newWidth < 150 || newHeight < 150) {
      break; // Stop before getting too small
    }
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Use high-quality scaling for text readability
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the resized image
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Try current format first
    let result = await tryCompressionAttempt(canvas, originalFile.name, currentFormat, currentQuality);
    
    // Fallback to JPEG if WebP fails
    if (!result && currentFormat === 'webp') {
      result = await tryCompressionAttempt(canvas, originalFile.name, 'jpeg', currentQuality);
    }
    
    if (result && result.size / 1024 <= opts.maxSizeKB) {
      return result; // Success!
    }
    
    // Store best result so far
    if (!bestResult || (result && result.size < bestResult.size)) {
      bestResult = result;
    }
    
    // Strategy for next attempt
    if (attempt < 4) {
      // First 4 attempts: reduce quality
      currentQuality = Math.max(0.2, currentQuality - 0.15);
    } else if (attempt < 6 && webpSupported) {
      // Next 2 attempts: reduce dimensions and try WebP (only if supported)
      currentWidth = Math.round(currentWidth * 0.85);
      currentHeight = Math.round(currentHeight * 0.85);
      currentFormat = 'webp';
      currentQuality = 0.8; // Reset quality for WebP
    } else {
      // Final attempts: aggressive dimension reduction with JPEG
      currentWidth = Math.round(currentWidth * 0.7);
      currentHeight = Math.round(currentHeight * 0.7);
      currentFormat = 'jpeg'; // Ensure JPEG for final attempts
      currentQuality = Math.max(0.2, currentQuality - 0.2);
    }
  }
  
  // Return the best result we found, or throw if no valid result
  if (!bestResult || bestResult.size === 0) {
    throw new Error('Failed to compress image - unable to generate valid output');
  }
  
  return bestResult;
}

/**
 * Attempts compression with given parameters
 */
function tryCompressionAttempt(
  canvas: HTMLCanvasElement,
  originalName: string,
  format: string,
  quality: number
): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        
        const compressedFile = new File(
          [blob],
          generateCompressedFileName(originalName, format),
          { type: `image/${format}` }
        );
        resolve(compressedFile);
      },
      `image/${format}`,
      quality
    );
  });
}

/**
 * Calculates optimal dimensions while maintaining aspect ratio
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Scale down if too wide
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  // Scale down if too tall
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Generates a filename for compressed image
 */
function generateCompressedFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const timestamp = Date.now();
  return `${nameWithoutExt}_compressed_${timestamp}.${format}`;
}

/**
 * Validates if file is a supported image type
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Gets image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compression stats for display
 */
export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
}

/**
 * Compares original and compressed files
 */
export async function getCompressionStats(
  originalFile: File,
  compressedFile: File
): Promise<CompressionStats> {
  const [originalDimensions, compressedDimensions] = await Promise.all([
    getImageDimensions(originalFile),
    getImageDimensions(compressedFile),
  ]);
  
  return {
    originalSize: originalFile.size,
    compressedSize: compressedFile.size,
    compressionRatio: Math.round(((originalFile.size - compressedFile.size) / originalFile.size) * 100),
    originalDimensions,
    compressedDimensions,
  };
}

/**
 * Checks if WebP format is supported for encoding
 */
function isWebPSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob(
      (blob) => {
        resolve(blob !== null);
      },
      'image/webp',
      0.8
    );
  });
}