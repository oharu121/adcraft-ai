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
import { WorkflowStep } from "@/lib/agents/creative-director/enums";

interface CreativeDirectorCardProps {
  dict: Dictionary;
  locale: Locale;
  onScrollToChatSection?: () => void;
  onNavigateToStep?: (step: WorkflowStep) => void;
  currentStep?: string;
  onStepChange?: (step: WorkflowStep) => void;
  onExpandWorkflowProgress?: () => void;
}

export default function CreativeDirectorCard({
  dict,
  locale = "en",
  onScrollToChatSection,
  onNavigateToStep,
  currentStep: externalCurrentStep,
  onStepChange,
  onExpandWorkflowProgress,
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
    selectedProductionStyle,
    visualDecisions,
    expandedSections,
    costTracking,
    handoffPreparation,
    chatInputMessage,
    completedSteps,

    // Actions
    setSessionId,
    setCurrentPhase,
    setShowCreativeChat,
    setShowAssetGallery,
    setShowStyleSelector,
    setAvailableStyleOptions,
    selectStyleOption,
    setSelectedProductionStyle,
    setChatInputMessage,
    toggleSection,
    addMessage,
    addAsset,
    setIsAgentTyping,
    markStepCompleted,
  } = useCreativeDirectorStore();

  // Use external step state if provided, fallback to internal state
  const [internalCurrentStep, setInternalCurrentStep] = useState<WorkflowStep>(
    WorkflowStep.PRODUCTION_STYLE
  );
  const currentStep = externalCurrentStep || internalCurrentStep;
  const setCurrentStep = onStepChange || setInternalCurrentStep;

  // Now using Zustand store for selectedProductionStyle - no local state needed!

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
      console.log("[David Card] Loading demo style options from dictionary");
      const styleOptions = [
        {
          id: t.creativeDirections.premiumMinimalism.id,
          name: t.creativeDirections.premiumMinimalism.name,
          description: t.creativeDirections.premiumMinimalism.description,
          colorPalette: t.creativeDirections.premiumMinimalism.colorPalette,
          moodBoard: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1560472355-a9a6ea6a2e64?w=300&h=200&fit=crop",
          ],
          visualKeywords: t.creativeDirections.premiumMinimalism.visualKeywords,
          animationStyle: t.creativeDirections.premiumMinimalism.animationStyle,
          examples: t.creativeDirections.premiumMinimalism.examples,
        },
        {
          id: t.creativeDirections.techDynamic.id,
          name: t.creativeDirections.techDynamic.name,
          description: t.creativeDirections.techDynamic.description,
          colorPalette: t.creativeDirections.techDynamic.colorPalette,
          moodBoard: [
            "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&h=200&fit=crop",
          ],
          visualKeywords: t.creativeDirections.techDynamic.visualKeywords,
          animationStyle: t.creativeDirections.techDynamic.animationStyle,
          examples: t.creativeDirections.techDynamic.examples,
        },
        {
          id: t.creativeDirections.luxuryEditorial.id,
          name: t.creativeDirections.luxuryEditorial.name,
          description: t.creativeDirections.luxuryEditorial.description,
          colorPalette: t.creativeDirections.luxuryEditorial.colorPalette,
          moodBoard: [
            "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop",
          ],
          visualKeywords: t.creativeDirections.luxuryEditorial.visualKeywords,
          animationStyle: t.creativeDirections.luxuryEditorial.animationStyle,
          examples: t.creativeDirections.luxuryEditorial.examples,
        },
        {
          id: t.creativeDirections.lifestyleAuthentic.id,
          name: t.creativeDirections.lifestyleAuthentic.name,
          description: t.creativeDirections.lifestyleAuthentic.description,
          colorPalette: t.creativeDirections.lifestyleAuthentic.colorPalette,
          moodBoard: [
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=300&h=200&fit=crop",
          ],
          visualKeywords: t.creativeDirections.lifestyleAuthentic.visualKeywords,
          animationStyle: t.creativeDirections.lifestyleAuthentic.animationStyle,
          examples: t.creativeDirections.lifestyleAuthentic.examples,
        },
      ];
      setAvailableStyleOptions(styleOptions);
    }
  }, [hasHandoffData, availableStyleOptions, setAvailableStyleOptions, t]);

  // Handle chat message sending
  const handleSendMessage = useCallback(
    async (message: string) => {
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

        // xall our Creative Director API
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
              conversationHistory: messages,
            },
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
    },
    [sessionId, locale, addMessage, setIsAgentTyping]
  );

  // Handle production style selection (just select, don't auto-advance)
  const handleProductionStyleSelection = useCallback(
    (productionStyle: any) => {
      if (onExpandWorkflowProgress) onExpandWorkflowProgress();
      setSelectedProductionStyle(productionStyle);
    },
    [setSelectedProductionStyle]
  );

  // Handle creative direction selection (just select, don't auto-advance)
  const handleCreativeDirectionSelection = useCallback(
    (styleOption: any) => {
      if (onExpandWorkflowProgress) onExpandWorkflowProgress();
      selectStyleOption(styleOption);
    },
    [selectStyleOption]
  );

  // Handle step navigation with proper progression logic
  const handleNextStep = useCallback(async () => {
    // Expand workflow progress to show navigation changes
    if (onExpandWorkflowProgress) onExpandWorkflowProgress();

    if (currentStep === WorkflowStep.PRODUCTION_STYLE && selectedProductionStyle) {
      // Mark production style as completed
      markStepCompleted("productionStyle");
      // Progress from production style to creative direction
      setCurrentStep(WorkflowStep.CREATIVE_DIRECTION);

      const confirmationMessage = `Excellent choice! ${selectedProductionStyle.name} is perfect for your ${mayaHandoffData?.productAnalysis?.product?.name || "product"}. Now let me generate aesthetic options tailored specifically for ${selectedProductionStyle.name.toLowerCase()} production.`;

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
    } else if (currentStep === "creative-direction" && selectedStyleOption) {
      // Mark creative direction as completed
      markStepCompleted("creativeDirection");
      // Progress from creative direction to scene architecture
      setCurrentPhase(CreativePhase.ASSET_GENERATION);

      // Load demo assets
      const { demoGeneratedAssets } = await import("@/lib/agents/creative-director/demo/demo-data");
      demoGeneratedAssets.forEach((asset) => addAsset(asset));

      setCurrentStep(WorkflowStep.SCENE_ARCHITECTURE);

      const confirmationMessage = `Perfect! I've selected "${selectedStyleOption.name}" as your creative direction. This ${selectedStyleOption.description.toLowerCase()} aesthetic will work beautifully with your chosen production style.`;

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
    } else if (currentStep === "scene-architecture") {
      // Mark scene architecture as completed
      markStepCompleted("sceneArchitecture");
      // Scene architecture is the final step - ready for video production handoff
    }
  }, [
    currentStep,
    selectedProductionStyle,
    selectedStyleOption,
    setCurrentPhase,
    addAsset,
    addMessage,
    sessionId,
    locale,
    mayaHandoffData,
    markStepCompleted,
    onExpandWorkflowProgress,
  ]);

  const handlePrevStep = () => {
    // Expand workflow progress to show navigation changes
    if (onExpandWorkflowProgress) onExpandWorkflowProgress();

    if (currentStep === WorkflowStep.CREATIVE_DIRECTION) {
      setCurrentStep(WorkflowStep.PRODUCTION_STYLE);
    } else if (currentStep === WorkflowStep.SCENE_ARCHITECTURE) {
      setCurrentStep(WorkflowStep.CREATIVE_DIRECTION);
    }
  };

  // Expose step navigation to parent component
  React.useEffect(() => {
    if (onNavigateToStep) {
      // Parent can call this to navigate to specific steps
      const navigateToStep = (step: WorkflowStep) => {
        setCurrentStep(step);
      };

      // Store reference for parent to use
      (onNavigateToStep as any).navigateToStep = navigateToStep;
    }
  }, [onNavigateToStep]);

  // Expose current selections to parent
  const selections = React.useMemo(
    () => ({
      selectedProductionStyle,
      selectedStyleOption,
      currentStep,
      assets,
    }),
    [selectedProductionStyle, selectedStyleOption, currentStep, assets]
  );

  // Don't show card if no handoff data from Maya
  if (!hasHandoffData) {
    return null;
  }

  // Render production style step
  const renderProductionStyle = () => {
    const productionStyles = [
      {
        id: t.productionStyles.liveAction.id,
        name: t.productionStyles.liveAction.name,
        description: t.productionStyles.liveAction.description,
        icon: t.productionStyles.liveAction.icon,
        headerImage: t.productionStyles.liveAction.headerImage,
        features: t.productionStyles.liveAction.features,
        bestFor: t.productionStyles.liveAction.bestFor,
        examples: t.productionStyles.liveAction.examples,
      },
      {
        id: t.productionStyles.motionGraphics.id,
        name: t.productionStyles.motionGraphics.name,
        description: t.productionStyles.motionGraphics.description,
        icon: t.productionStyles.motionGraphics.icon,
        headerImage: t.productionStyles.motionGraphics.headerImage,
        features: t.productionStyles.motionGraphics.features,
        bestFor: t.productionStyles.motionGraphics.bestFor,
        examples: t.productionStyles.motionGraphics.examples,
      },
      {
        id: t.productionStyles["3dAnimation"].id,
        name: t.productionStyles["3dAnimation"].name,
        description: t.productionStyles["3dAnimation"].description,
        icon: t.productionStyles["3dAnimation"].icon,
        headerImage: t.productionStyles["3dAnimation"].headerImage,
        features: t.productionStyles["3dAnimation"].features,
        bestFor: t.productionStyles["3dAnimation"].bestFor,
        examples: t.productionStyles["3dAnimation"].examples,
      },
      {
        id: t.productionStyles.mixedMedia.id,
        name: t.productionStyles.mixedMedia.name,
        description: t.productionStyles.mixedMedia.description,
        icon: t.productionStyles.mixedMedia.icon,
        headerImage: t.productionStyles.mixedMedia.headerImage,
        features: t.productionStyles.mixedMedia.features,
        bestFor: t.productionStyles.mixedMedia.bestFor,
        examples: t.productionStyles.mixedMedia.examples,
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productionStyles.map((style) => (
            <div
              key={style.id}
              className={`group relative rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden min-h-[300px] ${
                selectedProductionStyle?.id === style.id
                  ? "border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/25"
                  : "border-gray-600 hover:border-purple-400"
              }`}
              onClick={() => handleProductionStyleSelection(style)}
            >
              {/* Full Card Background Image */}
              <div className="absolute inset-0">
                <img
                  src={style.headerImage}
                  alt={`${style.name} example`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>
              </div>

              {/* Content Overlay */}
              <div className="relative p-6 h-full flex flex-col justify-between">
                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                      {style.icon} {style.name}
                    </h4>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-gray-200 text-sm leading-relaxed">{style.description}</p>
                </div>

                {/* Features and Details */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-300 font-medium">Key Features:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {style.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-white bg-purple-600/80 px-2 py-1 rounded backdrop-blur-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">Best For:</span>
                    <p className="text-xs text-gray-100 mt-1">{style.bestFor}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">Examples:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {style.examples.map((example, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-gray-200 bg-gray-800/60 px-2 py-1 rounded backdrop-blur-sm"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedProductionStyle?.id === style.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render creative direction step (updated from style selection)
  const renderCreativeDirection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableStyleOptions.map((styleOption) => (
          <div
            key={styleOption.id}
            className={`group relative bg-gray-800/50 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:bg-gray-700/50 hover:scale-105 ${
              selectedStyleOption?.id === styleOption.id
                ? "border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/25"
                : "border-gray-600 hover:border-purple-400"
            }`}
            onClick={() => handleCreativeDirectionSelection(styleOption)}
          >
            {/* Simplified Style Info */}
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                    {styleOption.name}
                  </h4>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {styleOption.description}
              </p>

              {/* Style Details */}
              <div className="space-y-4">
                {/* Color Palette */}
                <div>
                  <span className="text-xs text-gray-400 font-medium mb-2 block">
                    Color Palette:
                  </span>
                  <div className="flex gap-2">
                    {styleOption.colorPalette.map((color: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-lg border-2 border-gray-600 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Visual Keywords */}
                <div>
                  <span className="text-xs text-gray-400 font-medium mb-2 block">
                    Visual Style:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {styleOption.visualKeywords.slice(0, 4).map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs text-purple-300 bg-purple-900/40 px-3 py-1 rounded-full border border-purple-500/30"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Typography Style */}
                <div>
                  <span className="text-xs text-gray-400 font-medium mb-2 block">Typography:</span>
                  <span className="text-xs text-gray-300 bg-gray-700/50 px-3 py-1 rounded">
                    {styleOption.animationStyle === "Static"
                      ? "Classic & Refined"
                      : styleOption.animationStyle === "Dynamic"
                        ? "Bold & Modern"
                        : "Clean & Minimal"}
                  </span>
                </div>

                {/* Best For */}
                <div>
                  <span className="text-xs text-gray-400 font-medium mb-2 block">Perfect For:</span>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {styleOption.name === "Premium Minimalism"
                      ? "Luxury brands, tech products, sophisticated audiences"
                      : styleOption.name === "Tech Dynamic"
                        ? "Innovation-focused brands, startups, modern products"
                        : styleOption.name === "Luxury Editorial"
                          ? "High-end products, premium positioning, elite markets"
                          : "Lifestyle brands, authentic storytelling, human-centered products"}
                  </p>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedStyleOption?.id === styleOption.id && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
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

  // Render scene architecture step
  const renderSceneArchitecture = () => (
    <div className="space-y-6">
      {/* Scene Cards */}
      <div className="space-y-4">
        {[
          {
            title: t.sceneArchitecture.productHeroShot.title,
            description: t.sceneArchitecture.productHeroShot.description,
            duration: t.sceneArchitecture.productHeroShot.duration,
            icon: t.sceneArchitecture.productHeroShot.icon,
            tips: t.sceneArchitecture.productHeroShot.tips,
          },
          {
            title: t.sceneArchitecture.lifestyleContext.title,
            description: t.sceneArchitecture.lifestyleContext.description,
            duration: t.sceneArchitecture.lifestyleContext.duration,
            icon: t.sceneArchitecture.lifestyleContext.icon,
            tips: t.sceneArchitecture.lifestyleContext.tips,
          },
          {
            title: t.sceneArchitecture.keyBenefitsHighlight.title,
            description: t.sceneArchitecture.keyBenefitsHighlight.description,
            duration: t.sceneArchitecture.keyBenefitsHighlight.duration,
            icon: t.sceneArchitecture.keyBenefitsHighlight.icon,
            tips: t.sceneArchitecture.keyBenefitsHighlight.tips,
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
    </div>
  );

  // Render navigation buttons
  const renderNavigation = () => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-600">
      <button
        onClick={handlePrevStep}
        disabled={currentStep === "production-style"}
        className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          currentStep === "production-style"
            ? "text-gray-500 cursor-not-allowed"
            : "text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.workflow.navigation.back}
      </button>

      <div className="flex items-center gap-4">
        <button
          onClick={handleNextStep}
          disabled={
            (currentStep === "scene-architecture" && completedSteps.sceneArchitecture) ||
            (currentStep === "production-style" && !selectedProductionStyle) ||
            (currentStep === "creative-direction" && !selectedStyleOption)
          }
          className={`magical-button cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            (currentStep === "scene-architecture" && completedSteps.sceneArchitecture) ||
            (currentStep === "production-style" && !selectedProductionStyle) ||
            (currentStep === "creative-direction" && !selectedStyleOption)
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
          }`}
        >
          {t.workflow.navigation.continue}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <Card variant="magical" className="p-8">
      {/* Main Workflow Content */}
      <div className="w-full">
        {/* Current Step Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentStep === WorkflowStep.PRODUCTION_STYLE && t.workflow.stepTitles.productionStyle}
            {currentStep === WorkflowStep.CREATIVE_DIRECTION &&
              t.workflow.stepTitles.creativeDirection}
            {currentStep === WorkflowStep.SCENE_ARCHITECTURE &&
              t.workflow.stepTitles.sceneArchitecture}
          </h2>
          <p className="text-purple-200 text-lg">
            {currentStep === WorkflowStep.PRODUCTION_STYLE &&
              t.workflow.stepDescriptions.productionStyle}
            {currentStep === WorkflowStep.CREATIVE_DIRECTION &&
              t.workflow.stepDescriptions.creativeDirection}
            {currentStep === WorkflowStep.SCENE_ARCHITECTURE &&
              t.workflow.stepDescriptions.sceneArchitecture}
          </p>
        </div>

        {/* Current Step Content */}
        <div className="min-h-[400px]">
          {currentStep === WorkflowStep.PRODUCTION_STYLE && renderProductionStyle()}
          {currentStep === WorkflowStep.CREATIVE_DIRECTION && renderCreativeDirection()}
          {currentStep === WorkflowStep.SCENE_ARCHITECTURE && renderSceneArchitecture()}
        </div>

        {renderNavigation()}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Creative Session: #{sessionId?.slice(-6) || "Loading..."}</span>
          <span>
            {currentStep === WorkflowStep.PRODUCTION_STYLE &&
              t.workflow.navigation.stepOf.replace("{current}", "1").replace("{total}", "3")}
            {currentStep === WorkflowStep.CREATIVE_DIRECTION &&
              t.workflow.navigation.stepOf.replace("{current}", "2").replace("{total}", "3")}
            {currentStep === WorkflowStep.SCENE_ARCHITECTURE &&
              t.workflow.navigation.stepOf.replace("{current}", "3").replace("{total}", "3")}
          </span>
        </div>
      </div>
    </Card>
  );
}
