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
  onNavigateToStep?: (step: string) => void;
  currentStep?: string;
  onStepChange?: (step: string) => void;
  onExpandWorkflowProgress?: () => void;
}

type WorkflowStep =
  | "production-style"
  | "creative-direction"
  | "scene-architecture";

export default function ImprovedCreativeDirectorCard({
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
  const [internalCurrentStep, setInternalCurrentStep] = useState<WorkflowStep>("production-style");
  const currentStep = (externalCurrentStep as WorkflowStep) || internalCurrentStep;
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
      console.log("[David Card] Loading demo style options");
      import("@/lib/agents/creative-director/demo/demo-data").then(({ demoStyleOptions }) => {
        setAvailableStyleOptions(demoStyleOptions);
      });
    }
  }, [hasHandoffData, availableStyleOptions, setAvailableStyleOptions]);

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
      setSelectedProductionStyle(productionStyle);
    },
    [setSelectedProductionStyle]
  );

  // Handle creative direction selection (just select, don't auto-advance)
  const handleCreativeDirectionSelection = useCallback(
    (styleOption: any) => {
      selectStyleOption(styleOption);
    },
    [selectStyleOption]
  );

  // Handle step navigation with proper progression logic
  const handleNextStep = useCallback(async () => {
    // Expand workflow progress to show navigation changes
    if (onExpandWorkflowProgress) onExpandWorkflowProgress();

    if (currentStep === "production-style" && selectedProductionStyle) {
      // Mark production style as completed
      markStepCompleted("productionStyle");
      // Progress from production style to creative direction
      setCurrentStep("creative-direction");

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

      setCurrentStep("scene-architecture");

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

    if (currentStep === "creative-direction") {
      setCurrentStep("production-style");
    } else if (currentStep === "scene-architecture") {
      setCurrentStep("creative-direction");
    }
  };

  // Expose step navigation to parent component
  React.useEffect(() => {
    if (onNavigateToStep) {
      // Parent can call this to navigate to specific steps
      const navigateToStep = (step: string) => {
        setCurrentStep(step as WorkflowStep);
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
        id: "live-action",
        name: "Live-Action",
        description:
          "Cinematic filming with real people, products, and environments for authentic storytelling",
        icon: "🎬",
        headerImage: "/production-style/live-action.png",
        features: ["Authentic feel", "Human connection", "Premium production value"],
        bestFor: "Lifestyle products, emotional storytelling, brand trust",
        examples: ["Product demonstrations", "Customer testimonials", "Brand stories"],
      },
      {
        id: "motion-graphics",
        name: "Motion Graphics",
        description: "Clean 2D animations with sophisticated typography and graphic elements",
        icon: "📐",
        headerImage: "/production-style/motion-graphics.png",
        features: ["Cost effective", "Clear messaging", "Brand consistency"],
        bestFor: "Tech products, explainer content, feature highlights",
        examples: ["Feature explanations", "Data visualization", "App walkthroughs"],
      },
      {
        id: "3d-animation",
        name: "3D Animation",
        description:
          "Stunning three-dimensional visuals showcasing products from impossible angles",
        icon: "🎯",
        headerImage: "/production-style/3d-animation.png",
        features: ["Product focus", "Impossible shots", "Premium feel"],
        bestFor: "Physical products, technical demonstrations, luxury positioning",
        examples: ["Product reveals", "Technical breakdowns", "Feature spotlights"],
      },
      {
        id: "mixed-media",
        name: "Mixed Media",
        description: "Combination of live-action, animation, and graphics for dynamic storytelling",
        icon: "🎨",
        headerImage: "/production-style/mixed-media.png",
        features: ["Creative flexibility", "Engaging variety", "Unique brand voice"],
        bestFor: "Innovative brands, complex products, premium campaigns",
        examples: ["Hybrid storytelling", "Creative campaigns", "Multi-format content"],
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
            title: "Product Hero Shot",
            description: "Showcase your product in stunning detail with perfect lighting",
            duration: "3-4s",
            icon: "🎯",
            tips: "Close-up details, premium feel, hero lighting",
          },
          {
            title: "Lifestyle Context",
            description: "Show how your product fits naturally into daily life",
            duration: "4-5s",
            icon: "🌟",
            tips: "Real environment, authentic usage, emotional connection",
          },
          {
            title: "Key Benefits Highlight",
            description: "Visually demonstrate what makes your product special",
            duration: "3-4s",
            icon: "✨",
            tips: "Clear value prop, before/after, feature demonstration",
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
        Back
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
      {/* Main Workflow Content */}
      <div className="w-full">
        {/* Current Step Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentStep === "production-style" && "Choose Your Production Style"}
            {currentStep === "creative-direction" && "Select Your Creative Direction"}
            {currentStep === "scene-architecture" && "Plan Your Scene Architecture"}
          </h2>
          <p className="text-purple-200 text-lg">
            {currentStep === "production-style" &&
              "Choose your preferred production method for the commercial"}
            {currentStep === "creative-direction" &&
              "Select the aesthetic approach that matches your vision"}
            {currentStep === "scene-architecture" &&
              "Review and refine the narrative flow and scene structure"}
          </p>
        </div>

        {/* Current Step Content */}
        <div className="min-h-[400px]">
          {currentStep === "production-style" && renderProductionStyle()}
          {currentStep === "creative-direction" && renderCreativeDirection()}
          {currentStep === "scene-architecture" && renderSceneArchitecture()}
        </div>

        {renderNavigation()}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Creative Session: #{sessionId?.slice(-6) || "Loading..."}</span>
          <span>
            {currentStep === "production-style" && "Step 1 of 3"}
            {currentStep === "creative-direction" && "Step 2 of 3"}
            {currentStep === "scene-architecture" && "Step 3 of 3"}
          </span>
        </div>
      </div>
    </Card>
  );
}
