/**
 * Product Intelligence Agent - Real-time Events (SSE)
 * 
 * Server-Sent Events endpoint for real-time communication with the Product Intelligence Agent.
 * Provides live updates on analysis progress, chat responses, and agent status changes.
 */

import { NextRequest } from 'next/server';

// Product Intelligence specific event types
export interface ProductIntelligenceEvent {
  type: 
    | 'session-created'           // New session started
    | 'analysis-started'          // Image/text analysis began
    | 'analysis-progress'         // Analysis progress update
    | 'analysis-complete'         // Analysis finished with results
    | 'analysis-error'           // Analysis failed
    | 'chat-message'             // New chat message from agent
    | 'chat-typing'              // Agent is typing indicator
    | 'conversation-updated'     // Conversation context changed
    | 'handoff-ready'            // Ready to transfer to next agent
    | 'handoff-progress'         // Handoff in progress
    | 'handoff-complete'         // Successfully handed off
    | 'session-expired'          // Session expired or closed
    | 'cost-update'              // Cost tracking update
    | 'error'                    // General error
    | 'heartbeat';               // Keep-alive ping
  data?: any;
  sessionId: string;
  timestamp: string;
  id: string;
  agentName: 'product-intelligence';
}

// Session-based connection tracking
const sessionConnections = new Map<string, Set<ReadableStreamDefaultController>>();
const globalConnections = new Set<ReadableStreamDefaultController>();

// Generate unique event ID
function generateEventId(): string {
  return `pi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Broadcast to specific session
export function broadcastToSession(sessionId: string, event: ProductIntelligenceEvent) {
  const sessionControllers = sessionConnections.get(sessionId);
  if (!sessionControllers) return;

  const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\nid: ${event.id}\n\n`;
  const deadConnections: ReadableStreamDefaultController[] = [];
  
  sessionControllers.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(sseMessage));
    } catch (error) {
      console.error('Error sending SSE message to session:', error);
      deadConnections.push(controller);
    }
  });
  
  // Clean up dead connections
  deadConnections.forEach(controller => {
    sessionControllers.delete(controller);
    globalConnections.delete(controller);
    try {
      controller.close();
    } catch (error) {
      // Ignore close errors
    }
  });

  // Remove empty session sets
  if (sessionControllers.size === 0) {
    sessionConnections.delete(sessionId);
  }
}

