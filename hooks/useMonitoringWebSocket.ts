'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MonitoringDashboardData, ConnectionStatus } from '@/types/monitoring';
import { MonitoringEvent } from '@/app/api/ws/monitoring/route';

interface UseMonitoringWebSocketOptions {
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onHealthChange?: (data: any) => void;
  onBudgetUpdate?: (data: any) => void;
  onNewAlert?: (data: any) => void;
  onMetricsUpdate?: (data: any) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

interface UseMonitoringWebSocketReturn {
  connectionStatus: ConnectionStatus;
  data: MonitoringDashboardData | null;
  lastEvent: MonitoringEvent | null;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

export function useMonitoringWebSocket(options: UseMonitoringWebSocketOptions = {}): UseMonitoringWebSocketReturn {
  const {
    enabled = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onHealthChange,
    onBudgetUpdate,
    onNewAlert,
    onMetricsUpdate,
    onConnectionStatusChange,
  } = options;

  // State management
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    latency: 0,
    lastUpdate: null,
  });

  const [data, setData] = useState<MonitoringDashboardData | null>(null);
  const [lastEvent, setLastEvent] = useState<MonitoringEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing connection lifecycle
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingStartTimeRef = useRef<number>(0);
  const isConnectingRef = useRef(false);
  
  // Use refs for callback props to prevent dependency issues
  const onConnectionStatusChangeRef = useRef(onConnectionStatusChange);
  const onHealthChangeRef = useRef(onHealthChange);
  const onBudgetUpdateRef = useRef(onBudgetUpdate);
  const onNewAlertRef = useRef(onNewAlert);
  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  
  // Update refs when props change
  onConnectionStatusChangeRef.current = onConnectionStatusChange;
  onHealthChangeRef.current = onHealthChange;
  onBudgetUpdateRef.current = onBudgetUpdate;
  onNewAlertRef.current = onNewAlert;
  onMetricsUpdateRef.current = onMetricsUpdate;

  // Calculate connection latency
  const updateLatency = useCallback(() => {
    if (pingStartTimeRef.current > 0) {
      const latency = Date.now() - pingStartTimeRef.current;
      setConnectionStatus(prev => ({ ...prev, latency }));
    }
  }, []);

  // Update connection status and notify callback
  const updateConnectionStatus = useCallback((status: ConnectionStatus['status'], latency?: number) => {
    setConnectionStatus(prev => {
      const newStatus: ConnectionStatus = {
        status,
        latency: latency ?? prev.latency,
        lastUpdate: new Date(),
      };
      
      // Call the callback with the new status using ref
      onConnectionStatusChangeRef.current?.(newStatus);
      return newStatus;
    });
  }, []); // No dependencies needed since we use refs

  // Handle incoming Server-Sent Events
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const eventData: MonitoringEvent = JSON.parse(event.data);
      setLastEvent(eventData);
      setError(null);
      
      // Update last update timestamp
      updateConnectionStatus('connected');

      switch (eventData.type) {
        case 'connection-status':
          if (eventData.data?.status === 'connected') {
            updateConnectionStatus('connected');
            reconnectAttemptsRef.current = 0;
          } else if (eventData.data?.status === 'error') {
            setError(eventData.data.message || 'Connection error');
            updateConnectionStatus('disconnected');
          }
          break;

        case 'health-change':
          console.log('Health status changed:', eventData.data);
          if (eventData.data?.systemHealth) {
            setData(prevData => prevData ? {
              ...prevData,
              systemHealth: eventData.data.systemHealth
            } : null);
          }
          onHealthChangeRef.current?.(eventData.data);
          break;

        case 'budget-update':
          console.log('Budget updated:', eventData.data);
          if (eventData.data?.budget) {
            setData(prevData => prevData ? {
              ...prevData,
              budget: eventData.data.budget
            } : null);
          }
          onBudgetUpdateRef.current?.(eventData.data);
          break;

        case 'new-alert':
          console.log('New alert received:', eventData.data);
          if (eventData.data?.alerts) {
            setData(prevData => prevData ? {
              ...prevData,
              alerts: eventData.data.alerts
            } : null);
          }
          onNewAlertRef.current?.(eventData.data);
          break;

        case 'metrics-update':
          console.log('Metrics updated');
          if (eventData.data?.fullData) {
            // Full data update - merge with existing data
            setData(eventData.data.fullData);
          } else {
            // Partial update - merge specific fields
            setData(prevData => {
              if (!prevData) return null;
              
              return {
                ...prevData,
                ...(eventData.data?.performance && { performance: eventData.data.performance }),
                ...(eventData.data?.trends && { trends: eventData.data.trends }),
                ...(eventData.data?.metadata && { metadata: eventData.data.metadata }),
              };
            });
          }
          onMetricsUpdateRef.current?.(eventData.data);
          break;

        default:
          console.log('Unknown event type:', eventData.type, eventData);
      }
    } catch (parseError) {
      console.error('Error parsing SSE event:', parseError, event.data);
      setError('Failed to parse real-time update');
    }
  }, [updateConnectionStatus]); // Only updateConnectionStatus needed, callbacks are handled via refs

  // Handle heartbeat events
  const handleHeartbeat = useCallback((event: MessageEvent) => {
    updateLatency();
    updateConnectionStatus('connected');
  }, [updateLatency, updateConnectionStatus]);

  // Connect to Server-Sent Events
  const connect = useCallback(() => {
    if (!enabled || isConnectingRef.current || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    console.log('Attempting to connect to monitoring SSE...');
    isConnectingRef.current = true;
    updateConnectionStatus('reconnecting');

    try {
      // Create new EventSource connection
      const eventSource = new EventSource('/api/ws/monitoring');
      eventSourceRef.current = eventSource;
      pingStartTimeRef.current = Date.now();

      // Connection opened successfully
      eventSource.onopen = () => {
        console.log('SSE connection opened');
        updateConnectionStatus('connected');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        setError(null);
      };

      // Handle different event types
      eventSource.addEventListener('connection-status', handleMessage);
      eventSource.addEventListener('health-change', handleMessage);
      eventSource.addEventListener('budget-update', handleMessage);
      eventSource.addEventListener('new-alert', handleMessage);
      eventSource.addEventListener('metrics-update', handleMessage);
      eventSource.addEventListener('heartbeat', handleHeartbeat);

      // Handle connection errors
      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        isConnectingRef.current = false;
        
        if (eventSource.readyState === EventSource.CLOSED) {
          updateConnectionStatus('disconnected');
          setError('Connection lost');
          
          // Attempt to reconnect if under max attempts
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1)); // Exponential backoff
          } else {
            console.error('Max reconnection attempts reached');
            setError('Connection failed after multiple attempts');
          }
        }
      };

    } catch (connectError) {
      console.error('Failed to create SSE connection:', connectError);
      isConnectingRef.current = false;
      updateConnectionStatus('disconnected');
      setError('Failed to establish connection');
    }
  }, [enabled, maxReconnectAttempts, reconnectInterval, updateConnectionStatus, handleMessage, handleHeartbeat]);

  // Disconnect from Server-Sent Events
  const disconnect = useCallback(() => {
    console.log('Disconnecting from monitoring SSE...');
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    updateConnectionStatus('disconnected');
    isConnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, [updateConnectionStatus]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    disconnect();
    
    // Reset reconnection attempts
    reconnectAttemptsRef.current = 0;
    setError(null);
    
    setTimeout(() => {
      connect();
    }, 500);
  }, [disconnect, connect]);

  // Auto-connect on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    data,
    lastEvent,
    error,
    reconnect,
    disconnect,
    isConnected: connectionStatus.status === 'connected',
  };
}