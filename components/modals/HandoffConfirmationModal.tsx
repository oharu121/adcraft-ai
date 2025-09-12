"use client";

import { useState, useCallback } from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { ProductAnalysis } from "@/lib/agents/product-intelligence/types";

interface HandoffConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  analysis: ProductAnalysis | null;
  sessionId: string;
  dict: Dictionary;
  locale: Locale;
}

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
      const response = await fetch('/api/agents/creative-director', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: creativeDirectorSessionId,
          action: 'initialize',
          mayaSessionId: sessionId,
          mayaAnalysis: analysis,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize Creative Director');
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
      console.error('Creative Director handoff failed:', error);
      // Could show error toast here
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, analysis, locale, initializeFromMayaHandoff, onClose, onSuccess]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Proceed to Creative Director"
    >
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              {dict.productIntelligence.proceedToCreativeDirector}
            </h3>
            <p className="text-gray-400 text-sm">
              {dict.productIntelligence.handoffToCreativeDirector}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalContent className="py-6">
        <div className="space-y-4">
          <p className="text-gray-300">
            Ready to transfer your product strategy to David, our Creative Director? He'll transform your insights into compelling visual direction for video production.
          </p>
          
          {analysis && (
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-white text-sm">
                What's being transferred:
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Product Insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Target Audience</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Visual Style</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-gray-300">Key Messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">Narrative Structure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-gray-300">Key Scenes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={isProcessing}
          >
            Review More
          </button>
          <button
            onClick={handleConfirmHandoff}
            disabled={isProcessing || !analysis}
            className="cursor-pointer px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Initializing...
              </>
            ) : (
              dict.productIntelligence.proceedToCreativeDirector
            )}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}