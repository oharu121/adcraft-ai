/**
 * Product Intelligence Agent - Product Analysis Card
 * 
 * Displays structured product analysis results from Vertex AI Gemini Pro Vision
 * with expandable sections and visual hierarchy.
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import type { Dictionary } from '@/lib/dictionaries';
import { ProductAnalysis } from '@/lib/agents/product-intelligence/types';

export interface ProductAnalysisCardProps {
  analysis: ProductAnalysis;
  dict: Dictionary;
  locale?: 'en' | 'ja';
  className?: string;
  onRefineRequest?: (topic: string, question: string) => void;
}

const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({
  analysis,
  dict,
  locale = 'en',
  className = '',
  onRefineRequest
}) => {

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

  // Format processing time
  const formatProcessingTime = (milliseconds: number): string => {
    const seconds = milliseconds / 1000;
    return `${seconds.toFixed(1)}s`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(3)}`;
  };

  // Render color swatch
  const renderColorSwatch = (color: any) => (
    <div key={color.hex} className="flex items-center space-x-2 mb-1">
      <div
        className="w-4 h-4 rounded border border-gray-300"
        style={{ backgroundColor: color.hex }}
        title={color.hex}
      />
      <span className="text-sm">{color.name}</span>
      <span className="text-xs text-gray-500">({color.role})</span>
    </div>
  );

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
              <div className="text-gray-500">{t.confidence}</div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <CollapsibleSection
          title={t.productInfo}
          defaultExpanded={true}
          className="mb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.category}</h4>
              <p className="text-gray-600 capitalize">{analysis.product.category}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.features}</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                {analysis.product.keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.materials}</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.product.materials.map((material, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {material}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.colors}</h4>
              <div className="space-y-1">
                {analysis.product.colors.map(renderColorSwatch)}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handleRefineRequest('product features')}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t.refineThis} →
          </button>
        </CollapsibleSection>

        {/* Target Audience */}
        <CollapsibleSection
          title={t.targetAudience}
          defaultExpanded={false}
          className="mb-4"
        >
          <div className="space-y-4">
            {/* Primary Audience */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">{t.primary}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">{t.demographics}</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><span className="font-medium">{t.ageRange}:</span> {analysis.targetAudience.primary.demographics.ageRange}</div>
                    <div><span className="font-medium">{t.gender}:</span> {analysis.targetAudience.primary.demographics.gender}</div>
                    <div><span className="font-medium">{t.income}:</span> {analysis.targetAudience.primary.demographics.incomeLevel}</div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">{t.psychographics}</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.values}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.targetAudience.primary.psychographics.values.map((value, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">{t.behaviors}</h5>
                  <div className="text-sm text-gray-600">
                    <div><span className="font-medium">{t.brandLoyalty}:</span> {analysis.targetAudience.primary.behaviors.brandLoyalty}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handleRefineRequest('target audience')}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t.refineThis} →
          </button>
        </CollapsibleSection>

        {/* Brand Positioning */}
        <CollapsibleSection
          title={t.positioning}
          defaultExpanded={false}
          className="mb-4"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.valueProposition}</h4>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">
                  {analysis.positioning.valueProposition.primaryBenefit}
                </p>
                <ul className="text-blue-700 text-sm space-y-1">
                  {analysis.positioning.valueProposition.supportingBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.competitiveAdvantages}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-1">{t.functional}</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.positioning.competitiveAdvantages.functional.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-1">{t.emotional}</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.positioning.competitiveAdvantages.emotional.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-1">{t.experiential}</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.positioning.competitiveAdvantages.experiential.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handleRefineRequest('brand positioning')}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t.refineThis} →
          </button>
        </CollapsibleSection>

        {/* Commercial Strategy */}
        <CollapsibleSection
          title={t.commercialStrategy}
          defaultExpanded={false}
          className="mb-4"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">{t.keyMessages}</h4>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="font-bold text-yellow-900 text-lg mb-1">
                  {analysis.commercialStrategy.keyMessages.headline}
                </h5>
                <p className="text-yellow-800 font-medium mb-2">
                  {analysis.commercialStrategy.keyMessages.tagline}
                </p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {analysis.commercialStrategy.keyMessages.supportingMessages.map((message, index) => (
                    <li key={index}>• {message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handleRefineRequest('commercial strategy')}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t.refineThis} →
          </button>
        </CollapsibleSection>

        {/* Visual Preferences */}
        <CollapsibleSection
          title={t.visualPreferences}
          defaultExpanded={false}
          className="mb-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">{t.overallStyle}</h4>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded capitalize">
                {analysis.visualPreferences.overallStyle}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">{t.mood}</h4>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded capitalize">
                {analysis.visualPreferences.mood}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">{t.composition}</h4>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded capitalize">
                {analysis.visualPreferences.composition}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">{t.lighting}</h4>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded capitalize">
                {analysis.visualPreferences.lighting}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => handleRefineRequest('visual preferences')}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t.refineThis} →
          </button>
        </CollapsibleSection>

        {/* Metadata */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{t.processingTime}: {formatProcessingTime(analysis.metadata.processingTime)}</span>
              <span>{t.cost}: {formatCurrency(analysis.metadata.cost.current)}</span>
            </div>
            <div className="text-xs">
              {new Date(analysis.metadata.timestamp).toLocaleString(locale)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductAnalysisCard;