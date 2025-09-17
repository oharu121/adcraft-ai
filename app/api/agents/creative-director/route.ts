/**
 * Creative Director Agent - Main API Route
 * 
 * Handles Creative Director Agent orchestration including initialization, status tracking,
 * and handoff coordination following Maya's proven patterns.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processCreativeMessage } from "@/lib/agents/creative-director/core/chat";
import { AppModeConfig } from "@/lib/config/app-mode";
import { SessionStatus, AgentType, CreativeErrorType } from "@/lib/agents/creative-director/enums";
import { FirestoreService } from "@/lib/services/firestore";
import { generateStyleOptions } from "@/lib/agents/creative-director/tools/style-options-generator";
import { composeScenes } from "@/lib/agents/creative-director/tools/scene-composer";
import type { SceneCompositionRequest } from "@/lib/agents/creative-director/tools/scene-composer";
import {
  ApiResponse,
  CreativeDirectorInitRequest,
  CreativeDirectorInitResponse,
  CreativeChatRequest,
  CreativeChatResponse,
  CreativeDirectorStatusResponse,
  ZaraHandoffRequest,
  ZaraHandoffResponse,
} from "@/lib/agents/creative-director/types/api-types";

// Request validation schema
const CreativeDirectorRequestSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(["initialize", "status", "chat", "handoff", "compose-scenes"]),
  locale: z.enum(["en", "ja"]).default("en"),
  data: z.any().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Handle POST requests to the Creative Director Agent
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = CreativeDirectorRequestSchema.parse(body);
    console.log(`[DAVID] Validated request:`, validatedRequest);

    console.log(`[DAVID] Processing ${validatedRequest.action} request for session: ${validatedRequest.sessionId}`);

    // Route to appropriate handler
    let response;
    
    switch (validatedRequest.action) {
      case "initialize":
        response = await handleInitializeRequest(validatedRequest);
        break;
      case "status":
        response = await handleStatusRequest(validatedRequest);
        break;
      case "chat":
        response = await handleChatRequest(validatedRequest);
        break;
      case "handoff":
        response = await handleHandoffRequest(validatedRequest);
        break;
      case "compose-scenes":
        response = await handleComposeScenes(validatedRequest);
        break;
      default:
        throw new Error("Invalid action type");
    }

    const processingTime = Date.now() - startTime;

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
    console.error("[DAVID] API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            userMessage: "Invalid request format",
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
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          userMessage: "An internal error occurred. Please try again.",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle Maya → David handoff initialization
 */
