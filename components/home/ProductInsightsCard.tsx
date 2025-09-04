"use client";

import { Card } from "@/components/ui";
import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import type { Dictionary } from "@/lib/dictionaries";

interface ProductInsightsCardProps {
  dict: Dictionary;
  onImageClick: () => void;
}

export default function ProductInsightsCard({ dict, onImageClick }: ProductInsightsCardProps) {
  const {
    sessionId,
    uploadedImage,
    productDescription,
    inputMode,
    analysis,
    showAllFeatures,
    setShowAllFeatures,
  } = useProductIntelligenceStore();

  if (!(uploadedImage || (inputMode === "text" && productDescription))) {
    return null;
  }

  return (
    <Card variant="magical" className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-semibold text-white">
            {dict.productAnalysis.title}
          </h3>
          {sessionId && (
            <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded border border-gray-600 font-mono">
              #{sessionId.slice(-6)}
            </span>
          )}
        </div>
        <p className="text-gray-300 text-sm">{dict.productAnalysis.subtitle}</p>
      </div>

      <div className="space-y-4">
        {/* Product Input Display */}
        {uploadedImage ? (
          /* Image Preview */
          <div
            className="relative rounded-lg overflow-hidden bg-gray-700 cursor-pointer group hover:bg-gray-600 transition-colors"
            onClick={onImageClick}
            title="Click to enlarge"
          >
            <img
              src={URL.createObjectURL(uploadedImage)}
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
        ) : (
          productDescription && (
            /* Text Description Preview */
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-300 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {dict.productAnalysis.productDescription}
                </h4>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {productDescription.length > 200
                  ? `${productDescription.substring(0, 200)}...`
                  : productDescription}
              </p>
            </div>
          )
        )}

        {/* Dynamic Product Analysis */}
        <div className="bg-gray-800/30 rounded-lg p-3 relative">
          {/* Trust Score - Top Right */}
          {analysis?.metadata?.confidenceScore && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium border border-green-500/30">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {Math.round(analysis.metadata.confidenceScore * 100)}%
              </div>
            </div>
          )}

          <div className="space-y-3 pr-16">
            {/* Product Name */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                  ⚡
                </span>
                {dict.productAnalysis.productName} - {analysis?.product.name}
              </h4>
            </div>

            {/* Product Summary */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                  🏷️
                </span>
                {dict.productAnalysis.productSummary}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {analysis?.product
                  ? analysis.product.description
                  : dict.productAnalysis.analyzingFeatures}
              </p>
            </div>

            {/* Key Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                  ✨
                </span>
                {dict.productAnalysis.keyFeatures}
              </h4>
              <div className="text-xs text-gray-400 leading-relaxed">
                {analysis?.product?.keyFeatures ? (
                  <ul className="space-y-1">
                    {analysis.product.keyFeatures
                      .slice(0, showAllFeatures ? undefined : 3)
                      .map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2 mt-0.5">•</span>
                          {feature}
                        </li>
                      ))}
                    {analysis.product.keyFeatures.length > 3 && (
                      <li className="ml-4">
                        <button
                          onClick={() => setShowAllFeatures(!showAllFeatures)}
                          className="text-gray-500 hover:text-gray-300 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                        >
                          {showAllFeatures ? (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                              {dict.productAnalysis.showLess}
                            </>
                          ) : (
                            <>
                              +{analysis.product.keyFeatures.length - 3}{" "}
                              {dict.productAnalysis.moreFeatures}
                              <svg
                                className="w-3 h-3"
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
                            </>
                          )}
                        </button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <span>{dict.productAnalysis.analyzingFeatures}</span>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                  🎯
                </span>
                {dict.productAnalysis.targetAudience}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {analysis?.targetAudience?.primary
                  ? `${analysis.targetAudience.primary.demographics.ageRange}, ${analysis.targetAudience.primary.demographics.lifestyle?.join(", ")}`
                  : dict.productAnalysis.analyzingTargetAudience}
              </p>
            </div>

            {/* Marketing */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                  📈
                </span>
                {dict.productAnalysis.marketing}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {analysis?.positioning?.valueProposition
                  ? analysis.positioning.valueProposition.primaryBenefit
                  : dict.productAnalysis.analyzingMarketingStrategy}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}