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
        id: request.sessionId,
        category: ProductCategory.OTHER,
        subcategory: "unknown",
        name: "Product",
        description: "Product analysis could not be completed",
        keyFeatures: ["Unable to analyze"],
        materials: ["Unknown"],
        colors: [{ name: "unknown", hex: "#808080", role: ColorRole.PRIMARY }],
        usageContext: ["General use"],
        seasonality: "year-round",
      },
      targetAudience: {
        primary: {
          demographics: {
            ageRange: "18-65",
            gender: Gender.UNISEX,
            incomeLevel: IncomeLevel.MID_RANGE,
            location: ["general"],
            lifestyle: ["general"],
          },
          psychographics: {
            values: ["quality"],
            interests: ["general"],
            personalityTraits: ["practical"],
            motivations: ["functionality"],
          },
          behaviors: {
            shoppingHabits: ["value-conscious"],
            mediaConsumption: ["mixed"],
            brandLoyalty: BrandLoyalty.MEDIUM,
            decisionFactors: ["price", "quality"],
          },
        },
      },
      positioning: {
        brandPersonality: {
          traits: ["practical"],
          tone: BrandTone.FRIENDLY,
          voice: "approachable and honest",
        },
        valueProposition: {
          primaryBenefit: "Reliable solution",
          supportingBenefits: ["Quality", "Value"],
          differentiators: ["Dependable"],
        },
        competitiveAdvantages: {
          functional: ["Reliable performance"],
          emotional: ["Peace of mind"],
          experiential: ["Straightforward experience"],
        },
        marketPosition: {
          tier: MarketTier.LUXURY,
          marketShare: "challenger" as const,
        },
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