'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface TouchGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullDown?: (distance: number) => void;
  onPullRelease?: (distance: number) => void;
  onLongPress?: () => void;
  onTap?: () => void;
  swipeThreshold?: number;
  longPressThreshold?: number;
  pullThreshold?: number;
  disabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isDragging: boolean;
  isPulling: boolean;
}

export function useTouchGestures(config: TouchGestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullDown,
    onPullRelease,
    onLongPress,
    onTap,
    swipeThreshold = 50,
    longPressThreshold = 500,
    pullThreshold = 80,
    disabled = false
  } = config;

  const touchStateRef = useRef<TouchState | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      isDragging: false,
      isPulling: false
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
        clearLongPressTimer();
      }, longPressThreshold);
    }
  }, [disabled, onLongPress, longPressThreshold, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStateRef.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const state = touchStateRef.current;
    
    state.currentX = touch.clientX;
    state.currentY = touch.clientY;
    state.isDragging = true;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clear long press if moving
    if (distance > 10) {
      clearLongPressTimer();
    }

    // Handle pull-to-refresh (only if at top of scrollable area)
    if (deltaY > 0 && window.scrollY === 0 && onPullDown) {
      e.preventDefault();
      const pullDist = Math.min(deltaY, pullThreshold * 2);
      setPullDistance(pullDist);
      setIsPulling(pullDist > pullThreshold);
      onPullDown(pullDist);
    }
  }, [disabled, onPullDown, pullThreshold, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStateRef.current) return;

    const state = touchStateRef.current;
    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - state.startTime;

    clearLongPressTimer();

    // Handle pull release
    if (isPulling && onPullRelease) {
      onPullRelease(pullDistance);
      setIsPulling(false);
      setPullDistance(0);
    }

    // Handle tap (short press without movement)
    if (!state.isDragging && duration < 300 && distance < 10 && onTap) {
      onTap();
      return;
    }

    // Handle swipes
    if (state.isDragging && distance > swipeThreshold) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    touchStateRef.current = null;
  }, [
    disabled,
    isPulling,
    pullDistance,
    onPullRelease,
    onTap,
    onSwipeRight,
    onSwipeLeft,
    onSwipeDown,
    onSwipeUp,
    swipeThreshold,
    clearLongPressTimer
  ]);

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    touchStateRef.current = null;
    setIsPulling(false);
    setPullDistance(0);
  }, [clearLongPressTimer]);

  // Touch event handlers for ref attachment
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  } as const;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return {
    touchHandlers,
    isPulling,
    pullDistance,
    isActive: touchStateRef.current !== null
  };
}

export default useTouchGestures;