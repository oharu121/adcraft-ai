'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useHaptics, useViewport } from '@/hooks';
import { cn } from '@/lib/utils/cn';

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  onToggle?: (expanded: boolean) => void;
  expandIcon?: React.ReactNode;
  collapseIcon?: React.ReactNode;
  animationDuration?: number;
  enableHaptics?: boolean;
  reduceMotion?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  disabled = false,
  className,
  headerClassName,
  contentClassName,
  icon,
  badge,
  priority = 'medium',
  onToggle,
  expandIcon,
  collapseIcon,
  animationDuration = 300,
  enableHaptics = true,
  reduceMotion = false
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultExpanded ? undefined : 0
  );
  
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLButtonElement>(null);
  const { selection } = useHaptics();
  const { isMobile, isTablet } = useViewport();

  // Respect user's motion preferences
  const respectsReducedMotion = reduceMotion || 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const measureContent = useCallback(() => {
    if (!contentRef.current) return 0;
    
    const scrollHeight = contentRef.current.scrollHeight;
    const computedStyle = window.getComputedStyle(contentRef.current);
    const paddingTop = parseInt(computedStyle.paddingTop, 10);
    const paddingBottom = parseInt(computedStyle.paddingBottom, 10);
    
    return scrollHeight + paddingTop + paddingBottom;
  }, []);

  const updateHeight = useCallback(() => {
    if (isExpanded) {
      const height = measureContent();
      setContentHeight(height);
      
      // After animation completes, set height to auto for dynamic content
      setTimeout(() => {
        if (isExpanded) {
          setContentHeight(undefined);
        }
      }, respectsReducedMotion ? 0 : animationDuration);
    } else {
      // First set to current height, then to 0 for smooth collapse
      const height = measureContent();
      setContentHeight(height);
      
      requestAnimationFrame(() => {
        setContentHeight(0);
      });
    }
  }, [isExpanded, measureContent, animationDuration, respectsReducedMotion]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setIsAnimating(true);
    
    // Provide haptic feedback on mobile
    if (enableHaptics && (isMobile || isTablet)) {
      selection();
    }
    
    onToggle?.(newExpanded);
    
    // Clear animation state
    setTimeout(() => {
      setIsAnimating(false);
    }, respectsReducedMotion ? 0 : animationDuration);
  }, [
    disabled, 
    isExpanded, 
    onToggle, 
    enableHaptics, 
    isMobile, 
    isTablet, 
    selection, 
    animationDuration, 
    respectsReducedMotion
  ]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [disabled, handleToggle]);

  // Update height when expanded state changes
  useEffect(() => {
    updateHeight();
  }, [updateHeight]);

  // Handle content changes when expanded
  useEffect(() => {
    if (!isExpanded || respectsReducedMotion) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (contentHeight === undefined) {
        // Content is auto-sized, no need to update
        return;
      }
      updateHeight();
    });
    
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isExpanded, contentHeight, updateHeight, respectsReducedMotion]);

  const priorityStyles = {
    high: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950',
    medium: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
    low: 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'
  };

  const DefaultExpandIcon = () => (
    <svg 
      className={cn(
        'transition-transform duration-200',
        isExpanded ? 'rotate-180' : 'rotate-0'
      )} 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );

  return (
    <div 
      className={cn(
        'border rounded-lg overflow-hidden',
        priorityStyles[priority],
        className
      )}
    >
      {/* Header */}
      <button
        ref={headerRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between text-left transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          isMobile ? 'p-3 min-h-[48px]' : 'p-4',
          !disabled && 'hover:bg-gray-50 dark:hover:bg-gray-700',
          disabled && 'cursor-not-allowed opacity-50',
          headerClassName
        )}
        aria-expanded={isExpanded}
        aria-controls={`collapsible-content-${title}`}
        aria-describedby={badge ? `badge-${title}` : undefined}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold text-gray-900 dark:text-gray-100 truncate',
              isMobile ? 'text-base' : 'text-lg'
            )}>
              {title}
            </h3>
          </div>
          
          {badge && (
            <div 
              id={`badge-${title}`}
              className="flex-shrink-0 ml-2"
            >
              {badge}
            </div>
          )}
        </div>
        
        <div className={cn(
          'flex-shrink-0 ml-3 transition-colors',
          isAnimating && 'animate-pulse',
          disabled 
            ? 'text-gray-400 dark:text-gray-600' 
            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
        )}>
          {isExpanded && collapseIcon ? collapseIcon : 
           (!isExpanded && expandIcon ? expandIcon : <DefaultExpandIcon />)}
        </div>
      </button>

      {/* Content */}
      <div
        id={`collapsible-content-${title}`}
        ref={contentRef}
        className={cn(
          'overflow-hidden',
          respectsReducedMotion ? '' : `transition-all duration-${animationDuration} ease-in-out`
        )}
        style={{
          height: contentHeight,
          opacity: respectsReducedMotion ? (isExpanded ? 1 : 0) : undefined
        }}
        aria-hidden={!isExpanded}
      >
        <div className={cn(
          'border-t border-gray-200 dark:border-gray-700',
          isMobile ? 'p-3' : 'p-4',
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Priority badge component
export function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-xs font-medium',
      styles[priority]
    )}>
      {labels[priority]}
    </span>
  );
}

export default CollapsibleSection;