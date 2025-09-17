/**
 * Maya Handoff Validator - Simplified for Clean Architecture
 *
 * Simple validation for the clean ProductAnalysis + image handoff
 */

import { MayaHandoffData } from "./maya-handoff-manager";

export interface HandoffValidation {
  isValid: boolean;
  completeness: number;
  missingElements: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Simplified Handoff Validator
 */
export class MayaHandoffValidator {
  private static instance: MayaHandoffValidator;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MayaHandoffValidator {
    if (!MayaHandoffValidator.instance) {
      MayaHandoffValidator.instance = new MayaHandoffValidator();
    }
    return MayaHandoffValidator.instance;
  }

  /**
   * Validate simplified Maya handoff data
   */
  public validateHandoffData(mayaHandoffData: MayaHandoffData): HandoffValidation {
    const missingElements: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check required fields
    if (!mayaHandoffData.productAnalysis) {
      missingElements.push("productAnalysis");
    }

    if (!mayaHandoffData.originalImage) {
      missingElements.push("originalImage");
    }

    if (!mayaHandoffData.mayaSessionId) {
      missingElements.push("mayaSessionId");
    }

    // Check product analysis quality
    if (mayaHandoffData.productAnalysis) {
      const analysis = mayaHandoffData.productAnalysis;

      if (!analysis.product?.name) {
        warnings.push("Product name is missing");
      }

      if (!analysis.product?.keyFeatures?.length) {
        warnings.push("No product features identified");
      }

      if (!analysis.keyMessages?.headline) {
        warnings.push("No headline message");
      }

      if (analysis.metadata?.confidenceScore < 0.7) {
        warnings.push("Low analysis confidence score");
        recommendations.push("Consider re-analyzing the product");
      }
    }

    // Check image
    if (mayaHandoffData.originalImage && mayaHandoffData.originalImage.size > 10 * 1024 * 1024) {
      warnings.push("Large image file size may impact performance");
    }

    const isValid = missingElements.length === 0;
    const completeness = isValid ? (warnings.length === 0 ? 1.0 : 0.8) : 0.0;

    return {
      isValid,
      completeness,
      missingElements,
      warnings,
      recommendations
    };
  }
}