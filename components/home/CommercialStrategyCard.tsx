"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui";
import { ChatContainer } from "@/components/product-intelligence";
import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";

interface CommercialStrategyCardProps {
  dict: Dictionary;
  locale: Locale;
  onSendMessage: (message: string) => Promise<void>;
  onReset: () => void;
  onProceedToHandoff: () => void;
}

export default function CommercialStrategyCard({
  dict,
  locale,
  onSendMessage,
  onReset,
  onProceedToHandoff,
}: CommercialStrategyCardProps) {
  const {
    sessionId,
    messages,
    isConnected,
    isAgentTyping,
    showCommercialChat,
    chatInputMessage,
    analysis,
    analysisError,
    expandedSections,
    setShowCommercialChat,
    setChatInputMessage,
    toggleSection,
  } = useProductIntelligenceStore();

  // Scroll to chat section header instead of chat bottom
  const scrollToChatSection = useCallback(() => {
    const element = document.getElementById("product-intelligence-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    // chatSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle strategy confirmation
  const handleStrategyConfirmation = useCallback(
    async (confirmed: boolean) => {
      if (!sessionId) return;

      try {
        const response = await fetch("/api/agents/product-intelligence/chat/confirm-strategy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            messageId: messages[messages.length - 1]?.id || "latest",
            confirmed,
            locale,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to confirm strategy");
        }

        const result = await response.json();
        
        // Send the confirmation message as a regular chat message to update the UI
        await onSendMessage(result.data.message);
        
      } catch (error) {
        console.error("Strategy confirmation error:", error);
        // Could show error message to user here
      }
    },
    [sessionId, messages, locale, onSendMessage]
  );

  return (
    <Card variant="magical" id="commercial-strategy-card" glow className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {showCommercialChat
                ? dict.productIntelligence.chatAboutStrategyGeneric
                : dict.productIntelligence.commercialStrategy}
            </h3>
            <p className="text-gray-300 text-sm">
              {showCommercialChat
                ? dict.productIntelligence.askQuestionsStrategy
                : dict.productIntelligence.aiPoweredRecommendations}
            </p>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => {
              setShowCommercialChat(!showCommercialChat);
              setTimeout(() => scrollToChatSection(), 100); // Small delay for state update
            }}
            className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              showCommercialChat
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
            }`}
          >
            {showCommercialChat ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                {dict.productIntelligence.showStrategy}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {dict.productIntelligence.chatWithAI}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toggle between Strategy View and Chat */}
      {showCommercialChat ? (
        /* Chat Interface */
        <div className="h-[500px]">
          <ChatContainer
            sessionId={sessionId}
            messages={messages}
            isConnected={isConnected}
            isAgentTyping={isAgentTyping}
            onSendMessage={onSendMessage}
            onStrategyConfirmation={handleStrategyConfirmation}
            dict={dict}
            locale={locale}
            className="h-full"
            inputMessage={chatInputMessage}
            onInputMessageChange={setChatInputMessage}
            onScrollRequest={scrollToChatSection}
          />
        </div>
      ) : (
        /* Dynamic Strategy View */
        <div className="space-y-6">
          {/* Key Messages (Headline + Tagline) */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("keyMessages")}
              className="w-full p-4 text-left hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <h4 className="text-lg font-medium text-white flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm mr-3">
                    💬
                  </span>
                  {dict.productAnalysis.keyMessages}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    expandedSections.keyMessages ? "rotate-180" : ""
                  }`}
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
              </h4>
            </button>
            {expandedSections.keyMessages && (
              <div className="px-4 pb-4">
                <div className="space-y-3 text-gray-300">
                  {analysis?.commercialStrategy?.keyMessages ? (
                    <>
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-1">
                          {dict.productAnalysis.headline}
                        </h5>
                        <p className="text-red-400 font-medium">
                          "{analysis.commercialStrategy.keyMessages.headline}"
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-1">
                          {dict.productAnalysis.tagline}
                        </h5>
                        <p className="text-red-300">
                          {analysis.commercialStrategy.keyMessages.tagline}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">{dict.productAnalysis.analyzingKeyMessages}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Visual Style */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("visualStyle")}
              className="w-full p-4 text-left hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <h4 className="text-lg font-medium text-white flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm mr-3">
                    🎨
                  </span>
                  {dict.productAnalysis.visualStyle}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    expandedSections.visualStyle ? "rotate-180" : ""
                  }`}
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
              </h4>
            </button>
            {expandedSections.visualStyle && (
              <div className="px-4 pb-4">
                <div className="space-y-2 text-gray-300">
                  {analysis?.visualPreferences ? (
                    <>
                      <div className="flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.style} </span>
                          <span className="capitalize">
                            {analysis.visualPreferences.overallStyle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.mood} </span>
                          <span className="capitalize">{analysis.visualPreferences.mood}</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.lighting} </span>
                          <span className="capitalize">{analysis.visualPreferences.lighting}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">{dict.productAnalysis.analyzingVisualStyle}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Narrative Structure */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("narrativeStructure")}
              className="w-full p-4 text-left hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <h4 className="text-lg font-medium text-white flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm mr-3">
                    📝
                  </span>
                  {dict.productAnalysis.narrativeStructure}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    expandedSections.narrativeStructure ? "rotate-180" : ""
                  }`}
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
              </h4>
            </button>
            {expandedSections.narrativeStructure && (
              <div className="px-4 pb-4">
                <div className="space-y-2 text-gray-300">
                  {analysis?.commercialStrategy?.storytelling ? (
                    <>
                      <div className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.narrative} </span>
                          <span>{analysis.commercialStrategy.storytelling.narrative}</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.conflict} </span>
                          <span>{analysis.commercialStrategy.storytelling.conflict}</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.resolution} </span>
                          <span>{analysis.commercialStrategy.storytelling.resolution}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">
                      {dict.productAnalysis.analyzingNarrativeStructure}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Key Scenes */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("keyScenes")}
              className="w-full p-4 text-left hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <h4 className="text-lg font-medium text-white flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm mr-3">
                    📍
                  </span>
                  {dict.productAnalysis.keyScenes}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    expandedSections.keyScenes ? "rotate-180" : ""
                  }`}
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
              </h4>
            </button>
            {expandedSections.keyScenes && (
              <div className="px-4 pb-4">
                <div className="space-y-2 text-gray-300">
                  {analysis?.commercialStrategy?.keyScenes ? (
                    <>
                      {analysis.commercialStrategy.keyScenes.scenes.map((scene, index) => (
                        <div key={scene.id || index} className="flex items-start">
                          <span className="text-green-400 mr-2">•</span>
                          <div>
                            <span className="font-medium text-green-300">
                              {scene.title}
                              {scene.duration && (
                                <span className="text-xs text-gray-400 ml-1">({scene.duration})</span>
                              )}
                            </span>
                            <br />
                            <span>{scene.description}</span>
                            {scene.purpose && (
                              <div className="text-xs text-gray-400 mt-1 italic">
                                Purpose: {scene.purpose}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-gray-500">{dict.productAnalysis.analyzingKeyScenes}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Music & Tone */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("musicTone")}
              className="w-full p-4 text-left hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <h4 className="text-lg font-medium text-white flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm mr-3">
                    🎵
                  </span>
                  {dict.productAnalysis.musicTone}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    expandedSections.musicTone ? "rotate-180" : ""
                  }`}
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
              </h4>
            </button>
            {expandedSections.musicTone && (
              <div className="px-4 pb-4">
                <div className="space-y-2 text-gray-300">
                  {analysis?.visualPreferences ? (
                    <>
                      <div className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.mood} </span>
                          <span className="capitalize">
                            {analysis.visualPreferences.mood} atmosphere
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        <div>
                          <span className="font-medium">{dict.productAnalysis.composition} </span>
                          <span className="capitalize">
                            {analysis.visualPreferences.composition} presentation
                          </span>
                        </div>
                      </div>
                      {analysis.positioning?.brandPersonality && (
                        <div className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          <div>
                            <span className="font-medium">{dict.productAnalysis.brandTone} </span>
                            <span className="capitalize">
                              {analysis.positioning.brandPersonality.tone}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">{dict.productAnalysis.analyzingMusicTone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons - Only show in Strategy View */}
      {!showCommercialChat && (
        <div className="mt-8 space-y-4">
          {/* Error Message */}
          {analysisError?.canProceed === false && (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>{dict.productIntelligence.cannotProceed}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onReset}
              className="cursor-pointer px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-medium hover:border-gray-500 hover:text-white transition-colors"
            >
              {dict.productIntelligence.startOver}
            </button>
            <button
              onClick={onProceedToHandoff}
              disabled={analysisError?.canProceed === false}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                analysisError?.canProceed === false
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-50"
                  : "cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transform hover:scale-105"
              }`}
            >
              {dict.productIntelligence.proceedToCreativeDirector}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
