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
 * Locale-specific constants for the Gemini Vision service
 */
interface LocaleConstants {
  sampleProductDescription: string;
  defaultFeatures: string[];
  categoryDescriptions: {
    [ProductCategory.ELECTRONICS]: string;
    [ProductCategory.FASHION]: string;
    [ProductCategory.FOOD_BEVERAGE]: string;
    [ProductCategory.HOME_GARDEN]: string;
    [ProductCategory.HEALTH_BEAUTY]: string;
    [ProductCategory.SPORTS_OUTDOORS]: string;
    [ProductCategory.AUTOMOTIVE]: string;
    [ProductCategory.BOOKS_MEDIA]: string;
    [ProductCategory.TOYS_GAMES]: string;
    [ProductCategory.BUSINESS]: string;
    [ProductCategory.OTHER]: string;
    default: string;
  };
  categoryFeatures: {
    [ProductCategory.ELECTRONICS]: string[];
    [ProductCategory.FASHION]: string[];
    [ProductCategory.FOOD_BEVERAGE]: string[];
    [ProductCategory.HOME_GARDEN]: string[];
    [ProductCategory.HEALTH_BEAUTY]: string[];
    [ProductCategory.SPORTS_OUTDOORS]: string[];
    [ProductCategory.AUTOMOTIVE]: string[];
    [ProductCategory.BOOKS_MEDIA]: string[];
    [ProductCategory.TOYS_GAMES]: string[];
    [ProductCategory.BUSINESS]: string[];
    [ProductCategory.OTHER]: string[];
    default: string[];
  };
  brandVoices: {
    [ProductCategory.ELECTRONICS]: string;
    [ProductCategory.FASHION]: string;
    [ProductCategory.HOME_GARDEN]: string;
    [ProductCategory.FOOD_BEVERAGE]: string;
    [ProductCategory.HEALTH_BEAUTY]: string;
    [ProductCategory.SPORTS_OUTDOORS]: string;
    [ProductCategory.AUTOMOTIVE]: string;
    [ProductCategory.BOOKS_MEDIA]: string;
    [ProductCategory.TOYS_GAMES]: string;
    [ProductCategory.BUSINESS]: string;
  };
  valuePropositions: {
    [key in ProductCategory]: {
      primaryBenefit: (productName?: string) => string;
      supportingBenefits: string[];
      differentiators: string[];
    };
  };
  taglines: {
    [ProductCategory.ELECTRONICS]: string;
    [ProductCategory.FASHION]: string;
    [ProductCategory.HOME_GARDEN]: string;
    [ProductCategory.FOOD_BEVERAGE]: string;
    [ProductCategory.HEALTH_BEAUTY]: string;
    [ProductCategory.SPORTS_OUTDOORS]: string;
    [ProductCategory.AUTOMOTIVE]: string;
    [ProductCategory.BOOKS_MEDIA]: string;
    [ProductCategory.TOYS_GAMES]: string;
    [ProductCategory.BUSINESS]: string;
  };
  callToAction: {
    primary: string;
    secondary: string[];
  };
  sampleProductName: string;
  usageContext: string[];
}

/**
 * Japanese locale constants
 */