// Broadcast to all Product Intelligence connections
export function broadcastToAll(event: ProductIntelligenceEvent) {
  const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\nid: ${event.id}\n\n`;
  const deadConnections: ReadableStreamDefaultController[] = [];
  
  globalConnections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(sseMessage));
    } catch (error) {
      console.error('Error sending SSE broadcast:', error);
      deadConnections.push(controller);
    }
  });
  
  // Clean up dead connections
  deadConnections.forEach(controller => {
    globalConnections.delete(controller);
    
    // Remove from session connections too
    sessionConnections.forEach((controllers, sessionId) => {
      if (controllers.has(controller)) {
        controllers.delete(controller);
        if (controllers.size === 0) {
          sessionConnections.delete(sessionId);
        }
      }
    });
    
    try {
      controller.close();
    } catch (error) {
      // Ignore close errors
    }
  });
}

// Helper functions for common events
export function sendAnalysisProgress(sessionId: string, progress: {
  step: string;
  percentage: number;
  message: string;
  processingTime?: number;
}) {
  broadcastToSession(sessionId, {
    type: 'analysis-progress',
    data: progress,
    sessionId,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
    agentName: 'product-intelligence'
  });
}

export function sendAnalysisComplete(sessionId: string, results: {
  analysis: any;
  processingTime: number;
  cost: number;
  nextAction: string;
}) {
  broadcastToSession(sessionId, {
    type: 'analysis-complete',
    data: results,
    sessionId,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
    agentName: 'product-intelligence'
  });
}

export function sendChatMessage(sessionId: string, message: {
  content: string;
  type: 'agent' | 'system';
  processingTime?: number;
  cost?: number;
}) {
  broadcastToSession(sessionId, {
    type: 'chat-message',
    data: message,
    sessionId,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
    agentName: 'product-intelligence'
  });
}

export function sendTypingIndicator(sessionId: string, isTyping: boolean) {
  broadcastToSession(sessionId, {
    type: 'chat-typing',
    data: { isTyping, agentName: 'product-intelligence' },
    sessionId,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
    agentName: 'product-intelligence'
  });
}

export function sendHandoffReady(sessionId: string, handoffData: {
  nextAgent: string;
  serializedContext: string;
  validationStatus: 'passed' | 'failed';
  validationErrors?: string[];
}) {
  broadcastToSession(sessionId, {
    type: 'handoff-ready',
    data: handoffData,
    sessionId,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
    agentName: 'product-intelligence'
  });
}

export function sendCostUpdate(sessionId: string, costData: {
  current: number;
  total: number;
  remaining: number;
  breakdown: Record<string, number>;
  budgetAlert: boolean;
}) {
  broadcastToSession(sessionId, {
    type: 'cost-update',
    data: costData,
    sessionId,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
    agentName: 'product-intelligence'
  });
}

export function sendError(sessionId: string, error: {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryAfter?: number;
}) {
  broadcastToSession(sessionId, {
    type: 'error',
    data: error,
    sessionId,
    timestamp: new Date().toISOString(),
    id: generateEventId(),
    agentName: 'product-intelligence'
  });
}

// SSE endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 });
  }

  try {
    const stream = new ReadableStream({
      start(controller) {
        // Add to global connections
        globalConnections.add(controller);
        
        // Add to session-specific connections
        if (!sessionConnections.has(sessionId)) {
          sessionConnections.set(sessionId, new Set());
        }
        sessionConnections.get(sessionId)!.add(controller);
        
        console.log(`Product Intelligence SSE connected for session: ${sessionId}`);
        console.log(`Total PI connections: ${globalConnections.size}`);

        // Send initial connection event
        const welcomeEvent: ProductIntelligenceEvent = {
          type: 'session-created',
          data: { 
            message: 'Product Intelligence Agent connected',
            sessionId,
            connectionId: generateEventId(),
            capabilities: [
              'image-analysis',
              'text-analysis', 
              'chat-conversation',
              'handoff-coordination',
              'cost-tracking'
            ]
          },
          sessionId,
          timestamp: new Date().toISOString(),
          id: generateEventId(),
          agentName: 'product-intelligence'
        };

        const sseMessage = `event: ${welcomeEvent.type}\ndata: ${JSON.stringify(welcomeEvent)}\nid: ${welcomeEvent.id}\n\n`;
        controller.enqueue(new TextEncoder().encode(sseMessage));

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat: ProductIntelligenceEvent = {
              type: 'heartbeat',
              data: { timestamp: new Date().toISOString() },
              sessionId,
              timestamp: new Date().toISOString(),
              id: generateEventId(),
              agentName: 'product-intelligence'
            };
            const heartbeatMessage = `event: heartbeat\ndata: ${JSON.stringify(heartbeat)}\n\n`;
            controller.enqueue(new TextEncoder().encode(heartbeatMessage));
          } catch (error) {
            clearInterval(heartbeatInterval);
            cleanup();
          }
        }, 30000);

        // Cleanup function
        const cleanup = () => {
          clearInterval(heartbeatInterval);
          globalConnections.delete(controller);
          
          const sessionControllers = sessionConnections.get(sessionId);
          if (sessionControllers) {
            sessionControllers.delete(controller);
            if (sessionControllers.size === 0) {
              sessionConnections.delete(sessionId);
            }
          }
          
          console.log(`Product Intelligence SSE disconnected for session: ${sessionId}`);
          console.log(`Remaining PI connections: ${globalConnections.size}`);
          
          try {
            controller.close();
          } catch (error) {
            // Ignore close errors
          }
        };

        // Handle connection cleanup
        request.signal.addEventListener('abort', cleanup);
      },
      
      cancel() {
        console.log(`Product Intelligence SSE stream cancelled for session: ${sessionId}`);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'X-Agent-Type': 'product-intelligence',
        'X-Session-ID': sessionId,
      },
    });
  } catch (error) {
    console.error('Error establishing Product Intelligence SSE connection:', error);
    return new Response('Failed to establish SSE connection', { status: 500 });
  }
}

// Cleanup endpoint for testing
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (sessionId) {
    // Clean up specific session
    const sessionControllers = sessionConnections.get(sessionId);
    if (sessionControllers) {
      sessionControllers.forEach(controller => {
        globalConnections.delete(controller);
        try {
          controller.close();
        } catch (error) {
          // Ignore close errors
        }
      });
      sessionConnections.delete(sessionId);
    }
    
    console.log(`Cleaned up Product Intelligence SSE connections for session: ${sessionId}`);
    return new Response(`Session ${sessionId} connections cleaned up`, { status: 200 });
  } else {
    // Clean up all connections
    globalConnections.forEach(controller => {
      try {
        controller.close();
      } catch (error) {
        // Ignore close errors
      }
    });
    
    globalConnections.clear();
    sessionConnections.clear();
    
    console.log('Cleaned up all Product Intelligence SSE connections');
    return new Response('All Product Intelligence SSE connections cleaned up', { status: 200 });
  }
}