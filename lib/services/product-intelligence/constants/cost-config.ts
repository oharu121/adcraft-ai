/**
 * Cost Configuration for Gemini Vision API
 * 
 * Pricing structure and cost calculation constants for different API usage scenarios.
 * Based on Google Cloud Vertex AI and Gemini AI Studio pricing.
 */

/**
 * Cost configuration interface
 */
export interface CostConfig {
  inputTokenCost: number;    // Cost per 1000 input tokens
  outputTokenCost: number;   // Cost per 1000 output tokens
  imageBaseCost: number;     // Base cost per image analysis
}

/**
 * Cost configuration for Gemini Vision API (per 1000 tokens)
 * 
 * Pricing based on:
 * - Vertex AI Gemini Pro Vision pricing
 * - AI Studio API pricing
 * - Image analysis base costs
 */
export const GEMINI_COST_CONFIG: CostConfig = {
  inputTokenCost: 0.00025,   // $0.00025 per 1k input tokens
  outputTokenCost: 0.0005,   // $0.0005 per 1k output tokens
  imageBaseCost: 0.00125,    // Base cost per image analysis
};

/**
 * Budget configuration for demo/production environments
 */
export const BUDGET_CONFIG = {
  totalBudget: 300,          // Total budget in USD
  alertThresholds: {
    warning: 0.75,           // 75% of budget used
    critical: 0.90,          // 90% of budget used
  },
  dailyLimit: 50,            // Daily spending limit
  perRequestLimit: 5,        // Maximum cost per request
};

/**
 * Cost calculation helper functions
 */
export class CostCalculator {
  private config: CostConfig;

  constructor(config: CostConfig = GEMINI_COST_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate total cost for API usage
   */
  calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    const inputCost = (usage.input_tokens / 1000) * this.config.inputTokenCost;
    const outputCost = (usage.output_tokens / 1000) * this.config.outputTokenCost;
    const imageCost = this.config.imageBaseCost;

    return inputCost + outputCost + imageCost;
  }

  /**
   * Estimate cost for prompt and expected response
   */
  estimateCost(promptLength: number, expectedResponseLength: number): number {
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedInputTokens = Math.ceil(promptLength / 4);
    const estimatedOutputTokens = Math.ceil(expectedResponseLength / 4);

    return this.calculateCost({
      input_tokens: estimatedInputTokens,
      output_tokens: estimatedOutputTokens,
    });
  }

  /**
   * Check if cost exceeds budget thresholds
   */
  checkBudgetAlert(currentSpend: number, totalBudget: number = BUDGET_CONFIG.totalBudget): {
    alert: boolean;
    level: "none" | "warning" | "critical";
    percentage: number;
  } {
    const percentage = currentSpend / totalBudget;
    
    if (percentage >= BUDGET_CONFIG.alertThresholds.critical) {
      return { alert: true, level: "critical", percentage };
    } else if (percentage >= BUDGET_CONFIG.alertThresholds.warning) {
      return { alert: true, level: "warning", percentage };
    }
    
    return { alert: false, level: "none", percentage };
  }
}