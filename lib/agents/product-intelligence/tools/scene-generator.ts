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
          "Failed to generate flexible scenes with Gemini, falling back to rigid scenes:",
          error
        );
      }
    }

    // Fallback to original rigid method
    const rigidScenes = this.generateRigidKeyScenes(category, productName, locale);
    return this.convertRigidToFlexibleFormat(rigidScenes);
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
      // Maintain backward compatibility by providing legacy fields
      opening: scenes[0]?.description || "",
      productShowcase:
        scenes.find((s: any) => s.purpose.includes("product") || s.purpose.includes("showcase"))
          ?.description ||
        scenes[1]?.description ||
        "",
      problemSolution:
        scenes.find((s: any) => s.purpose.includes("problem") || s.purpose.includes("solution"))
          ?.description ||
        scenes[2]?.description ||
        "",
      emotionalMoment:
        scenes.find((s: any) => s.purpose.includes("emotional") || s.purpose.includes("connection"))
          ?.description ||
        scenes[3]?.description ||
        "",
      callToAction: scenes[scenes.length - 1]?.description || "",
    };
  }

  /**
   * Convert rigid scenes to flexible format
   */
  private convertRigidToFlexibleFormat(rigidScenes: KeyScenes): KeyScenes {
    const flexibleScenes = [
      {
        id: "opening",
        title: "Opening",
        description: rigidScenes.opening,
        duration: "3-5 seconds",
        purpose: "hook audience",
      },
      {
        id: "showcase",
        title: "Product Showcase",
        description: rigidScenes.productShowcase,
        duration: "5-8 seconds",
        purpose: "showcase product features",
      },
      {
        id: "solution",
        title: "Problem Solution",
        description: rigidScenes.problemSolution,
        duration: "4-6 seconds",
        purpose: "demonstrate value",
      },
      {
        id: "emotional",
        title: "Emotional Moment",
        description: rigidScenes.emotionalMoment,
        duration: "3-4 seconds",
        purpose: "emotional connection",
      },
      {
        id: "cta",
        title: "Call to Action",
        description: rigidScenes.callToAction,
        duration: "2-3 seconds",
        purpose: "drive action",
      },
    ];

    return {
      scenes: flexibleScenes,
      // Keep legacy fields for backward compatibility
      ...rigidScenes,
    };
  }

  /**
   * Generate rigid key scenes based on category and locale
   *
   * This is the original template-based approach that provides consistent
   * but less flexible scene generation.
   */
  public generateRigidKeyScenes(
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
}
