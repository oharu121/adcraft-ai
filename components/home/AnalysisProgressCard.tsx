"use client";

import { Card } from "@/components/ui";
import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import type { Dictionary } from "@/lib/dictionaries";

interface AnalysisProgressCardProps {
  dict: Dictionary;
}

export default function AnalysisProgressCard({ dict }: AnalysisProgressCardProps) {
  const {
    inputMode,
    analysisProgress,
    elapsedTime,
    errorMessage,
  } = useProductIntelligenceStore();

  return (
    <Card variant="magical" glow className="p-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-4">
          {inputMode === "image"
            ? dict.productIntelligence.imageAnalysis
            : dict.productIntelligence.productAnalysis}
        </h3>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${analysisProgress}%` }}
          ></div>
        </div>

        {/* Progress Details */}
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>{analysisProgress}% complete</span>
          <span>{(elapsedTime / 1000).toFixed(1)}s</span>
        </div>

        <p className="text-gray-300 text-sm">
          {dict.productIntelligence.analysisInProgress}
        </p>

        {/* Error Display */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-300 text-sm">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              {dict.productIntelligence.retry}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}