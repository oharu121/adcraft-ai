/**
 * Creative Director Performance Monitor
 *
 * Comprehensive performance monitoring and optimization for David's asset generation workflows,
 * including timing analysis, resource usage tracking, and optimization recommendations.
 */

export interface PerformanceMetric {
  id: string;
  sessionId: string;
  operation: string;
  category: "generation" | "storage" | "processing" | "api_call" | "workflow";
  
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
    queueTime?: number;
    processingTime?: number;
    networkTime?: number;
  };
  
  resource: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkBandwidth?: number;
    storageIO?: number;
  };
  
  quality: {
    successRate: number;
    errorRate: number;
    retryCount: number;
    fallbackUsed: boolean;
  };
  
  cost: {
    amount: number;
    efficiency: number; // cost per successful operation
  };
  
  metadata: Record<string, any>;
  timestamp: string;
}

export interface WorkflowPerformance {
  workflowId: string;
  sessionId: string;
  workflowType: "asset_generation" | "style_selection" | "handoff_preparation";
  
  stages: {
    name: string;
    duration: number;
    success: boolean;
    metrics: PerformanceMetric[];
  }[];
  
  overall: {
    totalDuration: number;
    successRate: number;
    bottlenecks: string[];
    optimizationOpportunities: string[];
  };
  
  timestamp: string;
}

export interface PerformanceAnalytics {
  averageResponseTime: number;
  throughput: number; // operations per minute
  successRate: number;
  errorRate: number;
  
  byOperation: Record<string, {
    avgDuration: number;
    successRate: number;
    count: number;
  }>;
  
  bottlenecks: {
    operation: string;
    avgDuration: number;
    impact: number;
    frequency: number;
  }[];
  
  trends: {
    performanceTrend: "improving" | "degrading" | "stable";
    hourlyMetrics: { hour: number; avgDuration: number; count: number }[];
    peakUsageHours: number[];
  };
  
  optimization: {
    quickWins: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
}

export interface OptimizationRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  category: "performance" | "cost" | "quality" | "user_experience";
  title: string;
  description: string;
  impact: string;
  effort: "low" | "medium" | "high";
  implementation: string;
  estimatedImprovement: {
    performance?: string;
    cost?: string;
    quality?: string;
    user_experience?: string;
  };
}

/**
 * Creative Director Performance Monitor
 * Monitors and optimizes David's asset generation workflows
 */
export class CreativeDirectorPerformanceMonitor {
  private static instance: CreativeDirectorPerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private workflows: WorkflowPerformance[] = [];
  private activeTimers: Map<string, { startTime: number; metadata: any }> = new Map();
  private performanceThresholds = {
    assetGeneration: 30000, // 30 seconds
    apiResponse: 5000,      // 5 seconds
    storageUpload: 10000,   // 10 seconds
    workflowComplete: 60000 // 60 seconds
  };

