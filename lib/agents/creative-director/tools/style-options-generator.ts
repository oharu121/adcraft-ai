/**
 * Style Options Generator
 *
 * Following Maya's quickActions pattern - generates style options for Creative Director
 * Demo mode: Returns dictionary-based options
 * Real mode: Generates AI-based options
 */

import type { StyleOption } from '../types/api-types';
import { AppModeConfig } from '@/lib/config/app-mode';

/**
 * Generate style options for Creative Director - follows Maya's quickActions pattern
 */
export async function generateStyleOptions(
  mayaHandoffData: any,
  locale: 'en' | 'ja' = 'en'
): Promise<StyleOption[]> {
  const isDemoMode = AppModeConfig.getMode() === 'demo';

  if (isDemoMode) {
    return generateDemoStyleOptions(locale);
  } else {
    return generateRealStyleOptions(mayaHandoffData, locale);
  }
}

/**
 * Generate demo mode style options from dictionary (like Maya's static quickActions)
 */
function generateDemoStyleOptions(locale: 'en' | 'ja'): StyleOption[] {
  if (locale === 'ja') {
    return [
      {
        id: "premium-minimalism",
        name: "プレミアム・ミニマリズム",
        description: "洗練されたAppleスタイルの美学。ネガティブスペースとプレミアム素材に重点を置いた、清潔で洗練されたデザイン",
        colorPalette: ["#1a1a1a", "#f8f8f8", "#007AFF", "#34C759"],
        visualKeywords: ["清潔なライン", "ネガティブスペース", "プレミアム素材", "繊細な影"],
        animationStyle: "Subtle Motion",
        examples: [
          "滑らかな製品回転",
          "穏やかなパララックススクロール",
          "フェードインテキストアニメーション"
        ]
      },
      {
        id: "tech-dynamic",
        name: "テクノ・ダイナミック",
        description: "イノベーション重視のブランドのための、鮮やかな色彩とダイナミックな構成による大胆でエネルギッシュなアプローチ",
        colorPalette: ["#FF3B30", "#007AFF", "#5856D6", "#FF9500"],
        visualKeywords: ["大胆なコントラスト", "ダイナミックな角度", "エネルギーと動き", "テック・インスパイア"],
        animationStyle: "Dynamic",
        examples: [
          "キネティック・タイポグラフィ",
          "幾何学的トランジション",
          "大胆なスライドアニメーション"
        ]
      },
      {
        id: "luxury-editorial",
        name: "ラグジュアリー・エディトリアル",
        description: "豊かなテクスチャ、ドラマチックな照明、洗練された構成による高級雑誌の美学",
        colorPalette: ["#000000", "#B8860B", "#F5F5DC", "#8B4513"],
        visualKeywords: ["ドラマチックな照明", "豊かなテクスチャ", "エディトリアル品質", "ラグジュアリーポジショニング"],
        animationStyle: "Static",
        examples: [
          "シネマティック・フェード",
          "エレガントなワイプトランジション",
          "洗練されたタイポグラフィの出現"
        ]
      },
      {
        id: "lifestyle-authentic",
        name: "ライフスタイル・オーセンティック",
        description: "現実的な文脈と人とのつながりに焦点を当てた温かく親しみやすいスタイル",
        colorPalette: ["#8B7355", "#F4A460", "#DEB887", "#A0522D"],
        visualKeywords: ["自然な照明", "本物の瞬間", "暖色調", "人間中心"],
        animationStyle: "Gentle",
        examples: [
          "自然なカメラムーブメント",
          "オーガニックトランジション",
          "ライフスタイルストーリーテリング"
        ]
      }
    ];
  }

  // English demo options
  return [
    {
      id: "premium-minimalism",
      name: "Premium Minimalism",
      description: "Clean, sophisticated, Apple-inspired aesthetic with focus on negative space and premium materials",
      colorPalette: ["#1a1a1a", "#f8f8f8", "#007AFF", "#34C759"],
      visualKeywords: ["Clean lines", "Negative space", "Premium materials", "Subtle shadows"],
      animationStyle: "Subtle Motion",
      examples: [
        "Smooth product rotations",
        "Gentle parallax scrolling",
        "Fade-in text animations"
      ]
    },
    {
      id: "tech-dynamic",
      name: "Tech Dynamic",
      description: "Bold, energetic approach with vibrant colors and dynamic compositions for innovation-focused brands",
      colorPalette: ["#FF3B30", "#007AFF", "#5856D6", "#FF9500"],
      visualKeywords: ["Bold contrasts", "Dynamic angles", "Energy & motion", "Tech-inspired"],
      animationStyle: "Dynamic",
      examples: [
        "Kinetic typography",
        "Geometric transitions",
        "Bold slide animations"
      ]
    },
    {
      id: "luxury-editorial",
      name: "Luxury Editorial",
      description: "High-end magazine aesthetic with rich textures, dramatic lighting, and sophisticated compositions",
      colorPalette: ["#000000", "#B8860B", "#F5F5DC", "#8B4513"],
      visualKeywords: ["Dramatic lighting", "Rich textures", "Editorial quality", "Luxury positioning"],
      animationStyle: "Static",
      examples: [
        "Cinematic fades",
        "Elegant wipe transitions",
        "Sophisticated typography reveals"
      ]
    },
    {
      id: "lifestyle-authentic",
      name: "Lifestyle Authentic",
      description: "Warm, approachable style focusing on real-life contexts and human connections",
      colorPalette: ["#8B7355", "#F4A460", "#DEB887", "#A0522D"],
      visualKeywords: ["Natural lighting", "Authentic moments", "Warm tones", "Human-centered"],
      animationStyle: "Subtle Motion",
      examples: [
        "Natural camera movements",
        "Organic transitions",
        "Lifestyle storytelling"
      ]
    }
  ];
}

