import { VertexAIService } from './vertex-ai';

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number; // Duration in seconds (max 15 for Veo)
  aspectRatio?: '16:9' | '9:16' | '1:1';
  style?: string;
  image?: {
    bytesBase64Encoded: string;
    mimeType: string;
  };
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
   * Check if we should use real Veo API or mock mode
   */
  private shouldUseRealAPI(): boolean {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // Use real API if we have Gemini API key (ignore mock mode for Veo)
    return !!geminiApiKey;
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
   * Uses real Gemini API when available, otherwise falls back to mock mode
   */
  public async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      // Validate the request first
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      if (this.shouldUseRealAPI()) {
        return await this.generateVideoReal(request);
      } else {
        return await this.generateVideoMock(request);
      }

    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate video using real Gemini API with Veo 3
   */
  private async generateVideoReal(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const jobId = `veo-real-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    console.log(`🎬 REAL Veo API video generation started for job: ${jobId}`);
    console.log(`Prompt: ${request.prompt}`);
    console.log(`Aspect Ratio: ${request.aspectRatio || '16:9'}`);

    // Create optimized negative prompt for better video quality
    const negativePrompt = [
      "blurry, low quality, pixelated, grainy",
      "multiple products, product collage, split screen",
      "text overlays covering product, busy text",
      "amateur video, poor lighting, dark shadows",
      "shaky camera, unstable footage",
      "unrealistic colors, oversaturated, neon",
      "people's faces, human models, hands",
      "copyrighted content, brand logos, trademarks",
      "complex backgrounds, cluttered scenes"
    ].join(", ");

    // Prepare request for Gemini API with optional image input
    const instance: any = {
      prompt: request.prompt
    };

    // Add image if provided (image-to-video generation)
    if (request.image) {
      // Optimize image for Veo processing if it's too large
      let optimizedImage = request.image.bytesBase64Encoded;
      const imageSizeKB = (optimizedImage.length * 3) / 4 / 1024; // Estimate base64 size in KB

      console.log(`🎬 Original image size: ~${Math.round(imageSizeKB)}KB`);

      // If image is larger than 200KB, we might want to resize it
      // (This is a placeholder for future optimization)
      if (imageSizeKB > 200) {
        console.log(`🎬 Warning: Large image detected (${Math.round(imageSizeKB)}KB). Consider resizing for better Veo performance.`);
        // TODO: Implement image resizing if needed
      }

      instance.image = {
        bytesBase64Encoded: optimizedImage,
        mimeType: request.image.mimeType
      };
      console.log(`🎬 Including product image in video generation (${request.image.mimeType}, ~${Math.round(imageSizeKB)}KB)`);
    }

    const requestBody = {
      instances: [instance],
      parameters: {
        aspectRatio: request.aspectRatio || '16:9',
        negativePrompt: negativePrompt  // Add negative prompt for better quality
      }
    };

    console.log(`🎬 Using negative prompt: ${negativePrompt.substring(0, 100)}...`);

    // Call Gemini API to start video generation
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:predictLongRunning', {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const operationName = data.name;

    console.log(`🎬 Veo video generation operation started: ${operationName}`);

    // URL encode the operation name to handle slashes in URLs
    const encodedJobId = encodeURIComponent(operationName);
    console.log(`🎬 Encoded job ID for URL routing: ${encodedJobId}`);

    // Store the encoded operation name as jobId for tracking
    return {
      jobId: encodedJobId, // Use URL-encoded operation name for routing
      status: 'pending',
      estimatedCompletionTime: 180, // 3 minutes typical for Veo
    };
  }

  /**
   * Generate video using mock implementation for testing
   */
  private async generateVideoMock(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const jobId = `veo-demo-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    console.log(`Mock video generation started for job: ${jobId}`);
    console.log(`Prompt: ${request.prompt}`);
    console.log(`Duration: ${request.duration || 15} seconds`);
    console.log(`Aspect Ratio: ${request.aspectRatio || '16:9'}`);
    console.log(`Style: ${request.style || 'realistic'}`);

    // Return job information
    return {
      jobId: jobId,
      status: 'pending',
      estimatedCompletionTime: 300, // 5 minutes estimate
    };
  }

  /**
   * Check status of video generation job
   * Handles both real Gemini API operations and mock jobs
   */
  public async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    try {
      // Determine if this is a real API operation or mock job
      if (jobId.startsWith('veo-demo-')) {
        // Mock job
        return await this.getJobStatusMock(jobId);
      } else if (jobId.includes('operations') || jobId.includes('models')) {
        // Real API operation (may be URL encoded)
        const decodedJobId = decodeURIComponent(jobId);
        console.log(`🎬 Checking status for decoded operation: ${decodedJobId}`);
        return await this.getJobStatusReal(decodedJobId);
      } else {
        return {
          jobId,
          status: 'failed',
          error: 'Invalid job ID format',
        };
      }
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
   * Check status of real Gemini API operation
   */
  private async getJobStatusReal(operationName: string): Promise<VideoJobStatus> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    const response = await fetch(`${baseUrl}/${operationName}`, {
      method: 'GET',
      headers: {
        'x-goog-api-key': geminiApiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // LOG THE FULL RAW RESPONSE FOR DEBUGGING
    console.log(`🔍 RAW VEO RESPONSE for ${operationName}:`, JSON.stringify(data, null, 2));

    if (!data.done) {
      // Still processing
      return {
        jobId: operationName,
        status: 'processing',
        progress: 50, // Intermediate progress
      };
    }

    if (data.error) {
      // Failed - log detailed error information
      console.error(`🎬 Veo generation failed for operation ${operationName}:`, {
        errorCode: data.error.code,
        errorMessage: data.error.message,
        errorDetails: data.error.details || 'No additional details',
        fullErrorObject: data.error
      });

      // Provide user-friendly error messages for common Veo issues
      let userFriendlyError = data.error.message || 'Video generation failed';

      if (data.error.code === 'INTERNAL') {
        userFriendlyError = 'Veo service temporarily unavailable. This is a known issue with Google\'s video generation service. Please try again in a few minutes.';
      } else if (data.error.code === 'QUOTA_EXCEEDED') {
        userFriendlyError = 'Video generation quota exceeded. Please try again later.';
      } else if (data.error.code === 'INVALID_ARGUMENT') {
        userFriendlyError = 'Video request format issue. Please try with a shorter or simpler prompt.';
      } else if (data.error.message?.includes('timeout') || data.error.message?.includes('deadline')) {
        userFriendlyError = 'Video generation timed out. Try reducing video length or complexity.';
      }

      return {
        jobId: operationName,
        status: 'failed',
        error: userFriendlyError,
      };
    }

    // Completed - extract video URL
    console.log(`🔍 LOOKING FOR VIDEO URL in response structure:`);
    console.log(`🔍 data.response exists: ${!!data.response}`);
    console.log(`🔍 data.response?.generateVideoResponse exists: ${!!data.response?.generateVideoResponse}`);

    const videoResponse = data.response?.generateVideoResponse;
    console.log(`🔍 videoResponse:`, JSON.stringify(videoResponse, null, 2));

    if (videoResponse && videoResponse.generatedSamples?.[0]?.video?.uri) {
      const videoUri = videoResponse.generatedSamples[0].video.uri;
      console.log(`🎬 Video completed! URI: ${videoUri}`);

      // Extract file ID from URI and create proxy URL
      const fileIdMatch = videoUri.match(/files\/([^:]+):/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        const proxyUrl = `/api/video/proxy/${fileId}`;
        console.log(`🎬 Created proxy URL: ${proxyUrl}`);

        return {
          jobId: operationName,
          status: 'completed',
          progress: 100,
          videoUrl: proxyUrl,
        };
      } else {
        console.error('Could not extract file ID from URI:', videoUri);
        return {
          jobId: operationName,
          status: 'failed',
          error: 'Could not parse video file ID',
        };
      }
    }

    // Check for safety filter issues (common with non-English content)
    if (videoResponse && videoResponse.raiMediaFilteredCount > 0) {
      const filterReason = videoResponse.raiMediaFilteredReasons?.[0] || 'Content filtered by safety policies';
      console.error(`🛡️ Veo safety filter blocked content:`, {
        filteredCount: videoResponse.raiMediaFilteredCount,
        reasons: videoResponse.raiMediaFilteredReasons
      });

      // Provide specific guidance for audio/language issues
      let userFriendlyError = filterReason;
      if (filterReason.includes('audio')) {
        userFriendlyError = 'Video generation failed due to audio content restrictions. This often occurs with non-English text or complex narration. Try simplifying the product description or using English text.';
      }

      return {
        jobId: operationName,
        status: 'failed',
        error: userFriendlyError,
      };
    }

    // Debug exactly what structure we got
    console.log(`🔍 Expected path not found. Full response structure:`, {
      hasResponse: !!data.response,
      responseKeys: data.response ? Object.keys(data.response) : 'none',
      hasGenerateVideoResponse: !!data.response?.generateVideoResponse,
      generateVideoResponseKeys: data.response?.generateVideoResponse ? Object.keys(data.response.generateVideoResponse) : 'none'
    });

    // Fallback if no video URL found
    return {
      jobId: operationName,
      status: 'failed',
      error: 'Video URL not found in response',
    };
  }

  /**
   * Check status of mock job for testing
   */
  private async getJobStatusMock(jobId: string): Promise<VideoJobStatus> {
    try {
      // Extract timestamp from jobId to simulate progression
      const timestampMatch = jobId.match(/veo-demo-(\d+)-/);
      if (!timestampMatch) {
        return {
          jobId,
          status: 'failed',
          error: 'Cannot parse job timestamp',
        };
      }

      const jobStartTime = parseInt(timestampMatch[1]);
      const elapsed = Date.now() - jobStartTime;
      const totalDuration = 15000; // 15 seconds simulation for quick testing
      
      if (elapsed < 3000) {
        // First 3 seconds: pending
        return {
          jobId,
          status: 'pending',
          progress: 0,
        };
      } else if (elapsed < totalDuration) {
        // 3 seconds to 15 seconds: processing
        const progress = Math.min(Math.floor((elapsed - 3000) / (totalDuration - 3000) * 100), 99);
        return {
          jobId,
          status: 'processing',
          progress,
        };
      } else {
        // After 15 seconds: completed with mock video URL (using a real sample video for testing)
        return {
          jobId,
          status: 'completed',
          progress: 100,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        };
      }

    } catch (error) {
      console.error('Mock job status check failed:', error);
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

    if (request.prompt && request.prompt.length > 4000) {
      errors.push('Prompt must be 4000 characters or less (Veo 3 API limit: 1024 tokens)');
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