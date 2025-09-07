/**
 * Product Intelligence Agent - Gemini Pro Vision Integration
 *
 * Specialized service for analyzing product images using Vertex AI Gemini Pro Vision
 * with structured output for product analysis and cost tracking.
 */

import { VertexAIService } from "../vertex-ai";
import {
  ProductAnalysis,
  ProductCategory,
  Positioning,
  CommercialStrategy,
  KeyScenes,
} from "@/types/product-intelligence";
import {
  ColorRole,
  Gender,
  IncomeLevel,
  BrandLoyalty,
  BrandTone,
  VisualStyle,
  Mood,
  Composition,
  Lighting,
  EmotionalTriggerType,
  MarketTier,
} from "@/types/product-intelligence/enums";
import { getLocaleConstants, type LocaleConstants } from "./constants/locale-constants";
import { getCommercialStrategyTemplate } from "./constants/commercial-templates";
import { GEMINI_COST_CONFIG, CostCalculator } from "./constants/cost-config";
import { SceneGenerator, type GeminiAPIClient } from "./generators/scene-generator";
import { PositioningGenerator } from "./generators/positioning-generator";
import { MockDataGenerator } from "./generators/mock-data-generator";
import { FallbackGenerator } from "./generators/fallback-generator";
import { GeminiClient } from "./api-clients/gemini-client";
import { CategoryInference } from "./utils/category-inference";
import { PromptBuilder } from "./utils/prompt-builder";
import { ResponseParser } from "./utils/response-parser";
import { ImageUtils } from "./utils/image-utils";

export interface VisionAnalysisRequest {
  sessionId: string;
  imageData: string; // Base64 encoded image data (without data URL prefix)
  description?: string;
  productName?: string; // Optional product name for better commercial generation
  locale: "en" | "ja";
  analysisOptions?: {
    detailLevel: "basic" | "detailed" | "comprehensive";
    includeTargetAudience: boolean;
    includePositioning: boolean;
    includeVisualPreferences: boolean;
  };
}

export interface VisionAnalysisResponse {
  analysis: ProductAnalysis;
  processingTime: number;
  cost: number;
  confidence: number;
  rawResponse?: string; // For debugging
  warnings?: string[];
}

export interface GeminiVisionRequest {
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
 * Gemini Pro Vision service for product image analysis
 */
export class GeminiVisionService implements GeminiAPIClient {
  private static instance: GeminiVisionService;
  private vertexAI: VertexAIService;
  private readonly MODEL_NAME = "gemini-1.5-pro-vision-preview";
  private readonly isMockMode: boolean;

  // Cost calculator
  private readonly costCalculator = new CostCalculator(GEMINI_COST_CONFIG);

  // Generators
  private readonly sceneGenerator: SceneGenerator;
  private readonly positioningGenerator: PositioningGenerator;
  private readonly mockDataGenerator: MockDataGenerator;
  private readonly fallbackGenerator: FallbackGenerator;

  // API Client
  private readonly geminiClient: GeminiClient;