/**
 * Generate real mode style options using AI (like Maya's dynamic quickActions)
 */
async function generateRealStyleOptions(
  mayaHandoffData: any,
  locale: 'en' | 'ja'
): Promise<StyleOption[]> {
  try {
    // For now, return demo options + one AI-generated custom option
    // TODO: Implement full AI generation using Vertex AI
    const demoOptions = generateDemoStyleOptions(locale);

    // Generate one AI-customized option based on Maya's analysis
    const customOption = generateAICustomizedOption(mayaHandoffData, locale);

    return [customOption, ...demoOptions.slice(0, 2)]; // Custom first, then 2 demos

  } catch (error) {
    console.error('[Style Options Generator] AI generation failed, falling back to demo options:', error);
    return generateDemoStyleOptions(locale);
  }
}

/**
 * Generate AI-customized style option based on Maya's product analysis
 */
function generateAICustomizedOption(mayaHandoffData: any, locale: 'en' | 'ja'): StyleOption {
  const productName = mayaHandoffData?.productAnalysis?.product?.name || 'Product';
  const category = mayaHandoffData?.productAnalysis?.product?.category || 'Consumer';
  const keyFeatures = mayaHandoffData?.productAnalysis?.product?.keyFeatures || [];

  // Simple AI-like customization based on product analysis
  const isHealthBeauty = category.toLowerCase().includes('health') ||
                        category.toLowerCase().includes('beauty') ||
                        keyFeatures.some((f: string) => f.toLowerCase().includes('natural'));

  const isTech = category.toLowerCase().includes('tech') ||
                keyFeatures.some((f: string) => f.toLowerCase().includes('smart'));

  if (isHealthBeauty) {
    return locale === 'ja' ? {
      id: "natural-wellness-custom",
      name: `${productName} ナチュラル・ウェルネス`,
      description: `${productName}の自然で健康的な特性を強調する、穏やかで癒しのビジュアルアプローチ`,
      colorPalette: ["#8FBC8F", "#F5F5DC", "#DEB887", "#98FB98"],
      visualKeywords: ["自然の色調", "有機的な形", "穏やかな照明", "健康的なライフスタイル"],
      animationStyle: "Gentle",
      examples: ["自然な製品動き", "穏やかなフェード効果", "有機的なトランジション"]
    } : {
      id: "natural-wellness-custom",
      name: `${productName} Natural Wellness`,
      description: `Gentle, healing visual approach that emphasizes ${productName}'s natural and wellness qualities`,
      colorPalette: ["#8FBC8F", "#F5F5DC", "#DEB887", "#98FB98"],
      visualKeywords: ["Natural tones", "Organic shapes", "Soft lighting", "Wellness lifestyle"],
      animationStyle: "Gentle",
      examples: ["Natural product movements", "Gentle fade effects", "Organic transitions"]
    };
  }

  // Default tech-oriented custom option
  return locale === 'ja' ? {
    id: "product-focused-custom",
    name: `${productName} プロダクト・フォーカス`,
    description: `${productName}の独特な特徴と価値提案を強調するカスタマイズされたビジュアルアプローチ`,
    colorPalette: ["#2C3E50", "#3498DB", "#ECF0F1", "#E74C3C"],
    visualKeywords: ["製品中心", "クリーンなデザイン", "プロフェッショナル", "価値重視"],
    animationStyle: "Professional",
    examples: ["製品ハイライト", "機能デモンストレーション", "クリーンなトランジション"]
  } : {
    id: "product-focused-custom",
    name: `${productName} Product-Focused`,
    description: `Customized visual approach that highlights ${productName}'s unique features and value proposition`,
    colorPalette: ["#2C3E50", "#3498DB", "#ECF0F1", "#E74C3C"],
    visualKeywords: ["Product-centric", "Clean design", "Professional", "Value-focused"],
    animationStyle: "Professional",
    examples: ["Product highlights", "Feature demonstrations", "Clean transitions"]
  };
}