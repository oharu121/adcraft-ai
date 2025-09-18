"use client";

import { useEffect, useState } from "react";
import { AppPhase, PHASE_AGENTS } from "@/lib/types/app-phases";
import AgentAvatar from "@/components/ui/AgentAvatar";
import type { Dictionary } from "@/lib/dictionaries";

interface PhaseTransitionProps {
  from: AppPhase;
  to: AppPhase;
  dict: Dictionary;
  show: boolean;
  onComplete: () => void;
}

const getPhaseTitles = (dict: Dictionary): Record<AppPhase, string> => ({
  "product-input": dict.common.phaseTransitions.productInput,
  "maya-analysis": dict.common.phaseTransitions.mayaAnalysis,
  "maya-strategy": dict.common.phaseTransitions.commercialStrategy,
  "david-creative": dict.common.phaseTransitions.creativeDirection,
  "zara-production": dict.common.phaseTransitions.videoProduction,
  completed: dict.common.phaseTransitions.complete,
});

export default function PhaseTransition({
  from,
  to,
  dict,
  show,
  onComplete,
}: PhaseTransitionProps) {
  const [stage, setStage] = useState<"enter" | "handoff" | "exit">("enter");

  useEffect(() => {
    if (!show) return;

    const timeline = async () => {
      // Stage 1: Enter animation
      setStage("enter");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Stage 2: Show handoff
      setStage("handoff");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Stage 3: Exit animation
      setStage("exit");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Complete transition
      onComplete();
    };

    timeline();
  }, [show, onComplete]);

  if (!show) return null;

  const fromAgent = PHASE_AGENTS[from];
  const toAgent = PHASE_AGENTS[to];
  const PHASE_TITLES = getPhaseTitles(dict);

  const getHandoffMessage = () => {
    if (toAgent === "zara" && fromAgent === "maya") {
      return dict.common.handoffMessages.mayaToZara;
    }
    if (toAgent === "david" && fromAgent === "maya") {
      return dict.common.handoffMessages.mayaToDavid;
    }
    if (toAgent === "zara" && fromAgent === "david") {
      return dict.common.handoffMessages.davidToZara;
    }
    if (toAgent === "david" && fromAgent !== "maya") {
      return dict.common.handoffMessages.davidAnalysis;
    }
    if (toAgent === "zara") {
      return dict.common.handoffMessages.zaraProduction;
    }
    if (toAgent === "maya") {
      return dict.common.handoffMessages.mayaAnalysis;
    }
    return "";
  };

  return (
    <div
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-500 ${
        stage === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`bg-gradient-to-br from-purple-900/90 via-purple-800/80 to-pink-900/90 backdrop-blur-md rounded-xl border border-purple-500/30 p-8 max-w-lg w-full mx-4 transform transition-all duration-500 ${
          stage === "enter" ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {stage === "handoff" && (
          <div className="text-center space-y-6">
            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-4">
              {dict.common?.handoffComplete || "Handoff Complete"}
            </h3>

            {/* Agent Handoff Animation */}
            <div className="flex items-center justify-center space-x-8">
              {/* From Agent */}
              <div className="flex flex-col items-center space-y-2 min-w-0">
                {fromAgent !== "user" && fromAgent !== "system" && (
                  <AgentAvatar agent={fromAgent as any} size="lg" state="idle" />
                )}
                <span className="text-sm text-purple-200 font-medium text-center">{PHASE_TITLES[from]}</span>
              </div>

              {/* Handoff Arrow - Fixed width */}
              <div className="w-24 relative">
                <div className="h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 opacity-60"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-sm">✨</span>
                  </div>
                </div>
              </div>

              {/* To Agent */}
              <div className="flex flex-col items-center space-y-2 min-w-0">
                {toAgent !== "user" && toAgent !== "system" && (
                  <AgentAvatar agent={toAgent as any} size="lg" state="thinking" />
                )}
                <span className="text-sm text-pink-200 font-medium text-center">{PHASE_TITLES[to]}</span>
              </div>
            </div>

            {/* Description - Moved below for better layout */}
            <div className="text-center">
              <p className="text-purple-200 text-sm leading-relaxed max-w-sm mx-auto">
                {getHandoffMessage()}
              </p>
            </div>
          </div>
        )}

        {stage === "enter" && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-purple-200 text-sm mt-4">{dict.common.preparingHandoff}</p>
          </div>
        )}
      </div>
    </div>
  );
}
