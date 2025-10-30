import { GoogleAuth } from "google-auth-library";

/**
 * Vertex AI request interface for vision tasks
 */
export interface VertexAIVisionRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generation_config: {
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
  };
}

/**
 * API response interface
 */
export interface VertexAIResponse {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Vertex AI Client class
 */
export class VertexAIClient {
  private readonly vertexAI: VertexAIService;
  private readonly modelName: string;

  constructor(vertexAI: VertexAIService, modelName?: string) {
    this.vertexAI = vertexAI;
    this.modelName = modelName || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  /**
   * Generate content with text and image input
   */
  public async generateWithVision(prompt: string, imageData: string): Promise<VertexAIResponse> {
    const accessToken = await this.vertexAI.getAccessToken();
    const baseUrl = this.vertexAI.getBaseUrl();

    const mimeType = this.detectMimeTypeFromBase64(imageData);

    const request: VertexAIVisionRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],
      generation_config: {
        temperature: 0.3,
        top_p: 0.8,
        top_k: 40,
        max_output_tokens: 4096,
      },
    };

    console.log("[VERTEX AI] Using vision API with service account");

    const response = await fetch(
      `${baseUrl}/publishers/google/models/${this.modelName}:generateContent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Invalid response format from Vertex AI API");
    }

    return {
      text: result.candidates[0].content.parts[0].text,
      usage: result.usage_metadata || { input_tokens: 1000, output_tokens: 2000 },
    };
  }

  /**
   * Generate content with text-only input
   */
  public async generateTextOnly(prompt: string): Promise<VertexAIResponse> {
    const accessToken = await this.vertexAI.getAccessToken();
    const baseUrl = this.vertexAI.getBaseUrl();
    const config = this.vertexAI.getConfig();

    const request = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    };

    console.log("[VERTEX AI] Using text-only API with service account");

    const response = await fetch(
      `${baseUrl}/v1/projects/${config.projectId}/locations/${config.region}/publishers/google/models/${this.modelName}:generateContent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No content received from Vertex AI");
    }

    return {
      text: textContent,
      usage: {
        input_tokens: data.usageMetadata?.promptTokenCount || 0,
        output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  /**
   * Detect MIME type from base64 image data
   */
  private detectMimeTypeFromBase64(base64Data: string): string {
    // Check the first few characters of base64 data to detect image format
    const header = base64Data.substring(0, 10);

    // JPEG: starts with /9j/
    if (header.startsWith("/9j/")) {
      return "image/jpeg";
    }

    // PNG: starts with iVBORw0
    if (header.startsWith("iVBORw0")) {
      return "image/png";
    }

    // WebP: Look for WEBP signature (UklGR for RIFF header)
    if (header.indexOf("UklGR") === 0) {
      return "image/webp";
    }

    // Default to JPEG if unknown
    console.warn("[VERTEX AI] Unknown image format, defaulting to JPEG");
    return "image/jpeg";
  }
}

export class VertexAIService {
  private static instance: VertexAIService;
  private auth: GoogleAuth | null = null;
  private projectId: string;
  private region: string;
  private baseUrl: string;
  private isMockMode: boolean;

  private constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || "";
    this.region = process.env.GCP_REGION || "asia-northeast1";
    this.isMockMode =
      process.env.NODE_ENV === "development" &&
      (process.env.ENABLE_MOCK_MODE === "true" || !this.projectId);

    if (!this.projectId && !this.isMockMode) {
      throw new Error("GCP_PROJECT_ID environment variable is required for production mode");
    }

    // Use mock project ID if in mock mode
    if (this.isMockMode && !this.projectId) {
      this.projectId = "adcraft-ai-mock";
      console.log("[MOCK MODE] Using mock project ID for local development");
    }

    // Initialize Google Auth only if not in mock mode
    if (!this.isMockMode) {
      this.auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
    } else {
      console.log("[MOCK MODE] Skipping Google Auth initialization for local testing");
    }

    // Set base URL for Vertex AI REST API
    this.baseUrl = `https://${this.region}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.region}`;
  }

  /**
   * Get singleton instance of VertexAIService
   */
  public static getInstance(): VertexAIService {
    if (!VertexAIService.instance) {
      VertexAIService.instance = new VertexAIService();
    }
    return VertexAIService.instance;
  }

  /**
   * Get base URL for API calls
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get authentication instance
   */
  public getAuth(): GoogleAuth {
    if (!this.auth) {
      throw new Error("Google Auth not initialized - running in mock mode");
    }
    return this.auth;
  }

  /**
   * Get project configuration
   */
  public getConfig() {
    return {
      projectId: this.projectId,
      region: this.region,
    };
  }

  /**
   * Get access token for API calls
   * Returns mock token in development mode
   */
  public async getAccessToken(): Promise<string> {
    if (this.isMockMode) {
      return "mock-access-token-for-development";
    }

    if (!this.auth) {
      throw new Error("Google Auth not initialized");
    }

    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error("Failed to get access token");
    }

    return accessToken.token;
  }

  /**
   * Health check for Vertex AI service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // ALWAYS use real health check for monitoring - regardless of app mode
      await this.getAccessToken();
      console.log("[MONITORING] Vertex AI health check passed");
      return true;
    } catch (error) {
      console.error("[MONITORING] Vertex AI health check failed:", error);
      return false;
    }
  }

  /**
   * Check if service is running in mock mode
   */
  public isMock(): boolean {
    return this.isMockMode;
  }
}
