/**
 * Product Intelligence Agent - Product Analysis Card
 *
 * Clean, simple commercial-focused analysis display
 */

"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { Dictionary } from "@/lib/dictionaries";
import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import { Button } from "../ui";

export interface ProductAnalysisCardProps {
  dict: Dictionary;
  locale?: "en" | "ja";
  className?: string;
  onRefineRequest?: (topic: string, question: string) => void;
}

const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({
  dict,
  locale = "en",
  className = "",
  onRefineRequest,
}) => {
  // Get data from store
  const {
    analysis,
    uploadedImage,
    productName,
    productDescription,
    inputMode,
    showAllFeatures,
    sessionId,
    setShowAllFeatures,
    setShowHandoffModal,
    resetSession,
    transitionToPhase,
  } = useProductIntelligenceStore();

  // Memoize blob URL - React Strict Mode safe
  const imageUrl = useMemo(() => {
    if (uploadedImage) {
      const url = URL.createObjectURL(uploadedImage);
      console.log('✅ ProductAnalysisCard: Created URL (Strict Mode safe):', url);
      return url;
    }
    return null;
  }, [uploadedImage]);

  // If no analysis available, show loading state
  if (!analysis) {
    return (
      <Card variant="magical" className={`p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="animate-pulse">Analyzing product...</div>
        </div>
      </Card>
    );
  }

  // Use dictionary for localized text
  const t = dict.productIntelligence.productAnalysisCard;

  // Handle refine request
  const handleRefineRequest = (topic: string) => {
    if (onRefineRequest) {
      const question = `Can you provide more details about ${topic}?`;
      onRefineRequest(topic, question);
    }
  };

  // Format confidence score
  const formatConfidence = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className={`w-full ${className}`}>
      <Card variant="magical" className="p-6">
        {/* Header with confidence */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-white">{dict.productAnalysis.title}</h2>
              {sessionId && (
                <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded border border-gray-600 font-mono">
                  #{sessionId.slice(-6)}
                </span>
              )}
            </div>
            <p className="text-gray-300 text-sm">
              {dict.productAnalysis?.subtitle || "Commercial Intelligence Overview"}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatConfidence(analysis.metadata.confidenceScore)}
            </div>
            <div className="text-gray-400 text-xs">{t.analysisQuality}</div>
          </div>
        </div>

        {/* Image Preview (if uploaded) */}
        {uploadedImage && (
          <div className="mb-6">
            <div
              className="relative rounded-lg overflow-hidden bg-gray-700 cursor-pointer group hover:bg-gray-600 transition-colors"
              onClick={() => {
                // Trigger image modal - assuming setShowImageModal exists in store
                const { setShowImageModal } = useProductIntelligenceStore.getState();
                setShowImageModal(true);
              }}
              title="Click to enlarge"
            >
              <img
                src={imageUrl || ''}
                alt="Product"
                className="w-full max-h-48 object-contain bg-gray-800"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1">
                <span className="text-white text-xs">{uploadedImage.name}</span>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 rounded-full p-2">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* ⚡ Product Name */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {dict.productAnalysis.productName}
                {" - "}
                {productName || analysis.product?.name || "Product Name"}
              </h3>
            </div>
          </div>

          {/* 🏷️ Product Overview */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">🏷️</span>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {dict.productAnalysis?.productSummary || "Product Overview"}
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {analysis.product?.description ||
                  productDescription ||
                  `${productName || "This product"} is developed with a focus on quality and functionality. It provides innovative solutions that meet customer needs.`}
              </p>
            </div>
          </div>

          {/* ✨ Key Features */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">✨</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {dict.productAnalysis?.keyFeatures || "Key Features"}
              </h4>
              <ul className="space-y-1">
                {(
                  analysis.product?.keyFeatures || [
                    "High quality materials",
                    "Innovative design",
                    "Excellent performance",
                  ]
                )
                  .slice(0, showAllFeatures ? undefined : 3)
                  .map((feature, index) => (
                    <li key={index} className="flex items-start text-gray-300 text-sm">
                      <span className="text-blue-400 mr-2 mt-1">•</span>
                      {feature}
                    </li>
                  ))}
              </ul>
              {(analysis.product?.keyFeatures?.length || 0) > 3 && (
                <button
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="text-gray-500 hover:text-gray-300 transition-colors text-sm mt-2 cursor-pointer"
                >
                  {showAllFeatures
                    ? "Show less"
                    : `+${(analysis.product?.keyFeatures?.length || 0) - 3} ${dict.productAnalysis?.moreFeatures || "more features"}`}
                </button>
              )}
            </div>
          </div>

          {/* 🎯 Target Audience */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">🎯</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {dict.productAnalysis?.targetAudience || "Target Audience"}
              </h4>

              {/* Age Range */}
              {analysis.targetAudience?.ageRange && (
                <div className="mb-1">
                  <span className="text-xs text-gray-400">
                    {dict.productAnalysis?.ageRange || "年齢層"}:
                  </span>
                  <span className="text-gray-300 text-sm ml-2">
                    {analysis.targetAudience.ageRange}
                  </span>
                </div>
              )}

              {/* Target Description */}
              <div>
                <span className="text-xs text-gray-400">
                  {dict.productAnalysis?.targetDescription || "対象者"}:
                </span>
                <p className="text-gray-300 text-sm mt-1">
                  {analysis.targetAudience?.description ||
                    "executive professionals, tech entrepreneurs, creative directors"}
                </p>
              </div>
            </div>
          </div>

          {/* 📈 Marketing Messages */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">📈</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                {t.marketingStrategy || "Marketing Messages"}
              </h4>

              {/* Headline */}
              <div className="mb-2">
                <span className="text-xs text-gray-400">{t.headline}:</span>
                <p className="text-white font-semibold">
                  {analysis.keyMessages?.headline || "Premium Quality Product"}
                </p>
              </div>

              {/* Tagline */}
              <div className="mb-3">
                <span className="text-xs text-gray-400">{t.tagline}:</span>
                <p className="text-blue-400 font-medium italic">
                  "{analysis.keyMessages?.tagline || "Excellence in Every Detail"}"
                </p>
              </div>

              {/* Supporting Messages */}
              {(
                analysis.keyMessages?.supportingMessages || [
                  "Trusted by professionals",
                  "Built to last",
                ]
              ).length > 0 && (
                <div>
                  <span className="text-xs text-gray-400">{t.supportingMessages}:</span>
                  <div className="mt-1">
                    {(
                      analysis.keyMessages?.supportingMessages || [
                        "Trusted by professionals",
                        "Built to last",
                      ]
                    ).map((message, index) => (
                      <p key={index} className="text-gray-300 text-sm flex items-start">
                        <span className="text-blue-400 mr-2 mt-1">•</span>
                        {message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 mt-6 border-t border-gray-600">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    dict.common?.confirmRestart || "Are you sure you want to reset the session?"
                  )
                ) {
                  resetSession();
                }
              }}
              className="cursor-pointer px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-medium hover:border-gray-500 hover:text-white transition-colors"
            >
              {t.resetSession}
            </button>

            <Button
              onClick={() => setShowHandoffModal(true)}
              className="px-4 py-2 text-white rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors cursor-pointer text-sm font-medium flex-1 sm:flex-none"
            >
              {t.proceedToNextAgent}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>{new Date(analysis.metadata.timestamp).toLocaleString(locale)}</span>
            <span>
              {t.processingTime}: {(analysis.metadata.processingTime / 1000).toFixed(1)}s |{t.cost}:
              ${analysis.metadata.cost?.current?.toFixed(3) || "0.000"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductAnalysisCard;
