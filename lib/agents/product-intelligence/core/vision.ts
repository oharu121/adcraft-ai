/**
 * Product Intelligence Agent - Vision Functions
 *
 * Specialized functions for analyzing product images using Vertex AI Gemini Pro Vision
 * with structured output for product analysis and cost tracking.
 */

import { VertexAIService } from "@/lib/services/vertex-ai";
import { GeminiClient } from "@/lib/services/gemini";
import { AppModeConfig } from "@/lib/config/app-mode";
import { SceneGenerator } from "../tools/scene-generator";
import { MockDataGenerator } from "../tools/mock-data-generator";
import { FallbackGenerator } from "../tools/fallback-generator";
import { PromptBuilder } from "../tools/prompt-builder";
import { ResponseParser } from "../tools/response-parser";
import { getLocaleConstants } from "@/lib/constants/locale-constants";
import {
  ProductAnalysis,
  VisionAnalysisRequest,
  VisionAnalysisResponse,
} from "../types";
import { EmotionalTriggerType, ProductCategory } from "../enums";

// Initialize dependencies (but not as singletons)
let vertexAIInstance: VertexAIService | null = null;
let geminiClientInstance: GeminiClient | null = null;
let sceneGeneratorInstance: SceneGenerator | null = null;

function getVertexAI(): VertexAIService {
  if (!vertexAIInstance) {
    vertexAIInstance = VertexAIService.getInstance();
  }
  return vertexAIInstance;
}

function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiClient(getVertexAI());
  }
  return geminiClientInstance;
}

function getSceneGenerator(): SceneGenerator {
  if (!sceneGeneratorInstance) {
    // Create a simple API client interface for SceneGenerator
    const apiClient = {
      callGeminiAPI: async (prompt: string): Promise<any> => {
        try {
          const response = await getGeminiClient().generateTextOnly(prompt);
          return JSON.parse(response.text);
        } catch (error) {
          console.warn("Failed to call Gemini API for scene generation:", error);
          throw error;
        }
      },
    };
    sceneGeneratorInstance = new SceneGenerator(apiClient);
  }
  return sceneGeneratorInstance;
}

/**
 * Analyze product image with Gemini Pro Vision
 */
export async function analyzeProductImage(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResponse> {
  const startTime = Date.now();

  try {
    // Check mode directly from AppModeConfig
    const shouldUseMockMode = AppModeConfig.getMode() === "demo";

    if (shouldUseMockMode) {
      console.log("[GEMINI VISION] Using mock mode for analysis");
      return await generateMockAnalysis(request, startTime);
    }

    console.log("[GEMINI VISION] Using real Vertex AI for analysis");

    // Generate analysis prompt
    const prompt = PromptBuilder.generateAnalysisPrompt(request);

    // Make API call to Gemini Pro Vision
    const geminiResponse = await getGeminiClient().generateWithVision(prompt, request.imageData);

    // Parse and validate the response
    const parseResult = ResponseParser.parseWithValidation(geminiResponse.text, request);

    // Calculate processing time and cost
    const processingTime = Date.now() - startTime;
    const cost = calculateCost(geminiResponse.usage);

    // Update cost in metadata
    parseResult.analysis.metadata.processingTime = processingTime;
    parseResult.analysis.metadata.cost.current = cost;
    parseResult.analysis.metadata.cost.total = cost;
    parseResult.analysis.metadata.cost.breakdown.imageAnalysis = cost;

    return {
      analysis: parseResult.analysis,
      processingTime,
      cost,
      confidence: parseResult.confidence,
      rawResponse: geminiResponse.text,
      warnings: parseResult.warnings,
    };
  } catch (error) {
    console.error("Gemini Vision analysis failed, using fallback:", error);

    // Generate fallback analysis instead of throwing error
    const processingTime = Date.now() - startTime;
    const fallbackAnalysis = generateFallbackAnalysis(request);

    // Update fallback metadata
    fallbackAnalysis.metadata.processingTime = processingTime;
    fallbackAnalysis.metadata.cost.current = 0.0;
    fallbackAnalysis.metadata.cost.total = 0.0;

    return {
      analysis: fallbackAnalysis,
      processingTime,
      cost: 0.0,
      confidence: 0.3, // Low confidence for fallback
      rawResponse: "Fallback analysis generated due to API failure",
      warnings: ["Analysis failed, using fallback data"],
    };
  }
}

/**
 * Generate mock analysis for development/demo
 */
async function generateMockAnalysis(
  request: VisionAnalysisRequest,
  startTime: number
): Promise<VisionAnalysisResponse> {
  const mockDataGenerator = new MockDataGenerator();
  return await mockDataGenerator.generateMockAnalysis({
    request,
    startTime,
  });
}


/**
 * Calculate cost based on token usage
 */
function calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
  // Cost configuration (per 1000 tokens)
  const COST_CONFIG = {
    inputTokenCost: 0.000125, // $0.000125 per 1k input tokens (Gemini Vision)
    outputTokenCost: 0.000375, // $0.000375 per 1k output tokens
  };

  const inputCost = (usage.input_tokens / 1000) * COST_CONFIG.inputTokenCost;
  const outputCost = (usage.output_tokens / 1000) * COST_CONFIG.outputTokenCost;

  return inputCost + outputCost;
}

