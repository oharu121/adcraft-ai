import { FirestoreService, CostEntry } from './firestore';

export interface BudgetStatus {
  totalBudget: number;
  currentSpend: number;
  remainingBudget: number;
  percentageUsed: number;
  alertLevel: 'safe' | 'warning' | 'danger' | 'exceeded';
  canProceed: boolean;
}

export interface CostBreakdown {
  veo: number;
  gemini: number;
  storage: number;
  other: number;
  total: number;
}

/**
 * Cost tracking service with budget monitoring and alerts
 * Tracks spending across all GCP services with real-time budget checks
 */
export class CostTracker {
  private static instance: CostTracker;
  private firestore: FirestoreService;
  private totalBudget: number;
  private alertThresholds: { warning: number; danger: number };

  private constructor() {
    this.firestore = FirestoreService.getInstance();
    this.totalBudget = 300; // $300 total budget
    this.alertThresholds = {
      warning: 0.75, // 75%
      danger: 0.90,  // 90%
    };
  }

  /**
   * Get singleton instance of CostTracker
   */
  public static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  /**
   * Record cost for a service
   */
  public async recordCost(
    service: CostEntry['service'],
    amount: number,
    description: string,
    sessionId?: string,
    jobId?: string
  ): Promise<void> {
    try {
      await this.firestore.recordCost({
        service,
        amount,
        currency: 'USD',
        description,
        sessionId,
        jobId,
        timestamp: new Date(),
      });

      // Check if we've exceeded any thresholds
      const status = await this.getBudgetStatus();
      if (status.alertLevel !== 'safe') {
        await this.sendBudgetAlert(status);
      }

    } catch (error) {
      console.error('Failed to record cost:', error);
      throw new Error(`Failed to record cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current budget status
   */
  public async getBudgetStatus(): Promise<BudgetStatus> {
    try {
      const currentSpend = await this.firestore.getTotalCosts();
      const remainingBudget = this.totalBudget - currentSpend;
      const percentageUsed = (currentSpend / this.totalBudget) * 100;

      let alertLevel: BudgetStatus['alertLevel'] = 'safe';
      let canProceed = true;

      if (currentSpend >= this.totalBudget) {
        alertLevel = 'exceeded';
        canProceed = false;
      } else if (currentSpend / this.totalBudget >= this.alertThresholds.danger) {
        alertLevel = 'danger';
        canProceed = false; // Stop new operations at 90%
      } else if (currentSpend / this.totalBudget >= this.alertThresholds.warning) {
        alertLevel = 'warning';
      }

      return {
        totalBudget: this.totalBudget,
        currentSpend,
        remainingBudget,
        percentageUsed,
        alertLevel,
        canProceed,
      };

    } catch (error) {
      console.error('Failed to get budget status:', error);
      return {
        totalBudget: this.totalBudget,
        currentSpend: 0,
        remainingBudget: this.totalBudget,
        percentageUsed: 0,
        alertLevel: 'safe',
        canProceed: true,
      };
    }
  }

  /**
   * Get cost breakdown by service
   */
  public async getCostBreakdown(startDate?: Date, endDate?: Date): Promise<CostBreakdown> {
    try {
      const breakdown = await this.firestore.getCostBreakdown(startDate, endDate);
      
      const result: CostBreakdown = {
        veo: breakdown.veo || 0,
        gemini: breakdown.gemini || 0,
        storage: breakdown.storage || 0,
        other: breakdown.other || 0,
        total: 0,
      };

      result.total = result.veo + result.gemini + result.storage + result.other;
      
      return result;

    } catch (error) {
      console.error('Failed to get cost breakdown:', error);
      return {
        veo: 0,
        gemini: 0,
        storage: 0,
        other: 0,
        total: 0,
      };
    }
  }

  /**
   * Check if operation can proceed based on budget
   */
  public async canProceedWithOperation(estimatedCost: number): Promise<{
    canProceed: boolean;
    reason?: string;
    budgetStatus: BudgetStatus;
  }> {
    try {
      const budgetStatus = await this.getBudgetStatus();
      
      if (!budgetStatus.canProceed) {
        return {
          canProceed: false,
          reason: budgetStatus.alertLevel === 'exceeded' 
            ? 'Budget has been exceeded' 
            : 'Budget threshold reached (90%)',
          budgetStatus,
        };
      }

      if (budgetStatus.remainingBudget < estimatedCost) {
        return {
          canProceed: false,
          reason: `Insufficient budget. Estimated cost: $${estimatedCost.toFixed(2)}, Remaining: $${budgetStatus.remainingBudget.toFixed(2)}`,
          budgetStatus,
        };
      }

      return {
        canProceed: true,
        budgetStatus,
      };

    } catch (error) {
      console.error('Failed to check operation budget:', error);
      return {
        canProceed: false,
        reason: 'Budget check failed',
        budgetStatus: await this.getBudgetStatus(),
      };
    }
  }

  /**
   * Get daily cost summary
   */
  public async getDailyCosts(date?: Date): Promise<CostBreakdown> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getCostBreakdown(startOfDay, endOfDay);
  }

  /**
   * Get weekly cost summary
   */
  public async getWeeklyCosts(weekStart?: Date): Promise<CostBreakdown> {
    const startDate = weekStart || new Date();
    if (!weekStart) {
      // Get start of current week (Monday)
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return this.getCostBreakdown(startDate, endDate);
  }

  /**
   * Send budget alert (in production, this would integrate with monitoring)
   */
  private async sendBudgetAlert(status: BudgetStatus): Promise<void> {
    const message = `Budget Alert: ${status.percentageUsed.toFixed(1)}% of budget used ($${status.currentSpend.toFixed(2)} / $${status.totalBudget})`;
    
    console.warn('🚨 BUDGET ALERT:', message);
    
    // In production, you would integrate with:
    // - Google Cloud Monitoring
    // - Pub/Sub notifications
    // - Email alerts
    // - Slack/Discord webhooks
  }

  /**
   * Estimate cost for video generation operation
   */
  public estimateVideoGenerationCost(duration: number = 15): number {
    // Veo pricing: ~$1.50 per 15-second video
    const veoCost = (duration / 15) * 1.50;
    
    // Gemini for prompt refinement: ~$0.20
    const geminiCost = 0.20;
    
    // Storage for 12 hours: ~$0.01
    const storageCost = 0.01;
    
    return veoCost + geminiCost + storageCost;
  }

  /**
   * Get cost estimates for different operations
   */
  public getCostEstimates() {
    return {
      videoGeneration: this.estimateVideoGenerationCost(),
      promptRefinement: 0.20,
      fileStorage: 0.01,
    };
  }

  /**
   * Reset budget (for testing/admin use)
   */
  public async resetBudget(): Promise<void> {
    console.warn('Budget reset requested - this should only be used for testing');
    // In production, this would require admin authentication
  }

  /**
   * Set budget amount (for admin use)
   */
  public setBudget(amount: number): void {
    if (amount <= 0) {
      throw new Error('Budget must be positive');
    }
    this.totalBudget = amount;
    console.log(`Budget updated to $${amount}`);
  }

  /**
   * Health check for cost tracking
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.getBudgetStatus();
      return true;
    } catch (error) {
      console.error('Cost tracker health check failed:', error);
      return false;
    }
  }
}