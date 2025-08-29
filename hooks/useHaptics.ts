'use client';

import { useCallback } from 'react';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'notification';

export interface HapticOptions {
  type: HapticFeedbackType;
  enabled?: boolean;
}

export function useHaptics() {
  const isHapticSupported = useCallback(() => {
    return typeof window !== 'undefined' && 
           'navigator' in window && 
           'vibrate' in navigator;
  }, []);

  const triggerHaptic = useCallback((options: HapticOptions) => {
    if (!options.enabled || !isHapticSupported()) return;

    const { type } = options;
    
    // Vibration patterns for different feedback types (in milliseconds)
    const patterns: Record<HapticFeedbackType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      selection: [5, 5, 10],
      notification: [20, 10, 20]
    };

    const pattern = patterns[type];
    
    try {
      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [isHapticSupported]);

  // Convenient method wrappers
  const lightTap = useCallback((enabled = true) => {
    triggerHaptic({ type: 'light', enabled });
  }, [triggerHaptic]);

  const mediumTap = useCallback((enabled = true) => {
    triggerHaptic({ type: 'medium', enabled });
  }, [triggerHaptic]);

  const heavyTap = useCallback((enabled = true) => {
    triggerHaptic({ type: 'heavy', enabled });
  }, [triggerHaptic]);

  const selection = useCallback((enabled = true) => {
    triggerHaptic({ type: 'selection', enabled });
  }, [triggerHaptic]);

  const notification = useCallback((enabled = true) => {
    triggerHaptic({ type: 'notification', enabled });
  }, [triggerHaptic]);

  return {
    isSupported: isHapticSupported(),
    trigger: triggerHaptic,
    lightTap,
    mediumTap,
    heavyTap,
    selection,
    notification
  };
}

export default useHaptics;