/**
 * Infer product category from product name
 */
export function inferProductCategory(productName?: string): ProductCategory {
  if (!productName) return ProductCategory.OTHER;

  const name = productName.toLowerCase();

  if (
    name.includes("phone") ||
    name.includes("iphone") ||
    name.includes("samsung") ||
    name.includes("pixel")
  ) {
    return ProductCategory.ELECTRONICS;
  }
  if (
    name.includes("shoe") ||
    name.includes("nike") ||
    name.includes("adidas") ||
    name.includes("sneaker") ||
    name.includes("boot")
  ) {
    return ProductCategory.FASHION;
  }
  if (
    name.includes("coffee") ||
    name.includes("tea") ||
    name.includes("drink") ||
    name.includes("beverage") ||
    name.includes("starbucks")
  ) {
    return ProductCategory.FOOD_BEVERAGE;
  }
  if (
    name.includes("car") ||
    name.includes("tesla") ||
    name.includes("bmw") ||
    name.includes("toyota") ||
    name.includes("honda")
  ) {
    return ProductCategory.AUTOMOTIVE;
  }
  if (name.includes("book") || name.includes("magazine") || name.includes("kindle")) {
    return ProductCategory.BOOKS_MEDIA;
  }

  return ProductCategory.OTHER;
}

/**
 * Infer product subcategory from product name
 */
export function inferProductSubcategory(productName?: string): string {
  if (!productName) return "general product";

  const name = productName.toLowerCase();
  const category = inferProductCategory(productName);

  switch (category) {
    case ProductCategory.ELECTRONICS:
      if (name.includes("phone")) return "smartphone";
      if (name.includes("laptop")) return "laptop computer";
      return "consumer electronics";
    case ProductCategory.FASHION:
      if (name.includes("shoe") || name.includes("sneaker")) return "athletic footwear";
      if (name.includes("shirt")) return "apparel";
      return "fashion accessory";
    case ProductCategory.FOOD_BEVERAGE:
      if (name.includes("coffee")) return "coffee product";
      if (name.includes("tea")) return "tea product";
      return "beverage";
    case ProductCategory.AUTOMOTIVE:
      return "vehicle";
    default:
      return "consumer product";
  }
}

/**
 * Generate contextual product description
 */
export function generateProductDescription(
  productName?: string,
  locale: "en" | "ja" = "en"
): string {
  const localeConstants = getLocaleConstants(locale);

  if (!productName) {
    return localeConstants.sampleProductDescription;
  }

  const category = inferProductCategory(productName);
  const description =
    localeConstants.categoryDescriptions[category] || localeConstants.categoryDescriptions.default;

  return `${productName}${description}`;
}

/**
 * Generate contextual key features
 */
export function generateKeyFeatures(productName?: string, locale: "en" | "ja" = "en"): string[] {
  const localeConstants = getLocaleConstants(locale);

  if (!productName) {
    return localeConstants.defaultFeatures;
  }

  const category = inferProductCategory(productName);
  return localeConstants.categoryFeatures[category] || localeConstants.categoryFeatures.default;
}

/**
 * Detect MIME type from base64 image data
 */
export function detectMimeTypeFromBase64(base64Data: string): string {
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
  console.warn("[GEMINI VISION] Unknown image format, defaulting to JPEG");
  return "image/jpeg";
}

/**
 * Generate fallback analysis when parsing fails
 */
export function generateFallbackAnalysis(request: VisionAnalysisRequest): ProductAnalysis {
  const fallbackGenerator = new FallbackGenerator();
  return fallbackGenerator.generateFallbackAnalysis({ request });
}

/**
 * Calculate confidence score based on analysis completeness
 */
export function calculateConfidence(analysis: ProductAnalysis, rawResponse: string): number {
  let score = 0.5; // Base score

  // Check completeness of key sections (simplified structure)
  if (analysis.product.keyFeatures.length > 0) score += 0.15;
  if (analysis.targetAudience.ageRange !== "unknown") score += 0.15;
  if (analysis.keyMessages.headline !== "unknown") score += 0.15;

  // Check response quality indicators
  if (rawResponse.length > 1000) score += 0.1;

  // Check for product-specific details
  if (analysis.product.description.length > 50) score += 0.1;

  return Math.min(score, 0.95); // Cap at 95%
}

/**
 * Validate analysis completeness and return warnings
 */
export function validateAnalysisCompleteness(analysis: ProductAnalysis): string[] {
  const warnings: string[] = [];

  if (analysis.product.keyFeatures.length === 0) {
    warnings.push("No product features identified");
  }

  // Removed colors check - not part of simplified structure

  if (analysis.targetAudience.ageRange === "unknown") {
    warnings.push("Target age range not determined");
  }

  if (analysis.metadata.confidenceScore < 0.7) {
    warnings.push("Low confidence analysis - consider manual review");
  }

  return warnings;
}
