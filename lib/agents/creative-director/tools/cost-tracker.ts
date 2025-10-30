/**
 * Creative Director Cost Tracker
 *
 * Comprehensive cost tracking and budget monitoring for David's creative operations,
 * including Imagen API costs, Cloud Storage costs, and budget protection.
 */

import { FirestoreService } from "@/lib/services/firestore";

export interface CostCategory {
  service: "imagen" | "storage" | "firestore" | "gemini" | "vertex-ai" | "other";
  operation: string;
  model?: string;
  quality?: string;
}

export interface CostEntry {
  id: string;
  sessionId: string;
  category: CostCategory;
  amount: number;
  currency: "USD";
  description: string;
  metadata: {
    timestamp: string;
    assetId?: string;
    generationId?: string;
    processingTime?: number;
    resourceUsage?: any;
  };
  budgetImpact: {
    sessionBudget: number;
    totalBudget: number;
    percentageUsed: number;
  };
}

export interface BudgetAlert {
  id: string;
  sessionId: string;
  alertType: "warning" | "critical" | "exceeded";
  threshold: number;
  currentUsage: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface CostAnalytics {
  totalSpent: number;
  budgetRemaining: number;
  utilizationRate: number;

  byService: Record<
    string,
    {
      amount: number;
      count: number;
      averageCost: number;
    }
  >;

  byAssetType: Record<
    string,
    {
      amount: number;
      count: number;
      averageCost: number;
    }
  >;

  byQuality: Record<
    string,
    {
      amount: number;
      count: number;
      averageCost: number;
    }
  >;

  trends: {
    hourlySpend: number;
    projectedDailySpend: number;
    efficiency: number; // cost per successful asset
  };

  optimization: {
    potentialSavings: number;
    recommendations: string[];
  };
}

export interface BudgetConfiguration {
  totalBudget: number;
  sessionBudget: number;
  alertThresholds: {
    warning: number; // e.g., 0.5 for 50%
    critical: number; // e.g., 0.8 for 80%
  };
  limits: {
    maxCostPerAsset: number;
    maxAssetsPerSession: number;
    maxDailySpend: number;
  };
}

/**
 * Creative Director Cost Tracker
 * Provides comprehensive cost tracking and budget management for David's operations
 */
export class CreativeDirectorCostTracker {
  private static instance: CreativeDirectorCostTracker;
  private firestore: FirestoreService;
  private defaultBudgetConfig: BudgetConfiguration = {
    totalBudget: 300, // $300 total project budget
    sessionBudget: 50, // $50 per session
    alertThresholds: {
      warning: 0.5,
      critical: 0.8,
    },
    limits: {
      maxCostPerAsset: 10,
      maxAssetsPerSession: 20,
      maxDailySpend: 100,
    },
  };

