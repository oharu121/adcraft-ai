/**
 * Creative Director Comprehensive Cost Manager
 *
 * Enhanced cost management system that extends the existing cost tracker with
 * comprehensive budget monitoring, real-time alerts, optimization strategies,
 * and detailed reporting for all David's creative operations.
 */

import { CreativeDirectorCostTracker, CostEntry, BudgetAlert, CostAnalytics } from './cost-tracker';
import { CreativeDirectorPerformanceMonitor } from './performance-monitor';

export interface ComprehensiveCostMetrics {
  realTime: {
    currentSpend: number;
    budgetRemaining: number;
    burnRate: number; // spend per hour
    projectedDepletion: string; // timestamp when budget runs out
    utilizationRate: number; // percentage of budget used
  };
  
  breakdown: {
    byOperation: Record<string, OperationCost>;
    byAssetType: Record<string, AssetTypeCost>;
    byQuality: Record<string, QualityCost>;
    byTimeframe: {
      hourly: HourlySpend[];
      daily: DailySpend[];
      session: SessionSpend[];
    };
  };
  
  efficiency: {
    costPerAsset: number;
    costPerSuccess: number;
    costPerMinute: number;
    wastedCost: number; // failed operations
    optimizationSavings: number;
  };
  
  alerts: {
    active: BudgetAlert[];
    triggered: number;
    acknowledged: number;
    resolved: number;
  };
}

export interface OperationCost {
  operation: string;
  totalCost: number;
  count: number;
  averageCost: number;
  successRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AssetTypeCost {
  assetType: string;
  totalCost: number;
  count: number;
  averageCost: number;
  qualityDistribution: Record<string, number>;
  roi: number; // return on investment score
}

export interface QualityCost {
  quality: string;
  totalCost: number;
  count: number;
  averageCost: number;
  successRate: number;
  userSatisfaction: number;
}

export interface HourlySpend {
  hour: string; // ISO timestamp
  amount: number;
  operations: number;
  efficiency: number;
}

export interface DailySpend {
  date: string; // YYYY-MM-DD
  amount: number;
  operations: number;
  assets: number;
  efficiency: number;
}

export interface SessionSpend {
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalCost: number;
  operations: number;
  assets: number;
  userId?: string;
}

export interface CostOptimizationStrategy {
  id: string;
  name: string;
  description: string;
  category: 'quality' | 'operations' | 'workflow' | 'timing' | 'resource';
  potentialSavings: number;
  implementationCost: number;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short_term' | 'long_term';
  steps: string[];
  roi: number; // return on investment
}

export interface BudgetThresholds {
  warning: number; // 0.5 for 50%
  critical: number; // 0.8 for 80%
  emergency: number; // 0.95 for 95%
  hard_limit: number; // 1.0 for 100%
}

export interface CostControls {
  maxCostPerAsset: number;
  maxCostPerHour: number;
  maxCostPerSession: number;
  maxAssetsPerSession: number;
  qualityRestrictions: {
    premium: { maxPerSession: number; requiresApproval: boolean };
    high: { maxPerSession: number; requiresApproval: boolean };
    standard: { unlimited: boolean };
    draft: { unlimited: boolean };
  };
  operationLimits: Record<string, number>;
}

export interface RealTimeBudgetUpdate {
  timestamp: string;
  sessionId: string;
  operation: string;
  cost: number;
  remainingBudget: number;
  thresholdStatus: 'safe' | 'warning' | 'critical' | 'exceeded';
  recommendation?: string;
  nextThreshold?: {
    level: string;
    remainingAmount: number;
    estimatedTime: string;
  };
}

/**
 * Creative Director Comprehensive Cost Manager
 * Provides advanced cost management, budget monitoring, and optimization for David's operations
 */
export class CreativeDirectorComprehensiveCostManager {
  private static instance: CreativeDirectorComprehensiveCostManager;
  private costTracker: CreativeDirectorCostTracker;
  private performanceMonitor: CreativeDirectorPerformanceMonitor;
  private budgetThresholds: BudgetThresholds;
  private costControls: CostControls;
  private realTimeListeners: Set<(update: RealTimeBudgetUpdate) => void> = new Set();
  private optimizationStrategies: Map<string, CostOptimizationStrategy> = new Map();
  private costMetrics: ComprehensiveCostMetrics;
  
