/**
 * Creative Director Chat API - Simplified Demo-Focused Version
 *
 * Handles David's 4-phase workflow:
 * Phase 1: Auto Creative Analysis
 * Phase 2: Style Selection
 * Phase 3: Scene Planning
 * Phase 4: Asset Generation & Review
 */

import { NextRequest, NextResponse } from "next/server";
import { AppModeConfig } from "@/lib/config/app-mode";
import { CreativeDirectorDemoHandler } from "@/lib/agents/creative-director/demo/demo-handler";
import { CreativePhase } from "@/lib/agents/creative-director/enums";
import { processRealCreativeMessage } from "@/lib/agents/creative-director/core/real-handler";
import { FirestoreService } from "@/lib/services/firestore";

interface SimplifiedChatRequest {
  sessionId: string;
  message: string;
  locale?: 'en' | 'ja';
  currentPhase?: CreativePhase;
  selectedStyle?: string;
  context?: {
    mayaHandoffData?: any;
    conversationHistory?: any[];
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SimplifiedChatRequest = await request.json();

    const {
      sessionId,
      message,
      locale = 'en',
      currentPhase = CreativePhase.ANALYSIS,
      selectedStyle,
      context
    } = body;

    // Validate required fields
    if (!sessionId || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing required fields: sessionId and message are required",
            code: "VALIDATION_ERROR"
          }
        },
        { status: 400 }
      );
    }

    console.log(`[David Chat] Processing: "${message.slice(0, 50)}..." | Phase: ${currentPhase} | Session: ${sessionId.slice(-6)}`);

    // Check current app mode
    const isDemoMode = AppModeConfig.isDemoMode;

    if (isDemoMode) {
      // Demo mode: Use our streamlined demo handler
      const demoResponse = await CreativeDirectorDemoHandler.handleDemoMessage(message, {
        sessionId,
        currentPhase,
        selectedStyle,
        conversationHistory: context?.conversationHistory || [],
        locale
      });

      const processingTime = Date.now() - startTime;

      // Handle both success and error cases with type assertions for demo simplicity
      const response = demoResponse as any; // Use any for demo simplicity

      if (response.success) {
        return NextResponse.json({
          success: true,
          message: response.data?.message || "Processing completed",
          data: {
            ...response.data,
            processingTime
          },
          metadata: {
            ...response.metadata,
            mode: "demo",
            timestamp: Date.now(),
            sessionId
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: response.error || { message: "Demo processing error" },
          metadata: {
            ...response.metadata,
            mode: "demo",
            timestamp: Date.now(),
            sessionId
          }
        });
      }

    } else {
      // Real mode: Process with step-specific logic following Maya's pattern
      console.log(`[David Chat Real] Processing: "${message.slice(0, 50)}..." | Phase: ${currentPhase}`);

      const realResponse = await processRealMode({
        sessionId,
        message,
        locale,
        currentPhase,
        selectedStyle,
        context
      }, startTime);

      return NextResponse.json({
        success: realResponse.success,
        message: realResponse.message,
        data: {
          ...realResponse.data,
          processingTime: realResponse.processingTime
        },
        metadata: {
          ...realResponse.metadata,
          mode: "real",
          timestamp: Date.now(),
          sessionId
        }
      });
    }

  } catch (error) {
    console.error("[David Chat API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Internal server error processing creative direction request",
          code: "INTERNAL_ERROR",
          canRetry: true
        },
        metadata: {
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : "Unknown error"
        }
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for session context
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  // In demo mode, we can return mock session context
  // In real mode, this would query Firestore
  const isDemoMode = AppModeConfig.isDemoMode;

  if (isDemoMode) {
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        currentPhase: CreativePhase.ANALYSIS,
        conversationHistory: [],
        selectedStyle: null,
        generatedAssets: [],
        metadata: {
          mode: "demo"
        }
      }
    });
  }

  return NextResponse.json({
    success: false,
    error: {
      message: "Real mode session context not yet implemented",
      code: "NOT_IMPLEMENTED"
    }
  });
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

/**
 * Process real mode Creative Director chat - following Maya's pattern
 */
