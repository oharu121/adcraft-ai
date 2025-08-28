/**
 * Core Monitoring Service
 * Aggregates monitoring data from all services and provides unified health checks
 */

import { Logger, LogMetrics } from './logger';
import { MetricsService, PerformanceSummary } from './metrics';
import { CostTracker, BudgetStatus, CostProjection } from './cost-tracker';
import { SecurityMonitorService } from './security-monitor';
import { FirestoreService } from './firestore';
import { CloudStorageService } from './cloud-storage';
import { VeoService } from './veo';
import { VertexAIService } from './vertex-ai';

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  timestamp: Date;
  uptime: number;
  services: ServiceHealthCheck[];
  overallScore: number; // 0-100
  criticalIssues: string[];
  warnings: string[];
}

export interface ServiceHealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  responseTime: number;
  lastCheck: Date;
  details: {
    available: boolean;
    latency: number;
    errorRate: number;
    customMetrics?: Record<string, any>;
  };
  issues: string[];
}

export interface MonitoringDashboardData {
  systemHealth: SystemHealthStatus;
  performance: PerformanceSummary;
  logs: LogMetrics;
  budget: BudgetStatus;
  security: {
    metrics: any;
    recentEvents: any[];
    activeAlerts: any[];
  };
  alerts: AlertSummary;
  trends: SystemTrends;
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  recent: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: Date;
    source: string;
  }>;
}

export interface SystemTrends {
  cpuTrend: Array<{ timestamp: Date; value: number }>;
  memoryTrend: Array<{ timestamp: Date; value: number }>;
  requestTrend: Array<{ timestamp: Date; value: number }>;
  errorTrend: Array<{ timestamp: Date; value: number }>;
  costTrend: Array<{ timestamp: Date; value: number }>;
}

export interface MonitoringConfig {
  healthCheckInterval: number; // milliseconds
  alertCheckInterval: number; // milliseconds
  trendDataPoints: number;
  enableAutoRestart: boolean;
  criticalThresholds: {
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    memoryUsage: number; // bytes
    budgetUsage: number; // percentage
  };
}

/**
 * Core monitoring service that orchestrates all monitoring activities
 */
export class MonitoringService {
  private static instance: MonitoringService;
  
  // Service dependencies
  private logger: Logger;
  private metrics: MetricsService;
  private costTracker: CostTracker;
  private securityMonitor: SecurityMonitorService;
  private firestore: FirestoreService;
  private cloudStorage: CloudStorageService;
  private veo: VeoService;
  private vertexAI: VertexAIService;
  
  // Health check data
  private lastHealthCheck: SystemHealthStatus | null = null;
  private healthCheckHistory: SystemHealthStatus[] = [];
  private systemTrends: SystemTrends;
  
  // Configuration
  private config: MonitoringConfig;
  
  // Monitoring intervals
  private healthCheckInterval?: NodeJS.Timeout;
  private alertCheckInterval?: NodeJS.Timeout;
  private trendUpdateInterval?: NodeJS.Timeout;

  private constructor() {
    // Initialize services
    this.logger = Logger.getInstance();
    this.metrics = MetricsService.getInstance();
    this.costTracker = CostTracker.getInstance();
    this.securityMonitor = SecurityMonitorService.getInstance();
    this.firestore = FirestoreService.getInstance();
    this.cloudStorage = CloudStorageService.getInstance();
    this.veo = VeoService.getInstance();
    this.vertexAI = VertexAIService.getInstance();
    
    // Initialize configuration
    this.config = {
      healthCheckInterval: 30 * 1000, // 30 seconds
      alertCheckInterval: 60 * 1000, // 1 minute
      trendDataPoints: 100,
      enableAutoRestart: false, // Disabled for safety
      criticalThresholds: {
        errorRate: 10, // 10%
        responseTime: 30000, // 30 seconds
        memoryUsage: 1024 * 1024 * 1024, // 1GB
        budgetUsage: 95, // 95%
      },
    };
    
    // Initialize trends
    this.systemTrends = {
      cpuTrend: [],
      memoryTrend: [],
      requestTrend: [],
      errorTrend: [],
      costTrend: [],
    };

    this.startMonitoring();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Start all monitoring activities
   */
  private startMonitoring(): void {
    this.logger.info('Starting monitoring service', 
      { service: 'monitoring', operation: 'start' });

    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(error => {
        this.logger.error('Health check failed', 
          { service: 'monitoring', operation: 'health_check' }, 
          error instanceof Error ? error : new Error('Unknown error'));
      });
    }, this.config.healthCheckInterval);