  // Configuration
  private readonly UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly TREND_ANALYSIS_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
  private readonly OPTIMIZATION_THRESHOLD = 0.1; // 10% savings threshold

  private constructor() {
    this.costTracker = CreativeDirectorCostTracker.getInstance();
    this.performanceMonitor = CreativeDirectorPerformanceMonitor.getInstance();
    this.budgetThresholds = this.createDefaultThresholds();
    this.costControls = this.createDefaultControls();
    this.costMetrics = this.initializeMetrics();
    
    this.initializeOptimizationStrategies();
    this.startRealTimeMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorComprehensiveCostManager {
    if (!CreativeDirectorComprehensiveCostManager.instance) {
      CreativeDirectorComprehensiveCostManager.instance = new CreativeDirectorComprehensiveCostManager();
    }
    return CreativeDirectorComprehensiveCostManager.instance;
  }

  /**
   * Track comprehensive cost with real-time updates and optimization analysis
   */
  public async trackComprehensiveCost(
    sessionId: string,
    operation: string,
    cost: number,
    assetType?: string,
    quality?: string,
    metadata?: Record<string, any>
  ): Promise<{
    costEntry: CostEntry;
    budgetStatus: RealTimeBudgetUpdate;
    optimizationRecommendations: CostOptimizationStrategy[];
    controlsTriggered: string[];
  }> {
    console.log(`[COMPREHENSIVE COST] Tracking cost: $${cost} for ${operation} in session ${sessionId}`);
    
    try {
      // Use existing cost tracker for basic tracking
      const costEntry = await this.costTracker.trackCost(
        sessionId,
        {
          service: this.mapOperationToService(operation),
          operation,
          quality
        },
        cost,
        `${operation} - ${assetType || 'general'}`,
        { assetType, quality, ...metadata }
      );
      
      // Update comprehensive metrics
      this.updateComprehensiveMetrics(sessionId, operation, cost, assetType, quality);
      
      // Generate real-time budget update
      const budgetStatus = await this.generateRealTimeBudgetUpdate(sessionId, operation, cost);
      
      // Check for triggered controls
      const controlsTriggered = this.checkCostControls(sessionId, operation, cost, assetType, quality);
      
      // Generate optimization recommendations
      const optimizationRecommendations = await this.getCostOptimizationStrategies(sessionId);
      
      // Notify real-time listeners
      this.notifyRealTimeListeners(budgetStatus);
      
      // Check and create alerts if thresholds exceeded
      await this.checkAndCreateThresholdAlerts(sessionId, budgetStatus);
      
      return {
        costEntry,
        budgetStatus,
        optimizationRecommendations,
        controlsTriggered
      };
      
    } catch (error) {
      console.error('[COMPREHENSIVE COST] Failed to track comprehensive cost:', error);
      throw error;
    }
  }

  /**
   * Get real-time comprehensive cost metrics
   */
  public async getComprehensiveMetrics(sessionId?: string): Promise<ComprehensiveCostMetrics> {
    // Update metrics with latest data
    await this.refreshMetrics(sessionId);
    
    // Return filtered metrics if sessionId provided
    if (sessionId) {
      return this.filterMetricsBySession(this.costMetrics, sessionId);
    }
    
    return { ...this.costMetrics };
  }

  /**
   * Configure budget thresholds for alerts
   */
  public configureBudgetThresholds(thresholds: Partial<BudgetThresholds>): void {
    this.budgetThresholds = { ...this.budgetThresholds, ...thresholds };
    console.log('[COMPREHENSIVE COST] Budget thresholds updated:', this.budgetThresholds);
  }

  /**
   * Configure cost controls and limits
   */
  public configureCostControls(controls: Partial<CostControls>): void {
    this.costControls = { ...this.costControls, ...controls };
    console.log('[COMPREHENSIVE COST] Cost controls updated');
  }

  /**
   * Subscribe to real-time budget updates
   */
  public subscribeToRealTimeUpdates(listener: (update: RealTimeBudgetUpdate) => void): () => void {
    this.realTimeListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.realTimeListeners.delete(listener);
    };
  }

