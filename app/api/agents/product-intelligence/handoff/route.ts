/**
 * Product Intelligence Agent - Handoff API
 * 
 * Handles the handoff process from Product Intelligence Agent to Creative Director Agent,
 * including data validation, serialization, and pipeline coordination.
 */

import { AgentType, ApiErrorCode } from '@/lib/agents/product-intelligence/enums';
import { ApiResponse, HandoffResponse } from '@/lib/agents/product-intelligence/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


// Request validation schema
const HandoffRequestSchema = z.object({
  sessionId: z.string().uuid(),
  targetAgent: z.nativeEnum(AgentType),
  validateData: z.boolean().default(true),
  includeMetadata: z.boolean().default(true)
});

/**
 * Handle POST requests for agent handoff
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<HandoffResponse>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = HandoffRequestSchema.parse(body);

    // TODO: Validate session exists and is ready for handoff
    const session = await getSessionForHandoff(validatedRequest.sessionId);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: {
          code: ApiErrorCode.SESSION_NOT_FOUND,
          message: 'Session not found',
          userMessage: 'Session not found or not ready for handoff.'
        },
        timestamp,
        requestId
      }, { status: 404 });
    }

    // Validate session is ready for handoff
    if (!session.handoff.readyForNext) {
      return NextResponse.json({
        success: false,
        error: {
          code: ApiErrorCode.SESSION_INVALID_STATE,
          message: 'Session not ready for handoff',
          userMessage: 'Please complete the analysis and conversation before proceeding.'
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    // Validate target agent
    if (validatedRequest.targetAgent !== AgentType.CREATIVE_DIRECTOR) {
      return NextResponse.json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Invalid target agent for Product Intelligence handoff',
          userMessage: 'Product Intelligence Agent can only hand off to Creative Director Agent.'
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    // Perform handoff process
    const handoffResult = await performHandoff({
      sessionId: validatedRequest.sessionId,
      targetAgent: validatedRequest.targetAgent,
      validateData: validatedRequest.validateData,
      includeMetadata: validatedRequest.includeMetadata,
      session
    });

    const processingTime = Date.now() - startTime;

    // Update session with handoff completion
    await updateSessionHandoffStatus(validatedRequest.sessionId, {
      status: 'completed',
      targetAgent: validatedRequest.targetAgent,
      handoffTimestamp: timestamp,
      processingTime
    });

    const response: HandoffResponse = {
      success: true,
      targetAgent: validatedRequest.targetAgent,
      handoffTimestamp: timestamp,
      serializedData: handoffResult.serializedData,
      validationResults: handoffResult.validationResults,
      estimatedProcessingTime: handoffResult.estimatedProcessingTime
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp,
      requestId
    });

  } catch (error) {
    console.error('Handoff API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Request validation failed',
          userMessage: 'Invalid handoff request',
          details: error.issues
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: ApiErrorCode.HANDOFF_FAILED,
        message: error instanceof Error ? error.message : 'Handoff failed',
        userMessage: 'Failed to hand off to next agent. Please try again.'
      },
      timestamp,
      requestId
    }, { status: 500 });
  }
}

/**
 * Get session data for handoff validation
 */
async function getSessionForHandoff(sessionId: string): Promise<any> {
  // TODO: Retrieve complete session state from Firestore
  // This should include analysis results, conversation history, and all metadata
  
  return {
    sessionId,
    status: 'ready_for_handoff',
    currentAgent: 'product-intelligence',
    product: {
      analysis: {
        // Complete product analysis data
        confidence: 0.88,
        completedTopics: ['productFeatures', 'targetAudience', 'brandPositioning']
      }
    },
    conversation: {
      messages: [],
      completedTopics: ['productFeatures', 'targetAudience', 'brandPositioning'],
      keyInsights: ['premium positioning', 'professional target audience', 'quality focused']
    },
    handoff: {
      readyForNext: true,
      nextAgent: 'creative-director',
      validationErrors: [],
      dataIntegrity: true
    }
  };
}

/**
 * Perform the actual handoff process
 */