const LOCALE_JA: LocaleConstants = {
  sampleProductDescription: "サンプル商品の説明",
  defaultFeatures: ["機能1", "機能2", "機能3"],
  categoryDescriptions: {
    [ProductCategory.ELECTRONICS]:
      "は最新技術を搭載した高品質電子製品です。革新的な機能とプレミアムなデザインで、現代のライフスタイルを豊かにします。",
    [ProductCategory.FASHION]:
      "はスタイルと機能性を兼ね備えたプレミアムファッションアイテムです。高品質な素材と洗練されたデザインが特徴です。",
    [ProductCategory.FOOD_BEVERAGE]:
      "は厳選された原料を使用した高品質な飲食品です。豊かな味わいと上質な体験をお届けします。",
    [ProductCategory.HOME_GARDEN]:
      "は快適な生活空間を創造するホーム＆ガーデン製品です。機能性と美しさを兼ね備えた設計で、毎日の暮らしを豊かにします。",
    [ProductCategory.HEALTH_BEAUTY]:
      "は美と健康をサポートするプレミアム製品です。科学的根拠に基づいた成分で、自然な美しさと健康的なライフスタイルを実現します。",
    [ProductCategory.SPORTS_OUTDOORS]:
      "はアクティブなライフスタイルを支えるスポーツ・アウトドア製品です。プロ仕様の性能と耐久性で、あらゆる冒険をサポートします。",
    [ProductCategory.AUTOMOTIVE]:
      "は革新的な自動車関連製品です。最先端技術と安全性を融合し、ドライビング体験を新たな次元へと押し上げます。",
    [ProductCategory.BOOKS_MEDIA]:
      "は知識と教養を深めるメディア製品です。専門的な内容を分かりやすく提供し、学習と成長をサポートします。",
    [ProductCategory.TOYS_GAMES]:
      "は創造性と学習を促進する玩具・ゲーム製品です。安全性と教育的価値を重視し、子どもから大人まで楽しめる設計です。",
    [ProductCategory.BUSINESS]:
      "はビジネス効率を向上させるソリューション製品です。企業の成長を支援し、競争優位性を確立するための革新的な機能を提供します。",
    [ProductCategory.OTHER]:
      "は品質と機能性を重視して開発された優れた製品です。お客様のニーズに応える革新的なソリューションを提供します。",
    default:
      "は品質と機能性を重視して開発された優れた製品です。お客様のニーズに応える革新的なソリューションを提供します。",
  },
  categoryFeatures: {
    [ProductCategory.ELECTRONICS]: [
      "最新プロセッサー搭載",
      "プレミアム材料使用",
      "高性能バッテリー",
      "直感的ユーザーインターフェース",
      "堅牢で耐久性のある設計",
      "高度セキュリティ機能",
    ],
    [ProductCategory.FASHION]: [
      "プレミアム素材構造",
      "エルゴノミックデザイン",
      "優れた快適性",
      "スタイリッシュな外観",
      "耐久性のある仕上げ",
      "多用途使用可能",
    ],
    [ProductCategory.FOOD_BEVERAGE]: [
      "厳選された天然原料",
      "豊かで複雑な風味プロファイル",
      "職人による手作り品質",
      "プレミアムパッケージング",
      "持続可能な調達",
      "認証品質保証",
    ],
    [ProductCategory.HOME_GARDEN]: [
      "耐久性のある素材",
      "快適性重視設計",
      "メンテナンス簡単",
      "機能性と美観の両立",
      "安全性確保",
      "環境配慮製造",
    ],
    [ProductCategory.HEALTH_BEAUTY]: [
      "科学的根拠成分",
      "肌に優しい処方",
      "天然素材使用",
      "効果実証済み",
      "安心安全品質",
      "持続可能製造",
    ],
    [ProductCategory.SPORTS_OUTDOORS]: [
      "プロ仕様性能",
      "極限耐久性",
      "軽量設計",
      "防水防塵機能",
      "アスリート監修",
      "競技レベル品質",
    ],
    [ProductCategory.AUTOMOTIVE]: [
      "最新技術搭載",
      "安全性最優先",
      "燃費効率性",
      "快適性向上",
      "信頼性確保",
      "レース由来技術",
    ],
    [ProductCategory.BOOKS_MEDIA]: [
      "専門知識集約",
      "実践的内容",
      "分かりやすい構成",
      "最新情報反映",
      "専門家監修",
      "学習効果重視",
    ],
    [ProductCategory.TOYS_GAMES]: [
      "安全性確保",
      "教育的要素",
      "創造性育成",
      "耐久性重視",
      "年齢適応設計",
      "親子で楽しめる",
    ],
    [ProductCategory.BUSINESS]: [
      "業務効率向上",
      "データセキュリティ",
      "統合機能充実",
      "スケーラブル設計",
      "24時間サポート",
      "ROI最適化",
    ],
    [ProductCategory.OTHER]: [
      "高品質材料",
      "革新的デザイン",
      "優れた性能",
      "ユーザーフレンドリー",
      "信頼性の高い品質",
      "プレミアム体験",
    ],
    default: [
      "高品質材料",
      "革新的デザイン",
      "優れた性能",
      "ユーザーフレンドリー",
      "信頼性の高い品質",
      "プレミアム体験",
    ],
  },
  brandVoices: {
    [ProductCategory.ELECTRONICS]: "革新的で権威的、そして感動的 - 非凡を求める方々へ",
    [ProductCategory.FASHION]: "スタイリッシュで自信に満ちた、あなたらしさを表現する",
    [ProductCategory.HOME_GARDEN]: "温かく信頼できる、心地よい暮らしをサポート",
    [ProductCategory.FOOD_BEVERAGE]: "心温まる本格的な味、あなたの毎日を美味しく",
    [ProductCategory.HEALTH_BEAUTY]: "あなたの美しさと健康を大切にサポート",
    [ProductCategory.SPORTS_OUTDOORS]: "冒険心を刺激し、限界を超える力を",
    [ProductCategory.AUTOMOTIVE]: "パワーと自由を提供し、新しい地平線を開く",
    [ProductCategory.BOOKS_MEDIA]: "知識と創造性を育み、心を豊かにする",
    [ProductCategory.TOYS_GAMES]: "楽しさと学びを通じて、笑顔を創造する",
    [ProductCategory.BUSINESS]: "効率と成長を実現し、成功への道筋を示す",
  },
  valuePropositions: {
    [ProductCategory.ELECTRONICS]: {
      primaryBenefit: (productName?: string) =>
        `プロフェッショナルの究極の${productName || "電子機器"}パワーハウス`,
      supportingBenefits: [
        "業界をリードするAI機能",
        "比類なき性能とスピード",
        "洗練されたプレミアムデザイン",
      ],
      differentiators: ["統合されたAIテクノロジー", "プレミアム素材と製造", "専門的な機能セット"],
    },
    [ProductCategory.FASHION]: {
      primaryBenefit: (productName?: string) =>
        `あなたのスタイルを完璧に表現する${productName || "ファッションアイテム"}`,
      supportingBenefits: [
        "最新トレンドを取り入れたデザイン",
        "高品質で快適な着心地",
        "どんな場面でも映える versatility",
      ],
      differentiators: [
        "独占的なデザインコラボレーション",
        "サステナブルな材料使用",
        "限定コレクション",
      ],
    },
    [ProductCategory.HOME_GARDEN]: {
      primaryBenefit: (productName?: string) =>
        `毎日の暮らしを豊かにする${productName || "ホームアイテム"}`,
      supportingBenefits: [
        "快適さと機能性の完璧な融合",
        "耐久性のある高品質素材",
        "どんなインテリアにも調和",
      ],
      differentiators: ["人間工学に基づいたデザイン", "エコフレンドリーな製造", "簡単メンテナンス"],
    },
    [ProductCategory.FOOD_BEVERAGE]: {
      primaryBenefit: (productName?: string) => `本格的な味わいを届ける${productName || "食品"}`,
      supportingBenefits: [
        "厳選された最高品質の原材料",
        "伝統的な製法と現代的な安全性",
        "栄養バランスを考慮した製品",
      ],
      differentiators: [
        "職人による手作りの品質",
        "添加物を最小限に抑えた自然な味",
        "地域の特産品使用",
      ],
    },
    [ProductCategory.HEALTH_BEAUTY]: {
      primaryBenefit: (productName?: string) =>
        `あなたの美と健康を輝かせる${productName || "製品"}`,
      supportingBenefits: ["科学的に実証された成分", "肌に優しい天然素材", "持続可能な美容体験"],
      differentiators: ["皮膚科医推奨", "クリーンビューティー", "個人に合わせたソリューション"],
    },
    [ProductCategory.SPORTS_OUTDOORS]: {
      primaryBenefit: (productName?: string) => `限界を超える${productName || "スポーツ製品"}`,
      supportingBenefits: ["プロ仕様の高性能", "極限環境での耐久性", "アスリートのためのデザイン"],
      differentiators: ["プロアスリート監修", "特許技術採用", "競技レベルの品質"],
    },
    [ProductCategory.AUTOMOTIVE]: {
      primaryBenefit: (productName?: string) =>
        `究極のドライビング体験を提供する${productName || "自動車製品"}`,
      supportingBenefits: ["卓越した性能と信頼性", "最新の安全技術", "プレミアムな快適性"],
      differentiators: ["レース由来の技術", "高級素材使用", "エンジニアリングの粋"],
    },
    [ProductCategory.BOOKS_MEDIA]: {
      primaryBenefit: (productName?: string) => `知識と感動を届ける${productName || "メディア"}`,
      supportingBenefits: ["専門知識の集約", "高品質なコンテンツ", "学習効果の最大化"],
      differentiators: ["専門家による監修", "実践的なアプローチ", "独占的な情報"],
    },
    [ProductCategory.TOYS_GAMES]: {
      primaryBenefit: (productName?: string) =>
        `無限の楽しさを提供する${productName || "おもちゃ"}`,
      supportingBenefits: ["創造性を育む設計", "安全で高品質な材料", "長く楽しめる耐久性"],
      differentiators: ["教育的な要素", "年齢に適した設計", "親子で楽しめる"],
    },
    [ProductCategory.BUSINESS]: {
      primaryBenefit: (productName?: string) =>
        `ビジネスの成長を加速する${productName || "ソリューション"}`,
      supportingBenefits: ["業務効率の大幅向上", "ROIの最大化", "競争優位性の確立"],
      differentiators: ["業界特化の機能", "スケーラブルな設計", "24/7サポート"],
    },
    [ProductCategory.OTHER]: {
      primaryBenefit: (productName?: string) => `あなたのニーズを満たす${productName || "製品"}`,
      supportingBenefits: [
        "高品質な材料と製造",
        "使いやすいデザイン",
        "優れたコストパフォーマンス",
      ],
      differentiators: ["独自の技術", "カスタマイズ可能", "充実したサポート"],
    },
  },
  taglines: {
    [ProductCategory.ELECTRONICS]: "自信。スタイル。あなたらしさ。",
    [ProductCategory.FASHION]: "快適。機能。美しさ。",
    [ProductCategory.HOME_GARDEN]: "快適。機能。美しさ。",
    [ProductCategory.FOOD_BEVERAGE]: "本格。新鮮。満足。",
    [ProductCategory.HEALTH_BEAUTY]: "美しさ。健康。輝き。",
    [ProductCategory.SPORTS_OUTDOORS]: "冒険。パフォーマンス。勝利。",
    [ProductCategory.AUTOMOTIVE]: "パワー。コントロール。自由。",
    [ProductCategory.BOOKS_MEDIA]: "学び。発見。成長。",
    [ProductCategory.TOYS_GAMES]: "遊び。学び。笑顔。",
    [ProductCategory.BUSINESS]: "効率。成長。成功。",
  },
  callToAction: {
    primary: "詳細を確認",
    secondary: ["製品詳細", "お客様の声"],
  },
  sampleProductName: "サンプル商品",
  usageContext: [
    "ビジネス会議",
    "プロフェッショナル撮影",
    "モバイルオフィス",
    "エグゼクティブライフ",
  ],
};

