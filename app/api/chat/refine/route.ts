import { NextRequest, NextResponse } from 'next/server';
import { 
  ChatRefinementRequestSchema,
  createApiResponseSchema,
  ValidationUtils
} from '@/lib/utils/validation';
import type { ChatRefinementResponse } from '@/lib/utils/validation';
import { PromptRefiner } from '@/lib/agents/product-intelligence/tools/prompt-refiner';
import { FirestoreService } from '@/lib/services/firestore';
import { CostTracker } from '@/lib/utils/cost-tracker';

const ChatRefinementResponseApiSchema = createApiResponseSchema(
  ChatRefinementRequestSchema.omit({ sessionId: true, message: true }).extend({
    response: ChatRefinementRequestSchema.shape.message,
    suggestions: ChatRefinementRequestSchema.shape.message.array(),
    refinedPrompt: ChatRefinementRequestSchema.shape.message.optional(),
  })
);

/**
 * POST /api/chat/refine
 * 
 * Processes chat messages to provide prompt refinement suggestions
 * using Gemini API for intelligent conversation and improvement recommendations
 * 
 * @param request - Chat refinement request with session ID and user message
 * @returns AI response, suggestions, and refined prompt if applicable
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = ChatRefinementRequestSchema.parse(body);

    // Sanitize user message
    const sanitizedMessage = ValidationUtils.sanitizeInput(validatedRequest.message);
    
    if (sanitizedMessage.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'EMPTY_MESSAGE',
          message: 'Message cannot be empty after sanitization.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!ValidationUtils.validateRateLimit(clientIP, validatedRequest.sessionId)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please slow down.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 429 });
    }

    // Initialize services
    const promptRefiner = PromptRefiner.getInstance();
    const firestoreService = FirestoreService.getInstance();
    const costTracker = CostTracker.getInstance();

    // Check budget for AI operations
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

    // Get session information (with mock mode fallback)
    let session = await firestoreService.getSession(validatedRequest.sessionId);
    if (!session) {
      // In mock mode, create a temporary session for testing
      if (firestoreService.isMock()) {
        console.log(`[MOCK MODE] Creating temporary session for chat: ${validatedRequest.sessionId}`);
        session = {
          id: validatedRequest.sessionId,
          prompt: validatedRequest.currentPrompt || 'A beautiful sunset over a calm lake',
          chatHistory: [],
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        };
      } else {
        return NextResponse.json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found or has expired.',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 404 });
      }
    }

    // Build chat context from session history and current request
    const chatContext = {
      messages: [
        ...session.chatHistory,
        {
          role: 'user' as const,
          content: sanitizedMessage,
        }
      ],
      sessionId: validatedRequest.sessionId,
    };

    // Get AI response and refinement suggestions
    const refinementResponse = await promptRefiner.chatAboutPrompt(
      sanitizedMessage,
      chatContext
    );

    // Record cost for AI API usage
    await costTracker.recordCost(
      'gemini',
      0.05, // Estimated cost for chat operation
      'Chat refinement',
      validatedRequest.sessionId
    );

    // Add both user message and AI response to chat history
    await firestoreService.addChatMessage(validatedRequest.sessionId, {
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date(),
    });
    
    await firestoreService.addChatMessage(validatedRequest.sessionId, {
      role: 'assistant',
      content: refinementResponse,
      timestamp: new Date(),
    });

    // Update session timestamp
    await firestoreService.updateSession(validatedRequest.sessionId, {
      updatedAt: new Date(),
    });

    // Prepare response
    const response: ChatRefinementResponse = {
      response: refinementResponse,
      suggestions: promptRefiner.getPromptTips().slice(0, 3), // Get first 3 tips
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Chat refinement failed:', error);

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

      if (error.message.includes('Gemini') || error.message.includes('API')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'AI_API_ERROR',
            message: 'AI service temporarily unavailable. Please try again.',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 502 });
      }

      if (error.message.includes('session') || error.message.includes('Firestore')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'SESSION_ERROR',
            message: 'Session data error. Please start a new session.',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 400 });
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
 * GET /api/chat/refine
 * 
 * Health check endpoint for chat refinement service
 * 
 * @returns Service health status and configuration
 */
export async function GET() {
  try {
    const promptRefiner = PromptRefiner.getInstance();
    const costTracker = CostTracker.getInstance();

    // Check service health
    const budgetStatus = await costTracker.getBudgetStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        status: budgetStatus.canProceed ? 'healthy' : 'degraded',
        timestamp: new Date(),
        services: {
          gemini: { status: 'healthy', lastCheck: new Date() },
          budget: { 
            status: budgetStatus.canProceed ? 'healthy' : 'unhealthy',
            lastCheck: new Date(),
            details: budgetStatus,
          },
          firestore: { status: 'healthy', lastCheck: new Date() },
        },
        configuration: {
          maxMessageLength: 1000,
          maxChatHistory: 20,
          estimatedCostPerMessage: 0.05,
          supportedLanguages: ['en', 'ja'],
        },
        capabilities: [
          'Prompt refinement and improvement',
          'Interactive chat conversations',
          'Multi-language support',
          'Context-aware suggestions',
          'Style and tone adjustments',
        ],
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