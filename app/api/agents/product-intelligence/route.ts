/**
 * Product Intelligence Agent - Main API Route (Simplified)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeProductImage } from "@/lib/agents/product-intelligence";
import { processMessage } from "@/lib/agents/product-intelligence";
import { PromptBuilder } from "@/lib/agents/product-intelligence/tools/prompt-builder";
import { AppModeConfig } from "@/lib/config/app-mode";
import { TopicStatus } from "@/lib/agents/product-intelligence/enums";

// Simple request interface for now
interface SimpleRequest {
  sessionId: string;
  action: "analyze" | "chat" | "handoff";
  message?: string;
  productName?: string; // Optional product name for better commercial generation
  locale?: "en" | "ja";
  appMode?: "demo" | "real"; // Client-sent mode override
  metadata?: any;
}

/**
 * Handle POST requests to the Product Intelligence Agent
 */
export async function POST(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const timestamp = new Date().toISOString();

  try {
    // Parse request body
    const body: SimpleRequest = await request.json();
    console.log("Received request:", body);

    // Basic validation
    if (!body.sessionId) {
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

    if (!body.action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Action is required",
            userMessage: "Action is required",
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate product name for analyze actions
    if (body.action === "analyze" && !body.productName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Product name is required for analysis",
            userMessage: PromptBuilder.getLocaleMessages(body.locale || "en").productNameRequired,
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    // Route to appropriate handler
    let response;

    switch (body.action) {
      case "analyze":
        response = await handleAnalyzeRequest(body);
        break;
      case "chat":
        response = await handleChatRequest(body);
        break;
      case "handoff":
        response = await handleHandoffRequest(body);
        break;
      default:
        throw new Error("Invalid action type");
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp,
      requestId,
    });
  } catch (error) {
    console.error("Product Intelligence Agent API Error:", error);

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
 * Handle image analysis requests
 */
async function handleAnalyzeRequest(request: SimpleRequest) {
  const { sessionId, locale = "en", appMode } = request;
  const startTime = Date.now();

  try {
    // Use client-sent mode if available, otherwise fallback to server config
    const isDemoMode = appMode === "demo" || (!appMode && AppModeConfig.isDemoMode);

    if (isDemoMode) {
      // Use the functional approach for demo mode
      const visionRequest = {
        sessionId,
        locale: locale as "en" | "ja",
        productName: request.productName,
        imageData: request.metadata?.imageData || "",
        analysisOptions: {
          detailLevel: "comprehensive" as const,
          includeTargetAudience: true,
          includePositioning: true,
          includeVisualPreferences: true,
        },
      };

      const visionResult = await analyzeProductImage(visionRequest, {
        forceMode: "demo",
      });

      return {
        analysis: visionResult.analysis,
        agentResponse: PromptBuilder.getLocaleMessages(locale || "en").analysisComplete.replace(
          "{description}",
          visionResult.analysis.product.description.substring(0, 50) + "..."
        ),
        processingTime: visionResult.processingTime,
        cost: {
          current: visionResult.cost,
          total: visionResult.cost,
          breakdown: {
            imageAnalysis: visionResult.cost,
            chatInteractions: 0,
          },
          remaining: 299.68,
          budgetAlert: false,
        },
        confidence: visionResult.confidence,
        nextAction: "chat_ready",
        canProceed: true,
        warnings: visionResult.warnings || [],
      };
    }

    // Real mode - determine if this is image or text analysis
    const inputType = request.metadata?.inputType || "image";
    const description = request.message || "";

    console.log(`[REAL MODE] Processing ${inputType} analysis for session: ${sessionId}`);

    let analysisResult;
    let cost: number;
    let agentResponse: string;

    if (inputType === "text") {
      // For text analysis, create a simple structured response
      cost = 0.15;
      agentResponse = PromptBuilder.getLocaleMessages(locale || "en").analysisComplete.replace(
        "{description}",
        description.substring(0, 50) + (description.length > 50 ? "..." : "")
      );
    } else {
      // For image analysis, use functional approach
      // Get base64 image data from request metadata
      const imageData = request.metadata?.imageData;

      if (!imageData) {
        throw new Error("No image data provided for analysis");
      }

      console.log(
        `Analyzing image with functional Vision API (base64 data length: ${imageData.length})`
      );

      analysisResult = await analyzeProductImage(
        {
          sessionId,
          imageData, // Use base64 data instead of URL
          description,
          productName: request.productName, // Include product name if provided
          locale,
          analysisOptions: {
            detailLevel: "detailed",
            includeTargetAudience: true,
            includePositioning: true,
            includeVisualPreferences: true,
          },
        },
        { forceMode: appMode }
      );

      cost = analysisResult.cost;
      agentResponse = PromptBuilder.getLocaleMessages(locale || "en").imageAnalysisComplete;
    }

    const processingTime = Date.now() - startTime;

    return {
      sessionId: request.sessionId,
      nextAction: "continue_chat",
      cost: {
        current: cost,
        total: cost,
        remaining: 300 - cost,
      },
      processingTime: Math.round(processingTime),
      agentResponse,
      ...(analysisResult && { analysis: analysisResult.analysis }),
    };
  } catch (error) {
    console.error(`Analysis failed for session ${sessionId}:`, error);

    // Determine error type for user-friendly messaging
    let errorType = "unknown";
    let userErrorMessage = "";

    if (
      error instanceof Error &&
      (error.message.includes("No image data provided") || error.message.includes("base64"))
    ) {
      errorType = "image_upload";
      userErrorMessage = PromptBuilder.getLocaleMessages(locale || "en").imageUploadError;
    } else if (
      error instanceof Error &&
      (error.message.includes("Vertex AI") || error.message.includes("Gemini"))
    ) {
      errorType = "ai_service";
      userErrorMessage = PromptBuilder.getLocaleMessages(locale || "en").aiServiceError;
    } else {
      errorType = "system";
      userErrorMessage = PromptBuilder.getLocaleMessages(locale || "en").systemError;
    }

    const cost = 0.01;
    const agentResponse = PromptBuilder.getLocaleMessages(
      locale || "en"
    ).analysisFailedMessage.replace("{error}", userErrorMessage);

    return {
      sessionId: request.sessionId,
      nextAction: "error_recovery", // Special status to prevent progression
      cost: {
        current: cost,
        total: cost,
        remaining: 300 - cost,
      },
      processingTime: Math.round(Date.now() - startTime),
      agentResponse,
      errorType,
      warnings: [`Real AI analysis failed: ${errorType}`],
      canProceed: false, // Explicitly block progression
    };
  }
}

/**
 * Handle chat conversation requests
 */
async function handleChatRequest(request: SimpleRequest) {
  const { sessionId, message, locale = "en", appMode } = request;

  if (!message) {
    throw new Error("Message is required for chat requests");
  }

  try {
    // Use client-sent mode if available, otherwise fallback to server config
    const isDemoMode = appMode === "demo" || (!appMode && AppModeConfig.isDemoMode);

    if (isDemoMode) {
      return await handleDemoChat(request);
    }

    console.log(`[REAL MODE] Processing chat for session: ${sessionId}`);

    // Build context from session (in a real app, this would come from database)
    const chatContext = {
      productAnalysis: request.metadata?.productAnalysis || null,
      conversationHistory: request.metadata?.conversationHistory || [],
      conversationContext: {
        topics: {
          productFeatures: TopicStatus.PENDING,
          targetAudience: TopicStatus.PENDING,
          brandPositioning: TopicStatus.PENDING,
          visualPreferences: TopicStatus.PENDING,
        },
        userIntent: "",
        keyInsights: [],
        uncertainties: [],
        followUpQuestions: [],
        completionScore: 0.0,
      },
      userPreferences: {},
    };

    // Process message with functional chat approach
    const chatResponse = await processMessage(
      {
        sessionId,
        message,
        locale,
        context: chatContext,
      },
      { forceMode: appMode }
    );

    return {
      sessionId: request.sessionId,
      nextAction: chatResponse.nextAction === "handoff" ? "ready_for_handoff" : "continue_chat",
      cost: {
        current: chatResponse.cost,
        total: 0.3 + chatResponse.cost,
        remaining: 300 - (0.3 + chatResponse.cost),
      },
      processingTime: chatResponse.processingTime,
      agentResponse: chatResponse.response,
      suggestedFollowUps: chatResponse.suggestedFollowUps,
    };
  } catch (error) {
    console.error(`Chat failed for session ${sessionId}:`, error);

    // Fallback to basic response if AI fails
    const cost = 0.01;
    const agentResponse = PromptBuilder.getLocaleMessages(locale || "en").chatFallback;

    return {
      sessionId: request.sessionId,
      nextAction: "continue_chat",
      cost: {
        current: cost,
        total: 0.31,
        remaining: 299.69,
      },
      processingTime: 1000,
      agentResponse,
      warnings: ["AI chat temporarily unavailable"],
    };
  }
}

/**
 * Handle demo mode chat - scripted, contextual responses
 */
async function handleDemoChat(request: SimpleRequest) {
  const { sessionId, message, locale = "en" } = request;

  console.log(`[DEMO MODE] Processing chat for session: ${sessionId}, message: "${message}"`);

  // Simulate realistic thinking time (1-2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  const cost = 0.05;

  // Demo chat script with pattern matching

  // Find matching response based on user message
  const responses = PromptBuilder.getDemoResponse(locale);
  let selectedResponse = null;

  for (const responseOption of responses) {
    if (message && responseOption.triggers.some((trigger) => trigger.test(message))) {
      selectedResponse = responseOption;
      break;
    }
  }

  // Default response if no pattern matches
  if (!selectedResponse) {
    selectedResponse = {
      response: PromptBuilder.getLocaleMessages(locale || "en").chatFallbackGeneric,
      followUps: PromptBuilder.getLocaleMessages(locale || "en").chatFallbackFollowUps,
    };
  }

  const processingTime = 1500 + Math.random() * 500; // 1.5-2 seconds

  return {
    sessionId: request.sessionId,
    nextAction:
      message && /creative|director|proceed|進む|引き継/i.test(message)
        ? "ready_for_handoff"
        : "continue_chat",
    cost: {
      current: cost,
      total: 0.3 + cost,
      remaining: 300 - (0.3 + cost),
    },
    processingTime: Math.round(processingTime),
    agentResponse: selectedResponse.response,
    suggestedFollowUps: selectedResponse.followUps,
  };
}

/**
 * Handle agent handoff requests
 */
async function handleHandoffRequest(request: SimpleRequest) {
  const { sessionId, locale = "en" } = request;

  try {
    const cost = 0.01;
    const agentResponse = PromptBuilder.getLocaleMessages(locale || "en").handoffMessage;

    return {
      sessionId: request.sessionId,
      nextAction: "ready_for_handoff",
      cost: {
        current: cost,
        total: 0.31,
        remaining: 299.69,
      },
      processingTime: 500,
      agentResponse,
    };
  } catch (error) {
    console.error(`Handoff failed for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Handle GET requests for agent status
 */
export async function GET(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;
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

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      status: "active",
      currentAgent: "product-intelligence",
      progress: {
        step: 1,
        totalSteps: 5,
        description: "Analyzing product",
        percentage: 20,
      },
      cost: {
        current: 0.25,
        total: 0.25,
        remaining: 299.75,
        breakdown: {
          analysis: 0.2,
          chat: 0.05,
        },
        budgetAlert: false,
      },
      lastActivity: new Date().toISOString(),
      health: {
        isActive: true,
        connectionStatus: "connected",
        errorCount: 0,
      },
    },
  });
}
