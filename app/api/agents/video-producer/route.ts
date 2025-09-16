import { NextRequest, NextResponse } from "next/server";
import { AppModeConfig } from "@/lib/config/app-mode";
import type { CreativeDirection } from "@/lib/agents/creative-director/types/asset-types";
import type { Locale } from "@/lib/dictionaries";

// Video Producer initialization request
interface VideoProducerInitRequest {
  sessionId: string;
  action: "initialize";
  locale: Locale;
  data: {
    creativeDirectorHandoffData: {
      creativeDirectorSessionId: string;
      creativeDirection: CreativeDirection;
      handoffTimestamp: number;
    };
  };
}

// Video Producer initialization response
interface VideoProducerInitResponse {
  sessionId: string;
  agentStatus: "ready" | "initializing" | "error";
  videoProductionSpecs: {
    resolution: string;
    frameRate: number;
    aspectRatio: string;
    duration: number;
    format: string;
  };
  estimatedProcessingTime: number;
  productionTimeline: {
    preProduction: number;
    production: number;
    postProduction: number;
    total: number;
  };
  cost: {
    estimated: number;
    remaining: number;
  };
}

// Demo mode video production handler
async function initializeDemoMode(
  request: VideoProducerInitRequest
): Promise<VideoProducerInitResponse> {
  const { sessionId, data, locale } = request;
  const { creativeDirection } = data.creativeDirectorHandoffData;

  console.log(`[Video Producer Demo] Initializing session ${sessionId}`);

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Demo response with realistic video production specs
  const response: VideoProducerInitResponse = {
    sessionId,
    agentStatus: "ready",
    videoProductionSpecs: {
      resolution: "1920x1080",
      frameRate: 30,
      aspectRatio: "16:9",
      duration: 15, // 15 second commercial
      format: "MP4"
    },
    estimatedProcessingTime: 300, // 5 minutes in seconds
    productionTimeline: {
      preProduction: 60,  // 1 minute
      production: 180,    // 3 minutes
      postProduction: 60, // 1 minute
      total: 300
    },
    cost: {
      estimated: 2.5, // Estimated cost for video generation
      remaining: 296.0
    }
  };

  return response;
}

// Real mode video production handler
async function initializeRealMode(
  request: VideoProducerInitRequest
): Promise<VideoProducerInitResponse> {
  const { sessionId, data, locale } = request;
  const { creativeDirection } = data.creativeDirectorHandoffData;

  console.log(`[Video Producer Real] Initializing session ${sessionId}`);

  // TODO: Implement real video production initialization
  // This would involve:
  // 1. Setting up video generation pipeline
  // 2. Preparing assets from creative direction
  // 3. Configuring production parameters
  // 4. Estimating real costs and timelines

  // For now, return similar structure as demo mode
  const response: VideoProducerInitResponse = {
    sessionId,
    agentStatus: "ready",
    videoProductionSpecs: {
      resolution: "1920x1080",
      frameRate: 30,
      aspectRatio: "16:9",
      duration: 15,
      format: "MP4"
    },
    estimatedProcessingTime: 360, // Slightly longer for real mode
    productionTimeline: {
      preProduction: 90,
      production: 240,
      postProduction: 30,
      total: 360
    },
    cost: {
      estimated: 2.8, // Real cost might be higher
      remaining: 295.7
    }
  };

  return response;
}

// Main handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Video Producer API] Request received:", body);

    const { action } = body;

    if (action === "initialize") {
      const initRequest = body as VideoProducerInitRequest;

      // Validate required fields
      if (!initRequest.sessionId || !initRequest.data?.creativeDirectorHandoffData) {
        return NextResponse.json(
          { error: "Missing required fields: sessionId or creativeDirectorHandoffData" },
          { status: 400 }
        );
      }

      // Check app mode and route to appropriate handler
      const isDemoMode = AppModeConfig.getMode() === 'demo';
      let response: VideoProducerInitResponse;

      if (isDemoMode) {
        response = await initializeDemoMode(initRequest);
      } else {
        response = await initializeRealMode(initRequest);
      }

      return NextResponse.json({
        success: true,
        data: response,
        timestamp: Date.now(),
        mode: isDemoMode ? 'demo' : 'real'
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error) {
    console.error("[Video Producer API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    agent: "video-producer",
    status: "healthy",
    mode: AppModeConfig.getMode(),
    timestamp: Date.now()
  });
}