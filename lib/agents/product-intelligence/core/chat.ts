/**
 * Product Intelligence Agent - Chat Functions
 *
 * Handles conversations with users using Vertex AI Gemini Pro,
 * maintaining context and steering conversations toward product insights.
 */

import { VertexAIService } from "@/lib/services/vertex-ai";
import { GeminiClient } from "@/lib/services/gemini";
import { AppModeConfig } from "@/lib/config/app-mode";
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ConversationContext,
  GeminiChatRequest,
} from "../types";
import { PromptBuilder } from "../tools";
import { MAYA_PERSONA } from "@/lib/constants/maya-persona";

const MODEL_NAME = "gemini-1.5-pro";

// Cost configuration (per 1000 tokens)
const COST_CONFIG = {
  inputTokenCost: 0.000125, // $0.000125 per 1k input tokens
  outputTokenCost: 0.000375, // $0.000375 per 1k output tokens
};

// Locale-specific constants for chat labels
const CHAT_LABELS = {
  en: { userLabel: "User" },
  ja: { userLabel: "ユーザー" },
} as const;

/**
 * Process chat message with context-aware response
 */
export async function processMessage(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();

  try {
    // Check mode directly from AppModeConfig
    const shouldUseMockMode = AppModeConfig.getMode() === "demo";

    if (shouldUseMockMode) {
      console.log("[GEMINI CHAT] Using mock mode for chat");
      return await generateMockResponse(request, startTime);
    }

    console.log("[GEMINI CHAT] Using real Vertex AI for chat");

    // Generate contextual conversation prompt
    const conversationPrompt = generateConversationPrompt(request);

    // Call Gemini Pro for chat response
    const geminiResponse = await callGeminiChat(conversationPrompt);

    // Parse response and determine next actions
    const responseAnalysis = await analyzeResponse(geminiResponse.text, request, shouldUseMockMode);

    const processingTime = Date.now() - startTime;
    const cost = calculateCost(geminiResponse.usage);

    return {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      response: responseAnalysis.cleanedResponse,
      processingTime,
      cost,
      confidence: responseAnalysis.confidence,
      nextAction: responseAnalysis.nextAction,
      suggestedFollowUps: responseAnalysis.suggestedFollowUps,
      topicProgress: responseAnalysis.topicProgress,
    };
  } catch (error) {
    console.error("Gemini chat processing failed:", error);
    throw new Error(
      `Chat processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate conversation prompt with context
 */
function generateConversationPrompt(request: ChatRequest): string {
  const locale = request.locale;
  const conversationHistory = formatConversationHistory(
    request.context.conversationHistory,
    locale
  );

  // Use Maya's strategy-focused prompt if we have product analysis
  if (request.context.productAnalysis) {
    return PromptBuilder.buildStrategyPrompt(
      request.context.productAnalysis,
      request.message,
      `CONVERSATION HISTORY:\n${conversationHistory}`,
      locale
    );
  }

  // Fallback to original system prompt for initial analysis
  const systemPrompt = PromptBuilder.getSystemPrompt(locale);
  const contextPrompt = buildContextPrompt(request);

  return `${systemPrompt}

${contextPrompt}

CONVERSATION HISTORY:
${conversationHistory}

USER MESSAGE: ${request.message}

Please respond as the Product Intelligence Agent. Focus on gathering insights about the product, target audience, and positioning. If you have enough information, guide toward completion and handoff to the Creative Director Agent.`;
}

/**
 * Build context prompt from analysis and conversation state
 */
function buildContextPrompt(request: ChatRequest): string {
  let contextPrompt = "";

  // Add product analysis context if available
  if (request.context.productAnalysis) {
    const analysis = request.context.productAnalysis;
    contextPrompt += `CURRENT PRODUCT ANALYSIS:
Product: ${analysis.product.name} (${analysis.product.category})
Key Features: ${analysis.product.keyFeatures.join(", ")}
Target Age: ${analysis.targetAudience.primary.demographics.ageRange}
Positioning: ${analysis.positioning.valueProposition.primaryBenefit}
Confidence: ${Math.round(analysis.metadata.confidenceScore * 100)}%

`;
  }

  // Add conversation context
  const context = request.context.conversationContext;
  const completedTopics = Object.entries(context.topics)
    .filter(([_, status]) => status === "completed")
    .map(([topic, _]) => topic);

  const pendingTopics = Object.entries(context.topics)
    .filter(([_, status]) => status === "pending")
    .map(([topic, _]) => topic);

  contextPrompt += `CONVERSATION STATUS:
Completed Topics: ${completedTopics.join(", ") || "None"}
Pending Topics: ${pendingTopics.join(", ") || "None"}
Key Insights So Far: ${context.keyInsights.join("; ") || "None yet"}
Current Uncertainties: ${context.uncertainties.join("; ") || "None"}

`;

  return contextPrompt;
}

/**
 * Format conversation history for context
 */
function formatConversationHistory(messages: ChatMessage[], locale: "en" | "ja"): string {
  // Keep only the last 10 messages for context
  const recentMessages = messages.slice(-10);

  return recentMessages
    .map((msg) => {
      const speaker = msg.type === "user" ? CHAT_LABELS[locale].userLabel : "Agent";
      return `${speaker}: ${msg.content}`;
    })
    .join("\n");
}

/**
 * Call Gemini Pro Chat API
 */
async function callGeminiChat(prompt: string): Promise<{
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}> {
  // Use GeminiClient which has fallback to AI Studio if Vertex AI fails
  const vertexAI = VertexAIService.getInstance();
  const geminiClient = new GeminiClient(vertexAI);

  try {
    // Use generateTextOnly for chat (not vision)
    const response = await geminiClient.generateTextOnly(prompt);

    return {
      text: response.text,
      usage: {
        input_tokens: response.usage?.input_tokens || prompt.length / 4,
        output_tokens: response.usage?.input_tokens || response.text.length / 4,
      },
    };
  } catch (error) {
    console.error("GeminiClient chat failed:", error);

    // If GeminiClient fails, throw the error for fallback handling
    throw new Error(
      `Gemini Chat API error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Analyze response and determine next actions
 */
async function analyzeResponse(
  responseText: string,
  request: ChatRequest,
  shouldUseMockMode: boolean = false
): Promise<{
  cleanedResponse: string;
  confidence: number;
  nextAction: "continue" | "complete" | "clarify" | "handoff";
  suggestedFollowUps: string[];
  topicProgress: {
    currentTopic: string;
    completedTopics: string[];
    nextTopic?: string;
  };
}> {
  // Clean the response text
  const cleanedResponse = responseText.trim();

  // Analyze conversation completeness
  const context = request.context.conversationContext;
  const completedTopics = Object.entries(context.topics)
    .filter(([_, status]) => status === "completed")
    .map(([topic, _]) => topic);

  // Determine if we have enough information for handoff
  const readyForHandoff = assessHandoffReadiness(request.context);

  // Generate appropriate follow-up suggestions
  const suggestedFollowUps = await generateFollowUpSuggestions(
    request,
    cleanedResponse,
    shouldUseMockMode
  );

  // Determine current topic focus
  const currentTopic = identifyCurrentTopic(cleanedResponse, request.context);

  return {
    cleanedResponse,
    confidence: 0.85, // Could be improved with more sophisticated analysis
    nextAction: readyForHandoff ? "handoff" : "continue",
    suggestedFollowUps,
    topicProgress: {
      currentTopic,
      completedTopics,
      nextTopic: suggestNextTopic(context),
    },
  };
}

/**
 * Generate mock response for development
 */
async function generateMockResponse(
  request: ChatRequest,
  startTime: number
): Promise<ChatResponse> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

  const locale = request.locale;

  // Use Maya's greeting if this is the first CHAT message and we have product analysis
  // Check if there are any chat messages in history (not including analysis)
  const chatMessages =
    request.context.conversationHistory?.filter(
      (msg) => msg.type === "user" || msg.type === "agent"
    ) || [];

  if (request.context.productAnalysis && chatMessages.length === 0) {
    const persona = require("@/lib/constants/maya-persona").MAYA_PERSONA;
    const mayaGreeting =
      locale === "ja"
        ? `こんにちは！私はMaya、あなたのプロダクト・インテリジェンス・アシスタントです。商品分析が完了しましたね！素晴らしい${request.context.productAnalysis.product.name}の戦略を見させていただきました。\n\n何か改善したい点や調整したい部分はありますか？`
        : `${persona.voiceExamples.opening}\n\nI can see we have a great commercial strategy for ${request.context.productAnalysis.product.name}! What would you like to refine or improve?`;

    // Generate relevant quick actions based on the strategy
    // Since we're in generateMockResponse, we're already in demo/mock mode
    // Always use static actions for consistent demo experience
    const quickActions = [
      ...PromptBuilder.getQuickActions("headline", locale).slice(0, 2),
      ...PromptBuilder.getQuickActions("audience", locale).slice(0, 1),
      ...PromptBuilder.getQuickActions("positioning", locale).slice(0, 1),
    ];

    return {
      messageId: `maya-greeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      response: mayaGreeting,
      processingTime: Date.now() - startTime,
      cost: 0.01,
      confidence: 0.95,
      nextAction: "continue",
      suggestedFollowUps: quickActions.slice(0, 3),
      topicProgress: {
        currentTopic: "strategyRefinement",
        completedTopics: ["productAnalysis"],
        nextTopic: "strategyRefinement",
      },
    };
  }

  // Regular mock responses for ongoing conversation
  const responses = PromptBuilder.getMockResponse(locale);
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  const followUps = {
    en: [
      "Tell me about the target age group",
      "What's the key selling point?",
      "How should we position this?",
      "What visual style works best?",
    ],
    ja: [
      "ターゲット年齢層について教えてください",
      "主要なセリングポイントは何ですか？",
      "どのようにポジショニングすべきでしょうか？",
      "どのビジュアルスタイルが最適ですか？",
    ],
  };

  return {
    messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    response: randomResponse,
    processingTime: Date.now() - startTime,
    cost: 0.01,
    confidence: 0.85,
    nextAction: "continue",
    suggestedFollowUps: followUps[locale].slice(0, 2),
    topicProgress: {
      currentTopic: "productFeatures",
      completedTopics: ["productFeatures"],
      nextTopic: "targetAudience",
    },
  };
}

/**
 * Assess if conversation is ready for handoff
 */
function assessHandoffReadiness(context: any): boolean {
  const { productAnalysis, conversationContext } = context;

  if (!productAnalysis) return false;

  const completedTopics = Object.entries(conversationContext.topics).filter(
    ([_, status]) => status === "completed"
  ).length;

  const totalTopics = Object.keys(conversationContext.topics).length;

  // Ready for handoff if we have analysis and covered at least 60% of topics
  return completedTopics >= totalTopics * 0.6;
}

/**
 * Generate contextual follow-up suggestions
 */
async function generateFollowUpSuggestions(
  request: ChatRequest,
  response: string,
  shouldUseMockMode: boolean = false
): Promise<string[]> {
  const locale = request.locale;

  // If we have product analysis, use strategy-focused quick actions
  if (request.context.productAnalysis) {
    // For real mode, use dynamic AI-generated suggestions
    if (!shouldUseMockMode) {
      try {
        // Build conversation history for context
        const conversationHistory =
          request.context.conversationHistory
            ?.map((msg) => `${msg.type === "user" ? "User" : "Agent"}: ${msg.content}`)
            .join("\n") || "";

        // Use dynamic contextual quick actions
        const dynamicActions = await PromptBuilder.generateContextualQuickActions(
          request.context.productAnalysis,
          request.context.productAnalysis.commercialStrategy,
          conversationHistory + `\nAgent: ${response}`,
          locale
        );

        return dynamicActions;
      } catch (error) {
        console.error("Error generating dynamic quick actions, falling back to static:", error);
        // Fall through to static approach if dynamic fails
      }
    }

    // Demo mode or fallback: use static approach
    // Analyze the response to determine which category is most relevant
    const lowerResponse = response.toLowerCase();

    if (
      lowerResponse.includes("headline") ||
      lowerResponse.includes("tagline") ||
      lowerResponse.includes("ヘッドライン") ||
      lowerResponse.includes("タグライン")
    ) {
      return PromptBuilder.getQuickActions("headline", locale).slice(0, 2);
    } else if (
      lowerResponse.includes("audience") ||
      lowerResponse.includes("target") ||
      lowerResponse.includes("ターゲット") ||
      lowerResponse.includes("顧客")
    ) {
      return PromptBuilder.getQuickActions("audience", locale).slice(0, 2);
    } else if (
      lowerResponse.includes("scene") ||
      lowerResponse.includes("シーン") ||
      lowerResponse.includes("video") ||
      lowerResponse.includes("動画")
    ) {
      return PromptBuilder.getQuickActions("scenes", locale).slice(0, 2);
    } else if (
      lowerResponse.includes("position") ||
      lowerResponse.includes("ポジション") ||
      lowerResponse.includes("brand") ||
      lowerResponse.includes("ブランド")
    ) {
      return PromptBuilder.getQuickActions("positioning", locale).slice(0, 2);
    } else if (
      lowerResponse.includes("visual") ||
      lowerResponse.includes("style") ||
      lowerResponse.includes("ビジュアル") ||
      lowerResponse.includes("スタイル")
    ) {
      return PromptBuilder.getQuickActions("visual", locale).slice(0, 2);
    }

    // Default to mixed strategy actions
    return [
      ...PromptBuilder.getQuickActions("headline", locale).slice(0, 1),
      ...PromptBuilder.getQuickActions("positioning", locale).slice(0, 1),
    ];
  }

  // Legacy fallback for initial analysis conversations
  const context = request.context.conversationContext;
  const suggestions = {
    en: {
      productFeatures: ["What makes this product unique?", "What's the main problem it solves?"],
      targetAudience: ["Who is your ideal customer?", "What age group do you target?"],
      brandPositioning: [
        "How do you want to position this brand?",
        "What's your competitive advantage?",
      ],
      visualPreferences: [
        "What visual style appeals to your audience?",
        "What mood should the commercial convey?",
      ],
    },
    ja: {
      productFeatures: ["この商品のユニークな点は何ですか？", "主に解決する問題は何ですか？"],
      targetAudience: [
        "理想的な顧客はどのような方ですか？",
        "どの年齢層をターゲットにしていますか？",
      ],
      brandPositioning: [
        "このブランドをどのようにポジショニングしたいですか？",
        "競合優位性は何ですか？",
      ],
      visualPreferences: [
        "オーディエンスにアピールするビジュアルスタイルは？",
        "コマーシャルはどのようなムードを伝えるべきですか？",
      ],
    },
  };

  // Find next pending topic
  const pendingTopic = Object.entries(context.topics).find(
    ([_, status]) => status === "pending"
  )?.[0];

  if (pendingTopic && suggestions[locale][pendingTopic as keyof (typeof suggestions)["en"]]) {
    return suggestions[locale][pendingTopic as keyof (typeof suggestions)["en"]];
  }

  return suggestions[locale].productFeatures; // Default fallback
}

/**
 * Identify current conversation topic
 */
function identifyCurrentTopic(response: string, context: any): string {
  // Simple keyword-based topic identification
  // Could be improved with more sophisticated NLP

  const topicKeywords = {
    productFeatures: ["feature", "benefit", "function", "unique", "special"],
    targetAudience: ["customer", "user", "audience", "demographic", "age"],
    brandPositioning: ["brand", "position", "competitive", "advantage", "different"],
    visualPreferences: ["visual", "style", "look", "design", "color", "mood"],
  };

  const lowerResponse = response.toLowerCase();

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => lowerResponse.includes(keyword))) {
      return topic;
    }
  }

  return "productFeatures"; // Default
}

/**
 * Suggest next conversation topic
 */
function suggestNextTopic(context: ConversationContext): string | undefined {
  const topicOrder = ["productFeatures", "targetAudience", "brandPositioning", "visualPreferences"];

  for (const topic of topicOrder) {
    if (context.topics[topic as keyof typeof context.topics] === "pending") {
      return topic;
    }
  }

  return undefined; // All topics completed
}

/**
 * Calculate cost based on token usage
 */
function calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
  const inputCost = (usage.input_tokens / 1000) * COST_CONFIG.inputTokenCost;
  const outputCost = (usage.output_tokens / 1000) * COST_CONFIG.outputTokenCost;

  return inputCost + outputCost;
}
