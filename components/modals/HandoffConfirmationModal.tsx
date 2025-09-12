"use client";

import { useState, useCallback } from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { ProductAnalysis } from "@/lib/agents/product-intelligence/types";
import AgentAvatar from "../ui/AgentAvatar";

interface HandoffConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  analysis: ProductAnalysis | null;
  sessionId: string;
  dict: Dictionary;
  locale: Locale;
}

// Color mapping to ensure Tailwind includes these classes
const COLOR_MAP = {
  blue: 'bg-blue-400',
  green: 'bg-green-400', 
  purple: 'bg-purple-400',
  red: 'bg-red-400',
  yellow: 'bg-yellow-400',
  pink: 'bg-pink-400'
} as const;

export default function HandoffConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  analysis,
  sessionId,
  dict,
  locale,
}: HandoffConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { initializeFromMayaHandoff } = useCreativeDirectorStore();

  const handleConfirmHandoff = useCallback(async () => {
    if (!sessionId || !analysis) return;

    setIsProcessing(true);

    try {
      // Initialize Creative Director with Maya's analysis
      const creativeDirectorSessionId = crypto.randomUUID();

      // Call the Creative Director API to initialize handoff
      const response = await fetch("/api/agents/creative-director", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: creativeDirectorSessionId,
          action: "initialize",
          locale,
          data: {
            mayaHandoffData: {
              mayaSessionId: sessionId,
              productAnalysis: analysis,
              handoffTimestamp: Date.now(),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize Creative Director");
      }

      const result = await response.json();

      // Initialize the Creative Director store
      initializeFromMayaHandoff({
        sessionId: creativeDirectorSessionId,
        mayaContext: analysis,
        locale,
      });

      // Close modal and notify success
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Creative Director handoff failed:", error);
      // Could show error toast here
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, analysis, locale, initializeFromMayaHandoff, onClose, onSuccess]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="backdrop-blur-sm">
      {/* Magical Header with Gradient */}
      <div className="relative bg-gradient-to-br from-purple-900/90 via-purple-800/80 to-pink-900/90 backdrop-blur-md rounded-t-lg border-b border-purple-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse"></div>
        <div className="relative p-6">
          <div className="flex items-center gap-4">
            {/* Animated Creative Director Avatar */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl">🎨</span>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <span>{dict.productIntelligence.confirmHandoff}</span>
              </h2>
              <p className="text-purple-200 text-sm">
                {dict.productIntelligence.handoffToCreativeDirector}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="cursor-pointer w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 flex items-center justify-center disabled:opacity-50 -mt-10"
              title={dict.common.close}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Glass Effect */}
      <div className="bg-gray-900/95 backdrop-blur-md p-6 space-y-6">
        {/* Description */}
        <div className="text-center space-y-4">
          <p className="text-gray-300 text-lg leading-relaxed">
            {dict.productIntelligence.handoffDescription}
          </p>

          {/* Maya to David Flow Visualization */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex flex-col items-center">
              <AgentAvatar agent="maya" size="md" state="idle" />
              <span className="text-xs text-blue-400 mt-1 font-medium">Maya</span>
            </div>

            <div className="flex-1 relative h-16 flex items-center">
              {/* Base connection line */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60"></div>
              </div>

              {/* Data stream animation - flowing elements */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-80 animate-pulse"
                    style={{
                      left: `${i * 20}%`,
                      animationDelay: `${i * 400}ms`,
                      animationDuration: "2s",
                      animation: `slideRight 2s infinite linear ${i * 400}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Handshake icon in the center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 animate-bounce">
                  <span className="text-lg">🤝🏻</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-md opacity-40"></div>
                </div>
              </div>
            </div>

            {/* CSS animation styles */}
            <style jsx>{`
              @keyframes slideRight {
                0% {
                  transform: translateX(-100%);
                  opacity: 0;
                }
                20% {
                  opacity: 1;
                }
                80% {
                  opacity: 1;
                }
                100% {
                  transform: translateX(400%);
                  opacity: 0;
                }
              }
            `}</style>

            <div className="flex flex-col items-center">
              <AgentAvatar agent="david" size="md" state="idle" />
              <span className="text-xs text-purple-400 mt-1 font-medium">David</span>
            </div>
          </div>
        </div>

        {/* Transfer Summary with Enhanced Design */}
        {analysis && (
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 space-y-4">
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              {dict.productIntelligence.transferSummary}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { color: "blue", icon: "📊", label: dict.productAnalysis.productInsights },
                { color: "green", icon: "👥", label: dict.productAnalysis.targetAudience },
                { color: "purple", icon: "🎨", label: dict.productAnalysis.visualStyle },
                { color: "red", icon: "💬", label: dict.productAnalysis.keyMessages },
                { color: "yellow", icon: "📝", label: dict.productAnalysis.narrativeStructure },
                { color: "pink", icon: "🎬", label: dict.productAnalysis.keyScenes },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 hover:bg-gray-700/40 transition-colors duration-200"
                >
                  <div className="text-lg">{item.icon}</div>
                  <span className="text-gray-300 text-sm font-medium">{item.label}</span>
                  <div
                    className={`ml-auto w-2 h-2 rounded-full animate-pulse ${COLOR_MAP[item.color as keyof typeof COLOR_MAP]}`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-purple-200 font-medium">
              {dict.productIntelligence.initializing}
            </span>
            <div className="ml-auto flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Glass Effect */}
      <div className="bg-gray-800/95 backdrop-blur-md rounded-b-lg border-t border-gray-700/50 p-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="cursor-pointer px-6 py-2.5 text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/30"
          >
            {dict.productIntelligence.reviewMore}
          </button>

          <button
            onClick={handleConfirmHandoff}
            disabled={isProcessing || !analysis}
            className="cursor-pointer px-8 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {dict.productIntelligence.initializing}
              </>
            ) : (
              <>
                <span>{dict.productIntelligence.proceedToNextAgent}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
