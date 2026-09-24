/**
 * TS Social Book - Storage Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * When connecting Firebase Storage, swap uploadMedia implementation with:
 *   - ref(storage, `users/${userId}/${Date.now()}_${file.name}`)
 *   - uploadBytesResumable(storageRef, file)
 *   - getDownloadURL(storageRef)
 * ============================================================================
 */

export interface MediaUploadResult {
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export const storageService = {
  validateFile(file: File): { isValid: boolean; error?: string; type: 'image' | 'video' } {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        error: `Unsupported file format (${file.type || 'unknown'}). Please upload JPG, PNG, WEBP, GIF, MP4, or WebM.`,
        type: 'image'
      };
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        error: `Image exceeds maximum allowed size of 15MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        type: 'image'
      };
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return {
        isValid: false,
        error: `Video exceeds maximum allowed size of 50MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        type: 'video'
      };
    }

    return {
      isValid: true,
      type: isImage ? 'image' : 'video'
    };
  },

  /**
   * Uploads file, with mock progress simulation and data URL conversion.
   * Seamlessly ready for Firebase Storage `uploadBytesResumable`.
   */
  async uploadMedia(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<MediaUploadResult> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Simulate network latency & progress
    if (onProgress) {
      onProgress(15);
      await new Promise((r) => setTimeout(r, 120));
      onProgress(55);
      await new Promise((r) => setTimeout(r, 120));
      onProgress(90);
      await new Promise((r) => setTimeout(r, 80));
      onProgress(100);
    }

    // Convert file to Data URL with automatic client-side compression for images
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawResult = reader.result as string;
        if (!validation.type || validation.type !== 'image') {
          resolve(rawResult);
          return;
        }

        // Compress image using canvas
        const img = new Image();
        img.onload = () => {
          const maxDimension = 960;
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawResult);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Export as clean compressed JPEG optimized for mobile and Firestore sync
          const compressed = canvas.toDataURL('image/jpeg', 0.76);
          resolve(compressed);
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = () => reject(new Error('Failed to read file buffer.'));
      reader.readAsDataURL(file);
    });

    return {
      url: dataUrl,
      type: validation.type,
      name: file.name,
      size: file.size
    };
  }
};
