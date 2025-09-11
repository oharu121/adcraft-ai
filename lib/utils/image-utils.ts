/**
 * Image Processing Utilities
 * 
 * Utilities for image processing, format detection, and base64 manipulation.
 * Provides centralized image handling for product intelligence analysis.
 */

import { ImageFormat } from "../agents/product-intelligence/enums";

/**
 * Image metadata interface
 */
export interface ImageMetadata {
  format: ImageFormat;
  mimeType: string;
  size?: number; // File size in bytes
  isValid: boolean;
  confidence: number; // Detection confidence 0-1
}

/**
 * Image Utils class
 */
export class ImageUtils {
  /**
   * Detect MIME type from base64 image data using header analysis
   */
  public static detectMimeTypeFromBase64(base64Data: string): string {
    // Check for data URL prefix and extract MIME type
    if (base64Data.startsWith("data:")) {
      const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        return mimeMatch[1];
      }
    }

    // Check the first few characters of base64 data to detect image format
    const header = base64Data.substring(0, 10);

    // JPEG: starts with /9j/
    if (header.startsWith("/9j/")) {
      return ImageFormat.JPEG;
    }

    // PNG: starts with iVBORw0
    if (header.startsWith("iVBORw0")) {
      return ImageFormat.PNG;
    }

    // WebP: Look for WEBP signature (UklGR for RIFF header)
    if (header.indexOf("UklGR") === 0) {
      return ImageFormat.WEBP;
    }

    // Try binary analysis as fallback
    try {
      const binaryFormat = this.detectFormatFromBinary(base64Data);
      if (binaryFormat !== ImageFormat.UNKNOWN) {
        return binaryFormat;
      }
    } catch (error) {
      console.warn("Binary format detection failed:", error);
    }

    // Default to JPEG if unknown
    console.warn("[IMAGE UTILS] Unknown image format, defaulting to JPEG");
    return ImageFormat.JPEG;
  }

  /**
   * Detect format by analyzing binary data (magic bytes)
   */
  public static detectFormatFromBinary(base64Data: string): ImageFormat {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '');
      
      // Convert first few bytes from base64 to check magic bytes
      const firstBytes = cleanBase64.slice(0, 20);
      const decoded = atob(firstBytes);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      // JPEG magic bytes: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return ImageFormat.JPEG;
      }
      
      // PNG magic bytes: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return ImageFormat.PNG;
      }
      
      // WebP magic bytes: 52 49 46 46 (RIFF)
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        return ImageFormat.WEBP;
      }
      
      // GIF magic bytes: 47 49 46 38
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return ImageFormat.GIF;
      }

      return ImageFormat.UNKNOWN;
    } catch (error) {
      console.warn("Failed to detect format from binary data:", error);
      return ImageFormat.UNKNOWN;
    }
  }

  /**
   * Get comprehensive image metadata from base64 data
   */
  public static analyzeImage(base64Data: string): ImageMetadata {
    const mimeType = this.detectMimeTypeFromBase64(base64Data);
    const format = this.mimeTypeToFormat(mimeType);
    const isValid = this.validateImageData(base64Data);
    const size = this.calculateBase64Size(base64Data);
    
    // Calculate confidence based on detection methods
    let confidence = 0.5;
    if (base64Data.startsWith("data:")) confidence += 0.3; // Has proper data URL
    if (format !== ImageFormat.UNKNOWN) confidence += 0.2;
    if (isValid) confidence += 0.2;

    return {
      format,
      mimeType,
      size,
      isValid,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Convert MIME type string to ImageFormat enum
   */
  public static mimeTypeToFormat(mimeType: string): ImageFormat {
    switch (mimeType.toLowerCase()) {
      case "image/jpeg":
      case "image/jpg":
        return ImageFormat.JPEG;
      case "image/png":
        return ImageFormat.PNG;
      case "image/webp":
        return ImageFormat.WEBP;
      case "image/gif":
        return ImageFormat.GIF;
      default:
        return ImageFormat.UNKNOWN;
    }
  }

  /**
   * Validate base64 image data integrity
   */
  public static validateImageData(base64Data: string): boolean {
    try {
      // Check if it's a valid base64 string
      const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '');
      
      // Basic base64 validation
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        return false;
      }

      // Try to decode a small portion
      atob(cleanBase64.slice(0, 100));
      
      // Check minimum size (should be larger than a few hundred bytes for real images)
      if (cleanBase64.length < 100) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate approximate file size from base64 data
   */
  public static calculateBase64Size(base64Data: string): number {
    try {
      const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '');
      // Base64 encoding increases size by ~33%, so divide by 1.33
      return Math.floor((cleanBase64.length * 3) / 4);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clean base64 data by removing data URL prefix
   */
  public static cleanBase64Data(base64Data: string): string {
    return base64Data.replace(/^data:.*?;base64,/, '');
  }

  /**
   * Add data URL prefix to base64 data
   */
  public static addDataUrlPrefix(base64Data: string, mimeType?: string): string {
    // Don't add prefix if it already exists
    if (base64Data.startsWith("data:")) {
      return base64Data;
    }

    // Detect MIME type if not provided
    const detectedMimeType = mimeType || this.detectMimeTypeFromBase64(base64Data);
    
    return `data:${detectedMimeType};base64,${base64Data}`;
  }

  /**
   * Optimize image data for API calls (ensure proper format and size)
   */
  public static optimizeForAPI(base64Data: string): {
    data: string;
    mimeType: string;
    isOptimized: boolean;
  } {
    const metadata = this.analyzeImage(base64Data);
    const cleanData = this.cleanBase64Data(base64Data);
    
    // Check if optimization is needed
    const isOptimized = metadata.isValid && metadata.confidence > 0.7;
    
    return {
      data: cleanData,
      mimeType: metadata.mimeType,
      isOptimized
    };
  }

  /**
   * Get file extension from image format
   */
  public static getFileExtension(format: ImageFormat): string {
    switch (format) {
      case ImageFormat.JPEG:
        return "jpg";
      case ImageFormat.PNG:
        return "png";
      case ImageFormat.WEBP:
        return "webp";
      case ImageFormat.GIF:
        return "gif";
      default:
        return "jpg";
    }
  }

  /**
   * Check if image format is supported for analysis
   */
  public static isSupportedFormat(mimeType: string): boolean {
    const supportedTypes = [
      ImageFormat.JPEG,
      ImageFormat.PNG,
      ImageFormat.WEBP,
      ImageFormat.GIF
    ];
    
    return supportedTypes.includes(this.mimeTypeToFormat(mimeType));
  }
}