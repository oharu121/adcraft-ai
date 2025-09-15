"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import AgentAvatar from "@/components/ui/AgentAvatar";
import CreativeChatContainer from "@/components/creative-director/CreativeChatContainer";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import {
  CreativePhase,
  SessionStatus,
  AssetType,
  AssetStatus,
} from "@/lib/agents/creative-director/enums";

interface CreativeDirectorCardProps {
  dict: Dictionary;
  locale: Locale;
  onScrollToChatSection?: () => void;
}

type WorkflowStep = 'style-selection' | 'scene-planning' | 'asset-generation';

export default function ImprovedCreativeDirectorCard({
  dict,
  locale = "en",
  onScrollToChatSection,
}: CreativeDirectorCardProps) {
  const {
    sessionId,
    sessionStatus,
    isConnected,
    isAgentTyping,
    mayaHandoffData,
    currentPhase,
    showCreativeChat,
    showAssetGallery,
    showStyleSelector,
    messages,
    assets,
    availableStyleOptions,
    selectedStyleOption,
    visualDecisions,
    expandedSections,
    costTracking,
    handoffPreparation,
    chatInputMessage,

    // Actions
    setSessionId,
    setCurrentPhase,
    setShowCreativeChat,
    setShowAssetGallery,
    setShowStyleSelector,
    setAvailableStyleOptions,
    selectStyleOption,
    setChatInputMessage,
    toggleSection,
    addMessage,
    addAsset,
    setIsAgentTyping,
  } = useCreativeDirectorStore();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('style-selection');
  const [showChat, setShowChat] = useState(false);

  // Use dictionary for localized text
  const t = dict.creativeDirector;

  // Show card but with appropriate state based on handoff data
  const hasHandoffData = mayaHandoffData?.productAnalysis;

  // Auto-set sessionId from handoff data if not set
  React.useEffect(() => {
    if (hasHandoffData && !sessionId) {
      const newSessionId = crypto.randomUUID();
      console.log("[David Card] Setting new sessionId:", newSessionId);
      setSessionId(newSessionId);
    }
  }, [hasHandoffData, sessionId, setSessionId]);

  // Auto-load demo style options when card is first shown
  React.useEffect(() => {
    if (hasHandoffData && availableStyleOptions.length === 0) {
      console.log("[David Card] Loading demo style options");
      import("@/lib/agents/creative-director/demo/demo-data").then(({ demoStyleOptions }) => {
        setAvailableStyleOptions(demoStyleOptions);
      });
    }
  }, [hasHandoffData, availableStyleOptions, setAvailableStyleOptions]);

  // Handle chat message sending
  const handleSendMessage = useCallback(async (message: string) => {
    try {
      setIsAgentTyping(true);

      // Add user message to store
      const userMessage = {
        id: crypto.randomUUID(),
        type: "user" as const,
        content: message,
        timestamp: Date.now(),
        sessionId,
        locale: locale || "en",
      };
      addMessage(userMessage);

      // Call our Creative Director API
      const response = await fetch(`/api/agents/creative-director/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          locale,
          currentPhase,
          selectedStyle: selectedStyleOption?.id,
          context: {
            mayaHandoffData,
            conversationHistory: messages
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Add agent response
      const agentMessage = {
        id: crypto.randomUUID(),
        type: "agent" as const,
        content: data.message || "I'm working on your creative direction!",
        timestamp: Date.now(),
        sessionId,
        locale: locale || "en",
        processingTime: data.data?.processingTime,
        cost: data.metadata?.cost,
        confidence: data.metadata?.confidence,
        quickActions: data.data?.quickActions || [],
      };
      addMessage(agentMessage);

    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsAgentTyping(false);
    }
  }, [sessionId, locale, addMessage, setIsAgentTyping]);

  // Handle style selection
  const handleStyleSelection = useCallback(async (styleOption: any) => {
    try {
      selectStyleOption(styleOption);
      setCurrentPhase(CreativePhase.ASSET_GENERATION);

      // Load demo assets
      const { demoGeneratedAssets } = await import("@/lib/agents/creative-director/demo/demo-data");
      demoGeneratedAssets.forEach((asset) => addAsset(asset));

      // Auto-progress to next step
      setCurrentStep('scene-planning');

      // Show chat with confirmation
      setShowChat(true);
      const confirmationMessage = `Perfect! I've selected "${styleOption.name}" as your visual direction. This ${styleOption.description.toLowerCase()} style will work beautifully for your ${mayaHandoffData?.productAnalysis?.product?.name || 'product'}.`;

      setTimeout(() => {
        const agentMessage = {
          id: crypto.randomUUID(),
          type: "agent" as const,
          content: confirmationMessage,
          timestamp: Date.now(),
          sessionId,
          locale: locale || "en",
          quickActions: [],
        };
        addMessage(agentMessage);
      }, 500);

    } catch (error) {
      console.error("Style selection error:", error);
    }
  }, [selectStyleOption, setCurrentPhase, addMessage, sessionId, locale, mayaHandoffData]);

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep === 'style-selection' && selectedStyleOption) {
      setCurrentStep('scene-planning');
    } else if (currentStep === 'scene-planning') {
      setCurrentStep('asset-generation');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'scene-planning') {
      setCurrentStep('style-selection');
    } else if (currentStep === 'asset-generation') {
      setCurrentStep('scene-planning');
    }
  };

  // Don't show card if no handoff data from Maya
  if (!hasHandoffData) {
    return null;
  }

  // Stepper configuration
  const steps = [
    { id: 'style-selection', label: 'Style Direction', description: 'Choose visual style' },
    { id: 'scene-planning', label: 'Scene Planning', description: 'Plan key scenes' },
    { id: 'asset-generation', label: 'Asset Generation', description: 'Create visual assets' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Render stepper
  const renderStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line - positioned to connect step bubbles without exceeding them */}
        <div className="absolute top-6 h-0.5 bg-gray-700 -z-10"
             style={{
               left: '24px', // Half of bubble width (48px / 2)
               right: '24px' // Half of bubble width (48px / 2)
             }}>
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative">
            {/* Step circle */}
            <div
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                index <= currentStepIndex
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-lg"
                  : "bg-gray-800 border-gray-600 text-gray-400"
              }`}
            >
              {index < currentStepIndex ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Step label */}
            <div className="mt-3 text-center">
              <div className={`font-medium text-sm ${
                index <= currentStepIndex ? "text-white" : "text-gray-400"
              }`}>
                {step.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render style selection step
  const renderStyleSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Choose Your Visual Direction</h3>
        <p className="text-purple-200 text-lg">
          Select the style that best captures your product's personality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableStyleOptions.map((styleOption) => (
          <div
            key={styleOption.id}
            className={`group relative bg-gray-800/50 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:bg-gray-700/50 hover:scale-105 ${
              selectedStyleOption?.id === styleOption.id
                ? "border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/25"
                : "border-gray-600 hover:border-purple-400"
            }`}
            onClick={() => handleStyleSelection(styleOption)}
          >
            {/* Mood Board Preview */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-2 mb-4 rounded-lg overflow-hidden">
                {styleOption.moodBoard.slice(0, 3).map((imageUrl: string, idx: number) => (
                  <div
                    key={idx}
                    className="aspect-square rounded overflow-hidden bg-gray-700"
                  >
                    <img
                      src={imageUrl}
                      alt={`${styleOption.name} mood ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {/* Style Info */}
              <div className="space-y-3">
                <h4 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                  {styleOption.name}
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {styleOption.description}
                </p>

                {/* Color Palette */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium">Colors:</span>
                  <div className="flex gap-2">
                    {styleOption.colorPalette.map((color: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full border-2 border-gray-600 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Animation Style */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium">Animation:</span>
                  <span className="text-xs text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full">
                    {styleOption.animationStyle}
                  </span>
                </div>

                {/* Visual Keywords */}
                <div className="flex flex-wrap gap-2">
                  {styleOption.visualKeywords.slice(0, 3).map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs text-gray-300 bg-gray-700/50 px-2 py-1 rounded"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedStyleOption?.id === styleOption.id && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {availableStyleOptions.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg text-white mb-2">Loading Style Options...</div>
          <div className="text-sm text-gray-400">David is preparing visual directions for you</div>
        </div>
      )}
    </div>
  );

  // Render scene planning step
  const renderScenePlanning = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Plan Your Key Scenes</h3>
        <p className="text-purple-200 text-lg">
          I'll create these compelling moments for your commercial
        </p>
      </div>

      {/* Scene Cards */}
      <div className="space-y-4">
        {[
          {
            title: 'Product Hero Shot',
            description: 'Showcase your product in stunning detail with perfect lighting',
            duration: '3-4s',
            icon: '🎯',
            tips: 'Close-up details, premium feel, hero lighting'
          },
          {
            title: 'Lifestyle Context',
            description: 'Show how your product fits naturally into daily life',
            duration: '4-5s',
            icon: '🌟',
            tips: 'Real environment, authentic usage, emotional connection'
          },
          {
            title: 'Key Benefits Highlight',
            description: 'Visually demonstrate what makes your product special',
            duration: '3-4s',
            icon: '✨',
            tips: 'Clear value prop, before/after, feature demonstration'
          },
        ].map((scene, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl shadow-lg">
                {scene.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">{scene.title}</h4>
                  <span className="text-xs text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full font-medium">
                    {scene.duration}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{scene.description}</p>
                <div className="text-xs text-gray-400 bg-gray-700/30 px-3 py-2 rounded">
                  💡 {scene.tips}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Style Confirmation */}
      {selectedStyleOption && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="text-green-200 font-medium">Selected Style: {selectedStyleOption.name}</h4>
              <p className="text-green-300 text-sm">{selectedStyleOption.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render asset generation step
  const renderAssetGeneration = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Generating Visual Assets</h3>
        <p className="text-purple-200 text-lg">
          Creating backgrounds, compositions, and visual elements
        </p>
      </div>

      {/* Asset Grid */}
      {assets.generated.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {assets.generated.slice(0, 6).map((asset: any, index: number) => (
            <div
              key={asset.id}
              className="group relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-600 overflow-hidden hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400 group-hover:text-purple-300 transition-colors">
                  <div className="text-3xl mb-2">🎨</div>
                  <div className="text-xs font-medium">{asset.name || `Asset ${index + 1}`}</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="animate-pulse text-6xl mb-4">🎨</div>
          <div className="text-lg text-white mb-2">Assets Being Generated...</div>
          <div className="text-sm text-gray-400">This will take a moment to complete</div>
        </div>
      )}

      {/* Generation Progress */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/50">
        <h4 className="text-white font-medium mb-4">Generation Progress</h4>
        <div className="space-y-3">
          {[
            { name: 'Background Designs', progress: 100, status: 'complete' },
            { name: 'Product Compositions', progress: 85, status: 'generating' },
            { name: 'Color Palettes', progress: 60, status: 'generating' },
            { name: 'Visual Overlays', progress: 20, status: 'processing' },
          ].map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{item.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'complete'
                    ? 'bg-green-900/40 text-green-300'
                    : 'bg-purple-900/40 text-purple-300'
                }`}>
                  {item.status === 'complete' ? '✓ Complete' : '⟳ Processing'}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    item.status === 'complete'
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-purple-400 to-pink-400'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render navigation buttons
  const renderNavigation = () => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-600">
      <button
        onClick={handlePrevStep}
        disabled={currentStepIndex === 0}
        className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          currentStepIndex === 0
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowChat(!showChat)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 text-purple-300 hover:text-white border border-purple-500/50 hover:border-purple-400 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {showChat ? 'Hide Chat' : 'Ask David'}
        </button>

        <button
          onClick={handleNextStep}
          disabled={currentStepIndex === steps.length - 1 || (currentStep === 'style-selection' && !selectedStyleOption)}
          className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            currentStepIndex === steps.length - 1 || (currentStep === 'style-selection' && !selectedStyleOption)
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <Card variant="magical" className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <AgentAvatar agent="david" size="lg" state="idle" />
          <div>
            <h2 className="text-2xl font-bold text-white">David - Creative Director</h2>
            <p className="text-purple-200">I'll guide you through creating stunning visuals for your commercial</p>
          </div>
        </div>

       
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-6">
        {/* Main Workflow Area */}
        <div className={`transition-all duration-300 ${showChat ? 'flex-1' : 'w-full'}`}>
          {renderStepper()}

          <div className="min-h-[400px]">
            {currentStep === 'style-selection' && renderStyleSelection()}
            {currentStep === 'scene-planning' && renderScenePlanning()}
            {currentStep === 'asset-generation' && renderAssetGeneration()}
          </div>

          {renderNavigation()}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800/30 rounded-xl border border-gray-600/50 flex flex-col">
            <div className="p-4 border-b border-gray-600/50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Chat with David</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="cursor-pointer text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1">
              <CreativeChatContainer
                sessionId={sessionId}
                messages={messages}
                isConnected={isConnected}
                isAgentTyping={isAgentTyping}
                onSendMessage={handleSendMessage}
                dict={dict}
                locale={locale}
                inputMessage={chatInputMessage}
                onInputMessageChange={setChatInputMessage}
                onScrollRequest={onScrollToChatSection}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-600 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Creative Session: #{sessionId?.slice(-6) || "Loading..."}</span>
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
        </div>
      </div>
    </Card>
  );
}