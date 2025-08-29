'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const variantClasses = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    text: 'rounded-sm',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

export interface DashboardSkeletonProps {
  className?: string;
  showHeader?: boolean;
  showCharts?: boolean;
  showCards?: boolean;
  cardsCount?: number;
}

export function DashboardSkeleton({
  className,
  showHeader = true,
  showCharts = true,
  showCards = true,
  cardsCount = 4
}: DashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton width="240px" height="32px" />
            <Skeleton width="180px" height="20px" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton width="80px" height="36px" variant="rounded" />
            <Skeleton width="100px" height="36px" variant="rounded" />
            <Skeleton width="120px" height="36px" variant="rounded" />
          </div>
        </div>
      )}

      {/* Status cards skeleton */}
      {showCards && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: cardsCount }).map((_, i) => (
            <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton width="120px" height="24px" />
                  <Skeleton width="40px" height="40px" variant="circular" />
                </div>
                <div className="space-y-2">
                  <Skeleton width="100%" height="16px" />
                  <Skeleton width="80%" height="16px" />
                  <Skeleton width="60%" height="16px" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton width="80px" height="12px" />
                  <Skeleton width="60px" height="20px" variant="rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts skeleton */}
      {showCharts && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <Skeleton width="160px" height="24px" />
              <div className="space-y-2">
                <div className="flex justify-end">
                  <div className="flex space-x-1">
                    {['1h', '24h', '7d', '30d'].map((_, i) => (
                      <Skeleton key={i} width="40px" height="28px" variant="rounded" />
                    ))}
                  </div>
                </div>
                <div className="relative h-64 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                  {/* Chart lines simulation */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} width="100%" height="1px" />
                    ))}
                  </div>
                  {/* Chart data simulation */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    {Array.from({ length: 12 }).map((_, i) => {
                      // Use deterministic heights based on index to avoid hydration mismatch
                      const deterministic = [45, 65, 35, 75, 55, 40, 80, 30, 60, 70, 50, 85];
                      return (
                        <Skeleton
                          key={i}
                          width="8px"
                          height={`${deterministic[i] || 50}%`}
                          variant="rounded"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <Skeleton width="100px" height="24px" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton width="8px" height="8px" variant="circular" />
                      <Skeleton width="200px" height="16px" />
                    </div>
                    <Skeleton width="60px" height="16px" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Large chart skeleton */}
      {showCharts && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <Skeleton width="140px" height="24px" />
            <div className="relative h-80 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
              <div className="absolute inset-0 p-4">
                <div className="h-full flex items-end justify-between">
                  {Array.from({ length: 20 }).map((_, i) => {
                    // Use deterministic heights based on index to avoid hydration mismatch
                    const deterministic = [55, 32, 78, 81, 23, 13, 31, 82, 71, 75, 19, 40, 37, 29, 82, 51, 26, 51, 55, 19];
                    return (
                      <Skeleton
                        key={i}
                        width="12px"
                        height={`${deterministic[i] || 50}%`}
                        variant="rounded"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface CardSkeletonProps {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  contentLines?: number;
}

export function CardSkeleton({
  className,
  showHeader = true,
  showContent = true,
  contentLines = 3
}: CardSkeletonProps) {
  return (
    <div className={cn(
      'p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
      'animate-pulse',
      className
    )}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <Skeleton width="140px" height="24px" />
          <Skeleton width="20px" height="20px" variant="circular" />
        </div>
      )}
      
      {showContent && (
        <div className="space-y-2">
          {Array.from({ length: contentLines }).map((_, i) => (
            <Skeleton
              key={i}
              width={i === contentLines - 1 ? '60%' : '100%'}
              height="16px"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface ListSkeletonProps {
  className?: string;
  itemCount?: number;
  showAvatar?: boolean;
  showSecondaryText?: boolean;
}

export function ListSkeleton({
  className,
  itemCount = 5,
  showAvatar = false,
  showSecondaryText = true
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatar && (
            <Skeleton width="40px" height="40px" variant="circular" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="100%" height="16px" />
            {showSecondaryText && (
              <Skeleton width="70%" height="14px" />
            )}
          </div>
          <Skeleton width="60px" height="20px" variant="rounded" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;