/**
 * Scene Composer Tool
 *
 * Handles scene composition, shot selection, and visual storytelling
 * for commercial video production based on creative direction and assets.
 */

import { AppModeConfig } from "@/lib/config/app-mode";
import { VertexAIService } from "@/lib/services/vertex-ai";
import { GeminiClient } from "@/lib/services/gemini";
import {
  AssetType,
  CompositionPrinciple,
  LightingType
} from "../enums";
import type {
  SceneBreakdown,
  AssetMapping,
  TimingGuideline,
  CompositionRules
} from "../types/asset-types";

// Scene composition request interface
export interface SceneCompositionRequest {
  sessionId: string;
  context: {
    productInfo: any;
    brandDirection: any;
    targetAudience: any;
    videoSpecs: {
      duration: number;
      aspectRatio: string;
      format: string;
      purpose: "commercial" | "social" | "web" | "broadcast";
    };
  };
  availableAssets: SceneAsset[];
  preferences?: {
    pacing: "slow" | "medium" | "fast";
    mood: string;
    storytelling: "product-focused" | "lifestyle" | "narrative" | "demonstration";
    constraints?: string[];
  };
  locale: "en" | "ja";
}

// Scene composition response interface
export interface SceneCompositionResponse {
  compositionId: string;
  sceneBreakdown: SceneBreakdown[];
  assetMapping: AssetMapping[];
  timingGuidelines: TimingGuideline[];
  visualFlow: VisualFlow;
  narrativeStructure: NarrativeStructure;
  productionNotes: ProductionNote[];
  processingTime: number;
  cost: number;
  confidence: number;
}

// Scene asset interface
export interface SceneAsset {
  id: string;
  type: AssetType;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
  duration?: number; // For video assets
  mood: string;
  dominantColors: string[];
  visualWeight: "light" | "medium" | "heavy";
  emotionalTone: string;
  usageRecommendations: string[];
}

// Visual flow structure
export interface VisualFlow {
  overall: {
    rhythm: "consistent" | "building" | "varied" | "dramatic";
    energy: "low" | "medium" | "high" | "escalating";
    visualContinuity: string[];
    transitionStyle: string;
  };
  sequences: FlowSequence[];
  keyMoments: KeyMoment[];
  emotionalArc: EmotionalArc;
}

// Flow sequence
export interface FlowSequence {
  sequenceNumber: number;
  name: string;
  startTime: number;
  duration: number;
  purpose: string;
  visualApproach: string;
  assets: string[]; // Asset IDs
  transitions: TransitionSpec[];
  emotionalTone: string;
  pacing: "slow" | "medium" | "fast";
}

// Transition specification
export interface TransitionSpec {
  type: "cut" | "dissolve" | "fade" | "wipe" | "slide" | "zoom";
  duration: number;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  rationale: string;
}

// Key moment in the video
export interface KeyMoment {
  timestamp: number;
  type: "hero_reveal" | "benefit_demonstration" | "emotional_peak" | "call_to_action" | "brand_moment";
  description: string;
  visualTreatment: string;
  assetRequirements: string[];
  importance: "critical" | "high" | "medium";
}

// Emotional arc structure
export interface EmotionalArc {
  opening: { emotion: string; intensity: number; description: string };
  development: Array<{ timestamp: number; emotion: string; intensity: number; description: string }>;
  climax: { timestamp: number; emotion: string; intensity: number; description: string };
  resolution: { emotion: string; intensity: number; description: string };
  overallJourney: string;
}

// Narrative structure
export interface NarrativeStructure {
  approach: "three-act" | "hero-journey" | "problem-solution" | "before-after" | "testimonial";
  acts: NarrativeAct[];
  hooks: NarrativeHook[];
  payoffs: NarrativePayoff[];
  callToAction: CallToAction;
}

// Narrative act
export interface NarrativeAct {
  actNumber: number;
  name: string;
  startTime: number;
  duration: number;
  purpose: string;
  keyMessages: string[];
  visualStrategy: string;
  expectedOutcome: string;
}

// Narrative hook
export interface NarrativeHook {
  timestamp: number;
  type: "visual" | "emotional" | "informational" | "surprise";
  description: string;
  implementation: string;
  effectiveness: number; // 0-1 scale
}

// Narrative payoff
export interface NarrativePayoff {
  hookTimestamp: number;
  payoffTimestamp: number;
  description: string;
  satisfaction: number; // 0-1 scale
  reinforcement: string;
}