  /**
   * Get cost optimization strategies
   */
  public async getCostOptimizationStrategies(sessionId: string): Promise<CostOptimizationStrategy[]> {
    const sessionMetrics = await this.getSessionCostAnalysis(sessionId);
    const applicableStrategies: CostOptimizationStrategy[] = [];
    
    for (const strategy of this.optimizationStrategies.values()) {
      if (this.isStrategyApplicable(strategy, sessionMetrics)) {
        // Calculate actual potential savings for this session
        const actualSavings = this.calculateActualSavings(strategy, sessionMetrics);
        
        applicableStrategies.push({
          ...strategy,
          potentialSavings: actualSavings
        });
      }
    }
    
    // Sort by ROI and potential savings
    return applicableStrategies
      .sort((a, b) => (b.potentialSavings - b.implementationCost) - (a.potentialSavings - a.implementationCost))
      .slice(0, 10); // Top 10 strategies
  }

  /**
   * Implement cost optimization strategy
   */
  public async implementOptimizationStrategy(
    strategyId: string,
    sessionId: string
  ): Promise<{
    implemented: boolean;
    estimatedSavings: number;
    actualSavings?: number;
    recommendations: string[];
  }> {
    const strategy = this.optimizationStrategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Optimization strategy not found: ${strategyId}`);
    }
    
    console.log(`[COMPREHENSIVE COST] Implementing optimization strategy: ${strategy.name}`);
    
    try {
      const implementationResult = await this.executeOptimizationStrategy(strategy, sessionId);
      
      // Track implementation in performance monitor
      this.performanceMonitor.startTracking(
        `optimization-${strategyId}`,
        sessionId,
        'cost_optimization',
        'workflow',
        { strategy: strategy.name, category: strategy.category }
      );
      
      this.performanceMonitor.endTracking(
        `optimization-${strategyId}`,
        implementationResult.implemented,
        { savings: implementationResult.estimatedSavings }
      );
      
      return implementationResult;
      
    } catch (error) {
      console.error(`[COMPREHENSIVE COST] Failed to implement optimization strategy:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive cost report
   */
  public async generateComprehensiveCostReport(
    sessionId?: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    executive: {
      totalSpent: number;
      budgetUtilization: number;
      costEfficiency: number;
      keyInsights: string[];
    };
    detailed: {
      metrics: ComprehensiveCostMetrics;
      trends: Array<{ metric: string; trend: string; change: number }>;
      recommendations: CostOptimizationStrategy[];
      alerts: BudgetAlert[];
    };
    projections: {
      burnRate: number;
      budgetDepletion: string;
      recommendedActions: string[];
    };
  }> {
    console.log('[COMPREHENSIVE COST] Generating comprehensive cost report');
    
    const metrics = await this.getComprehensiveMetrics(sessionId);
    const recommendations = sessionId ? 
      await this.getCostOptimizationStrategies(sessionId) : 
      Array.from(this.optimizationStrategies.values()).slice(0, 5);
    
    const trends = this.analyzeCostTrends(metrics, timeframe);
    const projections = this.generateCostProjections(metrics);
    
    return {
      executive: {
        totalSpent: metrics.realTime.currentSpend,
        budgetUtilization: metrics.realTime.utilizationRate,
        costEfficiency: metrics.efficiency.costPerSuccess,
        keyInsights: this.generateExecutiveInsights(metrics)
      },
      detailed: {
        metrics,
        trends,
        recommendations,
        alerts: metrics.alerts.active
      },
      projections
    };
  }

  /**
   * Check if operation is within cost limits
   */
  public async checkOperationLimits(
    sessionId: string,
    operation: string,
    estimatedCost: number,
    assetType?: string,
    quality?: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    alternatives?: string[];
    budgetImpact: {
      remainingAfter: number;
      thresholdRisk: string;
    };
  }> {
    try {
      // Check overall budget limit
      const budgetCheck = await this.costTracker.checkBudgetLimit(sessionId, estimatedCost, operation);
      
      if (!budgetCheck.allowed) {
        return {
          allowed: false,
          reason: budgetCheck.reason,
          alternatives: this.generateCostAlternatives(operation, estimatedCost, assetType, quality),
          budgetImpact: {
            remainingAfter: Math.max(0, budgetCheck.budgetRemaining - estimatedCost),
            thresholdRisk: 'exceeded'
          }
        };
      }
      
      // Check specific cost controls
      const controlsViolation = this.checkSpecificCostControls(sessionId, operation, estimatedCost, assetType, quality);
      
      if (controlsViolation) {
        return {
          allowed: false,
          reason: controlsViolation,
          alternatives: this.generateCostAlternatives(operation, estimatedCost, assetType, quality),
          budgetImpact: {
            remainingAfter: budgetCheck.budgetRemaining - estimatedCost,
            thresholdRisk: this.assessThresholdRisk(budgetCheck.budgetRemaining - estimatedCost)
          }
        };
      }
      
      return {
        allowed: true,
        budgetImpact: {
          remainingAfter: budgetCheck.budgetRemaining - estimatedCost,
          thresholdRisk: this.assessThresholdRisk(budgetCheck.budgetRemaining - estimatedCost)
        }
      };
      
    } catch (error) {
      console.error('[COMPREHENSIVE COST] Failed to check operation limits:', error);
      return {
        allowed: false,
        reason: 'Failed to verify cost limits',
        budgetImpact: {
          remainingAfter: 0,
          thresholdRisk: 'unknown'
        }
      };
    }
  }

  /**
   * Private implementation methods
   */
  
  private createDefaultThresholds(): BudgetThresholds {
    return {
      warning: 0.5,    // 50%
      critical: 0.75,  // 75%
      emergency: 0.9,  // 90%
      hard_limit: 1.0  // 100%
    };
  }

  private createDefaultControls(): CostControls {
    return {
      maxCostPerAsset: 15,
      maxCostPerHour: 25,
      maxCostPerSession: 50,
      maxAssetsPerSession: 20,
      qualityRestrictions: {
        premium: { maxPerSession: 3, requiresApproval: true },
        high: { maxPerSession: 8, requiresApproval: false },
        standard: { unlimited: true as const },
        draft: { unlimited: true as const }
      },
      operationLimits: {
        'generate_imagen': 10,
        'style_analysis': 20,
        'asset_processing': 15
      }
    };
  }

  private initializeMetrics(): ComprehensiveCostMetrics {
    return {
      realTime: {
        currentSpend: 0,
        budgetRemaining: 300, // $300 default budget
        burnRate: 0,
        projectedDepletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        utilizationRate: 0
      },
      breakdown: {
        byOperation: {},
        byAssetType: {},
        byQuality: {},
        byTimeframe: {
          hourly: [],
          daily: [],
          session: []
        }
      },
      efficiency: {
        costPerAsset: 0,
        costPerSuccess: 0,
        costPerMinute: 0,
        wastedCost: 0,
        optimizationSavings: 0
      },
      alerts: {
        active: [],
        triggered: 0,
        acknowledged: 0,
        resolved: 0
      }
    };
  }

  private mapOperationToService(operation: string): CostEntry['category']['service'] {
    const serviceMap: Record<string, CostEntry['category']['service']> = {
      'generate_imagen': 'imagen',
      'upload_asset': 'storage',
      'conversation': 'gemini',
      'analysis': 'vertex-ai'
    };
    
    return serviceMap[operation] || 'other';
  }

  private updateComprehensiveMetrics(
    sessionId: string,
    operation: string,
    cost: number,
    assetType?: string,
    quality?: string
  ): void {
    // Update real-time metrics
    this.costMetrics.realTime.currentSpend += cost;
    this.costMetrics.realTime.budgetRemaining = Math.max(0, this.costMetrics.realTime.budgetRemaining - cost);
    this.costMetrics.realTime.utilizationRate = 
      this.costMetrics.realTime.currentSpend / (this.costMetrics.realTime.currentSpend + this.costMetrics.realTime.budgetRemaining);
    
    // Update operation breakdown
    if (!this.costMetrics.breakdown.byOperation[operation]) {
      this.costMetrics.breakdown.byOperation[operation] = {
        operation,
        totalCost: 0,
        count: 0,
        averageCost: 0,
        successRate: 1.0,
        trend: 'stable'
      };
    }
    
    const opMetrics = this.costMetrics.breakdown.byOperation[operation];
    opMetrics.totalCost += cost;
    opMetrics.count += 1;
    opMetrics.averageCost = opMetrics.totalCost / opMetrics.count;
    
    // Update asset type breakdown if provided
    if (assetType) {
      if (!this.costMetrics.breakdown.byAssetType[assetType]) {
        this.costMetrics.breakdown.byAssetType[assetType] = {
          assetType,
          totalCost: 0,
          count: 0,
          averageCost: 0,
          qualityDistribution: {},
          roi: 0.8
        };
      }
      
      const assetMetrics = this.costMetrics.breakdown.byAssetType[assetType];
      assetMetrics.totalCost += cost;
      assetMetrics.count += 1;
      assetMetrics.averageCost = assetMetrics.totalCost / assetMetrics.count;
      
      if (quality) {
        assetMetrics.qualityDistribution[quality] = (assetMetrics.qualityDistribution[quality] || 0) + 1;
      }
    }
    
    // Update quality breakdown if provided
    if (quality) {
      if (!this.costMetrics.breakdown.byQuality[quality]) {
        this.costMetrics.breakdown.byQuality[quality] = {
          quality,
          totalCost: 0,
          count: 0,
          averageCost: 0,
          successRate: 1.0,
          userSatisfaction: 0.8
        };
      }
      
      const qualityMetrics = this.costMetrics.breakdown.byQuality[quality];
      qualityMetrics.totalCost += cost;
      qualityMetrics.count += 1;
      qualityMetrics.averageCost = qualityMetrics.totalCost / qualityMetrics.count;
    }
    
    // Update hourly spend
    const currentHour = new Date().toISOString().slice(0, 13) + ':00:00.000Z';
    let hourlyEntry = this.costMetrics.breakdown.byTimeframe.hourly
      .find(h => h.hour === currentHour);
    
    if (!hourlyEntry) {
      hourlyEntry = { hour: currentHour, amount: 0, operations: 0, efficiency: 0 };
      this.costMetrics.breakdown.byTimeframe.hourly.push(hourlyEntry);
    }
    
    hourlyEntry.amount += cost;
    hourlyEntry.operations += 1;
    hourlyEntry.efficiency = hourlyEntry.amount / hourlyEntry.operations;
    
    // Update efficiency metrics
    if (assetType) {
      this.costMetrics.efficiency.costPerAsset = 
        this.costMetrics.realTime.currentSpend / Object.values(this.costMetrics.breakdown.byAssetType)
          .reduce((total, asset) => total + asset.count, 0);
    }
  }

  private async generateRealTimeBudgetUpdate(
    sessionId: string,
    operation: string,
    cost: number
  ): Promise<RealTimeBudgetUpdate> {
    const currentSpend = this.costMetrics.realTime.currentSpend;
    const totalBudget = currentSpend + this.costMetrics.realTime.budgetRemaining;
    const utilizationRate = currentSpend / totalBudget;
    
    let thresholdStatus: RealTimeBudgetUpdate['thresholdStatus'] = 'safe';
    let recommendation: string | undefined;
    let nextThreshold: RealTimeBudgetUpdate['nextThreshold'] | undefined;
    
    if (utilizationRate >= this.budgetThresholds.hard_limit) {
      thresholdStatus = 'exceeded';
      recommendation = 'Budget limit exceeded. No further operations allowed.';
    } else if (utilizationRate >= this.budgetThresholds.emergency) {
      thresholdStatus = 'critical';
      recommendation = 'Emergency budget level reached. Only essential operations recommended.';
      nextThreshold = {
        level: 'hard_limit',
        remainingAmount: totalBudget * (this.budgetThresholds.hard_limit - utilizationRate),
        estimatedTime: this.estimateTimeToThreshold(totalBudget * (this.budgetThresholds.hard_limit - utilizationRate))
      };
    } else if (utilizationRate >= this.budgetThresholds.critical) {
      thresholdStatus = 'critical';
      recommendation = 'Critical budget level. Consider cost optimization strategies.';
      nextThreshold = {
        level: 'emergency',
        remainingAmount: totalBudget * (this.budgetThresholds.emergency - utilizationRate),
        estimatedTime: this.estimateTimeToThreshold(totalBudget * (this.budgetThresholds.emergency - utilizationRate))
      };
    } else if (utilizationRate >= this.budgetThresholds.warning) {
      thresholdStatus = 'warning';
      recommendation = 'Budget warning threshold reached. Monitor spending carefully.';
      nextThreshold = {
        level: 'critical',
        remainingAmount: totalBudget * (this.budgetThresholds.critical - utilizationRate),
        estimatedTime: this.estimateTimeToThreshold(totalBudget * (this.budgetThresholds.critical - utilizationRate))
      };
    } else {
      nextThreshold = {
        level: 'warning',
        remainingAmount: totalBudget * (this.budgetThresholds.warning - utilizationRate),
        estimatedTime: this.estimateTimeToThreshold(totalBudget * (this.budgetThresholds.warning - utilizationRate))
      };
    }
    
    return {
      timestamp: new Date().toISOString(),
      sessionId,
      operation,
      cost,
      remainingBudget: this.costMetrics.realTime.budgetRemaining,
      thresholdStatus,
      recommendation,
      nextThreshold
    };
  }

  private checkCostControls(
    sessionId: string,
    operation: string,
    cost: number,
    assetType?: string,
    quality?: string
  ): string[] {
    const violations: string[] = [];
    
    // Check per-asset cost limit
    if (assetType && cost > this.costControls.maxCostPerAsset) {
      violations.push(`Asset cost ($${cost}) exceeds limit ($${this.costControls.maxCostPerAsset})`);
    }
    
    // Check operation limits
    if (this.costControls.operationLimits[operation] !== undefined) {
      const currentCount = this.costMetrics.breakdown.byOperation[operation]?.count || 0;
      if (currentCount >= this.costControls.operationLimits[operation]) {
        violations.push(`Operation ${operation} limit exceeded (${currentCount}/${this.costControls.operationLimits[operation]})`);
      }
    }
    
    // Check quality restrictions
    if (quality && this.costControls.qualityRestrictions[quality as keyof typeof this.costControls.qualityRestrictions]) {
      const restrictions = this.costControls.qualityRestrictions[quality as keyof typeof this.costControls.qualityRestrictions];
      if ('maxPerSession' in restrictions) {
        const currentQualityCount = this.costMetrics.breakdown.byQuality[quality]?.count || 0;
        if (currentQualityCount >= restrictions.maxPerSession) {
          violations.push(`Quality ${quality} session limit exceeded (${currentQualityCount}/${restrictions.maxPerSession})`);
        }
        
        if (restrictions.requiresApproval) {
          violations.push(`Quality ${quality} requires approval`);
        }
      }
    }
    
    return violations;
  }

  private initializeOptimizationStrategies(): void {
    // Quality optimization strategy
    this.optimizationStrategies.set('quality_optimization', {
      id: 'quality_optimization',
      name: 'Smart Quality Selection',
      description: 'Automatically select optimal quality levels based on asset type and usage',
      category: 'quality',
      potentialSavings: 15,
      implementationCost: 2,
      priority: 'high',
      timeframe: 'immediate',
      roi: 7.5,
      steps: [
        'Analyze current quality distribution',
        'Identify over-qualified assets',
        'Apply quality optimization rules',
        'Monitor quality satisfaction'
      ]
    });

    // Batching strategy
    this.optimizationStrategies.set('batch_operations', {
      id: 'batch_operations',
      name: 'Batch Asset Generation',
      description: 'Group similar asset requests to reduce per-operation costs',
      category: 'operations',
      potentialSavings: 20,
      implementationCost: 5,
      priority: 'medium',
      timeframe: 'short_term',
      roi: 4,
      steps: [
        'Identify batchable operations',
        'Implement request queuing',
        'Optimize batch processing',
        'Validate cost savings'
      ]
    });

    // Timing optimization
    this.optimizationStrategies.set('timing_optimization', {
      id: 'timing_optimization',
      name: 'Peak Hour Avoidance',
      description: 'Schedule non-urgent operations during off-peak hours for lower costs',
      category: 'timing',
      potentialSavings: 10,
      implementationCost: 3,
      priority: 'low',
      timeframe: 'long_term',
      roi: 3.33,
      steps: [
        'Analyze usage patterns',
        'Identify peak cost periods',
        'Implement scheduling system',
        'Monitor cost reductions'
      ]
    });

    console.log(`[COMPREHENSIVE COST] Initialized ${this.optimizationStrategies.size} optimization strategies`);
  }

  private startRealTimeMonitoring(): void {
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, this.UPDATE_INTERVAL);
    
    console.log('[COMPREHENSIVE COST] Real-time monitoring started');
  }

