"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui";
import { useVideoProducerStore } from "@/lib/stores/video-producer-store";
import { VideoProducerWorkflowStep, VideoFormat } from "@/lib/stores/video-producer-store";
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
  // Helper function to get icon for narrative styles
  const getIconForNarrativeStyle = (id: string) => {
    if (id.includes('hero') || id.includes('journey')) return "🎭";
    if (id.includes('lifestyle') || id.includes('aspiration')) return "✨";
    if (id.includes('product') || id.includes('showcase')) return "🎯";
    if (id.includes('custom') || id.includes('ai')) return "🤖";
    if (id.includes('energetic') || id.includes('modern')) return "⚡";
    if (id.includes('warm') || id.includes('authentic')) return "❤️";
    if (id.includes('sophisticated') || id.includes('elegant')) return "👑";
    return "🎬"; // Default
  };

  // Helper function to get icon for music genres
  const getIconForMusicGenre = (id: string) => {
    if (id.includes('cinematic') || id.includes('orchestral')) return "🎼";
    if (id.includes('electronic') || id.includes('modern')) return "🎹";
    if (id.includes('upbeat') || id.includes('pop')) return "🎵";
    if (id.includes('ambient') || id.includes('minimal')) return "🎶";
    return "🎵"; // Default
  };

  const {
    sessionId,
    creativeDirectorHandoffData,
    selectedNarrativeStyle,
    selectedMusicGenre,
    selectedVideoFormat,
    completedSteps,
    isProducing,
    productionProgress,
    finalVideoUrl,
    currentStep: storeCurrentStep,
    setCurrentStep: setStoreCurrentStep,
    setSelectedNarrativeStyle,
    setSelectedMusicGenre,
    setSelectedVideoFormat,
    startVideoProduction,
    availableNarrativeStyles,
    availableMusicGenres,
    availableVideoFormats,
    isInitialized,
  } = useVideoProducerStore();

  // Debug store state
  console.log('🔍 VideoProducerCard: Store state debug:', {
    sessionId,
    isInitialized,
    hasHandoffData: !!creativeDirectorHandoffData,
    availableNarrativeStylesCount: availableNarrativeStyles.length,
    availableMusicGenresCount: availableMusicGenres.length,
    availableVideoFormatsCount: availableVideoFormats.length,
    currentStep: storeCurrentStep
  });

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

  // Handle video format selection
  const handleVideoFormatSelection = useCallback(
    (videoFormat: VideoFormat) => {
      if (onExpandWorkflowProgress) onExpandWorkflowProgress();
      setSelectedVideoFormat(videoFormat);
    },
    [setSelectedVideoFormat, onExpandWorkflowProgress]
  );

  // Handle step navigation with proper progression logic
  const handleNextStep = useCallback(async () => {
    // Expand workflow progress to show navigation changes
    if (onExpandWorkflowProgress) onExpandWorkflowProgress();

    if (currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && selectedNarrativeStyle) {
      // Progress from narrative style to music tone
      setCurrentStep(VideoProducerWorkflowStep.MUSIC_TONE);
    } else if (currentStep === VideoProducerWorkflowStep.MUSIC_TONE && selectedMusicGenre) {
      // Progress from music tone to video format
      setCurrentStep(VideoProducerWorkflowStep.VIDEO_FORMAT);
    } else if (currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT && selectedVideoFormat) {
      // Progress from video format to final production
      setCurrentStep(VideoProducerWorkflowStep.FINAL_PRODUCTION);
    } else if (
      currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION &&
      !isProducing &&
      !finalVideoUrl
    ) {
      // Start video production
      startVideoProduction();
    }
  }, [
    currentStep,
    selectedNarrativeStyle,
    selectedMusicGenre,
    selectedVideoFormat,
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
    } else if (currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT) {
      setCurrentStep(VideoProducerWorkflowStep.MUSIC_TONE);
    } else if (currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION) {
      setCurrentStep(VideoProducerWorkflowStep.VIDEO_FORMAT);
    }
  };

  // Don't show card if no handoff data from Creative Director
  if (!hasHandoffData) {
    return (
      <Card variant="magical" className="p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-white mb-2">{t.waitingTitle}</h2>
          <p className="text-red-200 text-lg mb-6">{t.waitingForHandoff}</p>

          <div className="bg-gray-800/50 rounded-lg p-6">
            <p className="text-gray-400">{t.handoffDescription}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Render narrative style step
  const renderNarrativeStyle = () => {
    // Use API-generated narrative styles if available, fallback to dictionary data
    const narrativeStyles = availableNarrativeStyles.length > 0 ?
      availableNarrativeStyles.map(style => ({
        ...style,
        icon: getIconForNarrativeStyle(style.id),
        features: style.examples || [], // Use examples as features
      })) :
      [
        {
          id: "hero-journey",
          name: t.narrativeStyles.heroJourney.name,
          description: t.narrativeStyles.heroJourney.description,
          icon: "🎭",
          features: t.narrativeStyles.heroJourney.features,
          bestFor: t.narrativeStyles.heroJourney.bestFor,
          pacing: t.narrativeStyles.heroJourney.pacing,
        },
        {
          id: "lifestyle-aspiration",
          name: t.narrativeStyles.lifestyleAspiration.name,
          description: t.narrativeStyles.lifestyleAspiration.description,
          icon: "✨",
          features: t.narrativeStyles.lifestyleAspiration.features,
          bestFor: t.narrativeStyles.lifestyleAspiration.bestFor,
          pacing: t.narrativeStyles.lifestyleAspiration.pacing,
        },
        {
          id: "product-showcase",
          name: t.narrativeStyles.productShowcase.name,
          description: t.narrativeStyles.productShowcase.description,
          icon: "🎯",
          features: t.narrativeStyles.productShowcase.features,
          bestFor: t.narrativeStyles.productShowcase.bestFor,
          pacing: t.narrativeStyles.productShowcase.pacing,
        },
      ];

    console.log('🎬 VideoProducer: Using narrative styles:', {
      fromAPI: availableNarrativeStyles.length > 0,
      count: narrativeStyles.length,
      styles: narrativeStyles.map(s => ({ id: s.id, name: s.name }))
    });

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
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{style.description}</p>

                {/* Features */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.keyElements}</span>
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
                    <span className="text-xs text-gray-300 font-medium">{t.labels.bestFor}</span>
                    <p className="text-xs text-gray-100 mt-1">{style.bestFor}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.pacing}</span>
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
    // Use API-generated music genres if available, fallback to dictionary data
    const musicGenres =
      availableMusicGenres.length > 0
        ? availableMusicGenres.map((genre) => ({
            ...genre,
            icon: getIconForMusicGenre(genre.id),
            tempo: genre.energy || "Medium", // Map energy to tempo
          }))
        : [
            {
              id: "upbeat-energetic",
              icon: "🎵",
              name: t.musicGenres.upbeatEnergetic.name,
              description: t.musicGenres.upbeatEnergetic.description,
              mood: t.musicGenres.upbeatEnergetic.mood,
              tempo: t.musicGenres.upbeatEnergetic.tempo,
              instruments: t.musicGenres.upbeatEnergetic.instruments,
              bestFor: t.musicGenres.upbeatEnergetic.bestFor,
            },
            {
              id: "calm-sophisticated",
              icon: "🎵",
              name: t.musicGenres.calmSophisticated.name,
              description: t.musicGenres.calmSophisticated.description,
              mood: t.musicGenres.calmSophisticated.mood,
              tempo: t.musicGenres.calmSophisticated.tempo,
              instruments: t.musicGenres.calmSophisticated.instruments,
              bestFor: t.musicGenres.calmSophisticated.bestFor,
            },
            {
              id: "warm-inviting",
              icon: "🎵",
              name: t.musicGenres.warmInviting.name,
              description: t.musicGenres.warmInviting.description,
              mood: t.musicGenres.warmInviting.mood,
              tempo: t.musicGenres.warmInviting.tempo,
              instruments: t.musicGenres.warmInviting.instruments,
              bestFor: t.musicGenres.warmInviting.bestFor,
            },
          ];

    console.log('🎵 VideoProducer: Using music genres:', {
      fromAPI: availableMusicGenres.length > 0,
      count: musicGenres.length,
      genres: musicGenres.map(g => ({ id: g.id, name: g.name }))
    });

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
                  <span className="text-3xl">{genre.icon || "🎵"}</span>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-red-200 transition-colors">
                      {genre.name}
                    </h4>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{genre.description}</p>

                {/* Details */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.mood}</span>
                    <p className="text-xs text-red-300 mt-1">{genre.mood}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.tempo}</span>
                    <p className="text-xs text-gray-100 mt-1">{genre.tempo}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.instruments}</span>
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
                    <span className="text-xs text-gray-300 font-medium">{t.labels.bestFor}</span>
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

  // Render video format step
  const renderVideoFormat = () => {
    const videoFormats = [
      {
        id: "professional-landscape",
        name: t.videoFormats.professionalLandscape.name,
        description: t.videoFormats.professionalLandscape.description,
        aspectRatio: "16:9" as const,
        resolution: "1080p" as const,
        durationSeconds: 8 as const,
        icon: "💻",
        platforms: t.videoFormats.professionalLandscape.platforms,
        bestFor: t.videoFormats.professionalLandscape.bestFor,
        specs: t.videoFormats.professionalLandscape.specs,
      },
      {
        id: "standard-landscape",
        name: t.videoFormats.standardLandscape.name,
        description: t.videoFormats.standardLandscape.description,
        aspectRatio: "16:9" as const,
        resolution: "720p" as const,
        durationSeconds: 8 as const,
        icon: "📺",
        platforms: t.videoFormats.standardLandscape.platforms,
        bestFor: t.videoFormats.standardLandscape.bestFor,
        specs: t.videoFormats.standardLandscape.specs,
      },
      {
        id: "mobile-portrait",
        name: t.videoFormats.mobilePortrait.name,
        description: t.videoFormats.mobilePortrait.description,
        aspectRatio: "9:16" as const,
        resolution: "720p" as const,
        durationSeconds: 8 as const,
        icon: "📱",
        platforms: t.videoFormats.mobilePortrait.platforms,
        bestFor: t.videoFormats.mobilePortrait.bestFor,
        specs: t.videoFormats.mobilePortrait.specs,
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videoFormats.map((format) => (
            <div
              key={format.id}
              className={`group relative rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden ${
                selectedVideoFormat?.id === format.id
                  ? "border-red-500 bg-red-900/20 shadow-lg shadow-red-500/25"
                  : "border-gray-600 hover:border-red-400"
              }`}
              onClick={() => handleVideoFormatSelection(format)}
            >
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{format.icon}</span>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-red-200 transition-colors">
                      {format.name}
                    </h4>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{format.description}</p>

                {/* Specs and Details */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.specifications}</span>
                    <p className="text-xs text-red-300 mt-1">{format.specs}</p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.platforms}</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {format.platforms.map((platform, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-white bg-red-600/80 px-2 py-1 rounded backdrop-blur-sm"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-300 font-medium">{t.labels.bestFor}</span>
                    <p className="text-xs text-gray-100 mt-1">{format.bestFor}</p>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedVideoFormat?.id === format.id && (
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
            <h3 className="text-2xl font-bold text-green-300 mb-4">{t.production.complete}</h3>
            <p className="text-gray-300 mb-6">{t.production.ready}</p>

            {/* Video Player */}
            <div className="mb-6">
              <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl mx-auto max-w-2xl">
                <video
                  controls
                  className="w-full h-auto"
                  style={{ maxHeight: "400px" }}
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23000'/%3E%3Ctext x='400' y='225' text-anchor='middle' fill='%23fff' font-size='24' font-family='Arial'%3EYour Commercial Video%3C/text%3E%3C/svg%3E"
                >
                  <source src={finalVideoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Video overlay with play icon (hidden when video is playing) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-green-500/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-6 h-6 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => {
                    // Create a temporary link to download the video
                    const link = document.createElement("a");
                    link.href = finalVideoUrl;
                    link.download = `commercial-video-${Date.now()}.mp4`;
                    link.target = "_blank";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="magical-button cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {t.production.downloading}
                </button>

                <button
                  onClick={() => {
                    // Copy video URL to clipboard
                    navigator.clipboard.writeText(finalVideoUrl);
                    // You could add a toast notification here
                  }}
                  className="cursor-pointer border border-green-500 text-green-400 hover:bg-green-500/10 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {t.production.copyLink}
                </button>
              </div>

              {/* Video Specifications */}
              <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-white mb-2">{t.production.specifications}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <span className="text-green-300">{t.production.format}</span>{" "}
                    {selectedVideoFormat?.aspectRatio || "16:9"} •{" "}
                    {selectedVideoFormat?.resolution || "1080p"}
                  </div>
                  <div>
                    <span className="text-green-300">{t.production.duration}</span> 8{" "}
                    {t.production.seconds}
                  </div>
                  <div>
                    <span className="text-green-300">{t.production.narrative}</span>{" "}
                    {selectedNarrativeStyle?.name}
                  </div>
                  <div>
                    <span className="text-green-300">{t.production.music}</span>{" "}
                    {selectedMusicGenre?.name}
                  </div>
                </div>
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
            <h3 className="text-2xl font-bold text-red-300 mb-2">{t.production.producing}</h3>
            <p className="text-gray-300 mb-6">{t.production.crafting}</p>

            <div className="space-y-4">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${productionProgress}%` }}
                />
              </div>
              <p className="text-lg font-semibold text-red-300">
                {Math.round(productionProgress)}
                {t.production.progress}
              </p>
              <p className="text-sm text-gray-400">
                {t.production.timeRemaining}{" "}
                {Math.max(1, Math.round((100 - productionProgress) / 20))} {t.production.seconds}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center space-y-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold text-red-300 mb-2">{t.production.readyTitle}</h3>
          <p className="text-gray-300 mb-6">{t.production.readyDescription}</p>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-white mb-2">{t.production.summary}</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  <span className="text-red-300">{t.steps.narrativeStyle}:</span>{" "}
                  {selectedNarrativeStyle?.name}
                </p>
                <p>
                  <span className="text-red-300">{t.steps.musicTone}:</span>{" "}
                  {selectedMusicGenre?.name}
                </p>
                <p>
                  <span className="text-red-300">{t.steps.videoFormat}:</span>{" "}
                  {selectedVideoFormat?.name} ({selectedVideoFormat?.aspectRatio})
                </p>
                <p>
                  <span className="text-red-300">{t.production.duration}</span> 8{" "}
                  {t.production.seconds}
                </p>
                <p>
                  <span className="text-red-300">{t.production.productionCost}</span> $2.50
                </p>
              </div>
            </div>

            <button
              onClick={handleNextStep}
              className="magical-button cursor-pointer bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t.production.startProduction}
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
        {dict.common.back}
      </button>

      <div className="flex items-center gap-4">
        {currentStep !== VideoProducerWorkflowStep.FINAL_PRODUCTION && (
          <button
            onClick={handleNextStep}
            disabled={
              (currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE &&
                !selectedNarrativeStyle) ||
              (currentStep === VideoProducerWorkflowStep.MUSIC_TONE && !selectedMusicGenre) ||
              (currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT && !selectedVideoFormat)
            }
            className={`magical-button cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              (currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE &&
                !selectedNarrativeStyle) ||
              (currentStep === VideoProducerWorkflowStep.MUSIC_TONE && !selectedMusicGenre) ||
              (currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT && !selectedVideoFormat)
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
            }`}
          >
            {dict.common.continue}
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
            {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && t.steps.narrativeStyle}
            {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && t.steps.musicTone}
            {currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT && t.steps.videoFormat}
            {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && t.steps.finalProduction}
          </h2>
          <p className="text-red-200 text-lg">
            {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE &&
              t.stepDescriptions.narrativeStyle}
            {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && t.stepDescriptions.musicTone}
            {currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT &&
              t.stepDescriptions.videoFormat}
            {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION &&
              t.stepDescriptions.finalProduction}
          </p>
        </div>

        {/* Current Step Content */}
        <div className="min-h-[400px]">
          {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && renderNarrativeStyle()}
          {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && renderMusicTone()}
          {currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT && renderVideoFormat()}
          {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && renderFinalProduction()}
        </div>

        {renderNavigation()}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Video Production Session: #{sessionId?.slice(-6) || "Loading..."}</span>
          <span>
            {currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE && "Step 1 of 4"}
            {currentStep === VideoProducerWorkflowStep.MUSIC_TONE && "Step 2 of 4"}
            {currentStep === VideoProducerWorkflowStep.VIDEO_FORMAT && "Step 3 of 4"}
            {currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION && "Step 4 of 4"}
          </span>
        </div>
      </div>
    </Card>
  );
}
