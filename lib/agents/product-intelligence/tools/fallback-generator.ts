/**
 * Fallback Generator for Product Intelligence
 * 
 * Generates minimal fallback analysis when parsing fails or errors occur.
 * Provides safe default values to ensure the application continues functioning.
 */

import { BrandLoyalty, BrandTone, ColorRole, Composition, EmotionalTriggerType, Gender, IncomeLevel, Lighting, MarketTier, Mood, ProductCategory, VisualStyle } from "../enums";
import { ProductAnalysis, VisionAnalysisRequest } from "../types";


/**
 * Fallback generation options
 */
export interface FallbackGenerationOptions {
  request: VisionAnalysisRequest;
}

/**
 * Fallback Generator class
 */
export class FallbackGenerator {
  /**
   * Generate minimal fallback analysis when parsing fails
   */
  public generateFallbackAnalysis(options: FallbackGenerationOptions): ProductAnalysis {
    const { request } = options;
    
    return {
      product: {
        name: "Product",
        description: "Product analysis could not be completed",
        keyFeatures: ["Unable to analyze"],
      },
      targetAudience: {
        ageRange: "18-65",
        description: "general users seeking practical solutions",
      },
      keyMessages: {
        headline: "Quality Product",
        tagline: "Reliable and Practical",
        supportingMessages: ["Quality you can trust", "Practical solution"],
      },
      metadata: {
        sessionId: request.sessionId,
        analysisVersion: "1.0.0",
        confidenceScore: 0.3, // Low confidence for fallback
        processingTime: 1000,
        cost: {
          current: 0.1,
          total: 0.1,
          breakdown: {
            imageAnalysis: 0.1,
            chatInteractions: 0,
          },
          remaining: 299.9,
          budgetAlert: false,
        },
        locale: request.locale,
        timestamp: new Date().toISOString(),
        agentInteractions: 1,
      },
    };
  }
}