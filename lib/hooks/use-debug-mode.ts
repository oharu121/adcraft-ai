"use client";

import { useEffect } from "react";
import { useDebugModeStore } from "@/lib/stores/debug-mode-store";

/**
 * Hook for accessing shared debug mode state
 * Uses Zustand store to ensure all components share the same state instance
 */
export function useDebugMode() {
  const {
    mode,
    modeData,
    isLoading,
    isVisible,
    isInitialized,
    fetchModeInfo,
    switchMode,
    getDisplayProps,
  } = useDebugModeStore();

  // Initialize once on first mount
  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "production") {
      return;
    }

    // Only fetch if not already initialized
    if (!isInitialized) {
      fetchModeInfo();
    }
  }, [isInitialized, fetchModeInfo]);

  return {
    mode,
    modeData,
    isLoading,
    isVisible,
    switchMode,
    getDisplayProps,
  };
}