/**
 * Product Intelligence Agent SSE Demo Component
 * 
 * Demonstrates how to use the real-time SSE system with the Product Intelligence Agent.
 * This component shows progress updates, chat messages, cost tracking, and handoff status.
 */

'use client';

import { useState } from 'react';
import { useProductIntelligenceSSE } from '@/hooks/useProductIntelligenceSSE';

interface SSEDemoProps {
  sessionId: string;
  onAnalysisComplete?: (results: any) => void;
  onHandoffReady?: (handoffData: any) => void;
}

export function SSEDemo({ 
  sessionId, 
  onAnalysisComplete,
  onHandoffReady 
}: SSEDemoProps) {
  const [logs, setLogs] = useState<string[]>([]);
  
  const {
    isConnected,
    isConnecting,
    connectionError,
    analysisProgress,
    isTyping,
    lastMessage,
    costData,
    handoffStatus,
    events,
    connect,
    disconnect,
    reconnect,
    clearEvents
  } = useProductIntelligenceSSE({
    sessionId,
    autoConnect: true,
    onEvent: (event) => {
      const logEntry = `[${new Date().toLocaleTimeString()}] ${event.type}: ${
        event.data ? JSON.stringify(event.data, null, 2) : 'No data'
      }`;
      setLogs(prev => [...prev.slice(-19), logEntry]);
      
      // Handle specific events
      if (event.type === 'analysis-complete' && onAnalysisComplete) {
        onAnalysisComplete(event.data);
      }
      
      if (event.type === 'handoff-ready' && onHandoffReady) {
        onHandoffReady(event.data);
      }
    },
    onError: (error) => {
      const logEntry = `[${new Date().toLocaleTimeString()}] ERROR: ${error.message}`;
      setLogs(prev => [...prev.slice(-19), logEntry]);
    },
    onConnect: () => {
      const logEntry = `[${new Date().toLocaleTimeString()}] Connected to Product Intelligence Agent SSE`;
      setLogs(prev => [...prev.slice(-19), logEntry]);
    },
    onDisconnect: () => {
      const logEntry = `[${new Date().toLocaleTimeString()}] Disconnected from SSE`;
      setLogs(prev => [...prev.slice(-19), logEntry]);
    }
  });

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Product Intelligence Agent - Real-time Status
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">
            Connection Error: {connectionError.message}
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {analysisProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-900 mb-2">Analysis Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{analysisProgress.message}</span>
              <span>{analysisProgress.percentage}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Status */}
      {(isTyping || lastMessage) && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="font-medium text-green-900 mb-2">Chat Status</h3>
          {isTyping && (
            <div className="text-sm text-green-700 mb-2">
              🤖 Product Intelligence Agent is typing...
            </div>
          )}
          {lastMessage && (
            <div className="text-sm">
              <div className="font-medium text-green-800">
                Latest Message ({lastMessage.type}):
              </div>
              <div className="text-green-700 mt-1">
                {lastMessage.content}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {new Date(lastMessage.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cost Tracking */}
      {costData && (
        <div className={`border rounded-md p-4 ${
          costData.budgetAlert ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <h3 className={`font-medium mb-2 ${
            costData.budgetAlert ? 'text-red-900' : 'text-yellow-900'
          }`}>
            Cost Tracking {costData.budgetAlert && '⚠️ Budget Alert'}
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">Current</div>
              <div>${costData.current.toFixed(2)}</div>
            </div>
            <div>
              <div className="font-medium">Total</div>
              <div>${costData.total.toFixed(2)}</div>
            </div>
            <div>
              <div className="font-medium">Remaining</div>
              <div>${costData.remaining.toFixed(2)}</div>
            </div>
          </div>
          {Object.keys(costData.breakdown).length > 0 && (
            <div className="mt-2">
              <div className="font-medium text-xs mb-1">Breakdown:</div>
              {Object.entries(costData.breakdown).map(([service, cost]) => (
                <div key={service} className="text-xs flex justify-between">
                  <span>{service.replace(/_/g, ' ')}</span>
                  <span>${(cost as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Handoff Status */}
      {handoffStatus && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <h3 className="font-medium text-purple-900 mb-2">
            Agent Handoff Status
          </h3>
          <div className="text-sm space-y-1">
            {handoffStatus.nextAgent && (
              <div>Next Agent: <span className="font-medium">{handoffStatus.nextAgent}</span></div>
            )}
            {handoffStatus.validationStatus && (
              <div>
                Validation: 
                <span className={`font-medium ml-1 ${
                  handoffStatus.validationStatus === 'passed' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {handoffStatus.validationStatus}
                </span>
              </div>
            )}
            <div>
              Ready: 
              <span className={`font-medium ml-1 ${
                handoffStatus.ready ? 'text-green-700' : 'text-gray-600'
              }`}>
                {handoffStatus.ready ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          onClick={connect}
          disabled={isConnected || isConnecting}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded disabled:bg-gray-400"
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded disabled:bg-gray-400"
        >
          Disconnect
        </button>
        <button
          onClick={reconnect}
          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded"
        >
          Reconnect
        </button>
        <button
          onClick={clearEvents}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded"
        >
          Clear Logs
        </button>
      </div>

      {/* Event Log */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-md text-xs font-mono">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold">Event Log</h3>
          <span className="text-gray-400">{events.length} total events</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No events yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Session Info */}
      <div className="text-xs text-gray-500">
        Session ID: {sessionId}
      </div>
    </div>
  );
}