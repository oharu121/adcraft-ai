'use client';

import { useCallback, useRef, useState } from 'react';
import { useTouchGestures } from './useTouchGestures';

export interface PullToRefreshConfig {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxDistance?: number;
  disabled?: boolean;
  refreshText?: string;
  releaseText?: string;
  loadingText?: string;
}

export interface PullToRefreshState {
  isRefreshing: boolean;
  isPulling: boolean;
  pullDistance: number;
  canRefresh: boolean;
  statusText: string;
}

export function usePullToRefresh(config: PullToRefreshConfig) {
  const {
    onRefresh,
    threshold = 80,
    maxDistance = 120,
    disabled = false,
    refreshText = 'Pull to refresh',
    releaseText = 'Release to refresh',
    loadingText = 'Refreshing...'
  } = config;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const handlePullDown = useCallback((distance: number) => {
    // This is handled by the touch gesture hook
  }, []);

  const handlePullRelease = useCallback(async (distance: number) => {
    if (disabled || isRefreshing || distance < threshold) return;

    setIsRefreshing(true);

    try {
      // Prevent multiple simultaneous refresh calls
      if (refreshPromiseRef.current) {
        await refreshPromiseRef.current;
        return;
      }

      const refreshPromise = Promise.resolve(onRefresh());
      refreshPromiseRef.current = refreshPromise;
      
      await refreshPromise;
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      refreshPromiseRef.current = null;
    }
  }, [disabled, isRefreshing, threshold, onRefresh]);

  const { touchHandlers, isPulling, pullDistance, isActive } = useTouchGestures({
    onPullDown: handlePullDown,
    onPullRelease: handlePullRelease,
    pullThreshold: threshold,
    disabled: disabled || isRefreshing
  });

  const canRefresh = pullDistance >= threshold;
  const clampedDistance = Math.min(pullDistance, maxDistance);
  
  const getStatusText = () => {
    if (isRefreshing) return loadingText;
    if (isPulling && canRefresh) return releaseText;
    if (isPulling) return refreshText;
    return '';
  };

  const state: PullToRefreshState = {
    isRefreshing,
    isPulling,
    pullDistance: clampedDistance,
    canRefresh,
    statusText: getStatusText()
  };

  return {
    touchHandlers,
    state,
    refresh: handlePullRelease
  };
}

export default usePullToRefresh;