/**
 * Commercial-Focused Product Analysis Card
 *
 * Shows commercial intelligence instead of technical product specs
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

  // Get analysis from store
  const { analysis } = useProductIntelligenceStore();

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
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {t.title}
          </h2>

          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {formatConfidence(analysis.metadata.confidenceScore)}
              </div>
              <div className="text-gray-500">{t.commercialViability}</div>
            </div>
          </div>
        </div>

        {/* 🎯 Commercial Assessment */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            🎯 {t.commercialAssessment}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.marketPosition}</h4>
              <p className="text-gray-600">
                {analysis.positioning?.marketPosition?.tier || 'Premium professional product'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.purchaseDriver}</h4>
              <p className="text-gray-600">
                {analysis.positioning?.valueProposition?.primaryBenefit || 'Quality and performance'}
              </p>
            </div>
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={() => handleRefineRequest('commercial assessment')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              {t.askForDetails} →
            </button>
          </div>
        </div>

        {/* 👥 Primary Buyers */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            👥 {t.primaryBuyers}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.targetAudience}</h4>
              <p className="text-gray-600">
                {analysis.targetAudience?.primary?.demographics?.ageRange
                  ? `Professionals aged ${analysis.targetAudience.primary.demographics.ageRange}`
                  : 'Professionals aged 25-45'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.purchaseMotivation}</h4>
              <p className="text-gray-600">
                {analysis.targetAudience?.primary?.psychographics?.values?.[0] || 'Quality over price, long-term value'}
              </p>
            </div>
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={() => handleRefineRequest('target buyers')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              {t.askForDetails} →
            </button>
          </div>
        </div>

        {/* 🎬 Commercial Messages */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            🎬 {t.commercialMessages}
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">{t.headline}</h4>
              <p className="text-gray-900 font-semibold text-lg">
                {analysis.keyMessages?.headline || 'Premium Quality Product'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-1">{t.tagline}</h4>
              <p className="text-gray-600">
                {analysis.keyMessages?.tagline || 'Excellence in Every Detail'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.supportingMessages}</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                {(analysis.keyMessages?.supportingMessages || ['Trusted by professionals', 'Built to last']).map((message, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={() => handleRefineRequest('key messages')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              {t.askForDetails} →
            </button>
          </div>
        </div>

        {/* 📈 Market Strategy */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            📈 {t.marketStrategy}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.uniqueAngle}</h4>
              <p className="text-gray-600">
                {analysis.positioning?.valueProposition?.differentiators?.[0] || 'Professional-grade reliability'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.emotionalAppeal}</h4>
              <p className="text-gray-600">
                {analysis.positioning?.competitiveAdvantages?.emotional?.[0] || 'Confidence & status'}
              </p>
            </div>
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={() => handleRefineRequest('market strategy')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              {t.askForDetails} →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
          <div className="flex justify-between items-center">
            <span>{new Date(analysis.metadata.timestamp).toLocaleString(locale)}</span>
            <span>{t.processingTime}: {(analysis.metadata.processingTime / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductAnalysisCard;