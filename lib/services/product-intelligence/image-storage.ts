/**
 * Product Intelligence Agent - Image Storage Service
 * 
 * Specialized cloud storage service for handling product images with
 * validation, optimization, and secure access for Vertex AI processing.
 */

import { CloudStorageService } from '../cloud-storage';
// TODO: Add Sharp for image processing when available
// import sharp from 'sharp';

export interface ProductImageUpload {
  sessionId: string;
  originalFile: File | Buffer;
  originalName: string;
  contentType: string;
}

export interface ProductImageResult {
  sessionId: string;
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  signedUrl: string; // For Vertex AI access
  metadata: {
    originalSize: number;
    optimizedSize: number;
    thumbnailSize: number;
    dimensions: {
      width: number;
      height: number;
    };
    format: string;
    uploadTimestamp: string;
    expiresAt: string;
  };
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
    colorSpace: string;
  };
}

/**
 * Product Intelligence Image Storage Service
 * Handles image validation, optimization, and secure storage for product analysis
 */
export class ProductImageStorageService {
  private static instance: ProductImageStorageService;
  private cloudStorage: CloudStorageService;

  // Image processing configuration
  private readonly VALIDATION_CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 100, height: 100 },
    supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  };

  private readonly OPTIMIZATION_CONFIG = {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 85,
    thumbnailSize: 300,
    format: 'jpeg' as const
  };

  private constructor() {
    this.cloudStorage = CloudStorageService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProductImageStorageService {
    if (!ProductImageStorageService.instance) {
      ProductImageStorageService.instance = new ProductImageStorageService();
    }
    return ProductImageStorageService.instance;
  }

  /**
   * Validate product image before processing
   */
  public async validateImage(buffer: Buffer): Promise<ImageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file size
      if (buffer.length > this.VALIDATION_CONFIG.maxFileSize) {
        errors.push(`File size (${this.formatFileSize(buffer.length)}) exceeds maximum allowed (${this.formatFileSize(this.VALIDATION_CONFIG.maxFileSize)})`);
      }

      // TODO: Implement proper image metadata extraction with Sharp
      // For now, do basic validation without Sharp
      
      // Basic file signature validation
      const signature = buffer.slice(0, 10);
      let detectedFormat = this.detectImageFormat(signature);
      
      if (!detectedFormat) {
        errors.push('Unsupported or corrupted image format');
        return { isValid: false, errors, warnings };
      }

      if (!this.VALIDATION_CONFIG.supportedFormats.includes(detectedFormat.toLowerCase())) {
        errors.push(`Unsupported image format: ${detectedFormat}. Supported formats: ${this.VALIDATION_CONFIG.supportedFormats.join(', ')}`);
      }

      // Performance warnings for large files
      if (buffer.length > 5 * 1024 * 1024) { // 5MB
        warnings.push('Large file size detected - may be compressed for optimal processing');
      }

      // Placeholder dimensions - in production, use Sharp
      const mockDimensions = { width: 1024, height: 768 };

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          width: mockDimensions.width,
          height: mockDimensions.height,
          format: detectedFormat,
          size: buffer.length,
          hasAlpha: false, // Would be detected with Sharp
          colorSpace: 'srgb' // Default assumption
        }
      };

    } catch (error) {
      errors.push(`Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Upload and process product image
   */
  public async uploadProductImage(upload: ProductImageUpload): Promise<ProductImageResult> {
    try {
      // Convert File to Buffer if needed
      const buffer = upload.originalFile instanceof File 
        ? Buffer.from(await upload.originalFile.arrayBuffer())
        : upload.originalFile;

      // Validate image
      const validation = await this.validateImage(buffer);
      if (!validation.isValid) {
        throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
      }

      const timestamp = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // TODO: Implement image optimization with Sharp
      // For now, use the original buffer for all versions
      const optimizedBuffer = buffer;
      const thumbnailBuffer = buffer;

      // Upload all versions
      const [originalResult, optimizedResult, thumbnailResult] = await Promise.all([
        this.cloudStorage.uploadFile(
          buffer, 
          upload.originalName, 
          upload.contentType, 
          `product-images/${upload.sessionId}/original`
        ),
        this.cloudStorage.uploadFile(
          optimizedBuffer,
          `optimized_${upload.originalName}`,
          'image/jpeg',
          `product-images/${upload.sessionId}/optimized`
        ),
        this.cloudStorage.uploadFile(
          thumbnailBuffer,
          `thumbnail_${upload.originalName}`,
          'image/jpeg',
          `product-images/${upload.sessionId}/thumbnails`
        )
      ]);

      // Generate signed URL for Vertex AI access (longer expiration)
      const signedUrl = await this.cloudStorage.getSignedUrl(
        optimizedResult.fileName,
        'read',
        60 * 24 // 24 hours
      );

      return {
        sessionId: upload.sessionId,
        originalUrl: originalResult.publicUrl,
        optimizedUrl: optimizedResult.publicUrl,
        thumbnailUrl: thumbnailResult.publicUrl,
        signedUrl,
        metadata: {
          originalSize: originalResult.size,
          optimizedSize: optimizedResult.size,
          thumbnailSize: thumbnailResult.size,
          dimensions: {
            width: validation.metadata!.width,
            height: validation.metadata!.height
          },
          format: validation.metadata!.format,
          uploadTimestamp: timestamp,
          expiresAt
        }
      };

    } catch (error) {
      console.error('Product image upload failed:', error);
      throw new Error(`Failed to upload product image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize image for Vertex AI processing
   * TODO: Implement with Sharp for production use
   */
  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    // Placeholder - would use Sharp for actual optimization
    return buffer;
  }

  /**
   * Create thumbnail for UI display
   * TODO: Implement with Sharp for production use
   */
  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    // Placeholder - would use Sharp for actual thumbnail creation
    return buffer;
  }

  /**
   * Detect image format from file signature
   */
  private detectImageFormat(signature: Buffer): string | null {
    // JPEG
    if (signature[0] === 0xFF && signature[1] === 0xD8) {
      return 'jpeg';
    }
    
    // PNG
    if (signature[0] === 0x89 && signature[1] === 0x50 && 
        signature[2] === 0x4E && signature[3] === 0x47) {
      return 'png';
    }
    
    // WebP
    if (signature[0] === 0x52 && signature[1] === 0x49 && 
        signature[2] === 0x46 && signature[3] === 0x46 &&
        signature[8] === 0x57 && signature[9] === 0x45) {
      return 'webp';
    }
    
    return null;
  }

  /**
   * Get signed URL for existing product image
   */
  public async getProductImageSignedUrl(
    sessionId: string, 
    imageType: 'original' | 'optimized' | 'thumbnail' = 'optimized',
    expiresInMinutes: number = 60
  ): Promise<string> {
    try {
      // List files for the session
      const files = await this.cloudStorage.listFiles(`product-images/${sessionId}/${imageType}`);
      
      if (files.length === 0) {
        throw new Error(`No ${imageType} image found for session ${sessionId}`);
      }

      // Get the first file (should only be one per type per session)
      const fileName = files[0];
      return await this.cloudStorage.getSignedUrl(fileName, 'read', expiresInMinutes);

    } catch (error) {
      console.error('Failed to get signed URL:', error);
      throw new Error(`Failed to get signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up product images for a session
   */
  public async cleanupSessionImages(sessionId: string): Promise<boolean> {
    try {
      const files = await this.cloudStorage.listFiles(`product-images/${sessionId}`);
      
      const deletePromises = files.map(fileName => 
        this.cloudStorage.deleteFile(fileName)
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(result => result).length;
      
      console.log(`Cleaned up ${successCount}/${files.length} images for session ${sessionId}`);
      return successCount === files.length;

    } catch (error) {
      console.error('Session cleanup failed:', error);
      return false;
    }
  }

  /**
   * Validate image content for inappropriate material
   */
  public async validateImageContent(imageUrl: string): Promise<{
    isAppropriate: boolean;
    confidence: number;
    flags: string[];
  }> {
    // TODO: Implement content moderation using Google Cloud Vision Safe Search
    // For now, return a placeholder
    
    return {
      isAppropriate: true,
      confidence: 0.95,
      flags: []
    };
  }

  /**
   * Get storage statistics for product images
   */
  public async getProductImageStats(): Promise<{
    totalSessions: number;
    totalImages: number;
    totalSize: number;
    avgImageSize: number;
  }> {
    try {
      const files = await this.cloudStorage.listFiles('product-images');
      const stats = await this.cloudStorage.getStorageStats();
      
      // Count unique sessions
      const sessions = new Set<string>();
      files.forEach(file => {
        const parts = file.split('/');
        if (parts.length >= 3) {
          sessions.add(parts[1]); // product-images/{sessionId}/...
        }
      });

      return {
        totalSessions: sessions.size,
        totalImages: files.length,
        totalSize: stats.totalSize,
        avgImageSize: files.length > 0 ? stats.totalSize / files.length : 0
      };

    } catch (error) {
      console.error('Failed to get product image stats:', error);
      return {
        totalSessions: 0,
        totalImages: 0,
        totalSize: 0,
        avgImageSize: 0
      };
    }
  }

  /**
   * Format file size for human reading
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}