  private constructor() {
    this.vertexAI = VertexAIService.getInstance();
    this.isMockMode =
      process.env.NODE_ENV === "development" && process.env.ENABLE_MOCK_MODE === "true";
    
    // Initialize API client
    this.geminiClient = new GeminiClient(this.vertexAI);
    
    // Initialize generators
    this.sceneGenerator = new SceneGenerator(this);
    this.positioningGenerator = new PositioningGenerator();
    this.mockDataGenerator = new MockDataGenerator();
    this.fallbackGenerator = new FallbackGenerator();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GeminiVisionService {
    if (!GeminiVisionService.instance) {
      GeminiVisionService.instance = new GeminiVisionService();
    }
    return GeminiVisionService.instance;
  }

  /**
   * Implementation of GeminiAPIClient interface for SceneGenerator
   */
  public async callGeminiAPI(prompt: string): Promise<any> {
    try {
      // Use text-only generation for scene prompts (no image needed)
      const response = await this.geminiClient.generateTextOnly(prompt);
      return JSON.parse(response.text);
    } catch (error) {
      console.warn("Failed to call Gemini API for scene generation:", error);
      throw error;
    }
  }


  /**
   * Analyze product image with Gemini Pro Vision
   */
  public async analyzeProductImage(
    request: VisionAnalysisRequest,
    options?: { forceMode?: "demo" | "real" }
  ): Promise<VisionAnalysisResponse> {
    const startTime = Date.now();

    try {
      // Use forced mode if provided, otherwise use instance mock mode
      const shouldUseMockMode =
        options?.forceMode === "demo" ||
        (!options?.forceMode && options?.forceMode !== "real" && this.isMockMode);

      if (shouldUseMockMode) {
        console.log("[GEMINI VISION] Using mock mode for analysis");
        return await this.mockDataGenerator.generateMockAnalysis({
          request,
          startTime,
          positioningGenerator: this.positioningGenerator,
          generateCommercialStrategy: this.generateCommercialStrategy.bind(this),
        });
      }

      console.log("[GEMINI VISION] Using real Vertex AI for analysis");

      // Generate analysis prompt
      const prompt = PromptBuilder.generateAnalysisPrompt(request);

      // Make API call to Gemini Pro Vision
      const geminiResponse = await this.geminiClient.generateWithVision(prompt, request.imageData);

      // Parse and validate the response
      const parseResult = ResponseParser.parseWithValidation(geminiResponse.text, request);

      // Calculate processing time and cost
      const processingTime = Date.now() - startTime;
      const cost = this.calculateCost(geminiResponse.usage);

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
      console.error("Gemini Vision analysis failed:", error);
      throw new Error(
        `Product image analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Generate analysis prompt based on request parameters
   */
  private generateAnalysisPrompt(request: VisionAnalysisRequest): string {
    const basePrompt =
      request.locale === "ja" ? this.getJapanesePrompt(request) : this.getEnglishPrompt(request);

    return basePrompt;
  }

  /**
   * English analysis prompt
   */
  private getEnglishPrompt(request: VisionAnalysisRequest): string {
    const detailLevel = request.analysisOptions?.detailLevel || "detailed";

    let prompt = `You are a product marketing expert analyzing a product image for commercial video creation. 

PRODUCT IMAGE ANALYSIS TASK:
${request.productName ? `Analyze this image of "${request.productName}" and provide structured insights for commercial video production.` : "Analyze this product image and provide structured insights for commercial video production."}

${request.productName ? `PRODUCT NAME: ${request.productName}` : ""}
${request.description ? `ADDITIONAL CONTEXT: ${request.description}` : ""}

IMPORTANT: Use the provided product name "${request.productName || "the product"}" throughout your analysis. Ensure all marketing strategies, features, and messaging are relevant to this specific product.

Please provide a comprehensive analysis in the following JSON structure:

{
  "product": {
    "category": "electronics|fashion|food-beverage|home-garden|health-beauty|sports-outdoors|automotive|books-media|toys-games|business|other",
    "subcategory": "specific subcategory",
    "name": "${request.productName || "product name"}",
    "description": "detailed product description",
    "keyFeatures": ["feature1", "feature2", "feature3"],
    "materials": ["material1", "material2"],
    "colors": [
      {"name": "color name", "hex": "#000000", "role": "primary|secondary|accent"}
    ],
    "usageContext": ["context1", "context2"],
    "seasonality": "spring|summer|fall|winter|year-round"
  },
  "targetAudience": {
    "primary": {
      "demographics": {
        "ageRange": "age range",
        "gender": "male|female|unisex",
        "incomeLevel": "budget|mid-range|premium|luxury",
        "location": ["urban", "suburban"],
        "lifestyle": ["lifestyle1", "lifestyle2"]
      },
      "psychographics": {
        "values": ["value1", "value2"],
        "interests": ["interest1", "interest2"],
        "personalityTraits": ["trait1", "trait2"],
        "motivations": ["motivation1", "motivation2"]
      },
      "behaviors": {
        "shoppingHabits": ["habit1", "habit2"],
        "mediaConsumption": ["media1", "media2"],
        "brandLoyalty": "low|medium|high",
        "decisionFactors": ["factor1", "factor2"]
      }
    }
  },
  "positioning": {
    "brandPersonality": {
      "traits": ["trait1", "trait2"],
      "tone": "professional|friendly|luxury|playful|authoritative",
      "voice": "description of brand voice"
    },
    "valueProposition": {
      "primaryBenefit": "main benefit",
      "supportingBenefits": ["benefit1", "benefit2"],
      "differentiators": ["diff1", "diff2"]
    },
    "competitiveAdvantages": {
      "functional": ["advantage1", "advantage2"],
      "emotional": ["advantage1", "advantage2"],
      "experiential": ["advantage1", "advantage2"]
    },
    "marketPosition": {
      "tier": "budget|mainstream|premium|luxury",
      "niche": "market niche if applicable",
      "marketShare": "challenger|leader|niche"
    }
  },
  "commercialStrategy": {
    "keyMessages": {
      "headline": "compelling headline",
      "tagline": "memorable tagline",
      "supportingMessages": ["message1", "message2"]
    },
    "emotionalTriggers": {
      "primary": {
        "type": "aspiration|fear|joy|trust|excitement|comfort|pride",
        "description": "trigger description",
        "intensity": "subtle|moderate|strong"
      },
      "secondary": [
        {
          "type": "trigger type",
          "description": "description",
          "intensity": "intensity"
        }
      ]
    },
    "callToAction": {
      "primary": "main CTA",
      "secondary": ["secondary CTA1", "secondary CTA2"]
    },
    "storytelling": {
      "narrative": "story narrative",
      "conflict": "central conflict",
      "resolution": "story resolution"
    },
    "keyScenes": {
      "opening": "opening scene description for commercial video",
      "productShowcase": "product showcase scene description",
      "problemSolution": "problem/solution scene description",
      "emotionalMoment": "emotional moment scene description",
      "callToAction": "final call to action scene description"
    }
  },
  "visualPreferences": {
    "overallStyle": "modern|classic|minimalist|bold|organic",
    "colorPalette": {
      "primary": [{"name": "color", "hex": "#000000", "role": "primary"}],
      "secondary": [{"name": "color", "hex": "#000000", "role": "secondary"}],
      "accent": [{"name": "color", "hex": "#000000", "role": "accent"}]
    },
    "mood": "energetic|calm|sophisticated|playful|inspiring",
    "composition": "clean|dynamic|intimate|grand|artistic",
    "lighting": "bright|warm|dramatic|natural|studio",
    "environment": ["environment1", "environment2"]
  }
}

ANALYSIS REQUIREMENTS:
- Provide ${detailLevel} analysis depth for "${request.productName || "the product"}"
- Focus on commercial video production insights specific to this product
- Include specific, actionable recommendations relevant to "${request.productName || "this product type"}"
- Ensure all color values are valid hex codes
- Base insights on visual elements observable in the image
- Consider cultural context for marketing effectiveness
- Tailor all messaging, features, and strategies to "${request.productName || "the product"}"
- Use the exact product name "${request.productName || "[Product Name]"}" in headlines, taglines, and descriptions

Return ONLY the JSON response, no additional text.`;

    return prompt;
  }

  /**
   * Japanese analysis prompt
   */
  private getJapanesePrompt(request: VisionAnalysisRequest): string {
    const detailLevel = request.analysisOptions?.detailLevel || "detailed";

    let prompt = `あなたはコマーシャル動画制作のための商品画像分析を専門とするプロダクトマーケティングエキスパートです。

商品画像分析タスク:
${request.productName ? `「${request.productName}」の画像を分析し、コマーシャル動画制作のための構造化された洞察を提供してください。` : "この商品画像を分析し、コマーシャル動画制作のための構造化された洞察を提供してください。"}

${request.productName ? `商品名: ${request.productName}` : ""}
${request.description ? `追加情報: ${request.description}` : ""}

重要: 提供された商品名「${request.productName || "この商品"}」を分析全体で使用してください。すべてのマーケティング戦略、機能、メッセージングがこの特定の商品に関連するものであることを確認してください。

以下のJSON構造で包括的な分析を提供してください:

${this.getEnglishPrompt(request).split("Please provide a comprehensive analysis in the following JSON structure:")[1].split("ANALYSIS REQUIREMENTS:")[0]}

分析要件:
- 「${request.productName || "この商品"}」について${detailLevel}レベルの分析深度を提供
- この商品に特化したコマーシャル動画制作の洞察に焦点を当てる
- 「${request.productName || "この商品タイプ"}」に関連する具体的で実行可能な推奨事項を含める
- すべての色の値が有効な16進コードであることを確認
- 画像で観察できる視覚的要素に基づいた洞察
- マーケティング効果のための文化的背景を考慮
- すべてのメッセージング、機能、戦略を「${request.productName || "この商品"}」に合わせる
- ヘッドライン、タグライン、説明文で正確な商品名「${request.productName || "[商品名]"}」を使用

JSON応答のみを返し、追加のテキストは含めないでください。すべてのテキスト値は適切な日本語で記述してください。`;

    return prompt;
  }

  /**
   * Call Gemini Pro Vision API
   */
  private async callGeminiVision(
    prompt: string,
    imageData: string
  ): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    // Check if we have GEMINI_API_KEY for AI Studio API
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      // Use Gemini AI Studio API (simpler authentication)
      return await this.callGeminiAIStudio(prompt, imageData, geminiApiKey);
    } else {
      // Use Vertex AI API (requires service account)
      return await this.callVertexAI(prompt, imageData);
    }
  }

  /**
   * Call Gemini AI Studio API with API key
   */
  private async callGeminiAIStudio(
    prompt: string,
    imageData: string,
    apiKey: string
  ): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const mimeType = this.detectMimeTypeFromBase64(imageData);

    const request = {
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

    console.log("[GEMINI VISION] Using AI Studio API with API key");

    // Use Gemini AI Studio endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini AI Studio API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Invalid response format from Gemini AI Studio API");
    }

    return {
      text: result.candidates[0].content.parts[0].text,
      usage: result.usage_metadata || { input_tokens: 1000, output_tokens: 2000 },
    };
  }

  /**
   * Call Vertex AI API with service account authentication
   */
  private async callVertexAI(
    prompt: string,
    imageData: string
  ): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const accessToken = await this.vertexAI.getAccessToken();
    const baseUrl = this.vertexAI.getBaseUrl();

    const mimeType = this.detectMimeTypeFromBase64(imageData);

    const request: GeminiVisionRequest = {
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

    console.log("[GEMINI VISION] Using Vertex AI API with service account");

    const response = await fetch(
      `${baseUrl}/publishers/google/models/${this.MODEL_NAME}:generateContent`,
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
    console.warn("[GEMINI VISION] Unknown image format, defaulting to JPEG");
    return "image/jpeg";
  }

  /**
   * Parse Gemini response into structured analysis
   */
  private parseAnalysisResponse(
    responseText: string,
    request: VisionAnalysisRequest
  ): ProductAnalysis {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Add metadata
      const analysis: ProductAnalysis = {
        ...parsed,
        metadata: {
          sessionId: request.sessionId,
          analysisVersion: "1.0.0",
          confidenceScore: 0.85, // Will be calculated later
          processingTime: 0, // Will be set by caller
          cost: {
            current: 0, // Will be set by caller
            total: 0,
            breakdown: {
              imageAnalysis: 0,
              chatInteractions: 0,
            },
            remaining: 300,
            budgetAlert: false,
          },
          locale: request.locale,
          timestamp: new Date().toISOString(),
          agentInteractions: 1,
        },
      };

      return analysis;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      console.error("Response text:", responseText);

      // Return minimal fallback analysis
      return this.fallbackGenerator.generateFallbackAnalysis({ request });
    }
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
        return "consumer product";
    }
  }

  /**
   * Generate contextual product description
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

  /**
   * Generate enhanced mock analysis matching the updated UI schema structure
   *
   * 📦 Product Analysis:
   * ├── Product Summary + Trust Score
   * ├── Key Features (bullet points)
   * ├── Target Audience (1-line summary)
   * └── Marketing
   *
   * 🎬 Commercial Strategy:
   * ├── Key Messages (Headline + Tagline)
   * ├── Visual Style
   * ├── Narrative Structure
   * ├── Key Scenes
   * └── Music & Tone
   */
  private async generateMockAnalysis(
    request: VisionAnalysisRequest,
    startTime: number
  ): Promise<VisionAnalysisResponse> {
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
      positioning: this.positioningGenerator.generatePositioning({
        category,
        productName: request.productName,
        locale: request.locale,
      }),
      // 🎬 Commercial Strategy Data
      commercialStrategy: await this.generateCommercialStrategy(
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
   * Generate fallback analysis when parsing fails
   */
  private generateFallbackAnalysis(request: VisionAnalysisRequest): ProductAnalysis {
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
          opening: "Person searching for quality product",
          productShowcase: "Close-up of product features",
          problemSolution: "Product solving user needs",
          emotionalMoment: "Satisfaction with purchase",
          callToAction: "Product logo and availability",
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

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    return this.costCalculator.calculateCost(usage);
  }

  /**
   * Calculate confidence score based on analysis completeness
   */
  private calculateConfidence(analysis: ProductAnalysis, rawResponse: string): number {
    let score = 0.5; // Base score

    // Check completeness of key sections
    if (analysis.product.keyFeatures.length > 0) score += 0.1;
    if (analysis.targetAudience.primary.demographics.ageRange !== "unknown") score += 0.1;
    if (analysis.positioning.valueProposition.primaryBenefit !== "unknown") score += 0.1;
    if (analysis.commercialStrategy.keyMessages.headline !== "unknown") score += 0.1;
    if (analysis.visualPreferences.overallStyle !== "classic") score += 0.1;

    // Check response quality indicators
    if (rawResponse.length > 2000) score += 0.05;
    if (analysis.product.colors.length > 1) score += 0.05;

    return Math.min(score, 0.95); // Cap at 95%
  }

  /**
   * Validate analysis completeness and return warnings
   */
  private validateAnalysisCompleteness(analysis: ProductAnalysis): string[] {
    const warnings: string[] = [];

    if (analysis.product.keyFeatures.length === 0) {
      warnings.push("No product features identified");
    }

    if (analysis.product.colors.length === 0) {
      warnings.push("No product colors identified");
    }

    if (analysis.targetAudience.primary.demographics.ageRange === "unknown") {
      warnings.push("Target age range not determined");
    }

    if (analysis.metadata.confidenceScore < 0.7) {
      warnings.push("Low confidence analysis - consider manual review");
    }

    return warnings;
  }

  /**
   * Generate positioning strategy based on product category and name
   */
  private generatePositioning(
    category: ProductCategory,
    productName?: string,
    locale?: "en" | "ja"
  ): Positioning {
    const localeConstants = getLocaleConstants(locale || "en");
    const valueProps =
      localeConstants.valuePropositions[category] ||
      localeConstants.valuePropositions[ProductCategory.OTHER];

    const positioningMap = {
      [ProductCategory.ELECTRONICS]: {
        brandPersonality: {
          traits: ["innovative", "premium", "professional", "sophisticated"],
          tone: BrandTone.LUXURY,
          voice: localeConstants.brandVoices[ProductCategory.ELECTRONICS],
        },
        valueProposition: {
          primaryBenefit: valueProps.primaryBenefit(productName),
          supportingBenefits: valueProps.supportingBenefits,
          differentiators: valueProps.differentiators,
        },
        competitiveAdvantages: {
          functional: [
            "superior AI processing",
            "advanced capabilities",
            "professional reliability",
          ],
          emotional: ["executive confidence", "innovation leadership", "professional prestige"],
          experiential: ["seamless workflows", "premium quality", "exclusive features"],
        },
        marketPosition: {
          tier: MarketTier.LUXURY,
          niche: "professionals and innovators",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.FASHION]: {
        brandPersonality: {
          traits: ["stylish", "trendy", "confident", "expressive"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.FASHION],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.FASHION].primaryBenefit(productName),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.FASHION].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.FASHION].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior comfort", "quality materials", "versatile styling"],
          emotional: ["confidence boost", "style expression", "trendsetting"],
          experiential: ["premium feel", "compliment-worthy", "Instagram-ready"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "fashion-forward individuals",
          marketShare: "niche" as const,
        },
      },
      [ProductCategory.HOME_GARDEN]: {
        brandPersonality: {
          traits: ["reliable", "comfortable", "practical", "welcoming"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.HOME_GARDEN],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.HOME_GARDEN].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.HOME_GARDEN].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.HOME_GARDEN].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior durability", "practical design", "easy maintenance"],
          emotional: ["home comfort", "family wellbeing", "peace of mind"],
          experiential: ["daily satisfaction", "long-term value", "effortless living"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "home comfort enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.FOOD_BEVERAGE]: {
        brandPersonality: {
          traits: ["fresh", "authentic", "wholesome", "satisfying"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.FOOD_BEVERAGE],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.FOOD_BEVERAGE].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.FOOD_BEVERAGE].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.FOOD_BEVERAGE].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior taste", "quality ingredients", "nutritional value"],
          emotional: ["comfort food feeling", "family tradition", "guilt-free indulgence"],
          experiential: ["satisfying meals", "memorable flavors", "social sharing"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "quality food enthusiasts",
          marketShare: "niche" as const,
        },
      },
      [ProductCategory.HEALTH_BEAUTY]: {
        brandPersonality: {
          traits: ["nurturing", "wellness-focused", "premium", "trustworthy"],
          tone: BrandTone.FRIENDLY,
          voice: localeConstants.brandVoices[ProductCategory.HEALTH_BEAUTY],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.HEALTH_BEAUTY].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.HEALTH_BEAUTY].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.HEALTH_BEAUTY].differentiators,
        },
        competitiveAdvantages: {
          functional: ["proven effectiveness", "gentle formulation", "visible results"],
          emotional: ["confidence boost", "self-care ritual", "wellbeing enhancement"],
          experiential: ["luxurious feel", "daily indulgence", "transformative results"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "wellness enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.SPORTS_OUTDOORS]: {
        brandPersonality: {
          traits: ["energetic", "adventurous", "durable", "performance-focused"],
          tone: BrandTone.AUTHORITATIVE,
          voice: localeConstants.brandVoices[ProductCategory.SPORTS_OUTDOORS],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.SPORTS_OUTDOORS].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.SPORTS_OUTDOORS].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.SPORTS_OUTDOORS].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior durability", "enhanced performance", "weather resistance"],
          emotional: ["achievement motivation", "adventure spirit", "confidence building"],
          experiential: ["peak performance", "outdoor freedom", "personal records"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "outdoor enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.AUTOMOTIVE]: {
        brandPersonality: {
          traits: ["powerful", "reliable", "sophisticated", "innovative"],
          tone: BrandTone.LUXURY,
          voice: localeConstants.brandVoices[ProductCategory.AUTOMOTIVE],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.AUTOMOTIVE].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.AUTOMOTIVE].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.AUTOMOTIVE].differentiators,
        },
        competitiveAdvantages: {
          functional: ["superior performance", "advanced safety", "fuel efficiency"],
          emotional: ["driving pleasure", "status symbol", "freedom of mobility"],
          experiential: ["smooth ride", "luxury comfort", "technological sophistication"],
        },
        marketPosition: {
          tier: MarketTier.LUXURY,
          niche: "driving enthusiasts",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.BOOKS_MEDIA]: {
        brandPersonality: {
          traits: ["intellectual", "inspiring", "accessible", "enriching"],
          tone: BrandTone.PROFESSIONAL,
          voice: localeConstants.brandVoices[ProductCategory.BOOKS_MEDIA],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.BOOKS_MEDIA].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.BOOKS_MEDIA].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.BOOKS_MEDIA].differentiators,
        },
        competitiveAdvantages: {
          functional: ["comprehensive content", "expert insights", "practical application"],
          emotional: ["intellectual satisfaction", "personal growth", "inspiration"],
          experiential: ["engaging storytelling", "knowledge acquisition", "skill development"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "lifelong learners",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.TOYS_GAMES]: {
        brandPersonality: {
          traits: ["playful", "creative", "educational", "fun"],
          tone: BrandTone.PLAYFUL,
          voice: localeConstants.brandVoices[ProductCategory.TOYS_GAMES],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.TOYS_GAMES].primaryBenefit(
              productName
            ),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.TOYS_GAMES].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.TOYS_GAMES].differentiators,
        },
        competitiveAdvantages: {
          functional: ["educational benefits", "safety standards", "durability"],
          emotional: ["joy and laughter", "family bonding", "achievement satisfaction"],
          experiential: ["creative play", "skill development", "memorable moments"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "families and educators",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.BUSINESS]: {
        brandPersonality: {
          traits: ["professional", "efficient", "reliable", "innovative"],
          tone: BrandTone.AUTHORITATIVE,
          voice: localeConstants.brandVoices[ProductCategory.BUSINESS],
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.BUSINESS].primaryBenefit(productName),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.BUSINESS].supportingBenefits,
          differentiators:
            localeConstants.valuePropositions[ProductCategory.BUSINESS].differentiators,
        },
        competitiveAdvantages: {
          functional: ["operational efficiency", "integration capabilities", "data security"],
          emotional: ["professional confidence", "competitive advantage", "growth enablement"],
          experiential: ["streamlined workflows", "productivity gains", "strategic insights"],
        },
        marketPosition: {
          tier: MarketTier.PREMIUM,
          niche: "business professionals",
          marketShare: "challenger" as const,
        },
      },
      [ProductCategory.OTHER]: {
        brandPersonality: {
          traits: ["reliable", "practical", "quality", "trustworthy"],
          tone: BrandTone.PROFESSIONAL,
          voice: "reliable quality that meets your needs", // No BUSINESS in brandVoices, use fallback
        },
        valueProposition: {
          primaryBenefit:
            localeConstants.valuePropositions[ProductCategory.OTHER].primaryBenefit(productName),
          supportingBenefits:
            localeConstants.valuePropositions[ProductCategory.OTHER].supportingBenefits,
          differentiators: localeConstants.valuePropositions[ProductCategory.OTHER].differentiators,
        },
        competitiveAdvantages: {
          functional: ["reliable performance", "practical features", "good value"],
          emotional: ["peace of mind", "confidence", "satisfaction"],
          experiential: ["consistent quality", "dependable service", "long-term value"],
        },
        marketPosition: {
          tier: MarketTier.MAINSTREAM,
          niche: "quality-conscious consumers",
          marketShare: "challenger" as const,
        },
      },
    };

    return (positioningMap[category] || positioningMap[ProductCategory.OTHER]) as Positioning;
  }

  /**
   * Generate commercial strategy based on product category and name
   */
  private async generateCommercialStrategy(
    category: ProductCategory,
    productName?: string,
    locale: "en" | "ja" = "en"
  ): Promise<CommercialStrategy> {
    const template = getCommercialStrategyTemplate(category, locale);

    return {
      keyMessages: {
        headline:
          typeof template.headline === "function"
            ? template.headline(productName)
            : template.headline,
        tagline: template.tagline,
        supportingMessages: template.supportingMessages,
      },
      emotionalTriggers: {
        primary: {
          type: EmotionalTriggerType.EXCITEMENT,
          description: template.narrative,
          intensity: "strong" as const,
        },
        secondary: [],
      },
      callToAction: {
        primary: template.callToAction.primary,
        secondary: template.callToAction.secondary,
      },
      storytelling: {
        narrative: template.narrative,
        conflict: template.conflict,
        resolution: template.resolution,
      },
      keyScenes: await this.sceneGenerator.generateFlexibleKeyScenes({
        category,
        productName,
        template,
        locale,
        useMockMode: this.isMockMode,
      }),
    };
  }

  /**
   * Generate key scenes based on category and locale
   */
  private generateKeyScenes(
    category: ProductCategory,
    productName?: string,
    locale: "en" | "ja" = "en"
  ): KeyScenes {
    const product = productName || (locale === "ja" ? "商品" : "product");

    if (locale === "ja") {
      switch (category) {
        case ProductCategory.ELECTRONICS:
          return {
            opening: `重要なプレゼンテーションのための${product}の準備`,
            productShowcase: `${product}のプレミアム機能とデザインのクローズアップ`,
            problemSolution: `${product}が現実の課題を簡単に解決`,
            emotionalMoment: `${product}による成功を満喫している顧客`,
            callToAction: `行動喚起と${product}ロゴの表示`,
          };
        case ProductCategory.FASHION:
          return {
            opening: `特別な日のための${product}の選択`,
            productShowcase: `${product}のエレガントなスタイルと品質の詳細`,
            problemSolution: `${product}で自信とスタイルを完璧に表現`,
            emotionalMoment: `${product}を身に着けて輝いている瞬間`,
            callToAction: `あなたのスタイルを発見 - ${product}コレクション`,
          };
        case ProductCategory.HOME_GARDEN:
          return {
            opening: `理想的な住空間での${product}の配置`,
            productShowcase: `${product}の機能性とデザインの美しさ`,
            problemSolution: `${product}で日常生活が格段に向上`,
            emotionalMoment: `${product}のある快適な家庭空間での満足`,
            callToAction: `あなたの家を変革 - ${product}で始めよう`,
          };
        case ProductCategory.FOOD_BEVERAGE:
          return {
            opening: `特別な料理体験のための${product}の準備`,
            productShowcase: `${product}の美味しさと品質の魅力`,
            problemSolution: `${product}で毎日の食事が特別な体験に`,
            emotionalMoment: `${product}を味わう幸せな瞬間`,
            callToAction: `美味しさを体験 - ${product}を試してみて`,
          };
        case ProductCategory.AUTOMOTIVE:
          return {
            opening: `新しいドライブ体験への${product}の準備`,
            productShowcase: `${product}の高性能と先進技術の詳細`,
            problemSolution: `${product}で移動が快適で安全な体験に`,
            emotionalMoment: `${product}での素晴らしい旅の瞬間`,
            callToAction: `あなたの旅を変える - ${product}を体験`,
          };
        case ProductCategory.SPORTS_OUTDOORS:
          return {
            opening: `アウトドア冒険のための${product}の準備`,
            productShowcase: `${product}の耐久性と機能性の実演`,
            problemSolution: `${product}で自然の中での活動が安心安全`,
            emotionalMoment: `${product}と共に冒険を楽しむ瞬間`,
            callToAction: `冒険を始めよう - ${product}がサポート`,
          };
        case ProductCategory.TOYS_GAMES:
          return {
            opening: `楽しい遊び時間のための${product}の用意`,
            productShowcase: `${product}の創造性を刺激する機能`,
            problemSolution: `${product}で退屈が楽しい学習体験に`,
            emotionalMoment: `${product}で遊ぶ子供たちの笑顔`,
            callToAction: `楽しさを発見 - ${product}で遊ぼう`,
          };
        case ProductCategory.BUSINESS:
          return {
            opening: `ビジネス成功のための${product}の導入`,
            productShowcase: `${product}の効率性とビジネス価値の紹介`,
            problemSolution: `${product}でビジネス課題をスマートに解決`,
            emotionalMoment: `${product}による成果を達成した満足感`,
            callToAction: `ビジネスを加速 - ${product}ソリューション`,
          };
        default:
          return {
            opening: `高品質な体験のための${product}の紹介`,
            productShowcase: `${product}の優れた特徴と価値`,
            problemSolution: `${product}で日常の課題をスムーズに解決`,
            emotionalMoment: `${product}による満足と安心の瞬間`,
            callToAction: `品質を体験 - ${product}を選択`,
          };
      }
    } else {
      // English key scenes
      switch (category) {
        case ProductCategory.ELECTRONICS:
          return {
            opening: `Professional preparing ${product} for important presentation`,
            productShowcase: `Close-up showcasing ${product} premium features and design`,
            problemSolution: `${product} solving real-world challenges effortlessly`,
            emotionalMoment: `Satisfied customer enjoying success with ${product}`,
            callToAction: `${product} logo reveal with call-to-action`,
          };
        case ProductCategory.FASHION:
          return {
            opening: `Selecting ${product} for a special occasion`,
            productShowcase: `Elegant styling and quality details of ${product}`,
            problemSolution: `${product} expressing confidence and style perfectly`,
            emotionalMoment: `Radiant moment wearing ${product}`,
            callToAction: `Discover your style - ${product} collection`,
          };
        case ProductCategory.HOME_GARDEN:
          return {
            opening: `Placing ${product} in the ideal living space`,
            productShowcase: `Functionality and design beauty of ${product}`,
            problemSolution: `${product} dramatically improving daily life`,
            emotionalMoment: `Satisfaction in comfortable home space with ${product}`,
            callToAction: `Transform your home - start with ${product}`,
          };
        case ProductCategory.FOOD_BEVERAGE:
          return {
            opening: `Preparing ${product} for special culinary experience`,
            productShowcase: `Deliciousness and quality appeal of ${product}`,
            problemSolution: `${product} making every meal a special experience`,
            emotionalMoment: `Happy moment savoring ${product}`,
            callToAction: `Taste the excellence - try ${product}`,
          };
        case ProductCategory.AUTOMOTIVE:
          return {
            opening: `Preparing ${product} for new driving experience`,
            productShowcase: `High performance and advanced technology of ${product}`,
            problemSolution: `${product} making travel comfortable and safe`,
            emotionalMoment: `Amazing journey moments with ${product}`,
            callToAction: `Transform your journey - experience ${product}`,
          };
        case ProductCategory.SPORTS_OUTDOORS:
          return {
            opening: `Preparing ${product} for outdoor adventure`,
            productShowcase: `Durability and functionality demonstration of ${product}`,
            problemSolution: `${product} making nature activities safe and secure`,
            emotionalMoment: `Moment of enjoying adventure with ${product}`,
            callToAction: `Start your adventure - ${product} supports you`,
          };
        case ProductCategory.TOYS_GAMES:
          return {
            opening: `Setting up ${product} for fun playtime`,
            productShowcase: `Creativity-inspiring features of ${product}`,
            problemSolution: `${product} turning boredom into fun learning`,
            emotionalMoment: `Children's smiles playing with ${product}`,
            callToAction: `Discover fun - play with ${product}`,
          };
        case ProductCategory.BUSINESS:
          return {
            opening: `Implementing ${product} for business success`,
            productShowcase: `Efficiency and business value of ${product}`,
            problemSolution: `${product} smartly solving business challenges`,
            emotionalMoment: `Satisfaction of achieving results with ${product}`,
            callToAction: `Accelerate business - ${product} solution`,
          };
        default:
          return {
            opening: `Introducing ${product} for quality experience`,
            productShowcase: `Excellent features and value of ${product}`,
            problemSolution: `${product} smoothly solving daily challenges`,
            emotionalMoment: `Moment of satisfaction and peace with ${product}`,
            callToAction: `Experience quality - choose ${product}`,
          };
      }
    }
  }

