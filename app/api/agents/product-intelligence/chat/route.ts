/**
 * Product Intelligence Agent - Chat API
 *
 * Handles real-time chat interactions with the Product Intelligence Agent,
 * processing user messages and generating contextual responses using Gemini Pro.
 */

import { ApiErrorCode } from "@/lib/agents/product-intelligence/enums";
import {
  ApiResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ChatRequest,
} from "@/lib/agents/product-intelligence/types";
import { processMessage } from "@/lib/agents/product-intelligence/core/chat";
import { PromptBuilder } from "@/lib/agents/product-intelligence/tools/prompt-builder";
import { AppModeConfig } from "@/lib/config/app-mode";
import { FirestoreService } from "@/lib/services/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request validation schema
const ChatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(1000),
  locale: z.enum(["en", "ja"]).default("en"),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      timestamp: z.number().optional(),
    })
    .optional(),
});

/**
 * Handle POST requests for chat messages
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ChatMessageResponse>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = ChatRequestSchema.parse(body);

    // TODO: Validate session exists and is active
    const sessionExists = await validateSession(validatedRequest.sessionId);
    if (!sessionExists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ApiErrorCode.SESSION_NOT_FOUND,
            message: "Session not found",
            userMessage:
              validatedRequest.locale === "ja"
                ? "セッションが見つかりません。新しいセッションを開始してください。"
                : "Session not found. Please start a new session.",
          },
          timestamp,
          requestId,
        },
        { status: 404 }
      );
    }

    // TODO: Check rate limiting for chat messages
    const rateLimitResult = await checkChatRateLimit(validatedRequest.sessionId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ApiErrorCode.RATE_LIMITED,
            message: "Chat rate limit exceeded",
            userMessage:
              validatedRequest.locale === "ja"
                ? "メッセージの送信頻度が制限を超えました。少しお待ちください。"
                : "Too many messages sent. Please wait a moment.",
          },
          timestamp,
          requestId,
        },
        { status: 429 }
      );
    }

    // Process the chat message
    const response = await processChatMessage(validatedRequest);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Update session with new message
    await updateSessionWithMessage({
      sessionId: validatedRequest.sessionId,
      userMessage: validatedRequest.message,
      agentResponse: response.agentResponse,
      processingTime,
      cost: response.cost,
      locale: validatedRequest.locale,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        processingTime,
      },
      timestamp,
      requestId,
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: "Request validation failed",
            userMessage: "Invalid message format",
            details: error.issues,
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ApiErrorCode.CONVERSATION_ERROR,
          message: error instanceof Error ? error.message : "Chat processing failed",
          userMessage: "Unable to process your message. Please try again.",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate if session exists and is active
 */
async function validateSession(sessionId: string): Promise<boolean> {
  // TODO: Check Firestore for session existence and status
  console.log("Validating session:", sessionId);
  return true; // Placeholder
}

/**
 * Check rate limiting for chat messages
 */
async function checkChatRateLimit(sessionId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  // TODO: Implement chat-specific rate limiting
  // For now, allow all messages
  return {
    allowed: true,
    remaining: 100,
    resetTime: Date.now() + 3600000, // 1 hour from now
  };
}

/**
 * Process chat message with Maya's intelligence
 */
