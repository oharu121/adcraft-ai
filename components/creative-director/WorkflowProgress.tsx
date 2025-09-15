"use client";

import React from "react";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import { WorkflowStep } from "@/lib/agents/creative-director/enums";
import type { Dictionary } from "@/lib/dictionaries";

interface WorkflowProgressProps {
  onNavigateToStep: (step: WorkflowStep) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  dict: Dictionary;
  locale?: "en" | "ja";
}

export default function WorkflowProgress({
  onNavigateToStep,
  expanded = true,
  onToggleExpanded,
  dict,
  locale = "en",
}: WorkflowProgressProps) {
  const {
    selectedProductionStyle,
    selectedStyleOption,
    assets,
    completedSteps,
  } = useCreativeDirectorStore();

  const t = dict.creativeDirector.workflowProgress;

  const steps = [
    {
      id: "production-style",
      label: t.steps.productionStyle.label,
      description: t.steps.productionStyle.description
    },
    {
      id: "creative-direction",
      label: t.steps.creativeDirection.label,
      description: t.steps.creativeDirection.description,
    },
    {
      id: "scene-architecture",
      label: t.steps.sceneArchitecture.label,
      description: t.steps.sceneArchitecture.description
    },
  ];

  const currentStepIndex = steps.findIndex(step =>
    (step.id === "production-style" && completedSteps.productionStyle) ||
    (step.id === "creative-direction" && completedSteps.creativeDirection) ||
    (step.id === "scene-architecture" && completedSteps.sceneArchitecture)
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
                d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
{t.title}
          </h3>
          {onToggleExpanded && (
            <button
              onClick={onToggleExpanded}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50"
              aria-label={expanded ? t.accessibility.collapse : t.accessibility.expand}
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
          {/* Production Style Summary */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
                completedSteps.productionStyle
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-500"
              }`}
            >
              {completedSteps.productionStyle ? (
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
              <div className="text-sm font-medium text-white">Production Style</div>
              {selectedProductionStyle ? (
                <div
                  className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}
                >
                  <div className="text-xs text-purple-300 font-medium">
                    {selectedProductionStyle.name}
                  </div>
                  {expanded && (
                    <div className="text-xs text-gray-400 truncate">
                      {selectedProductionStyle.description}
                    </div>
                  )}
                  <button
                    onClick={() => onNavigateToStep(WorkflowStep.PRODUCTION_STYLE)}
                    className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
{expanded ? t.actions.changeSelection : t.actions.change}
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">{t.status.notSelected}</div>
              )}
            </div>
          </div>

          {/* Creative Direction Summary */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
                completedSteps.creativeDirection
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-500"
              }`}
            >
              {completedSteps.creativeDirection ? (
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
              <div className="text-sm font-medium text-white">Creative Direction</div>
              {selectedStyleOption ? (
                <div
                  className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}
                >
                  <div className="text-xs text-purple-300 font-medium">
                    {selectedStyleOption.name}
                  </div>
                  {expanded && (
                    <div className="flex gap-1 mt-1">
                      {selectedStyleOption.colorPalette
                        .slice(0, 3)
                        .map((color: string, idx: number) => (
                          <div
                            key={idx}
                            className="w-3 h-3 rounded border border-gray-600 flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                    </div>
                  )}
                  <button
                    onClick={() => onNavigateToStep(WorkflowStep.CREATIVE_DIRECTION)}
                    className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
{expanded ? t.actions.changeSelection : t.actions.change}
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">{t.status.notSelected}</div>
              )}
            </div>
          </div>

          {/* Scene Architecture Summary */}
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
                completedSteps.sceneArchitecture
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white"
                  : completedSteps.creativeDirection
                    ? "bg-gray-700 border-gray-600 text-gray-400"
                    : "bg-gray-800 border-gray-700 text-gray-500"
              }`}
            >
              {completedSteps.sceneArchitecture ? (
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
              <div className="text-sm font-medium text-white">Scene Architecture</div>
              {completedSteps.sceneArchitecture ? (
                <div
                  className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}
                >
                  <div className="text-xs text-purple-300 font-medium">{t.status.completed}</div>
                  {expanded && (
                    <div className="text-xs text-gray-400">{t.status.readyForProduction}</div>
                  )}
                  <button
                    onClick={() => onNavigateToStep(WorkflowStep.SCENE_ARCHITECTURE)}
                    className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
{expanded ? t.actions.reviewScenes : t.actions.review}
                  </button>
                </div>
              ) : completedSteps.creativeDirection ? (
                <div
                  className={`transition-all duration-300 ${expanded ? "space-y-1" : "space-y-0.5"}`}
                >
                  {expanded && <div className="text-xs text-gray-400">{t.status.readyToPlan}</div>}
                  <button
                    onClick={() => onNavigateToStep(WorkflowStep.SCENE_ARCHITECTURE)}
                    className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
{expanded ? t.actions.startPlanning : t.actions.start}
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">{t.status.notStarted}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estimated Budget/Timeline */}
      {expanded && (
        <div
          className={`border-t border-gray-600/50 p-4 transition-all duration-300 ${
            expanded ? "space-y-2" : "space-y-1"
          }`}
        >
          <div className="text-xs text-gray-400 mb-2">
            {expanded ? t.budget.title : t.budget.titleShort}
          </div>
          <div className={`font-semibold text-white ${expanded ? "text-lg" : "text-base"}`}>
            $8.50
          </div>
          {expanded && <div className="text-xs text-gray-500">{t.budget.timeEstimate}</div>}
        </div>
      )}
    </div>
  );
}