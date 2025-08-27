import { VertexAIService } from './vertex-ai';

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number; // Duration in seconds (max 15 for Veo)
  aspectRatio?: '16:9' | '9:16' | '1:1';
  style?: string;
}

export interface VideoGenerationResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  estimatedCompletionTime?: number; // seconds
  error?: string;
}

export interface VideoJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Video generation service using Google DeepMind Veo API
 * Handles 15-second video creation from text prompts
 */
export class VeoService {
  private static instance: VeoService;
  private vertexAI: VertexAIService;
  private baseUrl: string;

  private constructor() {
    this.vertexAI = VertexAIService.getInstance();
    const config = this.vertexAI.getConfig();
    this.baseUrl = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.region}`;
  }

  /**
   * Get singleton instance of VeoService
   */
  public static getInstance(): VeoService {
    if (!VeoService.instance) {
      VeoService.instance = new VeoService();
    }
    return VeoService.instance;
  }

  /**
   * Generate video from text prompt using Veo API
   */
  public async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const accessToken = await this.vertexAI.getAccessToken();
      
      // Prepare Veo API request
      const veoRequest = {
        prompt: request.prompt,
        video_settings: {
          duration_seconds: Math.min(request.duration || 15, 15), // Max 15 seconds
          aspect_ratio: request.aspectRatio || '16:9',
          style: request.style || 'realistic',
        },
      };

      // Make request to Veo API endpoint
      const response = await fetch(`${this.baseUrl}/publishers/google/models/veo:generateVideo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(veoRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Veo API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Return job information
      return {
        jobId: data.name || `veo-job-${Date.now()}`,
        status: 'pending',
        estimatedCompletionTime: 300, // 5 minutes estimate
      };

    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check status of video generation job
   */
  public async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    try {
      const accessToken = await this.vertexAI.getAccessToken();
      
      // Check job status via Veo API
      const response = await fetch(`${this.baseUrl}/operations/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse response and return status
      if (data.done) {
        if (data.error) {
          return {
            jobId,
            status: 'failed',
            error: data.error.message,
          };
        }
        
        // Job completed successfully
        const result = data.response;
        return {
          jobId,
          status: 'completed',
          progress: 100,
          videoUrl: result?.video_uri,
          thumbnailUrl: result?.thumbnail_uri,
        };
      }

      // Job still processing
      const progress = data.metadata?.progress_percentage || 0;
      return {
        jobId,
        status: progress > 0 ? 'processing' : 'pending',
        progress,
      };

    } catch (error) {
      console.error('Job status check failed:', error);
      return {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel video generation job
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    try {
      const accessToken = await this.vertexAI.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/operations/${jobId}:cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;

    } catch (error) {
      console.error('Job cancellation failed:', error);
      return false;
    }
  }

  /**
   * Estimate cost for video generation
   */
  public estimateCost(request: VideoGenerationRequest): number {
    // Veo pricing estimation (as of 2024)
    const baseCostPer15Seconds = 1.50;
    const duration = Math.min(request.duration || 15, 15);
    
    // Calculate cost based on duration
    return (duration / 15) * baseCostPer15Seconds;
  }

  /**
   * Validate video generation request
   */
  public validateRequest(request: VideoGenerationRequest): string[] {
    const errors: string[] = [];

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    }

    if (request.prompt && request.prompt.length > 500) {
      errors.push('Prompt must be 500 characters or less');
    }

    if (request.duration && (request.duration < 1 || request.duration > 15)) {
      errors.push('Duration must be between 1 and 15 seconds');
    }

    if (request.aspectRatio && !['16:9', '9:16', '1:1'].includes(request.aspectRatio)) {
      errors.push('Aspect ratio must be 16:9, 9:16, or 1:1');
    }

    return errors;
  }
}