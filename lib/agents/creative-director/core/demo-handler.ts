/**
 * Creative Director Demo Handler
 *
 * Sophisticated demo mode implementation for David's creative conversations,
 * providing realistic creative expertise without API costs.
 */

import { DAVID_PERSONA } from "@/lib/constants/david-persona";
import {
  CreativeChatRequest,
  CreativeChatResponse,
} from "../types/api-types";
import {
  CreativeMessageType,
  VisualStyle,
  ColorMood,
  CreativePhase,
} from "../enums";

/**
 * Generate sophisticated demo response with David's creative expertise
 */
export async function generateDemoCreativeResponse(
  request: CreativeChatRequest,
  startTime: number
): Promise<CreativeChatResponse> {
  // Simulate David's thoughtful creative process
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

  const locale = request.locale;
  const userMessage = request.message.toLowerCase();

  // Analyze user message for creative intent
  const creativeIntent = analyzeCreativeIntent(userMessage, locale);
  
  // Generate contextual response based on creative phase and intent
  const response = generateContextualCreativeResponse(creativeIntent, request, locale);
  
  return {
    messageId: `david-demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    messageType: response.messageType,
    agentResponse: response.content,
    processingTime: Date.now() - startTime,
    cost: 0.02, // Demo cost simulation
    confidence: response.confidence,
    nextAction: response.nextAction,
    suggestedActions: response.suggestedActions,
    quickActions: response.quickActions,
    visualRecommendations: response.visualRecommendations,
    metadata: response.metadata,
  };
}

/**
 * Analyze user message for creative intent and phase with cultural sensitivity
 */
function analyzeCreativeIntent(message: string, locale: "en" | "ja"): {
  phase: CreativePhase;
  intent: string;
  keywords: string[];
  urgency: "low" | "medium" | "high";
  culturalContext?: "western" | "japanese" | "global";
  culturalKeywords?: string[];
} {
  const keywords = message.split(" ").filter(word => word.length > 2);
  
  // Creative phase detection with cultural keywords
  let phase: CreativePhase = CreativePhase.ANALYSIS;
  if (message.includes("style") || message.includes("visual") || message.includes("スタイル") || message.includes("ビジュアル")) {
    phase = CreativePhase.CREATIVE_DEVELOPMENT;
  } else if (message.includes("asset") || message.includes("generate") || message.includes("アセット") || message.includes("生成")) {
    phase = CreativePhase.ASSET_GENERATION;
  } else if (message.includes("final") || message.includes("finish") || message.includes("完了") || message.includes("仕上げ")) {
    phase = CreativePhase.FINALIZATION;
  }

  // Intent classification with cultural awareness
  let intent = "general_inquiry";
  if (message.includes("color") || message.includes("palette") || message.includes("カラー") || message.includes("色彩")) {
    intent = "color_discussion";
  } else if (message.includes("composition") || message.includes("layout") || message.includes("構成") || message.includes("レイアウト")) {
    intent = "composition_discussion";
  } else if (message.includes("brand") || message.includes("ブランド") || message.includes("企業イメージ")) {
    intent = "brand_alignment";
  } else if (message.includes("generate") || message.includes("create") || message.includes("作成") || message.includes("制作")) {
    intent = "asset_generation";
  } else if (message.includes("culture") || message.includes("cultural") || message.includes("文化") || message.includes("異文化")) {
    intent = "cultural_adaptation";
  } else if (message.includes("market") || message.includes("audience") || message.includes("市場") || message.includes("オーディエンス")) {
    intent = "market_adaptation";
  }

  // Cultural context detection
  let culturalContext: "western" | "japanese" | "global" | undefined;
  const culturalKeywords: string[] = [];
  
  if (locale === "ja" || message.includes("japan") || message.includes("japanese") || message.includes("日本") || message.includes("和風") || message.includes("禅")) {
    culturalContext = "japanese";
    culturalKeywords.push(...["harmony", "subtlety", "respect", "调和", "繊細", "敬意"]);
  } else if (message.includes("western") || message.includes("american") || message.includes("european") || message.includes("西洋") || message.includes("アメリカ")) {
    culturalContext = "western";
    culturalKeywords.push(...["bold", "dynamic", "individual", "大胆", "ダイナミック", "個性"]);
  } else if (message.includes("global") || message.includes("international") || message.includes("グローバル") || message.includes("国際的")) {
    culturalContext = "global";
    culturalKeywords.push(...["universal", "inclusive", "adaptable", "普遍的", "包括的", "適応可能"]);
  }

  // Urgency assessment with cultural politeness considerations
  let urgency: "low" | "medium" | "high" = "medium";
  if (message.includes("quick") || message.includes("fast") || message.includes("urgent") || message.includes("急ぎ") || message.includes("緊急")) {
    urgency = "high";
  } else if (message.includes("take time") || message.includes("careful") || message.includes("慎重") || message.includes("丁寧") || message.includes("お時間をかけて")) {
    urgency = "low";
  }

  // Adjust urgency for cultural context (Japanese culture tends to prefer more deliberate approach)
  if (locale === "ja" && urgency === "high") {
    urgency = "medium"; // Cultural adjustment for respectful pacing
  }

  return { phase, intent, keywords, urgency, culturalContext, culturalKeywords };
}

/**
 * Generate contextual creative response based on intent analysis
 */
function generateContextualCreativeResponse(
  intent: any,
  request: CreativeChatRequest,
  locale: "en" | "ja"
): {
  messageType: CreativeMessageType;
  content: string;
  confidence: number;
  nextAction: "continue" | "generate_assets" | "finalize_direction" | "handoff" | "awaiting_confirmation";
  suggestedActions: string[];
  quickActions: string[];
  visualRecommendations?: any;
  metadata?: any;
} {
  const persona = DAVID_PERSONA;

  // Generate response based on creative intent with cultural sensitivity
  switch (intent.intent) {
    case "color_discussion":
      return generateColorDiscussionResponse(intent, locale, persona);
    
    case "composition_discussion":
      return generateCompositionResponse(intent, locale, persona);
    
    case "brand_alignment":
      return generateBrandAlignmentResponse(intent, locale, persona);
    
    case "asset_generation":
      return generateAssetGenerationResponse(intent, locale, persona);
    
    case "cultural_adaptation":
      return generateCulturalAdaptationResponse(intent, locale, persona);
    
    case "market_adaptation":
      return generateMarketAdaptationResponse(intent, locale, persona);
    
    default:
      return generateGeneralCreativeResponse(intent, locale, persona);
  }
}

/**
 * Generate color palette discussion response
 */
function generateColorDiscussionResponse(intent: any, locale: "en" | "ja", persona: any) {
  const content = locale === "ja"
    ? `カラーパレットについて話しましょう。あなたの商品の感情的なトーンと視覚的なアイデンティティを考慮すると、${getColorMoodJA()}のアプローチが最適だと思います。

この色彩戦略は、ターゲットオーディエンスの心理的反応を最大化し、ブランドの個性を際立たせます。色彩心理学の観点から、これらの選択肢が商業的成功に直結します。`
    
    : `Let's dive into color palette strategy. Considering your product's emotional tone and visual identity, I recommend a ${getColorMoodEN()} approach.

This color strategy maximizes psychological impact with your target audience while reinforcing brand personality. From a color psychology perspective, these choices directly support commercial success.`;

  const quickActions = locale === "ja"
    ? ["暖色系パレットを選択", "寒色系パレットを選択", "中性色を基調に", "高コントラストで"]
    : ["Choose Warm Palette", "Select Cool Palette", "Neutral Foundation", "High Contrast"];

  return {
    messageType: CreativeMessageType.STYLE_RECOMMENDATION,
    content,
    confidence: 0.92,
    nextAction: "continue" as const,
    suggestedActions: quickActions.slice(0, 2),
    quickActions,
    visualRecommendations: {
      colorPaletteOptions: [
        {
          name: "Warm Professional",
          primary: ["#D97706", "#DC2626"],
          mood: "energetic",
          alignment: 0.89
        },
        {
          name: "Cool Sophisticated", 
          primary: ["#2563EB", "#7C3AED"],
          mood: "professional",
          alignment: 0.85
        }
      ]
    }
  };
}

/**
 * Generate composition discussion response
 */
function generateCompositionResponse(intent: any, locale: "en" | "ja", persona: any) {
  const content = locale === "ja"
    ? `構成とレイアウトの観点から、${getCompositionTypeJA()}の原則を活用することを提案します。

この構成アプローチは、視聴者の注意を戦略的に誘導し、あなたの核となるメッセージを最も効果的に伝えます。視覚的階層と動線を最適化することで、商業的なインパクトを最大化できます。`
    
    : `From a composition and layout perspective, I recommend leveraging ${getCompositionTypeEN()} principles.

This compositional approach strategically guides viewer attention and most effectively communicates your core message. By optimizing visual hierarchy and flow, we maximize commercial impact.`;

  const quickActions = locale === "ja"
    ? ["三分割法を適用", "黄金比を使用", "中央集中レイアウト", "ダイナミック構成"]
    : ["Apply Rule of Thirds", "Use Golden Ratio", "Center-Focused Layout", "Dynamic Composition"];

  return {
    messageType: CreativeMessageType.STYLE_RECOMMENDATION,
    content,
    confidence: 0.88,
    nextAction: "continue" as const,
    suggestedActions: quickActions.slice(0, 2),
    quickActions,
    visualRecommendations: {
      compositionSuggestions: [
        "Rule of thirds with product hero placement",
        "Golden ratio spiral for natural eye flow",
        "Symmetric balance for premium feel"
      ]
    }
  };
}

/**
 * Generate brand alignment discussion response
 */
function generateBrandAlignmentResponse(intent: any, locale: "en" | "ja", persona: any) {
  const content = locale === "ja"
    ? `ブランドとの整合性を評価すると、現在の創作方向は${getBrandAlignmentScore()}%の整合性を示しています。

この視覚的アプローチは、あなたのブランドのコアバリューと完璧に調和し、市場での差別化を実現します。競合他社との比較分析でも、この方向性が最適な商業的優位性を提供することが確認できます。`
    
    : `Evaluating brand alignment, our current creative direction shows ${getBrandAlignmentScore()}% brand consistency.

This visual approach perfectly harmonizes with your brand's core values and achieves market differentiation. Competitive analysis confirms this direction provides optimal commercial advantage.`;

  const quickActions = locale === "ja"
    ? ["ブランドガイドライン確認", "競合分析を深化", "価値提案を強化", "方向性を最終確認"]
    : ["Review Brand Guidelines", "Deepen Competitive Analysis", "Strengthen Value Proposition", "Finalize Direction"];

  return {
    messageType: CreativeMessageType.DIRECTION_CONFIRMATION,
    content,
    confidence: 0.94,
    nextAction: "finalize_direction" as const,
    suggestedActions: quickActions.slice(0, 2),
    quickActions,
    metadata: {
      brandAlignmentScore: getBrandAlignmentScore(),
      competitiveAdvantage: "high",
      commercialViability: "optimal"
    }
  };
}

/**
 * Generate asset generation response
 */
function generateAssetGenerationResponse(intent: any, locale: "en" | "ja", persona: any) {
  const content = locale === "ja"
    ? `素晴らしい！創作方向が確立されましたので、プロフェッショナルなビジュアルアセットの生成を開始しましょう。

各アセットは、確立された視覚戦略に基づいて、最高品質の商業的インパクトを提供するように設計されます。背景、商品ヒーロー、ライフスタイルシーンを含む包括的なアセットパッケージを準備します。`
    
    : `Excellent! With our creative direction established, let's begin generating professional visual assets.

Each asset will be designed to deliver maximum commercial impact based on our established visual strategy. I'll prepare a comprehensive asset package including backgrounds, product heroes, and lifestyle scenes.`;

  const quickActions = locale === "ja"
    ? ["背景アセット生成", "商品ヒーローアセット", "ライフスタイルシーン", "すべてのアセット生成"]
    : ["Generate Backgrounds", "Product Hero Assets", "Lifestyle Scenes", "Generate All Assets"];

  return {
    messageType: CreativeMessageType.ASSET_GENERATION_UPDATE,
    content,
    confidence: 0.96,
    nextAction: "generate_assets" as const,
    suggestedActions: quickActions.slice(0, 2),
    quickActions,
    metadata: {
      assetTypes: ["background", "product-hero", "lifestyle-scene"],
      estimatedTime: "5-8 minutes",
      qualityLevel: "premium"
    }
  };
}

/**
 * Generate general creative response
 */
function generateGeneralCreativeResponse(intent: any, locale: "en" | "ja", persona: any) {
  const responses = locale === "ja" 
    ? [
        `${persona.voiceExamples.analysis}この視覚的機会は、あなたの商品の独特な価値提案を強調する絶好のチャンスです。創造的な観点から、市場での差別化を実現する戦略を立てましょう。`,
        
        `${persona.voiceExamples.insight}このアプローチが興味深いのは、ターゲットオーディエンスの潜在的なニーズに直接訴えかける点です。視覚的なストーリーテリングを通じて、感情的なつながりを構築できます。`,
        
        `プロフェッショナルな視点で評価すると、この創作方向は商業的成功に必要なすべての要素を備えています。ブランドの個性と市場の要求を完璧にバランスさせた戦略です。`
      ]
    : [
        `${persona.voiceExamples.analysis} This visual opportunity provides an excellent chance to emphasize your product's unique value proposition. From a creative perspective, let's develop a strategy that achieves market differentiation.`,
        
        `${persona.voiceExamples.insight} What's fascinating about this approach is how it directly appeals to your target audience's underlying needs. We can build emotional connection through visual storytelling.`,
        
        `From a professional standpoint, this creative direction has all the elements necessary for commercial success. It's a strategy that perfectly balances brand personality with market demands.`
      ];

  const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

  const quickActions = locale === "ja"
    ? ["もっと詳しく聞く", "別の角度から検討", "この方向で進める", "創作指示を確定"]
    : ["Tell me more", "Consider another angle", "Proceed with this", "Finalize direction"];

  return {
    messageType: CreativeMessageType.VISUAL_ANALYSIS,
    content: selectedResponse,
    confidence: 0.87,
    nextAction: "continue" as const,
    suggestedActions: quickActions.slice(0, 2),
    quickActions,
  };
}

/**
 * Generate cultural adaptation response with sensitivity to cultural preferences
 */
function generateCulturalAdaptationResponse(intent: any, locale: "en" | "ja", persona: any) {
  const culturalContext = intent.culturalContext || (locale === "ja" ? "japanese" : "western");
  
  const content = locale === "ja"
    ? `文化的適応について考えてみましょう。${culturalContext === "japanese" ? "日本市場" : culturalContext === "western" ? "西洋市場" : "グローバル市場"}向けのビジュアルアプローチを検討します。

${getCulturalGuidanceJA(culturalContext)}

この文化的配慮により、ターゲットオーディエンスとの深い共感を生み出し、ブランドメッセージが適切に伝わることを確保します。`
    
    : `Let's explore cultural adaptation for your visuals. I'm considering approaches that resonate with ${culturalContext === "japanese" ? "Japanese market sensibilities" : culturalContext === "western" ? "Western market preferences" : "global market diversity"}.

${getCulturalGuidanceEN(culturalContext)}

This cultural sensitivity ensures deeper audience connection and authentic brand message delivery across cultural boundaries.`;

  const quickActions = locale === "ja"
    ? ["日本市場向け調整", "西洋市場向け調整", "グローバル対応", "文化的配色検討"]
    : ["Adapt for Japanese Market", "Adapt for Western Market", "Global Approach", "Cultural Color Analysis"];

  return {
    messageType: CreativeMessageType.CREATIVE_INSIGHT,
    content,
    confidence: 0.91,
    nextAction: "continue" as const,
    suggestedActions: quickActions.slice(0, 2),
    quickActions,
    metadata: {
      culturalContext,
      culturalSensitivity: true,
      marketAlignment: getCulturalAlignmentScore(culturalContext)
    }
  };
}

/**
 * Generate market-specific adaptation response
 */
function generateMarketAdaptationResponse(intent: any, locale: "en" | "ja", persona: any) {
  const content = locale === "ja"
    ? `マーケット適応の観点から、ターゲットオーディエンスの視覚的嗜好と購買行動を分析します。

${getMarketInsightsJA()}

この市場分析に基づいて、最適なビジュアル戦略を構築し、競合差別化を実現しながらオーディエンスの心理的共鳴を最大化します。`
    
    : `From a market adaptation perspective, I'm analyzing target audience visual preferences and purchase behaviors.

${getMarketInsightsEN()}

Based on this market analysis, we'll build optimal visual strategy that achieves competitive differentiation while maximizing psychological resonance with your audience.`;

  const quickActions = locale === "ja"
    ? ["競合分析を実施", "オーディエンス心理分析", "市場ポジショニング", "購買動機分析"]
    : ["Conduct Competitive Analysis", "Audience Psychology Analysis", "Market Positioning", "Purchase Motivation Analysis"];

  return {
    messageType: CreativeMessageType.MARKET_INSIGHT,
    content,
    confidence: 0.87,
    nextAction: "continue" as const,
    suggestedActions: quickActions.slice(0, 2),
    quickActions,
    metadata: {
      marketAnalysis: true,
      competitivePositioning: true,
      audiencePsychology: getAudiencePsychologyScore()
    }
  };
}

// Helper functions for dynamic content generation
function getColorMoodJA(): string {
  const moods = ["暖色系の親しみやすい", "寒色系の洗練された", "中性色の上品な", "高コントラストのダイナミックな"];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getColorMoodEN(): string {
  const moods = ["warm and approachable", "cool and sophisticated", "neutral and elegant", "high-contrast and dynamic"];
  return moods[Math.floor(Math.random() * moods.length)];
}

function getCompositionTypeJA(): string {
  const types = ["三分割法", "黄金比", "対称バランス", "動的非対称"];
  return types[Math.floor(Math.random() * types.length)];
}

function getCompositionTypeEN(): string {
  const types = ["rule of thirds", "golden ratio", "symmetric balance", "dynamic asymmetry"];
  return types[Math.floor(Math.random() * types.length)];
}

function getBrandAlignmentScore(): number {
  return Math.floor(85 + Math.random() * 12); // 85-97% range
}

/**
 * Cultural guidance helper functions
 */
function getCulturalGuidanceJA(culturalContext: string): string {
  switch (culturalContext) {
    case "japanese":
      return "日本市場では、調和の取れた色彩、上品な余白の使用、そして品質への敬意を表現するビジュアル要素が重要です。季節感や「おもてなし」の精神を反映したデザインが効果的です。";
    case "western":  
      return "西洋市場では、個性的な表現、ダイナミックな構成、そして直接的なメッセージが好まれます。ブランドの独自性を強調し、消費者の感情に直接訴えかけるアプローチが効果的です。";
    case "global":
      return "グローバル市場では、文化的包括性と普遍的な美的価値を重視します。多様なオーディエンスに響く要素を組み合わせ、地域適応可能なビジュアル基盤を構築します。";
    default:
      return "ターゲット市場の文化的価値観と視覚的嗜好を考慮したアプローチを採用します。";
  }
}

function getCulturalGuidanceEN(culturalContext: string): string {
  switch (culturalContext) {
    case "japanese":
      return "For Japanese market sensibilities, we emphasize harmonious color palettes, thoughtful use of negative space, and visual elements that express respect for quality and craftsmanship. Seasonal awareness and 'omotenashi' hospitality spirit are key.";
    case "western":
      return "Western market preferences favor individual expression, dynamic compositions, and direct messaging. We emphasize brand uniqueness and emotional appeal that connects directly with consumer desires.";
    case "global":
      return "Global market approach prioritizes cultural inclusivity and universal aesthetic values. We combine elements that resonate across diverse audiences while maintaining adaptable visual foundations.";
    default:
      return "We tailor our approach to respect target market cultural values and visual preferences.";
  }
}

function getMarketInsightsJA(): string {
  const insights = [
    "色彩心理学によると、あなたのターゲット層は信頼感を与える青系と活力を表現する暖色系のバランスを好む傾向があります。",
    "視覚的階層の分析では、左上から右下への視線誘導を活用し、重要な情報を適切に配置することが購買決定に影響します。",
    "競合分析により、差別化のためにはより洗練されたタイポグラフィと高品質なイメージング戦略が必要です。",
    "文化的コンテキストを考慮すると、控えめながらも確実に品質を伝える視覚言語が最も効果的です。"
  ];
  return insights[Math.floor(Math.random() * insights.length)];
}

function getMarketInsightsEN(): string {
  const insights = [
    "Color psychology indicates your target demographic responds to trust-building blues balanced with energizing warm tones for emotional engagement.",
    "Visual hierarchy analysis shows strategic left-to-right, top-to-bottom eye movement patterns that directly influence purchase decisions.",
    "Competitive analysis reveals differentiation opportunities through elevated typography and premium imaging strategies.",
    "Cultural context analysis suggests sophisticated yet accessible visual language will maximize market penetration."
  ];
  return insights[Math.floor(Math.random() * insights.length)];
}

function getCulturalAlignmentScore(culturalContext: string): number {
  const baseScore = 88;
  const contextModifier = culturalContext === "global" ? 5 : culturalContext === "japanese" ? 3 : 2;
  return baseScore + Math.floor(Math.random() * contextModifier);
}

function getAudiencePsychologyScore(): number {
  return Math.floor(82 + Math.random() * 15); // 82-97% range
}