  /**
   * Generate flexible key scenes using Gemini AI based on product context
   */
  private async generateFlexibleKeyScenes(
    category: ProductCategory,
    productName: string | undefined,
    template: any,
    locale: "en" | "ja" = "en"
  ): Promise<KeyScenes> {
    const product = productName || (locale === "ja" ? "商品" : "product");
    
    // Try to use real Gemini API if not in mock mode, fallback to rigid scenes if API fails
    if (!this.isMockMode) {
      try {
        const prompt = locale === "ja" ? 
          `商品「${product}」（カテゴリ: ${category}）のための魅力的な商業ビデオのシーンを4-5個作成してください。

ブランドの方向性:
- メッセージ: ${template.narrative}
- 課題: ${template.conflict}  
- 解決: ${template.resolution}
- 主要訴求点: ${template.headline}

以下のようなJSONフォーマットで返してください:
{
  "scenes": [
    {
      "id": "scene1",
      "title": "シーン名",
      "description": "シーンの詳細な描写",
      "duration": "3-5秒",
      "purpose": "視聴者の関心を引く"
    }
  ]
}

効果的なアプローチ例: ライフスタイル統合、変革ストーリー、社会的証拠、舞台裏、問題解決、憧れ、感情的つながりなど。商品の種類と対象顧客に最も適したアプローチを選んでください。`
          :
          `Create 4-5 compelling scenes for a commercial video about "${product}" (category: ${category}).

Brand direction:
- Message: ${template.narrative}
- Conflict: ${template.conflict}
- Resolution: ${template.resolution}
- Key appeal: ${template.headline}

Return in this JSON format:
{
  "scenes": [
    {
      "id": "scene1", 
      "title": "Scene name",
      "description": "Detailed scene description",
      "duration": "3-5 seconds",
      "purpose": "hook audience"
    }
  ]
}

Effective patterns to consider: lifestyle integration, transformation stories, social proof, behind-the-scenes, problem/solution, aspiration, emotional connection, etc. Choose the approach that best fits this product type and target audience.`;

        const response = await this.callGeminiAPI(prompt);
        
        if (response && response.scenes && Array.isArray(response.scenes)) {
          return {
            scenes: response.scenes,
            // Maintain backward compatibility by providing legacy fields
            opening: response.scenes[0]?.description || "",
            productShowcase: response.scenes.find((s: any) => s.purpose.includes("product") || s.purpose.includes("showcase"))?.description || response.scenes[1]?.description || "",
            problemSolution: response.scenes.find((s: any) => s.purpose.includes("problem") || s.purpose.includes("solution"))?.description || response.scenes[2]?.description || "",
            emotionalMoment: response.scenes.find((s: any) => s.purpose.includes("emotional") || s.purpose.includes("connection"))?.description || response.scenes[3]?.description || "",
            callToAction: response.scenes[response.scenes.length - 1]?.description || ""
          };
        }
      } catch (error) {
        console.warn("Failed to generate flexible scenes with Gemini, falling back to rigid scenes:", error);
      }
    }
    
    // Fallback to original rigid method
    const rigidScenes = this.generateKeyScenes(category, productName, locale);
    return {
      scenes: [
        { id: "opening", title: "Opening", description: rigidScenes.opening, duration: "3-5 seconds", purpose: "hook audience" },
        { id: "showcase", title: "Product Showcase", description: rigidScenes.productShowcase, duration: "5-8 seconds", purpose: "showcase product features" },
        { id: "solution", title: "Problem Solution", description: rigidScenes.problemSolution, duration: "4-6 seconds", purpose: "demonstrate value" },
        { id: "emotional", title: "Emotional Moment", description: rigidScenes.emotionalMoment, duration: "3-4 seconds", purpose: "emotional connection" },
        { id: "cta", title: "Call to Action", description: rigidScenes.callToAction, duration: "2-3 seconds", purpose: "drive action" }
      ],
      // Keep legacy fields for backward compatibility
      ...rigidScenes
    };
  }

  /**
   * Call Gemini AI Studio API for text-only generation
   */
  private async callGeminiAIStudioTextOnly(
    prompt: string,
    apiKey: string
  ): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini AI Studio API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error("No content received from Gemini AI Studio API");
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
   * Call Vertex AI for text-only generation
   */
  private async callVertexAITextOnly(prompt: string): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const accessToken = await this.vertexAI.getAccessToken();
    const baseUrl = this.vertexAI.getBaseUrl();

    const request = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };

    const response = await fetch(
      `${baseUrl}/v1/projects/${this.vertexAI.getConfig().projectId}/locations/${this.vertexAI.getConfig().region}/publishers/google/models/gemini-1.5-pro:generateContent`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
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

}
