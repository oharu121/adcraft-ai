'use client';

import React, { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { MonitoringDashboardData, ConnectionStatus } from '@/types/monitoring';
import { useMonitoringWebSocket } from '@/hooks/useMonitoringWebSocket';
import { SystemStatusOverview } from './overview/SystemStatusOverview';
import { BudgetOverview } from './overview/BudgetOverview';
import { PerformanceChart } from './charts/PerformanceChart';
import { TrendsVisualization } from './charts/TrendsVisualization';
import { AlertsList } from './AlertsList';
import { RefreshButton } from './RefreshButton';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import { LazyChart } from '@/components/ui/LazyChart';
import { useViewport } from '@/hooks';
import { cn } from '@/lib/utils/cn';

interface MonitoringDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  dictionary: any;
}

const fetcher = async (url: string): Promise<MonitoringDashboardData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export default function MonitoringDashboard({ 
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  enableRealTime = true,
  dictionary 
}: MonitoringDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(enableRealTime);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    latency: 0,
    lastUpdate: null,
  });

  // Mobile optimizations
  const { isMobile, isTablet } = useViewport();
  const isSmallScreen = isMobile || isTablet;

  // Create lazy chart components (MUST be at top level, before any conditional logic)
  const LazyPerformanceChart = useCallback(() => 
    import('./charts/PerformanceChart').then(module => ({ default: module.default })), []);
  
  const LazyTrendsChart = useCallback(() => 
    import('./charts/TrendsVisualization').then(module => ({ default: module.default })), []);

  // Real-time WebSocket connection
  const {
    connectionStatus,
    data: wsData,
    error: wsError,
    reconnect,
    disconnect,
    isConnected,
  } = useMonitoringWebSocket({
    enabled: isRealTimeEnabled,
    onConnectionStatusChange: setWsConnectionStatus,
    onHealthChange: (data) => {
      console.log('Dashboard received health change:', data);
    },
    onBudgetUpdate: (data) => {
      console.log('Dashboard received budget update:', data);
    },
    onNewAlert: (data) => {
      console.log('Dashboard received new alert:', data);
    },
    onMetricsUpdate: (data) => {
      console.log('Dashboard received metrics update');
    },
  });

  // SWR for data fetching with revalidation (fallback when WebSocket fails)
  const { 
    data: swrData, 
    error: swrError, 
    isLoading, 
    mutate: refresh 
  } = useSWR<MonitoringDashboardData>(
    '/api/monitoring/dashboard',
    fetcher,
    {
      // Disable automatic refresh if WebSocket is connected and working
      refreshInterval: (isConnected && !wsError) ? 0 : (isAutoRefreshEnabled ? refreshInterval : 0),
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 seconds deduplication
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('Monitoring dashboard fetch error:', error);
      }
    }
  );

  // Smart data merging - prefer WebSocket data when available and fresh
  const data = useMemo<MonitoringDashboardData | undefined>(() => {
    // If WebSocket data is available and connection is healthy, use it
    if (wsData && isConnected && !wsError) {
      return wsData;
    }
    
    // If WebSocket data exists but connection has issues, merge with SWR data
    if (wsData && swrData) {
      // Use more recent data for each section
      const wsTimestamp = new Date(wsData.metadata.timestamp).getTime();
      const swrTimestamp = new Date(swrData.metadata.timestamp).getTime();
      
      // If WebSocket data is more recent, use it; otherwise use SWR data
      return wsTimestamp > swrTimestamp ? wsData : swrData;
    }
    
    // Fallback to SWR data
    return swrData;
  }, [wsData, swrData, isConnected, wsError]);

  // Callback handlers (defined at top level)
  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [refresh]);

  const handleTimeRangeChange = useCallback((range: string) => {
    setSelectedTimeRange(range);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev);
  }, []);

  const toggleRealTime = useCallback(() => {
    setIsRealTimeEnabled(prev => !prev);
  }, []);

  const handleReconnect = useCallback(() => {
    reconnect();
  }, [reconnect]);

  // Combined error handling
  const error = wsError || swrError;

  // Loading state with skeleton for better UX
  if (isLoading && !data) {
    return (
      <div className={cn(className)}>
        <DashboardSkeleton 
          showHeader={true}
          showCharts={true}
          showCards={true}
          cardsCount={2}
        />
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {dictionary.monitoring.errors.failedToLoad}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : dictionary.monitoring.errors.serviceUnavailable}
          </p>
          <RefreshButton 
            onRefresh={handleRefresh}
            loading={isLoading}
            dictionary={dictionary}
            className="mx-auto"
          />
        </Card>
      </div>
    );
  }

  const lastUpdated = data?.metadata?.timestamp 
    ? new Date(data.metadata.timestamp) 
    : new Date();

  const renderDashboardContent = () => (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className={cn(
        'flex gap-4',
        isSmallScreen 
          ? 'flex-col' 
          : 'flex-col sm:flex-row sm:items-center sm:justify-between'
      )}>
        <div>
          <h1 className={cn(
            'font-bold text-gray-900 dark:text-white',
            isSmallScreen ? 'text-xl' : 'text-2xl'
          )}>
            {dictionary.monitoring.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {dictionary.monitoring.subtitle}
          </p>
        </div>
        
        <div className={cn(
          'flex items-center gap-2',
          isSmallScreen && 'flex-wrap justify-center'
        )}>
          {!isSmallScreen && (
            <ConnectionStatusIndicator 
              connectionStatus={connectionStatus}
              isRealTimeEnabled={isRealTimeEnabled}
              onReconnect={handleReconnect}
              dictionary={dictionary} 
            />
          )}
          
          <RefreshButton 
            onRefresh={handleRefresh}
            loading={isLoading}
            dictionary={dictionary}
          />
          
          {!isSmallScreen && (
            <>
              <button
                onClick={toggleRealTime}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                  isRealTimeEnabled && isConnected
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : isRealTimeEnabled
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
                title={isRealTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                🔴 Real-time
              </button>
              
              <button
                onClick={toggleAutoRefresh}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                  isAutoRefreshEnabled
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {dictionary.monitoring.autoRefresh}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Connection Status */}
      {isSmallScreen && (
        <div className="flex items-center justify-center">
          <ConnectionStatusIndicator 
            connectionStatus={connectionStatus}
            isRealTimeEnabled={isRealTimeEnabled}
            onReconnect={handleReconnect}
            dictionary={dictionary} 
          />
        </div>
      )}

      {/* Last Updated */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {dictionary.monitoring.lastUpdated.replace('{time}', lastUpdated.toLocaleTimeString())}
      </div>

      {data && (
        <>
          {/* High Priority Content - Always visible */}
          <CollapsibleSection
            title={dictionary.monitoring.overview || 'System Overview'}
            defaultExpanded={true}
            priority="high"
            className="border-2"
          >
            <div className={cn(
              'grid gap-4',
              isSmallScreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            )}>
              <SystemStatusOverview
                data={data}
                loading={isLoading}
                onRefresh={handleRefresh}
                dictionary={dictionary}
              />
              
              <BudgetOverview
                data={data}
                loading={isLoading}
                onRefresh={handleRefresh}
                dictionary={dictionary}
              />
            </div>
          </CollapsibleSection>

          {/* Performance Charts - Collapsible on mobile */}
          <CollapsibleSection
            title={dictionary.monitoring.performance?.title || 'Performance & Alerts'}
            defaultExpanded={!isSmallScreen}
            priority="medium"
          >
            <div className={cn(
              'grid gap-6',
              isSmallScreen ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'
            )}>
              <Card className="p-4">
                <h3 className="text-md font-semibold mb-4">
                  {dictionary.monitoring.performance?.title || 'Performance'}
                </h3>
                <LazyChart
                  component={LazyPerformanceChart}
                  props={{
                    data: data.trends.requestTrend.map(point => ({
                      timestamp: point.timestamp,
                      value: point.value,
                      responseTime: point.value,
                    })),
                    timeRange: selectedTimeRange as any,
                    onTimeRangeChange: handleTimeRangeChange,
                    dictionary: dictionary,
                    height: isSmallScreen ? 250 : 300
                  }}
                  title="Performance Chart"
                  className="h-full"
                />
              </Card>

              <Card className="p-4">
                <h3 className="text-md font-semibold mb-4">
                  {dictionary.monitoring.alerts?.title || 'Recent Alerts'}
                </h3>
                <AlertsList
                  alerts={data.alerts}
                  maxItems={isSmallScreen ? 3 : 5}
                  dictionary={dictionary}
                />
              </Card>
            </div>
          </CollapsibleSection>

          {/* Trends Visualization - Lower priority on mobile */}
          <CollapsibleSection
            title={dictionary.monitoring.trends?.title || 'Trends & Analytics'}
            defaultExpanded={!isSmallScreen}
            priority="low"
          >
            <LazyChart
              component={LazyTrendsChart}
              props={{
                trends: data.trends,
                timeRange: selectedTimeRange,
                dictionary: dictionary,
                onTimeRangeChange: handleTimeRangeChange
              }}
              title="Trends Visualization"
              className="w-full"
            />
          </CollapsibleSection>
        </>
      )}
    </div>
  );

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      disabled={!isSmallScreen}
      threshold={80}
      enableHaptics={true}
      refreshText={dictionary.monitoring?.pullToRefresh || 'Pull to refresh'}
      releaseText={dictionary.monitoring?.releaseToRefresh || 'Release to refresh'}
      loadingText={dictionary.monitoring?.refreshing || 'Refreshing...'}
    >
      {renderDashboardContent()}
    </PullToRefresh>
  );
}