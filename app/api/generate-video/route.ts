import { NextRequest, NextResponse } from 'next/server';

import { 
  VideoGenerationRequestSchema,
  createApiResponseSchema,
  ValidationUtils
} from '@/lib/utils/validation';
import type { VideoGenerationResponse } from '@/lib/utils/validation';
import { FirestoreService } from '@/lib/services/firestore';
import { VeoService } from '@/lib/services/veo';
import { CostTracker } from '@/lib/utils/cost-tracker';
import { JobTracker } from '@/lib/utils/job-tracker';
import RateLimiterService from '@/lib/monitor/rate-limiter';

const VideoGenerationResponseSchema = createApiResponseSchema(
  VideoGenerationRequestSchema.omit({ prompt: true }).extend({
    jobId: VideoGenerationRequestSchema.shape.prompt,
    sessionId: VideoGenerationRequestSchema.shape.prompt,
    status: VideoGenerationRequestSchema.shape.prompt,
    estimatedCompletionTime: VideoGenerationRequestSchema.shape.duration.optional(),
    estimatedCost: VideoGenerationRequestSchema.shape.duration,
    message: VideoGenerationRequestSchema.shape.prompt.optional(),
  })
);

/**
 * POST /api/generate-video
 * 
 * Initiates video generation from a text prompt using Google Veo API
 * 
 * @param request - Video generation request with prompt, duration, aspect ratio
 * @returns Job ID and session information for tracking progress
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = VideoGenerationRequestSchema.parse(body);

    // Light sanitization only - let Veo API handle content validation
    const sanitizedPrompt = ValidationUtils.sanitizeInput(validatedRequest.prompt);

    // Enhanced rate limiting with proper implementation
    const rateLimiter = RateLimiterService.getInstance();
    const clientId = rateLimiter.getClientIdentifier(request);
    const rateLimitResult = rateLimiter.checkRateLimit(clientId, 'video-generation');
    
    if (!rateLimitResult.allowed) {
      const response = rateLimiter.createRateLimitResponse(rateLimitResult);
      return NextResponse.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Initialize services
    const veoService = VeoService.getInstance();
    const firestoreService = FirestoreService.getInstance();
    const costTracker = CostTracker.getInstance();
    const jobTracker = JobTracker.getInstance();

    // Check budget before proceeding
    const budgetStatus = await costTracker.getBudgetStatus();
    if (!budgetStatus.canProceed) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'BUDGET_EXCEEDED',
          message: 'Budget limit exceeded. Cannot process new requests.',
          details: { budgetStatus },
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 402 });
    }

    // Estimate cost for this generation
    const estimatedCost = veoService.estimateCost({
      prompt: sanitizedPrompt,
      duration: validatedRequest.duration,
      aspectRatio: validatedRequest.aspectRatio,
      style: validatedRequest.style,
    });

    // Check if estimated cost exceeds remaining budget
    if (estimatedCost > budgetStatus.remainingBudget) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BUDGET',
          message: 'Insufficient budget for this request.',
          details: { 
            estimatedCost, 
            remainingBudget: budgetStatus.remainingBudget 
          },
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 402 });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    
    // Create session in Firestore with specified session ID
    const session = await firestoreService.createSession(sanitizedPrompt, undefined, sessionId);

    // Initiate video generation
    const videoRequest = {
      prompt: sanitizedPrompt,
      duration: validatedRequest.duration,
      aspectRatio: validatedRequest.aspectRatio,
      style: validatedRequest.style,
    };

    const veoResponse = await veoService.generateVideo(videoRequest);

    // Create a simple job ID for Firestore (compatible with document paths)
    const simpleJobId = `job-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    // Create video job record in Firestore using simple job ID
    const videoJob = await firestoreService.createVideoJob(
      session.id,
      sanitizedPrompt,
      estimatedCost,
      simpleJobId,
      veoResponse.jobId // Store the real operation ID as metadata
    );

    // Start job tracking
    await jobTracker.createJob(
      session.id,
      sanitizedPrompt,
      veoResponse.jobId,
      estimatedCost
    );

    // Record cost estimation
    await costTracker.recordCost(
      'veo',
      estimatedCost,
      `Video generation - Job ${veoResponse.jobId}`,
      session.id,
      veoResponse.jobId
    );

    // Update session with the simple job ID that the UI will use for tracking
    await firestoreService.updateSession(session.id, {
      videoJobId: simpleJobId,
      status: 'generating',
      updatedAt: new Date(),
    });

    // Prepare response
    const response: VideoGenerationResponse = {
      jobId: simpleJobId, // Return the simple job ID for UI tracking
      sessionId: sessionId,
      status: veoResponse.status,
      estimatedCompletionTime: veoResponse.estimatedCompletionTime,
      estimatedCost: estimatedCost,
      message: 'Video generation started successfully. Use the jobId to track progress.',
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date(),
    }, { status: 202 }); // 202 Accepted

  } catch (error) {
    console.error('Video generation failed:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 400 });
      }

      if (error.message.includes('budget') || error.message.includes('cost')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'BUDGET_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 402 });
      }

      if (error.message.includes('Veo API')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VEO_API_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 502 });
      }
    }

    // Generic server error
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing your request.',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}

/**
 * GET /api/generate-video
 * 
 * Health check endpoint for video generation service
 * 
 * @returns Service health status and configuration
 */
export async function GET() {
  try {
    const veoService = VeoService.getInstance();
    const costTracker = CostTracker.getInstance();

    // Check service health
    const budgetStatus = await costTracker.getBudgetStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        status: budgetStatus.canProceed ? 'healthy' : 'degraded',
        timestamp: new Date(),
        services: {
          veo: { status: 'healthy', lastCheck: new Date() },
          budget: { 
            status: budgetStatus.canProceed ? 'healthy' : 'unhealthy',
            lastCheck: new Date(),
            details: budgetStatus,
          },
        },
        configuration: {
          maxDuration: 15,
          supportedAspectRatios: ['16:9', '9:16', '1:1'],
          maxPromptLength: 4000,
          estimatedCostPer15s: 1.50,
        },
        version: '1.0.0',
      },
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Service health check failed',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}