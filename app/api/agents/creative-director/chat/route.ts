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
      // Real mode: Simple placeholder for future implementation
      console.log(`[David Chat Real] Processing: "${message.slice(0, 50)}..."`);

      // TODO: Implement real Creative Director AI integration
      // For now, return a clear message about demo mode
      return NextResponse.json({
        success: true,
        message: "David's real mode integration is coming soon! Please use demo mode to test the complete 4-phase creative workflow.",
        data: {
          nextAction: "demo_mode_recommended",
          quickActions: [
            "Switch to demo mode",
            "Test the style selection workflow",
            "Experience asset generation",
            "See the complete creative process"
          ]
        },
        metadata: {
          mode: "real",
          timestamp: Date.now(),
          sessionId,
          processingTime: Date.now() - startTime
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