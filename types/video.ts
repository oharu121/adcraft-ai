/**
 * Video-related type definitions
 */
export interface VideoJob {
  id: string;
  sessionId: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
  veoJobId?: string; // External job ID from Veo API
  metadata?: VideoMetadata;
}

export interface VideoMetadata {
  duration: number; // seconds
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution?: string; // e.g., "1920x1080"
  frameRate?: number;
  fileSize?: number; // bytes
  format?: string; // e.g., "mp4"
  style?: string;
  generationTime?: number; // seconds taken to generate
}

export interface VideoQuality {
  resolution: string;
  bitrate?: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  estimatedSize: number; // MB
}

export interface VideoProgress {
  jobId: string;
  status: VideoJob['status'];
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  processingLog?: ProcessingStep[];
}

export interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  details?: string;
}

/**
 * Video generation configurations
 */
export interface VideoGenerationConfig {
  prompt: string;
  duration: number; // 1-15 seconds
  aspectRatio: '16:9' | '9:16' | '1:1';
  style?: VideoStyle;
  quality?: VideoQuality['quality'];
  seed?: number; // For reproducible results
}

export interface VideoStyle {
  name: string;
  description: string;
  previewUrl?: string;
  tags: string[];
  popularity: number; // 0-1
}

/**
 * Predefined video styles
 */
export const VIDEO_STYLES: VideoStyle[] = [
  {
    name: 'cinematic',
    description: 'Hollywood-style cinematography with dramatic lighting and camera movements',
    tags: ['dramatic', 'professional', 'high-quality'],
    popularity: 0.85,
  },
  {
    name: 'realistic',
    description: 'Photorealistic style that looks like real footage',
    tags: ['natural', 'documentary', 'authentic'],
    popularity: 0.90,
  },
  {
    name: 'animated',
    description: 'Stylized animation with vibrant colors and smooth motion',
    tags: ['colorful', 'artistic', 'stylized'],
    popularity: 0.70,
  },
  {
    name: 'abstract',
    description: 'Artistic and abstract visual style',
    tags: ['artistic', 'creative', 'experimental'],
    popularity: 0.45,
  },
];

/**
 * Video file operations
 */
export interface VideoFile {
  id: string;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  duration: number;
  format: string;
  quality: VideoQuality['quality'];
  createdAt: Date;
  expiresAt: Date;
}

export interface VideoDownload {
  url: string;
  format: string;
  quality: VideoQuality['quality'];
  size: number;
  expiresAt: Date;
}

/**
 * Analytics and metrics
 */
export interface VideoAnalytics {
  jobId: string;
  promptLength: number;
  generationTime: number;
  cost: number;
  quality: VideoQuality['quality'];
  userRating?: number; // 1-5
  completionRate: number; // 0-1
  viewCount: number;
  downloadCount: number;
  shareCount: number;
}

export interface VideoMetrics {
  totalVideos: number;
  successRate: number;
  averageGenerationTime: number;
  averageCost: number;
  popularStyles: { style: string; count: number }[];
  qualityDistribution: Record<VideoQuality['quality'], number>;
}

/**
 * Error handling for video operations
 */
export interface VideoError {
  code: string;
  message: string;
  jobId?: string;
  timestamp: Date;
  recoverable: boolean;
  suggestedAction?: string;
}

export const VIDEO_ERROR_CODES = {
  GENERATION_FAILED: 'VIDEO_GENERATION_FAILED',
  PROMPT_INVALID: 'PROMPT_INVALID', 
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FORMAT_UNSUPPORTED: 'FORMAT_UNSUPPORTED',
  CONTENT_POLICY: 'CONTENT_POLICY_VIOLATION',
} as const;

export type VideoErrorCode = typeof VIDEO_ERROR_CODES[keyof typeof VIDEO_ERROR_CODES];