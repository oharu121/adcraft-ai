/**
 * Locale-specific constants for Product Intelligence Analysis
 * 
 * Contains all text, labels, and category-specific data for English and Japanese locales.
 * Used by the Gemini Vision service for consistent, localized product analysis.
 */

import { ProductCategory } from "@/types/product-intelligence/enums";

/**
 * Locale-specific constants interface
 */
export interface LocaleConstants {
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
export const LOCALE_JA: LocaleConstants = {
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
export const LOCALE_EN: LocaleConstants = {
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
 * Helper function to get locale constants
 */
export function getLocaleConstants(locale: "en" | "ja"): LocaleConstants {
  return locale === "ja" ? LOCALE_JA : LOCALE_EN;
}