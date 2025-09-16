/**
 * Creative Director Real Mode Handler
 *
 * Handles real Vertex AI Gemini Pro integration for David's creative conversations,
 * incorporating creative expertise and visual analysis capabilities.
 */

import { VertexAIService } from "@/lib/services/vertex-ai";
import { GeminiClient } from "@/lib/services/gemini";
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

const MODEL_NAME = "gemini-1.5-pro-vision";

// Cost configuration (per 1000 tokens)
const COST_CONFIG = {
  inputTokenCost: 0.000125, // $0.000125 per 1k input tokens
  outputTokenCost: 0.000375, // $0.000375 per 1k output tokens
};

/**
 * Process creative message with real Vertex AI integration
 */
export async function processRealCreativeMessage(
  request: CreativeChatRequest,
  startTime: number
): Promise<CreativeChatResponse> {
  try {
    console.log("[DAVID REAL] Processing creative message with Vertex AI");
    
    const geminiClient = new GeminiClient();
    
    // Build comprehensive creative prompt with David's persona
    const prompt = buildAdvancedCreativePrompt(request);

    // Process with Gemini
    const geminiResponse = await geminiClient.generateTextOnly(prompt);
    
    // Calculate cost
    const cost = calculateProcessingCost(geminiResponse);
    
    // Analyze response for creative intelligence
    const creativeAnalysis = analyzeCreativeIntelligence(geminiResponse.text, request);
    
    // Generate enhanced response with visual recommendations
    const enhancedResponse = enhanceCreativeResponse(
      geminiResponse.text,
      creativeAnalysis,
      request.locale
    );

    return {
      messageId: `david-real-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messageType: creativeAnalysis.messageType,
      agentResponse: enhancedResponse.content,
      processingTime: Date.now() - startTime,
      cost,
      confidence: 0.85, // Default confidence for creative direction
      nextAction: creativeAnalysis.nextAction,
      suggestedActions: enhancedResponse.suggestedActions,
      quickActions: enhancedResponse.quickActions,
      visualRecommendations: creativeAnalysis.visualRecommendations,
      metadata: {
        ...creativeAnalysis.metadata,
        modelUsed: MODEL_NAME,
        tokensUsed: {
          input: geminiResponse.usage?.input_tokens || 0,
          output: geminiResponse.usage?.output_tokens || 0,
        },
      },
    };
  } catch (error) {
    console.error("[DAVID REAL] Error processing creative message:", error);
    throw error;
  }
}

/**
 * Build advanced creative prompt incorporating David's expertise and context
 */
function buildAdvancedCreativePrompt(request: CreativeChatRequest): string {
  const locale = request.locale;
  const persona = DAVID_PERSONA;

  // Core David persona prompt
  const personaPrompt = locale === "ja"
    ? `あなたは${persona.name}、経験豊富なクリエイティブディレクターです。

あなたの専門性と性格：
${persona.personality.core.map(trait => `• ${trait}`).join('\n')}

コミュニケーションアプローチ：
${persona.personality.communicationStyle.map(style => `• ${style}`).join('\n')}

創作専門領域：
${persona.personality.expertise.map(exp => `• ${exp}`).join('\n')}

創作哲学：
${persona.creativeApproach.visualStyle}
${persona.creativeApproach.colorPhilosophy}
${persona.creativeApproach.composition}

あなたの役割は、戦略的洞察を魅力的なビジュアルアセットに変換し、商業的成功とクリエイティブな卓越性を両立させることです。`

    : `You are ${persona.name}, an experienced Creative Director.

Your expertise and personality:
${persona.personality.core.map(trait => `• ${trait}`).join('\n')}

Communication approach:
${persona.personality.communicationStyle.map(style => `• ${style}`).join('\n')}

Creative specializations:
${persona.personality.expertise.map(exp => `• ${exp}`).join('\n')}

Creative philosophy:
${persona.creativeApproach.visualStyle}
${persona.creativeApproach.colorPhilosophy}
${persona.creativeApproach.composition}

Your role is to transform strategic insights into compelling visual assets that balance commercial success with creative excellence.`;

  // Add context from Maya's handoff
  const contextPrompt = buildMayaHandoffContext(request);
  
  // Add current creative state
  const creativeStatePrompt = buildCreativeStateContext(request);
  
  // Add conversation history
  const conversationHistory = buildConversationHistory(request);

  // Add specific instructions based on request context
  const instructionsPrompt = buildContextualInstructions(request, locale);

  return `${personaPrompt}

${contextPrompt}

${creativeStatePrompt}

${conversationHistory}

${instructionsPrompt}

USER MESSAGE: ${request.message}

Please respond as David with creative expertise, focusing on visual decisions and creative direction that support commercial video production. Provide specific, actionable creative guidance.`;
}

/**
 * Build Maya handoff context for creative decisions - following finalized data flow
 */
function buildMayaHandoffContext(request: CreativeChatRequest): string {
  if (!request.context?.mayaHandoffData) {
    return "MAYA'S STRATEGIC FOUNDATION: Not yet available - working independently\n";
  }

  const handoff = request.context.mayaHandoffData;
  const currentStep = request.context?.currentStep || 2;

  let contextPrompt = `MAYA'S STRATEGIC FOUNDATION:
Product Analysis: ${handoff.productAnalysis ? 'Complete' : 'Pending'}
Strategic Insights: Available for creative direction

Key Strategic Elements:
- Product: ${handoff.productAnalysis?.product?.name || 'Product'}
- Category: ${handoff.productAnalysis?.product?.category || 'Consumer Product'}
- Core Message: ${handoff.productAnalysis?.keyMessages?.headline || 'Premium Quality'}
- Target Audience: ${handoff.productAnalysis?.targetAudience?.description || 'Professional consumers'}

`;

  // Add step-specific context based on our finalized data flow
  if (currentStep >= 2) {
    const selectedProductionStyle = request.context?.selectedProductionStyle;
    if (selectedProductionStyle) {
      contextPrompt += `PRODUCTION STYLE DECISION (Step 1 Complete):
- Selected Style: ${selectedProductionStyle.name}
- Description: ${selectedProductionStyle.description}
- This production style will guide all creative decisions

`;
    }
  }

  if (currentStep >= 3) {
    const selectedStyleOption = request.context?.selectedStyleOption;
    if (selectedStyleOption) {
      contextPrompt += `CREATIVE DIRECTION DECISION (Step 2 Complete):
- Selected Direction: ${selectedStyleOption.name}
- Description: ${selectedStyleOption.description}
- Color Palette: ${selectedStyleOption.colorPalette?.join(', ') || 'Premium colors'}
- Visual Keywords: ${selectedStyleOption.visualKeywords?.join(', ') || 'Professional aesthetic'}

`;
    }
  }

  return contextPrompt;
}

/**
 * Build current creative state context
 */
function buildCreativeStateContext(request: CreativeChatRequest): string {
  const decisions = request.context?.currentVisualDecisions;
  
  if (!decisions) {
    return "CURRENT CREATIVE STATE: Beginning creative development\n";
  }

  return `CURRENT CREATIVE STATE:
Style Direction: ${decisions.styleDirection || 'To be determined'}
Color Mood: ${decisions.colorMood || 'To be determined'}  
Brand Alignment Score: ${decisions.brandAlignmentScore || 0}%
Approved Palettes: ${decisions.approvedPalettes?.length || 0}
Selected Compositions: ${decisions.selectedCompositions?.length || 0}

`;
}

/**
 * Build conversation history with creative context
 */
function buildConversationHistory(request: CreativeChatRequest): string {
  const history = request.context?.conversationHistory || [];
  
  if (history.length === 0) {
    return "CONVERSATION HISTORY: Beginning creative consultation\n";
  }

  const formattedHistory = history
    .slice(-5) // Last 5 messages for context
    .map((msg: any) => `${msg.type === "user" ? "User" : "David"}: ${msg.content}`)
    .join('\n');

  return `RECENT CONVERSATION:
${formattedHistory}

`;
}

/**
 * Build contextual instructions based on request and current step
 */
function buildContextualInstructions(request: CreativeChatRequest, locale: "en" | "ja"): string {
  const message = request.message.toLowerCase();
  const currentStep = request.context?.currentStep || 2;

  // Step-specific instructions based on our finalized data flow
  let stepContext = "";
  let focus = "";

  if (currentStep === 2) {
    // Step 2: Creative Direction (needs Maya's analysis + production style)
    focus = "creative direction selection and visual style guidance";
    stepContext = locale === "ja"
      ? "あなたは現在Step 2にいます：クリエイティブ方向性の決定。Mayaの分析と選択されたプロダクションスタイルを基に、ビジュアル方向性のオプションを提示してください。"
      : "You are currently in Step 2: Creative Direction. Based on Maya's analysis and the selected production style, guide the user through visual direction options.";
  } else if (currentStep === 3) {
    // Step 3: Scene Architecture (needs accumulated context)
    focus = "scene architecture and visual asset planning";
    stepContext = locale === "ja"
      ? "あなたは現在Step 3にいます：シーンアーキテクチャ。これまでの全ての決定を基に、具体的なシーン構成と視覚的アセットの計画を提案してください。"
      : "You are currently in Step 3: Scene Architecture. Based on all previous decisions, provide specific scene composition and visual asset planning.";
  } else {
    // Default to Step 2 behavior
    focus = "creative consultation and visual direction";
    stepContext = locale === "ja"
      ? "創作方向性について相談してください。"
      : "Provide creative direction consultation.";
  }

  // Message-specific overrides
  if (message.includes("color") || message.includes("palette")) {
    focus = "color palette strategy and psychology";
  } else if (message.includes("composition") || message.includes("layout")) {
    focus = "composition principles and visual hierarchy";
  } else if (message.includes("scene") || message.includes("shot")) {
    focus = "scene composition and shot planning";
  }

  return locale === "ja"
    ? `特別な指示：
- ${stepContext}
- ${focus}に焦点を当てて回答してください
- 商業的成功とクリエイティブな卓越性のバランスを保ってください
- 具体的で実行可能な創作ガイダンスを提供してください
- 現在のステップに適した次のアクションを提案してください
- David's 専門知識と自信を示してください

`
    : `SPECIAL INSTRUCTIONS:
- ${stepContext}
- Focus on ${focus}
- Balance commercial success with creative excellence
- Provide specific, actionable creative guidance
- Suggest next actions appropriate for the current step
- Demonstrate David's expertise and confidence

`;
}

/**
 * Analyze Gemini response for creative intelligence
 */
function analyzeCreativeIntelligence(response: string, request: CreativeChatRequest): {
  messageType: CreativeMessageType;
  nextAction: "continue" | "generate_assets" | "finalize_direction" | "handoff" | "awaiting_confirmation";
  visualRecommendations: any;
  metadata: any;
} {
  const lowerResponse = response.toLowerCase();
  
  // Determine message type based on content
  let messageType: CreativeMessageType = CreativeMessageType.VISUAL_ANALYSIS;
  
  if (lowerResponse.includes("style") || lowerResponse.includes("visual direction")) {
    messageType = CreativeMessageType.STYLE_RECOMMENDATION;
  } else if (lowerResponse.includes("color") || lowerResponse.includes("palette")) {
    messageType = CreativeMessageType.STYLE_RECOMMENDATION;
  } else if (lowerResponse.includes("asset") || lowerResponse.includes("generate")) {
    messageType = CreativeMessageType.ASSET_DISCUSSION;
  } else if (lowerResponse.includes("direction") && lowerResponse.includes("final")) {
    messageType = CreativeMessageType.DIRECTION_CONFIRMATION;
  } else if (lowerResponse.includes("handoff") || lowerResponse.includes("alex")) {
    messageType = CreativeMessageType.HANDOFF_PREPARATION;
  }

  // Determine next action
  let nextAction: "continue" | "generate_assets" | "finalize_direction" | "handoff" | "awaiting_confirmation" = "continue";
  
  if (lowerResponse.includes("generate") || lowerResponse.includes("create assets")) {
    nextAction = "generate_assets";
  } else if (lowerResponse.includes("finalize") || lowerResponse.includes("confirm direction")) {
    nextAction = "finalize_direction";
  } else if (lowerResponse.includes("ready for") && lowerResponse.includes("alex")) {
    nextAction = "handoff";
  } else if (lowerResponse.includes("what do you think") || lowerResponse.includes("your thoughts")) {
    nextAction = "awaiting_confirmation";
  }

  // Extract visual recommendations
  const visualRecommendations = extractVisualRecommendations(response, request.locale);
  
  // Generate metadata
  const metadata = {
    creativePhase: determineCreativePhase(response),
    confidence: analyzeConfidenceLevel(response),
    commercialViability: assessCommercialViability(response),
    brandAlignment: assessBrandAlignment(response),
  };

  return {
    messageType,
    nextAction,
    visualRecommendations,
    metadata,
  };
}

/**
 * Extract visual recommendations from Gemini response
 */
function extractVisualRecommendations(response: string, locale: "en" | "ja"): any {
  const recommendations: any = {};

  // Color-related recommendations
  if (response.toLowerCase().includes("color") || response.toLowerCase().includes("カラー")) {
    recommendations.colorGuidance = {
      mood: extractColorMood(response),
      temperature: extractColorTemperature(response),
      psychology: extractColorPsychology(response),
    };
  }

  // Style-related recommendations
  if (response.toLowerCase().includes("style") || response.toLowerCase().includes("スタイル")) {
    recommendations.styleGuidance = {
      direction: extractStyleDirection(response),
      sophistication: extractSophisticationLevel(response),
      energy: extractEnergyLevel(response),
    };
  }

  // Composition recommendations
  if (response.toLowerCase().includes("composition") || response.toLowerCase().includes("構成")) {
    recommendations.compositionGuidance = {
      principle: extractCompositionPrinciple(response),
      hierarchy: extractVisualHierarchy(response),
      balance: extractBalance(response),
    };
  }

  return recommendations;
}

/**
 * Enhance Gemini response with David's creative expertise
 */
function enhanceCreativeResponse(
  originalResponse: string,
  analysis: any,
  locale: "en" | "ja"
): {
  content: string;
  suggestedActions: string[];
  quickActions: string[];
} {
  // Add David's signature confidence and expertise
  const davidSignature = locale === "ja"
    ? "\n\n創作の観点から、この方向性が最適な商業的成果をもたらすと確信しています。"
    : "\n\nFrom a creative standpoint, I'm confident this direction will deliver optimal commercial results.";

  const enhancedContent = originalResponse + davidSignature;

  // Generate contextual actions based on analysis
  const suggestedActions = generateContextualActions(analysis, locale);
  const quickActions = generateQuickActions(analysis, locale);

  return {
    content: enhancedContent,
    suggestedActions,
    quickActions,
  };
}

/**
 * Calculate processing cost
 */
function calculateProcessingCost(geminiResponse: any): number {
  const inputTokens = geminiResponse.usage?.input_tokens || 0;
  const outputTokens = geminiResponse.usage?.output_tokens || 0;
  
  return (inputTokens * COST_CONFIG.inputTokenCost + outputTokens * COST_CONFIG.outputTokenCost) / 1000;
}

// Helper functions for analysis
function extractColorMood(response: string): string {
  const colorMoods = ["warm", "cool", "neutral", "vibrant", "muted"];
  return colorMoods.find(mood => response.toLowerCase().includes(mood)) || "balanced";
}

function extractColorTemperature(response: string): string {
  if (response.toLowerCase().includes("warm")) return "warm";
  if (response.toLowerCase().includes("cool")) return "cool";
  return "neutral";
}

function extractColorPsychology(response: string): string {
  const psychologies = ["energetic", "calming", "trustworthy", "luxurious", "friendly"];
  return psychologies.find(psych => response.toLowerCase().includes(psych)) || "professional";
}

function extractStyleDirection(response: string): string {
  const styles = ["modern", "classic", "minimalist", "luxury", "bold"];
  return styles.find(style => response.toLowerCase().includes(style)) || "contemporary";
}

function extractSophisticationLevel(response: string): string {
  if (response.toLowerCase().includes("luxury") || response.toLowerCase().includes("premium")) return "luxury";
  if (response.toLowerCase().includes("professional")) return "professional";
  if (response.toLowerCase().includes("casual")) return "casual";
  return "professional";
}

function extractEnergyLevel(response: string): string {
  if (response.toLowerCase().includes("dynamic") || response.toLowerCase().includes("energetic")) return "high";
  if (response.toLowerCase().includes("calm") || response.toLowerCase().includes("peaceful")) return "low";
  return "medium";
}

function extractCompositionPrinciple(response: string): string {
  const principles = ["rule of thirds", "golden ratio", "symmetry", "asymmetry"];
  return principles.find(principle => response.toLowerCase().includes(principle)) || "balanced";
}

function extractVisualHierarchy(response: string): string {
  const hierarchies = ["center-focused", "left-to-right", "top-to-bottom", "circular"];
  return hierarchies.find(hierarchy => response.toLowerCase().includes(hierarchy)) || "natural";
}

function extractBalance(response: string): string {
  if (response.toLowerCase().includes("symmetric")) return "symmetric";
  if (response.toLowerCase().includes("asymmetric")) return "asymmetric";
  return "dynamic";
}

function determineCreativePhase(response: string): CreativePhase {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes("analyze") || lowerResponse.includes("understand")) {
    return CreativePhase.ANALYSIS;
  } else if (lowerResponse.includes("develop") || lowerResponse.includes("create")) {
    return CreativePhase.CREATIVE_DEVELOPMENT;
  } else if (lowerResponse.includes("generate") || lowerResponse.includes("asset")) {
    return CreativePhase.ASSET_GENERATION;
  } else if (lowerResponse.includes("finalize") || lowerResponse.includes("complete")) {
    return CreativePhase.FINALIZATION;
  }
  
  return CreativePhase.CREATIVE_DEVELOPMENT;
}

function analyzeConfidenceLevel(response: string): number {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes("confident") || lowerResponse.includes("certain")) {
    return 0.95;
  } else if (lowerResponse.includes("recommend") || lowerResponse.includes("suggest")) {
    return 0.85;
  } else if (lowerResponse.includes("consider") || lowerResponse.includes("might")) {
    return 0.75;
  }
  
  return 0.8;
}

function assessCommercialViability(response: string): string {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes("commercial") && lowerResponse.includes("success")) {
    return "high";
  } else if (lowerResponse.includes("market") || lowerResponse.includes("audience")) {
    return "medium";
  }
  
  return "medium";
}

function assessBrandAlignment(response: string): number {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes("brand") && lowerResponse.includes("align")) {
    return 0.9;
  } else if (lowerResponse.includes("consistent") || lowerResponse.includes("harmony")) {
    return 0.85;
  }
  
  return 0.8;
}

function generateContextualActions(analysis: any, locale: "en" | "ja"): string[] {
  const actions = locale === "ja"
    ? [
        "この創作方向をさらに詳しく探る",
        "カラーパレットを確定する",
        "コンポジションの詳細を決める",
        "アセット生成を開始する"
      ]
    : [
        "Explore this creative direction further",
        "Finalize the color palette",
        "Define composition details",
        "Begin asset generation"
      ];

  // Return contextually relevant actions based on analysis
  return actions.slice(0, 2);
}

function generateQuickActions(analysis: any, locale: "en" | "ja"): string[] {
  const actions = locale === "ja"
    ? [
        "スタイル確認",
        "カラー選択", 
        "構成決定",
        "アセット生成",
        "方向性確定"
      ]
    : [
        "Confirm Style",
        "Select Colors",
        "Decide Composition", 
        "Generate Assets",
        "Finalize Direction"
      ];

  return actions;
}