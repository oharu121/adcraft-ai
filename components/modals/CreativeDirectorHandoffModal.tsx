"use client";

import { useState, useCallback } from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui";
// Note: Video Producer store not implemented yet
// import { useVideoProducerStore } from "@/lib/stores/video-producer-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { CreativeDirection } from "@/lib/agents/creative-director/types/asset-types";
import AgentAvatar from "../ui/AgentAvatar";

interface CreativeDirectorHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  creativeDirection: CreativeDirection | null;
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

export default function CreativeDirectorHandoffModal({
  isOpen,
  onClose,
  onSuccess,
  creativeDirection,
  sessionId,
  dict,
  locale,
}: CreativeDirectorHandoffModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  // TODO: Use Video Producer store when implemented
  // const { initializeFromCreativeDirectorHandoff } = useVideoProducerStore();

  const handleConfirmHandoff = useCallback(async () => {
    if (!sessionId || !creativeDirection) return;

    setIsProcessing(true);

    try {
      // Initialize Video Producer with Creative Director's output
      const videoProducerSessionId = crypto.randomUUID();

      // Call the Video Producer API to initialize handoff
      const response = await fetch("/api/agents/video-producer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: videoProducerSessionId,
          action: "initialize",
          locale,
          data: {
            creativeDirectorHandoffData: {
              creativeDirectorSessionId: sessionId,
              creativeDirection: creativeDirection,
              handoffTimestamp: Date.now(),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize Video Producer");
      }

      const result = await response.json();
      console.log('[Creative Director Handoff] Video Producer initialized:', result);

      // TODO: Initialize Video Producer store when implemented
      // if (initializeFromVideoProducerHandoff) {
      //   initializeFromVideoProducerHandoff({
      //     sessionId: videoProducerSessionId,
      //     creativeDirection: creativeDirection,
      //     locale,
      //   });
      // }

      // Close modal and notify success
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Video Producer handoff failed:", error);
      // Could show error toast here
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, creativeDirection, locale, onClose, onSuccess]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="backdrop-blur-sm">
      {/* Magical Header with Gradient */}
      <div className="relative bg-gradient-to-br from-red-900/90 via-red-800/80 to-orange-900/90 backdrop-blur-md rounded-t-lg border-b border-red-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 animate-pulse"></div>
        <div className="relative p-6">
          <div className="flex items-center gap-4">
            {/* Animated Video Producer Avatar */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl">🎬</span>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <span>{dict.creativeDirector.confirmHandoff}</span>
              </h2>
              <p className="text-red-200 text-sm">{dict.creativeDirector.handoffToVideoProducer}</p>
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
        <div className="space-y-4">
          <p className="text-gray-300 text-lg leading-relaxed">
            {dict.creativeDirector.handoffDescription}
          </p>

          {/* David to Zara Flow Visualization */}
          <div className="relative py-4 space-y-2">
            {/* Container for avatars and handover animation - perfectly aligned */}
            <div className="flex items-center justify-center gap-4">
              {/* David Avatar */}
              <div className="flex items-center">
                <AgentAvatar agent="david" size="md" state="idle" />
              </div>

              {/* Handover Animation Container - aligned to avatar center */}
              <div className="flex-1 relative flex items-center" style={{ height: "48px" }}>
                {/* Base connection line */}
                <div className="absolute inset-0 flex items-center">
                  <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 via-red-500 to-orange-500 opacity-60"></div>
                </div>

                {/* Modern SaaS Style - Flowing Progress Dots */}
                <div className="absolute inset-0 flex items-center overflow-hidden">
                  {/* Progress dots flowing from David to Zara */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`progress-dot-${i}`}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${i * 12.5}%`,
                        animationDelay: `${i * 300}ms`,
                        animationDuration: "2.4s",
                        animation: `slideRight 2.4s infinite ease-in-out ${i * 300}ms`,
                        background: `linear-gradient(45deg,
                          ${i < 2 ? "#8B5CF6" : i < 4 ? "#EC4899" : i < 6 ? "#EF4444" : "#F97316"},
                          ${i < 2 ? "#A78BFA" : i < 4 ? "#F472B6" : i < 6 ? "#F87171" : "#FB923C"})`,
                        opacity: 0.8,
                        boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)",
                      }}
                    />
                  ))}

                  {/* Secondary wave of smaller dots for depth */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`small-dot-${i}`}
                      className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-300 to-orange-300"
                      style={{
                        left: `${i * 20 + 10}%`,
                        animationDelay: `${i * 400 + 150}ms`,
                        animationDuration: "2.6s",
                        animation: `slideRight 2.6s infinite ease-in-out ${i * 400 + 150}ms`,
                        opacity: 0.6,
                      }}
                    />
                  ))}

                  {/* Status indicator dots (static positions) */}
                  <div className="absolute inset-0 flex items-center justify-between px-8">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={`status-${i}`}
                        className="w-1 h-1 rounded-full bg-gray-400/30"
                        style={{
                          animation: `statusPulse 2s infinite ease-in-out ${i * 400}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Handshake icon in the center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-3/8">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 animate-bounce">
                    <span className="text-lg">🤝🏻</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-md opacity-40"></div>
                  </div>
                </div>
              </div>

              {/* Zara Avatar */}
              <div className="flex items-center">
                <AgentAvatar agent="zara" size="md" state="idle" />
              </div>
            </div>

            {/* Agent Names Below - Matching avatar container structure */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center justify-center" style={{ width: "48px" }}>
                <span className="text-xs text-purple-400 font-medium">David</span>
              </div>
              <div className="flex-1"></div>
              <div className="flex items-center justify-center" style={{ width: "48px" }}>
                <span className="text-xs text-red-400 font-medium">Zara</span>
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

              @keyframes statusPulse {
                0%,
                100% {
                  opacity: 0.3;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.8;
                  transform: scale(1.5);
                  background: linear-gradient(45deg, #ef4444, #f97316);
                }
              }
            `}</style>
          </div>
        </div>

        {/* Transfer Summary with Enhanced Design */}
        {creativeDirection && (
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 space-y-4">
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-orange-400 rounded-full"></div>
              {dict.creativeDirector.transferSummary}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { color: "purple", icon: "🎨", label: dict.creativeDirector.visualStrategy },
                { color: "red", icon: "🎬", label: dict.creativeDirector.sceneComposition },
                { color: "blue", icon: "🎯", label: dict.creativeDirector.creativeDirection },
                { color: "yellow", icon: "⚡", label: dict.creativeDirector.productionReady },
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
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-red-200 font-medium">{dict.creativeDirector.initializing}</span>
            <div className="ml-auto flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
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
            {dict.creativeDirector.reviewMore}
          </button>

          <button
            onClick={handleConfirmHandoff}
            disabled={isProcessing || !creativeDirection}
            className="magical-button cursor-pointer px-8 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {dict.creativeDirector.initializing}
              </>
            ) : (
              <>
                <span>{dict.creativeDirector.proceedToVideoProducer}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}