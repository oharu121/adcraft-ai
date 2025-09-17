import { GoogleAuth } from "google-auth-library";
import { CloudStorageService } from "./cloud-storage";

/**
 * Imagen API interfaces for TypeScript support
 */
export interface ImagenGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  model?: 'imagen-3' | 'imagen-4' | 'imagen-4-ultra';
  imageCount?: number;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | '16:9' | '4:3' | '9:16';
  safetyFilter?: 'strict' | 'moderate' | 'permissive';
  seed?: number;
  guidanceScale?: number;
  inferenceSteps?: number;
  width?: number;
  height?: number;
  language?: 'en' | 'ja';
}

export interface ImagenGenerationResponse {
  images: GeneratedImage[];
  metadata: GenerationMetadata;
  cost: CostInfo;
}

export interface GeneratedImage {
  imageData: string; // Base64 encoded image data
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  safetyRating?: SafetyRating;
  cloudStorageUrl?: string;
  signedUrl?: string;
  fileName?: string;
}

export interface GenerationMetadata {
  model: string;
  version: string;
  prompt: string;
  negativePrompt?: string;
  parameters: {
    seed?: number;
    guidanceScale: number;
    inferenceSteps: number;
    aspectRatio: string;
    imageCount: number;
  };
  processingTime: number;
  generatedAt: string;
  requestId: string;
}

export interface SafetyRating {
  category: string;
  probability: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
  blocked: boolean;
}

export interface CostInfo {
  modelCost: number;
  storageCost: number;
  totalCost: number;
  currency: string;
  model: string;
}

/**
 * Imagen Service for generating high-quality images using Google Cloud Imagen API
 * Supports both demo mode for testing and real mode for production
 */
export class ImagenService {
  private static instance: ImagenService;
  private auth: GoogleAuth | null = null;
  private projectId: string;
  private location: string;
  private endpoint: string;
  private isMockMode: boolean;
  private cloudStorage: CloudStorageService;

  private constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || "";
    this.location = process.env.GCP_REGION || "us-central1";
    this.isMockMode =
      process.env.NODE_ENV === "development" &&
      (process.env.ENABLE_MOCK_MODE === "true" || !this.projectId);

    if (!this.projectId && !this.isMockMode) {
      throw new Error("GCP_PROJECT_ID environment variable is required for production mode");
    }

    // Set mock project ID if in mock mode
    if (this.isMockMode && !this.projectId) {
      this.projectId = "adcraft-ai-mock";
      console.log("[IMAGEN] Using mock project ID for local development");
    }

    this.endpoint = `https://${this.location}-aiplatform.googleapis.com`;
    this.cloudStorage = CloudStorageService.getInstance();