async function processRealMode(request: SimplifiedChatRequest, startTime: number) {
  const { sessionId, message, locale = 'en', currentPhase, selectedStyle, context } = request;

  try {
    console.log(`[David Real Mode] Processing phase: ${currentPhase} for session: ${sessionId.slice(-6)}`);

    // Retrieve session context from Firestore (like Maya does)
    const firestoreService = FirestoreService.getInstance();
    let creativeSession;

    try {
      // Try to get existing Creative Director session
      creativeSession = await firestoreService.getCreativeSession(sessionId);
    } catch (error) {
      console.warn(`[David Real Mode] Creative Director session not found: ${sessionId}. Creating new session.`);
      // Create session if it doesn't exist
      await firestoreService.createCreativeSession(sessionId, { locale });
      creativeSession = await firestoreService.getCreativeSession(sessionId);
    }

    // Determine which step we're in based on our finalized data flow
    const step = determineCurrentStep(currentPhase || CreativePhase.ANALYSIS, selectedStyle, context);

    if (step === 1) {
      // Step 1: Production Style - No AI needed, this is UI selection only
      return {
        success: false,
        message: "Production Style selection should be handled by UI, not chat",
        data: { nextAction: "production_style_ui_only" },
        metadata: { step: 1, phase: currentPhase },
        processingTime: Date.now() - startTime
      };
    }

    // Steps 2 & 3: Need AI processing with proper context
    const creativeRequest = {
      sessionId,
      message,
      locale,
      currentPhase,
      selectedStyle,
      context: {
        mayaHandoffData: context?.mayaHandoffData,
        conversationHistory: context?.conversationHistory || [],
        // Add step-specific context
        selectedProductionStyle: extractSelectedProductionStyle(context),
        selectedStyleOption: extractSelectedStyleOption(context),
        currentStep: step
      }
    };

    // Use existing real handler with step-specific context
    const aiResponse = await processRealCreativeMessage(creativeRequest, startTime);

    // Store conversation in Firestore (like Maya does)
    if (creativeSession) {
      const conversationHistory = creativeSession.conversationHistory || [];

      // Add user message
      conversationHistory.push({
        type: 'user',
        content: message,
        timestamp: Date.now(),
        step,
        phase: currentPhase
      });

      // Add agent response
      conversationHistory.push({
        type: 'agent',
        content: aiResponse.agentResponse,
        timestamp: Date.now(),
        step,
        phase: currentPhase,
        cost: aiResponse.cost,
        confidence: aiResponse.confidence
      });

      // Update session with new conversation history
      await firestoreService.updateCreativeSession(sessionId, {
        conversationHistory,
        lastActivity: Date.now(),
        currentStep: step,
        currentPhase
      });
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      message: aiResponse.agentResponse,
      data: {
        messageType: aiResponse.messageType,
        nextAction: aiResponse.nextAction,
        quickActions: aiResponse.quickActions || [],
        suggestedActions: aiResponse.suggestedActions || [],
        visualRecommendations: aiResponse.visualRecommendations,
        currentStep: step,
        cost: {
          current: aiResponse.cost,
          total: aiResponse.cost,
          remaining: 300 - aiResponse.cost
        }
      },
      metadata: {
        step,
        phase: currentPhase,
        confidence: aiResponse.confidence,
        modelUsed: (aiResponse.metadata as any)?.modelUsed,
        tokensUsed: (aiResponse.metadata as any)?.tokensUsed
      },
      processingTime
    };

  } catch (error) {
    console.error(`[David Real Mode] Error for session ${sessionId}:`, error);

    // Fallback response like Maya does
    const cost = 0.01;
    const processingTime = Date.now() - startTime;

    return {
      success: false,
      message: locale === 'ja'
        ? "申し訳ございませんが、一時的に問題が発生しています。もう一度お試しください。"
        : "I'm experiencing some technical difficulties. Please try again.",
      data: {
        nextAction: "retry",
        canRetry: true,
        cost: {
          current: cost,
          total: cost,
          remaining: 300 - cost
        }
      },
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        phase: currentPhase
      },
      processingTime
    };
  }
}

/**
 * Determine current step based on context - following our finalized data flow
 */
function determineCurrentStep(currentPhase: CreativePhase, selectedStyle?: string, context?: any): number {
  // Step 1: Production Style (UI only, no chat needed)
  if (currentPhase === CreativePhase.ANALYSIS || !context?.mayaHandoffData) {
    return 1;
  }

  // Step 2: Creative Direction (needs AI + production style context)
  if (!selectedStyle && context?.mayaHandoffData) {
    return 2;
  }

  // Step 3: Scene Architecture (needs AI + accumulated context)
  if (selectedStyle && context?.mayaHandoffData) {
    return 3;
  }

  return 2; // Default to step 2
}

/**
 * Extract selected production style from context
 */
function extractSelectedProductionStyle(context: any) {
  return context?.selectedProductionStyle || null;
}

/**
 * Extract selected style option from context
 */
function extractSelectedStyleOption(context: any) {
  return context?.selectedStyleOption || null;
}