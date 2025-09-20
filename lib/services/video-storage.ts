import { Storage, Bucket } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

export interface VideoUploadResult {
  fileName: string;
  publicUrl: string;
  thumbnailUrl?: string;
  size: number;
  contentType: string;
  duration?: number;
}

export interface VideoMigrationResult {
  success: boolean;
  originalUrl: string;
  newVideoUrl: string;
  newThumbnailUrl?: string;
  error?: string;
}

export interface ThumbnailGenerationOptions {
  timeOffsetSeconds?: number; // Default: 2 seconds
  width?: number; // Default: 320
  height?: number; // Default: 180
  quality?: number; // Default: 80
}

/**
 * Permanent Video Storage Service
 *
 * Handles permanent storage of generated videos in Cloud Storage
 * - No expiration (unlike CloudStorageService which has 12-hour TTL)
 * - Public URLs for gallery access
 * - Thumbnail generation from video frames
 * - Migration from temporary Gemini API storage
 *
 * Production only - Demo mode handled at API level
 */
export class VideoStorageService {
  private static instance: VideoStorageService;
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  private constructor() {
    this.bucketName = process.env.STORAGE_BUCKET_NAME || 'adcraft-videos';

    if (!this.bucketName) {
      throw new Error('STORAGE_BUCKET_NAME environment variable is required');
    }

    // Initialize Cloud Storage client
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
    this.bucket = this.storage.bucket(this.bucketName);
    console.log(`[VIDEO STORAGE] Initialized with bucket: ${this.bucketName}`);
  }

  public static getInstance(): VideoStorageService {
    if (!VideoStorageService.instance) {
      VideoStorageService.instance = new VideoStorageService();
    }
    return VideoStorageService.instance;
  }

