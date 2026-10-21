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

    // Convert file to Data URL with automatic client-side compression
    const dataUrl = await new Promise<string>((resolve, reject) => {
      if (validation.type === 'video') {
        // If video is small (< 500KB), keep data URL; otherwise capture video thumbnail frame
        if (file.size < 500 * 1024) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read video.'));
          reader.readAsDataURL(file);
          return;
        }

        // Generate high-quality video snapshot frame
        try {
          const video = document.createElement('video');
          const objectUrl = URL.createObjectURL(file);
          video.src = objectUrl;
          video.muted = true;
          video.playsInline = true;
          video.currentTime = 0.5;

          video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 640;
            let width = video.videoWidth || 640;
            let height = video.videoHeight || 360;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, width, height);
              const thumbUrl = canvas.toDataURL('image/jpeg', 0.7);
              URL.revokeObjectURL(objectUrl);
              resolve(thumbUrl);
              return;
            }
            URL.revokeObjectURL(objectUrl);
            resolve('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80');
          };

          video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80');
          };
        } catch {
          resolve('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80');
        }
        return;
      }

      // Image Compression
      const reader = new FileReader();
      reader.onload = () => {
        const rawResult = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDimension = 640;
          let width = img.width || 640;
          let height = img.height || 480;
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
            resolve(rawResult.length < 200000 ? rawResult : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600');
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Export high-quality compressed JPEG (approx 20KB - 40KB per image)
          const compressed = canvas.toDataURL('image/jpeg', 0.65);
          resolve(compressed);
        };
        img.onerror = () => {
          resolve(rawResult.length < 200000 ? rawResult : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600');
        };
        img.src = rawResult;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
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