async function processChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
  const messageId = crypto.randomUUID();

  // Get session context from Firestore
  const sessionContext = await getSessionContext(request.sessionId);

  // Build Maya's chat request
  const chatRequest: ChatRequest = {
    sessionId: request.sessionId,
    message: request.message,
    locale: request.locale,
    context: {
      productAnalysis: sessionContext.analysis, // Product analysis from previous steps
      conversationHistory: sessionContext.messages || [],
      conversationContext: {
        topics: sessionContext.topics || {
          productFeatures: "pending",
          targetAudience: "pending", 
          brandPositioning: "pending",
          visualPreferences: "pending",
        },
        userIntent: "",
        keyInsights: sessionContext.keyInsights || [],
        uncertainties: sessionContext.uncertainties || [],
        followUpQuestions: [],
      },
    },
  };

  // Process with Maya's intelligence - AppModeConfig is checked internally
  const mayaResponse = await processMessage(chatRequest);

  // Check if Maya signaled a strategy update request
  console.log("[DEBUG] Maya's response:", mayaResponse.response);
  console.log("[DEBUG] Contains signal?", mayaResponse.response.includes("[STRATEGY_UPDATE_REQUEST]"));
  if (mayaResponse.response.includes("[STRATEGY_UPDATE_REQUEST]")) {
    console.log("[DEBUG] Signal detected! Processing strategy update...");
    // Remove the signal from the user-facing response
    const cleanResponse = mayaResponse.response.replace("[STRATEGY_UPDATE_REQUEST]", "").trim();
    
    // Generate updated strategy using our new method
    console.log("[DEBUG] sessionContext.analysis:", sessionContext.analysis);
    const strategyUpdate = await PromptBuilder.generateUpdatedStrategy(
      sessionContext.analysis?.commercialStrategy || {},
      request.message,
      sessionContext.messages?.map((m: any) => `${m.type}: ${m.content}`).join("\n") || "",
      sessionContext.analysis,
      request.locale
    );
    console.log("[DEBUG] Strategy update result:", strategyUpdate);

    // Store the pending strategy in the session for later confirmation
    const firestoreService = FirestoreService.getInstance();
    await firestoreService.storePendingStrategy(request.sessionId, strategyUpdate.updatedStrategy);

    return {
      messageId,
      messageType: "STRATEGY_UPDATE_CONFIRMATION",
      agentResponse: `${cleanResponse}\n\n${strategyUpdate.naturalSummary}`,
      processingTime: mayaResponse.processingTime,
      cost: mayaResponse.cost,
      confidence: mayaResponse.confidence,
      nextAction: "awaiting_confirmation",
      suggestedFollowUp: [],
      quickActions: [],
      metadata: {
        proposedStrategy: strategyUpdate.updatedStrategy,
        originalStrategy: sessionContext.analysis?.commercialStrategy,
        requiresConfirmation: true
      }
    };
  }

  return {
    messageId,
    messageType: "NORMAL_CHAT",
    agentResponse: mayaResponse.response,
    processingTime: mayaResponse.processingTime,
    cost: mayaResponse.cost,
    confidence: mayaResponse.confidence,
    nextAction: mayaResponse.nextAction,
    suggestedFollowUp: mayaResponse.suggestedFollowUps,
    // Use Maya's follow-ups if available, otherwise generate quick actions
    quickActions: mayaResponse.suggestedFollowUps && mayaResponse.suggestedFollowUps.length > 0 
      ? mayaResponse.suggestedFollowUps 
      : generateQuickActions(mayaResponse.response, request.locale),
  };
}

/**
 * Get session context for conversation
 */
async function getSessionContext(sessionId: string): Promise<any> {
  // TODO: Retrieve conversation history and analysis state from Firestore
  // For now, return mock data - you'll want to replace this with real Firestore calls
  return {
    messages: [], // Chat history
    analysis: {
      // Mock product analysis - replace with real data
      product: {
        name: "Premium Wireless Headphones",
        category: "electronics",
      },
      commercialStrategy: {
        keyMessages: {
          headline: "Premium Sound for Professionals",
          tagline: "Quality, Comfort, Performance",
        },
        keyScenes: {
          scenes: [
            { 
              id: "opening",
              title: "Opening Hook",
              description: "Professional using headphones in office setting"
            }
          ]
        }
      },
      targetAudience: {
        primary: {
          demographics: {
            ageRange: "25-45",
          }
        }
      },
      positioning: {
        valueProposition: {
          primaryBenefit: "Perfect audio experience for professionals"
        }
      }
    },
    topics: {
      productFeatures: "completed",
      targetAudience: "pending",
      brandPositioning: "pending", 
      visualPreferences: "pending",
    },
    keyInsights: [],
    uncertainties: [],
  };
}

/**
 * Generate quick actions based on Maya's response
 */
function generateQuickActions(response: string, locale: "en" | "ja"): string[] {
  const lowerResponse = response.toLowerCase();
  
  // Determine which category is most relevant
  if (lowerResponse.includes("headline") || lowerResponse.includes("tagline") || lowerResponse.includes("ヘッドライン") || lowerResponse.includes("タグライン")) {
    return PromptBuilder.getQuickActions("headline", locale).slice(0, 3);
  } else if (lowerResponse.includes("audience") || lowerResponse.includes("target") || lowerResponse.includes("ターゲット") || lowerResponse.includes("顧客")) {
    return PromptBuilder.getQuickActions("audience", locale).slice(0, 3);
  } else if (lowerResponse.includes("scene") || lowerResponse.includes("シーン") || lowerResponse.includes("video") || lowerResponse.includes("動画")) {
    return PromptBuilder.getQuickActions("scenes", locale).slice(0, 3);
  } else if (lowerResponse.includes("position") || lowerResponse.includes("ポジション") || lowerResponse.includes("brand") || lowerResponse.includes("ブランド")) {
    return PromptBuilder.getQuickActions("positioning", locale).slice(0, 3);
  }
  
  // Default to mixed quick actions
  return [
    ...PromptBuilder.getQuickActions("headline", locale).slice(0, 1),
    ...PromptBuilder.getQuickActions("positioning", locale).slice(0, 1), 
    ...PromptBuilder.getQuickActions("audience", locale).slice(0, 1),
  ];
}

/**
 * Update session with new message exchange
 */
async function updateSessionWithMessage(params: {
  sessionId: string;
  userMessage: string;
  agentResponse: string;
  processingTime: number;
  cost: number;
  locale: "en" | "ja";
}): Promise<void> {
  // TODO: Update Firestore with new messages and updated costs
  console.log("Updating session with messages:", params.sessionId);
}
