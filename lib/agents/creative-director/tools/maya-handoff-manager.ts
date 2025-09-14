/**
 * Maya Handoff Manager - Simplified for Clean Architecture
 *
 * Handles the handoff from Maya (Product Intelligence) to David (Creative Director)
 * Passes clean ProductAnalysis + original image for David's own analysis
 */

import { ProductAnalysis } from "@/lib/agents/product-intelligence/types";

export interface MayaHandoffData {
  // Core Maya analysis - clean product intelligence only
  productAnalysis: ProductAnalysis;

  // Original product image for David's visual analysis
  originalImage: File;

  // Session metadata
  mayaSessionId: string;
  handoffTimestamp: string;
  locale: "en" | "ja";
}

/**
 * Simplified Maya Handoff Manager
 * David will do his own visual analysis from ProductAnalysis + image
 */
export class MayaHandoffManager {
  private static instance: MayaHandoffManager;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MayaHandoffManager {
    if (!MayaHandoffManager.instance) {
      MayaHandoffManager.instance = new MayaHandoffManager();
    }
    return MayaHandoffManager.instance;
  }

  /**
   * Process Maya handoff - simplified to pass clean data to David
   */
  public async processHandoff(
    sessionId: string,
    mayaHandoffData: MayaHandoffData
  ): Promise<{
    success: boolean;
    productAnalysis: ProductAnalysis;
    originalImage: File;
    locale: "en" | "ja";
  }> {
    console.log(`[MAYA HANDOFF] Processing handoff for session: ${sessionId}`);

    try {
      // Simple validation
      if (!mayaHandoffData.productAnalysis || !mayaHandoffData.originalImage) {
        throw new Error('Missing required handoff data: productAnalysis or originalImage');
      }

      // Simple pass-through - David will analyze everything himself
      console.log(`[MAYA HANDOFF] Successfully processed handoff for session: ${sessionId}`);

      return {
        success: true,
        productAnalysis: mayaHandoffData.productAnalysis,
        originalImage: mayaHandoffData.originalImage,
        locale: mayaHandoffData.locale
      };

    } catch (error) {
      console.error(`[MAYA HANDOFF] Failed to process handoff for session ${sessionId}:`, error);

      throw error; // Let the caller handle the error
    }
  }
}