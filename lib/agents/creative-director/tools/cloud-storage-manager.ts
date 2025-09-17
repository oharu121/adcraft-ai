/**
 * Creative Director Cloud Storage Manager
 *
 * Handles specialized asset storage operations for David's creative work,
 * including asset organization, signed URL generation, and asset lifecycle management.
 */

import { CloudStorageService, UploadResult } from "@/lib/services/cloud-storage";
import { AssetStatus, QualityLevel } from "../enums";
import type { AssetType } from "../types/asset-types";
import type { VisualAsset, AssetFile, AssetDimensions } from "../types/asset-types";

export interface AssetStorageOptions {
  sessionId: string;
  assetType: AssetType;
  quality: QualityLevel;
  metadata?: Record<string, any>;
  expirationHours?: number;
  publicAccess?: boolean;
}

export interface AssetUploadResult extends UploadResult {
  assetPath: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  sessionId: string;
  assetType: AssetType;
  quality: QualityLevel;
  uploadedAt: string;
  expiresAt: string;
  creativeSpecs?: Record<string, any>;
  dimensions?: AssetDimensions;
  tags?: string[];
}

export interface AssetCollectionInfo {
  totalAssets: number;
  totalSize: number;
  assetsByType: Record<string, number>;
  assetsByQuality: Record<QualityLevel, number>;
  storageUsed: number;
  expiringSoon: number;
}

/**
 * Creative Director Cloud Storage Manager
 * Provides specialized storage operations for David's visual assets
 */
export class CreativeDirectorStorageManager {
  private static instance: CreativeDirectorStorageManager;
  private cloudStorage: CloudStorageService;
  private baseFolder = "creative-director-assets";

