import { Storage, Bucket, File } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  fileName: string;
  publicUrl: string;
  signedUrl: string;
  size: number;
  contentType: string;
}

export interface DownloadResult {
  buffer: Buffer;
  metadata: any;
}

/**
 * Cloud Storage service for handling file uploads and downloads
 * Manages temporary files with automatic cleanup after 12 hours
 */
export class CloudStorageService {
  private static instance: CloudStorageService;
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  private constructor() {
    this.bucketName = process.env.STORAGE_BUCKET_NAME || '';
    
    if (!this.bucketName) {
      throw new Error('STORAGE_BUCKET_NAME environment variable is required');
    }

    // Initialize Cloud Storage client
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });

    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Get singleton instance of CloudStorageService
   */
  public static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService();
    }
    return CloudStorageService.instance;
  }

  /**
   * Upload file to Cloud Storage with temporary lifecycle
   */
  public async uploadFile(
    buffer: Buffer,
    originalName: string,
    contentType?: string,
    folder = 'uploads'
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const fileExtension = originalName.split('.').pop() || '';
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
      
      const file = this.bucket.file(fileName);
      
      // Set metadata with custom delete time (12 hours)
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 12);
      
      const metadata = {
        contentType: contentType || 'application/octet-stream',
        metadata: {
          originalName,
          uploadedAt: new Date().toISOString(),
          expiresAt: expiryTime.toISOString(),
        },
      };

      // Upload file
      await file.save(buffer, {
        metadata,
        public: true, // Make publicly accessible for generated videos
      });

      // Get file info
      const [fileMetadata] = await file.getMetadata();
      
      // Generate signed URL for secure access
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: expiryTime,
      });

      return {
        fileName,
        publicUrl: `https://storage.googleapis.com/${this.bucketName}/${fileName}`,
        signedUrl,
        size: fileMetadata.size ? parseInt(fileMetadata.size.toString()) : buffer.length,
        contentType: fileMetadata.contentType || contentType || 'application/octet-stream',
      };

    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download file from Cloud Storage
   */
  public async downloadFile(fileName: string): Promise<DownloadResult> {
    try {
      const file = this.bucket.file(fileName);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found: ${fileName}`);
      }

      // Download file
      const [buffer] = await file.download();
      const [metadata] = await file.getMetadata();

      return {
        buffer,
        metadata,
      };

    } catch (error) {
      console.error('File download failed:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from Cloud Storage
   */
  public async deleteFile(fileName: string): Promise<boolean> {
    try {
      const file = this.bucket.file(fileName);
      await file.delete();
      return true;

    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  /**
   * Get signed URL for file access
   */
  public async getSignedUrl(
    fileName: string,
    action: 'read' | 'write' = 'read',
    expiresInMinutes = 60
  ): Promise<string> {
    try {
      const file = this.bucket.file(fileName);
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + expiresInMinutes);

      const [signedUrl] = await file.getSignedUrl({
        action,
        expires,
      });

      return signedUrl;

    } catch (error) {
      console.error('Signed URL generation failed:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in a folder
   */
  public async listFiles(folder = '', limit = 100): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: folder,
        maxResults: limit,
      });

      return files.map(file => file.name);

    } catch (error) {
      console.error('File listing failed:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired files (called by scheduled job)
   */
  public async cleanupExpiredFiles(): Promise<number> {
    try {
      const [files] = await this.bucket.getFiles();
      const now = new Date();
      let deletedCount = 0;

      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          const expiresAt = metadata.metadata?.expiresAt;
          
          if (expiresAt && typeof expiresAt === 'string' && new Date(expiresAt) < now) {
            await file.delete();
            deletedCount++;
          }
        } catch (error) {
          console.warn(`Failed to check/delete file ${file.name}:`, error);
        }
      }

      console.log(`Cleanup completed: deleted ${deletedCount} expired files`);
      return deletedCount;

    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    expiredFiles: number;
  }> {
    try {
      const [files] = await this.bucket.getFiles();
      const now = new Date();
      
      let totalSize = 0;
      let expiredFiles = 0;

      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          totalSize += metadata.size ? parseInt(metadata.size.toString()) : 0;
          
          const expiresAt = metadata.metadata?.expiresAt;
          if (expiresAt && typeof expiresAt === 'string' && new Date(expiresAt) < now) {
            expiredFiles++;
          }
        } catch (error) {
          console.warn(`Failed to get metadata for ${file.name}:`, error);
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        expiredFiles,
      };

    } catch (error) {
      console.error('Storage stats failed:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        expiredFiles: 0,
      };
    }
  }

  /**
   * Health check for Cloud Storage service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const [exists] = await this.bucket.exists();
      return exists;
    } catch (error) {
      console.error('Cloud Storage health check failed:', error);
      return false;
    }
  }
}