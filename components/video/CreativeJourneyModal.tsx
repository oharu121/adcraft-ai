"use client";

import React from "react";
import type { Dictionary } from "@/lib/dictionaries";

interface CreativeJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: Dictionary;

  // Data from the stores for the journey
  productAnalysis?: any;
  creativeDirection?: any;
  selectedNarrativeStyle?: any;
  selectedMusicGenre?: any;
  selectedVideoFormat?: any;
}

export default function CreativeJourneyModal({
  isOpen,
  onClose,
  dict,
  productAnalysis,
  creativeDirection,
  selectedNarrativeStyle,
  selectedMusicGenre,
  selectedVideoFormat,
}: CreativeJourneyModalProps) {
  const t = dict.videoDetail?.creativeJourney || {
    title: "Creative Journey",
    subtitle: "See how AI agents transformed your product into this video",
    steps: {
      product: "Product Upload",
      maya: "Maya's Analysis",
      david: "David's Direction",
      zara: "Zara's Production",
      final: "Final Video",
    },
    descriptions: {
      maya: "AI analyzed your product's features, audience, and market positioning",
      david: "Creative Director designed the visual style and narrative approach",
      zara: "Video Producer created the final commercial with selected styles",
      final: "Your AI-generated commercial video is complete and ready!",
    },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

        {/* Content */}
        <div className="p-6">
          {/* Visual Timeline */}
          <div className="relative mb-8">
            {/* Timeline Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-200 via-blue-200 to-green-200"></div>

            {/* Timeline Steps */}
            <div className="flex justify-between items-start relative">
              {/* Step 1: Product Upload */}
              <div className="flex flex-col items-center text-center w-20">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mb-2 relative z-10 shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">{t.steps.product}</span>
              </div>

              {/* Step 2: Maya's Analysis */}
              <div className="flex flex-col items-center text-center w-20">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mb-2 relative z-10 shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">{t.steps.maya}</span>
              </div>

              {/* Step 3: David's Direction */}
              <div className="flex flex-col items-center text-center w-20">
                <div className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center mb-2 relative z-10 shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">{t.steps.david}</span>
              </div>

              {/* Step 4: Zara's Production */}
              <div className="flex flex-col items-center text-center w-20">
                <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mb-2 relative z-10 shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">{t.steps.zara}</span>
              </div>

              {/* Step 5: Final Video */}
              <div className="flex flex-col items-center text-center w-20">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mb-2 relative z-10 shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3l14 9-14 9V3z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700">{t.steps.final}</span>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-4">
            {/* Product Analysis Section */}
            {productAnalysis && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-purple-900">{t.steps.maya}</h3>
                </div>
                <p className="text-purple-800 text-sm mb-2">{t.descriptions.maya}</p>
                {productAnalysis.keyFeatures && (
                  <div className="text-sm">
                    <strong className="text-purple-900">Key Features:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {productAnalysis.keyFeatures.map((feature: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Creative Direction Section */}
            {creativeDirection && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-indigo-900">{t.steps.david}</h3>
                </div>
                <p className="text-indigo-800 text-sm mb-2">{t.descriptions.david}</p>
                {creativeDirection.visualTheme && (
                  <div className="text-sm space-y-1">
                    <div>
                      <strong className="text-indigo-900">Visual Theme:</strong>{" "}
                      {creativeDirection.visualTheme}
                    </div>
                    <div>
                      <strong className="text-indigo-900">Brand Message:</strong>{" "}
                      {creativeDirection.brandMessage}
                    </div>
                    <div>
                      <strong className="text-indigo-900">Target Audience:</strong>{" "}
                      {creativeDirection.targetAudience}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video Production Section */}
            {(selectedNarrativeStyle || selectedMusicGenre) && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-pink-900">{t.steps.zara}</h3>
                </div>
                <p className="text-pink-800 text-sm mb-2">{t.descriptions.zara}</p>
                <div className="text-sm space-y-1">
                  {selectedNarrativeStyle && (
                    <div>
                      <strong className="text-pink-900">Narrative Style:</strong>{" "}
                      {selectedNarrativeStyle.name}
                    </div>
                  )}
                  {selectedMusicGenre && (
                    <div>
                      <strong className="text-pink-900">Music Genre:</strong>{" "}
                      {selectedMusicGenre.name}
                    </div>
                  )}
                  {selectedVideoFormat && (
                    <div>
                      <strong className="text-pink-900">Video Format:</strong>{" "}
                      {selectedVideoFormat.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final Result Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3l14 9-14 9V3z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-green-900">{t.steps.final}</h3>
              </div>
              <p className="text-green-800 text-sm">{t.descriptions.final}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Close Creative Journey
          </button>
        </div>
      </div>
    </div>
  );
}
