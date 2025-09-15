"use client";

import React from "react";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";

interface ProjectSummaryProps {
  onNavigateToStep: (step: string) => void;
}

export default function ProjectSummary({
  onNavigateToStep,
}: ProjectSummaryProps) {
  const {
    selectedProductionStyle,
    selectedStyleOption,
    assets,
  } = useCreativeDirectorStore();

  const steps = [
    { id: "production-style", label: "Production Style", description: "Choose production method" },
    {
      id: "creative-direction",
      label: "Creative Direction",
      description: "Select aesthetic approach",
    },
    { id: "scene-architecture", label: "Scene Architecture", description: "Plan narrative flow" },
    { id: "asset-development", label: "Asset Development", description: "Create visual assets" },
  ];

  const currentStepIndex = steps.findIndex(step =>
    (step.id === "production-style" && selectedProductionStyle) ||
    (step.id === "creative-direction" && selectedStyleOption) ||
    (step.id === "scene-architecture" && false) || // Not implemented yet
    (step.id === "asset-development" && assets.generated.length > 0)
  );

  return (
    <div className="sticky top-4 bg-gray-800/30 rounded-xl border border-gray-600/50 backdrop-blur-sm">
      <div className="p-4 border-b border-gray-600/50">
        <h3 className="font-medium text-white flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Project Summary
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Production Style Summary */}
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
            selectedProductionStyle
              ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
              : "bg-gray-800 border-gray-700 text-gray-500"
          }`}>
            {selectedProductionStyle ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "1"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Production Style</div>
            {selectedProductionStyle ? (
              <div className="space-y-1">
                <div className="text-xs text-purple-300 font-medium">{selectedProductionStyle.name}</div>
                <div className="text-xs text-gray-400 truncate">{selectedProductionStyle.description}</div>
                <button
                  onClick={() => onNavigateToStep("production-style")}
                  className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Change selection
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Not selected</div>
            )}
          </div>
        </div>

        {/* Creative Direction Summary */}
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
            selectedStyleOption
              ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
              : "bg-gray-800 border-gray-700 text-gray-500"
          }`}>
            {selectedStyleOption ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "2"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Creative Direction</div>
            {selectedStyleOption ? (
              <div className="space-y-1">
                <div className="text-xs text-purple-300 font-medium">{selectedStyleOption.name}</div>
                <div className="flex gap-1 mt-1">
                  {selectedStyleOption.colorPalette.slice(0, 3).map((color: string, idx: number) => (
                    <div
                      key={idx}
                      className="w-3 h-3 rounded border border-gray-600 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => onNavigateToStep("creative-direction")}
                  className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Change selection
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Not selected</div>
            )}
          </div>
        </div>

        {/* Scene Architecture Summary */}
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
            false // Scene architecture not implemented yet
              ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
              : selectedStyleOption
              ? "bg-gray-700 border-gray-600 text-gray-400"
              : "bg-gray-800 border-gray-700 text-gray-500"
          }`}>
            {false ? ( // Scene architecture not implemented yet
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "3"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Scene Architecture</div>
            {selectedStyleOption ? (
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Ready to plan</div>
                <button
                  onClick={() => onNavigateToStep("scene-architecture")}
                  className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Start planning
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Not started</div>
            )}
          </div>
        </div>

        {/* Asset Development Summary */}
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
            assets.generated.length > 0
              ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
              : "bg-gray-800 border-gray-700 text-gray-500"
          }`}>
            {assets.generated.length > 0 ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "4"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Asset Development</div>
            {assets.generated.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs text-purple-300 font-medium">{assets.generated.length} Assets Generated</div>
                <div className="text-xs text-gray-400">Backgrounds, compositions, overlays</div>
                <button
                  onClick={() => onNavigateToStep("asset-development")}
                  className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  View assets
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Not started</div>
            )}
          </div>
        </div>
      </div>

      {/* Estimated Budget/Timeline */}
      <div className="border-t border-gray-600/50 p-4">
        <div className="text-xs text-gray-400 mb-2">Estimated Budget</div>
        <div className="text-lg font-semibold text-white">$12.50</div>
        <div className="text-xs text-gray-500">~3-4 minutes to complete</div>
      </div>
    </div>
  );
}