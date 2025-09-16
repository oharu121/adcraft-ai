/**
 * Style Options Generator
 *
 * Following Maya's quickActions pattern - generates style options for Creative Director
 * Demo mode: Returns dictionary-based options
 * Real mode: Generates AI-based options
 */

import type { StyleOption } from '../types/api-types';
import { AppModeConfig } from '@/lib/config/app-mode';
import { VertexAIService } from '@/lib/services/vertex-ai';
import { GeminiClient } from '@/lib/services/gemini';

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
    // Use AI to generate fully dynamic style options based on Maya's product analysis
    const aiGeneratedOptions = await generateAIStyleOptions(mayaHandoffData, locale);
    return aiGeneratedOptions;

  } catch (error) {
    console.error('[Style Options Generator] AI generation failed, falling back to demo options:', error);
    return generateDemoStyleOptions(locale);
  }
}

/**
 * Generate fully AI-based style options using Gemini (following Maya's generateContextualQuickActions pattern)
 */
async function generateAIStyleOptions(
  mayaHandoffData: any,
  locale: 'en' | 'ja'
): Promise<StyleOption[]> {
  const isJapanese = locale === 'ja';
  const productAnalysis = mayaHandoffData?.productAnalysis;

  if (!productAnalysis) {
    throw new Error('No product analysis available for AI style generation');
  }

  const prompt = isJapanese ?
    `あなたは創造的なビジュアルディレクターです。Maya（プロダクト・インテリジェンス・アシスタント）の商品分析に基づいて、4つの独特なビジュアルスタイルオプションを生成してください。

商品分析:
商品名: ${productAnalysis.product?.name || '商品'}
カテゴリ: ${productAnalysis.product?.category || 'その他'}
主要機能: ${productAnalysis.product?.keyFeatures?.join(', ') || 'なし'}
ターゲット層: ${productAnalysis.targetAudience?.description || '一般消費者'}
ブランドトーン: ${productAnalysis.brandPersonality?.join(', ') || '親しみやすい'}
主要メッセージ: ${productAnalysis.keyMessages?.headline || '革新的な商品'}

各スタイルオプションには以下が必要です:
- id: ユニークなID（kebab-case）
- name: スタイル名（15文字以内）
- description: 詳細説明（80文字以内）
- colorPalette: 4つのhexカラーコード
- visualKeywords: 4つのキーワード（各10文字以内）
- animationStyle: "Static" | "Subtle Motion" | "Dynamic" | "Gentle" | "Professional"のいずれか
- examples: 3つの具体例（各20文字以内）

4つの異なる方向性を提案してください:
1. プレミアム/洗練系
2. エネルギッシュ/ダイナミック系
3. 親しみやすい/ライフスタイル系
4. 商品の特性に最も合うカスタム系

有効なJSONとして返してください:
[{"id": "style-1", "name": "スタイル名", "description": "説明", "colorPalette": ["#000000", "#ffffff", "#ff0000", "#00ff00"], "visualKeywords": ["キーワード1", "キーワード2", "キーワード3", "キーワード4"], "animationStyle": "Dynamic", "examples": ["例1", "例2", "例3"]}, ...]` :

    `You are a creative visual director. Based on Maya's (Product Intelligence Assistant) product analysis, generate 4 unique visual style options for this commercial video.

Product Analysis:
Product: ${productAnalysis.product?.name || 'Product'}
Category: ${productAnalysis.product?.category || 'General'}
Key Features: ${productAnalysis.product?.keyFeatures?.join(', ') || 'None'}
Target Audience: ${productAnalysis.targetAudience?.description || 'General consumers'}
Brand Tone: ${productAnalysis.brandPersonality?.join(', ') || 'Friendly'}
Key Message: ${productAnalysis.keyMessages?.headline || 'Innovative product'}

Each style option must include:
- id: Unique ID (kebab-case)
- name: Style name (under 25 characters)
- description: Detailed description (under 120 characters)
- colorPalette: 4 hex color codes
- visualKeywords: 4 keywords (each under 15 characters)
- animationStyle: One of "Static" | "Subtle Motion" | "Dynamic" | "Gentle" | "Professional"
- examples: 3 specific examples (each under 30 characters)

Create 4 different directions:
1. Premium/Sophisticated approach
2. Energetic/Dynamic approach
3. Approachable/Lifestyle approach
4. Custom approach best suited to this specific product

Return as valid JSON:
[{"id": "style-1", "name": "Style Name", "description": "Description", "colorPalette": ["#000000", "#ffffff", "#ff0000", "#00ff00"], "visualKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"], "animationStyle": "Dynamic", "examples": ["example1", "example2", "example3"]}, ...]`;

  try {
    // Create Gemini client using singleton instance (following Maya's pattern)
    const vertexAIService = VertexAIService.getInstance();
    const geminiClient = new GeminiClient(vertexAIService);

    // Call Gemini API for dynamic style options
    const response = await geminiClient.generateTextOnly(prompt);

    // Parse JSON response (following Maya's parsing pattern)
    const cleanedText = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const styleOptions = JSON.parse(cleanedText);

    // Validate the response is an array of valid StyleOption objects
    if (Array.isArray(styleOptions) &&
        styleOptions.length >= 3 &&
        styleOptions.every(option =>
          option.id &&
          option.name &&
          option.description &&
          Array.isArray(option.colorPalette) &&
          Array.isArray(option.visualKeywords) &&
          Array.isArray(option.examples) &&
          option.animationStyle
        )) {
      // Return exactly 4 options for consistency
      return styleOptions.slice(0, 4);
    } else {
      throw new Error('Invalid response format from Gemini');
    }

  } catch (error) {
    console.error('Error generating AI style options:', error);
    throw error; // Re-throw to trigger fallback in parent function
  }
}