  private constructor() {
    this.firestore = FirestoreService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorCostTracker {
    if (!CreativeDirectorCostTracker.instance) {
      CreativeDirectorCostTracker.instance = new CreativeDirectorCostTracker();
    }
    return CreativeDirectorCostTracker.instance;
  }

  /**
   * Track cost entry with comprehensive metadata
   */
  public async trackCost(
    sessionId: string,
    category: CostCategory,
    amount: number,
    description: string,
    metadata: any = {}
  ): Promise<CostEntry> {
    const costId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Calculate budget impact
    const sessionBudget = await this.getSessionBudget(sessionId);
    const currentSessionSpend = await this.getSessionSpend(sessionId);
    const totalBudget = this.defaultBudgetConfig.totalBudget;
    const totalSpend = await this.getTotalSpend();

    const budgetImpact = {
      sessionBudget,
      totalBudget,
      percentageUsed: ((totalSpend + amount) / totalBudget) * 100,
    };

    const costEntry: CostEntry = {
      id: costId,
      sessionId,
      category,
      amount,
      currency: "USD",
      description,
      metadata: {
        timestamp,
        ...metadata,
      },
      budgetImpact,
    };

    try {
      // Record cost in Firestore
      await this.firestore.recordCost({
        service: category.service,
        amount,
        currency: "USD",
        description: `${category.operation} - ${description}`,
        sessionId,
        timestamp: new Date(),
      });

      // Check for budget alerts
      await this.checkBudgetAlerts(sessionId, currentSessionSpend + amount, totalSpend + amount);

      console.log(
        `[COST TRACKER] Recorded cost: $${amount} for ${category.service}/${category.operation}`
      );
      return costEntry;
    } catch (error) {
      console.error("[COST TRACKER] Failed to track cost:", error);
      throw new Error(
        `Cost tracking failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Track Imagen generation cost
   */
  public async trackImagenCost(
    sessionId: string,
    model: string,
    imageCount: number,
    quality: string,
    processingTime: number,
    assetId: string,
    generationId: string
  ): Promise<CostEntry> {
    const baseCost = this.getImagenBaseCost(model);
    const qualityMultiplier = this.getQualityMultiplier(quality);
    const amount = baseCost * imageCount * qualityMultiplier;

    return await this.trackCost(
      sessionId,
      {
        service: "imagen",
        operation: "generate_image",
        model,
        quality,
      },
      amount,
      `Generated ${imageCount} image(s) with ${model} at ${quality} quality`,
      {
        assetId,
        generationId,
        processingTime,
        imageCount,
        resourceUsage: {
          model,
          quality,
          inferenceSteps: this.estimateInferenceSteps(quality),
        },
      }
    );
  }

  /**
   * Track Cloud Storage cost
   */
  public async trackStorageCost(
    sessionId: string,
    operation: "upload" | "download" | "storage",
    fileSize: number,
    fileName: string,
    assetId?: string
  ): Promise<CostEntry> {
    const amount = this.calculateStorageCost(operation, fileSize);

    return await this.trackCost(
      sessionId,
      {
        service: "storage",
        operation,
      },
      amount,
      `Storage operation: ${operation} for ${fileName}`,
      {
        assetId,
        fileName,
        fileSize,
        resourceUsage: {
          operation,
          fileSize,
          storageClass: "standard",
        },
      }
    );
  }

  /**
   * Track Gemini conversation cost
   */
  public async trackGeminiCost(
    sessionId: string,
    inputTokens: number,
    outputTokens: number,
    model: string = process.env.GEMINI_MODEL || "gemini-2.5-flash"
  ): Promise<CostEntry> {
    const inputCost = (inputTokens / 1000) * 0.00125; // $0.00125 per 1K input tokens
    const outputCost = (outputTokens / 1000) * 0.00375; // $0.00375 per 1K output tokens
    const amount = inputCost + outputCost;

    return await this.trackCost(
      sessionId,
      {
        service: "gemini",
        operation: "generate_response",
        model,
      },
      amount,
      `Gemini conversation: ${inputTokens} input + ${outputTokens} output tokens`,
      {
        inputTokens,
        outputTokens,
        resourceUsage: {
          model,
          totalTokens: inputTokens + outputTokens,
          inputCost,
          outputCost,
        },
      }
    );
  }

  /**
   * Get session cost analytics
   */
  public async getSessionAnalytics(sessionId: string): Promise<CostAnalytics> {
    try {
      // This would query Firestore for session-specific costs
      // For now, we'll provide estimated analytics
      const sessionSpend = await this.getSessionSpend(sessionId);
      const sessionBudget = await this.getSessionBudget(sessionId);

      return {
        totalSpent: sessionSpend,
        budgetRemaining: sessionBudget - sessionSpend,
        utilizationRate: (sessionSpend / sessionBudget) * 100,

        byService: {
          imagen: { amount: sessionSpend * 0.7, count: 5, averageCost: sessionSpend * 0.14 },
          storage: { amount: sessionSpend * 0.2, count: 10, averageCost: sessionSpend * 0.02 },
          gemini: { amount: sessionSpend * 0.1, count: 15, averageCost: sessionSpend * 0.0067 },
        },

        byAssetType: {
          "product-hero": { amount: sessionSpend * 0.4, count: 2, averageCost: sessionSpend * 0.2 },
          "lifestyle-scene": {
            amount: sessionSpend * 0.3,
            count: 2,
            averageCost: sessionSpend * 0.15,
          },
          background: { amount: sessionSpend * 0.2, count: 3, averageCost: sessionSpend * 0.067 },
          "mood-board": { amount: sessionSpend * 0.1, count: 1, averageCost: sessionSpend * 0.1 },
        },

        byQuality: {
          premium: { amount: sessionSpend * 0.5, count: 2, averageCost: sessionSpend * 0.25 },
          high: { amount: sessionSpend * 0.3, count: 3, averageCost: sessionSpend * 0.1 },
          standard: { amount: sessionSpend * 0.2, count: 3, averageCost: sessionSpend * 0.067 },
        },

        trends: {
          hourlySpend: sessionSpend / 2, // Assuming 2-hour session
          projectedDailySpend: (sessionSpend / 2) * 24,
          efficiency: sessionSpend / 8, // cost per successful asset
        },

        optimization: {
          potentialSavings: sessionSpend * 0.15,
          recommendations: [
            "Consider using high quality instead of premium for backgrounds",
            "Batch similar assets for cost efficiency",
            "Optimize prompts to reduce generation attempts",
          ],
        },
      };
    } catch (error) {
      console.error("[COST TRACKER] Failed to get analytics:", error);
      throw new Error("Failed to retrieve cost analytics");
    }
  }

  /**
   * Check budget alerts and create notifications
   */
  private async checkBudgetAlerts(
    sessionId: string,
    sessionSpend: number,
    totalSpend: number
  ): Promise<void> {
    const sessionBudget = await this.getSessionBudget(sessionId);
    const totalBudget = this.defaultBudgetConfig.totalBudget;

    const sessionUtilization = sessionSpend / sessionBudget;
    const totalUtilization = totalSpend / totalBudget;

    // Session budget alerts
    if (sessionUtilization >= this.defaultBudgetConfig.alertThresholds.critical) {
      await this.createBudgetAlert(
        sessionId,
        "critical",
        sessionUtilization,
        `Session budget critically high: ${(sessionUtilization * 100).toFixed(1)}%`
      );
    } else if (sessionUtilization >= this.defaultBudgetConfig.alertThresholds.warning) {
      await this.createBudgetAlert(
        sessionId,
        "warning",
        sessionUtilization,
        `Session budget warning: ${(sessionUtilization * 100).toFixed(1)}%`
      );
    }

    // Total budget alerts
    if (totalUtilization >= this.defaultBudgetConfig.alertThresholds.critical) {
      await this.createBudgetAlert(
        sessionId,
        "critical",
        totalUtilization,
        `Total project budget critically high: ${(totalUtilization * 100).toFixed(1)}%`
      );
    }
  }

  /**
   * Create budget alert
   */
  private async createBudgetAlert(
    sessionId: string,
    alertType: "warning" | "critical" | "exceeded",
    currentUsage: number,
    message: string
  ): Promise<void> {
    const alert: BudgetAlert = {
      id: crypto.randomUUID(),
      sessionId,
      alertType,
      threshold:
        alertType === "warning"
          ? this.defaultBudgetConfig.alertThresholds.warning
          : this.defaultBudgetConfig.alertThresholds.critical,
      currentUsage,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    // In a real implementation, this would be stored and possibly trigger notifications
    console.warn(`[BUDGET ALERT] ${alertType.toUpperCase()}: ${message}`);
  }

  /**
   * Get session spend total
   */
  private async getSessionSpend(sessionId: string): Promise<number> {
    // This would query Firestore for session-specific costs
    // For now, return mock data
    return Math.random() * 25; // $0-25 spent
  }

  /**
   * Get total spend across all sessions
   */
  private async getTotalSpend(): Promise<number> {
    try {
      return await this.firestore.getTotalCosts();
    } catch (error) {
      console.error("[COST TRACKER] Failed to get total spend:", error);
      return 0;
    }
  }

  /**
   * Get session budget allocation
   */
  private async getSessionBudget(sessionId: string): Promise<number> {
    // This could be stored per session, for now return default
    return this.defaultBudgetConfig.sessionBudget;
  }

  /**
   * Get Imagen base cost by model
   */
  private getImagenBaseCost(model: string): number {
    const costs = {
      "imagen-3": 0.03,
      "imagen-4": 0.04,
      "imagen-4-ultra": 0.06,
    } as Record<string, number>;

    return costs[model] || costs["imagen-3"];
  }

  /**
   * Get quality multiplier for cost calculation
   */
  private getQualityMultiplier(quality: string): number {
    const multipliers = {
      draft: 0.5,
      standard: 1.0,
      high: 1.5,
      premium: 2.5,
    } as Record<string, number>;

    return multipliers[quality] || multipliers["standard"];
  }

  /**
   * Estimate inference steps based on quality
   */
  private estimateInferenceSteps(quality: string): number {
    const steps = {
      draft: 20,
      standard: 30,
      high: 40,
      premium: 50,
    } as Record<string, number>;

    return steps[quality] || steps["standard"];
  }

  /**
   * Calculate storage cost based on operation and file size
   */
  private calculateStorageCost(operation: string, fileSize: number): number {
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);

    switch (operation) {
      case "upload":
        return fileSizeGB * 0.02; // $0.02 per GB uploaded
      case "download":
        return fileSizeGB * 0.12; // $0.12 per GB downloaded
      case "storage":
        return fileSizeGB * 0.02; // $0.020 per GB per month (prorated)
      default:
        return 0.001; // minimal cost
    }
  }

  /**
   * Check if operation is within budget limits
   */
  public async checkBudgetLimit(
    sessionId: string,
    estimatedCost: number,
    operation: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    budgetRemaining: number;
  }> {
    try {
      const sessionSpend = await this.getSessionSpend(sessionId);
      const sessionBudget = await this.getSessionBudget(sessionId);
      const budgetRemaining = sessionBudget - sessionSpend;

      // Check if the operation would exceed budget
      if (estimatedCost > budgetRemaining) {
        return {
          allowed: false,
          reason: `Operation cost ($${estimatedCost.toFixed(2)}) exceeds remaining budget ($${budgetRemaining.toFixed(2)})`,
          budgetRemaining,
        };
      }

      // Check per-asset limit
      if (
        operation.includes("asset") &&
        estimatedCost > this.defaultBudgetConfig.limits.maxCostPerAsset
      ) {
        return {
          allowed: false,
          reason: `Asset cost ($${estimatedCost.toFixed(2)}) exceeds per-asset limit ($${this.defaultBudgetConfig.limits.maxCostPerAsset})`,
          budgetRemaining,
        };
      }

      return {
        allowed: true,
        budgetRemaining,
      };
    } catch (error) {
      console.error("[COST TRACKER] Budget check failed:", error);
      return {
        allowed: false,
        reason: "Budget check failed",
        budgetRemaining: 0,
      };
    }
  }

  /**
   * Get cost optimization recommendations
   */
  public async getOptimizationRecommendations(sessionId: string): Promise<string[]> {
    const analytics = await this.getSessionAnalytics(sessionId);
    const recommendations: string[] = [];

    // High spend recommendations
    if (analytics.utilizationRate > 80) {
      recommendations.push("Consider reducing asset generation quality for non-critical assets");
      recommendations.push("Batch similar asset requests to improve efficiency");
    }

    // Service-specific recommendations
    if (analytics.byService.imagen?.amount > analytics.totalSpent * 0.8) {
      recommendations.push(
        "Imagen costs are high - optimize prompts to reduce generation attempts"
      );
      recommendations.push("Consider using Imagen-3 instead of Imagen-4 for draft assets");
    }

    // Quality recommendations
    if (analytics.byQuality.premium?.amount > analytics.totalSpent * 0.6) {
      recommendations.push(
        "Consider using 'high' quality instead of 'premium' for background assets"
      );
    }

    return recommendations.length > 0 ? recommendations : ["Cost optimization is on track"];
  }

  /**
   * Health check for cost tracking system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Verify Firestore connection
      const firestoreHealthy = await this.firestore.healthCheck();

      // Test cost recording (with minimal cost)
      if (firestoreHealthy) {
        await this.firestore.recordCost({
          service: "other",
          amount: 0.001,
          currency: "USD",
          description: "Health check test cost",
          timestamp: new Date(),
        });
      }

      console.log(`[COST TRACKER] Health check: ${firestoreHealthy ? "PASS" : "FAIL"}`);
      return firestoreHealthy;
    } catch (error) {
      console.error("[COST TRACKER] Health check failed:", error);
      return false;
    }
  }
}
