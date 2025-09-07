/**
 * Mock Data Generator for Product Intelligence
 * 
 * Generates comprehensive mock analysis data for testing and development purposes.
 * Provides realistic product analysis that adapts to different product categories.
 */

import {
  ProductCategory,
  ProductAnalysis,
  Gender,
  IncomeLevel,
  BrandLoyalty,
  ColorRole,
  VisualStyle,
  Mood,
  Composition,
  Lighting,
} from "@/types/product-intelligence";
import { getLocaleConstants } from "../constants/locale-constants";
import { PositioningGenerator } from "./positioning-generator";
import type { VisionAnalysisRequest, VisionAnalysisResponse } from "../gemini-vision";

/**
 * Mock data generation options
 */
export interface MockDataGenerationOptions {
  request: VisionAnalysisRequest;
  startTime: number;
  positioningGenerator: PositioningGenerator;
  generateCommercialStrategy: (
    category: ProductCategory,
    productName?: string,
    locale?: "en" | "ja"
  ) => Promise<any>;
}

/**
 * Mock Data Generator class
 */
export class MockDataGenerator {
  /**
   * Generate comprehensive mock analysis for testing
   */
  public async generateMockAnalysis(options: MockDataGenerationOptions): Promise<VisionAnalysisResponse> {
    const { request, startTime, positioningGenerator, generateCommercialStrategy } = options;
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Infer category for dynamic content generation
    const category = this.inferProductCategory(request.productName);
    const localeConstants = getLocaleConstants(request.locale);

    const mockAnalysis: ProductAnalysis = {
      // 📦 Product Analysis Data
      product: {
        id: request.sessionId,
        category: category,
        subcategory: this.inferProductSubcategory(request.productName),
        name: request.productName || localeConstants.sampleProductName,
        // Product Summary for UI display - adapted to product
        description: this.generateProductDescription(request.productName, request.locale),
        // Key Features (bullet points) - adapted to product
        keyFeatures: this.generateKeyFeatures(request.productName, request.locale),
        materials: ["titanium alloy", "ceramic glass", "premium aluminum"],
        colors: [
          { name: "space titanium", hex: "#2d3748", role: ColorRole.PRIMARY },
          { name: "arctic silver", hex: "#e2e8f0", role: ColorRole.SECONDARY },
          { name: "deep ocean", hex: "#2563eb", role: ColorRole.ACCENT },
        ],
        usageContext: localeConstants.usageContext,
        seasonality: "year-round",
      },
      // Target Audience (1-line summary)
      targetAudience: {
        primary: {
          demographics: {
            ageRange: "28-45",
            gender: Gender.UNISEX,
            incomeLevel: IncomeLevel.LUXURY,
            location: ["urban", "business districts"],
            lifestyle: ["executive professionals", "tech entrepreneurs", "creative directors"],
          },
          psychographics: {
            values: ["innovation leadership", "professional excellence", "premium quality"],
            interests: ["cutting-edge technology", "professional productivity", "status symbols"],
            personalityTraits: ["ambitious", "sophisticated", "performance-driven"],
            motivations: ["career advancement", "technological edge", "professional prestige"],
          },
          behaviors: {
            shoppingHabits: ["premium-first", "research-intensive", "early adopter"],
            mediaConsumption: ["business media", "tech publications", "professional networks"],
            brandLoyalty: BrandLoyalty.HIGH,
            decisionFactors: ["cutting-edge features", "brand prestige", "professional utility"],
          },
        },
      },
      // Marketing positioning
      positioning: positioningGenerator.generatePositioning({
        category,
        productName: request.productName,
        locale: request.locale,
      }),
      // 🎬 Commercial Strategy Data
      commercialStrategy: await generateCommercialStrategy(
        category,
        request.productName,
        request.locale
      ),
      // Visual Style & Music & Tone
      visualPreferences: {
        overallStyle: VisualStyle.MODERN,
        colorPalette: {
          primary: [{ name: "executive midnight", hex: "#1e293b", role: ColorRole.PRIMARY }],
          secondary: [{ name: "platinum white", hex: "#f8fafc", role: ColorRole.SECONDARY }],
          accent: [{ name: "innovation gold", hex: "#f59e0b", role: ColorRole.ACCENT }],
        },
        mood: Mood.SOPHISTICATED, // Music & Tone
        composition: Composition.CLEAN,
        lighting: Lighting.NATURAL,
        environment: [
          "executive boardroom",
          "modern skyline",
          "premium workspace",
          "innovation lab",
        ],
      },
      metadata: {
        sessionId: request.sessionId,
        analysisVersion: "2.0.0",
        confidenceScore: 0.94, // Trust Score
        processingTime: Date.now() - startTime,
        cost: {
          current: 0.32,
          total: 0.32,
          breakdown: {
            imageAnalysis: 0.32,
            chatInteractions: 0,
          },
          remaining: 299.68,
          budgetAlert: false,
        },
        locale: request.locale,
        timestamp: new Date().toISOString(),
        agentInteractions: 1,
      },
    };

    return {
      analysis: mockAnalysis,
      processingTime: Date.now() - startTime,
      cost: 0.32,
      confidence: 0.94,
      warnings: [],
    };
  }

  /**
   * Infer product category from product name
   */
  private inferProductCategory(productName?: string): ProductCategory {
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
      name.includes("sneaker")
    ) {
      return ProductCategory.FASHION;
    }
    if (name.includes("coffee") || name.includes("tea") || name.includes("drink")) {
      return ProductCategory.FOOD_BEVERAGE;
    }
    if (name.includes("car") || name.includes("bmw") || name.includes("mercedes")) {
      return ProductCategory.AUTOMOTIVE;
    }
    if (name.includes("laptop") || name.includes("computer") || name.includes("tablet")) {
      return ProductCategory.ELECTRONICS;
    }
    if (name.includes("book") || name.includes("novel") || name.includes("magazine")) {
      return ProductCategory.BOOKS_MEDIA;
    }
    if (name.includes("game") || name.includes("toy") || name.includes("puzzle")) {
      return ProductCategory.TOYS_GAMES;
    }
    if (name.includes("cream") || name.includes("shampoo") || name.includes("skincare")) {
      return ProductCategory.HEALTH_BEAUTY;
    }

    return ProductCategory.OTHER;
  }

  /**
   * Infer product subcategory from product name and category
   */
  private inferProductSubcategory(productName?: string): string {
    if (!productName) return "general product";

    const name = productName.toLowerCase();
    const category = this.inferProductCategory(productName);

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
        return "general product";
    }
  }

  /**
   * Generate product description based on category and locale
   */
  private generateProductDescription(productName?: string, locale: "en" | "ja" = "en"): string {
    const localeConstants = getLocaleConstants(locale);

    if (!productName) {
      return localeConstants.sampleProductDescription;
    }

    const category = this.inferProductCategory(productName);
    const description =
      localeConstants.categoryDescriptions[category] ||
      localeConstants.categoryDescriptions.default;

    return `${productName}${description}`;
  }

  /**
   * Generate contextual key features
   */
  private generateKeyFeatures(productName?: string, locale: "en" | "ja" = "en"): string[] {
    const localeConstants = getLocaleConstants(locale);

    if (!productName) {
      return localeConstants.defaultFeatures;
    }

    const category = this.inferProductCategory(productName);
    return localeConstants.categoryFeatures[category] || localeConstants.categoryFeatures.default;
  }
}