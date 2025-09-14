/**
 * Product Intelligence Agent - Product Analysis Card
 *
 * Clean, simple commercial-focused analysis display
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { Dictionary } from '@/lib/dictionaries';
import { useProductIntelligenceStore } from '@/lib/stores/product-intelligence-store';

export interface ProductAnalysisCardProps {
  dict: Dictionary;
  locale?: 'en' | 'ja';
  className?: string;
  onRefineRequest?: (topic: string, question: string) => void;
}

const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({
  dict,
  locale = 'en',
  className = '',
  onRefineRequest
}) => {

  // Get data from store
  const {
    analysis,
    uploadedImage,
    productName,
    productDescription,
    inputMode,
    showAllFeatures,
    setShowAllFeatures
  } = useProductIntelligenceStore();

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
            <h2 className="text-xl font-bold text-white mb-1">
              {dict.productAnalysis?.title || 'Product Analysis Results'}
            </h2>
            <p className="text-gray-300 text-sm">
              {dict.productAnalysis?.subtitle || 'Commercial Intelligence Overview'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatConfidence(analysis.metadata.confidenceScore)}
            </div>
            <div className="text-gray-400 text-xs">{t.commercialViability || 'Confidence'}</div>
          </div>
        </div>

        {/* Image Preview (if uploaded) */}
        {uploadedImage && (
          <div className="mb-6">
            <div className="relative rounded-lg overflow-hidden bg-gray-700">
              <img
                src={URL.createObjectURL(uploadedImage)}
                alt="Product"
                className="w-full max-h-48 object-contain bg-gray-800"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1">
                <span className="text-white text-xs">{uploadedImage.name}</span>
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
                {productName || analysis.product?.name || 'Product Name'}
              </h3>
            </div>
          </div>

          {/* 🏷️ Product Overview + Tagline */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">🏷️</span>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {dict.productAnalysis?.productSummary || 'Product Overview'}
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                {productDescription || analysis.product?.description ||
                 `${productName || 'This product'} is developed with a focus on quality and functionality. It provides innovative solutions that meet customer needs.`}
              </p>
              {analysis.keyMessages?.tagline && (
                <p className="text-blue-400 text-sm font-medium italic">
                  "{analysis.keyMessages.tagline}"
                </p>
              )}
            </div>
          </div>

          {/* ✨ Key Features */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">✨</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {dict.productAnalysis?.keyFeatures || 'Key Features'}
              </h4>
              <ul className="space-y-1">
                {(analysis.product?.keyFeatures || ['High quality materials', 'Innovative design', 'Excellent performance'])
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
                  {showAllFeatures ? (
                    'Show less'
                  ) : (
                    `+${(analysis.product?.keyFeatures?.length || 0) - 3} ${dict.productAnalysis?.moreFeatures || 'more features'}`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 🎯 Target Audience */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">🎯</span>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {dict.productAnalysis?.targetAudience || 'Target Audience'}
              </h4>
              <p className="text-gray-300 text-sm">
                {analysis.targetAudience?.primary?.demographics?.ageRange &&
                 `${analysis.targetAudience.primary.demographics.ageRange}, `}
                {analysis.targetAudience?.primary?.demographics?.lifestyle?.join(', ') ||
                 analysis.targetAudience?.primary?.psychographics?.values?.join(', ') ||
                 'executive professionals, tech entrepreneurs, creative directors'}
              </p>
            </div>
          </div>

          {/* 📈 Marketing */}
          <div className="flex items-start space-x-3">
            <span className="text-xl">📈</span>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {dict.productAnalysis?.marketing || 'Marketing'}
              </h4>
              <p className="text-gray-300 text-sm">
                {analysis.positioning?.valueProposition?.primaryBenefit ||
                 analysis.keyMessages?.headline ||
                 `${productName || 'This product'} meets your needs`}
              </p>
              {analysis.keyMessages?.supportingMessages && (
                <div className="mt-2">
                  {analysis.keyMessages.supportingMessages.slice(0, 2).map((message, index) => (
                    <p key={index} className="text-gray-400 text-xs">
                      • {message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-6 border-t border-gray-600 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>{new Date(analysis.metadata.timestamp).toLocaleString(locale)}</span>
            <span>
              {t.processingTime}: {(analysis.metadata.processingTime / 1000).toFixed(1)}s |
              {t.cost}: ${analysis.metadata.cost?.current?.toFixed(3) || '0.000'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductAnalysisCard;