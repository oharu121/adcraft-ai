/**
 * Creative Director Agent - Chat API
 * 
 * Handles real-time chat interactions with David, the Creative Director,
 * processing visual decisions and creative direction using sophisticated
 * conversation intelligence with David's personality.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processCreativeMessage } from "@/lib/agents/creative-director/core/chat";
import { AppModeConfig } from "@/lib/config/app-mode";
import { FirestoreService } from "@/lib/services/firestore";
import { SessionStatus, CreativeMessageType, CreativeErrorType } from "@/lib/agents/creative-director/enums";
import {
  ApiResponse,
  CreativeChatRequest,
  CreativeChatResponse,
} from "@/lib/agents/creative-director/types/api-types";
import { DAVID_PERSONA } from "@/lib/constants/david-persona";

// Request validation schema following Maya's patterns
const ChatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000), // Allow longer messages for creative discussions
  locale: z.enum(["en", "ja"]).default("en"),
  context: z.object({
    mayaHandoffData: z.any().optional(),
    currentVisualDecisions: z.any().optional(),
    assetPreferences: z.any().optional(),
    conversationHistory: z.array(z.any()).optional(),
  }).optional(),
  metadata: z.object({
    userAgent: z.string().optional(),
    timestamp: z.number().optional(),
    visualContext: z.any().optional(), // For visual decision context
  }).optional(),
});

/**
 * Handle POST requests for creative chat messages
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreativeChatResponse>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = ChatRequestSchema.parse(body);

    console.log(`[DAVID CHAT] Processing message for session: ${validatedRequest.sessionId}`);

    // Validate session exists and is active for creative work
    const sessionValid = await validateCreativeSession(validatedRequest.sessionId);
    if (!sessionValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Creative Director session not found",
            userMessage: validatedRequest.locale === "ja"
              ? "クリエイティブセッションが見つかりません。新しいセッションを開始してください。"
              : "Creative session not found. Please start a new creative session.",
          },
          timestamp,
          requestId,
        },
        { status: 404 }
      );
    }

    // Check creative rate limiting (allow more flexibility for creative discussions)
    const rateLimitResult = await checkCreativeRateLimit(validatedRequest.sessionId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Creative chat rate limit exceeded",
            userMessage: validatedRequest.locale === "ja"
              ? "創作に関する会話が制限を超えました。少しお待ちください。"
              : "Creative conversation rate limit exceeded. Please wait a moment.",
          },
          timestamp,
          requestId,
        },
        { status: 429 }
      );
    }

    // Process the creative chat message
    const response = await processCreativeChatMessage(validatedRequest);

    // Calculate total processing time
    const processingTime = Date.now() - startTime;

    // Update session with new creative conversation
    await updateCreativeSessionWithMessage({
      sessionId: validatedRequest.sessionId,
      userMessage: validatedRequest.message,
      agentResponse: response.agentResponse,
      messageType: response.messageType as any,
      visualRecommendations: response.visualRecommendations,
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
    console.error("[DAVID CHAT] API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            userMessage: "Invalid creative message format",
            details: error.issues,
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    // Handle specific creative errors
    if (error instanceof Error && error.message.includes("ASSET_GENERATION")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: CreativeErrorType.ASSET_GENERATION_FAILED,
            message: error.message,
            userMessage: "Asset generation temporarily unavailable. Let's continue with creative planning.",
          },
          timestamp,
          requestId,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONVERSATION_ERROR",
          message: error instanceof Error ? error.message : "Creative chat processing failed",
          userMessage: "Unable to process your creative message. Please try again.",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate if creative session exists and is ready for conversation
 */
async function validateCreativeSession(sessionId: string): Promise<boolean> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);
    
    if (!session) {
      console.log(`[DAVID CHAT] Session not found: ${sessionId}`);
      return false;
    }

    // Check if session is in a valid state for conversation
    const validStatuses = [SessionStatus.READY, SessionStatus.ANALYZING, SessionStatus.CREATING, SessionStatus.AWAITING_INPUT];
    if (!validStatuses.includes(session.status)) {
      console.log(`[DAVID CHAT] Session ${sessionId} in invalid state: ${session.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[DAVID CHAT] Session validation error for ${sessionId}:`, error);
    return false;
  }
}

/**
 * Check rate limiting for creative chat messages (more lenient than Maya)
 */
async function checkCreativeRateLimit(sessionId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  // TODO: Implement creative-specific rate limiting
  // Creative discussions can be longer and more frequent than strategic discussions
  // Allow more messages per minute for creative iteration
  
  // For now, allow generous limits for creative work
  return {
    allowed: true,
    remaining: 200, // Higher limit for creative iteration
    resetTime: Date.now() + 3600000, // 1 hour from now
  };
}

/**
 * Process creative chat message with David's visual intelligence
 */
async function processCreativeChatMessage(request: any): Promise<CreativeChatResponse> {
  const messageId = crypto.randomUUID();
  const { sessionId, message, locale, context, metadata } = request;

  try {
    // Get session context from Firestore
    const sessionContext = await getCreativeSessionContext(sessionId);

    // Build comprehensive creative chat request
    const chatRequest: CreativeChatRequest = {
      sessionId,
      message,
      locale,
      context: {
        mayaHandoffData: sessionContext.mayaHandoffData || context?.mayaHandoffData,
        currentVisualDecisions: sessionContext.visualDecisions || context?.currentVisualDecisions,
        assetPreferences: sessionContext.assetPreferences || context?.assetPreferences,
        conversationHistory: sessionContext.conversationHistory || [],
      },
      metadata: metadata || {},
    };

    // Process with David's creative intelligence - AppModeConfig checked internally
    const davidResponse = await processCreativeMessage(chatRequest);

    // Check if David is signaling for asset generation
    if (davidResponse.agentResponse.includes("[ASSET_GENERATION_REQUEST]")) {
      console.log("[DAVID CHAT] Asset generation signal detected");
      
      // Remove signal from user-facing response
      const cleanResponse = davidResponse.agentResponse.replace("[ASSET_GENERATION_REQUEST]", "").trim();
      
      return {
        ...davidResponse,
        messageId,
        agentResponse: cleanResponse,
        messageType: CreativeMessageType.ASSET_GENERATION_UPDATE,
        nextAction: "generate_assets",
        metadata: {
          ...davidResponse.metadata,
          assetGenerationRequested: true,
          requiresConfirmation: true,
        },
      };
    }

    // Check if David is signaling for creative direction confirmation
    if (davidResponse.agentResponse.includes("[DIRECTION_CONFIRMATION_REQUEST]")) {
      console.log("[DAVID CHAT] Direction confirmation signal detected");
      
      const cleanResponse = davidResponse.agentResponse.replace("[DIRECTION_CONFIRMATION_REQUEST]", "").trim();
      
      return {
        ...davidResponse,
        messageId,
        agentResponse: cleanResponse,
        messageType: CreativeMessageType.DIRECTION_CONFIRMATION,
        nextAction: "awaiting_confirmation",
        metadata: {
          ...davidResponse.metadata,
          directionConfirmationRequested: true,
          requiresConfirmation: true,
        },
      };
    }

    // Check if David is ready for handoff to Alex
    if (davidResponse.nextAction === "handoff") {
      console.log("[DAVID CHAT] Handoff preparation detected");
      
      return {
        ...davidResponse,
        messageId,
        messageType: CreativeMessageType.HANDOFF_PREPARATION,
        nextAction: "handoff",
        metadata: {
          ...davidResponse.metadata,
          readyForHandoff: true,
        },
      };
    }

    return {
      ...davidResponse,
      messageId,
    };

  } catch (error) {
    console.error(`[DAVID CHAT] Processing failed for session ${sessionId}:`, error);
    
    // Generate David-specific fallback response with creative personality
    const persona = DAVID_PERSONA;
    const fallbackResponse: CreativeChatResponse = {
      messageId,
      messageType: "CREATIVE_INTRODUCTION" as any,
      agentResponse: locale === "ja"
        ? "申し訳ございません、創作の流れで一時的な混乱が生じました。視覚的なアプローチを再考して、新たな創造的な方向性を見つけましょう。"
        : `Let me recalibrate my creative perspective and approach this from a fresh visual angle.`,
      processingTime: 1000,
      cost: 0.01,
      confidence: 0.6,
      nextAction: "continue",
      suggestedActions: locale === "ja"
        ? [
            "ビジュアルスタイルの方向性を再確認",
            "創作プロセスを一歩戻って検討",
            "新しい視点からアプローチ"
          ]
        : [
            "Revisit visual style direction",
            "Step back and reconsider the creative process",
            "Approach from a new perspective"
          ],
      quickActions: generateCreativeFallbackActions(locale),
      visualRecommendations: {
        styleOptions: [
          { name: "Fresh Start", alignment: 0.8 },
          { name: "Refined Direction", alignment: 0.75 }
        ]
      }
    };

    return fallbackResponse;
  }
}

/**
 * Get creative session context for conversation
 */