async function handleInitializeRequest(request: any): Promise<CreativeDirectorInitResponse> {
  const { sessionId, data, locale } = request;
  
  try {
    console.log(`[DAVID] Initializing Creative Director for session: ${sessionId}`);
    
    // Validate Maya's handoff data
    const mayaHandoffData = data?.mayaHandoffData;
    if (!mayaHandoffData) {
      throw new Error("Maya handoff data is required for initialization");
    }

    // Get mode from AppModeConfig
    const isDemoMode = AppModeConfig.getMode() === "demo";
    
    if (isDemoMode) {
      return await initializeDemoMode(sessionId, mayaHandoffData, locale);
    } else {
      return await initializeRealMode(sessionId, mayaHandoffData, locale);
    }

  } catch (error) {
    console.error(`[DAVID] Initialization failed for session ${sessionId}:`, error);
    throw new Error(`Creative Director initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Initialize Creative Director in demo mode
 */
async function initializeDemoMode(
  sessionId: string, 
  mayaHandoffData: any, 
  locale: "en" | "ja"
): Promise<CreativeDirectorInitResponse> {
  console.log(`[DAVID DEMO] Initializing demo mode for session: ${sessionId}`);
  
  // Simulate initialization processing time
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

  // Store handoff data for conversation context
  const firestoreService = FirestoreService.getInstance();
  await firestoreService.createCreativeSession(sessionId, {
    status: SessionStatus.READY,
    mayaHandoffData,
    locale,
    creativePhase: "analysis",
    mode: "demo",
  });

  // Generate sophisticated creative assessment
  const creativeAssessment = {
    visualOpportunities: locale === "ja" 
      ? [
          "プレミアムブランドの視覚的権威を確立",
          "商品の機能性と美学のバランス",
          "ターゲット層の心理的欲求への訴求"
        ]
      : [
          "Establish visual authority for premium brand positioning",
          "Balance product functionality with aesthetic appeal", 
          "Appeal to target audience psychological desires"
        ],
    styleRecommendations: locale === "ja"
      ? [
          "洗練されたミニマリストアプローチ",
          "高級感のあるカラーパレット",
          "プロフェッショナルな構図設計"
        ]
      : [
          "Sophisticated minimalist approach",
          "Premium color palette selection",
          "Professional composition design"
        ],
    assetNeeds: locale === "ja"
      ? [
          "ブランドの核となるビジュアルアイデンティティ",
          "商品を際立たせる背景とオーバーレイ",
          "感情的な繋がりを作るライフスタイルシーン"
        ]
      : [
          "Core brand visual identity assets",
          "Product-highlighting backgrounds and overlays",
          "Lifestyle scenes that create emotional connection"
        ],
    estimatedGenerationTime: 300000, // 5 minutes
  };

  // Generate style options following Maya's quickActions pattern
  const styleOptions = await generateStyleOptions(mayaHandoffData, locale);

  return {
    sessionId,
    agentStatus: "ready",
    creativeAssessment,
    styleOptions, // Add style options to response
    cost: {
      estimated: 1.5, // Estimated cost for creative direction and asset generation
      remaining: 298.5,
    },
  };
}

/**
 * Initialize Creative Director in real mode
 */
async function initializeRealMode(
  sessionId: string,
  mayaHandoffData: any,
  locale: "en" | "ja"
): Promise<CreativeDirectorInitResponse> {
  console.log(`[DAVID REAL] Initializing real mode for session: ${sessionId}`);

  // Store handoff data for conversation context
  const firestoreService = FirestoreService.getInstance();
  await firestoreService.createCreativeSession(sessionId, {
    status: SessionStatus.READY,
    mayaHandoffData,
    locale,
    creativePhase: "analysis",
    mode: "real",
  });

  // Analyze Maya's handoff data for creative opportunities
  const visualOpportunities = await analyzeVisualOpportunities(mayaHandoffData, locale);
  const styleRecommendations = await generateStyleRecommendations(mayaHandoffData, locale);
  const assetNeeds = await assessAssetNeeds(mayaHandoffData, locale);

  // Generate style options following Maya's quickActions pattern (real mode with AI customization)
  const styleOptions = await generateStyleOptions(mayaHandoffData, locale);

  return {
    sessionId,
    agentStatus: "ready",
    creativeAssessment: {
      visualOpportunities,
      styleRecommendations,
      assetNeeds,
      estimatedGenerationTime: 300000, // 5 minutes
    },
    styleOptions, // Add style options to response
    cost: {
      estimated: 2.0, // Real mode may be slightly higher due to AI processing
      remaining: 298.0,
    },
  };
}

/**
 * Handle David status and progress tracking
 */
async function handleStatusRequest(request: any): Promise<CreativeDirectorStatusResponse> {
  const { sessionId } = request;
  
  try {
    console.log(`[DAVID] Getting status for session: ${sessionId}`);
    
    // Retrieve session from Firestore
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);
    
    if (!session) {
      throw new Error("Creative Director session not found");
    }

    // Calculate progress based on current phase and completed actions
    const progress = calculateCreativeProgress(session);

    return {
      sessionId,
      status: session.status || SessionStatus.READY,
      currentAgent: AgentType.DAVID,
      progress,
      creativeState: {
        visualDecisionsMade: session.visualDecisions?.length || 0,
        assetsGenerated: session.assets?.length || 0,
        directionFinalized: session.directionFinalized || false,
      },
      cost: session.costTracking || {
        current: 0,
        total: 0,
        breakdown: { initialization: 0, conversations: 0, assetGeneration: 0 },
        remaining: 300,
        budgetAlert: false,
      },
      lastActivity: session.lastActivity || new Date().toISOString(),
      health: {
        isActive: true,
        connectionStatus: "connected",
        errorCount: session.errorCount || 0,
      },
    };

  } catch (error) {
    console.error(`[DAVID] Status check failed for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Handle chat conversation requests
 */
async function handleChatRequest(request: any): Promise<CreativeChatResponse> {
  const { sessionId, data, locale } = request;
  
  if (!data?.message) {
    throw new Error("Message is required for chat requests");
  }

  try {
    console.log(`[DAVID] Processing chat for session: ${sessionId}`);
    
    // Retrieve session context
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);
    
    if (!session) {
      throw new Error("Creative Director session not found");
    }

    // Build chat request with full creative context
    const chatRequest: CreativeChatRequest = {
      sessionId,
      message: data.message,
      locale: locale || "en",
      context: {
        mayaHandoffData: session.mayaHandoffData,
        currentVisualDecisions: session.visualDecisions,
        assetPreferences: session.assetPreferences,
        conversationHistory: session.conversationHistory || [],
      },
      metadata: data.metadata || {},
    };

    // Process with David's creative intelligence
    const response = await processCreativeMessage(chatRequest);

    // Update session with new conversation
    await firestoreService.updateCreativeSession(sessionId, {
      conversationHistory: [
        ...(session.conversationHistory || []),
        { type: "user", content: data.message, timestamp: new Date().toISOString() },
        { type: "agent", content: response.agentResponse, timestamp: new Date().toISOString() },
      ],
      lastActivity: new Date().toISOString(),
      status: response.nextAction === "handoff" ? SessionStatus.COMPLETED : SessionStatus.READY,
    });

    return response;

  } catch (error) {
    console.error(`[DAVID] Chat failed for session ${sessionId}:`, error);
    
    // Generate fallback response with creative context
    const fallbackResponse: CreativeChatResponse = {
      messageId: crypto.randomUUID(),
      messageType: "CREATIVE_INTRODUCTION",
      agentResponse: locale === "ja"
        ? "申し訳ございませんが、創作プロセスで問題が発生しました。創造的な視点から、もう一度アプローチしてみましょう。"
        : "I apologize for the creative hiccup. Let's approach this from a fresh visual perspective.",
      processingTime: 1000,
      cost: 0.01,
      confidence: 0.5,
      nextAction: "continue",
      suggestedActions: locale === "ja" 
        ? ["ビジュアルスタイルについて話し合う", "カラーパレットを検討する"]
        : ["Discuss visual style", "Consider color palette"],
      quickActions: locale === "ja"
        ? ["スタイル選択", "色彩検討", "構図設計", "ブランド整合性確認"]
        : ["Style Selection", "Color Discussion", "Composition Design", "Brand Alignment Check"],
    };

    return fallbackResponse;
  }
}

/**
 * Handle David → Zara handoff preparation
 */
async function handleHandoffRequest(request: any): Promise<ZaraHandoffResponse> {
  const { sessionId, data } = request;

  try {
    console.log(`[DAVID] Preparing handoff to Zara for session: ${sessionId}`);

    // Retrieve complete creative session
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);

    if (!session) {
      throw new Error("Creative Director session not found");
    }

    // Validate session is ready for handoff
    const readinessCheck = validateHandoffReadiness(session);
    if (!readinessCheck.ready) {
      throw new Error(`Session not ready for handoff: ${readinessCheck.errors.join(", ")}`);
    }

    // Prepare comprehensive creative package for Zara
    const creativePackage = await prepareCreativePackage(session);

    // Validate assets and technical specs
    const validation = await validateCreativePackage(creativePackage);

    // Estimate video production time based on creative complexity
    const estimatedVideoProductionTime = estimateVideoProductionTime(creativePackage);

    // Create handoff record
    await firestoreService.createHandoffRecord(sessionId, {
      fromAgent: AgentType.DAVID,
      toAgent: AgentType.Zara,
      creativePackage,
      validation,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      targetAgent: AgentType.Zara,
      handoffTimestamp: new Date().toISOString(),
      creativePackage,
      validationResults: validation,
      estimatedVideoProductionTime,
    };
  } catch (error) {
    console.error(`[DAVID] Handoff failed for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Handle GET requests for agent status
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

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
    // Use same status logic as POST handler
    const response = await handleStatusRequest({ sessionId });

    return NextResponse.json({
      success: true,
      data: response,
      timestamp,
      requestId,
    });

  } catch (error) {
    console.error(`[DAVID] GET status failed for session ${sessionId}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SESSION_ERROR",
          message: error instanceof Error ? error.message : "Status check failed",
          userMessage: "Unable to retrieve Creative Director status",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

// Helper functions for creative analysis and preparation

async function analyzeVisualOpportunities(mayaHandoffData: any, locale: "en" | "ja"): Promise<string[]> {
  // TODO: Implement real visual analysis using creative tools
  // For now, return intelligent defaults based on product analysis
  return locale === "ja"
    ? [
        "ブランドの視覚的権威確立の機会",
        "競合他社との差別化ポイント",
        "ターゲット層への心理的アピール"
      ]
    : [
        "Brand visual authority establishment opportunity",
        "Competitive differentiation points",
        "Psychological appeal to target audience"
      ];
}

async function generateStyleRecommendations(mayaHandoffData: any, locale: "en" | "ja"): Promise<string[]> {
  // TODO: Implement real style generation using style-generator tool
  return locale === "ja"
    ? [
        "洗練されたミニマリストアプローチ",
        "プレミアムカラーパレット戦略",
        "プロフェッショナル構図設計"
      ]
    : [
        "Sophisticated minimalist approach",
        "Premium color palette strategy",
        "Professional composition design"
      ];
}

async function assessAssetNeeds(mayaHandoffData: any, locale: "en" | "ja"): Promise<string[]> {
  // TODO: Implement real asset needs assessment
  return locale === "ja"
    ? [
        "ブランド・アイデンティティ・アセット",
        "商品強調背景・オーバーレイ",
        "感情的結合ライフスタイルシーン"
      ]
    : [
        "Brand identity assets",
        "Product-highlighting backgrounds and overlays", 
        "Emotional connection lifestyle scenes"
      ];
}

function calculateCreativeProgress(session: any): any {
  // Calculate progress based on creative phase and completed milestones
  const phase = session.creativePhase || "analysis";
  const totalSteps = 4; // analysis, creative_development, asset_generation, finalization
  
  let step = 1;
  let percentage = 25;
  let description = "Analyzing creative opportunities";
  
  switch (phase) {
    case "analysis":
      step = 1;
      percentage = 25;
      description = "Analyzing creative opportunities";
      break;
    case "creative_development":
      step = 2;
      percentage = 50;
      description = "Developing creative direction";
      break;
    case "asset_generation":
      step = 3;
      percentage = 75;
      description = "Generating visual assets";
      break;
    case "finalization":
      step = 4;
      percentage = 100;
      description = "Finalizing creative package";
      break;
  }

  return {
    phase,
    step,
    totalSteps,
    description,
    percentage,
  };
}

function validateHandoffReadiness(session: any): { ready: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!session.visualDecisions || session.visualDecisions.length === 0) {
    errors.push("No visual decisions made");
  }
  
  if (!session.directionFinalized) {
    errors.push("Creative direction not finalized");
  }
  
  if (!session.assets || session.assets.length === 0) {
    errors.push("No assets generated");
  }

  return {
    ready: errors.length === 0,
    errors,
  };
}

/**
 * Handle scene composition requests
 */
async function handleComposeScenes(validatedRequest: any): Promise<any> {
  const { sessionId, data, locale } = validatedRequest;

  try {
    console.log(`[DAVID] Composing scenes for session: ${sessionId}`);

    // Get session to extract context
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Build scene composition request
    const sceneRequest: SceneCompositionRequest = {
      sessionId,
      context: {
        productInfo: session.mayaHandoffData?.productAnalysis?.product || {},
        brandDirection: {
          brandPersonality: session.mayaHandoffData?.productAnalysis?.brandPersonality || [],
          keyMessages: session.mayaHandoffData?.productAnalysis?.keyMessages || {}
        },
        targetAudience: session.mayaHandoffData?.productAnalysis?.targetAudience || {},
        videoSpecs: {
          duration: 30,
          aspectRatio: "16:9",
          format: "mp4",
          purpose: "commercial"
        }
      },
      availableAssets: session.assets || [],
      preferences: {
        pacing: data?.pacing || "medium",
        mood: data?.mood || "professional",
        storytelling: data?.storytelling || "product-focused",
        constraints: data?.constraints || []
      },
      locale: locale || "en"
    };

    // Call scene composer
    const sceneComposition = await composeScenes(sceneRequest);

    // Update session with scene composition
    await firestoreService.updateCreativeSession(sessionId, {
      sceneComposition: sceneComposition,
      lastActivity: new Date().toISOString(),
    });

    console.log(`[DAVID] Scene composition completed for session: ${sessionId}`);

    return {
      sceneComposition,
      processingTime: sceneComposition.processingTime,
      cost: sceneComposition.cost,
      confidence: sceneComposition.confidence
    };

  } catch (error) {
    console.error(`[DAVID] Scene composition failed for session ${sessionId}:`, error);
    throw new Error(`Scene composition failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function prepareCreativePackage(session: any): Promise<any> {
  // TODO: Implement comprehensive creative package preparation
  return {
    direction: session.creativeDirection || {},
    assets: session.assets || [],
    productionNotes: session.productionNotes || [],
    technicalSpecs: session.technicalSpecs || {},
  };
}

async function validateCreativePackage(creativePackage: any): Promise<any> {
  // TODO: Implement comprehensive validation
  return {
    isValid: true,
    errors: [],
    warnings: [],
    assetQuality: {
      ready: creativePackage.assets?.map((asset: any) => asset.id) || [],
      needsWork: [],
    },
  };
}

function estimateVideoProductionTime(creativePackage: any): number {
  // TODO: Implement intelligent estimation based on creative complexity
  const baseTime = 600000; // 10 minutes base
  const assetCount = creativePackage.assets?.length || 0;
  const complexityMultiplier = Math.max(1, assetCount / 5);
  
  return Math.round(baseTime * complexityMultiplier);
}