    // Start alert checks
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts().catch(error => {
        this.logger.error('Alert check failed', 
          { service: 'monitoring', operation: 'alert_check' }, 
          error instanceof Error ? error : new Error('Unknown error'));
      });
    }, this.config.alertCheckInterval);

    // Start trend updates
    this.trendUpdateInterval = setInterval(() => {
      this.updateTrends().catch(error => {
        this.logger.error('Trend update failed', 
          { service: 'monitoring', operation: 'trend_update' }, 
          error instanceof Error ? error : new Error('Unknown error'));
      });
    }, this.config.healthCheckInterval);

    // Perform initial health check
    this.performHealthCheck().catch(error => {
      this.logger.error('Initial health check failed', 
        { service: 'monitoring', operation: 'initial_health_check' }, 
        error instanceof Error ? error : new Error('Unknown error'));
    });
  }

  /**
   * Stop all monitoring activities
   */
  public stopMonitoring(): void {
    this.logger.info('Stopping monitoring service', 
      { service: 'monitoring', operation: 'stop' });

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = undefined;
    }

    if (this.trendUpdateInterval) {
      clearInterval(this.trendUpdateInterval);
      this.trendUpdateInterval = undefined;
    }

    // Stop metrics collection
    this.metrics.stopSystemMonitoring();
  }

  /**
   * Perform comprehensive system health check
   */
  public async performHealthCheck(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    const timestamp = new Date();
    
    this.logger.debug('Starting system health check', 
      { service: 'monitoring', operation: 'health_check' });

    try {
      // Check all services concurrently
      const serviceChecks = await Promise.allSettled([
        this.checkService('firestore', () => this.firestore.healthCheck()),
        this.checkService('cloud-storage', () => this.cloudStorage.healthCheck()),
        this.checkService('veo', () => Promise.resolve(true)), // VeoService doesn't have healthCheck yet
        this.checkService('vertex-ai', () => this.vertexAI.healthCheck()),
        this.checkService('logger', () => this.logger.healthCheck()),
        this.checkService('metrics', () => this.metrics.healthCheck()),
        this.checkService('cost-tracker', () => this.costTracker.healthCheck()),
      ]);

      // Process service check results
      const services: ServiceHealthCheck[] = [];
      const criticalIssues: string[] = [];
      const warnings: string[] = [];

      for (const [index, result] of serviceChecks.entries()) {
        if (result.status === 'fulfilled') {
          services.push(result.value);
          
          if (result.value.status === 'critical' || result.value.status === 'unhealthy') {
            criticalIssues.push(...result.value.issues);
          } else if (result.value.status === 'degraded') {
            warnings.push(...result.value.issues);
          }
        } else {
          const serviceName = ['firestore', 'cloud-storage', 'veo', 'vertex-ai', 'logger', 'metrics', 'cost-tracker'][index];
          services.push({
            name: serviceName,
            status: 'critical',
            responseTime: Date.now() - startTime,
            lastCheck: timestamp,
            details: {
              available: false,
              latency: -1,
              errorRate: 100,
            },
            issues: [`Health check failed: ${result.reason}`],
          });
          criticalIssues.push(`${serviceName} health check failed`);
        }
      }

      // Calculate overall system status and score
      const { status, score } = this.calculateOverallHealth(services);

      // Check system resources
      const systemIssues = await this.checkSystemResources();
      warnings.push(...systemIssues);

      const healthStatus: SystemHealthStatus = {
        status,
        timestamp,
        uptime: process.uptime(),
        services,
        overallScore: score,
        criticalIssues,
        warnings,
      };

      // Store health check result
      this.lastHealthCheck = healthStatus;
      this.healthCheckHistory.push(healthStatus);

      // Maintain history limit
      if (this.healthCheckHistory.length > this.config.trendDataPoints) {
        this.healthCheckHistory = this.healthCheckHistory.slice(-this.config.trendDataPoints);
      }

      // Log health status
      const checkDuration = Date.now() - startTime;
      if (status === 'healthy') {
        this.logger.info(`System health check completed: ${status} (score: ${score})`, 
          { service: 'monitoring', operation: 'health_check' },
          { duration: checkDuration, servicesChecked: services.length });
      } else {
        this.logger.warn(`System health check completed: ${status} (score: ${score})`, 
          { service: 'monitoring', operation: 'health_check' },
          { 
            duration: checkDuration, 
            servicesChecked: services.length, 
            criticalIssues: criticalIssues.length,
            warnings: warnings.length 
          });
      }

      return healthStatus;

    } catch (error) {
      this.logger.error('System health check failed', 
        { service: 'monitoring', operation: 'health_check' },
        error instanceof Error ? error : new Error('Unknown error'),
        { duration: Date.now() - startTime });

      // Return critical status on health check failure
      return {
        status: 'critical',
        timestamp,
        uptime: process.uptime(),
        services: [],
        overallScore: 0,
        criticalIssues: ['System health check failed'],
        warnings: [],
      };
    }
  }

  /**
   * Check individual service health
   */
  private async checkService(
    serviceName: string,
    healthCheckFn: () => Promise<boolean> | boolean
  ): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await healthCheckFn();
      const responseTime = Date.now() - startTime;

      return {
        name: serviceName,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          available: isHealthy,
          latency: responseTime,
          errorRate: isHealthy ? 0 : 100,
        },
        issues: isHealthy ? [] : [`${serviceName} health check failed`],
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        name: serviceName,
        status: 'critical',
        responseTime,
        lastCheck: new Date(),
        details: {
          available: false,
          latency: responseTime,
          errorRate: 100,
        },
        issues: [`${serviceName} health check error: ${errorMessage}`],
      };
    }
  }

  /**
   * Calculate overall system health based on service statuses
   */
  private calculateOverallHealth(services: ServiceHealthCheck[]): { status: SystemHealthStatus['status']; score: number } {
    if (services.length === 0) {
      return { status: 'critical', score: 0 };
    }

    // Calculate weighted scores
    const scores = services.map(service => {
      switch (service.status) {
        case 'healthy': return 100;
        case 'degraded': return 75;
        case 'unhealthy': return 25;
        case 'critical': return 0;
        default: return 0;
      }
    });

    const averageScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
    
    // Determine overall status
    let status: SystemHealthStatus['status'];
    const criticalServices = services.filter(s => s.status === 'critical').length;
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
    
    if (criticalServices > 0 || averageScore < 25) {
      status = 'critical';
    } else if (unhealthyServices > 0 || averageScore < 50) {
      status = 'unhealthy';
    } else if (averageScore < 90) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return { status, score: Math.round(averageScore) };
  }

  /**
   * Check system resources for issues
   */
  private async checkSystemResources(): Promise<string[]> {
    const issues: string[] = [];

    try {
      const memUsage = process.memoryUsage();
      const budgetStatus = await this.costTracker.getBudgetStatus();

      // Check memory usage
      if (memUsage.heapUsed > this.config.criticalThresholds.memoryUsage) {
        issues.push(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }

      // Check budget usage
      if (budgetStatus.percentageUsed > this.config.criticalThresholds.budgetUsage) {
        issues.push(`Critical budget usage: ${budgetStatus.percentageUsed.toFixed(1)}%`);
      }

      // Check API performance
      const performanceSummary = this.metrics.getPerformanceSummary('1h');
      if (performanceSummary.errorRate > this.config.criticalThresholds.errorRate) {
        issues.push(`High error rate: ${performanceSummary.errorRate.toFixed(1)}%`);
      }

      if (performanceSummary.averageResponseTime > this.config.criticalThresholds.responseTime) {
        issues.push(`High response times: ${performanceSummary.averageResponseTime.toFixed(0)}ms avg`);
      }

    } catch (error) {
      issues.push(`System resource check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return issues;
  }

  /**
   * Check for alerts across all monitoring systems
   */
  private async checkAlerts(): Promise<void> {
    try {
      // Get alerts from all systems
      const [
        securityAlerts,
        metricsAlerts,
        costAlerts,
      ] = await Promise.all([
        Promise.resolve(this.securityMonitor.getActiveAlerts()),
        Promise.resolve(this.metrics.getActiveAlerts()),
        Promise.resolve(this.costTracker.getActiveAlerts()),
      ]);

      const totalAlerts = securityAlerts.length + metricsAlerts.length + costAlerts.length;

      if (totalAlerts > 0) {
        this.logger.warn(`Active alerts detected`, 
          { service: 'monitoring', operation: 'check_alerts' },
          {
            securityAlerts: securityAlerts.length,
            metricsAlerts: metricsAlerts.length,
            costAlerts: costAlerts.length,
            totalAlerts,
          });
      }

      // Check for critical conditions that require immediate attention
      const criticalAlerts = [
        ...securityAlerts.filter(a => a.severity === 'critical'),
        ...metricsAlerts.filter(a => a.triggered),
        ...costAlerts.filter(a => a.severity === 'critical'),
      ];

      if (criticalAlerts.length > 0) {
        this.logger.critical(`Critical alerts detected: ${criticalAlerts.length}`, 
          { service: 'monitoring', operation: 'check_alerts' },
          undefined,
          { criticalAlerts: criticalAlerts.length });
      }

    } catch (error) {
      this.logger.error('Alert check failed', 
        { service: 'monitoring', operation: 'check_alerts' },
        error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Update system trends data
   */
  private async updateTrends(): Promise<void> {
    try {
      const timestamp = new Date();
      const memUsage = process.memoryUsage();
      const systemMetrics = this.metrics.getSystemMetrics('1h');
      const budgetStatus = await this.costTracker.getBudgetStatus();
      const performanceSummary = this.metrics.getPerformanceSummary('1h');

      // Update trends
      this.systemTrends.cpuTrend.push({
        timestamp,
        value: systemMetrics.summary.currentCpuUsage,
      });

      this.systemTrends.memoryTrend.push({
        timestamp,
        value: memUsage.heapUsed,
      });

      this.systemTrends.requestTrend.push({
        timestamp,
        value: performanceSummary.totalRequests,
      });

      this.systemTrends.errorTrend.push({
        timestamp,
        value: performanceSummary.errorRate,
      });

      this.systemTrends.costTrend.push({
        timestamp,
        value: budgetStatus.currentSpend,
      });

      // Maintain trend data limits
      const maxPoints = this.config.trendDataPoints;
      this.systemTrends.cpuTrend = this.systemTrends.cpuTrend.slice(-maxPoints);
      this.systemTrends.memoryTrend = this.systemTrends.memoryTrend.slice(-maxPoints);
      this.systemTrends.requestTrend = this.systemTrends.requestTrend.slice(-maxPoints);
      this.systemTrends.errorTrend = this.systemTrends.errorTrend.slice(-maxPoints);
      this.systemTrends.costTrend = this.systemTrends.costTrend.slice(-maxPoints);

    } catch (error) {
      this.logger.error('Trend update failed', 
        { service: 'monitoring', operation: 'update_trends' },
        error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Get current system health status
   */
  public getCurrentHealth(): SystemHealthStatus | null {
    return this.lastHealthCheck;
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  public async getMonitoringDashboard(): Promise<MonitoringDashboardData> {
    try {
      const [
        systemHealth,
        performance,
        logs,
        budget,
        securityMetrics,
        securityEvents,
        securityAlerts,
      ] = await Promise.all([
        this.lastHealthCheck || this.performHealthCheck(),
        Promise.resolve(this.metrics.getPerformanceSummary('24h')),
        Promise.resolve(this.logger.getMetrics()),
        this.costTracker.getBudgetStatus(),
        Promise.resolve(this.securityMonitor.getMetrics()),
        Promise.resolve(this.securityMonitor.getRecentEvents(20)),
        Promise.resolve(this.securityMonitor.getActiveAlerts()),
      ]);

      // Aggregate all alerts
      const allAlerts = [
        ...securityAlerts.map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          timestamp: a.lastOccurrence,
          source: 'security',
        })),
        ...this.metrics.getActiveAlerts().map(a => ({
          id: a.id,
          type: a.metric,
          severity: a.name.includes('Critical') ? 'critical' : 
                   a.name.includes('High') ? 'high' : 'medium',
          message: a.name,
          timestamp: a.lastTriggered || new Date(),
          source: 'performance',
        })),
        ...this.costTracker.getActiveAlerts().map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          timestamp: a.timestamp,
          source: 'cost',
        })),
      ];

      const alertSummary: AlertSummary = {
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length,
        recent: allAlerts
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10),
      };

      return {
        systemHealth,
        performance,
        logs,
        budget,
        security: {
          metrics: securityMetrics,
          recentEvents: securityEvents,
          activeAlerts: securityAlerts,
        },
        alerts: alertSummary,
        trends: this.systemTrends,
      };

    } catch (error) {
      this.logger.error('Failed to get monitoring dashboard data', 
        { service: 'monitoring', operation: 'get_dashboard' },
        error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get system status summary for quick checks
   */
  public getSystemStatus(): {
    status: string;
    uptime: number;
    alerts: number;
    lastCheck: Date | null;
    score: number;
  } {
    const health = this.lastHealthCheck;
    
    return {
      status: health?.status || 'unknown',
      uptime: process.uptime(),
      alerts: health ? health.criticalIssues.length + health.warnings.length : 0,
      lastCheck: health?.timestamp || null,
      score: health?.overallScore || 0,
    };
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logger.info('Monitoring configuration updated', 
      { service: 'monitoring', operation: 'update_config' },
      { updatedFields: Object.keys(newConfig) });

    // Restart monitoring with new config if intervals changed
    if (newConfig.healthCheckInterval || newConfig.alertCheckInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get monitoring configuration
   */
  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Export monitoring data for analysis
   */
  public exportMonitoringData(startDate?: Date, endDate?: Date): {
    healthChecks: SystemHealthStatus[];
    trends: SystemTrends;
    config: MonitoringConfig;
    exportedAt: Date;
  } {
    let healthChecks = this.healthCheckHistory;

    if (startDate) {
      healthChecks = healthChecks.filter(h => h.timestamp >= startDate);
    }
    if (endDate) {
      healthChecks = healthChecks.filter(h => h.timestamp <= endDate);
    }

    return {
      healthChecks,
      trends: this.systemTrends,
      config: this.config,
      exportedAt: new Date(),
    };
  }

  /**
   * Force immediate health check
   */
  public async forceHealthCheck(): Promise<SystemHealthStatus> {
    this.logger.info('Force health check requested', 
      { service: 'monitoring', operation: 'force_health_check' });
    
    return this.performHealthCheck();
  }

  /**
   * Clear all trend data
   */
  public clearTrends(): void {
    this.systemTrends = {
      cpuTrend: [],
      memoryTrend: [],
      requestTrend: [],
      errorTrend: [],
      costTrend: [],
    };

    this.logger.info('System trends cleared', 
      { service: 'monitoring', operation: 'clear_trends' });
  }

  /**
   * Get monitoring service statistics
   */
  public getServiceStats(): {
    healthChecksPerformed: number;
    averageHealthCheckDuration: number;
    uptime: number;
    lastHealthCheckScore: number;
    monitoringActive: boolean;
  } {
    const healthChecksPerformed = this.healthCheckHistory.length;
    const lastScore = this.lastHealthCheck?.overallScore || 0;

    // Calculate average duration from recent checks (simplified)
    const recentChecks = this.healthCheckHistory.slice(-10);
    const averageHealthCheckDuration = recentChecks.length > 0 
      ? recentChecks.reduce((sum, check) => sum + (check.services.reduce((s, svc) => s + svc.responseTime, 0) / check.services.length), 0) / recentChecks.length
      : 0;

    return {
      healthChecksPerformed,
      averageHealthCheckDuration,
      uptime: process.uptime(),
      lastHealthCheckScore: lastScore,
      monitoringActive: this.healthCheckInterval !== undefined,
    };
  }
}

export default MonitoringService;