async function getCreativeSessionContext(sessionId: string): Promise<any> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);
    
    if (!session) {
      console.log(`[DAVID CHAT] No session found for ${sessionId}, returning empty context`);
      return {
        conversationHistory: [],
        visualDecisions: [],
        assetPreferences: {},
        mayaHandoffData: null,
      };
    }

    return {
      conversationHistory: session.conversationHistory || [],
      visualDecisions: session.visualDecisions || [],
      assetPreferences: session.assetPreferences || {},
      mayaHandoffData: session.mayaHandoffData,
      creativePhase: session.creativePhase || "analysis",
      assets: session.assets || [],
    };
    
  } catch (error) {
    console.error(`[DAVID CHAT] Error retrieving session context for ${sessionId}:`, error);
    return {
      conversationHistory: [],
      visualDecisions: [],
      assetPreferences: {},
      mayaHandoffData: null,
    };
  }
}

/**
 * Generate creative fallback quick actions
 */
function generateCreativeFallbackActions(locale: "en" | "ja"): string[] {
  return locale === "ja"
    ? [
        "スタイルの方向性を確認",
        "カラーパレットを検討",
        "構図について相談",
        "ブランド整合性を確認"
      ]
    : [
        "Confirm style direction",
        "Consider color palette",
        "Discuss composition",
        "Check brand alignment"
      ];
}

/**
 * Update creative session with new message exchange
 */
async function updateCreativeSessionWithMessage(params: {
  sessionId: string;
  userMessage: string;
  agentResponse: string;
  messageType?: CreativeMessageType;
  visualRecommendations?: any;
  processingTime: number;
  cost: number;
  locale: "en" | "ja";
}): Promise<void> {
  try {
    const firestoreService = FirestoreService.getInstance();
    
    // Get current session to preserve existing data
    const currentSession = await firestoreService.getCreativeSession(params.sessionId);
    
    const updatedConversationHistory = [
      ...(currentSession?.conversationHistory || []),
      {
        type: "user",
        content: params.userMessage,
        timestamp: new Date().toISOString(),
      },
      {
        type: "agent",
        content: params.agentResponse,
        messageType: params.messageType,
        visualRecommendations: params.visualRecommendations,
        timestamp: new Date().toISOString(),
      },
    ];

    // Update cost tracking
    const currentCost = currentSession?.costTracking?.total || 0;
    const newCostTracking = {
      current: params.cost,
      total: currentCost + params.cost,
      breakdown: {
        ...currentSession?.costTracking?.breakdown,
        conversations: (currentSession?.costTracking?.breakdown?.conversations || 0) + params.cost,
      },
      remaining: 300 - (currentCost + params.cost),
      budgetAlert: (currentCost + params.cost) > 225, // 75% threshold
    };

    // Apply any visual recommendations to session state
    const updatedVisualDecisions = currentSession?.visualDecisions || [];
    if (params.visualRecommendations?.styleUpdates) {
      updatedVisualDecisions.push({
        type: "style_update",
        data: params.visualRecommendations.styleUpdates,
        timestamp: new Date().toISOString(),
      });
    }

    await firestoreService.updateCreativeSession(params.sessionId, {
      conversationHistory: updatedConversationHistory,
      visualDecisions: updatedVisualDecisions,
      costTracking: newCostTracking,
      lastActivity: new Date().toISOString(),
      status: SessionStatus.READY, // Keep session ready for continued conversation
    });

    console.log(`[DAVID CHAT] Updated session ${params.sessionId} with new conversation`);
    
  } catch (error) {
    console.error(`[DAVID CHAT] Failed to update session ${params.sessionId}:`, error);
    // Don't throw - session update failure shouldn't block the response
  }
}

/**
 * Handle GET requests for chat history and context
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Session ID is required",
          userMessage: "Session ID is required",
        },
        timestamp,
        requestId,
      },
      { status: 400 }
    );
  }

  try {
    console.log(`[DAVID CHAT] Getting chat history for session: ${sessionId}`);
    
    const sessionContext = await getCreativeSessionContext(sessionId);
    
    // Apply pagination to conversation history
    const conversationHistory = sessionContext.conversationHistory || [];
    const paginatedHistory = conversationHistory.slice(offset, offset + limit);
    
    const response = {
      sessionId,
      conversationHistory: paginatedHistory,
      visualDecisions: sessionContext.visualDecisions || [],
      currentCreativePhase: sessionContext.creativePhase || "analysis",
      assetsSummary: {
        total: (sessionContext.assets || []).length,
        ready: (sessionContext.assets || []).filter((a: any) => a.status === "ready").length,
        generating: (sessionContext.assets || []).filter((a: any) => a.status === "generating").length,
      },
      pagination: {
        total: conversationHistory.length,
        limit,
        offset,
        hasNext: offset + limit < conversationHistory.length,
        hasPrevious: offset > 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp,
      requestId,
    });

  } catch (error) {
    console.error(`[DAVID CHAT] GET request failed for session ${sessionId}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SESSION_ERROR",
          message: error instanceof Error ? error.message : "Failed to retrieve chat history",
          userMessage: "Unable to retrieve creative conversation history",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}