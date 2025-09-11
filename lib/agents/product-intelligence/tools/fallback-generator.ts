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
      commercialStrategy: {
        keyMessages: {
          headline: "Quality Product",
          tagline: "Reliable and Practical",
          supportingMessages: ["Quality you can trust", "Practical solution"],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.PRIDE,
            description: "Reliability and dependability",
            intensity: "moderate" as const,
          },
          secondary: [],
        },
        callToAction: {
          primary: "Learn More",
          secondary: ["View Details"],
        },
        storytelling: {
          narrative: "Finding a reliable solution",
          conflict: "Need for dependable product",
          resolution: "Peace of mind with quality choice",
        },
        keyScenes: {
          scenes: [
            {
              id: "opening",
              title: "Opening",
              description: "Person searching for quality product",
              duration: "3-5 seconds",
              purpose: "hook audience",
            },
            {
              id: "showcase",
              title: "Product Showcase",
              description: "Close-up of product features",
              duration: "5-8 seconds",
              purpose: "showcase product features",
            },
            {
              id: "solution",
              title: "Problem Solution", 
              description: "Product solving user needs",
              duration: "4-6 seconds",
              purpose: "demonstrate value",
            },
            {
              id: "emotional",
              title: "Emotional Moment",
              description: "Satisfaction with purchase",
              duration: "3-4 seconds",
              purpose: "emotional connection",
            },
            {
              id: "cta",
              title: "Call to Action",
              description: "Product logo and availability",
              duration: "2-3 seconds",
              purpose: "drive action",
            },
          ],
        },
      },
      visualPreferences: {
        overallStyle: VisualStyle.CLASSIC,
        colorPalette: {
          primary: [{ name: "blue", hex: "#3b82f6", role: ColorRole.PRIMARY }],
          secondary: [{ name: "gray", hex: "#6b7280", role: ColorRole.SECONDARY }],
          accent: [{ name: "white", hex: "#ffffff", role: ColorRole.ACCENT }],
        },
        mood: Mood.CALM,
        composition: Composition.CLEAN,
        lighting: Lighting.NATURAL,
        environment: ["neutral background"],
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