'use client';

import React, { useRef, useCallback } from 'react';
import { usePullToRefresh, useViewport, useHaptics } from '@/hooks';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils/cn';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  threshold?: number;
  maxDistance?: number;
  enableHaptics?: boolean;
  customIndicator?: React.ReactNode;
  refreshText?: string;
  releaseText?: string;
  loadingText?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
  threshold = 80,
  maxDistance = 120,
  enableHaptics = true,
  customIndicator,
  refreshText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  loadingText = 'Refreshing...'
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useViewport();
  const { lightTap, mediumTap } = useHaptics();

  // Only enable pull-to-refresh on mobile/tablet
  const isEnabled = !disabled && (isMobile || isTablet);

  const handleRefresh = useCallback(async () => {
    if (enableHaptics) {
      mediumTap();
    }
    await onRefresh();
  }, [onRefresh, enableHaptics, mediumTap]);

  const { touchHandlers, state } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold,
    maxDistance,
    disabled: !isEnabled,
    refreshText,
    releaseText,
    loadingText
  });

  const handleTouchFeedback = useCallback(() => {
    if (enableHaptics && state.isPulling && !state.canRefresh) {
      lightTap();
    }
  }, [enableHaptics, state.isPulling, state.canRefresh, lightTap]);

  // Calculate indicator opacity and scale based on pull distance
  const indicatorOpacity = Math.min(state.pullDistance / threshold, 1);
  const indicatorScale = Math.min(0.8 + (state.pullDistance / threshold) * 0.4, 1.2);

  const renderIndicator = () => {
    if (customIndicator) {
      return customIndicator;
    }

    if (state.isRefreshing) {
      return (
        <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-medium">{state.statusText}</span>
        </div>
      );
    }

    if (state.isPulling) {
      return (
        <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400">
          <div 
            className={cn(
              'transition-transform duration-200',
              state.canRefresh ? 'rotate-180' : 'rotate-0'
            )}
            style={{ transform: `scale(${indicatorScale}) rotate(${state.canRefresh ? 180 : 0}deg)` }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                'transition-colors duration-200',
                state.canRefresh 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
          <span className={cn(
            'text-sm font-medium transition-colors duration-200',
            state.canRefresh 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 dark:text-gray-400'
          )}>
            {state.statusText}
          </span>
        </div>
      );
    }

    return null;
  };

  if (!isEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      {...touchHandlers}
      onTouchMove={handleTouchFeedback}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 z-10 flex items-center justify-center',
          'transition-opacity duration-200 ease-out',
          state.isPulling || state.isRefreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${Math.max(state.pullDistance, 0)}px`,
          opacity: indicatorOpacity,
          transform: `translateY(-${Math.max(threshold - state.pullDistance, 0)}px)`
        }}
      >
        <div className="flex items-center justify-center h-full">
          {renderIndicator()}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'transition-transform duration-200 ease-out',
          state.isRefreshing && 'transform-gpu'
        )}
        style={{
          transform: state.isPulling || state.isRefreshing 
            ? `translateY(${state.pullDistance}px)` 
            : 'translateY(0px)'
        }}
      >
        {children}
      </div>

      {/* Loading overlay for refresh */}
      {state.isRefreshing && (
        <div 
          className={cn(
            'absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
            'flex items-center justify-center z-20',
            'transition-opacity duration-300'
          )}
        >
          <div className="flex flex-col items-center gap-3 text-blue-600 dark:text-blue-400">
            <LoadingSpinner size="lg" />
            <span className="text-base font-medium">{loadingText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PullToRefresh;