    // Initialize Google Auth only if not in mock mode
    if (!this.isMockMode) {
      this.auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
    } else {
      console.log("[IMAGEN] Running in mock mode - using demo responses");
    }
  }

  /**
   * Get singleton instance of ImagenService
   */
  public static getInstance(): ImagenService {
    if (!ImagenService.instance) {
      ImagenService.instance = new ImagenService();
    }
    return ImagenService.instance;
  }

  /**
   * Generate images using Imagen API
   */
  public async generateImages(
    request: ImagenGenerationRequest
  ): Promise<ImagenGenerationResponse> {
    const startTime = Date.now();
    const requestId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (this.isMockMode) {
        console.log("[IMAGEN] Using mock mode for image generation");
        return await this.generateMockImages(request, requestId, startTime);
      }

      console.log("[IMAGEN] Using real Imagen API for image generation");
      return await this.generateRealImages(request, requestId, startTime);

    } catch (error) {
      console.error("[IMAGEN] Error in image generation:", error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate real images using Imagen API
   */
  private async generateRealImages(
    request: ImagenGenerationRequest,
    requestId: string,
    startTime: number
  ): Promise<ImagenGenerationResponse> {
    if (!this.auth) {
      throw new Error("Google Auth not initialized");
    }

    // Get access token
    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error("Failed to get access token");
    }

    // Determine model endpoint
    const model = request.model || 'imagen-3';
    const modelPath = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}`;

    // Build request payload
    const payload = this.buildImagenPayload(request);

    // Make API request
    const response = await fetch(
      `${this.endpoint}/v1/${modelPath}:predict`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Process the response
    return await this.processImagenResponse(data, request, requestId, startTime);
  }

  /**
   * Generate mock images for demo mode
   */
  private async generateMockImages(
    request: ImagenGenerationRequest,
    requestId: string,
    startTime: number
  ): Promise<ImagenGenerationResponse> {
    // Simulate API processing time
    const processingTime = 2000 + Math.random() * 3000; // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));

    const imageCount = request.imageCount || 1;
    const images: GeneratedImage[] = [];

    // Generate mock images
    for (let i = 0; i < imageCount; i++) {
      const mockImage = this.createMockImage(request, i);
      images.push(mockImage);
    }

    const totalTime = Date.now() - startTime;

    // Calculate mock costs
    const cost = this.calculateImagenCost(request, true);

    const response: ImagenGenerationResponse = {
      images,
      metadata: {
        model: request.model || 'imagen-3',
        version: "demo-1.0.0",
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        parameters: {
          seed: request.seed,
          guidanceScale: request.guidanceScale || 7.5,
          inferenceSteps: request.inferenceSteps || 50,
          aspectRatio: request.aspectRatio || 'square',
          imageCount: imageCount,
        },
        processingTime: totalTime,
        generatedAt: new Date().toISOString(),
        requestId,
      },
      cost,
    };

    console.log(`[IMAGEN DEMO] Generated ${imageCount} mock images in ${totalTime}ms`);
    return response;
  }

  /**
   * Create mock image for demo mode
   */
  private createMockImage(request: ImagenGenerationRequest, index: number): GeneratedImage {
    const { width, height } = this.getDimensions(request.aspectRatio, request.width, request.height);
    
    // Create a realistic-looking placeholder URL
    const imageId = `mock-img-${Date.now()}-${index}`;
    const fileName = `generated-${imageId}.png`;
    
    // Generate mock base64 data (1x1 transparent PNG)
    const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    return {
      imageData: mockBase64,
      mimeType: "image/png",
      width,
      height,
      fileSize: this.estimateFileSize(width, height, "png"),
      cloudStorageUrl: `https://storage.googleapis.com/adcraft-demo-assets/${fileName}`,
      signedUrl: `https://storage.googleapis.com/adcraft-demo-assets/${fileName}?demo=true&expires=${Date.now() + 3600000}`,
      fileName,
      safetyRating: {
        category: "SAFE_CONTENT",
        probability: "NEGLIGIBLE",
        blocked: false,
      },
    };
  }

  /**
   * Build Imagen API payload
   */
  private buildImagenPayload(request: ImagenGenerationRequest): any {
    const { width, height } = this.getDimensions(request.aspectRatio, request.width, request.height);
    
    // Build instances array for Imagen API
    const instances = [{
      prompt: request.prompt,
      ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
      image_count: request.imageCount || 1,
      aspect_ratio: request.aspectRatio || 'square',
      ...(request.seed && { seed: request.seed }),
      safety_filter_level: request.safetyFilter || 'moderate',
      language: request.language || 'en',
    }];

    // Build parameters
    const parameters = {
      guidance_scale: request.guidanceScale || 7.5,
      inference_steps: request.inferenceSteps || 50,
      ...(width && { width }),
      ...(height && { height }),
    };

    return {
      instances,
      parameters,
    };
  }

  /**
   * Process Imagen API response
   */
  private async processImagenResponse(
    data: any,
    request: ImagenGenerationRequest,
    requestId: string,
    startTime: number
  ): Promise<ImagenGenerationResponse> {
    const predictions = data.predictions || [];
    const images: GeneratedImage[] = [];

    // Process each generated image
    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      
      if (prediction.bytesBase64Encoded) {
        const image = await this.processGeneratedImage(
          prediction,
          request,
          i
        );
        images.push(image);
      }
    }

    const totalTime = Date.now() - startTime;
    const cost = this.calculateImagenCost(request, false);

    return {
      images,
      metadata: {
        model: request.model || 'imagen-3',
        version: "1.0.0",
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        parameters: {
          seed: request.seed,
          guidanceScale: request.guidanceScale || 7.5,
          inferenceSteps: request.inferenceSteps || 50,
          aspectRatio: request.aspectRatio || 'square',
          imageCount: request.imageCount || 1,
        },
        processingTime: totalTime,
        generatedAt: new Date().toISOString(),
        requestId,
      },
      cost,
    };
  }

  /**
   * Process individual generated image and upload to Cloud Storage
   */
  private async processGeneratedImage(
    prediction: any,
    request: ImagenGenerationRequest,
    index: number
  ): Promise<GeneratedImage> {
    const imageData = prediction.bytesBase64Encoded;
    const mimeType = prediction.mimeType || "image/png";
    const { width, height } = this.getDimensions(request.aspectRatio, request.width, request.height);

    // Convert base64 to buffer for storage
    const imageBuffer = Buffer.from(imageData, 'base64');
    const fileName = `generated-${Date.now()}-${index}.png`;

    try {
      // Upload to Cloud Storage
      const uploadResult = await this.cloudStorage.uploadFile(
        imageBuffer,
        fileName,
        mimeType,
        'generated-images'
      );

      return {
        imageData,
        mimeType,
        width,
        height,
        fileSize: uploadResult.size,
        cloudStorageUrl: uploadResult.publicUrl,
        signedUrl: uploadResult.signedUrl,
        fileName: uploadResult.fileName,
        safetyRating: prediction.safetyRatings?.[0] || {
          category: "SAFE_CONTENT",
          probability: "NEGLIGIBLE",
          blocked: false,
        },
      };

    } catch (storageError) {
      console.warn("[IMAGEN] Failed to upload to Cloud Storage:", storageError);
      
      // Return image data without storage URLs
      return {
        imageData,
        mimeType,
        width,
        height,
        fileSize: imageBuffer.length,
        safetyRating: prediction.safetyRatings?.[0] || {
          category: "SAFE_CONTENT",
          probability: "NEGLIGIBLE",
          blocked: false,
        },
      };
    }
  }

  /**
   * Get image dimensions based on aspect ratio
   */
  private getDimensions(
    aspectRatio?: string,
    customWidth?: number,
    customHeight?: number
  ): { width: number; height: number } {
    if (customWidth && customHeight) {
      return { width: customWidth, height: customHeight };
    }

    const ratios = {
      'square': { width: 1024, height: 1024 },
      'landscape': { width: 1024, height: 768 },
      'portrait': { width: 768, height: 1024 },
      '16:9': { width: 1024, height: 576 },
      '4:3': { width: 1024, height: 768 },
      '9:16': { width: 576, height: 1024 },
    };

    return ratios[aspectRatio as keyof typeof ratios] || ratios.square;
  }

  /**
   * Calculate Imagen generation cost
   */
  private calculateImagenCost(request: ImagenGenerationRequest, isDemo: boolean): CostInfo {
    const model = request.model || 'imagen-3';
    const imageCount = request.imageCount || 1;
    
    // Model pricing (per image)
    const modelPricing = {
      'imagen-3': isDemo ? 0.01 : 0.03,
      'imagen-4': isDemo ? 0.01 : 0.04,
      'imagen-4-ultra': isDemo ? 0.02 : 0.06,
    };

    const baseModelCost = modelPricing[model] || modelPricing['imagen-3'];
    const modelCost = baseModelCost * imageCount;
    
    // Storage cost (minimal for generated images)
    const storageCost = isDemo ? 0.001 : 0.01;
    
    const totalCost = modelCost + storageCost;

    return {
      modelCost,
      storageCost,
      totalCost,
      currency: "USD",
      model,
    };
  }

  /**
   * Estimate file size based on dimensions
   */
  private estimateFileSize(width: number, height: number, format: string): number {
    const pixels = width * height;
    const bytesPerPixel = format.toLowerCase() === 'png' ? 4 : 3; // PNG has alpha channel
    return pixels * bytesPerPixel;
  }

  /**
   * Health check for Imagen service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (this.isMockMode) {
        console.log("[IMAGEN] Health check passed (mock mode)");
        return true;
      }

      if (!this.auth) {
        return false;
      }

      // Try to get access token to verify authentication
      const client = await this.auth.getClient();
      await client.getAccessToken();
      
      console.log("[IMAGEN] Health check passed (real mode)");
      return true;
    } catch (error) {
      console.error("[IMAGEN] Health check failed:", error);
      return false;
    }
  }

  /**
   * Check if service is running in mock mode
   */
  public isMock(): boolean {
    return this.isMockMode;
  }

  /**
   * Get service configuration
   */
  public getConfig() {
    return {
      projectId: this.projectId,
      location: this.location,
      endpoint: this.endpoint,
      isMockMode: this.isMockMode,
    };
  }
}