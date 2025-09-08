/**
 * Response Parser Utilities
 *
 * Utilities for parsing and validating API responses from Gemini Vision API.
 * Handles JSON extraction, data validation, and confidence calculation.
 */

import { ProductAnalysis, VisionAnalysisRequest } from "../types";
import { FallbackGenerator } from "./fallback-generator";

/**
 * Parse result interface
 */
export interface ParseResult {
  analysis: ProductAnalysis;
  confidence: number;
  warnings: string[];
}

/**
 * Response Parser class
 */
export class ResponseParser {
  private static fallbackGenerator = new FallbackGenerator();

  /**
   * Parse Gemini response into structured analysis
   */
  public static parseAnalysisResponse(
    responseText: string,
    request: VisionAnalysisRequest
  ): ProductAnalysis {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Add metadata
      const analysis: ProductAnalysis = {
        ...parsed,
        metadata: {
          sessionId: request.sessionId,
          analysisVersion: "1.0.0",
          confidenceScore: 0.85, // Will be calculated later
          processingTime: 0, // Will be set by caller
          cost: {
            current: 0, // Will be set by caller
            total: 0,
            breakdown: {
              imageAnalysis: 0,
              chatInteractions: 0,
            },
            remaining: 300,
            budgetAlert: false,
          },
          locale: request.locale,
          timestamp: new Date().toISOString(),
          agentInteractions: 1,
        },
      };

      return analysis;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      console.error("Response text:", responseText);

      // Return minimal fallback analysis
      return this.fallbackGenerator.generateFallbackAnalysis({ request });
    }
  }

  /**
   * Parse analysis response with confidence calculation and validation
   */
  public static parseWithValidation(
    responseText: string,
    request: VisionAnalysisRequest
  ): ParseResult {
    const analysis = this.parseAnalysisResponse(responseText, request);
    const confidence = this.calculateConfidence(analysis, responseText);
    const warnings = this.validateAnalysisCompleteness(analysis);

    // Update confidence in metadata
    analysis.metadata.confidenceScore = confidence;

    return {
      analysis,
      confidence,
      warnings,
    };
  }

  /**
   * Calculate confidence score based on analysis completeness
   */
  public static calculateConfidence(analysis: ProductAnalysis, rawResponse: string): number {
    let score = 0.5; // Base score

    // Check completeness of key sections
    if (analysis.product.keyFeatures.length > 0) score += 0.1;
    if (analysis.targetAudience.primary.demographics.ageRange !== "unknown") score += 0.1;
    if (analysis.positioning.valueProposition.primaryBenefit !== "unknown") score += 0.1;
    if (analysis.commercialStrategy.keyMessages.headline !== "unknown") score += 0.1;
    if (analysis.visualPreferences.overallStyle !== "classic") score += 0.1;

    // Check response quality indicators
    if (rawResponse.length > 2000) score += 0.05;
    if (analysis.product.colors.length > 1) score += 0.05;

    // Check for product-specific details
    if (analysis.product.description.length > 50) score += 0.05;
    if (analysis.product.materials.length > 1) score += 0.05;

    // Check target audience specificity
    if (analysis.targetAudience.primary.demographics.incomeLevel !== "mid-range") score += 0.05;
    if (analysis.targetAudience.primary.psychographics.values.length > 2) score += 0.05;

    // Check commercial strategy depth
    if (analysis.commercialStrategy.emotionalTriggers.secondary.length > 0) score += 0.05;
    if (analysis.commercialStrategy.keyMessages.supportingMessages?.length > 2) score += 0.05;

    return Math.min(score, 0.95); // Cap at 95%
  }

  /**
   * Validate analysis completeness and return warnings
   */
  public static validateAnalysisCompleteness(analysis: ProductAnalysis): string[] {
    const warnings: string[] = [];

    // Product validation
    if (analysis.product.keyFeatures.length === 0) {
      warnings.push("No product features identified");
    }

    if (analysis.product.colors.length === 0) {
      warnings.push("No product colors identified");
    }

    if (analysis.product.description.length < 20) {
      warnings.push("Product description is too brief");
    }

    // Target audience validation
    if (analysis.targetAudience.primary.demographics.ageRange === "unknown") {
      warnings.push("Target age range not determined");
    }

    if (analysis.targetAudience.primary.psychographics.values.length === 0) {
      warnings.push("No target audience values identified");
    }

    // Positioning validation
    if (analysis.positioning.valueProposition.primaryBenefit === "unknown") {
      warnings.push("Primary value proposition not identified");
    }

    if (analysis.positioning.competitiveAdvantages.functional.length === 0) {
      warnings.push("No functional competitive advantages identified");
    }

    // Commercial strategy validation
    if (analysis.commercialStrategy.keyMessages.headline === "unknown") {
      warnings.push("No compelling headline generated");
    }

    if (analysis.commercialStrategy.keyScenes.opening === "unknown") {
      warnings.push("Commercial scenes not properly generated");
    }

    // Overall confidence validation
    if (analysis.metadata.confidenceScore < 0.7) {
      warnings.push("Low confidence analysis - consider manual review");
    }

    return warnings;
  }

  /**
   * Clean and sanitize JSON text from API response
   */
  public static cleanJsonResponse(responseText: string): string {
    // Remove any markdown code blocks
    let cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();

    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    throw new Error("No valid JSON found in response");
  }

  /**
   * Validate JSON structure matches expected ProductAnalysis schema
   */
  public static validateJsonStructure(jsonData: any): boolean {
    try {
      // Check required top-level properties
      const requiredProperties = [
        "product",
        "targetAudience",
        "positioning",
        "commercialStrategy",
        "visualPreferences",
      ];

      for (const prop of requiredProperties) {
        if (!jsonData[prop]) {
          console.warn(`Missing required property: ${prop}`);
          return false;
        }
      }

      // Check nested product properties
      if (!jsonData.product.category || !jsonData.product.name) {
        console.warn("Missing required product properties");
        return false;
      }

      // Check arrays are actually arrays
      if (!Array.isArray(jsonData.product.keyFeatures)) {
        console.warn("keyFeatures should be an array");
        return false;
      }

      return true;
    } catch (error) {
      console.warn("JSON structure validation failed:", error);
      return false;
    }
  }

  /**
   * Parse and validate scene generation response
   */
  public static parseSceneResponse(responseText: string): any {
    try {
      const cleaned = this.cleanJsonResponse(responseText);
      const parsed = JSON.parse(cleaned);

      if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
        throw new Error("Invalid scene response format");
      }

      return parsed;
    } catch (error) {
      console.warn("Failed to parse scene response:", error);
      return null;
    }
  }
}
