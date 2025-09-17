"use client";

import React from "react";
import { useVideoProducerStore, VideoProducerWorkflowStep } from "@/lib/stores/video-producer-store";
import type { Dictionary } from "@/lib/dictionaries";

interface VideoProducerProgressProps {
  onNavigateToStep: (step: VideoProducerWorkflowStep) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  dict: Dictionary;
  locale?: "en" | "ja";
}

export default function VideoProducerProgress({
  onNavigateToStep,
  expanded = true,
  onToggleExpanded,
  dict,
  locale = "en",
}: VideoProducerProgressProps) {
  const {
    selectedNarrativeStyle,
    selectedMusicGenre,
    completedSteps,
    isProducing,
    productionProgress,
    finalVideoUrl
  } = useVideoProducerStore();

  const t = dict.videoProducer;

  const steps = [
    {
      id: "narrative-style",
      label: t.steps.narrativeStyle,
      description: t.narrativeStyleSelection.description,
      completed: completedSteps.narrativeStyle,
    },
    {
      id: "music-tone",
      label: t.steps.musicTone,
      description: t.musicSelection.description,
      completed: completedSteps.musicTone,
    },
    {
      id: "final-production",
      label: t.steps.finalProduction,
      description: t.finalProduction.description,
      completed: completedSteps.finalProduction,
    },
  ];

  const currentStepIndex = steps.findIndex((step) =>
    (step.id === "narrative-style" && !completedSteps.narrativeStyle) ||
    (step.id === "music-tone" && completedSteps.narrativeStyle && !completedSteps.musicTone) ||
    (step.id === "final-production" && completedSteps.musicTone && !completedSteps.finalProduction)
  );

  return (
    <div className="bg-gray-800/30 rounded-xl border border-gray-600/50 backdrop-blur-sm">
      <div className="p-4 border-b border-gray-600/50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Video Production Progress
          </h3>
          {onToggleExpanded && (
            <button
              onClick={onToggleExpanded}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className={`p-4 transition-all duration-300 ${expanded ? "space-y-4" : "space-y-3"}`}>
          {/* Narrative Style Summary */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
                completedSteps.narrativeStyle
                  ? "bg-gradient-to-r from-red-500 to-orange-500 border-red-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-500"
              }`}
            >
              {completedSteps.narrativeStyle ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                "1"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{t.steps.narrativeStyle}</div>
              {selectedNarrativeStyle ? (
                <div className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}>
                  <div className="text-xs text-red-300 font-medium">
                    {selectedNarrativeStyle.name}
                  </div>
                  {expanded && (
                    <div className="text-xs text-gray-400 truncate">
                      {selectedNarrativeStyle.description}
                    </div>
                  )}
                  <button
                    onClick={() => onNavigateToStep(VideoProducerWorkflowStep.NARRATIVE_STYLE)}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    {expanded ? "Change Selection" : "Change"}
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Not Selected</div>
              )}
            </div>
          </div>

          {/* Music Genre Summary */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
                completedSteps.musicTone
                  ? "bg-gradient-to-r from-red-500 to-orange-500 border-red-500 text-white"
                  : completedSteps.narrativeStyle
                    ? "bg-gray-700 border-gray-600 text-gray-400"
                    : "bg-gray-800 border-gray-700 text-gray-500"
              }`}
            >
              {completedSteps.musicTone ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                "2"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{t.steps.musicTone}</div>
              {selectedMusicGenre ? (
                <div className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}>
                  <div className="text-xs text-red-300 font-medium">
                    {selectedMusicGenre.name}
                  </div>
                  {expanded && (
                    <div className="text-xs text-gray-400 truncate">
                      {selectedMusicGenre.description}
                    </div>
                  )}
                  <button
                    onClick={() => onNavigateToStep(VideoProducerWorkflowStep.MUSIC_TONE)}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    {expanded ? "Change Selection" : "Change"}
                  </button>
                </div>
              ) : completedSteps.narrativeStyle ? (
                <div className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}>
                  {expanded && <div className="text-xs text-gray-400">Ready to Select Music</div>}
                  <button
                    onClick={() => onNavigateToStep(VideoProducerWorkflowStep.MUSIC_TONE)}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    {expanded ? "Select Music Genre" : "Select"}
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Not Started</div>
              )}
            </div>
          </div>

          {/* Final Production Summary */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
                completedSteps.finalProduction || finalVideoUrl
                  ? "bg-gradient-to-r from-red-500 to-orange-500 border-red-500 text-white"
                  : completedSteps.musicTone
                    ? "bg-gray-700 border-gray-600 text-gray-400"
                    : "bg-gray-800 border-gray-700 text-gray-500"
              }`}
            >
              {completedSteps.finalProduction || finalVideoUrl ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                "3"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{t.steps.finalProduction}</div>
              {finalVideoUrl ? (
                <div className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}>
                  <div className="text-xs text-green-300 font-medium">Video Complete!</div>
                  {expanded && (
                    <div className="text-xs text-gray-400">Ready for download</div>
                  )}
                  <button
                    onClick={() => onNavigateToStep(VideoProducerWorkflowStep.FINAL_PRODUCTION)}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    {expanded ? "View Video" : "View"}
                  </button>
                </div>
              ) : isProducing ? (
                <div className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}>
                  <div className="text-xs text-red-300 font-medium">Producing... {Math.round(productionProgress)}%</div>
                  {expanded && (
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${productionProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : completedSteps.musicTone ? (
                <div className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}>
                  {expanded && <div className="text-xs text-gray-400">Ready to Start Production</div>}
                  <button
                    onClick={() => onNavigateToStep(VideoProducerWorkflowStep.FINAL_PRODUCTION)}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    {expanded ? "Start Production" : "Start"}
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Not Started</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estimated Budget/Timeline */}
      {expanded && (
        <div className={`border-t border-gray-600/50 p-4 transition-all duration-300 ${expanded ? "space-y-2" : "space-y-1"}`}>
          <div className="text-xs text-gray-400 mb-2">
            {expanded ? "Estimated Production Cost" : "Cost"}
          </div>
          <div className={`font-semibold text-white ${expanded ? "text-lg" : "text-base"}`}>
            $2.50
          </div>
          {expanded && <div className="text-xs text-gray-500">Est. 5-8 minutes</div>}
        </div>
      )}
    </div>
  );
}