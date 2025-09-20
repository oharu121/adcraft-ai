import { FirestoreService, CostEntry } from "../services/firestore";
import { Logger } from "./logger";
import { MetricsService } from "../monitor/metrics";

export interface BudgetStatus {
  totalBudget: number;
  currentSpend: number;
  remainingBudget: number;
  percentageUsed: number;
  alertLevel: "safe" | "warning" | "danger" | "exceeded";
  canProceed: boolean;
}

export interface CostBreakdown {
  veo: number;
  gemini: number;
  storage: number;
  other: number;
  total: number;
}

export interface CostAlert {
  id: string;
  type: "threshold" | "projection" | "anomaly";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  currentSpend: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

export interface CostProjection {
  projectedDailySpend: number;
  projectedMonthlySpend: number;
  projectedTimeToLimit: number; // hours until budget limit
  confidence: number; // 0-100%
  basedOnDataPoints: number;
}

/**
 * Cost tracking service with budget monitoring and alerts
 * Tracks spending across all GCP services with real-time budget checks
 */
export class CostTracker {
  private static instance: CostTracker;
  private firestore: FirestoreService;
  private logger: Logger;
  private metrics: MetricsService;
  private totalBudget: number;
  private alertThresholds: { warning: number; danger: number };
  private alerts: Map<string, CostAlert> = new Map();
  private costHistory: Array<{ timestamp: Date; amount: number; service: string }> = [];

