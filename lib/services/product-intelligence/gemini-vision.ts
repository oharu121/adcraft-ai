/**
 * Product Intelligence Agent - Gemini Pro Vision Integration
 *
 * Specialized service for analyzing product images using Vertex AI Gemini Pro Vision
 * with structured output for product analysis and cost tracking.
 */

import { VertexAIService } from "../vertex-ai";
import { ProductAnalysis, ProductCategory, Positioning, CommercialStrategy } from "@/types/product-intelligence";
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
export class GeminiVisionService {
  private static instance: GeminiVisionService;
  private vertexAI: VertexAIService;
  private readonly MODEL_NAME = "gemini-1.5-pro-vision-preview";
  private readonly isMockMode: boolean;

  // Cost configuration (per 1000 tokens)
  private readonly COST_CONFIG = {
    inputTokenCost: 0.00025, // $0.00025 per 1k input tokens
    outputTokenCost: 0.0005, // $0.0005 per 1k output tokens
    imageBaseCost: 0.00125, // Base cost per image analysis
  };

  private constructor() {
    this.vertexAI = VertexAIService.getInstance();
    this.isMockMode =
      process.env.NODE_ENV === "development" && process.env.ENABLE_MOCK_MODE === "true";
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
        return await this.generateMockAnalysis(request, startTime);
      }

      console.log("[GEMINI VISION] Using real Vertex AI for analysis");

      // Generate analysis prompt
      const prompt = this.generateAnalysisPrompt(request);

      // Make API call to Gemini Pro Vision
      const geminiResponse = await this.callGeminiVision(prompt, request.imageData);

      // Parse and structure the response
      const analysis = this.parseAnalysisResponse(geminiResponse.text, request);

      // Calculate processing time and cost
      const processingTime = Date.now() - startTime;
      const cost = this.calculateCost(geminiResponse.usage);

      return {
        analysis,
        processingTime,
        cost,
        confidence: this.calculateConfidence(analysis, geminiResponse.text),
        rawResponse: geminiResponse.text,
        warnings: this.validateAnalysisCompleteness(analysis),
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
      return this.generateFallbackAnalysis(request);
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
    if (!productName) {
      return locale === "ja" ? "サンプル商品の説明" : "Sample product description";
    }

    const category = this.inferProductCategory(productName);

    if (locale === "ja") {
      switch (category) {
        case ProductCategory.ELECTRONICS:
          return `${productName}は最新技術を搭載した高品質電子製品です。革新的な機能とプレミアムなデザインで、現代のライフスタイルを豊かにします。`;
        case ProductCategory.FASHION:
          return `${productName}はスタイルと機能性を兼ね備えたプレミアムファッションアイテムです。高品質な素材と洗練されたデザインが特徴です。`;
        case ProductCategory.FOOD_BEVERAGE:
          return `${productName}は厳選された原料を使用した高品質な飲食品です。豊かな味わいと上質な体験をお届けします。`;
        default:
          return `${productName}は品質と機能性を重視して開発された優れた製品です。お客様のニーズに応える革新的なソリューションを提供します。`;
      }
    } else {
      switch (category) {
        case ProductCategory.ELECTRONICS:
          return `${productName} represents cutting-edge technology and premium design, enhancing modern lifestyles with innovative features and exceptional performance.`;
        case ProductCategory.FASHION:
          return `${productName} combines style and functionality in a premium fashion item, featuring high-quality materials and sophisticated design.`;
        case ProductCategory.FOOD_BEVERAGE:
          return `${productName} is crafted from carefully selected ingredients, delivering rich flavors and a premium experience for discerning customers.`;
        default:
          return `${productName} is an exceptional product developed with a focus on quality and functionality, providing innovative solutions for customer needs.`;
      }
    }
  }

