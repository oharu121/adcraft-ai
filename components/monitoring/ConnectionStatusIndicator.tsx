'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { ConnectionStatus } from '@/types/monitoring';

interface ConnectionStatusIndicatorProps {
  connectionStatus?: ConnectionStatus;
  isRealTimeEnabled?: boolean;
  onReconnect?: () => void;
  dictionary: any;
  className?: string;
}

export function ConnectionStatusIndicator({
  connectionStatus,
  isRealTimeEnabled = false,
  onReconnect,
  dictionary,
  className
}: ConnectionStatusIndicatorProps) {
  // If no connection status provided, show disabled state
  const status = connectionStatus?.status || 'disconnected';
  const latency = connectionStatus?.latency || 0;
  const lastUpdate = connectionStatus?.lastUpdate;

  const getStatusColor = () => {
    if (!isRealTimeEnabled) return 'text-gray-400';
    
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      case 'reconnecting': return 'text-yellow-500';
    }
  };

  const getStatusText = () => {
    if (!isRealTimeEnabled) {
      return dictionary.monitoring?.realTime?.disabled || 'Real-time disabled';
    }
    
    switch (status) {
      case 'connected': return dictionary.monitoring?.realTime?.connected || 'Real-time connected';
      case 'disconnected': return dictionary.monitoring?.realTime?.disconnected || 'Real-time disconnected';
      case 'reconnecting': return dictionary.monitoring?.realTime?.reconnecting || 'Reconnecting...';
    }
  };

  const getStatusIcon = () => {
    if (!isRealTimeEnabled) return '⏸️';
    
    switch (status) {
      case 'connected': return '🟢';
      case 'disconnected': return '🔴';
      case 'reconnecting': return '🟡';
    }
  };

  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      {/* Status indicator dot with animation for reconnecting */}
      <div className="relative">
        <div className={cn('w-2 h-2 rounded-full', getStatusColor().replace('text-', 'bg-'))}>
          {status === 'reconnecting' && (
            <div className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', getStatusColor().replace('text-', 'bg-'))} />
          )}
        </div>
      </div>
      
      {/* Status text with latency */}
      <span className="text-gray-600 dark:text-gray-400">
        {getStatusText()}
        {status === 'connected' && latency > 0 && (
          <span className="ml-1 text-xs">
            ({latency}ms)
          </span>
        )}
      </span>

      {/* Reconnect button for disconnected state */}
      {isRealTimeEnabled && status === 'disconnected' && onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-2 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
          title="Reconnect to real-time updates"
        >
          Reconnect
        </button>
      )}

      {/* Last update timestamp */}
      {lastUpdate && status === 'connected' && (
        <span className="ml-2 text-xs text-gray-400">
          {dictionary.monitoring?.realTime?.lastUpdate || 'Updated'}: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

export default ConnectionStatusIndicator;