  private constructor() {
    this.firestore = FirestoreService.getInstance();
    this.logger = Logger.getInstance();
    this.metrics = MetricsService.getInstance();
    this.totalBudget = 300; // $300 total budget
    this.alertThresholds = {
      warning: 0.75, // 75%
      danger: 0.9, // 90%
    };

    // Monitor costs every 5 minutes
    setInterval(() => this.monitorCosts(), 5 * 60 * 1000);
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
    service: CostEntry["service"],
    amount: number,
    description: string,
    sessionId?: string,
    jobId?: string
  ): Promise<void> {
    try {
      // Record cost in database
      await this.firestore.recordCost({
        service,
        amount,
        currency: "USD",
        description,
        sessionId,
        jobId,
        timestamp: new Date(),
      });

      // Add to cost history for trend analysis
      this.costHistory.push({
        timestamp: new Date(),
        amount,
        service,
      });

      // Keep only last 1000 entries
      if (this.costHistory.length > 1000) {
        this.costHistory = this.costHistory.slice(-1000);
      }

      // Log cost event
      this.logger.logCostEvent(
        description,
        service,
        amount,
        { sessionId, jobId, service: "cost-tracker" },
        { currency: "USD" }
      );

      // Record metrics
      this.metrics.recordCustomMetric(
        `cost_${service}`,
        amount,
        "USD",
        { service, operation: "record_cost" },
        { description, sessionId, jobId }
      );

      // Check if we've exceeded any thresholds
      const status = await this.getBudgetStatus();
      if (status.alertLevel !== "safe") {
        await this.sendBudgetAlert(status);
      }

      // Check for cost anomalies
      await this.checkCostAnomalies(service, amount);
    } catch (error) {
      this.logger.error(
        "Failed to record cost",
        { service: "cost-tracker", operation: "record_cost", service_type: service },
        error instanceof Error ? error : new Error("Unknown error"),
        { amount, description, sessionId, jobId }
      );
      throw new Error(
        `Failed to record cost: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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

      let alertLevel: BudgetStatus["alertLevel"] = "safe";
      let canProceed = true;

      if (currentSpend >= this.totalBudget) {
        alertLevel = "exceeded";
        canProceed = false;
      } else if (currentSpend / this.totalBudget >= this.alertThresholds.danger) {
        alertLevel = "danger";
        canProceed = false; // Stop new operations at 90%
      } else if (currentSpend / this.totalBudget >= this.alertThresholds.warning) {
        alertLevel = "warning";
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
      console.error("Failed to get budget status:", error);
      return {
        totalBudget: this.totalBudget,
        currentSpend: 0,
        remainingBudget: this.totalBudget,
        percentageUsed: 0,
        alertLevel: "safe",
        canProceed: true,
      };
    }
  }

  /**
   * Get real budget status for monitoring (ignores app mode)
   */
  public async getRealBudgetStatus(): Promise<BudgetStatus> {
    try {
      const currentSpend = await this.firestore.getRealTotalCosts();
      const remainingBudget = this.totalBudget - currentSpend;
      const percentageUsed = (currentSpend / this.totalBudget) * 100;

      let alertLevel: BudgetStatus["alertLevel"] = "safe";
      let canProceed = true;

      if (currentSpend >= this.totalBudget) {
        alertLevel = "exceeded";
        canProceed = false;
      } else if (currentSpend / this.totalBudget >= this.alertThresholds.danger) {
        alertLevel = "danger";
        canProceed = false; // Stop new operations at 90%
      } else if (currentSpend / this.totalBudget >= this.alertThresholds.warning) {
        alertLevel = "warning";
      }

      console.log(`[MONITORING] Real budget status: $${currentSpend.toFixed(2)} / $${this.totalBudget.toFixed(2)} (${percentageUsed.toFixed(1)}%)`);

      return {
        totalBudget: this.totalBudget,
        currentSpend,
        remainingBudget,
        percentageUsed,
        alertLevel,
        canProceed,
      };
    } catch (error) {
      console.error("[MONITORING] Failed to get real budget status:", error);
      return {
        totalBudget: this.totalBudget,
        currentSpend: 0,
        remainingBudget: this.totalBudget,
        percentageUsed: 0,
        alertLevel: "safe",
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
      console.error("Failed to get cost breakdown:", error);
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
          reason:
            budgetStatus.alertLevel === "exceeded"
              ? "Budget has been exceeded"
              : "Budget threshold reached (90%)",
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
      console.error("Failed to check operation budget:", error);
      return {
        canProceed: false,
        reason: "Budget check failed",
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
   * Estimate cost for video generation operation
   */
  public estimateVideoGenerationCost(duration: number = 15): number {
    // Veo pricing: ~$1.50 per 15-second video
    const veoCost = (duration / 15) * 1.5;

    // Gemini for prompt refinement: ~$0.20
    const geminiCost = 0.2;

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
      promptRefinement: 0.2,
      fileStorage: 0.01,
    };
  }

  /**
   * Reset budget (for testing/admin use)
   */
  public async resetBudget(): Promise<void> {
    console.warn("Budget reset requested - this should only be used for testing");
    // In production, this would require admin authentication
  }

  /**
   * Set budget amount (for admin use)
   */
  public setBudget(amount: number): void {
    if (amount <= 0) {
      throw new Error("Budget must be positive");
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
      console.error("Cost tracker health check failed:", error);
      return false;
    }
  }

  /**
   * Monitor costs for anomalies and trends
   */
  private async monitorCosts(): Promise<void> {
    try {
      const status = await this.getBudgetStatus();

      // Record current spend as metric
      this.metrics.recordCustomMetric(
        "budget_current_spend",
        status.currentSpend,
        "USD",
        { metric_type: "budget" },
        {
          totalBudget: status.totalBudget,
          remainingBudget: status.remainingBudget,
          percentageUsed: status.percentageUsed,
          alertLevel: status.alertLevel,
        }
      );

      // Check for rapid cost increases
      await this.checkRapidCostIncrease();
    } catch (error) {
      this.logger.error(
        "Cost monitoring failed",
        { service: "cost-tracker", operation: "monitor_costs" },
        error instanceof Error ? error : new Error("Unknown error")
      );
    }
  }

  /**
   * Check for cost anomalies
   */
  private async checkCostAnomalies(service: string, amount: number): Promise<void> {
    try {
      // Get recent costs for this service
      const recentCosts = this.costHistory.filter((entry) => entry.service === service).slice(-10); // Last 10 entries

      if (recentCosts.length < 3) return; // Not enough data

      // Calculate average and standard deviation
      const amounts = recentCosts.map((entry) => entry.amount);
      const average = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const variance =
        amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Check if current amount is significantly higher than average
      const threshold = average + 2 * stdDev; // 2 standard deviations

      if (amount > threshold && amount > average * 2) {
        const alert: CostAlert = {
          id: `anomaly-${Date.now()}`,
          type: "anomaly",
          severity: amount > average * 3 ? "high" : "medium",
          message: `Unusual cost spike detected for ${service}: $${amount.toFixed(2)} (avg: $${average.toFixed(2)})`,
          currentSpend: amount,
          threshold,
          timestamp: new Date(),
          resolved: false,
        };

        this.alerts.set(alert.id, alert);

        this.logger.warn(
          `Cost anomaly detected: ${alert.message}`,
          { service: "cost-tracker", operation: "check_anomalies", service_type: service },
          { amount, average, threshold, stdDev }
        );
      }
    } catch (error) {
      this.logger.error(
        "Cost anomaly check failed",
        { service: "cost-tracker", operation: "check_anomalies", service_type: service },
        error instanceof Error ? error : new Error("Unknown error")
      );
    }
  }

  /**
   * Check for rapid cost increases
   */
  private async checkRapidCostIncrease(): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get costs from last hour
      const recentCosts = this.costHistory.filter((entry) => entry.timestamp >= oneHourAgo);

      if (recentCosts.length === 0) return;

      const hourlySpend = recentCosts.reduce((sum, entry) => sum + entry.amount, 0);
      const projectedDailySpend = hourlySpend * 24;

      // Alert if projected daily spend is too high
      if (projectedDailySpend > this.totalBudget * 0.1) {
        // More than 10% of budget per day
        const alert: CostAlert = {
          id: `rapid-increase-${Date.now()}`,
          type: "projection",
          severity: projectedDailySpend > this.totalBudget * 0.2 ? "critical" : "high",
          message: `Rapid cost increase detected. Hourly: $${hourlySpend.toFixed(2)}, Projected daily: $${projectedDailySpend.toFixed(2)}`,
          currentSpend: hourlySpend,
          threshold: this.totalBudget * 0.1,
          timestamp: new Date(),
          resolved: false,
        };

        this.alerts.set(alert.id, alert);

        this.logger.critical(
          `Rapid cost increase: ${alert.message}`,
          { service: "cost-tracker", operation: "check_rapid_increase" },
          undefined,
          { hourlySpend, projectedDailySpend, recentCostsCount: recentCosts.length }
        );
      }
    } catch (error) {
      this.logger.error(
        "Rapid cost increase check failed",
        { service: "cost-tracker", operation: "check_rapid_increase" },
        error instanceof Error ? error : new Error("Unknown error")
      );
    }
  }

  /**
   * Get cost projection based on recent spending patterns
   */
  public async getCostProjection(): Promise<CostProjection> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get costs from last 24 hours
      const recentCosts = this.costHistory.filter((entry) => entry.timestamp >= last24Hours);

      if (recentCosts.length === 0) {
        return {
          projectedDailySpend: 0,
          projectedMonthlySpend: 0,
          projectedTimeToLimit: Infinity,
          confidence: 0,
          basedOnDataPoints: 0,
        };
      }

      const last24HourSpend = recentCosts.reduce((sum, entry) => sum + entry.amount, 0);
      const projectedDailySpend = last24HourSpend;
      const projectedMonthlySpend = projectedDailySpend * 30;

      const currentStatus = await this.getBudgetStatus();
      const remainingBudget = currentStatus.remainingBudget;

      // Calculate time to limit (in hours)
      const projectedHourlySpend = projectedDailySpend / 24;
      const projectedTimeToLimit =
        projectedHourlySpend > 0 ? remainingBudget / projectedHourlySpend : Infinity;

      // Calculate confidence based on data points and consistency
      const confidence = Math.min(100, (recentCosts.length / 10) * 100); // More data = higher confidence

      return {
        projectedDailySpend,
        projectedMonthlySpend,
        projectedTimeToLimit,
        confidence,
        basedOnDataPoints: recentCosts.length,
      };
    } catch (error) {
      this.logger.error(
        "Cost projection calculation failed",
        { service: "cost-tracker", operation: "get_projection" },
        error instanceof Error ? error : new Error("Unknown error")
      );

      return {
        projectedDailySpend: 0,
        projectedMonthlySpend: 0,
        projectedTimeToLimit: Infinity,
        confidence: 0,
        basedOnDataPoints: 0,
      };
    }
  }

  /**
   * Get active cost alerts
   */
  public getActiveAlerts(): CostAlert[] {
    return Array.from(this.alerts.values())
      .filter((alert) => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolve a cost alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info(
        `Cost alert resolved: ${alert.message}`,
        { service: "cost-tracker", operation: "resolve_alert", alertId },
        { alertType: alert.type, severity: alert.severity }
      );
      return true;
    }
    return false;
  }

  /**
   * Get detailed cost metrics for monitoring dashboard
   */
  public async getDetailedMetrics(): Promise<{
    budgetStatus: BudgetStatus;
    costBreakdown: CostBreakdown;
    projection: CostProjection;
    alerts: CostAlert[];
    recentCosts: Array<{ timestamp: Date; amount: number; service: string }>;
    trends: {
      hourlyAverage: number;
      dailyAverage: number;
      weeklyTotal: number;
    };
  }> {
    try {
      const [budgetStatus, costBreakdown, projection] = await Promise.all([
        this.getBudgetStatus(),
        this.getCostBreakdown(),
        this.getCostProjection(),
      ]);

      // Calculate trends
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      const weeklyTotal = this.costHistory
        .filter((entry) => entry.timestamp >= lastWeek)
        .reduce((sum, entry) => sum + entry.amount, 0);

      const dailyTotal = this.costHistory
        .filter((entry) => entry.timestamp >= lastDay)
        .reduce((sum, entry) => sum + entry.amount, 0);

      const hourlyTotal = this.costHistory
        .filter((entry) => entry.timestamp >= lastHour)
        .reduce((sum, entry) => sum + entry.amount, 0);

      return {
        budgetStatus,
        costBreakdown,
        projection,
        alerts: this.getActiveAlerts(),
        recentCosts: this.costHistory.slice(-20), // Last 20 cost entries
        trends: {
          hourlyAverage: hourlyTotal,
          dailyAverage: dailyTotal,
          weeklyTotal,
        },
      };
    } catch (error) {
      this.logger.error(
        "Failed to get detailed cost metrics",
        { service: "cost-tracker", operation: "get_detailed_metrics" },
        error instanceof Error ? error : new Error("Unknown error")
      );
      throw error;
    }
  }

  /**
   * Enhanced budget alert with more detailed information
   */
  private async sendBudgetAlert(status: BudgetStatus): Promise<void> {
    const alertKey = `threshold-${status.alertLevel}`;
    const existingAlert = this.alerts.get(alertKey);

    // Only send alert if not already active
    if (!existingAlert || existingAlert.resolved) {
      const alert: CostAlert = {
        id: alertKey,
        type: "threshold",
        severity:
          status.alertLevel === "exceeded"
            ? "critical"
            : status.alertLevel === "danger"
              ? "high"
              : "medium",
        message: `Budget ${status.alertLevel}: ${status.percentageUsed.toFixed(1)}% used ($${status.currentSpend.toFixed(2)} / $${status.totalBudget})`,
        currentSpend: status.currentSpend,
        threshold: status.totalBudget * (status.alertLevel === "warning" ? 0.75 : 0.9),
        timestamp: new Date(),
        resolved: false,
      };

      this.alerts.set(alert.id, alert);

      // Log with appropriate level
      const logLevel =
        alert.severity === "critical" ? "critical" : alert.severity === "high" ? "error" : "warn";

      this.logger[logLevel](
        `Budget alert: ${alert.message}`,
        { service: "cost-tracker", operation: "budget_alert" },
        undefined,
        {
          alertLevel: status.alertLevel,
          percentageUsed: status.percentageUsed,
          remainingBudget: status.remainingBudget,
          canProceed: status.canProceed,
        }
      );

      console.warn("🚨 BUDGET ALERT:", alert.message);
    }
  }
}
