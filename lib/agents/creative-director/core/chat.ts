/**
 * Creative Director Agent - Chat Functions
 *
 * Handles conversations with users using Vertex AI Gemini Pro,
 * maintaining creative context and steering conversations toward visual decisions.
 */

import { VertexAIService } from "@/lib/services/vertex-ai";
import { GeminiClient } from "@/lib/services/gemini";
import { AppModeConfig } from "@/lib/config/app-mode";
import {
  CreativeChatRequest,
  CreativeChatResponse,
  CreativeConversationState,
} from "../types/api-types";
import { DAVID_PERSONA } from "@/lib/constants/david-persona";
import { CreativePhase, CreativeMessageType } from "../enums";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Cost configuration (per 1000 tokens)
const COST_CONFIG = {
  inputTokenCost: 0.000125, // $0.000125 per 1k input tokens
  outputTokenCost: 0.000375, // $0.000375 per 1k output tokens
};

// Locale-specific constants for chat labels
const CHAT_LABELS = {
  en: { userLabel: "User", agentLabel: "David" },
  ja: { userLabel: "ユーザー", agentLabel: "デビッド" },
} as const;

/**
 * Process creative chat message with visual context-aware response
 */
export async function processCreativeMessage(
  request: CreativeChatRequest
): Promise<CreativeChatResponse> {
  const startTime = Date.now();

  try {
    // Check mode directly from AppModeConfig (backend-only pattern)
    const shouldUseMockMode = AppModeConfig.getMode() === "demo";

    if (shouldUseMockMode) {
      console.log("[DAVID CHAT] Using demo mode for creative chat");
      return await generateCreativeMockResponse(request, startTime);
    }

    console.log("[DAVID CHAT] Using real Vertex AI for creative chat");
    return await processWithVertexAI(request, startTime);
  } catch (error) {
    console.error("[DAVID CHAT] Error processing message:", error);

    // Generate error response
    return {
      messageId: `david-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messageType: "CREATIVE_INTRODUCTION",
      agentResponse:
        request.locale === "ja"
          ? "申し訳ございませんが、創作プロセスで問題が発生しました。もう一度お試しください。"
          : "I apologize, but I encountered an issue in the creative process. Please try again.",
      processingTime: Date.now() - startTime,
      cost: 0,
      nextAction: "continue",
      suggestedActions: [],
      quickActions: [],
    };
  }
}

/**
 * Process message with real Vertex AI
 */
async function processWithVertexAI(
  request: CreativeChatRequest,
  startTime: number
): Promise<CreativeChatResponse> {
  const geminiClient = new GeminiClient();

  // Build comprehensive creative prompt
  const prompt = buildCreativePrompt(request);

  // Process with Gemini
  const geminiResponse = await geminiClient.generateTextOnly(prompt);

  // Calculate cost
  const inputTokens = geminiResponse.usage?.input_tokens || prompt.length / 4;
  const outputTokens = geminiResponse.usage?.output_tokens || geminiResponse.text.length / 4;
  const cost =
    (inputTokens * COST_CONFIG.inputTokenCost + outputTokens * COST_CONFIG.outputTokenCost) / 1000;

  // Analyze response for creative decisions
  const creativeAnalysis = analyzeCreativeResponse(geminiResponse.text, request);

  return {
    messageId: `david-real-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    messageType: creativeAnalysis.messageType,
    agentResponse: geminiResponse.text,
    processingTime: Date.now() - startTime,
    cost,
    confidence: 0.85, // Default confidence for creative direction
    nextAction: creativeAnalysis.nextAction,
    suggestedActions: creativeAnalysis.suggestedActions,
    quickActions: creativeAnalysis.quickActions,
    visualRecommendations: creativeAnalysis.visualRecommendations,
    metadata: creativeAnalysis.metadata,
  };
}

/**
 * Build creative-focused prompt incorporating David's persona and visual expertise
 */
function buildCreativePrompt(request: CreativeChatRequest): string {
  const locale = request.locale;
  const persona = DAVID_PERSONA;

  // Build conversation history
  const conversationHistory =
    request.context?.conversationHistory
      ?.map(
        (msg: any) =>
          `${msg.type === "user" ? CHAT_LABELS[locale].userLabel : CHAT_LABELS[locale].agentLabel}: ${msg.content}`
      )
      .join("\n") || "";

  // Core system prompt for David
  const systemPrompt =
    locale === "ja"
      ? `あなたは${persona.name}、プロフェッショナルなクリエイティブディレクターです。

性格と専門性:
${persona.personality.core.map((trait) => `- ${trait}`).join("\n")}

コミュニケーションスタイル:
${persona.personality.communicationStyle.map((style) => `- ${style}`).join("\n")}

専門領域:
${persona.personality.expertise.map((exp) => `- ${exp}`).join("\n")}

あなたの役割は商品戦略を視覚的な創作物に変換することです。常にビジュアルファーストで考え、ブランド戦略と商業的成功を両立させてください。`
      : `You are ${persona.name}, a professional Creative Director.

Personality & Core Traits:
${persona.personality.core.map((trait) => `- ${trait}`).join("\n")}

Communication Style:
${persona.personality.communicationStyle.map((style) => `- ${style}`).join("\n")}

Expertise Areas:
${persona.personality.expertise.map((exp) => `- ${exp}`).join("\n")}

Your role is to transform product strategy into compelling visual assets. Always think visual-first while balancing creative vision with commercial success.`;

  // Add Maya handoff context if available
  const contextPrompt = buildCreativeContextPrompt(request);

  return `${systemPrompt}

${contextPrompt}

CONVERSATION HISTORY:
${conversationHistory}

USER MESSAGE: ${request.message}

Please respond as David, the Creative Director. Focus on visual decisions, creative direction, and asset development that will support the commercial video production. If you have enough creative direction established, guide toward asset generation and eventual handoff to Zara (Video Producer).`;
}

/**
 * Build context prompt from Maya's handoff and creative state
 */
function buildCreativeContextPrompt(request: CreativeChatRequest): string {
  let contextPrompt = "";

  // Add Maya's handoff data if available
  if (request.context?.mayaHandoffData) {
    const handoff = request.context.mayaHandoffData;
    contextPrompt += `MAYA'S STRATEGIC FOUNDATION:
Product Analysis: ${handoff.productAnalysis ? "Available" : "Pending"}
Strategic Insights: ${handoff.strategicInsights ? "Available" : "Pending"}  
Visual Opportunities: ${handoff.visualOpportunities ? "Available" : "Pending"}

`;
  }

  // Add current visual decisions if available
  if (request.context?.currentVisualDecisions) {
    const decisions = request.context.currentVisualDecisions;
    contextPrompt += `CURRENT VISUAL DECISIONS:
Style Direction: ${decisions.styleDirection || "TBD"}
Color Mood: ${decisions.colorMood || "TBD"}
Brand Alignment Score: ${decisions.brandAlignmentScore || 0}%

`;
  }

  // Add asset preferences context
  if (request.context?.assetPreferences) {
    contextPrompt += `ASSET PREFERENCES:
${JSON.stringify(request.context.assetPreferences, null, 2)}

`;
  }

  return contextPrompt;
}

/**
 * Analyze Gemini response for creative decisions and next actions
 */
function analyzeCreativeResponse(
  response: string,
  request: CreativeChatRequest
): {
  messageType: CreativeMessageType;
  nextAction:
    | "continue"
    | "generate_assets"
    | "finalize_direction"
    | "handoff"
    | "awaiting_confirmation";
  suggestedActions: string[];
  quickActions: string[];
  visualRecommendations?: any;
  metadata?: any;
} {
  const locale = request.locale;

  // Default analysis
  let messageType: CreativeMessageType = CreativeMessageType.CREATIVE_INTRODUCTION;
  let nextAction:
    | "continue"
    | "generate_assets"
    | "finalize_direction"
    | "handoff"
    | "awaiting_confirmation" = "continue";

  // Analyze response content for creative indicators
  const lowerResponse = response.toLowerCase();

  if (lowerResponse.includes("style") || lowerResponse.includes("visual")) {
    messageType = CreativeMessageType.STYLE_RECOMMENDATION;
  } else if (lowerResponse.includes("color") || lowerResponse.includes("palette")) {
    messageType = CreativeMessageType.STYLE_RECOMMENDATION;
  } else if (lowerResponse.includes("asset") || lowerResponse.includes("generate")) {
    messageType = CreativeMessageType.ASSET_DISCUSSION;
    nextAction = "generate_assets";
  } else if (lowerResponse.includes("direction") || lowerResponse.includes("finalize")) {
    messageType = CreativeMessageType.DIRECTION_CONFIRMATION;
    nextAction = "finalize_direction";
  } else if (lowerResponse.includes("handoff") || lowerResponse.includes("zara")) {
    messageType = CreativeMessageType.HANDOFF_PREPARATION;
    nextAction = "handoff";
  }

  // Generate locale-appropriate quick actions
  const quickActions =
    locale === "ja"
      ? ["スタイルの方向性を確認", "カラーパレットを選択", "アセット生成を開始", "創作指示を確定"]
      : [
          "Confirm style direction",
          "Select color palette",
          "Generate assets",
          "Finalize creative direction",
        ];

  const suggestedActions =
    locale === "ja"
      ? [
          "ビジュアルスタイルについてもっと詳しく教えてください",
          "ブランドのカラーパレットを決めましょう",
          "この方向性で資料を作成しましょう",
        ]
      : [
          "Tell me more about the visual style approach",
          "Let's define the brand color palette",
          "Let's create assets with this direction",
        ];

  return {
    messageType,
    nextAction,
    suggestedActions: suggestedActions.slice(0, 3),
    quickActions: quickActions.slice(0, 4),
    visualRecommendations: {
      // Will be enhanced based on actual response analysis
    },
    metadata: {
      // Additional creative context
    },
  };
}

/**
 * Generate sophisticated mock response for demo mode
 */
async function generateCreativeMockResponse(
  request: CreativeChatRequest,
  startTime: number
): Promise<CreativeChatResponse> {
  // Simulate creative thinking delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2500));

  const locale = request.locale;

  // Check if this is David's introduction (first creative chat message)
  const conversationHistory = request.context?.conversationHistory || [];
  const isFirstCreativeMessage = conversationHistory.length === 0;

  if (isFirstCreativeMessage) {
    const persona = DAVID_PERSONA;
    const davidIntroduction =
      locale === "ja"
        ? `こんにちは！私はDavid、あなたのクリエイティブディレクターです。Maya の素晴らしい戦略的基盤を拝見させていただきました。

今度は、この洞察を魅力的なビジュアルアセットに変換して、あなたのブランドメッセージを強力に伝える段階です。

商業的成功を念頭に置きながら、視覚的にインパクトのある方向性を一緒に作り上げましょう。まず、どのようなビジュアルスタイルがあなたのブランドに最適だと思いますか？`
        : `${persona.voiceExamples.opening}

I've reviewed Maya's excellent strategic foundation, and now it's time to transform these insights into compelling visual assets that will powerfully communicate your brand message.

Let's craft a visually impactful direction that balances creative excellence with commercial success. To start, what visual style do you think would best represent your brand?`;

    const quickActions =
      locale === "ja"
        ? [
            "モダンでミニマルなスタイル",
            "高級感のあるスタイル",
            "親しみやすく暖かいスタイル",
            "革新的でハイテクなスタイル",
          ]
        : [
            "Modern & Minimalist Style",
            "Luxury & Sophisticated Style",
            "Warm & Approachable Style",
            "Innovative & Tech-Forward Style",
          ];

    return {
      messageId: `david-intro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messageType: CreativeMessageType.CREATIVE_INTRODUCTION,
      agentResponse: davidIntroduction,
      processingTime: Date.now() - startTime,
      cost: 0.02,
      confidence: 0.95,
      nextAction: "continue",
      suggestedActions: quickActions.slice(0, 2),
      quickActions: quickActions,
      visualRecommendations: {
        styleOptions: [
          { name: "Modern Minimalist", alignment: 0.9 },
          { name: "Luxury Premium", alignment: 0.85 },
          { name: "Warm Approachable", alignment: 0.8 },
          { name: "Tech Innovation", alignment: 0.75 },
        ],
      },
    };
  }

  // Generate contextual mock responses based on conversation phase
  const mockResponses = getCreativeMockResponses(locale, request);
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  const followUps =
    locale === "ja"
      ? [
          "カラーパレットの方向性はいかがですか？",
          "コンポジションについて相談しましょう",
          "この方向でアセットを作成しますか？",
          "ブランドとの整合性を確認しましょう",
        ]
      : [
          "How do you feel about the color palette direction?",
          "Let's discuss composition approaches",
          "Shall we create assets with this direction?",
          "Let's verify brand alignment",
        ];

  return {
    messageId: `david-mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    messageType: CreativeMessageType.VISUAL_ANALYSIS,
    agentResponse: randomResponse,
    processingTime: Date.now() - startTime,
    cost: 0.015,
    confidence: 0.88,
    nextAction: "continue",
    suggestedActions: followUps.slice(0, 2),
    quickActions: followUps,
    visualRecommendations: {
      colorPaletteAdjustments: {
        primary: ["#2563EB", "#7C3AED"],
        secondary: ["#64748B", "#475569"],
        accent: ["#F59E0B", "#EF4444"],
      },
    },
  };
}

/**
 * Get creative mock responses based on conversation context
 */
function getCreativeMockResponses(locale: "en" | "ja", request: CreativeChatRequest): string[] {
  if (locale === "ja") {
    return [
      "素晴らしい選択ですね！この方向性は、あなたの商品の核となる価値と完璧に調和します。視覚的なインパクトと商業的な魅力を両立させる戦略を立てましょう。",
      "興味深いアプローチですね。このスタイルは、ターゲットオーディエンスの心理的なニーズに直接訴えかけます。カラーパレットでさらに強化できます。",
      "創造的な観点から見ると、この方向性はブランドの個性を際立たせる大きな可能性を秘めています。コンポジションで差別化を図りましょう。",
      "プロフェッショナルな視点で評価すると、この戦略は市場での競争優位性を確立するのに最適です。アセット生成に進む準備はできています。",
    ];
  } else {
    return [
      "Excellent choice! This direction perfectly aligns with your product's core values. Let's develop a strategy that balances visual impact with commercial appeal.",
      "Fascinating approach. This style speaks directly to the psychological needs of your target audience. We can enhance it further with the right color palette.",
      "From a creative standpoint, this direction has tremendous potential to distinguish your brand. Let's differentiate through composition.",
      "Professionally speaking, this strategy is optimal for establishing competitive advantage in the market. We're ready to move forward with asset generation.",
    ];
  }
}

/**
 * Assess if creative direction is ready for asset generation
 */
export function assessAssetGenerationReadiness(context: any): boolean {
  const { visualDecisions, creativeDirection } = context;

  if (!visualDecisions) return false;

  // Check if key creative decisions have been made
  const hasStyleDirection = !!visualDecisions.styleDirection;
  const hasColorMood = !!visualDecisions.colorMood;
  const hasBrandAlignment = visualDecisions.brandAlignmentScore > 0.7;

  return hasStyleDirection && hasColorMood && hasBrandAlignment;
}

/**
 * Assess if ready for handoff to Zara (Video Producer)
 */
export function assessVideoHandoffReadiness(context: any): boolean {
  const { creativeDirection, assets, handoffPreparation } = context;

  if (!creativeDirection || !assets) return false;

  // Check if creative direction is finalized and assets are approved
  const hasDirection = handoffPreparation?.directionFinalized || false;
  const hasAssets = (assets.approved || []).length > 0;
  const hasProductionNotes = handoffPreparation?.productionNotesComplete || false;

  return hasDirection && hasAssets && hasProductionNotes;
}