async function performHandoff(params: {
  sessionId: string;
  targetAgent: AgentType;
  validateData: boolean;
  includeMetadata: boolean;
  session: any;
}): Promise<{
  serializedData: string;
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  estimatedProcessingTime: number;
}> {
  
  // Extract handoff data from session
  const handoffData = extractHandoffData(params.session, params.includeMetadata);
  
  // Validate data if requested
  const validationResults = params.validateData 
    ? await validateHandoffData(handoffData, params.targetAgent)
    : { isValid: true, errors: [], warnings: [] };

  if (!validationResults.isValid) {
    throw new Error(`Handoff validation failed: ${validationResults.errors.join(', ')}`);
  }

  // Serialize data for next agent
  const serializedData = JSON.stringify(handoffData, null, 2);

  // TODO: Notify Creative Director Agent of incoming handoff
  await notifyNextAgent(params.targetAgent, params.sessionId, handoffData);

  // Estimate processing time for next agent
  const estimatedProcessingTime = estimateNextAgentProcessingTime(handoffData, params.targetAgent);

  return {
    serializedData,
    validationResults,
    estimatedProcessingTime
  };
}

/**
 * Extract relevant data for handoff
 */
function extractHandoffData(session: any, includeMetadata: boolean): any {
  const baseData = {
    sessionId: session.sessionId,
    productAnalysis: session.product.analysis,
    conversationSummary: {
      keyInsights: session.conversation.keyInsights,
      completedTopics: session.conversation.completedTopics,
      userPreferences: session.user.preferences
    },
    targetAudience: session.product.analysis.targetAudience,
    positioning: session.product.analysis.positioning,
    visualPreferences: session.product.analysis.visualPreferences,
    commercialStrategy: session.product.analysis.commercialStrategy
  };

  if (includeMetadata) {
    return {
      ...baseData,
      metadata: {
        handoffTimestamp: new Date().toISOString(),
        sourceAgent: 'product-intelligence',
        confidence: session.product.analysis.metadata.confidenceScore,
        processingCost: session.costs.total,
        locale: session.user.locale
      }
    };
  }

  return baseData;
}

/**
 * Validate handoff data for target agent
 */
async function validateHandoffData(data: any, targetAgent: AgentType): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields for Creative Director
  if (targetAgent === AgentType.CREATIVE_DIRECTOR) {
    if (!data.productAnalysis) {
      errors.push('Product analysis is required for Creative Director');
    }
    
    if (!data.targetAudience || !data.targetAudience.primary) {
      errors.push('Primary target audience is required');
    }

    if (!data.visualPreferences) {
      warnings.push('Visual preferences not defined, Creative Director will use defaults');
    }

    if (!data.positioning) {
      errors.push('Brand positioning is required');
    }

    // Validate confidence threshold
    if (data.metadata && data.metadata.confidence < 0.7) {
      warnings.push('Low confidence score may affect Creative Director output quality');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Notify next agent of incoming handoff
 */
async function notifyNextAgent(targetAgent: AgentType, sessionId: string, data: any): Promise<void> {
  // TODO: Send notification to Creative Director Agent
  // This could be through a message queue, webhook, or direct API call
  console.log(`Notifying ${targetAgent} of handoff for session ${sessionId}`);
}

/**
 * Estimate processing time for next agent
 */
function estimateNextAgentProcessingTime(data: any, targetAgent: AgentType): number {
  // TODO: Implement intelligent estimation based on data complexity
  // For now, return static estimates
  
  const estimates = {
    [AgentType.CREATIVE_DIRECTOR]: 300000, // 5 minutes
    [AgentType.VIDEO_PRODUCER]: 600000,    // 10 minutes
    [AgentType.PRODUCT_INTELLIGENCE]: 180000 // 3 minutes
  };

  return estimates[targetAgent] || 300000;
}

/**
 * Update session handoff status
 */
async function updateSessionHandoffStatus(sessionId: string, handoffInfo: {
  status: string;
  targetAgent: AgentType;
  handoffTimestamp: string;
  processingTime: number;
}): Promise<void> {
  // TODO: Update Firestore session with handoff completion
  console.log(`Updating session ${sessionId} handoff status:`, handoffInfo);
}