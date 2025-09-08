/**
 * Unified Gemini Client
 *
 * Provides a unified interface for Gemini API calls that automatically
 * chooses between AI Studio and Vertex AI based on available authentication.
 */

import { GeminiAIStudioClient, type GeminiAPIResponse } from "./ai-studio";
import { VertexAIClient, VertexAIService, type VertexAIResponse } from "./vertex-ai";

/**
 * Unified response interface
 */
export interface GeminiClientResponse {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Unified Gemini Client class
 */
export class GeminiClient {
  private aiStudioClient?: GeminiAIStudioClient;
  private vertexAIClient?: VertexAIClient;

  constructor(vertexAIService?: VertexAIService) {
    // Initialize AI Studio client if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.aiStudioClient = new GeminiAIStudioClient(geminiApiKey);
    }

    // Initialize Vertex AI client if service is provided
    if (vertexAIService) {
      this.vertexAIClient = new VertexAIClient(vertexAIService);
    }
  }

  /**
   * Generate content with text and image input
   * Automatically chooses the best available API
   */
  public async generateWithVision(
    prompt: string,
    imageData: string
  ): Promise<GeminiClientResponse> {
    if (this.aiStudioClient) {
      console.log("[GEMINI CLIENT] Using AI Studio for vision generation");
      const response = await this.aiStudioClient.generateWithVision(prompt, imageData);
      return this.normalizeResponse(response);
    } else if (this.vertexAIClient) {
      console.log("[GEMINI CLIENT] Using Vertex AI for vision generation");
      const response = await this.vertexAIClient.generateWithVision(prompt, imageData);
      return this.normalizeResponse(response);
    } else {
      throw new Error("No Gemini API client available - missing API key or service account");
    }
  }

  /**
   * Generate content with text-only input
   * Automatically chooses the best available API
   */
  public async generateTextOnly(prompt: string): Promise<GeminiClientResponse> {
    if (this.aiStudioClient) {
      console.log("[GEMINI CLIENT] Using AI Studio for text generation");
      const response = await this.aiStudioClient.generateTextOnly(prompt);
      return this.normalizeResponse(response);
    } else if (this.vertexAIClient) {
      console.log("[GEMINI CLIENT] Using Vertex AI for text generation");
      const response = await this.vertexAIClient.generateTextOnly(prompt);
      return this.normalizeResponse(response);
    } else {
      throw new Error("No Gemini API client available - missing API key or service account");
    }
  }

  /**
   * Check which API clients are available
   */
  public getAvailableAPIs(): { aiStudio: boolean; vertexAI: boolean } {
    return {
      aiStudio: !!this.aiStudioClient,
      vertexAI: !!this.vertexAIClient,
    };
  }

  /**
   * Get the preferred API client name
   */
  public getPreferredAPI(): "ai-studio" | "vertex-ai" | "none" {
    if (this.aiStudioClient) return "ai-studio";
    if (this.vertexAIClient) return "vertex-ai";
    return "none";
  }

  /**
   * Normalize response from different APIs to a common format
   */
  private normalizeResponse(response: GeminiAPIResponse | VertexAIResponse): GeminiClientResponse {
    return {
      text: response.text,
      usage: response.usage,
    };
  }
}
