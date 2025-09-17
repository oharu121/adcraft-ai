"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui";
import { useVideoProducerStore } from "@/lib/stores/video-producer-store";
import { VideoProducerWorkflowStep } from "@/lib/stores/video-producer-store";
import AgentAvatar from "@/components/ui/AgentAvatar";
import type { Dictionary, Locale } from "@/lib/dictionaries";

interface VideoProducerCardProps {
  dict: Dictionary;
  locale: Locale;
  onScrollToChatSection?: () => void;
  onNavigateToStep?: (step: VideoProducerWorkflowStep) => void;
  currentStep?: VideoProducerWorkflowStep;
  onStepChange?: (step: VideoProducerWorkflowStep) => void;
  onExpandWorkflowProgress?: () => void;
}

export default function VideoProducerCard({
  dict,
  locale = "en",
  onScrollToChatSection,
  onNavigateToStep,
  currentStep: externalCurrentStep,
  onStepChange,
  onExpandWorkflowProgress,
}: VideoProducerCardProps) {
  const {
    sessionId,
    creativeDirectorHandoffData,
    selectedNarrativeStyle,
    selectedMusicGenre,
    completedSteps,
    isProducing,
    productionProgress,
    finalVideoUrl,
    currentStep: storeCurrentStep,
    setCurrentStep: setStoreCurrentStep,
    setSelectedNarrativeStyle,
    setSelectedMusicGenre,
    startVideoProduction,
  } = useVideoProducerStore();

  // Use external step state if provided, fallback to store state
  const currentStep = externalCurrentStep || storeCurrentStep;
  const setCurrentStep = onStepChange || setStoreCurrentStep;

  // Use dictionary for localized text
  const t = dict.videoProducer;

  // Show card but with appropriate state based on handoff data
  const hasHandoffData = creativeDirectorHandoffData?.creativeDirection;

  // Handle narrative style selection
  const handleNarrativeStyleSelection = useCallback(
    (narrativeStyle: any) => {
      if (onExpandWorkflowProgress) onExpandWorkflowProgress();
      setSelectedNarrativeStyle(narrativeStyle);
    },
    [setSelectedNarrativeStyle, onExpandWorkflowProgress]
  );

  // Handle music genre selection
  const handleMusicGenreSelection = useCallback(
    (musicGenre: any) => {
      if (onExpandWorkflowProgress) onExpandWorkflowProgress();
      setSelectedMusicGenre(musicGenre);
    },
    [setSelectedMusicGenre, onExpandWorkflowProgress]
  );

  // Handle step navigation with proper progression logic
  const handleNextStep = useCallback(async () => {
    // Expand workflow progress to show navigation changes
    if (onExpandWorkflowProgress) onExpandWorkflowProgress();

    if (currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && selectedNarrativeStyle) {
      // Progress from narrative style to music tone
      setCurrentStep(VideoProducerWorkflowStep.MUSIC_TONE);
    } else if (currentStep === VideoProducerWorkflowStep.MUSIC_TONE && selectedMusicGenre) {
      // Progress from music tone to final production
      setCurrentStep(VideoProducerWorkflowStep.FINAL_PRODUCTION);
    } else if (currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && !isProducing && !finalVideoUrl) {
      // Start video production
      startVideoProduction();
    }
  }, [
    currentStep,
    selectedNarrativeStyle,
    selectedMusicGenre,
    isProducing,
    finalVideoUrl,
    setCurrentStep,
    startVideoProduction,
    onExpandWorkflowProgress,
  ]);

  const handlePrevStep = () => {
    // Expand workflow progress to show navigation changes
    if (onExpandWorkflowProgress) onExpandWorkflowProgress();

    if (currentStep === VideoProducerWorkflowStep.MUSIC_TONE) {
      setCurrentStep(VideoProducerWorkflowStep.NARRATIVE_STYLE);
    } else if (currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION) {
      setCurrentStep(VideoProducerWorkflowStep.MUSIC_TONE);
    }
  };

  // Don't show card if no handoff data from Creative Director
  if (!hasHandoffData) {
    return (
      <Card variant="magical" className="p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-white mb-2">Video Producer - Zara</h2>
          <p className="text-red-200 text-lg mb-6">Waiting for creative direction from David...</p>

          <div className="bg-gray-800/50 rounded-lg p-6">
            <p className="text-gray-400">Complete the Creative Director workflow first to unlock video production.</p>
          </div>
        </div>
      </Card>
    );
  }

  // Render narrative style step
  const renderNarrativeStyle = () => {
    const narrativeStyles = [
      {
        id: "hero-journey",
        name: "Hero's Journey",
        description: "Classic storytelling with problem-solution narrative",
        icon: "🎭",
        features: ["Problem Introduction", "Journey to Solution", "Transformation", "Call to Action"],
        bestFor: "Products that solve clear problems",
        pacing: "Gradual build-up with strong finale",
      },
      {
        id: "lifestyle-aspiration",
        name: "Lifestyle Aspiration",
        description: "Aspirational lifestyle and emotional connection",
        icon: "✨",
        features: ["Lifestyle Showcase", "Emotional Connection", "Product Integration", "Aspiration"],
        bestFor: "Lifestyle and luxury products",
        pacing: "Smooth, flowing narrative",
      },
      {
        id: "product-showcase",
        name: "Product Showcase",
        description: "Direct feature demonstration and benefits",
        icon: "🎯",
        features: ["Feature Highlights", "Benefit Focus", "Clear Demonstration", "Direct Appeal"],
        bestFor: "Technical and functional products",
        pacing: "Concise and informative",
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {narrativeStyles.map((style) => (
            <div
              key={style.id}
              className={`group relative rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden ${
                selectedNarrativeStyle?.id === style.id
                  ? "border-red-500 bg-red-900/20 shadow-lg shadow-red-500/25"
                  : "border-gray-600 hover:border-red-400"
              }`}
              onClick={() => handleNarrativeStyleSelection(style)}
            >
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{style.icon}</span>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-red-200 transition-colors">
                      {style.name}
                    </h4>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {style.description}
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-300 font-medium">Key Elements:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {style.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-white bg-red-600/80 px-2 py-1 rounded backdrop-blur-sm"
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
                    <span className="text-xs text-gray-300 font-medium">Pacing:</span>
                    <p className="text-xs text-gray-100 mt-1">{style.pacing}</p>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedNarrativeStyle?.id === style.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
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

  // Render music & tone step
  const renderMusicTone = () => {
    const musicGenres = [
      {
        id: "upbeat-energetic",
        name: "Upbeat & Energetic",
        description: "High energy music for dynamic and exciting presentations",
        icon: "🎵",
        mood: "Exciting, Motivational",
        tempo: "120-140 BPM",
        instruments: ["Electronic Beats", "Synthesizers", "Uplifting Melodies"],
        bestFor: "Tech products, fitness, innovation",
      },
      {
        id: "calm-sophisticated",
        name: "Calm & Sophisticated",
        description: "Refined background music for premium and luxury presentations",
        icon: "🎼",
        mood: "Elegant, Professional",
        tempo: "80-100 BPM",
        instruments: ["Piano", "Strings", "Ambient Textures"],
        bestFor: "Luxury goods, professional services",
      },
      {
        id: "warm-inviting",
        name: "Warm & Inviting",
        description: "Friendly and approachable music for lifestyle and family products",
        icon: "🎶",
        mood: "Friendly, Comforting",
        tempo: "90-110 BPM",
        instruments: ["Acoustic Guitar", "Light Percussion", "Warm Pads"],
        bestFor: "Family products, lifestyle brands",
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {musicGenres.map((genre) => (
            <div
              key={genre.id}
              className={`group relative rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden ${
                selectedMusicGenre?.id === genre.id
                  ? "border-red-500 bg-red-900/20 shadow-lg shadow-red-500/25"
                  : "border-gray-600 hover:border-red-400"
              }`}
              onClick={() => handleMusicGenreSelection(genre)}
            >
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{genre.icon}</span>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-red-200 transition-colors">
                      {genre.name}
                    </h4>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {genre.description}
                </p>

                {/* Details */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-300 font-medium">Mood:</span>
                    <p className="text-xs text-red-300 mt-1">{genre.mood}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">Tempo:</span>
                    <p className="text-xs text-gray-100 mt-1">{genre.tempo}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">Instruments:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {genre.instruments.map((instrument, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-white bg-red-600/80 px-2 py-1 rounded backdrop-blur-sm"
                        >
                          {instrument}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">Best For:</span>
                    <p className="text-xs text-gray-100 mt-1">{genre.bestFor}</p>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedMusicGenre?.id === genre.id && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
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

  // Render final production step
  const renderFinalProduction = () => {
    if (finalVideoUrl) {
      return (
        <div className="text-center space-y-6">
          <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-8">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-green-300 mb-2">Video Production Complete!</h3>
            <p className="text-gray-300 mb-6">Your commercial video is ready for download and use.</p>

            <div className="space-y-4">
              <button className="magical-button cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                Download Video
              </button>

              <div className="text-sm text-gray-400">
                <p>Format: MP4 • Resolution: 1920x1080 • Duration: ~15 seconds</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isProducing) {
      return (
        <div className="text-center space-y-6">
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8">
            <div className="text-6xl mb-4 animate-pulse">🎬</div>
            <h3 className="text-2xl font-bold text-red-300 mb-2">Producing Your Video...</h3>
            <p className="text-gray-300 mb-6">Zara is crafting your commercial with your selected narrative style and music.</p>

            <div className="space-y-4">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${productionProgress}%` }}
                />
              </div>
              <p className="text-lg font-semibold text-red-300">{Math.round(productionProgress)}% Complete</p>
              <p className="text-sm text-gray-400">Estimated time remaining: {Math.max(1, Math.round((100 - productionProgress) / 10))} minutes</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center space-y-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold text-red-300 mb-2">Ready for Video Production</h3>
          <p className="text-gray-300 mb-6">All creative decisions are finalized. Start the video production process!</p>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-white mb-2">Production Summary:</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-red-300">Narrative Style:</span> {selectedNarrativeStyle?.name}</p>
                <p><span className="text-red-300">Music & Tone:</span> {selectedMusicGenre?.name}</p>
                <p><span className="text-red-300">Estimated Duration:</span> 15 seconds</p>
                <p><span className="text-red-300">Production Cost:</span> $2.50</p>
              </div>
            </div>

            <button
              onClick={handleNextStep}
              className="magical-button cursor-pointer bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Video Production
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render navigation buttons
  const renderNavigation = () => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-600">
      <button
        onClick={handlePrevStep}
        disabled={currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE}
        className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE
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
        {currentStep !== VideoProducerWorkflowStep.FINAL_PRODUCTION && (
          <button
            onClick={handleNextStep}
            disabled={
              (currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && !selectedNarrativeStyle) ||
              (currentStep === VideoProducerWorkflowStep.MUSIC_TONE && !selectedMusicGenre)
            }
            className={`magical-button cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              (currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && !selectedNarrativeStyle) ||
              (currentStep === VideoProducerWorkflowStep.MUSIC_TONE && !selectedMusicGenre)
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
            }`}
          >
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
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
            {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && (t.steps?.narrativeStyle || "Choose Narrative Style")}
            {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && (t.steps?.musicTone || "Select Music & Tone")}
            {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && (t.steps?.finalProduction || "Final Production")}
          </h2>
          <p className="text-red-200 text-lg">
            {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && "Choose the storytelling approach for your video"}
            {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && "Select the perfect music and tone for your video"}
            {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && "Review and produce your final video"}
          </p>
        </div>

        {/* Current Step Content */}
        <div className="min-h-[400px]">
          {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && renderNarrativeStyle()}
          {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && renderMusicTone()}
          {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && renderFinalProduction()}
        </div>

        {renderNavigation()}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Video Production Session: #{sessionId?.slice(-6) || "Loading..."}</span>
          <span>
            {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && "Step 1 of 3"}
            {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && "Step 2 of 3"}
            {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && "Step 3 of 3"}
          </span>
        </div>
      </div>
    </Card>
  );
}
