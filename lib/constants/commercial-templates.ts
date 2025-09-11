/**
 * Commercial Strategy Templates by Category and Locale
 * 
 * Pre-defined commercial video strategy templates for different product categories.
 * Used by the flexible scene generation system and commercial strategy generation.
 */

import { ProductCategory } from "../agents/product-intelligence/enums";


/**
 * Commercial strategy template structure
 */
export interface CommercialStrategyTemplate {
  headline: ((productName?: string) => string) | string;
  tagline: string;
  supportingMessages: readonly string[];
  primaryBenefit: (productName?: string) => string;
  callToAction: {
    primary: string;
    secondary: readonly string[];
  };
  narrative: string;
  conflict: string;
  resolution: string;
}

/**
 * Commercial Strategy Templates by Category and Locale
 */
export const COMMERCIAL_STRATEGY_TEMPLATES = {
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
 * Helper function to get commercial strategy template
 */
export function getCommercialStrategyTemplate(category: ProductCategory, locale: "en" | "ja"): CommercialStrategyTemplate {
  return (
    COMMERCIAL_STRATEGY_TEMPLATES[locale][category] ||
    COMMERCIAL_STRATEGY_TEMPLATES[locale][ProductCategory.OTHER]
  );
}