/**
 * English locale constants
 */
const LOCALE_EN: LocaleConstants = {
  sampleProductDescription: "Sample product description",
  defaultFeatures: ["Feature 1", "Feature 2", "Feature 3"],
  categoryDescriptions: {
    [ProductCategory.ELECTRONICS]:
      " represents cutting-edge technology and premium design, enhancing modern lifestyles with innovative features and exceptional performance.",
    [ProductCategory.FASHION]:
      " combines style and functionality in a premium fashion item, featuring high-quality materials and sophisticated design.",
    [ProductCategory.FOOD_BEVERAGE]:
      " is crafted from carefully selected ingredients, delivering rich flavors and a premium experience for discerning customers.",
    [ProductCategory.HOME_GARDEN]:
      " creates comfortable living spaces with home & garden solutions that blend functionality and beauty to enrich daily life.",
    [ProductCategory.HEALTH_BEAUTY]:
      " supports beauty and wellness with premium products featuring scientifically-backed ingredients for natural beauty and healthy lifestyle.",
    [ProductCategory.SPORTS_OUTDOORS]:
      " empowers active lifestyles with sports & outdoor products offering professional-grade performance and durability for every adventure.",
    [ProductCategory.AUTOMOTIVE]:
      " delivers innovative automotive solutions combining cutting-edge technology and safety to elevate the driving experience to new dimensions.",
    [ProductCategory.BOOKS_MEDIA]:
      " enriches knowledge and education with media products that provide expert content in accessible formats to support learning and growth.",
    [ProductCategory.TOYS_GAMES]:
      " fosters creativity and learning through toys & games that prioritize safety and educational value for enjoyment from children to adults.",
    [ProductCategory.BUSINESS]:
      " enhances business efficiency with solution products that support corporate growth and provide innovative features for competitive advantage.",
    [ProductCategory.OTHER]:
      " is an exceptional product developed with a focus on quality and functionality, providing innovative solutions for customer needs.",
    default:
      " is an exceptional product developed with a focus on quality and functionality, providing innovative solutions for customer needs.",
  },
  categoryFeatures: {
    [ProductCategory.ELECTRONICS]: [
      "Latest Generation Processor",
      "Premium Material Construction",
      "High-Performance Battery",
      "Intuitive User Interface",
      "Robust and Durable Design",
      "Advanced Security Features",
    ],
    [ProductCategory.FASHION]: [
      "Premium Material Construction",
      "Ergonomic Design",
      "Superior Comfort",
      "Stylish Appearance",
      "Durable Finish",
      "Versatile Usage",
    ],
    [ProductCategory.FOOD_BEVERAGE]: [
      "Carefully Selected Natural Ingredients",
      "Rich and Complex Flavor Profile",
      "Artisanal Handcrafted Quality",
      "Premium Packaging",
      "Sustainably Sourced",
      "Certified Quality Assurance",
    ],
    [ProductCategory.HOME_GARDEN]: [
      "Durable Materials",
      "Comfort-Focused Design",
      "Easy Maintenance",
      "Functional and Aesthetic",
      "Safety Assured",
      "Eco-Friendly Manufacturing",
    ],
    [ProductCategory.HEALTH_BEAUTY]: [
      "Scientifically Proven Ingredients",
      "Gentle Skin-Friendly Formula",
      "Natural Materials",
      "Clinically Tested Effectiveness",
      "Safe and Reliable Quality",
      "Sustainable Manufacturing",
    ],
    [ProductCategory.SPORTS_OUTDOORS]: [
      "Professional-Grade Performance",
      "Extreme Durability",
      "Lightweight Design",
      "Water and Dust Resistant",
      "Athlete Endorsed",
      "Competition-Level Quality",
    ],
    [ProductCategory.AUTOMOTIVE]: [
      "Latest Technology Integration",
      "Safety First Priority",
      "Fuel Efficiency",
      "Enhanced Comfort",
      "Reliability Assured",
      "Racing-Derived Technology",
    ],
    [ProductCategory.BOOKS_MEDIA]: [
      "Expert Knowledge Compilation",
      "Practical Content",
      "Clear Structure",
      "Up-to-Date Information",
      "Expert Supervised",
      "Learning-Focused",
    ],
    [ProductCategory.TOYS_GAMES]: [
      "Safety Assured",
      "Educational Elements",
      "Creativity Fostering",
      "Durability Focus",
      "Age-Appropriate Design",
      "Family-Friendly Fun",
    ],
    [ProductCategory.BUSINESS]: [
      "Business Efficiency Enhancement",
      "Data Security",
      "Integrated Features",
      "Scalable Design",
      "24/7 Support",
      "ROI Optimization",
    ],
    [ProductCategory.OTHER]: [
      "High-Quality Materials",
      "Innovative Design",
      "Superior Performance",
      "User-Friendly",
      "Reliable Quality",
      "Premium Experience",
    ],
    default: [
      "High-Quality Materials",
      "Innovative Design",
      "Superior Performance",
      "User-Friendly",
      "Reliable Quality",
      "Premium Experience",
    ],
  },
  brandVoices: {
    [ProductCategory.ELECTRONICS]:
      "confident, authoritative, and inspirational - for those who demand the extraordinary",
    [ProductCategory.FASHION]: "stylish, confident, and expressive - defining your unique style",
    [ProductCategory.HOME_GARDEN]:
      "warm, reliable, and supportive - enhancing your comfortable living",
    [ProductCategory.FOOD_BEVERAGE]: "warm, authentic flavors that make every day delicious",
    [ProductCategory.HEALTH_BEAUTY]: "caring support for your beauty and wellness journey",
    [ProductCategory.SPORTS_OUTDOORS]: "adventurous and performance-driven - pushing your limits",
    [ProductCategory.AUTOMOTIVE]: "powerful and liberating - opening new horizons",
    [ProductCategory.BOOKS_MEDIA]: "knowledgeable and inspiring - enriching minds",
    [ProductCategory.TOYS_GAMES]: "fun and educational - creating smiles through play and learning",
    [ProductCategory.BUSINESS]: "efficient and growth-focused - driving success",
  },
  valuePropositions: {
    [ProductCategory.ELECTRONICS]: {
      primaryBenefit: (productName?: string) =>
        `The professional's ultimate ${productName || "electronic"} powerhouse`,
      supportingBenefits: [
        "Industry-leading AI capabilities",
        "Unmatched performance and speed",
        "Sophisticated premium design",
      ],
      differentiators: [
        "Integrated AI technology",
        "Premium materials and construction",
        "Professional feature set",
      ],
    },
    [ProductCategory.FASHION]: {
      primaryBenefit: (productName?: string) =>
        `The perfect ${productName || "fashion piece"} that expresses your unique style`,
      supportingBenefits: [
        "Latest trend-forward design",
        "Premium comfort and quality",
        "Versatile styling for any occasion",
      ],
      differentiators: [
        "Exclusive design collaborations",
        "Sustainable materials",
        "Limited collection pieces",
      ],
    },
    [ProductCategory.HOME_GARDEN]: {
      primaryBenefit: (productName?: string) =>
        `The ${productName || "home essential"} that enriches your daily life`,
      supportingBenefits: [
        "Perfect blend of comfort and functionality",
        "Durable premium materials",
        "Harmonizes with any interior",
      ],
      differentiators: [
        "Ergonomic design principles",
        "Eco-friendly manufacturing",
        "Easy maintenance",
      ],
    },
    [ProductCategory.FOOD_BEVERAGE]: {
      primaryBenefit: (productName?: string) =>
        `Authentic ${productName || "food"} that delivers exceptional taste`,
      supportingBenefits: [
        "Carefully selected premium ingredients",
        "Traditional methods with modern safety",
        "Nutritionally balanced product",
      ],
      differentiators: [
        "Artisanal crafted quality",
        "Natural taste with minimal additives",
        "Local specialty ingredients",
      ],
    },
    [ProductCategory.HEALTH_BEAUTY]: {
      primaryBenefit: (productName?: string) =>
        `${productName || "Product"} that enhances your beauty and wellness`,
      supportingBenefits: [
        "Scientifically proven ingredients",
        "Gentle natural materials",
        "Sustainable beauty experience",
      ],
      differentiators: ["Dermatologist recommended", "Clean beauty", "Personalized solutions"],
    },
    [ProductCategory.SPORTS_OUTDOORS]: {
      primaryBenefit: (productName?: string) =>
        `${productName || "Sports product"} that pushes your limits`,
      supportingBenefits: [
        "Professional-grade performance",
        "Extreme durability",
        "Athlete-designed features",
      ],
      differentiators: ["Pro athlete endorsed", "Patented technology", "Competition-level quality"],
    },
    [ProductCategory.AUTOMOTIVE]: {
      primaryBenefit: (productName?: string) =>
        `${productName || "Automotive product"} that delivers the ultimate driving experience`,
      supportingBenefits: [
        "Exceptional performance and reliability",
        "Latest safety technology",
        "Premium comfort features",
      ],
      differentiators: ["Race-derived technology", "Luxury materials", "Engineering excellence"],
    },
    [ProductCategory.BOOKS_MEDIA]: {
      primaryBenefit: (productName?: string) =>
        `${productName || "Media"} that delivers knowledge and inspiration`,
      supportingBenefits: [
        "Expert knowledge compilation",
        "High-quality content",
        "Maximized learning outcomes",
      ],
      differentiators: ["Expert authored", "Practical approach", "Exclusive insights"],
    },
    [ProductCategory.TOYS_GAMES]: {
      primaryBenefit: (productName?: string) => `${productName || "Toy"} that provides endless fun`,
      supportingBenefits: [
        "Creativity-fostering design",
        "Safe premium materials",
        "Long-lasting durability",
      ],
      differentiators: ["Educational elements", "Age-appropriate design", "Family-friendly fun"],
    },
    [ProductCategory.BUSINESS]: {
      primaryBenefit: (productName?: string) =>
        `${productName || "Business solution"} that accelerates growth`,
      supportingBenefits: [
        "Dramatic efficiency improvements",
        "ROI maximization",
        "Competitive advantage",
      ],
      differentiators: ["Industry-specific features", "Scalable architecture", "24/7 support"],
    },
    [ProductCategory.OTHER]: {
      primaryBenefit: (productName?: string) => `${productName || "Product"} that meets your needs`,
      supportingBenefits: [
        "High-quality materials and construction",
        "User-friendly design",
        "Excellent value",
      ],
      differentiators: ["Unique technology", "Customizable options", "Comprehensive support"],
    },
  },
  taglines: {
    [ProductCategory.ELECTRONICS]: "Confidence. Style. Authenticity.",
    [ProductCategory.FASHION]: "Comfort. Function. Beauty.",
    [ProductCategory.HOME_GARDEN]: "Comfort. Function. Beauty.",
    [ProductCategory.FOOD_BEVERAGE]: "Authentic. Fresh. Satisfying.",
    [ProductCategory.HEALTH_BEAUTY]: "Beauty. Wellness. Radiance.",
    [ProductCategory.SPORTS_OUTDOORS]: "Adventure. Performance. Victory.",
    [ProductCategory.AUTOMOTIVE]: "Power. Control. Freedom.",
    [ProductCategory.BOOKS_MEDIA]: "Learn. Discover. Grow.",
    [ProductCategory.TOYS_GAMES]: "Play. Learn. Smile.",
    [ProductCategory.BUSINESS]: "Efficiency. Growth. Success.",
  },
  callToAction: {
    primary: "Learn More",
    secondary: ["Product Details", "Customer Reviews"],
  },
  sampleProductName: "Sample Product",
  usageContext: [
    "business meetings",
    "professional photography",
    "mobile office",
    "executive lifestyle",
  ],
};