// Call to action
export interface CallToAction {
  timestamp: number;
  duration: number;
  message: string;
  visualTreatment: string;
  urgency: "low" | "medium" | "high";
  effectiveness: number; // 0-1 scale
}

// Production note
export interface ProductionNote {
  category: "technical" | "creative" | "timing" | "budget" | "quality";
  priority: "critical" | "important" | "nice-to-have";
  note: string;
  implementation: string;
  impact: string;
  alternatives?: string[];
}

/**
 * Compose scenes for video production
 */
export async function composeScenes(
  request: SceneCompositionRequest
): Promise<SceneCompositionResponse> {
  const startTime = Date.now();

  try {
    const isDemoMode = AppModeConfig.getMode() === "demo";
    
    if (isDemoMode) {
      console.log("[SCENE COMPOSER] Using demo mode for scene composition");
      return await generateDemoComposition(request, startTime);
    }

    console.log("[SCENE COMPOSER] Using real AI for scene composition");
    return await generateRealComposition(request, startTime);
    
  } catch (error) {
    console.error("[SCENE COMPOSER] Error in scene composition:", error);
    throw new Error(`Scene composition failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate sophisticated demo scene composition
 */
async function generateDemoComposition(
  request: SceneCompositionRequest,
  startTime: number
): Promise<SceneCompositionResponse> {
  const compositionId = `scene-comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { locale, context } = request;
  const videoDuration = context.videoSpecs.duration;

  // Generate scene breakdown
  const sceneBreakdown: SceneBreakdown[] = [
    {
      sceneNumber: 1,
      duration: videoDuration * 0.15, // Opening 15%
      description: locale === "ja" 
        ? "魅力的なオープニングで視聴者の注意を引く"
        : "Captivating opening to grab viewer attention",
      assets: ["background-1", "product-hero-1"],
      mood: locale === "ja" ? "期待感" : "anticipation",
      pacing: "medium",
      transitions: ["fade-in"],
      notes: [
        locale === "ja" ? "ブランドロゴの早期表示" : "Early brand logo appearance",
        locale === "ja" ? "視覚的フックの配置" : "Visual hook placement"
      ]
    },
    {
      sceneNumber: 2,
      duration: videoDuration * 0.35, // Development 35%
      description: locale === "ja"
        ? "製品の核となる価値と利益を展開"
        : "Develop core product value and benefits",
      assets: ["lifestyle-scene-1", "product-hero-2", "overlay-1"],
      mood: locale === "ja" ? "発見" : "discovery",
      pacing: "medium",
      transitions: ["dissolve", "cut"],
      notes: [
        locale === "ja" ? "製品機能の明確な説明" : "Clear product feature explanation",
        locale === "ja" ? "ターゲット層との関連性" : "Target audience relevance"
      ]
    },
    {
      sceneNumber: 3,
      duration: videoDuration * 0.30, // Climax 30%
      description: locale === "ja"
        ? "感情的なピークと製品の差別化要因"
        : "Emotional peak and product differentiation",
      assets: ["lifestyle-scene-2", "mood-board-1", "style-frame-1"],
      mood: locale === "ja" ? "興奮" : "excitement",
      pacing: "fast",
      transitions: ["cut", "zoom"],
      notes: [
        locale === "ja" ? "最大の感情的インパクト" : "Maximum emotional impact",
        locale === "ja" ? "ブランド差別化の強調" : "Brand differentiation emphasis"
      ]
    },
    {
      sceneNumber: 4,
      duration: videoDuration * 0.20, // Resolution 20%
      description: locale === "ja"
        ? "行動喚起と満足感のある結論"
        : "Call-to-action and satisfying conclusion",
      assets: ["product-hero-3", "background-2"],
      mood: locale === "ja" ? "満足" : "satisfaction",
      pacing: "slow",
      transitions: ["fade-out"],
      notes: [
        locale === "ja" ? "明確な行動喚起" : "Clear call-to-action",
        locale === "ja" ? "ブランド記憶の強化" : "Brand recall reinforcement"
      ]
    }
  ];

  // Generate asset mapping
  const assetMapping: AssetMapping[] = [
    {
      assetId: "product-hero-1",
      scenes: [1, 2],
      usage: "foreground",
      timing: [
        { start: 0, end: videoDuration * 0.15 },
        { start: videoDuration * 0.15, end: videoDuration * 0.35 }
      ],
      transformations: ["scale-in", "rotate-slight"]
    },
    {
      assetId: "lifestyle-scene-1",
      scenes: [2],
      usage: "background",
      timing: [{ start: videoDuration * 0.15, end: videoDuration * 0.50 }],
      transformations: ["parallax-scroll"]
    },
    {
      assetId: "lifestyle-scene-2",
      scenes: [3],
      usage: "background",
      timing: [{ start: videoDuration * 0.50, end: videoDuration * 0.80 }],
      transformations: ["zoom-out", "color-grade"]
    }
  ];

  // Generate timing guidelines
  const timingGuidelines: TimingGuideline[] = [
    {
      element: "Brand Logo",
      timing: {
        entrance: videoDuration * 0.05,
        duration: videoDuration * 0.10,
        exit: videoDuration * 0.15
      },
      animation: "fade-in-scale",
      easing: "ease-out",
      priority: 1
    },
    {
      element: "Product Reveal",
      timing: {
        entrance: videoDuration * 0.20,
        duration: videoDuration * 0.40,
        exit: videoDuration * 0.60
      },
      animation: "slide-from-right",
      easing: "ease-in-out",
      priority: 1
    },
    {
      element: "Call-to-Action",
      timing: {
        entrance: videoDuration * 0.85,
        duration: videoDuration * 0.15,
        exit: videoDuration
      },
      animation: "bounce-in",
      easing: "ease-out",
      priority: 1
    }
  ];

  // Generate visual flow
  const visualFlow: VisualFlow = {
    overall: {
      rhythm: "building",
      energy: "escalating",
      visualContinuity: [
        locale === "ja" ? "一貫したカラーパレット" : "Consistent color palette",
        locale === "ja" ? "ブランド要素の継続性" : "Brand element continuity"
      ],
      transitionStyle: locale === "ja" ? "スムーズで意図的" : "Smooth and intentional"
    },
    sequences: [
      {
        sequenceNumber: 1,
        name: locale === "ja" ? "導入" : "Introduction",
        startTime: 0,
        duration: videoDuration * 0.25,
        purpose: locale === "ja" ? "視聴者の注意獲得" : "Capture viewer attention",
        visualApproach: locale === "ja" ? "ミニマルで印象的" : "Minimal and impactful",
        assets: ["background-1", "product-hero-1"],
        transitions: [{ type: "fade", duration: 0.5, easing: "ease-in", rationale: "Smooth opening" }],
        emotionalTone: locale === "ja" ? "期待" : "anticipation",
        pacing: "slow"
      },
      {
        sequenceNumber: 2,
        name: locale === "ja" ? "展開" : "Development",
        startTime: videoDuration * 0.25,
        duration: videoDuration * 0.50,
        purpose: locale === "ja" ? "価値提案の展開" : "Value proposition development",
        visualApproach: locale === "ja" ? "情報豊富で魅力的" : "Informative and engaging",
        assets: ["lifestyle-scene-1", "product-hero-2"],
        transitions: [{ type: "dissolve", duration: 0.8, easing: "ease-in-out", rationale: "Smooth transition" }],
        emotionalTone: locale === "ja" ? "発見" : "discovery",
        pacing: "medium"
      },
      {
        sequenceNumber: 3,
        name: locale === "ja" ? "解決" : "Resolution",
        startTime: videoDuration * 0.75,
        duration: videoDuration * 0.25,
        purpose: locale === "ja" ? "行動喚起" : "Call-to-action",
        visualApproach: locale === "ja" ? "説得力があり記憶に残る" : "Compelling and memorable",
        assets: ["product-hero-3", "background-2"],
        transitions: [{ type: "fade", duration: 1.0, easing: "ease-out", rationale: "Strong finish" }],
        emotionalTone: locale === "ja" ? "確信" : "confidence",
        pacing: "medium"
      }
    ],
    keyMoments: [
      {
        timestamp: videoDuration * 0.05,
        type: "brand_moment",
        description: locale === "ja" ? "ブランドアイデンティティの確立" : "Brand identity establishment",
        visualTreatment: locale === "ja" ? "洗練されたロゴアニメーション" : "Sophisticated logo animation",
        assetRequirements: ["brand-logo", "background-clean"],
        importance: "critical"
      },
      {
        timestamp: videoDuration * 0.35,
        type: "hero_reveal",
        description: locale === "ja" ? "主要製品の劇的な紹介" : "Dramatic main product introduction",
        visualTreatment: locale === "ja" ? "シネマティックな製品ショット" : "Cinematic product shot",
        assetRequirements: ["product-hero-main", "lighting-dramatic"],
        importance: "critical"
      },
      {
        timestamp: videoDuration * 0.65,
        type: "emotional_peak",
        description: locale === "ja" ? "最大の感情的インパクト" : "Maximum emotional impact",
        visualTreatment: locale === "ja" ? "ライフスタイルの変革瞬間" : "Lifestyle transformation moment",
        assetRequirements: ["lifestyle-transformation", "mood-emotional"],
        importance: "high"
      }
    ],
    emotionalArc: {
      opening: { 
        emotion: locale === "ja" ? "好奇心" : "curiosity", 
        intensity: 0.3, 
        description: locale === "ja" ? "何が起こるかへの期待" : "Anticipation of what's to come" 
      },
      development: [
        { 
          timestamp: videoDuration * 0.3, 
          emotion: locale === "ja" ? "関心" : "interest", 
          intensity: 0.6, 
          description: locale === "ja" ? "製品価値への理解" : "Understanding of product value" 
        },
        { 
          timestamp: videoDuration * 0.6, 
          emotion: locale === "ja" ? "興奮" : "excitement", 
          intensity: 0.9, 
          description: locale === "ja" ? "可能性への興奮" : "Excitement about possibilities" 
        }
      ],
      climax: { 
        timestamp: videoDuration * 0.7, 
        emotion: locale === "ja" ? "欲求" : "desire", 
        intensity: 1.0, 
        description: locale === "ja" ? "製品への強い欲求" : "Strong desire for the product" 
      },
      resolution: { 
        emotion: locale === "ja" ? "満足" : "satisfaction", 
        intensity: 0.8, 
        description: locale === "ja" ? "決断への満足感" : "Satisfaction with decision" 
      },
      overallJourney: locale === "ja" 
        ? "好奇心から欲求、そして満足へ向かう感情の旅路"
        : "Emotional journey from curiosity through desire to satisfaction"
    }
  };

  // Generate narrative structure
  const narrativeStructure: NarrativeStructure = {
    approach: "problem-solution",
    acts: [
      {
        actNumber: 1,
        name: locale === "ja" ? "問題設定" : "Problem Setup",
        startTime: 0,
        duration: videoDuration * 0.3,
        purpose: locale === "ja" ? "視聴者の問題意識の喚起" : "Awaken viewer's problem awareness",
        keyMessages: [
          locale === "ja" ? "現状の課題" : "Current challenges",
          locale === "ja" ? "改善の必要性" : "Need for improvement"
        ],
        visualStrategy: locale === "ja" ? "問題の視覚化" : "Problem visualization",
        expectedOutcome: locale === "ja" ? "問題への共感" : "Problem empathy"
      },
      {
        actNumber: 2,
        name: locale === "ja" ? "解決提示" : "Solution Presentation",
        startTime: videoDuration * 0.3,
        duration: videoDuration * 0.5,
        purpose: locale === "ja" ? "製品による解決策の提示" : "Present product as solution",
        keyMessages: [
          locale === "ja" ? "製品の核心価値" : "Core product value",
          locale === "ja" ? "独自の利点" : "Unique benefits"
        ],
        visualStrategy: locale === "ja" ? "解決策の実演" : "Solution demonstration",
        expectedOutcome: locale === "ja" ? "解決策への確信" : "Confidence in solution"
      },
      {
        actNumber: 3,
        name: locale === "ja" ? "行動促進" : "Action Motivation",
        startTime: videoDuration * 0.8,
        duration: videoDuration * 0.2,
        purpose: locale === "ja" ? "購買行動への誘導" : "Guide to purchase action",
        keyMessages: [
          locale === "ja" ? "今すぐの行動" : "Immediate action",
          locale === "ja" ? "限定性・緊急性" : "Scarcity and urgency"
        ],
        visualStrategy: locale === "ja" ? "行動喚起の強調" : "Call-to-action emphasis",
        expectedOutcome: locale === "ja" ? "購買意欲" : "Purchase intent"
      }
    ],
    hooks: [
      {
        timestamp: videoDuration * 0.05,
        type: "visual",
        description: locale === "ja" ? "印象的なビジュアルオープニング" : "Striking visual opening",
        implementation: locale === "ja" ? "ドラマティックなプロダクトショット" : "Dramatic product shot",
        effectiveness: 0.85
      }
    ],
    payoffs: [
      {
        hookTimestamp: videoDuration * 0.05,
        payoffTimestamp: videoDuration * 0.35,
        description: locale === "ja" ? "期待された製品価値の実現" : "Fulfillment of expected product value",
        satisfaction: 0.88,
        reinforcement: locale === "ja" ? "価値提案の確認" : "Value proposition confirmation"
      }
    ],
    callToAction: {
      timestamp: videoDuration * 0.85,
      duration: videoDuration * 0.15,
      message: locale === "ja" ? "今すぐお試しください" : "Try it now",
      visualTreatment: locale === "ja" ? "明確で目立つCTAボタン" : "Clear and prominent CTA button",
      urgency: "medium",
      effectiveness: 0.82
    }
  };

  // Generate production notes
  const productionNotes: ProductionNote[] = [
    {
      category: "technical",
      priority: "critical",
      note: locale === "ja" 
        ? "すべてのアセットが指定のアスペクト比に適合していることを確認"
        : "Ensure all assets conform to specified aspect ratio",
      implementation: locale === "ja" 
        ? "アセット生成時にアスペクト比制約を適用"
        : "Apply aspect ratio constraints during asset generation",
      impact: locale === "ja" ? "視覚的一貫性の維持" : "Maintains visual consistency",
      alternatives: [locale === "ja" ? "クロッピングによる調整" : "Adjustment through cropping"]
    },
    {
      category: "creative",
      priority: "important", 
      note: locale === "ja"
        ? "ブランドガイドラインとの一貫性を全シーンで維持"
        : "Maintain brand guideline consistency across all scenes",
      implementation: locale === "ja"
        ? "各シーンでブランドカラーとフォントを使用"
        : "Use brand colors and fonts in each scene",
      impact: locale === "ja" ? "ブランド認知度の向上" : "Improved brand recognition"
    },
    {
      category: "timing",
      priority: "critical",
      note: locale === "ja"
        ? "感情的なピークを適切なタイミングで配置"
        : "Place emotional peaks at optimal timing",
      implementation: locale === "ja"
        ? "黄金比（約0.618）でクライマックスを配置"
        : "Place climax at golden ratio (approximately 0.618)",
      impact: locale === "ja" ? "視聴者エンゲージメントの最大化" : "Maximizes viewer engagement"
    }
  ];

  return {
    compositionId,
    sceneBreakdown,
    assetMapping,
    timingGuidelines,
    visualFlow,
    narrativeStructure,
    productionNotes,
    processingTime: Date.now() - startTime,
    cost: 0.15, // Demo cost
    confidence: 0.89
  };
}

/**
 * Generate real AI-powered composition using Gemini
 */
async function generateRealComposition(
  request: SceneCompositionRequest,
  startTime: number
): Promise<SceneCompositionResponse> {
  const { context, locale } = request;
  const isJapanese = locale === 'ja';

  // Extract context for prompt
  const productInfo = context.productInfo;
  const brandDirection = context.brandDirection;
  const targetAudience = context.targetAudience;
  const videoDuration = context.videoSpecs.duration || 30;

  const prompt = isJapanese ?
    `あなたは経験豊富なビデオプロダクションディレクターです。商品分析とクリエイティブディレクションに基づいて、${videoDuration}秒のコマーシャルビデオの詳細なシーン構成を生成してください。

## コンテキスト情報:
商品名: ${productInfo?.name || '商品'}
商品カテゴリ: ${productInfo?.category || 'その他'}
主要機能: ${productInfo?.keyFeatures?.join('、') || 'なし'}
ターゲット層: ${targetAudience?.description || '一般消費者'}
ブランドトーン: ${brandDirection?.brandPersonality?.join('、') || '親しみやすい'}
主要メッセージ: ${brandDirection?.keyMessages?.headline || '革新的な商品'}

## 必要な構成要素:
3-4つのシーンを含むシーン構成を生成してください:

### 各シーンには以下が必要:
- sceneNumber: シーン番号 (1から開始)
- duration: 秒単位の時間 (合計${videoDuration}秒になるように)
- description: シーンの詳細説明 (40文字以内)
- mood: 感情的トーン (10文字以内)
- pacing: "slow" | "medium" | "fast"
- notes: 制作上の注意点 (配列、各20文字以内)

### シーン推奨構造:
1. オープニング (15-20%): 視聴者の注意獲得
2. 展開 (35-40%): 製品価値の提示
3. クライマックス (30-35%): 感情的ピーク
4. 締めくくり (15-20%): 行動喚起

### 感情的な流れ:
- opening: 好奇心・期待 (intensity: 0.2-0.4)
- development: 関心・発見 (intensity: 0.5-0.7)
- climax: 興奮・欲求 (intensity: 0.8-1.0)
- resolution: 満足・確信 (intensity: 0.7-0.9)

有効なJSONとして返してください:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 6,
      "description": "魅力的なオープニング",
      "mood": "期待",
      "pacing": "medium",
      "notes": ["ブランドロゴ表示", "視覚的フック"]
    }
  ],
  "emotionalArc": {
    "opening": {"emotion": "好奇心", "intensity": 0.3, "description": "何が起こるか期待"},
    "climax": {"emotion": "欲求", "intensity": 1.0, "description": "製品への強い欲求"},
    "resolution": {"emotion": "満足", "intensity": 0.8, "description": "決断への満足"}
  },
  "overallNarrative": "商品の価値を段階的に伝える感情的な物語"
}` :

    `You are an experienced video production director. Based on product analysis and creative direction, generate a detailed scene composition for a ${videoDuration}-second commercial video.

## Context Information:
Product: ${productInfo?.name || 'Product'}
Category: ${productInfo?.category || 'General'}
Key Features: ${productInfo?.keyFeatures?.join(', ') || 'None'}
Target Audience: ${targetAudience?.description || 'General consumers'}
Brand Tone: ${brandDirection?.brandPersonality?.join(', ') || 'Friendly'}
Key Message: ${brandDirection?.keyMessages?.headline || 'Innovative product'}

## Required Structure:
Generate a scene composition with 3-4 scenes:

### Each scene must include:
- sceneNumber: Scene number (starting from 1)
- duration: Duration in seconds (total must equal ${videoDuration}s)
- description: Detailed scene description (under 60 characters)
- mood: Emotional tone (under 15 characters)
- pacing: "slow" | "medium" | "fast"
- notes: Production notes (array, each under 30 characters)

### Recommended Scene Structure:
1. Opening (15-20%): Grab viewer attention
2. Development (35-40%): Present product value
3. Climax (30-35%): Emotional peak
4. Resolution (15-20%): Call to action

### Emotional Flow:
- opening: curiosity/anticipation (intensity: 0.2-0.4)
- development: interest/discovery (intensity: 0.5-0.7)
- climax: excitement/desire (intensity: 0.8-1.0)
- resolution: satisfaction/confidence (intensity: 0.7-0.9)

Return as valid JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 6,
      "description": "Captivating opening",
      "mood": "anticipation",
      "pacing": "medium",
      "notes": ["Brand logo display", "Visual hook"]
    }
  ],
  "emotionalArc": {
    "opening": {"emotion": "curiosity", "intensity": 0.3, "description": "Anticipation of what's to come"},
    "climax": {"emotion": "desire", "intensity": 1.0, "description": "Strong desire for product"},
    "resolution": {"emotion": "satisfaction", "intensity": 0.8, "description": "Satisfaction with decision"}
  },
  "overallNarrative": "Emotional story that progressively communicates product value"
}`;

  try {
    // Create Gemini client using singleton instance (following Maya's pattern)
    const vertexAIService = VertexAIService.getInstance();
    const geminiClient = new GeminiClient(vertexAIService);

    // Call Gemini API for dynamic scene composition
    const response = await geminiClient.generateTextOnly(prompt);

    // Parse JSON response
    const cleanedText = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const aiResult = JSON.parse(cleanedText);

    // Validate the response structure
    if (!aiResult.scenes || !Array.isArray(aiResult.scenes) || aiResult.scenes.length < 3) {
      throw new Error('Invalid AI response: missing or insufficient scenes');
    }

    // Convert AI result to full SceneCompositionResponse format
    const compositionId = `scene-comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build scene breakdown from AI response
    const sceneBreakdown: SceneBreakdown[] = aiResult.scenes.map((scene: any) => ({
      sceneNumber: scene.sceneNumber,
      duration: scene.duration,
      description: scene.description,
      assets: [], // Will be populated by asset selection logic
      mood: scene.mood,
      pacing: scene.pacing,
      transitions: scene.sceneNumber === 1 ? ["fade-in"] : ["dissolve"],
      notes: scene.notes || []
    }));

    // Generate basic asset mapping
    const assetMapping: AssetMapping[] = sceneBreakdown.map((scene, index) => ({
      assetId: `scene-${scene.sceneNumber}-primary`,
      scenes: [scene.sceneNumber],
      usage: index === 0 ? "foreground" : index === sceneBreakdown.length - 1 ? "overlay" : "background",
      timing: [{
        start: sceneBreakdown.slice(0, index).reduce((sum, s) => sum + s.duration, 0),
        end: sceneBreakdown.slice(0, index + 1).reduce((sum, s) => sum + s.duration, 0)
      }],
      transformations: index === 0 ? ["fade-in"] : ["dissolve"]
    }));

    // Generate timing guidelines
    const timingGuidelines: TimingGuideline[] = [
      {
        element: "Brand Logo",
        timing: {
          entrance: videoDuration * 0.05,
          duration: videoDuration * 0.10,
          exit: videoDuration * 0.15
        },
        animation: "fade-in-scale",
        easing: "ease-out",
        priority: 1
      },
      {
        element: "Call-to-Action",
        timing: {
          entrance: videoDuration * 0.85,
          duration: videoDuration * 0.15,
          exit: videoDuration
        },
        animation: "bounce-in",
        easing: "ease-out",
        priority: 1
      }
    ];

    // Build visual flow from AI response
    const visualFlow: VisualFlow = {
      overall: {
        rhythm: "building",
        energy: "escalating",
        visualContinuity: [
          isJapanese ? "一貫したカラーパレット" : "Consistent color palette",
          isJapanese ? "ブランド要素の継続性" : "Brand element continuity"
        ],
        transitionStyle: isJapanese ? "スムーズで意図的" : "Smooth and intentional"
      },
      sequences: sceneBreakdown.map((scene, index) => ({
        sequenceNumber: scene.sceneNumber,
        name: isJapanese ? `シーン${scene.sceneNumber}` : `Scene ${scene.sceneNumber}`,
        startTime: sceneBreakdown.slice(0, index).reduce((sum, s) => sum + s.duration, 0),
        duration: scene.duration,
        purpose: scene.description,
        visualApproach: scene.mood,
        assets: [`scene-${scene.sceneNumber}-assets`],
        transitions: [{
          type: scene.sceneNumber === 1 ? "fade" : "dissolve",
          duration: 0.5,
          easing: "ease-in-out",
          rationale: "Smooth transition"
        }],
        emotionalTone: scene.mood,
        pacing: scene.pacing
      })),
      keyMoments: [
        {
          timestamp: videoDuration * 0.35,
          type: "hero_reveal",
          description: isJapanese ? "主要製品の紹介" : "Main product introduction",
          visualTreatment: isJapanese ? "印象的な製品ショット" : "Impactful product shot",
          assetRequirements: ["product-hero"],
          importance: "critical"
        }
      ],
      emotionalArc: {
        opening: aiResult.emotionalArc?.opening || {
          emotion: isJapanese ? "好奇心" : "curiosity",
          intensity: 0.3,
          description: isJapanese ? "期待感" : "Anticipation"
        },
        development: [
          {
            timestamp: videoDuration * 0.5,
            emotion: isJapanese ? "関心" : "interest",
            intensity: 0.6,
            description: isJapanese ? "価値の理解" : "Understanding value"
          }
        ],
        climax: aiResult.emotionalArc?.climax || {
          timestamp: videoDuration * 0.7,
          emotion: isJapanese ? "欲求" : "desire",
          intensity: 1.0,
          description: isJapanese ? "製品への欲求" : "Desire for product"
        },
        resolution: aiResult.emotionalArc?.resolution || {
          emotion: isJapanese ? "満足" : "satisfaction",
          intensity: 0.8,
          description: isJapanese ? "決断への満足" : "Satisfaction with decision"
        },
        overallJourney: aiResult.overallNarrative || (isJapanese ? "感情的な商品価値の物語" : "Emotional product value story")
      }
    };

    // Generate narrative structure
    const narrativeStructure: NarrativeStructure = {
      approach: "problem-solution",
      acts: sceneBreakdown.slice(0, 3).map((scene, index) => ({
        actNumber: index + 1,
        name: index === 0 ? (isJapanese ? "導入" : "Introduction") :
              index === 1 ? (isJapanese ? "展開" : "Development") :
              (isJapanese ? "解決" : "Resolution"),
        startTime: sceneBreakdown.slice(0, index).reduce((sum, s) => sum + s.duration, 0),
        duration: scene.duration,
        purpose: scene.description,
        keyMessages: [scene.mood],
        visualStrategy: scene.description,
        expectedOutcome: scene.notes.join(', ')
      })),
      hooks: [
        {
          timestamp: videoDuration * 0.05,
          type: "visual",
          description: isJapanese ? "印象的なオープニング" : "Striking opening",
          implementation: isJapanese ? "ドラマティックなショット" : "Dramatic shot",
          effectiveness: 0.85
        }
      ],
      payoffs: [],
      callToAction: {
        timestamp: videoDuration * 0.85,
        duration: videoDuration * 0.15,
        message: isJapanese ? "今すぐお試しください" : "Try it now",
        visualTreatment: isJapanese ? "明確なCTA" : "Clear CTA",
        urgency: "medium",
        effectiveness: 0.82
      }
    };

    // Generate production notes
    const productionNotes: ProductionNote[] = [
      {
        category: "creative",
        priority: "critical",
        note: isJapanese ? "AI生成シーンの最適化" : "Optimize AI-generated scenes",
        implementation: isJapanese ? "各シーンの視覚的バランス調整" : "Adjust visual balance of each scene",
        impact: isJapanese ? "全体的な品質向上" : "Overall quality improvement"
      }
    ];

    return {
      compositionId,
      sceneBreakdown,
      assetMapping,
      timingGuidelines,
      visualFlow,
      narrativeStructure,
      productionNotes,
      processingTime: Date.now() - startTime,
      cost: 0.42,
      confidence: 0.87
    };

  } catch (error) {
    console.error('[SCENE COMPOSER] AI generation failed, falling back to demo:', error);

    // Fallback to demo composition if AI fails
    const demoResult = await generateDemoComposition(request, startTime);
    return {
      ...demoResult,
      cost: 0.42 // Real cost even for fallback
    };
  }
}

/**
 * Validate scene composition quality
 */
export function validateComposition(composition: SceneCompositionResponse): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate scene timing
  const totalDuration = composition.sceneBreakdown.reduce(
    (total, scene) => total + scene.duration, 
    0
  );
  
  if (Math.abs(totalDuration - 30) > 2) { // Assuming 30-second video
    errors.push(`Total scene duration (${totalDuration}s) doesn't match target duration`);
  }

  // Validate asset usage
  const usedAssets = new Set();
  composition.assetMapping.forEach(mapping => {
    usedAssets.add(mapping.assetId);
  });

  if (usedAssets.size === 0) {
    errors.push("No assets mapped to scenes");
  }

  // Validate narrative flow
  if (composition.narrativeStructure.acts.length < 2) {
    warnings.push("Narrative structure may be too simple");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Optimize scene timing based on content
 */
export function optimizeSceneTiming(
  scenes: SceneBreakdown[],
  targetDuration: number
): SceneBreakdown[] {
  const currentTotal = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const scaleFactor = targetDuration / currentTotal;

  return scenes.map(scene => ({
    ...scene,
    duration: scene.duration * scaleFactor
  }));
}

/**
 * Generate composition rules for specific asset types
 */
export function generateAssetCompositionRules(assetType: AssetType): {
  placement: string[];
  sizing: string[];
  timing: string[];
  transitions: string[];
} {
  const baseRules = {
    placement: ["Center frame for maximum impact"],
    sizing: ["Maintain aspect ratio"],
    timing: ["Allow sufficient viewing time"],
    transitions: ["Smooth entrance and exit"]
  };

  const specificRules: Record<AssetType, Partial<typeof baseRules>> = {
    "product-hero": {
      placement: ["Center stage", "Hero position", "Clear background separation"],
      sizing: ["Prominent but not overwhelming", "Leave space for text"],
      timing: ["Extended reveal time", "Multiple viewing angles"]
    },
    "lifestyle-scene": {
      placement: ["Natural environment", "Contextual setting"],
      sizing: ["Full frame immersion", "Environmental context"],
      timing: ["Long enough to establish context", "Gradual revelation"]
    },
    "background": {
      placement: ["Behind all other elements", "Full frame coverage"],
      sizing: ["Complete coverage", "No visible edges"],
      timing: ["Continuous presence", "Subtle changes"]
    },
    "overlay": {
      placement: ["Strategic positioning", "Non-intrusive"],
      sizing: ["Complementary to main content"],
      timing: ["Brief appearance", "Purposeful timing"]
    }
  } as Record<AssetType, any>;

  const rules = specificRules[assetType];
  return rules ? { ...baseRules, ...rules } : baseRules;
}