  private constructor() {
    this.startPerformanceCollection();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorPerformanceMonitor {
    if (!CreativeDirectorPerformanceMonitor.instance) {
      CreativeDirectorPerformanceMonitor.instance = new CreativeDirectorPerformanceMonitor();
    }
    return CreativeDirectorPerformanceMonitor.instance;
  }

  /**
   * Start tracking a performance operation
   */
  public startTracking(
    operationId: string,
    sessionId: string,
    operation: string,
    category: PerformanceMetric["category"],
    metadata: Record<string, any> = {}
  ): void {
    const startTime = performance.now();
    
    this.activeTimers.set(operationId, {
      startTime,
      metadata: {
        sessionId,
        operation,
        category,
        ...metadata
      }
    });

    console.log(`[PERFORMANCE] Started tracking: ${operation} (${operationId})`);
  }

  /**
   * End tracking and record performance metric
   */
  public endTracking(
    operationId: string,
    success: boolean = true,
    additionalData: Record<string, any> = {}
  ): PerformanceMetric | null {
    const timer = this.activeTimers.get(operationId);
    if (!timer) {
      console.warn(`[PERFORMANCE] No active timer found for operation: ${operationId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - timer.startTime;

    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      sessionId: timer.metadata.sessionId,
      operation: timer.metadata.operation,
      category: timer.metadata.category,
      
      timing: {
        startTime: timer.startTime,
        endTime,
        duration,
        queueTime: additionalData.queueTime,
        processingTime: additionalData.processingTime,
        networkTime: additionalData.networkTime
      },
      
      resource: {
        memoryUsage: additionalData.memoryUsage,
        cpuUsage: additionalData.cpuUsage,
        networkBandwidth: additionalData.networkBandwidth,
        storageIO: additionalData.storageIO
      },
      
      quality: {
        successRate: success ? 1.0 : 0.0,
        errorRate: success ? 0.0 : 1.0,
        retryCount: additionalData.retryCount || 0,
        fallbackUsed: additionalData.fallbackUsed || false
      },
      
      cost: {
        amount: additionalData.cost || 0,
        efficiency: additionalData.cost ? additionalData.cost / (success ? 1 : 0.1) : 0
      },
      
      metadata: {
        ...timer.metadata,
        ...additionalData
      },
      
      timestamp: new Date().toISOString()
    };

    // Add to metrics collection
    this.metrics.push(metric);
    this.activeTimers.delete(operationId);

    // Check for performance issues
    this.checkPerformanceThresholds(metric);

    console.log(`[PERFORMANCE] Completed tracking: ${metric.operation} in ${duration.toFixed(2)}ms`);
    return metric;
  }

  /**
   * Track complete workflow performance
   */
  public async trackWorkflow<T>(
    workflowId: string,
    sessionId: string,
    workflowType: WorkflowPerformance["workflowType"],
    stages: { name: string; operation: () => Promise<any> }[]
  ): Promise<{
    result: T[];
    performance: WorkflowPerformance;
  }> {
    const workflowStartTime = performance.now();
    const stageResults: any[] = [];
    const stagePerformances: WorkflowPerformance["stages"] = [];

    console.log(`[WORKFLOW] Starting workflow: ${workflowType} (${workflowId})`);

    for (const stage of stages) {
      const stageId = `${workflowId}-${stage.name}`;
      let stageSuccess = true;
      let stageMetrics: PerformanceMetric[] = [];

      try {
        this.startTracking(stageId, sessionId, stage.name, "workflow", {
          workflowId,
          workflowType,
          stageName: stage.name
        });

        const result = await stage.operation();
        stageResults.push(result);

        const metric = this.endTracking(stageId, true, { stageResult: result });
        if (metric) stageMetrics.push(metric);

      } catch (error) {
        stageSuccess = false;
        console.error(`[WORKFLOW] Stage ${stage.name} failed:`, error);
        
        const metric = this.endTracking(stageId, false, { error: error instanceof Error ? error.message : String(error) });
        if (metric) stageMetrics.push(metric);
      }

      stagePerformances.push({
        name: stage.name,
        duration: stageMetrics[0]?.timing.duration || 0,
        success: stageSuccess,
        metrics: stageMetrics
      });
    }

    const workflowEndTime = performance.now();
    const totalDuration = workflowEndTime - workflowStartTime;
    const successRate = stagePerformances.filter(s => s.success).length / stagePerformances.length;

    // Analyze workflow performance
    const bottlenecks = this.identifyBottlenecks(stagePerformances);
    const optimizationOpportunities = this.identifyOptimizations(stagePerformances);

    const workflowPerformance: WorkflowPerformance = {
      workflowId,
      sessionId,
      workflowType,
      stages: stagePerformances,
      overall: {
        totalDuration,
        successRate,
        bottlenecks,
        optimizationOpportunities
      },
      timestamp: new Date().toISOString()
    };

    this.workflows.push(workflowPerformance);

    console.log(`[WORKFLOW] Completed workflow: ${workflowType} in ${totalDuration.toFixed(2)}ms (${(successRate * 100).toFixed(1)}% success)`);

    return {
      result: stageResults,
      performance: workflowPerformance
    };
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics(
    sessionId?: string,
    timeRange?: { start: Date; end: Date }
  ): PerformanceAnalytics {
    let filteredMetrics = this.metrics;

    // Filter by session if specified
    if (sessionId) {
      filteredMetrics = filteredMetrics.filter(m => m.sessionId === sessionId);
    }

    // Filter by time range if specified
    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => {
        const timestamp = new Date(m.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
    }

    if (filteredMetrics.length === 0) {
      return this.getEmptyAnalytics();
    }

    // Calculate basic metrics
    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.timing.duration, 0);
    const averageResponseTime = totalDuration / filteredMetrics.length;
    const successfulMetrics = filteredMetrics.filter(m => m.quality.successRate > 0);
    const successRate = successfulMetrics.length / filteredMetrics.length;
    const errorRate = 1 - successRate;

    // Calculate throughput (operations per minute)
    const timeSpanMs = timeRange ? 
      timeRange.end.getTime() - timeRange.start.getTime() :
      Math.max(...filteredMetrics.map(m => new Date(m.timestamp).getTime())) - 
      Math.min(...filteredMetrics.map(m => new Date(m.timestamp).getTime()));
    const throughput = (filteredMetrics.length / (timeSpanMs / 60000));

    // Group by operation
    const byOperation: Record<string, { avgDuration: number; successRate: number; count: number }> = {};
    filteredMetrics.forEach(metric => {
      const op = metric.operation;
      if (!byOperation[op]) {
        byOperation[op] = { avgDuration: 0, successRate: 0, count: 0 };
      }
      byOperation[op].avgDuration += metric.timing.duration;
      byOperation[op].successRate += metric.quality.successRate;
      byOperation[op].count += 1;
    });

    // Calculate averages
    Object.keys(byOperation).forEach(op => {
      byOperation[op].avgDuration /= byOperation[op].count;
      byOperation[op].successRate /= byOperation[op].count;
    });

    // Identify bottlenecks
    const bottlenecks = Object.entries(byOperation)
      .map(([operation, stats]) => ({
        operation,
        avgDuration: stats.avgDuration,
        impact: stats.avgDuration * stats.count,
        frequency: stats.count
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);

    // Analyze trends
    const hourlyMetrics = this.calculateHourlyMetrics(filteredMetrics);
    const performanceTrend = this.analyzeTrend(hourlyMetrics);
    const peakUsageHours = this.identifyPeakHours(hourlyMetrics);

    // Generate optimization recommendations
    const optimization = this.generateOptimizationPlan(filteredMetrics, bottlenecks);

    return {
      averageResponseTime,
      throughput,
      successRate,
      errorRate,
      byOperation,
      bottlenecks,
      trends: {
        performanceTrend,
        hourlyMetrics,
        peakUsageHours
      },
      optimization
    };
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(
    sessionId?: string
  ): OptimizationRecommendation[] {
    const analytics = this.getPerformanceAnalytics(sessionId);
    const recommendations: OptimizationRecommendation[] = [];

    // High priority recommendations
    if (analytics.averageResponseTime > this.performanceThresholds.apiResponse) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: "high",
        category: "performance",
        title: "Reduce API Response Time",
        description: "API response times are above optimal thresholds",
        impact: `Could improve user experience by ${(analytics.averageResponseTime / 1000).toFixed(1)}s per request`,
        effort: "medium",
        implementation: "Optimize API calls, implement caching, or use request batching",
        estimatedImprovement: {
          performance: "30-50% faster response times"
        }
      });
    }

    // Cost optimization
    const highCostOperations = analytics.bottlenecks.filter(b => b.avgDuration > 10000);
    if (highCostOperations.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: "medium",
        category: "cost",
        title: "Optimize High-Cost Operations",
        description: `${highCostOperations.length} operations are consuming significant resources`,
        impact: "Could reduce operational costs by 20-40%",
        effort: "high",
        implementation: "Review and optimize slow operations, consider alternative approaches",
        estimatedImprovement: {
          cost: "20-40% cost reduction",
          performance: "15-25% faster processing"
        }
      });
    }

    // Quality improvements
    if (analytics.errorRate > 0.1) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: "high",
        category: "quality",
        title: "Improve Error Handling",
        description: `Error rate is ${(analytics.errorRate * 100).toFixed(1)}%, above acceptable threshold`,
        impact: "Better user experience and reliability",
        effort: "medium",
        implementation: "Implement better error handling, add retry logic, improve fallbacks",
        estimatedImprovement: {
          quality: "Reduce error rate by 50-70%"
        }
      });
    }

    // Asset generation specific recommendations
    const assetGenMetrics = this.metrics.filter(m => m.operation.includes("generate"));
    if (assetGenMetrics.length > 0) {
      const avgGenTime = assetGenMetrics.reduce((sum, m) => sum + m.timing.duration, 0) / assetGenMetrics.length;
      
      if (avgGenTime > this.performanceThresholds.assetGeneration) {
        recommendations.push({
          id: crypto.randomUUID(),
          priority: "medium",
          category: "performance",
          title: "Optimize Asset Generation",
          description: "Asset generation times exceed optimal performance",
          impact: `Could save ${((avgGenTime - this.performanceThresholds.assetGeneration) / 1000).toFixed(1)}s per asset`,
          effort: "low",
          implementation: "Optimize generation parameters, use parallel processing, implement progressive loading",
          estimatedImprovement: {
            performance: "25-40% faster asset generation",
            user_experience: "Improved perceived performance"
          }
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate performance report
   */
  public generatePerformanceReport(sessionId: string): {
    summary: string;
    analytics: PerformanceAnalytics;
    recommendations: OptimizationRecommendation[];
    workflows: WorkflowPerformance[];
  } {
    const analytics = this.getPerformanceAnalytics(sessionId);
    const recommendations = this.getOptimizationRecommendations(sessionId);
    const workflows = this.workflows.filter(w => w.sessionId === sessionId);

    const summary = this.generateSummaryText(analytics, recommendations);

    return {
      summary,
      analytics,
      recommendations,
      workflows
    };
  }

  /**
   * Start background performance collection
   */
  private startPerformanceCollection(): void {
    // Monitor system resources periodically
    setInterval(() => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        this.collectSystemMetrics();
      }
    }, 30000); // Every 30 seconds

    console.log("[PERFORMANCE] Started background performance collection");
  }

  /**
   * Collect system performance metrics
   */
  private collectSystemMetrics(): void {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      const memory = (performance as any).memory;

      if (navigation || memory) {
        // This would collect actual system metrics in a real implementation
        console.log("[PERFORMANCE] Collected system metrics");
      }
    } catch (error) {
      // Silently handle cases where performance APIs are not available
    }
  }

  /**
   * Check performance thresholds and alert if exceeded
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const threshold = this.getThresholdForOperation(metric.operation);
    
    if (metric.timing.duration > threshold) {
      console.warn(
        `[PERFORMANCE ALERT] Operation '${metric.operation}' took ${metric.timing.duration.toFixed(2)}ms ` +
        `(threshold: ${threshold}ms) in session ${metric.sessionId}`
      );

      // In a real implementation, this could trigger alerts or notifications
    }
  }

  /**
   * Get performance threshold for operation
   */
  private getThresholdForOperation(operation: string): number {
    if (operation.includes("generate")) return this.performanceThresholds.assetGeneration;
    if (operation.includes("upload")) return this.performanceThresholds.storageUpload;
    if (operation.includes("api")) return this.performanceThresholds.apiResponse;
    return this.performanceThresholds.workflowComplete;
  }

  /**
   * Helper methods for analytics
   */
  private identifyBottlenecks(stages: WorkflowPerformance["stages"]): string[] {
    return stages
      .filter(stage => stage.duration > 5000) // More than 5 seconds
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map(stage => `${stage.name} (${(stage.duration / 1000).toFixed(1)}s)`);
  }

  private identifyOptimizations(stages: WorkflowPerformance["stages"]): string[] {
    const opportunities: string[] = [];
    
    stages.forEach(stage => {
      if (stage.duration > 10000) {
        opportunities.push(`Optimize ${stage.name} - taking ${(stage.duration / 1000).toFixed(1)}s`);
      }
      if (!stage.success) {
        opportunities.push(`Improve ${stage.name} reliability - currently failing`);
      }
    });

    return opportunities;
  }

  private calculateHourlyMetrics(metrics: PerformanceMetric[]): { hour: number; avgDuration: number; count: number }[] {
    const hourlyData: Record<number, { totalDuration: number; count: number }> = {};
    
    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { totalDuration: 0, count: 0 };
      }
      hourlyData[hour].totalDuration += metric.timing.duration;
      hourlyData[hour].count += 1;
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      avgDuration: data.totalDuration / data.count,
      count: data.count
    }));
  }

  private analyzeTrend(hourlyMetrics: { hour: number; avgDuration: number; count: number }[]): "improving" | "degrading" | "stable" {
    if (hourlyMetrics.length < 2) return "stable";
    
    const sortedMetrics = hourlyMetrics.sort((a, b) => a.hour - b.hour);
    const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2));
    const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.avgDuration, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.avgDuration, 0) / secondHalf.length;
    
    const improvement = (firstAvg - secondAvg) / firstAvg;
    
    if (improvement > 0.1) return "improving";
    if (improvement < -0.1) return "degrading";
    return "stable";
  }

  private identifyPeakHours(hourlyMetrics: { hour: number; avgDuration: number; count: number }[]): number[] {
    const avgCount = hourlyMetrics.reduce((sum, m) => sum + m.count, 0) / hourlyMetrics.length;
    return hourlyMetrics
      .filter(m => m.count > avgCount * 1.5)
      .map(m => m.hour)
      .sort();
  }

  private generateOptimizationPlan(
    metrics: PerformanceMetric[], 
    bottlenecks: any[]
  ): { quickWins: string[]; mediumTerm: string[]; longTerm: string[] } {
    const quickWins: string[] = [];
    const mediumTerm: string[] = [];
    const longTerm: string[] = [];

    // Quick wins based on simple optimizations
    if (bottlenecks.some(b => b.operation.includes("storage"))) {
      quickWins.push("Implement parallel asset uploads");
      quickWins.push("Add compression for large assets");
    }

    if (metrics.some(m => m.quality.retryCount > 0)) {
      quickWins.push("Optimize retry logic to reduce unnecessary attempts");
    }

    // Medium term optimizations
    if (bottlenecks.some(b => b.operation.includes("generate"))) {
      mediumTerm.push("Implement asset generation caching");
      mediumTerm.push("Optimize generation parameters for common use cases");
    }

    // Long term strategic improvements
    longTerm.push("Implement predictive asset pre-generation");
    longTerm.push("Add advanced performance analytics dashboard");
    longTerm.push("Consider edge computing for asset processing");

    return { quickWins, mediumTerm, longTerm };
  }

  private generateSummaryText(
    analytics: PerformanceAnalytics, 
    recommendations: OptimizationRecommendation[]
  ): string {
    const lines: string[] = [];
    
    lines.push(`Performance Summary:`);
    lines.push(`- Average Response Time: ${analytics.averageResponseTime.toFixed(1)}ms`);
    lines.push(`- Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`);
    lines.push(`- Throughput: ${analytics.throughput.toFixed(1)} ops/min`);
    
    if (analytics.bottlenecks.length > 0) {
      lines.push(`- Top Bottleneck: ${analytics.bottlenecks[0].operation} (${analytics.bottlenecks[0].avgDuration.toFixed(1)}ms avg)`);
    }

    lines.push(`- Performance Trend: ${analytics.trends.performanceTrend}`);
    
    if (recommendations.length > 0) {
      lines.push(`- Recommendations: ${recommendations.length} optimization opportunities identified`);
    }

    return lines.join('\n');
  }

  private getEmptyAnalytics(): PerformanceAnalytics {
    return {
      averageResponseTime: 0,
      throughput: 0,
      successRate: 0,
      errorRate: 0,
      byOperation: {},
      bottlenecks: [],
      trends: {
        performanceTrend: "stable",
        hourlyMetrics: [],
        peakUsageHours: []
      },
      optimization: {
        quickWins: [],
        mediumTerm: [],
        longTerm: []
      }
    };
  }

  /**
   * Health check for performance monitoring system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test basic performance tracking
      const testId = crypto.randomUUID();
      this.startTracking(testId, "health-check", "test_operation", "api_call");
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metric = this.endTracking(testId, true);
      
      console.log("[PERFORMANCE MONITOR] Health check completed");
      return metric !== null;
    } catch (error) {
      console.error("[PERFORMANCE MONITOR] Health check failed:", error);
      return false;
    }
  }
}