/**
 * Commercial Strategy Templates by Category and Locale
 */
const COMMERCIAL_STRATEGY_TEMPLATES = {
  en: {
    [ProductCategory.ELECTRONICS]: {
      headline: (productName?: string) =>
        `Transcend Professional with ${productName || "Technology"}`,
      tagline: "Power. Prestige. Perfection.",
      supportingMessages: [
        "AI-driven business excellence",
        "Unmatched professional performance",
        "The ultimate competitive edge",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Technology"} that elevates your professional excellence`,
      callToAction: { primary: "Experience Excellence", secondary: ["Shop Now", "Watch Demo"] },
      narrative: "Rise above the competition with cutting-edge innovation",
      conflict: "Outdated technology holds back your potential",
      resolution: "Unlock unprecedented performance and success",
    },
    [ProductCategory.FASHION]: {
      headline: (productName?: string) => `Discover Your Style with ${productName || "Fashion"}`,
      tagline: "Comfort. Function. Beauty.",
      supportingMessages: [
        "Effortless style and elegance",
        "Premium materials and craftsmanship",
        "Confidence-boosting design",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Fashion"} that expresses your unique style`,
      callToAction: {
        primary: "Discover Your Style",
        secondary: ["Shop Collection", "Style Guide"],
      },
      narrative: "Express your authentic self with confidence",
      conflict: "Generic fashion doesn't reflect your personality",
      resolution: "Discover clothing that celebrates your individuality",
    },
    [ProductCategory.HOME_GARDEN]: {
      headline: (productName?: string) =>
        `Transform Your Space with ${productName || "Home Solutions"}`,
      tagline: "Comfort. Function. Beauty.",
      supportingMessages: [
        "Creates your perfect sanctuary",
        "Premium quality and durability",
        "Effortless home transformation",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Home solution"} that creates your perfect sanctuary`,
      callToAction: { primary: "Experience Comfort", secondary: ["Shop Now", "Design Ideas"] },
      narrative: "Create a home that reflects your values and style",
      conflict: "Your space doesn't feel like home",
      resolution: "Transform your house into your dream sanctuary",
    },
    [ProductCategory.FOOD_BEVERAGE]: {
      headline: (productName?: string) =>
        `Taste the Difference with ${productName || "Premium Food"}`,
      tagline: "Authentic. Fresh. Satisfying.",
      supportingMessages: [
        "Authentic flavors and ingredients",
        "Premium sourcing and quality",
        "Memorable culinary experiences",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Food"} that delivers authentic satisfaction`,
      callToAction: { primary: "Taste the Difference", secondary: ["Order Now", "Find Recipes"] },
      narrative: "Savor authentic flavors that bring joy",
      conflict: "Mass-produced food lacks soul and satisfaction",
      resolution: "Discover authentic taste that nourishes body and spirit",
    },
    [ProductCategory.HEALTH_BEAUTY]: {
      headline: (productName?: string) => `Radiate Confidence with ${productName || "Beauty"}`,
      tagline: "Beauty. Wellness. Radiance.",
      supportingMessages: [
        "Natural beauty enhancement",
        "Science-backed formulations",
        "Confidence-boosting results",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Beauty product"} that enhances your natural radiance`,
      callToAction: { primary: "Experience Beauty", secondary: ["Shop Now", "Beauty Tips"] },
      narrative: "Embrace your natural beauty with confidence",
      conflict: "Beauty routines that don't deliver results",
      resolution: "Achieve the radiant, confident look you deserve",
    },
    [ProductCategory.SPORTS_OUTDOORS]: {
      headline: (productName?: string) =>
        `Conquer New Heights with ${productName || "Outdoor Gear"}`,
      tagline: "Adventure. Performance. Victory.",
      supportingMessages: [
        "Peak performance technology",
        "Adventure-ready durability",
        "Victory through preparation",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Gear"} that supports your athletic excellence`,
      callToAction: { primary: "Start Your Adventure", secondary: ["Shop Gear", "Training Tips"] },
      narrative: "Push beyond limits to achieve greatness",
      conflict: "Average gear limits your potential",
      resolution: "Unlock peak performance and conquer new challenges",
    },
    [ProductCategory.AUTOMOTIVE]: {
      headline: (productName?: string) => `Drive Excellence with ${productName || "Automotive"}`,
      tagline: "Power. Control. Freedom.",
      supportingMessages: [
        "Precision engineering and performance",
        "Ultimate driving experience",
        "Freedom to explore",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Vehicle"} that delivers driving excellence`,
      callToAction: {
        primary: "Experience the Drive",
        secondary: ["Schedule Test", "Explore Models"],
      },
      narrative: "Experience the freedom of the open road",
      conflict: "Ordinary vehicles limit your journey",
      resolution: "Discover the perfect balance of power and control",
    },
    [ProductCategory.BOOKS_MEDIA]: {
      headline: (productName?: string) => `Expand Your Mind with ${productName || "Knowledge"}`,
      tagline: "Learn. Discover. Grow.",
      supportingMessages: [
        "Expert knowledge and insights",
        "Life-changing perspectives",
        "Continuous learning journey",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Knowledge"} that transforms your thinking`,
      callToAction: {
        primary: "Start Learning",
        secondary: ["Browse Library", "Get Recommendations"],
      },
      narrative: "Unlock your potential through knowledge",
      conflict: "Limited knowledge holds back your growth",
      resolution: "Discover insights that transform your perspective",
    },
    [ProductCategory.TOYS_GAMES]: {
      headline: (productName?: string) => `Create Memories with ${productName || "Play"}`,
      tagline: "Play. Learn. Smile.",
      supportingMessages: [
        "Imagination-sparking fun",
        "Educational play experiences",
        "Family bonding moments",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Toy"} that creates lasting memories`,
      callToAction: { primary: "Experience the Fun", secondary: ["Shop Toys", "Play Ideas"] },
      narrative: "Create magical moments through play",
      conflict: "Boring toys don't inspire creativity",
      resolution: "Discover play that sparks imagination and joy",
    },
    [ProductCategory.BUSINESS]: {
      headline: (productName?: string) =>
        `Accelerate Growth with ${productName || "Business Solutions"}`,
      tagline: "Efficiency. Growth. Success.",
      supportingMessages: [
        "Streamlined business operations",
        "Scalable growth solutions",
        "Competitive market advantage",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Solution"} that maximizes business efficiency`,
      callToAction: { primary: "Realize Growth", secondary: ["Get Demo", "Speak to Expert"] },
      narrative: "Transform your business for sustainable success",
      conflict: "Inefficient processes limit your growth",
      resolution: "Streamline operations and achieve your business goals",
    },
    [ProductCategory.OTHER]: {
      headline: (productName?: string) =>
        `Discover Quality with ${productName || "Premium Products"}`,
      tagline: "Quality. Trust. Peace of Mind.",
      supportingMessages: [
        "Uncompromising quality standards",
        "Trusted brand reputation",
        "Customer satisfaction guaranteed",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "Product"} that exceeds expectations`,
      callToAction: { primary: "Learn More", secondary: ["Product Details", "Customer Reviews"] },
      narrative: "Experience the confidence that comes with quality",
      conflict: "Poor quality products disappoint and frustrate",
      resolution: "Choose quality that delivers lasting satisfaction",
    },
  },
  ja: {
    [ProductCategory.ELECTRONICS]: {
      headline: (productName?: string) =>
        `${productName || "テクノロジー"}でプロフェッショナルを超越せよ`,
      tagline: "パワー。プレステージ。パーフェクション。",
      supportingMessages: [
        "AI駆動ビジネスエクセレンス",
        "比類なきプロフェッショナルパフォーマンス",
        "究極の競争優位",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "テクノロジー"}があなたのプロフェッショナルエクセレンスを高める`,
      callToAction: { primary: "エクセレンスを体験", secondary: ["今すぐ購入", "デモを見る"] },
      narrative: "最先端イノベーションで競争を勝ち抜く",
      conflict: "時代遅れのテクノロジーがあなたの可能性を制限している",
      resolution: "前例のないパフォーマンスと成功を解き放つ",
    },
    [ProductCategory.FASHION]: {
      headline: (productName?: string) => `${productName || "ファッション"}でスタイルを発見`,
      tagline: "快適。機能。美しさ。",
      supportingMessages: [
        "エフォートレスなスタイルとエレガンス",
        "プレミアム素材と職人技",
        "自信を高めるデザイン",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "ファッション"}があなた独自のスタイルを表現`,
      callToAction: {
        primary: "スタイルを発見",
        secondary: ["コレクションを見る", "スタイルガイド"],
      },
      narrative: "自信を持って本来の自分を表現する",
      conflict: "一般的なファッションはあなたの個性を反映しない",
      resolution: "あなたの個性を祝福する服装を発見する",
    },
    [ProductCategory.HOME_GARDEN]: {
      headline: (productName?: string) => `${productName || "ホームソリューション"}で空間を変革`,
      tagline: "快適。機能。美しさ。",
      supportingMessages: ["完璧な聖域を創造", "プレミアム品質と耐久性", "楽々ホーム変革"],
      primaryBenefit: (productName?: string) =>
        `${productName || "ホームソリューション"}が完璧な聖域を創造`,
      callToAction: { primary: "快適を体験", secondary: ["今すぐ購入", "デザインアイデア"] },
      narrative: "価値とスタイルを反映する家を創る",
      conflict: "あなたの空間が家のように感じない",
      resolution: "家を夢の聖域に変革する",
    },
    [ProductCategory.FOOD_BEVERAGE]: {
      headline: (productName?: string) => `${productName || "プレミアム食品"}で違いを味わう`,
      tagline: "本格。新鮮。満足。",
      supportingMessages: ["本格的な味と素材", "プレミアム調達と品質", "記憶に残る料理体験"],
      primaryBenefit: (productName?: string) => `${productName || "食品"}が本格的な満足を提供`,
      callToAction: { primary: "美味しさを体験", secondary: ["今すぐ注文", "レシピを探す"] },
      narrative: "喜びをもたらす本格的な味を堪能する",
      conflict: "大量生産食品には魂と満足感が欠けている",
      resolution: "体と精神を養う本格的な味を発見する",
    },
    [ProductCategory.HEALTH_BEAUTY]: {
      headline: (productName?: string) => `${productName || "美容"}で自信を放つ`,
      tagline: "美しさ。健康。輝き。",
      supportingMessages: ["自然な美しさの向上", "科学的根拠のある処方", "自信を高める結果"],
      primaryBenefit: (productName?: string) => `${productName || "美容商品"}が自然な輝きを高める`,
      callToAction: { primary: "美しさを実感", secondary: ["今すぐ購入", "美容のコツ"] },
      narrative: "自信を持って自然な美しさを受け入れる",
      conflict: "結果を出さない美容ルーティン",
      resolution: "あなたが望む輝き自信に満ちた見た目を実現する",
    },
    [ProductCategory.SPORTS_OUTDOORS]: {
      headline: (productName?: string) => `${productName || "アウトドアギア"}で新たな高みを征服`,
      tagline: "冒険。パフォーマンス。勝利。",
      supportingMessages: [
        "ピークパフォーマンステクノロジー",
        "冒険対応の耐久性",
        "準備による勝利",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "ギア"}がアスレチックエクセレンスを支援`,
      callToAction: { primary: "冒険を始めよう", secondary: ["ギアを購入", "トレーニングのコツ"] },
      narrative: "限界を超えて偉大さを達成する",
      conflict: "平均的なギアがあなたの可能性を制限する",
      resolution: "ピークパフォーマンスを解き放ち新たな挑戦を征服する",
    },
    [ProductCategory.AUTOMOTIVE]: {
      headline: (productName?: string) => `${productName || "自動車"}でエクセレンスを運転`,
      tagline: "パワー。コントロール。自由。",
      supportingMessages: [
        "精密エンジニアリングとパフォーマンス",
        "究極のドライビング体験",
        "探索する自由",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "車両"}がドライビングエクセレンスを提供`,
      callToAction: { primary: "ドライブを体験", secondary: ["テストを予約", "モデルを探索"] },
      narrative: "オープンロードの自由を体験する",
      conflict: "普通の車両があなたの旅を制限する",
      resolution: "パワーとコントロールの完璧なバランスを発見する",
    },
    [ProductCategory.BOOKS_MEDIA]: {
      headline: (productName?: string) => `${productName || "知識"}で心を広げる`,
      tagline: "学び。発見。成長。",
      supportingMessages: ["専門知識と洞察", "人生を変える視点", "継続的学習の旅"],
      primaryBenefit: (productName?: string) => `${productName || "知識"}が思考を変革する`,
      callToAction: { primary: "学習を開始", secondary: ["ライブラリを見る", "おすすめを得る"] },
      narrative: "知識を通じて可能性を解き放つ",
      conflict: "限られた知識があなたの成長を妨げる",
      resolution: "視点を変える洞察を発見する",
    },
    [ProductCategory.TOYS_GAMES]: {
      headline: (productName?: string) => `${productName || "遊び"}で思い出を創る`,
      tagline: "遊び。学び。笑顔。",
      supportingMessages: ["想像力を刺激する楽しさ", "教育的遊び体験", "家族の絆の瞬間"],
      primaryBenefit: (productName?: string) =>
        `${productName || "おもちゃ"}が永続する思い出を創る`,
      callToAction: { primary: "楽しさを体験", secondary: ["おもちゃを購入", "遊びのアイデア"] },
      narrative: "遊びを通じて魔法的瞬間を創る",
      conflict: "つまらないおもちゃは創造性を刺激しない",
      resolution: "想像力と喜びを刺激する遊びを発見する",
    },
    [ProductCategory.BUSINESS]: {
      headline: (productName?: string) => `${productName || "ビジネスソリューション"}で成長を加速`,
      tagline: "効率。成長。成功。",
      supportingMessages: [
        "合理化されたビジネス運営",
        "スケーラブルな成長ソリューション",
        "競争市場優位",
      ],
      primaryBenefit: (productName?: string) =>
        `${productName || "ソリューション"}がビジネス効率を最大化`,
      callToAction: { primary: "成長を実現", secondary: ["デモを取得", "エキスパートと話す"] },
      narrative: "持続可能な成功のためにビジネスを変革する",
      conflict: "非効率プロセスがあなたの成長を制限する",
      resolution: "運営を合理化しビジネス目標を達成する",
    },
    [ProductCategory.OTHER]: {
      headline: (productName?: string) => `${productName || "プレミアム製品"}で品質を発見`,
      tagline: "品質。信頼。安心。",
      supportingMessages: ["妥協のない品質基準", "信頼されるブランド評判", "顧客満足保証"],
      primaryBenefit: (productName?: string) => `${productName || "製品"}が期待を超える`,
      callToAction: { primary: "詳細を確認", secondary: ["製品詳細", "お客様の声"] },
      narrative: "品質がもたらす自信を体験する",
      conflict: "粗悪な製品が失望とフラストレーションを与える",
      resolution: "永続する満足を提供する品質を選ぶ",
    },
  },
} as const;

/**
 * Helper function to get locale constants
 */
function getLocaleConstants(locale: "en" | "ja"): LocaleConstants {
  return locale === "ja" ? LOCALE_JA : LOCALE_EN;
}

/**
 * Helper function to get commercial strategy template
 */
function getCommercialStrategyTemplate(category: ProductCategory, locale: "en" | "ja") {
  return (
    COMMERCIAL_STRATEGY_TEMPLATES[locale][category] ||
    COMMERCIAL_STRATEGY_TEMPLATES[locale][ProductCategory.OTHER]
  );
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
      positioning: this.generatePositioning(category, request.productName, request.locale),
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
      keyScenes: await this.generateFlexibleKeyScenes(category, productName, template, locale),
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
   * Call Gemini API for text generation
   */
  private async callGeminiAPI(prompt: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found");
    }

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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error("No content received from Gemini API");
    }

    // Try to parse JSON response
    try {
      return JSON.parse(textContent);
    } catch (e) {
      // If JSON parsing fails, return null to trigger fallback
      console.warn("Failed to parse JSON from Gemini response:", textContent);
      return null;
    }
  }
}
