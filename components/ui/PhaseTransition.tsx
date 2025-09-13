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

const PHASE_TITLES: Record<AppPhase, string> = {
  'product-input': 'Product Input',
  'maya-analysis': 'Maya Analysis',
  'maya-strategy': 'Commercial Strategy',
  'david-creative': 'Creative Direction',
  'alex-production': 'Video Production',
  'completed': 'Complete'
};

export default function PhaseTransition({
  from,
  to,
  dict,
  show,
  onComplete
}: PhaseTransitionProps) {
  const [stage, setStage] = useState<'enter' | 'handoff' | 'exit'>('enter');

  useEffect(() => {
    if (!show) return;

    const timeline = async () => {
      // Stage 1: Enter animation
      setStage('enter');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 2: Show handoff
      setStage('handoff');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 3: Exit animation
      setStage('exit');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete transition
      onComplete();
    };

    timeline();
  }, [show, onComplete]);

  if (!show) return null;

  const fromAgent = PHASE_AGENTS[from];
  const toAgent = PHASE_AGENTS[to];

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-500 ${
      stage === 'exit' ? 'opacity-0' : 'opacity-100'
    }`}>
      <div className={`bg-gradient-to-br from-purple-900/90 via-purple-800/80 to-pink-900/90 backdrop-blur-md rounded-xl border border-purple-500/30 p-8 max-w-md w-full mx-4 transform transition-all duration-500 ${
        stage === 'enter' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>

        {stage === 'handoff' && (
          <div className="text-center space-y-6">
            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-4">
              {dict.common?.handoffComplete || 'Handoff Complete'}
            </h3>

            {/* Agent Handoff Animation */}
            <div className="flex items-center justify-center space-x-4">
              {/* From Agent */}
              <div className="flex flex-col items-center space-y-2">
                {fromAgent !== 'user' && fromAgent !== 'system' && (
                  <AgentAvatar
                    agent={fromAgent as any}
                    size="lg"
                    state="idle"
                  />
                )}
                <span className="text-sm text-purple-200 font-medium">
                  {PHASE_TITLES[from]}
                </span>
              </div>

              {/* Handoff Arrow */}
              <div className="flex-1 relative">
                <div className="h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 opacity-60"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-sm">✨</span>
                  </div>
                </div>
              </div>

              {/* To Agent */}
              <div className="flex flex-col items-center space-y-2">
                {toAgent !== 'user' && toAgent !== 'system' && (
                  <AgentAvatar
                    agent={toAgent as any}
                    size="lg"
                    state="thinking"
                  />
                )}
                <span className="text-sm text-pink-200 font-medium">
                  {PHASE_TITLES[to]}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-purple-200 text-sm">
              {toAgent === 'david' && 'David will create stunning visual direction for your commercial'}
              {toAgent === 'alex' && 'Alex will produce your final commercial video'}
              {toAgent === 'maya' && 'Maya is analyzing your product'}
            </p>
          </div>
        )}

        {stage === 'enter' && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-purple-200 text-sm mt-4">Preparing handoff...</p>
          </div>
        )}
      </div>
    </div>
  );
}