"use client";

import { useDebugMode } from "@/lib/hooks/use-debug-mode";

/**
 * Mode Indicator Component
 *
 * Shows current application mode on the home page.
 * Only visible in development environment.
 * Uses shared hook - no polling, immediate updates.
 */
export function ModeIndicator() {
  const { mode, modeData, isVisible, getDisplayProps } = useDebugMode();

  if (!isVisible || !modeData) {
    return null;
  }

  const displayProps = getDisplayProps(mode);

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${displayProps.bgColor} ${displayProps.textColor} border border-current/20`}
    >
      <span className="mr-1">{displayProps.emoji}</span>
      <span className="font-semibold">{modeData.displayName}</span>

      {/* Tooltip on hover */}
      <div className="group relative">
        <span className="ml-1 cursor-help">ℹ️</span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          {modeData.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Development Mode Toggle Component
 *
 * Provides a toggle switch for developers to change modes.
 * Only visible in development environment.
 * Uses shared hook - syncs with backend, immediate updates.
 */
export function ModeToggle() {
  const { mode, modeData, isLoading, isVisible, switchMode, getDisplayProps } = useDebugMode();

  if (!isVisible || !modeData) {
    return null;
  }

  return (
    <div className="hidden fixed bottom-4 right-4 bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg max-w-xs z-50">
      <div className="text-sm font-medium mb-2 text-gray-700">Developer Controls</div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">Current Mode:</span>
        <ModeIndicator />
      </div>

      <button
        onClick={switchMode}
        disabled={isLoading}
        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          isLoading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : mode === "demo"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Switching...
          </span>
        ) : (
          `Switch to ${mode === "demo" ? "🤖 Real" : "🎭 Demo"} Mode`
        )}
      </button>

      <div className="text-xs text-gray-500 mt-2">
        {mode === "demo" ? "⚡ Zero API costs, perfect demos" : "💸 Live AI, real costs"}
      </div>
    </div>
  );
}