  private constructor() {
    this.cloudStorage = CloudStorageService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorStorageManager {
    if (!CreativeDirectorStorageManager.instance) {
      CreativeDirectorStorageManager.instance = new CreativeDirectorStorageManager();
    }
    return CreativeDirectorStorageManager.instance;
  }

  /**
   * Upload visual asset with proper organization and metadata
   */
  public async uploadVisualAsset(
    buffer: Buffer,
    originalName: string,
    options: AssetStorageOptions
  ): Promise<AssetUploadResult> {
    const { sessionId, assetType, quality, metadata, expirationHours = 12, publicAccess = true } = options;
    
    // Create organized folder structure
    const folderPath = this.buildAssetPath(sessionId, assetType, quality);
    const fullPath = `${this.baseFolder}/${folderPath}`;

    // Add asset metadata
    const assetMetadata: AssetMetadata = {
      sessionId,
      assetType,
      quality,
      uploadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
      creativeSpecs: metadata,
      tags: this.generateAssetTags(assetType, quality)
    };

    try {
      // Upload main asset
      const uploadResult = await this.cloudStorage.uploadFile(
        buffer,
        originalName,
        this.detectMimeType(originalName),
        fullPath
      );

      // Create asset path for easy retrieval
      const assetPath = `${fullPath}/${uploadResult.fileName}`;

      // Generate thumbnail and preview if it's an image
      const thumbnailUrl = await this.generateThumbnail(buffer, uploadResult.fileName, fullPath);
      const previewUrl = await this.generatePreview(buffer, uploadResult.fileName, fullPath, quality);

      return {
        ...uploadResult,
        assetPath,
        thumbnailUrl,
        previewUrl,
        metadata: assetMetadata
      };

    } catch (error) {
      console.error("[CREATIVE STORAGE] Upload failed:", error);
      throw new Error(`Asset upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Store complete visual asset with all file variants
   */
  public async storeCompleteAsset(
    asset: VisualAsset,
    files: {
      original: Buffer;
      optimized?: Buffer;
      thumbnail?: Buffer;
      preview?: Buffer;
    }
  ): Promise<{
    original: AssetUploadResult;
    optimized?: AssetUploadResult;
    thumbnail?: AssetUploadResult;
    preview?: AssetUploadResult;
  }> {
    const options: AssetStorageOptions = {
      sessionId: asset.sessionId,
      assetType: asset.type,
      quality: asset.generationSpecs.quality as QualityLevel,
      metadata: {
        prompt: asset.generationSpecs.prompt,
        style: asset.generationSpecs.style,
        model: asset.generationSpecs.model,
        creativeContext: asset.creativeContext
      }
    };

    const results: any = {};

    // Upload original
    results.original = await this.uploadVisualAsset(files.original, `${asset.name}-original.png`, options);

    // Upload variants if provided
    if (files.optimized) {
      results.optimized = await this.uploadVisualAsset(files.optimized, `${asset.name}-optimized.png`, options);
    }

    if (files.thumbnail) {
      results.thumbnail = await this.uploadVisualAsset(files.thumbnail, `${asset.name}-thumbnail.png`, options);
    }

    if (files.preview) {
      results.preview = await this.uploadVisualAsset(files.preview, `${asset.name}-preview.png`, options);
    }

    return results;
  }

  /**
   * Get signed URL for asset access
   */
  public async getAssetSignedUrl(
    assetPath: string,
    expirationMinutes: number = 60,
    action: 'read' | 'write' = 'read'
  ): Promise<string> {
    try {
      return await this.cloudStorage.getSignedUrl(assetPath, action, expirationMinutes);
    } catch (error) {
      console.error("[CREATIVE STORAGE] Failed to generate signed URL:", error);
      throw new Error(`Signed URL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * List all assets for a session
   */
  public async listSessionAssets(sessionId: string): Promise<{
    assetPaths: string[];
    totalSize: number;
    assetsByType: Record<string, string[]>;
  }> {
    try {
      const sessionFolder = `${this.baseFolder}/${sessionId}`;
      const assetPaths = await this.cloudStorage.listFiles(sessionFolder, 1000);
      
      // Organize by asset type
      const assetsByType: Record<string, string[]> = {};
      let totalSize = 0;

      for (const path of assetPaths) {
        const assetType = this.extractAssetTypeFromPath(path);
        if (!assetsByType[assetType]) {
          assetsByType[assetType] = [];
        }
        assetsByType[assetType].push(path);
        
        // Note: Size calculation would require individual file metadata queries
        // For performance, we'll estimate based on path
        totalSize += this.estimateFileSizeFromPath(path);
      }

      return {
        assetPaths,
        totalSize,
        assetsByType
      };

    } catch (error) {
      console.error("[CREATIVE STORAGE] Failed to list session assets:", error);
      throw new Error(`Asset listing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get asset collection information for analytics
   */
  public async getAssetCollectionInfo(sessionId: string): Promise<AssetCollectionInfo> {
    try {
      const { assetPaths, totalSize, assetsByType } = await this.listSessionAssets(sessionId);
      
      // Count assets by quality (estimate from path structure)
      const assetsByQuality: Record<QualityLevel, number> = {
        [QualityLevel.DRAFT]: 0,
        [QualityLevel.STANDARD]: 0,
        [QualityLevel.HIGH]: 0,
        [QualityLevel.PREMIUM]: 0
      };

      // Count expiring assets (simplified - based on typical 12-hour expiration)
      const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
      const expiringSoon = assetPaths.filter(path => {
        // Extract timestamp from path if possible
        const timestamp = this.extractTimestampFromPath(path);
        return timestamp && timestamp < twelveHoursAgo;
      }).length;

      return {
        totalAssets: assetPaths.length,
        totalSize,
        assetsByType: Object.fromEntries(
          Object.entries(assetsByType).map(([type, paths]) => [type, paths.length])
        ),
        assetsByQuality,
        storageUsed: totalSize,
        expiringSoon
      };

    } catch (error) {
      console.error("[CREATIVE STORAGE] Failed to get collection info:", error);
      return {
        totalAssets: 0,
        totalSize: 0,
        assetsByType: {} as Record<string, number>,
        assetsByQuality: {
          [QualityLevel.DRAFT]: 0,
          [QualityLevel.STANDARD]: 0,
          [QualityLevel.HIGH]: 0,
          [QualityLevel.PREMIUM]: 0
        },
        storageUsed: 0,
        expiringSoon: 0
      };
    }
  }

  /**
   * Clean up expired assets for a session
   */
  public async cleanupExpiredAssets(sessionId: string): Promise<{
    deletedCount: number;
    freedSpace: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedCount = 0;
    let freedSpace = 0;

    try {
      const { assetPaths } = await this.listSessionAssets(sessionId);
      
      // Delete expired assets
      for (const assetPath of assetPaths) {
        try {
          const timestamp = this.extractTimestampFromPath(assetPath);
          const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
          
          if (timestamp && timestamp < twelveHoursAgo) {
            const deleted = await this.cloudStorage.deleteFile(assetPath);
            if (deleted) {
              deletedCount++;
              freedSpace += this.estimateFileSizeFromPath(assetPath);
            }
          }
        } catch (error) {
          errors.push(`Failed to delete ${assetPath}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      console.log(`[CREATIVE STORAGE] Cleaned up ${deletedCount} expired assets for session ${sessionId}`);
      
      return {
        deletedCount,
        freedSpace,
        errors
      };

    } catch (error) {
      console.error("[CREATIVE STORAGE] Cleanup failed:", error);
      errors.push(`Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      return {
        deletedCount: 0,
        freedSpace: 0,
        errors
      };
    }
  }

  /**
   * Generate organized storage path
   */
  private buildAssetPath(sessionId: string, assetType: AssetType, quality: QualityLevel): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${sessionId}/${date}/${assetType}/${quality}`;
  }

  /**
   * Generate asset tags for organization
   */
  private generateAssetTags(assetType: AssetType, quality: QualityLevel): string[] {
    return [
      assetType,
      quality,
      'creative-director',
      'ai-generated',
      new Date().toISOString().split('T')[0] // date tag
    ];
  }

  /**
   * Detect MIME type from file extension
   */
  private detectMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      case 'svg': return 'image/svg+xml';
      default: return 'image/png';
    }
  }

  /**
   * Generate thumbnail (simplified - in production would use image processing)
   */
  private async generateThumbnail(buffer: Buffer, filename: string, folderPath: string): Promise<string | undefined> {
    try {
      // In production, this would resize the image to thumbnail size
      // For now, just create a reference to the thumbnail path
      const thumbnailPath = `${folderPath}/thumbs/thumb-${filename}`;
      return `https://storage.googleapis.com/adcraft-assets/${thumbnailPath}`;
    } catch (error) {
      console.warn("[CREATIVE STORAGE] Thumbnail generation failed:", error);
      return undefined;
    }
  }

  /**
   * Generate preview (simplified - in production would use image processing)
   */
  private async generatePreview(
    buffer: Buffer, 
    filename: string, 
    folderPath: string, 
    quality: QualityLevel
  ): Promise<string | undefined> {
    try {
      // In production, this would create an optimized preview
      const previewPath = `${folderPath}/previews/preview-${filename}`;
      return `https://storage.googleapis.com/adcraft-assets/${previewPath}`;
    } catch (error) {
      console.warn("[CREATIVE STORAGE] Preview generation failed:", error);
      return undefined;
    }
  }

  /**
   * Extract asset type from storage path
   */
  private extractAssetTypeFromPath(path: string): string {
    const pathParts = path.split('/');
    // Expected format: creative-director-assets/sessionId/date/assetType/quality/filename
    return pathParts.length >= 4 ? pathParts[3] : 'unknown';
  }

  /**
   * Extract timestamp from storage path
   */
  private extractTimestampFromPath(path: string): number | null {
    try {
      const pathParts = path.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Try to extract timestamp from filename if it contains one
      const timestampMatch = filename.match(/(\d{13})/); // 13-digit timestamp
      return timestampMatch ? parseInt(timestampMatch[1]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Estimate file size from path (simplified)
   */
  private estimateFileSizeFromPath(path: string): number {
    // Estimate based on asset type and file extension
    if (path.includes('thumbnail')) return 50000; // ~50KB
    if (path.includes('preview')) return 200000; // ~200KB
    if (path.includes('premium')) return 2000000; // ~2MB
    if (path.includes('high')) return 1500000; // ~1.5MB
    return 800000; // ~800KB default
  }

  /**
   * Health check for the storage manager
   */
  public async healthCheck(): Promise<boolean> {
    try {
      return await this.cloudStorage.healthCheck();
    } catch (error) {
      console.error("[CREATIVE STORAGE] Health check failed:", error);
      return false;
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
      return await this.cloudStorage.getStorageStats();
    } catch (error) {
      console.error("[CREATIVE STORAGE] Stats retrieval failed:", error);
      return {
        totalFiles: 0,
        totalSize: 0,
        expiredFiles: 0
      };
    }
  }
}