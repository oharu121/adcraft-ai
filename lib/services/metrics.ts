/**
 * Performance Monitoring & Metrics Collection Service
 * Tracks API response times, system metrics, and performance indicators
 */

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  correlationId?: string;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

export interface SystemMetric {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  uptime: number;
  timestamp: Date;
  activeConnections?: number;
  queueSize?: number;
}

export interface VideoGenerationMetric {
  jobId: string;
  stage: 'validation' | 'processing' | 'generation' | 'upload' | 'completed' | 'failed';
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: {
    promptLength?: number;
    videoDuration?: number;
    fileSize?: number;
    cost?: number;
  };
}

export interface PerformanceSummary {
  // API Performance
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  
  // System Performance
  currentCpuUsage: number;
  currentMemoryUsage: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  
  // Video Generation Performance
  totalVideoGenerations: number;
  averageGenerationTime: number;
  videoGenerationSuccessRate: number;
  
  // Time ranges
  timeRange: string;
  lastUpdated: Date;
}

interface AlertCondition {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // milliseconds
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: Date;
}

export class MetricsService {
  private static instance: MetricsService;
  
  // Metric storage
  private apiMetrics: APIMetric[] = [];
  private systemMetrics: SystemMetric[] = [];
  private videoMetrics: VideoGenerationMetric[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  
  // Alert conditions
  private alertConditions: Map<string, AlertCondition> = new Map();
  
  // Configuration
  private readonly maxMetricsRetention: number = 10000;
  private readonly retentionPeriod: number = 24 * 60 * 60 * 1000; // 24 hours
  private readonly systemMetricInterval: number = 30 * 1000; // 30 seconds
  
  // System monitoring
  private systemMonitorInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeDefaultAlerts();
    this.startSystemMonitoring();
    
    // Cleanup old metrics every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Record API request metrics
   */
  public recordAPIMetric(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    correlationId?: string,
    requestSize?: number,
    responseSize?: number,
    error?: string
  ): void {
    const metric: APIMetric = {
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: new Date(),
      correlationId,
      requestSize,
      responseSize,
      error,
    };

    this.apiMetrics.push(metric);
    this.enforceRetention('api');

    // Check for alert conditions
    this.checkApiMetricAlerts(metric);
  }

  /**
   * Record video generation metrics
   */
  public recordVideoGenerationMetric(
    jobId: string,
    stage: VideoGenerationMetric['stage'],
    duration: number,
    success: boolean,
    error?: string,
    metadata?: VideoGenerationMetric['metadata']
  ): void {
    const metric: VideoGenerationMetric = {
      jobId,
      stage,
      duration,
      timestamp: new Date(),
      success,
      error,
      metadata,
    };

    this.videoMetrics.push(metric);
    this.enforceRetention('video');

    // Check for alert conditions
    this.checkVideoMetricAlerts(metric);
  }

  /**
   * Record custom performance metric
   */
  public recordCustomMetric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
      metadata,
    };

    this.performanceMetrics.push(metric);
    this.enforceRetention('performance');
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(timeRange: string = '1h'): PerformanceSummary {
    const now = Date.now();
    const rangeMs = this.parseTimeRange(timeRange);
    const startTime = now - rangeMs;

    // Filter metrics by time range
    const apiMetrics = this.apiMetrics.filter(m => m.timestamp.getTime() >= startTime);
    const systemMetrics = this.systemMetrics.filter(m => m.timestamp.getTime() >= startTime);
    const videoMetrics = this.videoMetrics.filter(m => m.timestamp.getTime() >= startTime);

    // Calculate API metrics
    const responseTimes = apiMetrics.map(m => m.responseTime);
    const errorCount = apiMetrics.filter(m => m.statusCode >= 400).length;
    
    // Calculate system metrics
    const cpuUsages = systemMetrics.map(m => m.cpuUsage);
    const memoryUsages = systemMetrics.map(m => m.memoryUsage);
    
    // Calculate video metrics
    const completedVideos = videoMetrics.filter(m => m.stage === 'completed');
    const successfulVideos = completedVideos.filter(m => m.success);

    return {
      // API Performance
      totalRequests: apiMetrics.length,
      averageResponseTime: this.calculateAverage(responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      errorRate: apiMetrics.length > 0 ? (errorCount / apiMetrics.length) * 100 : 0,
      
      // System Performance
      currentCpuUsage: systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].cpuUsage : 0,
      currentMemoryUsage: systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].memoryUsage : 0,
      averageCpuUsage: this.calculateAverage(cpuUsages),
      averageMemoryUsage: this.calculateAverage(memoryUsages),
      
      // Video Generation Performance
      totalVideoGenerations: completedVideos.length,
      averageGenerationTime: this.calculateAverage(completedVideos.map(m => m.duration)),
      videoGenerationSuccessRate: completedVideos.length > 0 
        ? (successfulVideos.length / completedVideos.length) * 100 
        : 0,
      
      // Meta
      timeRange,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get API metrics with filtering and aggregation
   */
  public getAPIMetrics(options: {
    timeRange?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    limit?: number;
  } = {}): {
    metrics: APIMetric[];
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
    };
  } {
    let metrics = this.apiMetrics;

    // Apply filters
    if (options.timeRange) {
      const rangeMs = this.parseTimeRange(options.timeRange);
      const startTime = Date.now() - rangeMs;
      metrics = metrics.filter(m => m.timestamp.getTime() >= startTime);
    }

    if (options.endpoint) {
      metrics = metrics.filter(m => m.endpoint === options.endpoint);
    }

    if (options.method) {
      metrics = metrics.filter(m => m.method === options.method);
    }

    if (options.statusCode) {
      metrics = metrics.filter(m => m.statusCode === options.statusCode);
    }

    // Sort by timestamp (newest first) and limit
    metrics = metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, options.limit || 100);

