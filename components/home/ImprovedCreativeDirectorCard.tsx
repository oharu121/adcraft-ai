"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import AgentAvatar from "@/components/ui/AgentAvatar";
import type { Dictionary, Locale } from "@/lib/dictionaries";

interface CreativeDirectorCardProps {
  dict: Dictionary;
  locale: Locale;
  onScrollToChatSection?: () => void;
}

export default function ImprovedCreativeDirectorCard({
  dict,
  locale,
  onScrollToChatSection,
}: CreativeDirectorCardProps) {
  const {
    sessionId,
    mayaHandoffData,
    currentPhase,
    setCurrentPhase,
  } = useCreativeDirectorStore();

  const [currentStep, setCurrentStep] = useState<'welcome' | 'style-selection' | 'scene-planning' | 'asset-generation' | 'final-review'>('welcome');

  // Don't show card if no handoff data from Maya
  if (!mayaHandoffData?.productAnalysis) {
    return null;
  }

  const handleStartCreativeProcess = () => {
    setCurrentStep('style-selection');
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      {/* David Introduction */}
      <div className="flex flex-col items-center space-y-4">
        <AgentAvatar agent="david" size="lg" state="idle" />
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Hi! I'm David, your Creative Director
          </h2>
          <p className="text-purple-200 text-lg">
            I'll make your commercial visually stunning
          </p>
        </div>
      </div>

      {/* What We'll Do Together */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Here's what we'll create together:
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="text-purple-200">Visual Style Direction</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <span className="text-purple-200">Scene Compositions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌈</span>
            <span className="text-purple-200">Color Palettes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-purple-200">Visual Assets</span>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={handleStartCreativeProcess}
        className="cursor-pointer w-full py-4 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Let's Create Your Visual Style Together! 🚀
      </button>

      {/* Maya's Handoff Summary */}
      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <AgentAvatar agent="maya" size="sm" state="idle" />
          <div>
            <h4 className="font-medium text-blue-200">Maya's Analysis Complete</h4>
            <p className="text-xs text-blue-300">
              I've received all the strategic insights for your {mayaHandoffData.productAnalysis?.product?.name || 'product'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStyleSelectionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          What visual style resonates with you?
        </h2>
        <p className="text-purple-200">
          Choose the style that best fits your product's personality
        </p>
      </div>

      {/* Style Options Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'minimalist', name: 'Minimalist', emoji: '✨', desc: 'Clean, simple, elegant' },
          { id: 'cinematic', name: 'Cinematic', emoji: '🎬', desc: 'Dramatic, movie-like' },
          { id: 'lifestyle', name: 'Lifestyle', emoji: '🌟', desc: 'Natural, relatable' },
          { id: 'luxury', name: 'Luxury', emoji: '💎', desc: 'Premium, sophisticated' },
        ].map((style) => (
          <button
            key={style.id}
            onClick={() => {
              // Handle style selection
              setCurrentStep('scene-planning');
            }}
            className="cursor-pointer p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:from-purple-800/40 hover:to-pink-800/40 rounded-xl border border-gray-600/50 hover:border-purple-500/50 transition-all duration-200 text-left group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              {style.emoji}
            </div>
            <h3 className="font-semibold text-white mb-1">{style.name}</h3>
            <p className="text-sm text-gray-300">{style.desc}</p>
          </button>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={() => setCurrentStep('welcome')}
        className="cursor-pointer w-full py-2 px-4 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
      >
        ← Back
      </button>
    </div>
  );

  const renderScenePlanningStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Perfect! Now let's plan your key scenes
        </h2>
        <p className="text-purple-200">
          I'll create compositions for these important moments
        </p>
      </div>

      {/* Scene Preview */}
      <div className="space-y-3">
        {[
          { title: 'Product Hero Shot', desc: 'Showcase your product beautifully', duration: '3s' },
          { title: 'Lifestyle Context', desc: 'Show how it fits in daily life', duration: '4s' },
          { title: 'Key Benefits', desc: 'Highlight what makes it special', duration: '3s' },
        ].map((scene, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-lg border border-gray-600/50"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white">{scene.title}</h4>
              <p className="text-sm text-gray-300">{scene.desc}</p>
            </div>
            <div className="text-xs text-purple-300 font-medium">
              {scene.duration}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      <button
        onClick={() => setCurrentStep('asset-generation')}
        className="cursor-pointer w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200"
      >
        Generate Visual Assets ✨
      </button>

      <button
        onClick={() => setCurrentStep('style-selection')}
        className="cursor-pointer w-full py-2 px-4 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
      >
        ← Change Style
      </button>
    </div>
  );

  const renderAssetGenerationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Creating your visual assets...
        </h2>
        <p className="text-purple-200">
          I'm generating backgrounds, compositions, and visual elements
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="space-y-4">
        {[
          { name: 'Background Designs', progress: 100, status: 'complete' },
          { name: 'Product Compositions', progress: 75, status: 'generating' },
          { name: 'Color Palettes', progress: 45, status: 'generating' },
          { name: 'Visual Overlays', progress: 0, status: 'pending' },
        ].map((asset, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{asset.name}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                asset.status === 'complete'
                  ? 'bg-green-900/40 text-green-300'
                  : asset.status === 'generating'
                  ? 'bg-purple-900/40 text-purple-300'
                  : 'bg-gray-900/40 text-gray-400'
              }`}>
                {asset.status === 'complete' ? '✓ Complete' : asset.status === 'generating' ? '⟳ Generating' : 'Pending'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  asset.status === 'complete'
                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                    : 'bg-gradient-to-r from-purple-400 to-pink-400'
                }`}
                style={{ width: `${asset.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button (simulated - would be enabled when generation complete) */}
      <button
        onClick={() => setCurrentStep('final-review')}
        disabled={true}
        className="cursor-pointer w-full py-3 px-6 bg-gray-700 text-gray-400 font-semibold rounded-lg opacity-50"
      >
        Review Assets (Generating...)
      </button>
    </div>
  );

  const renderFinalReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Your visual direction is ready! 🎉
        </h2>
        <p className="text-purple-200">
          Here's what I've created for your commercial
        </p>
      </div>

      {/* Assets Preview Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-600 flex items-center justify-center"
          >
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-1">🎨</div>
              <div className="text-xs">Visual Asset {item}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hand off to Alex */}
      {/* <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/20">
        <div className="flex items-center gap-3">
          <AgentAvatar agent="alex" size="md" state="idle" />
          <div>
            <h4 className="font-medium text-green-200">Ready for Alex (Video Producer)</h4>
            <p className="text-xs text-green-300">
              Alex will use these assets to create your final commercial video
            </p>
          </div>
        </div>
      </div> */}

      {/* Hand off Button */}
      <button
        className="cursor-pointer w-full py-4 px-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Hand off to Alex for Video Production 🎬
      </button>
    </div>
  );

  return (
    <Card variant="magical" className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <AgentAvatar agent="david" size="md" state="idle" />
          <div>
            <h3 className="text-xl font-semibold text-white">Creative Director</h3>
            <p className="text-gray-300 text-sm">Visual storytelling expert</p>
          </div>
        </div>

        {/* Progress Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { step: 'welcome', label: 'Welcome', active: currentStep === 'welcome' },
            { step: 'style-selection', label: 'Style', active: currentStep === 'style-selection' },
            { step: 'scene-planning', label: 'Scenes', active: currentStep === 'scene-planning' },
            { step: 'asset-generation', label: 'Assets', active: currentStep === 'asset-generation' },
            { step: 'final-review', label: 'Review', active: currentStep === 'final-review' },
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              <div
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  item.active
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {item.label}
              </div>
              {index < 4 && <div className="text-gray-600">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Dynamic Content Based on Current Step */}
      <div className="min-h-[400px]">
        {currentStep === 'welcome' && renderWelcomeStep()}
        {currentStep === 'style-selection' && renderStyleSelectionStep()}
        {currentStep === 'scene-planning' && renderScenePlanningStep()}
        {currentStep === 'asset-generation' && renderAssetGenerationStep()}
        {currentStep === 'final-review' && renderFinalReviewStep()}
      </div>

      {/* Session Info Footer */}
      <div className="mt-6 pt-4 border-t border-gray-600 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Creative Session: #{sessionId?.slice(-6) || 'Loading...'}</span>
          <span>Phase: Visual Development</span>
        </div>
      </div>
    </Card>
  );
}