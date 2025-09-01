/**
 * Product Intelligence Agent - Main API Route (Simplified)
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple request interface for now
interface SimpleRequest {
  sessionId: string;
  action: 'analyze' | 'chat' | 'handoff';
  message?: string;
  locale?: 'en' | 'ja';
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
    console.log('Received request:', body);

    // Basic validation
    if (!body.sessionId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required',
          userMessage: 'Session ID is required'
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    if (!body.action) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Action is required',
          userMessage: 'Action is required'
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    // Route to appropriate handler
    let response;
    
    switch (body.action) {
      case 'analyze':
        response = await handleAnalyzeRequest(body);
        break;
      case 'chat':
        response = await handleChatRequest(body);
        break;
      case 'handoff':
        response = await handleHandoffRequest(body);
        break;
      default:
        throw new Error('Invalid action type');
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp,
      requestId
    });

  } catch (error) {
    console.error('Product Intelligence Agent API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'An internal error occurred. Please try again.'
      },
      timestamp,
      requestId
    }, { status: 500 });
  }
}

/**
 * Handle image analysis requests
 */
async function handleAnalyzeRequest(request: SimpleRequest) {
  const { sessionId, locale = 'en' } = request;
  
  try {
    // Determine if this is image or text analysis
    const inputType = request.metadata?.inputType || 'image';
    const description = request.message || '';
    
    console.log(`Processing ${inputType} analysis for session: ${sessionId}`);
    
    // Simulate analysis progress with delays
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s processing
    
    const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
    let agentResponse: string;
    let cost: number;
    
    if (inputType === 'text') {
      cost = 0.15;
      agentResponse = locale === 'ja' 
        ? `商品の説明を分析しました：「${description.substring(0, 50)}${description.length > 50 ? '...' : ''}」\n\nターゲット層、ポジショニング、マーケティング戦略について何でもお聞きください！`
        : `I've analyzed your product description: "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}"\n\nAsk me anything about target audience, positioning, or marketing strategy!`;
    } else {
      cost = 0.25;
      agentResponse = locale === 'ja' 
        ? '商品画像の分析が完了しました。商品の特徴、ターゲット層、マーケティング戦略について詳しく相談できます！'
        : 'Image analysis complete! I can help you explore product features, target audience, and marketing strategies.';
    }
    
    return {
      sessionId: request.sessionId,
      nextAction: 'continue_chat',
      cost: {
        current: cost,
        total: cost,
        remaining: 300 - cost
      },
      processingTime: Math.round(processingTime),
      agentResponse
    };
    
  } catch (error) {
    console.error(`Analysis failed for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Handle chat conversation requests
 */
async function handleChatRequest(request: SimpleRequest) {
  const { sessionId, message, locale = 'en' } = request;
  
  if (!message) {
    throw new Error('Message is required for chat requests');
  }

  try {
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
    
    const cost = 0.05;
    const agentResponse = locale === 'ja' 
      ? 'ご質問ありがとうございます。詳しく教えていただけますか？'
      : 'Thank you for your question. Could you tell me more about that?';
    
    return {
      sessionId: request.sessionId,
      nextAction: 'continue_chat',
      cost: {
        current: cost,
        total: 0.30,
        remaining: 299.70
      },
      processingTime: Math.round(Math.random() * 1000 + 500),
      agentResponse
    };
    
  } catch (error) {
    console.error(`Chat failed for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Handle agent handoff requests
 */
async function handleHandoffRequest(request: SimpleRequest) {
  const { sessionId, locale = 'en' } = request;
  
  try {
    const cost = 0.01;
    const agentResponse = locale === 'ja' 
      ? '分析が完了しました。Creative Directorエージェントに引き継ぎます。'
      : 'Analysis complete. Handing off to Creative Director Agent.';
    
    return {
      sessionId: request.sessionId,
      nextAction: 'ready_for_handoff',
      cost: {
        current: cost,
        total: 0.31,
        remaining: 299.69
      },
      processingTime: 500,
      agentResponse
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
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required',
        userMessage: 'Session ID is required'
      },
      timestamp,
      requestId
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      status: 'active',
      currentAgent: 'product-intelligence',
      progress: {
        step: 1,
        totalSteps: 5,
        description: 'Analyzing product',
        percentage: 20
      },
      cost: {
        current: 0.25,
        total: 0.25,
        remaining: 299.75,
        breakdown: {
          analysis: 0.20,
          chat: 0.05
        },
        budgetAlert: false
      },
      lastActivity: new Date().toISOString(),
      health: {
        isActive: true,
        connectionStatus: 'connected',
        errorCount: 0
      }
    }
  });
}