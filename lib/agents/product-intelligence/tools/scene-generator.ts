/**
 * Scene Generator for Commercial Videos
 *
 * Generates both flexible AI-powered scenes and rigid fallback scenes for commercial videos.
 * Includes the new flexible scene generation system that asks Gemini to create
 * product-appropriate scenes based on context and storytelling patterns.
 */

import { CommercialStrategyTemplate } from "@/lib/constants/commercial-templates";
import { ProductCategory } from "../enums";
import { KeyScenes } from "../types";


/**
 * Scene generation options
 */
export interface SceneGenerationOptions {
  category: ProductCategory;
  productName?: string;
  template: CommercialStrategyTemplate;
  locale?: "en" | "ja";
  useMockMode?: boolean;
}

/**
 * API client interface for Gemini calls
 */
export interface GeminiAPIClient {
  callGeminiAPI(prompt: string): Promise<any>;
}

/**
 * Scene Generator class
 */
export class SceneGenerator {
  private geminiClient?: GeminiAPIClient;

  constructor(geminiClient?: GeminiAPIClient) {
    this.geminiClient = geminiClient;
  }

  /**
   * Generate flexible key scenes using Gemini AI based on product context
   *
   * This is the new approach that gives Gemini freedom to create scenes
   * based on product type, category, and brand messaging rather than
   * forcing it into rigid templates.
   */
  public async generateFlexibleKeyScenes(options: SceneGenerationOptions): Promise<KeyScenes> {
    const { category, productName, template, locale = "en", useMockMode = false } = options;
    const product = productName || (locale === "ja" ? "商品" : "product");

    // Try to use real Gemini API if not in mock mode and client is available
    if (!useMockMode && this.geminiClient) {
      try {
        const prompt = this.buildFlexibleScenePrompt(product, category, template, locale);
        const response = await this.geminiClient.callGeminiAPI(prompt);

        if (response && response.scenes && Array.isArray(response.scenes)) {
          return this.buildFlexibleScenesResponse(response.scenes);
        }
      } catch (error) {
        console.warn(
          "Failed to generate flexible scenes with Gemini, falling back to default scenes:",
          error
        );
      }
    }

    // Fallback to default scene structure
    return this.generateDefaultScenes(product, category, template, locale);
  }

  /**
   * Build the prompt for flexible scene generation
   */
  private buildFlexibleScenePrompt(
    product: string,
    category: ProductCategory,
    template: CommercialStrategyTemplate,
    locale: "en" | "ja"
  ): string {
    const headline =
      typeof template.headline === "function" ? template.headline(product) : template.headline;

    if (locale === "ja") {
      return `商品「${product}」（カテゴリ: ${category}）のための魅力的な商業ビデオのシーンを4-5個作成してください。

ブランドの方向性:
- メッセージ: ${template.narrative}
- 課題: ${template.conflict}  
- 解決: ${template.resolution}
- 主要訴求点: ${headline}

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

    return `Create 4-5 compelling scenes for a commercial video about "${product}" (category: ${category}).

Brand direction:
- Message: ${template.narrative}
- Conflict: ${template.conflict}
- Resolution: ${template.resolution}
- Key appeal: ${headline}

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

  /**
   * Build response from flexible scenes
   */
  private buildFlexibleScenesResponse(scenes: any[]): KeyScenes {
    return {
      scenes: scenes,
    };
  }

  /**
   * Generate default scenes when AI generation fails
   */
  private generateDefaultScenes(
    product: string,
    category: ProductCategory,
    template: CommercialStrategyTemplate,
    locale: "en" | "ja" = "en"
  ): KeyScenes {
    const defaultScenes = locale === "ja" ? [
      {
        id: "opening",
        title: "オープニング",
        description: `${product}との出会いのシーン`,
        duration: "3-5秒",
        purpose: "視聴者の関心を引く",
      },
      {
        id: "showcase",
        title: "商品紹介",
        description: `${product}の特徴と魅力`,
        duration: "5-8秒",
        purpose: "商品機能を紹介",
      },
      {
        id: "solution",
        title: "問題解決",
        description: `${product}で日常の課題を解決`,
        duration: "4-6秒",
        purpose: "価値を実証",
      },
      {
        id: "emotional",
        title: "感情的瞬間",
        description: `${product}による満足の瞬間`,
        duration: "3-4秒",
        purpose: "感情的つながり",
      },
      {
        id: "cta",
        title: "行動喚起",
        description: `${product}を体験しよう`,
        duration: "2-3秒",
        purpose: "行動を促す",
      },
    ] : [
      {
        id: "opening",
        title: "Opening Hook",
        description: `Introducing ${product} in daily life`,
        duration: "3-5 seconds",
        purpose: "hook audience",
      },
      {
        id: "showcase",
        title: "Product Showcase",
        description: `${product} features and benefits`,
        duration: "5-8 seconds",
        purpose: "showcase product features",
      },
      {
        id: "solution",
        title: "Problem Solution",
        description: `${product} solves everyday challenges`,
        duration: "4-6 seconds",
        purpose: "demonstrate value",
      },
      {
        id: "emotional",
        title: "Emotional Moment",
        description: `Satisfaction with ${product}`,
        duration: "3-4 seconds",
        purpose: "emotional connection",
      },
      {
        id: "cta",
        title: "Call to Action",
        description: `Experience ${product} today`,
        duration: "2-3 seconds",
        purpose: "drive action",
      },
    ];

    return {
      scenes: defaultScenes,
    };
  }

}