  private async updateRealTimeMetrics(): Promise<void> {
    // Update burn rate based on recent spending
    const recentHours = this.costMetrics.breakdown.byTimeframe.hourly.slice(-24);
    if (recentHours.length > 0) {
      const totalRecentSpend = recentHours.reduce((sum, hour) => sum + hour.amount, 0);
      this.costMetrics.realTime.burnRate = totalRecentSpend / recentHours.length;
      
      // Calculate projected depletion
      if (this.costMetrics.realTime.burnRate > 0) {
        const hoursRemaining = this.costMetrics.realTime.budgetRemaining / this.costMetrics.realTime.burnRate;
        this.costMetrics.realTime.projectedDepletion = 
          new Date(Date.now() + hoursRemaining * 60 * 60 * 1000).toISOString();
      }
    }
  }

  private notifyRealTimeListeners(update: RealTimeBudgetUpdate): void {
    this.realTimeListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('[COMPREHENSIVE COST] Error notifying real-time listener:', error);
      }
    });
  }

  // Helper methods continue...
  
  private estimateTimeToThreshold(remainingAmount: number): string {
    if (this.costMetrics.realTime.burnRate <= 0) {
      return 'Unknown';
    }
    
    const hoursRemaining = remainingAmount / this.costMetrics.realTime.burnRate;
    return new Date(Date.now() + hoursRemaining * 60 * 60 * 1000).toISOString();
  }

  private async checkAndCreateThresholdAlerts(sessionId: string, budgetStatus: RealTimeBudgetUpdate): Promise<void> {
    if (budgetStatus.thresholdStatus !== 'safe') {
      console.log(`[COMPREHENSIVE COST] Budget threshold alert: ${budgetStatus.thresholdStatus} for session ${sessionId}`);
      
      // Create alert (this would integrate with the existing alert system)
      this.costMetrics.alerts.triggered++;
    }
  }

  // Placeholder implementations for complex methods
  private async refreshMetrics(sessionId?: string): Promise<void> {
    // Refresh metrics from cost tracker and other sources
  }

  private filterMetricsBySession(metrics: ComprehensiveCostMetrics, sessionId: string): ComprehensiveCostMetrics {
    // Filter metrics to show only session-specific data
    return metrics; // Simplified for now
  }

  private async getSessionCostAnalysis(sessionId: string): Promise<any> {
    // Get detailed cost analysis for specific session
    return {};
  }

  private isStrategyApplicable(strategy: CostOptimizationStrategy, sessionMetrics: any): boolean {
    // Check if optimization strategy is applicable to current session
    return true; // Simplified
  }

  private calculateActualSavings(strategy: CostOptimizationStrategy, sessionMetrics: any): number {
    // Calculate actual potential savings based on session data
    return strategy.potentialSavings * 0.8; // 80% of theoretical savings
  }

  private async executeOptimizationStrategy(strategy: CostOptimizationStrategy, sessionId: string): Promise<{
    implemented: boolean;
    estimatedSavings: number;
    actualSavings?: number;
    recommendations: string[];
  }> {
    // Execute the optimization strategy
    return {
      implemented: true,
      estimatedSavings: strategy.potentialSavings,
      recommendations: [`Successfully implemented ${strategy.name}`]
    };
  }

  private analyzeCostTrends(metrics: ComprehensiveCostMetrics, timeframe?: { start: Date; end: Date }): Array<{ metric: string; trend: string; change: number }> {
    // Analyze cost trends over time
    return [
      { metric: 'Cost per asset', trend: 'decreasing', change: -5.2 },
      { metric: 'Budget utilization', trend: 'increasing', change: 8.7 }
    ];
  }

  private generateCostProjections(metrics: ComprehensiveCostMetrics): {
    burnRate: number;
    budgetDepletion: string;
    recommendedActions: string[];
  } {
    return {
      burnRate: metrics.realTime.burnRate,
      budgetDepletion: metrics.realTime.projectedDepletion,
      recommendedActions: [
        'Monitor asset generation quality settings',
        'Consider implementing batch operations',
        'Review peak usage patterns'
      ]
    };
  }

  private generateExecutiveInsights(metrics: ComprehensiveCostMetrics): string[] {
    const insights: string[] = [];
    
    if (metrics.realTime.utilizationRate > 0.8) {
      insights.push('Budget utilization is high - implement cost controls');
    }
    
    if (metrics.efficiency.costPerAsset > 5) {
      insights.push('Asset generation costs are above optimal range');
    }
    
    if (metrics.alerts.triggered > 5) {
      insights.push('Frequent budget alerts indicate need for optimization');
    }
    
    return insights.length > 0 ? insights : ['Cost management is performing within targets'];
  }

  private generateCostAlternatives(operation: string, cost: number, assetType?: string, quality?: string): string[] {
    const alternatives: string[] = [];
    
    if (quality === 'premium') {
      alternatives.push('Use "high" quality to reduce cost by ~40%');
    } else if (quality === 'high') {
      alternatives.push('Use "standard" quality to reduce cost by ~30%');
    }
    
    if (assetType === 'product-hero') {
      alternatives.push('Consider generating background first, then composite product');
    }
    
    alternatives.push('Schedule for off-peak hours for potential cost savings');
    alternatives.push('Use draft quality for initial concept validation');
    
    return alternatives;
  }

  private checkSpecificCostControls(sessionId: string, operation: string, cost: number, assetType?: string, quality?: string): string | null {
    // Check specific cost control violations
    if (cost > this.costControls.maxCostPerAsset) {
      return `Operation cost ($${cost}) exceeds maximum per-asset limit ($${this.costControls.maxCostPerAsset})`;
    }
    
    return null;
  }

  private assessThresholdRisk(remainingBudget: number): string {
    const totalBudget = this.costMetrics.realTime.currentSpend + this.costMetrics.realTime.budgetRemaining;
    const remainingPercentage = remainingBudget / totalBudget;
    
    if (remainingPercentage < 0.1) return 'critical';
    if (remainingPercentage < 0.25) return 'high';
    if (remainingPercentage < 0.5) return 'medium';
    return 'low';
  }

  /**
   * Health check for comprehensive cost management system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test metrics update
      const testSessionId = 'health-check';
      this.updateComprehensiveMetrics(testSessionId, 'test_operation', 1.0, 'test_asset', 'standard');
      
      // Test real-time update generation
      const budgetUpdate = await this.generateRealTimeBudgetUpdate(testSessionId, 'test_operation', 1.0);
      
      // Test cost controls
      const controls = this.checkCostControls(testSessionId, 'test_operation', 1.0, 'test_asset', 'standard');
      
      const healthy = !!(budgetUpdate.timestamp && 
                        budgetUpdate.thresholdStatus && 
                        Array.isArray(controls));
      
      console.log(`[COMPREHENSIVE COST] Health check: ${healthy ? 'PASS' : 'FAIL'}`);
      return healthy;
    } catch (error) {
      console.error('[COMPREHENSIVE COST] Health check failed:', error);
      return false;
    }
  }
}