  /**
   * Generate contextual key features
   */
  private generateKeyFeatures(productName?: string, locale: "en" | "ja" = "en"): string[] {
    if (!productName) {
      return locale === "ja"
        ? ["機能1", "機能2", "機能3"]
        : ["Feature 1", "Feature 2", "Feature 3"];
    }

    const category = this.inferProductCategory(productName);

    if (locale === "ja") {
      switch (category) {
        case ProductCategory.ELECTRONICS:
          return [
            "最新プロセッサー搭載",
            "プレミアム材料使用",
            "高性能バッテリー",
            "直感的ユーザーインターフェース",
            "堅牢で耐久性のある設計",
            "高度セキュリティ機能",
          ];
        case ProductCategory.FASHION:
          return [
            "プレミアム素材構造",
            "エルゴノミックデザイン",
            "優れた快適性",
            "スタイリッシュな外観",
            "耐久性のある仕上げ",
            "多用途使用可能",
          ];
        case ProductCategory.FOOD_BEVERAGE:
          return [
            "厳選された天然原料",
            "豊かで複雑な風味プロファイル",
            "職人による手作り品質",
            "プレミアムパッケージング",
            "持続可能な調達",
            "認証品質保証",
          ];
        default:
          return [
            "高品質材料",
            "革新的デザイン",
            "優れた性能",
            "ユーザーフレンドリー",
            "信頼性の高い品質",
            "プレミアム体験",
          ];
      }
    } else {
      switch (category) {
        case ProductCategory.ELECTRONICS:
          return [
            "Latest Generation Processor",
            "Premium Material Construction",
            "High-Performance Battery System",
            "Intuitive User Interface",
            "Durable and Robust Design",
            "Advanced Security Features",
          ];
        case ProductCategory.FASHION:
          return [
            "Premium Material Construction",
            "Ergonomic Design",
            "Superior Comfort",
            "Stylish Appearance",
            "Durable Finish",
            "Versatile Usage",
          ];
        case ProductCategory.FOOD_BEVERAGE:
          return [
            "Carefully Selected Natural Ingredients",
            "Rich and Complex Flavor Profile",
            "Artisanal Crafted Quality",
            "Premium Packaging",
            "Sustainably Sourced",
            "Certified Quality Assurance",
          ];
        default:
          return [
            "High-Quality Materials",
            "Innovative Design",
            "Superior Performance",
            "User-Friendly Interface",
            "Reliable Quality",
            "Premium Experience",
          ];
      }
    }
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

    const mockAnalysis: ProductAnalysis = {
      // 📦 Product Analysis Data
      product: {
        id: request.sessionId,
        category: category,
        subcategory: this.inferProductSubcategory(request.productName),
        name: request.productName || (request.locale === "ja" ? "サンプル商品" : "Sample Product"),
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
        usageContext:
          request.locale === "ja"
            ? ["ビジネス会議", "プロフェッショナル撮影", "モバイルオフィス", "エグゼクティブライフ"]
            : [
                "business meetings",
                "professional photography",
                "mobile office",
                "executive lifestyle",
              ],
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
      positioning: this.generatePositioning(category, request.productName, request.locale),
      // 🎬 Commercial Strategy Data
      commercialStrategy: this.generateCommercialStrategy(
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
          secondary: [{ name: "gray", hex: "#6b7280", role: ColorRole.SECONDARY}],
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
    const inputCost = (usage.input_tokens / 1000) * this.COST_CONFIG.inputTokenCost;
    const outputCost = (usage.output_tokens / 1000) * this.COST_CONFIG.outputTokenCost;
    const imageCost = this.COST_CONFIG.imageBaseCost;

    return inputCost + outputCost + imageCost;
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
    const positioningMap = {
      [ProductCategory.ELECTRONICS]: {
        brandPersonality: {
          traits: ["innovative", "premium", "professional", "sophisticated"],
          tone: BrandTone.LUXURY,
          voice:
            locale === "ja"
              ? "革新的で権威的、そして感動的 - 非凡を求める方々へ"
              : "confident, authoritative, and inspirational - for those who demand the extraordinary",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `プロフェッショナルの究極の${productName || "電子機器"}パワーハウス`
              : `The professional's ultimate ${productName || "electronic"} powerhouse`,
          supportingBenefits:
            locale === "ja"
              ? ["業界をリードするAI機能", "比類なき性能とスピード", "洗練されたプレミアムデザイン"]
              : [
                  "Industry-leading AI capabilities",
                  "Unmatched performance and speed",
                  "Sophisticated premium design",
                ],
          differentiators:
            locale === "ja"
              ? ["統合されたAIテクノロジー", "プレミアム素材と製造", "専門的な機能セット"]
              : [
                  "Integrated AI technology",
                  "Premium materials and construction",
                  "Professional feature set",
                ],
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
          voice:
            locale === "ja"
              ? "スタイリッシュで自信に満ちた、あなたらしさを表現する"
              : "stylish, confident, and expressive - defining your unique style",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `あなたのスタイルを完璧に表現する${productName || "ファッションアイテム"}`
              : `The perfect ${productName || "fashion piece"} that expresses your unique style`,
          supportingBenefits:
            locale === "ja"
              ? [
                  "最新トレンドを取り入れたデザイン",
                  "高品質で快適な着心地",
                  "どんな場面でも映える versatility",
                ]
              : [
                  "Latest trend-forward design",
                  "Premium comfort and quality",
                  "Versatile styling for any occasion",
                ],
          differentiators:
            locale === "ja"
              ? ["独占的なデザインコラボレーション", "サステナブルな材料使用", "限定コレクション"]
              : [
                  "Exclusive design collaborations",
                  "Sustainable materials",
                  "Limited collection pieces",
                ],
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
          voice:
            locale === "ja"
              ? "温かく信頼できる、心地よい暮らしをサポート"
              : "warm, reliable, and supportive - enhancing your comfortable living",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `毎日の暮らしを豊かにする${productName || "ホームアイテム"}`
              : `The ${productName || "home essential"} that enriches your daily life`,
          supportingBenefits:
            locale === "ja"
              ? ["快適さと機能性の完璧な融合", "耐久性のある高品質素材", "どんなインテリアにも調和"]
              : [
                  "Perfect blend of comfort and functionality",
                  "Durable premium materials",
                  "Harmonizes with any interior",
                ],
          differentiators:
            locale === "ja"
              ? ["人間工学に基づいたデザイン", "エコフレンドリーな製造", "簡単メンテナンス"]
              : ["Ergonomic design principles", "Eco-friendly manufacturing", "Easy maintenance"],
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
          voice:
            locale === "ja"
              ? "心温まる本格的な味、あなたの毎日を美味しく"
              : "warm, authentic flavors that make every day delicious",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `本格的な味わいを届ける${productName || "食品"}`
              : `Authentic ${productName || "food"} that delivers exceptional taste`,
          supportingBenefits:
            locale === "ja"
              ? [
                  "厳選された最高品質の原材料",
                  "伝統的な製法と現代的な安全性",
                  "栄養バランスを考慮した製品",
                ]
              : [
                  "Carefully selected premium ingredients",
                  "Traditional methods with modern safety",
                  "Nutritionally balanced product",
                ],
          differentiators:
            locale === "ja"
              ? ["職人による手作りの品質", "添加物を最小限に抑えた自然な味", "地域の特産品使用"]
              : [
                  "Artisanal crafted quality",
                  "Natural taste with minimal additives",
                  "Local specialty ingredients",
                ],
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
          voice:
            locale === "ja"
              ? "あなたの美しさと健康を大切にサポート"
              : "caring support for your beauty and wellness journey",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `あなたの美と健康を輝かせる${productName || "製品"}`
              : `${productName || "Product"} that enhances your beauty and wellness`,
          supportingBenefits:
            locale === "ja"
              ? ["科学的に実証された成分", "肌に優しい天然素材", "持続可能な美容体験"]
              : ["Scientifically proven ingredients", "Gentle natural materials", "Sustainable beauty experience"],
          differentiators:
            locale === "ja"
              ? ["皮膚科医推奨", "クリーンビューティー", "個人に合わせたソリューション"]
              : ["Dermatologist recommended", "Clean beauty", "Personalized solutions"],
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
          voice:
            locale === "ja"
              ? "あなたの限界を超える冒険をサポート"
              : "supporting your adventures beyond limits",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `あらゆる挑戦を支える${productName || "スポーツ用品"}`
              : `${productName || "Sports equipment"} that supports every challenge`,
          supportingBenefits:
            locale === "ja"
              ? ["過酷な環境での耐久性", "プロレベルの性能", "快適性と機能性の融合"]
              : ["Durability in harsh conditions", "Professional-level performance", "Comfort and functionality fusion"],
          differentiators:
            locale === "ja"
              ? ["アスリート協力開発", "環境に配慮した素材", "革新的技術統合"]
              : ["Athlete-collaborated development", "Eco-friendly materials", "Innovative technology integration"],
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
          voice:
            locale === "ja"
              ? "力強く洗練された走りで、あなたの道のりを特別に"
              : "powerful and sophisticated driving that makes your journey special",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `卓越した走行性能を実現する${productName || "自動車"}`
              : `${productName || "Vehicle"} delivering exceptional driving performance`,
          supportingBenefits:
            locale === "ja"
              ? ["最先端の安全技術", "燃費効率と環境性能", "プレミアムな乗り心地"]
              : ["Cutting-edge safety technology", "Fuel efficiency and environmental performance", "Premium driving comfort"],
          differentiators:
            locale === "ja"
              ? ["独自のエンジン技術", "先進的な自動運転機能", "カスタマイゼーション"]
              : ["Proprietary engine technology", "Advanced autonomous features", "Extensive customization"],
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
          voice:
            locale === "ja"
              ? "知識と想像力を広げる、心豊かな体験を"
              : "expanding knowledge and imagination for enriching experiences",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `あなたの世界を広げる${productName || "書籍・メディア"}`
              : `${productName || "Book/Media"} that expands your world`,
          supportingBenefits:
            locale === "ja"
              ? ["専門的で信頼できる内容", "読みやすい構成と文章", "実用的な知識とスキル"]
              : ["Expert and reliable content", "Reader-friendly structure", "Practical knowledge and skills"],
          differentiators:
            locale === "ja"
              ? ["著名な専門家監修", "インタラクティブな学習体験", "多様なフォーマット対応"]
              : ["Expert author collaboration", "Interactive learning experience", "Multiple format availability"],
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
          voice:
            locale === "ja"
              ? "遊びを通じて学び、創造性を育む楽しい時間を"
              : "fun times that foster learning and creativity through play",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `創造性と学習を促す${productName || "おもちゃ・ゲーム"}`
              : `${productName || "Toy/Game"} that promotes creativity and learning`,
          supportingBenefits:
            locale === "ja"
              ? ["安全で高品質な素材", "年齢に適した設計", "教育的価値と娯楽性の両立"]
              : ["Safe and high-quality materials", "Age-appropriate design", "Educational value and entertainment"],
          differentiators:
            locale === "ja"
              ? ["教育専門家監修", "持続可能な製造", "長期間楽しめる設計"]
              : ["Educational expert supervision", "Sustainable manufacturing", "Long-lasting enjoyment design"],
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
          voice:
            locale === "ja"
              ? "ビジネスの成功を支える信頼できるパートナー"
              : "trusted partner supporting your business success",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `ビジネス効率を最大化する${productName || "ソリューション"}`
              : `${productName || "Solution"} that maximizes business efficiency`,
          supportingBenefits:
            locale === "ja"
              ? ["ROI向上とコスト削減", "スケーラブルなソリューション", "専門サポートとトレーニング"]
              : ["ROI improvement and cost reduction", "Scalable solutions", "Expert support and training"],
          differentiators:
            locale === "ja"
              ? ["業界特化型機能", "エンタープライズグレード", "24/7サポート体制"]
              : ["Industry-specific features", "Enterprise-grade quality", "24/7 support system"],
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
          voice:
            locale === "ja"
              ? "信頼できる品質で、あなたのニーズに応えます"
              : "reliable quality that meets your needs",
        },
        valueProposition: {
          primaryBenefit:
            locale === "ja"
              ? `信頼性と品質を兼ね備えた${productName || "製品"}`
              : `Reliable and quality ${productName || "product"} you can trust`,
          supportingBenefits:
            locale === "ja"
              ? ["確かな品質基準", "実用的なデザイン", "お求めやすい価格"]
              : ["Proven quality standards", "Practical design", "Accessible pricing"],
          differentiators:
            locale === "ja"
              ? ["厳格な品質管理", "ユーザーフレンドリーな設計", "充実したサポート"]
              : ["Rigorous quality control", "User-friendly design", "Comprehensive support"],
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
  private generateCommercialStrategy(
    category: ProductCategory,
    productName?: string,
    locale?: "en" | "ja"
  ): CommercialStrategy {
    const strategyMap = {
      [ProductCategory.ELECTRONICS]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "テクノロジー"}でプロフェッショナルを超越せよ`
              : `Transcend Professional with ${productName || "Technology"}`,
          tagline:
            locale === "ja"
              ? "パワー。プレステージ。パーフェクション。"
              : "Power. Prestige. Perfection.",
          supportingMessages:
            locale === "ja"
              ? [
                  "AI駆動ビジネスエクセレンス",
                  "妥協なきプレミアム品質",
                  "エグゼクティブのためのテクノロジー",
                ]
              : [
                  "AI-Driven Business Excellence",
                  "Uncompromising Premium Quality",
                  "Technology for Executives",
                ],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.ASPIRATION,
            description: "Desire for professional leadership and recognition",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.PRIDE,
              description: "Achievement and status validation",
              intensity: "strong" as const,
            },
            {
              type: EmotionalTriggerType.TRUST,
              description: "Confidence in premium reliability",
              intensity: "moderate" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "エクセレンスを体験" : "Experience Excellence",
          secondary:
            locale === "ja"
              ? ["プレミアム機能", "専門家評価", "VIP体験予約"]
              : ["Premium Features", "Expert Reviews", "Book VIP Experience"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `プロフェッショナルが${productName || "最先端技術"}で革新的成功を実現する物語`
              : `Professional achieving breakthrough success through ${productName || "cutting-edge innovation"}`,
          conflict:
            locale === "ja"
              ? "競争の激しいビジネス環境で卓越したパフォーマンスが求められる挑戦"
              : "The challenge of exceptional performance in highly competitive business environments",
          resolution:
            locale === "ja"
              ? `${productName || "完璧なツール"}による effortless な成功とリーダーシップの確立`
              : `Effortless success and leadership establishment through ${productName || "the perfect professional tool"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `重要なプレゼンテーション前に${productName || "製品"}を準備するプロフェッショナル`
              : `Professional preparing ${productName || "product"} before important presentation`,
          productShowcase:
            locale === "ja"
              ? `${productName || "製品"}の洗練されたデザインと先進機能のクローズアップ`
              : `Close-up showcasing ${productName || "product"} sleek design and advanced features`,
          problemSolution:
            locale === "ja"
              ? `${productName || "製品"}の機能で複雑な課題を瞬時に解決するシーン`
              : `${productName || "Product"} instantly solving complex challenges with advanced capabilities`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "製品"}で大切な人とつながる温かい瞬間`
              : `Warm moment connecting with loved ones through ${productName || "product"}`,
          callToAction:
            locale === "ja"
              ? `プレミアムショールームでの${productName || "製品"}体験と製品ロゴ`
              : `${productName || "Product"} experience at premium showroom with logo reveal`,
        },
      },
      [ProductCategory.FASHION]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "ファッション"}でスタイルを再定義`
              : `Redefine Style with ${productName || "Fashion"}`,
          tagline:
            locale === "ja" ? "自信。スタイル。あなたらしさ。" : "Confidence. Style. Authenticity.",
          supportingMessages:
            locale === "ja"
              ? [
                  "あなただけの個性的なスタイル",
                  "最高品質の快適さ",
                  "どんな場面でも輝く versatility",
                ]
              : [
                  "Your unique personal style",
                  "Premium comfort quality",
                  "Versatile elegance for any occasion",
                ],
        },
        emotionalTriggers: {
          primary: {
            type: "confidence" as const,
            description: "Feeling stylish and confident",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.PRIDE,
              description: "Style expression and individuality",
              intensity: "strong" as const,
            },
            {
              type: EmotionalTriggerType.ASPIRATION,
              description: "Desire to look fashionable",
              intensity: "moderate" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "スタイルを発見" : "Discover Your Style",
          secondary:
            locale === "ja"
              ? ["コレクション", "スタイリング", "限定アイテム"]
              : ["View Collection", "Style Guide", "Exclusive Pieces"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "ファッション"}で自分らしいスタイルを見つける旅`
              : `Journey of discovering personal style through ${productName || "fashion"}`,
          conflict:
            locale === "ja"
              ? "自分らしいスタイルを表現したいという願望"
              : "The desire to express authentic personal style",
          resolution:
            locale === "ja"
              ? `${productName || "ファッション"}で完璧な self-expression の達成`
              : `Perfect self-expression achieved through ${productName || "fashion"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `クローゼットで${productName || "ファッションアイテム"}を選ぶシーン`
              : `Selecting ${productName || "fashion item"} from wardrobe`,
          productShowcase:
            locale === "ja"
              ? `${productName || "製品"}の美しいテクスチャーとデザインの detail shots`
              : `Beautiful texture and design detail shots of ${productName || "product"}`,
          problemSolution:
            locale === "ja"
              ? `${productName || "製品"}でスタイリッシュに問題を解決するシーン`
              : `Stylishly solving situations with ${productName || "product"}`,
          emotionalMoment:
            locale === "ja"
              ? `鏡で${productName || "製品"}を身に着けて微笑む瞬間`
              : `Smiling moment wearing ${productName || "product"} in mirror`,
          callToAction:
            locale === "ja"
              ? `ブティックで${productName || "製品"}を試着するシーンとブランドロゴ`
              : `Trying ${productName || "product"} at boutique with brand logo reveal`,
        },
      },
      [ProductCategory.HOME_GARDEN]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "ホームアイテム"}で暮らしを豊かに`
              : `Enrich Your Life with ${productName || "Home Essential"}`,
          tagline: locale === "ja" ? "快適。機能。美しさ。" : "Comfort. Function. Beauty.",
          supportingMessages:
            locale === "ja"
              ? ["毎日の快適さを向上", "実用的で美しいデザイン", "家族みんなが喜ぶ品質"]
              : [
                  "Enhanced daily comfort",
                  "Practical beautiful design",
                  "Quality the whole family loves",
                ],
        },
        emotionalTriggers: {
          primary: {
            type: "comfort" as const,
            description: "Creating a cozy, comfortable home",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: "care" as const,
              description: "Caring for family wellbeing",
              intensity: "moderate" as const,
            },
            {
              type: EmotionalTriggerType.PRIDE,
              description: "Home pride and satisfaction",
              intensity: "moderate" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "快適を体験" : "Experience Comfort",
          secondary:
            locale === "ja"
              ? ["ホームツアー", "製品詳細", "設置相談"]
              : ["Home Tour", "Product Details", "Setup Consultation"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "ホームアイテム"}で家族の時間をより特別にする物語`
              : `Making family moments more special with ${productName || "home essential"}`,
          conflict:
            locale === "ja"
              ? "忙しい生活の中で快適な家庭環境を作りたい願い"
              : "The desire to create comfortable home environment amid busy life",
          resolution:
            locale === "ja"
              ? `${productName || "製品"}で実現する毎日の幸せと家族の絆`
              : `Daily happiness and family bonding realized through ${productName || "product"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `家族が${productName || "製品"}のある空間でリラックスするシーン`
              : `Family relaxing in space with ${productName || "product"}`,
          productShowcase:
            locale === "ja"
              ? `${productName || "製品"}の機能性と美しさを映すクローズアップ`
              : `Close-up showcasing ${productName || "product"} functionality and beauty`,
          problemSolution:
            locale === "ja"
              ? `${productName || "製品"}が日常の inconvenience を解決するシーン`
              : `${productName || "Product"} solving daily inconveniences`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "製品"}と共に過ごす家族の温かい時間`
              : `Warm family moments shared with ${productName || "product"}`,
          callToAction:
            locale === "ja"
              ? `ショールームで${productName || "製品"}を体験するシーンとブランドロゴ`
              : `Experiencing ${productName || "product"} at showroom with brand logo`,
        },
      },
      [ProductCategory.FOOD_BEVERAGE]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "美食"}で毎日を特別に`
              : `Make Every Day Special with ${productName || "Gourmet"}`,
          tagline: locale === "ja" ? "本格。新鮮。満足。" : "Authentic. Fresh. Satisfying.",
          supportingMessages:
            locale === "ja"
              ? ["職人の技による本格的な味", "厳選素材の自然な美味しさ", "家族が笑顔になる食卓"]
              : [
                  "Authentic taste by artisan craftsmanship",
                  "Natural deliciousness of selected ingredients",
                  "Family smiles at the dining table",
                ],
        },
        emotionalTriggers: {
          primary: {
            type: "pleasure" as const,
            description: "Pure enjoyment of delicious food",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: "comfort" as const,
              description: "Comfort food satisfaction",
              intensity: "moderate" as const,
            },
            {
              type: "nostalgia" as const,
              description: "Memories of special meals",
              intensity: "moderate" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "美味しさを体験" : "Taste the Difference",
          secondary:
            locale === "ja"
              ? ["レシピ", "購入", "職人の話"]
              : ["Recipes", "Purchase", "Artisan Story"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "美食"}で家族の食卓に笑顔と美味しさを運ぶ物語`
              : `Bringing smiles and deliciousness to family table with ${productName || "gourmet food"}`,
          conflict:
            locale === "ja"
              ? "忙しい毎日でも家族に本当に美味しい食事を提供したい想い"
              : "The desire to provide truly delicious meals for family despite busy daily life",
          resolution:
            locale === "ja"
              ? `${productName || "美食"}で実現する special な食事時間と家族の幸せ`
              : `Special mealtime and family happiness realized through ${productName || "gourmet food"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `キッチンで${productName || "食品"}を準備するシーン`
              : `Preparing ${productName || "food"} in kitchen`,
          productShowcase:
            locale === "ja"
              ? `${productName || "食品"}の美しい見た目と質感のクローズアップ`
              : `Close-up of ${productName || "food"} beautiful appearance and texture`,
          problemSolution:
            locale === "ja"
              ? `${productName || "食品"}で簡単に美味しい料理を完成させるシーン`
              : `Easily completing delicious dish with ${productName || "food"}`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "食品"}を味わって笑顔になる家族のシーン`
              : `Family smiling while enjoying ${productName || "food"}`,
          callToAction:
            locale === "ja"
              ? `レストランやマーケットで${productName || "食品"}を発見するシーンとブランドロゴ`
              : `Discovering ${productName || "food"} at restaurant or market with brand logo`,
        },
      },
      [ProductCategory.HEALTH_BEAUTY]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "美容"}で本当の美しさを`
              : `True Beauty with ${productName || "Beauty"}`,
          tagline: locale === "ja" ? "美しさ。健康。輝き。" : "Beauty. Wellness. Radiance.",
          supportingMessages:
            locale === "ja"
              ? ["科学的に実証された効果", "自然由来の安心成分", "あなただけの美容体験"]
              : ["Scientifically proven results", "Natural trusted ingredients", "Your personalized beauty journey"],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.JOY,
            description: "Self-care and confidence enhancement",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.TRUST,
              description: "Confidence in safety and effectiveness",
              intensity: "strong" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "美しさを実感" : "Experience Beauty",
          secondary:
            locale === "ja"
              ? ["専門家の評価", "お客様の声", "無料お試し"]
              : ["Expert Reviews", "Customer Stories", "Free Trial"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "美容製品"}で自分らしい美しさを発見する物語`
              : `Discovering your authentic beauty with ${productName || "beauty product"}`,
          conflict:
            locale === "ja"
              ? "自分に合う美容製品を見つけるのが難しい"
              : "Difficulty finding the right beauty products for you",
          resolution:
            locale === "ja"
              ? `${productName || "美容製品"}で自信と輝きに満ちた毎日を実現`
              : `Achieving confident and radiant days with ${productName || "beauty product"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `朝の美容ルーティンで${productName || "製品"}を使用するシーン`
              : `Using ${productName || "product"} in morning beauty routine`,
          productShowcase:
            locale === "ja"
              ? `${productName || "製品"}のテクスチャと仕上がりのクローズアップ`
              : `Close-up of ${productName || "product"} texture and finish`,
          problemSolution:
            locale === "ja"
              ? `${productName || "製品"}で肌悩みを解決するビフォーアフター`
              : `Before and after solving skin concerns with ${productName || "product"}`,
          emotionalMoment:
            locale === "ja"
              ? `鏡を見て${productName || "製品"}の効果に満足する瞬間`
              : `Moment of satisfaction seeing ${productName || "product"} results in mirror`,
          callToAction:
            locale === "ja"
              ? `${productName || "製品"}の購入を決める瞬間とブランドロゴ`
              : `Deciding to purchase ${productName || "product"} with brand logo`,
        },
      },
      [ProductCategory.SPORTS_OUTDOORS]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "アドベンチャー"}で限界を超えろ`
              : `Push Beyond Limits with ${productName || "Adventure"}`,
          tagline: locale === "ja" ? "冒険。パフォーマンス。勝利。" : "Adventure. Performance. Victory.",
          supportingMessages:
            locale === "ja"
              ? ["プロアスリート認定品質", "過酷な環境対応設計", "記録更新をサポート"]
              : ["Pro-athlete approved quality", "Extreme condition design", "Record-breaking support"],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.EXCITEMENT,
            description: "Thrill of adventure and achievement",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.PRIDE,
              description: "Athletic achievement and personal records",
              intensity: "strong" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "冒険を始めよう" : "Start Your Adventure",
          secondary:
            locale === "ja"
              ? ["プロ仕様体験", "フィールドテスト", "チーム割引"]
              : ["Pro Experience", "Field Test", "Team Discount"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "スポーツ用品"}で自分の可能性を最大限に引き出す物語`
              : `Maximizing your potential with ${productName || "sports equipment"}`,
          conflict:
            locale === "ja"
              ? "厳しいアウトドア環境で求められる高性能と信頼性"
              : "Need for high performance and reliability in challenging outdoor environments",
          resolution:
            locale === "ja"
              ? `${productName || "スポーツ用品"}で新しい記録と達成感を獲得`
              : `Achieving new records and accomplishments with ${productName || "sports equipment"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `アウトドアで${productName || "用品"}を装備するシーン`
              : `Equipping ${productName || "equipment"} for outdoor activity`,
          productShowcase:
            locale === "ja"
              ? `${productName || "用品"}の耐久性と機能性のクローズアップ`
              : `Close-up of ${productName || "equipment"} durability and functionality`,
          problemSolution:
            locale === "ja"
              ? `${productName || "用品"}で困難な状況を突破するシーン`
              : `Breaking through challenging situations with ${productName || "equipment"}`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "用品"}で目標達成した時の喜びの瞬間`
              : `Moment of joy achieving goals with ${productName || "equipment"}`,
          callToAction:
            locale === "ja"
              ? `アウトドアショップで${productName || "用品"}を手に取るシーンとブランドロゴ`
              : `Picking up ${productName || "equipment"} at outdoor shop with brand logo`,
        },
      },
      [ProductCategory.AUTOMOTIVE]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "モビリティ"}で道を支配せよ`
              : `Command the Road with ${productName || "Mobility"}`,
          tagline: locale === "ja" ? "パワー。コントロール。自由。" : "Power. Control. Freedom.",
          supportingMessages:
            locale === "ja"
              ? ["圧倒的な走行性能", "最先端安全テクノロジー", "プレミアムドライビング体験"]
              : ["Overwhelming performance", "Cutting-edge safety technology", "Premium driving experience"],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.PRIDE,
            description: "Status and driving excellence",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.EXCITEMENT,
              description: "Thrill of powerful driving experience",
              intensity: "strong" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "ドライブを体験" : "Experience the Drive",
          secondary:
            locale === "ja"
              ? ["テストドライブ", "カスタムオプション", "特別価格"]
              : ["Test Drive", "Custom Options", "Special Pricing"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "車"}で人生の新しいステージへ加速する物語`
              : `Accelerating to new life stages with ${productName || "vehicle"}`,
          conflict:
            locale === "ja"
              ? "日常とは違う特別なドライビング体験への憧れ"
              : "Yearning for extraordinary driving experience beyond everyday life",
          resolution:
            locale === "ja"
              ? `${productName || "車"}で実現する自由で洗練されたライフスタイル`
              : `Free and sophisticated lifestyle realized with ${productName || "vehicle"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `${productName || "車"}に乗り込む瞬間のシーン`
              : `Moment of getting into ${productName || "vehicle"}`,
          productShowcase:
            locale === "ja"
              ? `${productName || "車"}のエクステリアとインテリアのクローズアップ`
              : `Close-up of ${productName || "vehicle"} exterior and interior`,
          problemSolution:
            locale === "ja"
              ? `${productName || "車"}で都市の交通渋滞を華麗に抜けるシーン`
              : `Elegantly navigating city traffic with ${productName || "vehicle"}`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "車"}でのドライブで感じる満足と自由の瞬間`
              : `Moment of satisfaction and freedom felt while driving ${productName || "vehicle"}`,
          callToAction:
            locale === "ja"
              ? `ディーラーで${productName || "車"}を確認するシーンとブランドロゴ`
              : `Checking ${productName || "vehicle"} at dealer with brand logo`,
        },
      },
      [ProductCategory.BOOKS_MEDIA]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "知識"}で世界を広げよう`
              : `Expand Your World with ${productName || "Knowledge"}`,
          tagline: locale === "ja" ? "学び。発見。成長。" : "Learn. Discover. Grow.",
          supportingMessages:
            locale === "ja"
              ? ["専門家の知見を凝縮", "実践的なスキルアップ", "新しい視点を獲得"]
              : ["Concentrated expert insights", "Practical skill development", "Gaining new perspectives"],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.ASPIRATION,
            description: "Desire for knowledge and personal growth",
            intensity: "moderate" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.PRIDE,
              description: "Intellectual achievement and learning",
              intensity: "moderate" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "学習を開始" : "Start Learning",
          secondary:
            locale === "ja"
              ? ["サンプル閲覧", "読者レビュー", "まとめ買い割引"]
              : ["Preview Sample", "Reader Reviews", "Bundle Discount"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "書籍"}で新たな可能性と知識を発見する物語`
              : `Discovering new possibilities and knowledge with ${productName || "book"}`,
          conflict:
            locale === "ja"
              ? "スキルアップや知識習得のための質の高い情報源を求める悩み"
              : "The challenge of finding quality information sources for skill development and learning",
          resolution:
            locale === "ja"
              ? `${productName || "書籍"}で得た知識による成長と成功の実現`
              : `Growth and success achieved through knowledge gained from ${productName || "book"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `静かな場所で${productName || "書籍"}を開くシーン`
              : `Opening ${productName || "book"} in quiet place`,
          productShowcase:
            locale === "ja"
              ? `${productName || "書籍"}の内容とレイアウトのクローズアップ`
              : `Close-up of ${productName || "book"} content and layout`,
          problemSolution:
            locale === "ja"
              ? `${productName || "書籍"}の知識を実際に応用するシーン`
              : `Applying knowledge from ${productName || "book"} in practice`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "書籍"}を読んで新しい発見に驚く瞬間`
              : `Moment of surprise at new discoveries while reading ${productName || "book"}`,
          callToAction:
            locale === "ja"
              ? `書店やオンラインで${productName || "書籍"}を購入するシーンとブランドロゴ`
              : `Purchasing ${productName || "book"} at bookstore or online with brand logo`,
        },
      },
      [ProductCategory.TOYS_GAMES]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "遊び"}で創造性を解放しよう`
              : `Unleash Creativity with ${productName || "Play"}`,
          tagline: locale === "ja" ? "遊び。学び。笑顔。" : "Play. Learn. Smile.",
          supportingMessages:
            locale === "ja"
              ? ["安全で教育的な設計", "家族みんなで楽しめる", "創造性と思考力を育成"]
              : ["Safe and educational design", "Fun for the whole family", "Nurturing creativity and thinking"],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.JOY,
            description: "Fun and family bonding",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.PRIDE,
              description: "Children's growth and achievement",
              intensity: "moderate" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "楽しさを体験" : "Experience the Fun",
          secondary:
            locale === "ja"
              ? ["実演デモ", "年齢別ガイド", "セット購入特典"]
              : ["Live Demo", "Age Guide", "Bundle Special"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "おもちゃ"}で家族の絆を深め子供の成長を支える物語`
              : `Strengthening family bonds and supporting children's growth with ${productName || "toy"}`,
          conflict:
            locale === "ja"
              ? "子供の発達に良い影響を与える質の高いおもちゃを選ぶ悩み"
              : "The challenge of choosing quality toys that positively influence child development",
          resolution:
            locale === "ja"
              ? `${productName || "おもちゃ"}で実現する家族の幸せな時間と子供の成長`
              : `Happy family time and child growth realized with ${productName || "toy"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `子供が${productName || "おもちゃ"}を発見して目を輝かせるシーン`
              : `Child discovering ${productName || "toy"} with eyes lighting up`,
          productShowcase:
            locale === "ja"
              ? `${productName || "おもちゃ"}の機能と安全性のクローズアップ`
              : `Close-up of ${productName || "toy"} features and safety`,
          problemSolution:
            locale === "ja"
              ? `${productName || "おもちゃ"}で親子が協力して問題を解決するシーン`
              : `Parent and child working together to solve problems with ${productName || "toy"}`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "おもちゃ"}で遊ぶ家族の笑顔あふれる瞬間`
              : `Family moment full of smiles while playing with ${productName || "toy"}`,
          callToAction:
            locale === "ja"
              ? `おもちゃ売り場で${productName || "おもちゃ"}を選ぶシーンとブランドロゴ`
              : `Selecting ${productName || "toy"} at toy section with brand logo`,
        },
      },
      [ProductCategory.BUSINESS]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `${productName || "ソリューション"}でビジネスを加速せよ`
              : `Accelerate Business with ${productName || "Solution"}`,
          tagline: locale === "ja" ? "効率。成長。成功。" : "Efficiency. Growth. Success.",
          supportingMessages:
            locale === "ja"
              ? ["ROI最大化を実現", "業務効率の劇的改善", "競争優位性を確保"]
              : ["Maximizing ROI achievement", "Dramatic efficiency improvement", "Securing competitive advantage"],
        },
        emotionalTriggers: {
          primary: {
            type: EmotionalTriggerType.TRUST,
            description: "Confidence in business growth and success",
            intensity: "strong" as const,
          },
          secondary: [
            {
              type: EmotionalTriggerType.PRIDE,
              description: "Professional achievement and recognition",
              intensity: "strong" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "成長を実現" : "Realize Growth",
          secondary:
            locale === "ja"
              ? ["無料デモ", "ROI試算", "専門相談"]
              : ["Free Demo", "ROI Calculation", "Expert Consultation"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `${productName || "ソリューション"}でビジネスの課題を解決し成功を実現する物語`
              : `Solving business challenges and achieving success with ${productName || "solution"}`,
          conflict:
            locale === "ja"
              ? "競争の激化する市場で効率と成長を両立する必要性"
              : "Need to balance efficiency and growth in increasingly competitive markets",
          resolution:
            locale === "ja"
              ? `${productName || "ソリューション"}による業務改革と持続的な成長の実現`
              : `Business transformation and sustainable growth achieved with ${productName || "solution"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `会議室で${productName || "ソリューション"}を検討するビジネスチーム`
              : `Business team considering ${productName || "solution"} in meeting room`,
          productShowcase:
            locale === "ja"
              ? `${productName || "ソリューション"}のダッシュボードと分析機能のクローズアップ`
              : `Close-up of ${productName || "solution"} dashboard and analytics features`,
          problemSolution:
            locale === "ja"
              ? `${productName || "ソリューション"}で業務プロセスが改善されるシーン`
              : `Business processes being improved with ${productName || "solution"}`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "ソリューション"}の成果に満足するエグゼクティブの瞬間`
              : `Executive moment of satisfaction with ${productName || "solution"} results`,
          callToAction:
            locale === "ja"
              ? `オフィスで${productName || "ソリューション"}導入を決定するシーンとブランドロゴ`
              : `Deciding to implement ${productName || "solution"} at office with brand logo`,
        },
      },
      [ProductCategory.OTHER]: {
        keyMessages: {
          headline:
            locale === "ja"
              ? `信頼の${productName || "品質"}をあなたに`
              : `Trusted ${productName || "Quality"} for You`,
          tagline: locale === "ja" ? "品質。信頼。安心。" : "Quality. Trust. Peace of Mind.",
          supportingMessages:
            locale === "ja"
              ? ["確かな品質基準", "長く使える耐久性", "お客様満足度第一"]
              : [
                  "Proven quality standards",
                  "Long-lasting durability",
                  "Customer satisfaction first",
                ],
        },
        emotionalTriggers: {
          primary: {
            type: "trust" as const,
            description: "Reliability and dependability",
            intensity: "moderate" as const,
          },
          secondary: [
            {
              type: "peace_of_mind" as const,
              description: "Confidence in purchase decision",
              intensity: "moderate" as const,
            },
          ],
        },
        callToAction: {
          primary: locale === "ja" ? "詳細を確認" : "Learn More",
          secondary:
            locale === "ja" ? ["製品詳細", "お客様の声"] : ["Product Details", "Customer Reviews"],
        },
        storytelling: {
          narrative:
            locale === "ja"
              ? `信頼できる${productName || "製品"}で毎日の安心を実現する物語`
              : `Realizing daily peace of mind with reliable ${productName || "product"}`,
          conflict:
            locale === "ja"
              ? "品質とコストパフォーマンスを両立する製品を求める悩み"
              : "The challenge of finding product that balances quality and value",
          resolution:
            locale === "ja"
              ? `${productName || "製品"}による長期的な満足と安心の獲得`
              : `Long-term satisfaction and peace of mind gained through ${productName || "product"}`,
        },
        keyScenes: {
          opening:
            locale === "ja"
              ? `日常生活で${productName || "製品"}を使用するシーン`
              : `Using ${productName || "product"} in daily life`,
          productShowcase:
            locale === "ja"
              ? `${productName || "製品"}の機能と品質のクローズアップ`
              : `Close-up of ${productName || "product"} features and quality`,
          problemSolution:
            locale === "ja"
              ? `${productName || "製品"}が everyday problems を解決するシーン`
              : `${productName || "Product"} solving everyday problems`,
          emotionalMoment:
            locale === "ja"
              ? `${productName || "製品"}の信頼性に満足する瞬間`
              : `Moment of satisfaction with ${productName || "product"} reliability`,
          callToAction:
            locale === "ja"
              ? `店舗で${productName || "製品"}を確認するシーンとブランドロゴ`
              : `Checking ${productName || "product"} at store with brand logo`,
        },
      },
    };

    return (strategyMap[category] || strategyMap[ProductCategory.OTHER]) as CommercialStrategy;
  }
}
