'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MonitoringDashboardData, SystemStatusProps } from '@/types/monitoring';
import { cn } from '@/lib/utils/cn';

interface SystemStatusOverviewProps {
  data?: MonitoringDashboardData;
  loading?: boolean;
  onRefresh?: () => void;
  dictionary: any;
  className?: string;
  showDetails?: boolean;
  compactMode?: boolean;
}

export function SystemStatusOverview({
  data,
  loading,
  onRefresh,
  dictionary,
  className,
  showDetails = true,
  compactMode = false
}: SystemStatusOverviewProps) {
  const systemHealth = data?.systemHealth;
  
  if (loading && !systemHealth) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBg = (status?: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 dark:bg-green-900';
      case 'degraded': return 'bg-yellow-100 dark:bg-yellow-900';
      case 'unhealthy': return 'bg-orange-100 dark:bg-orange-900';
      case 'critical': return 'bg-red-100 dark:bg-red-900';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return '0s';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {dictionary.monitoring.systemHealth.title}
        </h2>
        {loading && (
          <LoadingSpinner size="sm" />
        )}
      </div>

      <div className="space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">
            {systemHealth?.overallScore || 0}
            <span className="text-lg text-gray-500">/100</span>
          </div>
          <div className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
            getStatusBg(systemHealth?.status),
            getStatusColor(systemHealth?.status)
          )}>
            {systemHealth?.status 
              ? dictionary.monitoring.systemHealth.status[systemHealth.status] || systemHealth.status
              : dictionary.monitoring.systemHealth.status.unknown
            }
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dictionary.monitoring.systemHealth.uptime}
            </div>
            <div className="font-semibold">
              {formatUptime(systemHealth?.uptime)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dictionary.monitoring.systemHealth.services}
            </div>
            <div className="font-semibold">
              {systemHealth?.services?.length || 0}
            </div>
          </div>
        </div>

        {/* Issues */}
        {systemHealth?.criticalIssues && systemHealth.criticalIssues.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
              {dictionary.monitoring.systemHealth.criticalIssues} ({systemHealth.criticalIssues.length})
            </div>
            {showDetails && (
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {systemHealth.criticalIssues.slice(0, 3).map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
                {systemHealth.criticalIssues.length > 3 && (
                  <li>• +{systemHealth.criticalIssues.length - 3} more</li>
                )}
              </ul>
            )}
          </div>
        )}

        {systemHealth?.warnings && systemHealth.warnings.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
              {dictionary.monitoring.systemHealth.warnings} ({systemHealth.warnings.length})
            </div>
            {showDetails && (
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {systemHealth.warnings.slice(0, 2).map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
                {systemHealth.warnings.length > 2 && (
                  <li>• +{systemHealth.warnings.length - 2} more</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* All good state */}
        {(!systemHealth?.criticalIssues?.length && !systemHealth?.warnings?.length) && (
          <div className="text-center py-2">
            <div className="text-green-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {dictionary.monitoring.systemHealth.allServicesHealthy}
            </p>
          </div>
        )}

        {/* Service Status (if not compact) */}
        {!compactMode && showDetails && systemHealth?.services && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">
              {dictionary.monitoring.systemHealth.serviceStatus}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {systemHealth.services.map((service) => (
                <div key={service.name} className="flex items-center space-x-2 text-sm">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'degraded' ? 'bg-yellow-500' :
                    service.status === 'unhealthy' ? 'bg-orange-500' : 'bg-red-500'
                  )} />
                  <span className="truncate">{service.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default SystemStatusOverview;