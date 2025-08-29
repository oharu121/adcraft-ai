'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { useVisibilityObserver } from '@/hooks';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './Card';
import { cn } from '@/lib/utils/cn';

export interface LazyChartProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  props: any;
  fallback?: React.ReactNode;
  skeleton?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  rootMargin?: string;
  threshold?: number;
  retryOnError?: boolean;
  maxRetries?: number;
}

interface ChartSkeletonProps {
  height?: number;
  title?: string;
  className?: string;
}

export function ChartSkeleton({ 
  height = 300, 
  title, 
  className 
}: ChartSkeletonProps) {
  return (
    <Card className={cn('p-6 animate-pulse', className)}>
      {title && (
        <div className="mb-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      )}
      
      {/* Chart skeleton */}
      <div className="space-y-4">
        {/* Legend area */}
        <div className="flex justify-end">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Chart area */}
        <div 
          className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
          style={{ height }}
        >
          {/* Y-axis lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className="h-px bg-gray-200 dark:bg-gray-700 w-full"
              />
            ))}
          </div>
          
          {/* Chart line simulation */}
          <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-blue-200 dark:bg-blue-800 w-2 rounded-t animate-pulse"
                style={{ 
                  height: `${Math.random() * 80 + 20}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          {/* Loading overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Loading chart data...
              </p>
            </div>
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

interface LazyChartErrorFallbackProps {
  error: Error;
  retry: () => void;
  title?: string;
  className?: string;
}

function LazyChartErrorFallback({ 
  error, 
  retry, 
  title, 
  className 
}: LazyChartErrorFallbackProps) {
  return (
    <Card className={cn('p-6 text-center', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium">Failed to load chart</p>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
        {error.message || 'An error occurred while loading the chart data.'}
      </p>
      
      <button
        onClick={retry}
        className={cn(
          'px-4 py-2 bg-blue-600 text-white rounded-lg',
          'hover:bg-blue-700 transition-colors text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        )}
      >
        Try Again
      </button>
    </Card>
  );
}

export function LazyChart({
  component,
  props,
  fallback,
  skeleton,
  className,
  title,
  description,
  rootMargin = '100px',
  threshold = 0.1,
  retryOnError = true,
  maxRetries = 3
}: LazyChartProps) {
  const { targetRef, isVisible } = useVisibilityObserver(threshold, rootMargin);
  const [LazyComponent, setLazyComponent] = React.useState<ComponentType<any> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadComponent = React.useCallback(async () => {
    if (LazyComponent || isLoading || retryCount >= maxRetries) return;

    setIsLoading(true);
    setError(null);

    try {
      const module = await component();
      setLazyComponent(() => module.default);
    } catch (err) {
      console.error('Failed to load chart component:', err);
      setError(err instanceof Error ? err : new Error('Failed to load chart'));
      if (retryOnError && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsLoading(false);
    }
  }, [component, LazyComponent, isLoading, retryCount, maxRetries, retryOnError]);

  const handleRetry = React.useCallback(() => {
    setRetryCount(0);
    setError(null);
    setLazyComponent(null);
    loadComponent();
  }, [loadComponent]);

  React.useEffect(() => {
    if (isVisible && !LazyComponent && !error) {
      loadComponent();
    }
  }, [isVisible, LazyComponent, error, loadComponent]);

  const defaultSkeleton = skeleton || (
    <ChartSkeleton 
      title={title} 
      height={props?.height || 300}
      className={className}
    />
  );

  if (error) {
    return (
      <LazyChartErrorFallback
        error={error}
        retry={handleRetry}
        title={title}
        className={className}
      />
    );
  }

  if (!isVisible) {
    return <div ref={targetRef as React.RefObject<HTMLDivElement>} className={cn('min-h-[300px]', className)} />;
  }

  if (!LazyComponent || isLoading) {
    return (
      <div ref={targetRef as React.RefObject<HTMLDivElement>}>
        {fallback || defaultSkeleton}
      </div>
    );
  }

  return (
    <div ref={targetRef as React.RefObject<HTMLDivElement>} className={className}>
      <Suspense fallback={fallback || defaultSkeleton}>
        <LazyComponent {...props} />
      </Suspense>
    </div>
  );
}

// Convenience wrapper for common chart lazy loading patterns
export function createLazyChart<T = any>(
  importFunction: () => Promise<{ default: ComponentType<T> }>
) {
  return (props: T & { 
    className?: string; 
    title?: string; 
    skeleton?: React.ReactNode;
  }) => (
    <LazyChart
      component={importFunction}
      props={props}
      className={props.className}
      title={props.title}
      skeleton={props.skeleton}
    />
  );
}

export default LazyChart;