  /**
   * Migrate video from Gemini API temporary storage to permanent Cloud Storage
   */
  public async migrateFromGeminiApi(
    geminiProxyUrl: string,
    videoId: string,
    metadata?: {
      productName?: string;
      duration?: number;
      quality?: string;
    }
  ): Promise<VideoMigrationResult> {
    try {
      console.log(`[VIDEO STORAGE] Starting migration for video: ${videoId}`);
      console.log(`[VIDEO STORAGE] Source URL: ${geminiProxyUrl}`);


      // Step 1: Download video from Gemini API proxy
      console.log(`[VIDEO STORAGE] Downloading video from proxy...`);
      const videoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${geminiProxyUrl}`);

      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
      }

      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      console.log(`[VIDEO STORAGE] Downloaded video: ${videoBuffer.length} bytes`);

      // Step 2: Upload to permanent Cloud Storage
      const videoFileName = `videos/${videoId}.mp4`;
      const videoFile = this.bucket.file(videoFileName);

      const uploadMetadata = {
        contentType: 'video/mp4',
        metadata: {
          videoId,
          productName: metadata?.productName || 'Commercial Video',
          uploadedAt: new Date().toISOString(),
          duration: metadata?.duration?.toString() || '8',
          quality: metadata?.quality || '720p',
          // NO expiration - permanent storage
        },
      };

      await videoFile.save(videoBuffer, {
        metadata: uploadMetadata,
        public: true, // Make publicly accessible
      });

      const videoPublicUrl = `https://storage.googleapis.com/${this.bucketName}/${videoFileName}`;
      console.log(`[VIDEO STORAGE] Uploaded video to: ${videoPublicUrl}`);

      // Step 3: Generate thumbnail (simplified - just use video URL for now)
      // TODO: Implement actual video frame extraction
      const thumbnailUrl = videoPublicUrl; // Fallback to video URL

      return {
        success: true,
        originalUrl: geminiProxyUrl,
        newVideoUrl: videoPublicUrl,
        newThumbnailUrl: thumbnailUrl,
      };

    } catch (error) {
      console.error(`[VIDEO STORAGE] Migration failed for ${videoId}:`, error);
      return {
        success: false,
        originalUrl: geminiProxyUrl,
        newVideoUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload video directly to permanent storage
   */
  public async uploadVideo(
    videoBuffer: Buffer,
    videoId: string,
    metadata?: {
      productName?: string;
      duration?: number;
      quality?: string;
    }
  ): Promise<VideoUploadResult> {
    try {

      const fileName = `videos/${videoId}.mp4`;
      const file = this.bucket.file(fileName);

      const uploadMetadata = {
        contentType: 'video/mp4',
        metadata: {
          videoId,
          productName: metadata?.productName || 'Commercial Video',
          uploadedAt: new Date().toISOString(),
          duration: metadata?.duration?.toString() || '8',
          quality: metadata?.quality || '720p',
          // NO expiration - permanent storage
        },
      };

      await file.save(videoBuffer, {
        metadata: uploadMetadata,
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

      return {
        fileName,
        publicUrl,
        size: videoBuffer.length,
        contentType: 'video/mp4',
        duration: metadata?.duration || 8,
      };

    } catch (error) {
      console.error('Video upload failed:', error);
      throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thumbnail from video (placeholder for now)
   * TODO: Implement actual video frame extraction using ffmpeg or similar
   */
  public async generateThumbnail(
    videoUrl: string,
    videoId: string,
    options: ThumbnailGenerationOptions = {}
  ): Promise<string> {
    try {
      // TODO: Implement actual thumbnail generation
      // For now, return the video URL as fallback
      console.log(`[VIDEO STORAGE] Thumbnail generation not yet implemented for ${videoId}`);
      return videoUrl;

    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return videoUrl; // Fallback to video URL
    }
  }

  /**
   * Get video metadata by ID
   */
  public async getVideoMetadata(videoId: string): Promise<VideoUploadResult | null> {
    try {

      const fileName = `videos/${videoId}.mp4`;
      const file = this.bucket.file(fileName);

      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      const [metadata] = await file.getMetadata();
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

      return {
        fileName,
        publicUrl,
        size: metadata.size ? parseInt(metadata.size.toString()) : 0,
        contentType: metadata.contentType || 'video/mp4',
        duration: metadata.metadata?.duration ? parseInt(metadata.metadata.duration.toString()) : 8,
      };

    } catch (error) {
      console.error('Failed to get video metadata:', error);
      return null;
    }
  }

  /**
   * Delete video from storage
   */
  public async deleteVideo(videoId: string): Promise<boolean> {
    try {

      const videoFile = this.bucket.file(`videos/${videoId}.mp4`);
      const thumbnailFile = this.bucket.file(`thumbnails/${videoId}.jpg`);

      // Delete both video and thumbnail (ignore errors for thumbnail)
      await videoFile.delete();
      try {
        await thumbnailFile.delete();
      } catch (error) {
        console.warn(`Thumbnail deletion failed (may not exist): ${error}`);
      }

      console.log(`[VIDEO STORAGE] Deleted video: ${videoId}`);
      return true;

    } catch (error) {
      console.error('Video deletion failed:', error);
      return false;
    }
  }

  /**
   * Health check for video storage service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const [exists] = await this.bucket.exists();
      console.log(`[VIDEO STORAGE] Health check: bucket exists = ${exists}`);
      return exists;

    } catch (error) {
      console.error('[VIDEO STORAGE] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<{
    totalVideos: number;
    totalSize: number;
    averageVideoSize: number;
  }> {
    try {

      const [files] = await this.bucket.getFiles({
        prefix: 'videos/',
      });

      let totalSize = 0;
      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          totalSize += metadata.size ? parseInt(metadata.size.toString()) : 0;
        } catch (error) {
          console.warn(`Failed to get size for ${file.name}:`, error);
        }
      }

      return {
        totalVideos: files.length,
        totalSize,
        averageVideoSize: files.length > 0 ? totalSize / files.length : 0,
      };

    } catch (error) {
      console.error('Storage stats failed:', error);
      return {
        totalVideos: 0,
        totalSize: 0,
        averageVideoSize: 0,
      };
    }
  }
}