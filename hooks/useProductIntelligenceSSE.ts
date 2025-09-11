/**
 * React Hook for Product Intelligence Agent SSE Events
 * 
 * Provides real-time communication with the Product Intelligence Agent
 * via Server-Sent Events (SSE) for progress updates, chat messages,
 * and status changes.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Re-export the event interface for frontend use
export interface ProductIntelligenceEvent {
  type: 
    | 'session-created'
    | 'analysis-started'
    | 'analysis-progress'
    | 'analysis-complete'
    | 'analysis-error'
    | 'chat-message'
    | 'chat-typing'
    | 'conversation-updated'
    | 'handoff-ready'
    | 'handoff-progress'
    | 'handoff-complete'
    | 'session-expired'
    | 'cost-update'
    | 'error'
    | 'heartbeat';
  data?: any;
  sessionId: string;
  timestamp: string;
  id: string;
  agentName: 'product-intelligence';
}

export interface UseProductIntelligenceSSEOptions {
  sessionId: string;
  autoConnect?: boolean;
  onEvent?: (event: ProductIntelligenceEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface UseProductIntelligenceSSEReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: Error | null;
  
  // Event data
  lastEvent: ProductIntelligenceEvent | null;
  events: ProductIntelligenceEvent[];
  
  // Analysis state
  analysisProgress: {
    step: string;
    percentage: number;
    message: string;
  } | null;
  
  // Chat state
  isTyping: boolean;
  lastMessage: {
    content: string;
    type: 'agent' | 'system';
    timestamp: string;
  } | null;
  
  // Cost tracking
  costData: {
    current: number;
    total: number;
    remaining: number;
    breakdown: Record<string, number>;
    budgetAlert: boolean;
  } | null;
  
  // Handoff state
  handoffStatus: {
    nextAgent?: string;
    validationStatus?: 'passed' | 'failed';
    ready: boolean;
  } | null;
  
  // Connection methods
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Utility methods
  clearEvents: () => void;
  getEventsByType: (type: string) => ProductIntelligenceEvent[];
}

export function useProductIntelligenceSSE({
  sessionId,
  autoConnect = true,
  onEvent,
  onError,
  onConnect,
  onDisconnect,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5
}: UseProductIntelligenceSSEOptions): UseProductIntelligenceSSEReturn {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  // Event data
  const [lastEvent, setLastEvent] = useState<ProductIntelligenceEvent | null>(null);
  const [events, setEvents] = useState<ProductIntelligenceEvent[]>([]);
  
  // Specific state tracking
  const [analysisProgress, setAnalysisProgress] = useState<{
    step: string;
    percentage: number;
    message: string;
  } | null>(null);
  
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessage, setLastMessage] = useState<{
    content: string;
    type: 'agent' | 'system';
    timestamp: string;
  } | null>(null);
  
  const [costData, setCostData] = useState<{
    current: number;
    total: number;
    remaining: number;
    breakdown: Record<string, number>;
    budgetAlert: boolean;
  } | null>(null);
  
  const [handoffStatus, setHandoffStatus] = useState<{
    nextAgent?: string;
    validationStatus?: 'passed' | 'failed';
    ready: boolean;
  } | null>(null);
  
  // Refs for stable references
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  // Event handler
  const handleEvent = useCallback((event: ProductIntelligenceEvent) => {
    if (!mountedRef.current) return;
    
    setLastEvent(event);
    setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
    
    // Update specific state based on event type
    switch (event.type) {
      case 'analysis-progress':
        if (event.data) {
          setAnalysisProgress({
            step: event.data.step,
            percentage: event.data.percentage,
            message: event.data.message
          });
        }
        break;
        
      case 'analysis-complete':
        setAnalysisProgress(null);
        break;
        
      case 'analysis-error':
        setAnalysisProgress(null);
        break;
        
      case 'chat-typing':
        if (event.data) {
          setIsTyping(event.data.isTyping);
        }
        break;
        
      case 'chat-message':
        setIsTyping(false);
        if (event.data) {
          setLastMessage({
            content: event.data.content,
            type: event.data.type,
            timestamp: event.timestamp
          });
        }
        break;
        
      case 'cost-update':
        if (event.data) {
          setCostData(event.data);
        }
        break;
        
      case 'handoff-ready':
        if (event.data) {
          setHandoffStatus({
            nextAgent: event.data.nextAgent,
            validationStatus: event.data.validationStatus,
            ready: true
          });
        }
        break;
        
      case 'handoff-complete':
        setHandoffStatus(prev => prev ? { ...prev, ready: false } : null);
        break;
        
      case 'error':
        if (event.data && onError) {
          onError(new Error(event.data.message || 'Agent error'));
        }
        break;
    }
    
    // Call user-provided event handler
    if (onEvent) {
      onEvent(event);
    }
  }, [onEvent, onError]);

  // Connect function
  const connect = useCallback(() => {
    if (!mountedRef.current || eventSourceRef.current) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const eventSource = new EventSource(
        `/api/agents/product-intelligence/events?sessionId=${encodeURIComponent(sessionId)}`
      );
      
      eventSourceRef.current = eventSource;
      
      // Handle all event types
      const eventTypes = [
        'session-created', 'analysis-started', 'analysis-progress', 'analysis-complete', 
        'analysis-error', 'chat-message', 'chat-typing', 'conversation-updated',
        'handoff-ready', 'handoff-progress', 'handoff-complete', 'session-expired',
        'cost-update', 'error', 'heartbeat'
      ];
      
      eventTypes.forEach(eventType => {
        eventSource.addEventListener(eventType, (e) => {
          try {
            const event: ProductIntelligenceEvent = JSON.parse(e.data);
            handleEvent(event);
          } catch (error) {
            console.error('Failed to parse SSE event:', error);
          }
        });
      });
      
      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        if (onConnect) {
          onConnect();
        }
      };
      
      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        setIsConnecting(false);
        
        const errorObj = new Error('SSE connection error');
        setConnectionError(errorObj);
        
        if (onError) {
          onError(errorObj);
        }
        
        // Auto-reconnect logic
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              disconnect();
              connect();
            }
          }, reconnectDelay);
        }
      };
      
    } catch (error) {
      if (!mountedRef.current) return;
      setIsConnecting(false);
      const errorObj = error instanceof Error ? error : new Error('Failed to create SSE connection');
      setConnectionError(errorObj);
      
      if (onError) {
        onError(errorObj);
      }
    }
  }, [sessionId, handleEvent, onConnect, onError, maxReconnectAttempts, reconnectDelay]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (mountedRef.current) {
      setIsConnected(false);
      setIsConnecting(false);
      
      if (onDisconnect) {
        onDisconnect();
      }
    }
  }, [onDisconnect]);

  // Reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 100);
  }, [disconnect, connect]);

  // Utility functions
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  const getEventsByType = useCallback((type: string) => {
    return events.filter(event => event.type === type);
  }, [events]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && sessionId) {
      connect();
    }
    
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [sessionId, autoConnect, connect, disconnect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    
    // Event data
    lastEvent,
    events,
    
    // Analysis state
    analysisProgress,
    
    // Chat state
    isTyping,
    lastMessage,
    
    // Cost tracking
    costData,
    
    // Handoff state
    handoffStatus,
    
    // Connection methods
    connect,
    disconnect,
    reconnect,
    
    // Utility methods
    clearEvents,
    getEventsByType
  };
}