/**
 * Video Producer Production Bridge
 *
 * Integrates Zara's final production step with existing video generation pipeline
 */

import type { Locale } from "@/lib/dictionaries";
import type {
  NarrativeStyle,
  MusicGenre,
  VideoFormat
} from "@/lib/stores/video-producer-store";
import {
  buildProductionContext,
  buildEightSecondOptimizedPrompt,
  buildExtendedDurationPrompt,
  type DavidHandoffData
} from "../tools/prompt-builder";
import * as fs from 'fs';
import * as path from 'path';

export interface VideoProductionRequest {
  sessionId: string;
  locale: Locale;
  davidHandoff: DavidHandoffData;
  selectedNarrativeStyle: NarrativeStyle;
  selectedMusicGenre: MusicGenre;
  selectedVideoFormat: VideoFormat;
}

export interface VideoProductionResponse {
  success: boolean;
  data?: {
    jobId: string;
    sessionId: string;
    status: string;
    estimatedCompletionTime?: number;
    estimatedCost: number;
    videoUrl?: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}

/**
 * Production Bridge Service
 *
 * Handles the integration between Zara's workflow and existing video generation infrastructure
 */
export class ProductionBridgeService {
  private static instance: ProductionBridgeService;

  // Configuration: Toggle between 8-second optimized and extended duration modes
  private static USE_EXTENDED_DURATION = false; // Set to true when duration constraints are lifted
  private static EXTENDED_DURATION_TARGET = 30; // seconds

  static getInstance(): ProductionBridgeService {
    if (!ProductionBridgeService.instance) {
      ProductionBridgeService.instance = new ProductionBridgeService();
    }
    return ProductionBridgeService.instance;
  }

  /**
   * Write debug data to output directory
   */
  private writeDebugFile(filename: string, data: any): void {
    try {
      const outputDir = path.join(process.cwd(), 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`[Debug] Written debug data to: ${filePath}`);
    } catch (error) {
      console.error(`[Debug] Failed to write debug file ${filename}:`, error);
    }
  }

