/**
 * Prompt Builder Utilities
 * 
 * Utilities for building structured prompts for Gemini Vision API.
 * Supports both English and Japanese localization for product analysis.
 */

import type { VisionAnalysisRequest } from "../gemini-vision";

/**
 * Prompt building options
 */
export interface PromptBuildOptions {
  locale: "en" | "ja";
  detailLevel?: "basic" | "detailed" | "comprehensive";
  includeProductName?: boolean;
  includeDescription?: boolean;
}

/**
 * Prompt Builder class
 */
export class PromptBuilder {
  /**
   * Generate comprehensive analysis prompt for vision API
   */
  public static generateAnalysisPrompt(request: VisionAnalysisRequest): string {
    const basePrompt =
      request.locale === "ja" ? this.getJapanesePrompt(request) : this.getEnglishPrompt(request);

    return basePrompt;
  }

  /**
   * Build English analysis prompt
   */
  private static getEnglishPrompt(request: VisionAnalysisRequest): string {
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
   * Build Japanese analysis prompt
   */
  private static getJapanesePrompt(request: VisionAnalysisRequest): string {
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
   * Build a simple text generation prompt (for scene generation, etc.)
   */
  public static buildTextPrompt(
    content: string,
    options?: {
      format?: "json" | "text";
      maxTokens?: number;
      temperature?: number;
    }
  ): string {
    let prompt = content;

    if (options?.format === "json") {
      prompt += "\n\nReturn ONLY valid JSON, no additional text.";
    }

    return prompt;
  }

  /**
   * Build a prompt for scene generation
   */
  public static buildSceneGenerationPrompt(
    productName: string,
    category: string,
    narrative: string,
    locale: "en" | "ja" = "en"
  ): string {
    if (locale === "ja") {
      return `商品「${productName}」（カテゴリ: ${category}）のための魅力的な商業ビデオのシーンを4-5個作成してください。

ブランドの方向性:
- メッセージ: ${narrative}

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

効果的なアプローチ例: ライフスタイル統合、変革ストーリー、社会的証拠、舞台裏、問題解決、憧れ、感情的つながりなど。商品の種類と対象顧客に最も適したアプローチを選んでください。`;
    }

    return `Create 4-5 compelling scenes for a commercial video about "${productName}" (category: ${category}).

Brand direction:
- Message: ${narrative}

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
  }
}