    // Calculate summary
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const responseTimes = metrics.map(m => m.responseTime);

    // Top endpoints
    const endpointStats = new Map<string, { count: number; totalTime: number }>();
    for (const metric of metrics) {
      const stats = endpointStats.get(metric.endpoint) || { count: 0, totalTime: 0 };
      stats.count++;
      stats.totalTime += metric.responseTime;
      endpointStats.set(metric.endpoint, stats);
    }

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      metrics,
      summary: {
        totalRequests: metrics.length,
        averageResponseTime: this.calculateAverage(responseTimes),
        errorRate: metrics.length > 0 ? (errorCount / metrics.length) * 100 : 0,
        topEndpoints,
      },
    };
  }

  /**
   * Get video generation metrics
   */
  public getVideoGenerationMetrics(options: {
    timeRange?: string;
    jobId?: string;
    stage?: VideoGenerationMetric['stage'];
    limit?: number;
  } = {}): {
    metrics: VideoGenerationMetric[];
    summary: {
      totalGenerations: number;
      successRate: number;
      averageProcessingTime: number;
      stageBreakdown: Record<VideoGenerationMetric['stage'], number>;
    };
  } {
    let metrics = this.videoMetrics;

    // Apply filters
    if (options.timeRange) {
      const rangeMs = this.parseTimeRange(options.timeRange);
      const startTime = Date.now() - rangeMs;
      metrics = metrics.filter(m => m.timestamp.getTime() >= startTime);
    }

    if (options.jobId) {
      metrics = metrics.filter(m => m.jobId === options.jobId);
    }

    if (options.stage) {
      metrics = metrics.filter(m => m.stage === options.stage);
    }

    // Sort and limit
    metrics = metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, options.limit || 100);

    // Calculate summary
    const completedMetrics = metrics.filter(m => m.stage === 'completed');
    const successfulMetrics = completedMetrics.filter(m => m.success);

    const stageBreakdown = {} as Record<VideoGenerationMetric['stage'], number>;
    const stages: VideoGenerationMetric['stage'][] = ['validation', 'processing', 'generation', 'upload', 'completed', 'failed'];
    
    for (const stage of stages) {
      stageBreakdown[stage] = metrics.filter(m => m.stage === stage).length;
    }

    return {
      metrics,
      summary: {
        totalGenerations: completedMetrics.length,
        successRate: completedMetrics.length > 0 
          ? (successfulMetrics.length / completedMetrics.length) * 100 
          : 0,
        averageProcessingTime: this.calculateAverage(completedMetrics.map(m => m.duration)),
        stageBreakdown,
      },
    };
  }

  /**
   * Get system metrics
   */
  public getSystemMetrics(timeRange: string = '1h'): {
    metrics: SystemMetric[];
    summary: {
      currentCpuUsage: number;
      currentMemoryUsage: number;
      averageCpuUsage: number;
      averageMemoryUsage: number;
      uptime: number;
    };
  } {
    const rangeMs = this.parseTimeRange(timeRange);
    const startTime = Date.now() - rangeMs;

    const metrics = this.systemMetrics
      .filter(m => m.timestamp.getTime() >= startTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const cpuUsages = metrics.map(m => m.cpuUsage);
    const memoryUsages = metrics.map(m => m.memoryUsage);

    return {
      metrics,
      summary: {
        currentCpuUsage: metrics.length > 0 ? metrics[0].cpuUsage : 0,
        currentMemoryUsage: metrics.length > 0 ? metrics[0].memoryUsage : 0,
        averageCpuUsage: this.calculateAverage(cpuUsages),
        averageMemoryUsage: this.calculateAverage(memoryUsages),
        uptime: process.uptime(),
      },
    };
  }

  /**
   * Add alert condition
   */
  public addAlertCondition(condition: Omit<AlertCondition, 'triggered' | 'lastTriggered'>): void {
    this.alertConditions.set(condition.id, {
      ...condition,
      triggered: false,
    });
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): AlertCondition[] {
    return Array.from(this.alertConditions.values())
      .filter(condition => condition.triggered && condition.enabled);
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string): boolean {
    const condition = this.alertConditions.get(alertId);
    if (condition) {
      condition.triggered = false;
      return true;
    }
    return false;
  }

  /**
   * Start system monitoring
   */
  private startSystemMonitoring(): void {
    this.systemMonitorInterval = setInterval(() => {
      this.recordSystemMetrics();
    }, this.systemMetricInterval);
  }

  /**
   * Stop system monitoring
   */
  public stopSystemMonitoring(): void {
    if (this.systemMonitorInterval) {
      clearInterval(this.systemMonitorInterval);
      this.systemMonitorInterval = undefined;
    }
  }

  /**
   * Record current system metrics
   */
  private recordSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    const metric: SystemMetric = {
      cpuUsage: this.getCPUUsage(),
      memoryUsage: memUsage.heapUsed,
      memoryTotal: memUsage.heapTotal,
      uptime: process.uptime(),
      timestamp: new Date(),
    };

    this.systemMetrics.push(metric);
    this.enforceRetention('system');

    // Check for system alerts
    this.checkSystemMetricAlerts(metric);
  }

  /**
   * Get CPU usage (simplified implementation)
   */
  private getCPUUsage(): number {
    // This is a simplified implementation
    // In production, you might want to use a proper CPU monitoring library
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  /**
   * Initialize default alert conditions
   */
  private initializeDefaultAlerts(): void {
    const defaultAlerts: Array<Omit<AlertCondition, 'triggered' | 'lastTriggered'>> = [
      {
        id: 'high_response_time',
        name: 'High API Response Time',
        metric: 'api_response_time',
        condition: 'gt',
        threshold: 30000, // 30 seconds
        duration: 5 * 60 * 1000, // 5 minutes
        enabled: true,
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        metric: 'api_error_rate',
        condition: 'gt',
        threshold: 5, // 5%
        duration: 5 * 60 * 1000, // 5 minutes
        enabled: true,
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        metric: 'system_memory_usage',
        condition: 'gt',
        threshold: 500 * 1024 * 1024, // 500MB
        duration: 10 * 60 * 1000, // 10 minutes
        enabled: true,
      },
      {
        id: 'video_generation_failures',
        name: 'Video Generation Failures',
        metric: 'video_success_rate',
        condition: 'lt',
        threshold: 90, // 90%
        duration: 15 * 60 * 1000, // 15 minutes
        enabled: true,
      },
    ];

    for (const alert of defaultAlerts) {
      this.addAlertCondition(alert);
    }
  }

  /**
   * Check API metric alerts
   */
  private checkApiMetricAlerts(metric: APIMetric): void {
    // Check response time alert
    const responseTimeAlert = this.alertConditions.get('high_response_time');
    if (responseTimeAlert && responseTimeAlert.enabled && metric.responseTime > responseTimeAlert.threshold) {
      this.triggerAlert(responseTimeAlert);
    }

    // Check error rate (calculated over recent metrics)
    const errorRateAlert = this.alertConditions.get('high_error_rate');
    if (errorRateAlert && errorRateAlert.enabled) {
      const recentMetrics = this.apiMetrics.slice(-100); // Last 100 requests
      const errorRate = (recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length) * 100;
      
      if (errorRate > errorRateAlert.threshold) {
        this.triggerAlert(errorRateAlert);
      }
    }
  }

  /**
   * Check video metric alerts
   */
  private checkVideoMetricAlerts(metric: VideoGenerationMetric): void {
    if (metric.stage === 'completed') {
      const successRateAlert = this.alertConditions.get('video_generation_failures');
      if (successRateAlert && successRateAlert.enabled) {
        const recentMetrics = this.videoMetrics
          .filter(m => m.stage === 'completed')
          .slice(-20); // Last 20 completed videos
        
        const successRate = (recentMetrics.filter(m => m.success).length / recentMetrics.length) * 100;
        
        if (successRate < successRateAlert.threshold) {
          this.triggerAlert(successRateAlert);
        }
      }
    }
  }

  /**
   * Check system metric alerts
   */
  private checkSystemMetricAlerts(metric: SystemMetric): void {
    const memoryAlert = this.alertConditions.get('high_memory_usage');
    if (memoryAlert && memoryAlert.enabled && metric.memoryUsage > memoryAlert.threshold) {
      this.triggerAlert(memoryAlert);
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(condition: AlertCondition): void {
    if (!condition.triggered) {
      condition.triggered = true;
      condition.lastTriggered = new Date();
      
      console.error(`🚨 PERFORMANCE ALERT: ${condition.name} - ${condition.metric} ${condition.condition} ${condition.threshold}`);
      
      // In production, send to monitoring system
    }
  }

  /**
   * Parse time range string to milliseconds
   */
  private parseTimeRange(range: string): number {
    const match = range.match(/^(\d+)([hmd])$/);
    if (!match) return 60 * 60 * 1000; // Default to 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  /**
   * Calculate average of number array
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate percentile of number array
   */
  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Enforce retention limits for different metric types
   */
  private enforceRetention(type: 'api' | 'system' | 'video' | 'performance'): void {
    switch (type) {
      case 'api':
        if (this.apiMetrics.length > this.maxMetricsRetention) {
          this.apiMetrics = this.apiMetrics.slice(-this.maxMetricsRetention);
        }
        break;
      case 'system':
        if (this.systemMetrics.length > this.maxMetricsRetention) {
          this.systemMetrics = this.systemMetrics.slice(-this.maxMetricsRetention);
        }
        break;
      case 'video':
        if (this.videoMetrics.length > this.maxMetricsRetention) {
          this.videoMetrics = this.videoMetrics.slice(-this.maxMetricsRetention);
        }
        break;
      case 'performance':
        if (this.performanceMetrics.length > this.maxMetricsRetention) {
          this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsRetention);
        }
        break;
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.retentionPeriod;

    const initialCounts = {
      api: this.apiMetrics.length,
      system: this.systemMetrics.length,
      video: this.videoMetrics.length,
      performance: this.performanceMetrics.length,
    };

    // Clean up old metrics
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp.getTime() >= cutoff);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp.getTime() >= cutoff);
    this.videoMetrics = this.videoMetrics.filter(m => m.timestamp.getTime() >= cutoff);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp.getTime() >= cutoff);

    const removedCount = 
      (initialCounts.api - this.apiMetrics.length) +
      (initialCounts.system - this.systemMetrics.length) +
      (initialCounts.video - this.videoMetrics.length) +
      (initialCounts.performance - this.performanceMetrics.length);

    if (removedCount > 0) {
      console.log(`Metrics cleanup: removed ${removedCount} old metrics`);
    }
  }

  /**
   * Health check for metrics service
   */
  public healthCheck(): boolean {
    try {
      // Test metric recording
      this.recordCustomMetric('health_check_test', 1, 'count');
      return true;
    } catch (error) {
      console.error('Metrics service health check failed:', error);
      return false;
    }
  }

  /**
   * Get service statistics
   */
  public getServiceStats(): {
    metricsCount: {
      api: number;
      system: number;
      video: number;
      performance: number;
      total: number;
    };
    alertsCount: {
      total: number;
      active: number;
      enabled: number;
    };
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    const activeAlerts = this.getActiveAlerts();
    const enabledAlerts = Array.from(this.alertConditions.values()).filter(c => c.enabled);

    return {
      metricsCount: {
        api: this.apiMetrics.length,
        system: this.systemMetrics.length,
        video: this.videoMetrics.length,
        performance: this.performanceMetrics.length,
        total: this.apiMetrics.length + this.systemMetrics.length + 
               this.videoMetrics.length + this.performanceMetrics.length,
      },
      alertsCount: {
        total: this.alertConditions.size,
        active: activeAlerts.length,
        enabled: enabledAlerts.length,
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }
}

export default MetricsService;