  /**
   * Start video production by bridging to existing /api/generate-video endpoint
   */
  async startProduction(request: VideoProductionRequest): Promise<VideoProductionResponse> {
    try {
      console.log("[ProductionBridge] Starting video production:", {
        sessionId: request.sessionId,
        productName: request.davidHandoff.mayaAnalysis?.productAnalysis?.name,
        narrativeStyle: request.selectedNarrativeStyle.name,
        musicGenre: request.selectedMusicGenre.name,
        videoFormat: request.selectedVideoFormat.name
      });

      // Build comprehensive production context
      const productionContext = buildProductionContext({
        davidHandoff: request.davidHandoff,
        selectedNarrativeStyle: request.selectedNarrativeStyle,
        selectedMusicGenre: request.selectedMusicGenre,
        selectedVideoFormat: request.selectedVideoFormat,
        locale: request.locale
      });

      console.log("[ProductionBridge] Built production context:", {
        promptLength: productionContext.videoGenerationRequest.prompt.length,
        duration: productionContext.videoGenerationRequest.duration,
        aspectRatio: productionContext.videoGenerationRequest.aspectRatio,
        estimatedCost: productionContext.productionMetadata.estimatedCost
      });

      // Call existing video generation API
      const videoGenerationResponse = await this.callVideoGenerationAPI(
        productionContext.videoGenerationRequest
      );

      if (!videoGenerationResponse.success) {
        return {
          success: false,
          error: {
            code: 'VIDEO_GENERATION_FAILED',
            message: 'Failed to start video generation',
            details: videoGenerationResponse.error
          },
          timestamp: Date.now()
        };
      }

      // Success response
      return {
        success: true,
        data: {
          jobId: videoGenerationResponse.data.jobId,
          sessionId: videoGenerationResponse.data.sessionId,
          status: videoGenerationResponse.data.status,
          estimatedCompletionTime: videoGenerationResponse.data.estimatedCompletionTime,
          estimatedCost: videoGenerationResponse.data.estimatedCost,
          message: "Video production started successfully! Your commercial is being generated with all the creative elements you selected."
        },
        timestamp: Date.now()
      };

    } catch (error) {
      console.error("[ProductionBridge] Production failed:", error);

      return {
        success: false,
        error: {
          code: 'PRODUCTION_BRIDGE_ERROR',
          message: 'Failed to start video production',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * Call existing video generation API
   */
  private async callVideoGenerationAPI(videoRequest: {
    prompt: string;
    duration: number;
    aspectRatio: "16:9" | "9:16";
    style: string;
  }): Promise<any> {
    try {
      // Get the current host for the API call
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      console.log("[ProductionBridge] Calling video generation API:", baseUrl);
      console.log("[ProductionBridge] Request payload:", {
        prompt: videoRequest.prompt.substring(0, 200) + '...',
        promptLength: videoRequest.prompt.length,
        duration: videoRequest.duration,
        aspectRatio: videoRequest.aspectRatio,
        style: videoRequest.style
      });

      // Write full payload to debug file
      this.writeDebugFile('veo-payload.json', {
        timestamp: new Date().toISOString(),
        fullPayload: videoRequest,
        metadata: {
          promptLength: videoRequest.prompt.length,
          hasPrompt: !!videoRequest.prompt,
          promptPreview: videoRequest.prompt.substring(0, 500)
        }
      });

      const response = await fetch(`${baseUrl}/api/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[ProductionBridge] Video generation API error details:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          fullError: JSON.stringify(errorData, null, 2)
        });

        // Write error response to debug file
        this.writeDebugFile('veo-response.json', {
          timestamp: new Date().toISOString(),
          success: false,
          httpStatus: response.status,
          httpStatusText: response.statusText,
          errorResponse: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });

        throw new Error(`Video generation API failed: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log("[ProductionBridge] Video generation API response:", {
        success: responseData.success,
        jobId: responseData.data?.jobId,
        status: responseData.data?.status
      });

      // Write success response to debug file
      this.writeDebugFile('veo-response.json', {
        timestamp: new Date().toISOString(),
        success: true,
        httpStatus: response.status,
        httpStatusText: response.statusText,
        response: responseData,
        headers: Object.fromEntries(response.headers.entries())
      });

      return responseData;

    } catch (error) {
      console.error("[ProductionBridge] API call failed:", error);
      throw error;
    }
  }

  /**
   * Get video production status
   * Bridges to existing job tracking
   */
  async getProductionStatus(jobId: string): Promise<{
    success: boolean;
    data?: {
      status: string;
      progress: number;
      videoUrl?: string;
      estimatedTimeRemaining?: number;
      cost: number;
    };
    error?: any;
  }> {
    try {
      // Get the current host for the API call
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Status API failed: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData;

    } catch (error) {
      console.error("[ProductionBridge] Status check failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Estimate production cost based on context
   */
  estimateProductionCost(
    davidHandoff: DavidHandoffData,
    narrativeStyle: NarrativeStyle,
    musicGenre: MusicGenre,
    videoFormat: VideoFormat
  ): number {
    // Base cost for video generation
    let baseCost = 2.0;

    // Adjust based on video format
    switch (videoFormat.aspectRatio) {
      case "16:9":
        baseCost *= 1.0; // Standard
        break;
      case "9:16":
        baseCost *= 1.1; // Slightly more complex
        break;
    }

    // Adjust based on resolution
    if (videoFormat.resolution === "1080p") {
      baseCost *= 1.2; // Higher quality
    }

    // Complex narrative styles may cost more
    if (narrativeStyle.id === "dramatic-cinematic" || narrativeStyle.id === "sophisticated-elegant") {
      baseCost *= 1.1;
    }

    // Scene architecture complexity
    const sceneCount = davidHandoff.sceneArchitecture?.length || 2;
    if (sceneCount > 3) {
      baseCost *= 1.15; // More complex scenes
    }

    // Round to 2 decimal places
    return Math.round(baseCost * 100) / 100;
  }

  /**
   * Prepare production metadata for tracking
   */
  prepareProductionMetadata(request: VideoProductionRequest) {
    const estimatedCost = this.estimateProductionCost(
      request.davidHandoff,
      request.selectedNarrativeStyle,
      request.selectedMusicGenre,
      request.selectedVideoFormat
    );

    return {
      sessionId: request.sessionId,
      productImage: request.davidHandoff.productImage,
      productName: request.davidHandoff.mayaAnalysis?.productAnalysis?.name,
      targetAudience: request.davidHandoff.mayaAnalysis?.strategicInsights?.targetAudience,
      creativeDirection: request.davidHandoff.creativeDirection?.name,
      narrativeStyle: request.selectedNarrativeStyle.name,
      musicGenre: request.selectedMusicGenre.name,
      videoFormat: request.selectedVideoFormat.name,
      estimatedCost,
      locale: request.locale,
      timestamp: Date.now()
    };
  }
}

export default ProductionBridgeService;