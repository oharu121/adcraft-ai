'use client';

import React from 'react';
import { MonitoringDashboardData } from '@/types/monitoring';
import { cn } from '@/lib/utils/cn';

interface AlertsListProps {
  alerts: MonitoringDashboardData['alerts'];
  maxItems?: number;
  dictionary: any;
  className?: string;
}

export function AlertsList({
  alerts,
  maxItems = 10,
  dictionary,
  className
}: AlertsListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  const displayAlerts = alerts.recent.slice(0, maxItems);

  if (!displayAlerts.length) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-green-500 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {dictionary.monitoring?.alerts?.noActiveAlerts || 'No active alerts'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Alert Summary */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-red-500">
            {alerts.critical} Critical
          </span>
          <span className="text-orange-500">
            {alerts.high} High
          </span>
          <span className="text-yellow-500">
            {alerts.medium} Medium
          </span>
          <span className="text-blue-500">
            {alerts.low} Low
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Total: {alerts.total}
        </div>
      </div>

      {/* Recent Alerts List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayAlerts.map((alert) => (
          <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              getSeverityColor(alert.severity)
            )}>
              {alert.severity.toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {alert.message}
              </p>
              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                <span>{alert.source}</span>
                <span>•</span>
                <span>{formatTime(alert.timestamp)}</span>
              </div>
            </div>

            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {alerts.total > maxItems && (
        <div className="text-center pt-3 border-t">
          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
            {dictionary.monitoring?.alerts?.viewAll || 'View All'} ({alerts.total - maxItems} more)
          </button>
        </div>
      )}
    </div>
  );
}

export default AlertsList;