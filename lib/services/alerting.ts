/**
 * Advanced Alerting System
 * Configurable alerting with multiple channels and intelligent alert management
 */

import { Logger, LogContext } from './logger';
import { MetricsService } from './metrics';
import { CostTracker, CostAlert } from './cost-tracker';
import { SecurityMonitorService } from './security-monitor';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  source: 'performance' | 'cost' | 'security' | 'health' | 'custom';
  
  // Conditions
  conditions: AlertCondition[];
  aggregationWindow: number; // milliseconds
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  
  // Alert behavior
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  cooldownPeriod: number; // milliseconds between alerts
  maxAlerts: number; // maximum alerts per hour
  
  // Auto-resolution
  autoResolve: boolean;
  autoResolveAfter: number; // milliseconds
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface AlertCondition {
  metric: string;
  field?: string;
  value: any;
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
}

export interface AlertChannel {
  type: 'console' | 'webhook' | 'email' | 'slack' | 'gcp-monitoring';
  config: Record<string, any>;
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: AlertRule['severity'];
  source: AlertRule['source'];
  
  // Status
  status: 'active' | 'resolved' | 'suppressed';
  triggeredAt: Date;
  resolvedAt?: Date;
  
  // Context
  context: LogContext;
  metadata: Record<string, any>;
  
  // Alert data
  currentValue: number;
  threshold: number;
  operator: AlertRule['operator'];
  
  // Notification tracking
  notificationsSent: number;
  lastNotificationAt?: Date;
  channels: string[]; // Channel IDs that received this alert
}

export interface AlertingConfig {
  enabled: boolean;
  defaultCooldownPeriod: number;
  maxAlertsPerRule: number;
  maxTotalAlerts: number;
  retentionPeriod: number; // milliseconds
  channels: {
    console: boolean;
    webhook?: {
      url: string;
      headers?: Record<string, string>;
    };
    email?: {
      smtpConfig: any;
      recipients: string[];
    };
    slack?: {
      webhookUrl: string;
      channel?: string;
    };
  };
}

export interface AlertingSummary {
  totalRules: number;
  activeRules: number;
  totalAlerts: number;
  activeAlerts: number;
  alertsBySource: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  recentAlerts: Alert[];
  topRules: Array<{ ruleId: string; name: string; alertCount: number }>;
}

/**
 * Advanced alerting system with configurable rules and channels
 */
export class AlertingService {
  private static instance: AlertingService;
  
  private logger: Logger;
  private metrics: MetricsService;
  private costTracker: CostTracker;
  private securityMonitor: SecurityMonitorService;
  
  // Alert storage
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertCounts: Map<string, number> = new Map(); // Rule ID -> count in current hour
  
  // Configuration
  private config: AlertingConfig;
  
  // Monitoring intervals
  private evaluationInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.logger = Logger.getInstance();
    this.metrics = MetricsService.getInstance();
    this.costTracker = CostTracker.getInstance();
    this.securityMonitor = SecurityMonitorService.getInstance();
    
    // Default configuration
    this.config = {
      enabled: true,
      defaultCooldownPeriod: 5 * 60 * 1000, // 5 minutes
      maxAlertsPerRule: 10, // per hour
      maxTotalAlerts: 100, // total active alerts
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      channels: {
        console: true,
      },
    };

    this.initializeDefaultRules();
    this.startMonitoring();
  }

  public static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Start alert monitoring and evaluation
   */
  private startMonitoring(): void {
    if (!this.config.enabled) return;

    this.logger.info('Starting alerting service monitoring', 
      { service: 'alerting', operation: 'start_monitoring' });

    // Evaluate rules every 30 seconds
    this.evaluationInterval = setInterval(() => {
      this.evaluateRules().catch(error => {
        this.logger.error('Alert rule evaluation failed', 
          { service: 'alerting', operation: 'evaluate_rules' },
          error instanceof Error ? error : new Error('Unknown error'));
      });
    }, 30 * 1000);

    // Cleanup old alerts every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);

    // Reset hourly counters every hour
    setInterval(() => {
      this.alertCounts.clear();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop alert monitoring
   */
  public stopMonitoring(): void {
    this.logger.info('Stopping alerting service monitoring', 
      { service: 'alerting', operation: 'stop_monitoring' });

    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Add or update alert rule
   */
  public addRule(rule: Omit<AlertRule, 'createdAt' | 'updatedAt'>): string {
    const now = new Date();
    const fullRule: AlertRule = {
      ...rule,
      createdAt: now,
      updatedAt: now,
    };

    this.rules.set(rule.id, fullRule);

    this.logger.info(`Alert rule ${rule.enabled ? 'added' : 'added (disabled)'}: ${rule.name}`, 
      { service: 'alerting', operation: 'add_rule' },
      { ruleId: rule.id, source: rule.source, severity: rule.severity });

    return rule.id;
  }

  /**
   * Remove alert rule
   */
  public removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.delete(ruleId);

    // Resolve any active alerts from this rule
    for (const alert of this.alerts.values()) {
      if (alert.ruleId === ruleId && alert.status === 'active') {
        this.resolveAlert(alert.id, 'Rule removed');
      }
    }

    this.logger.info(`Alert rule removed: ${rule.name}`, 
      { service: 'alerting', operation: 'remove_rule' },
      { ruleId, source: rule.source });

    return true;
  }

  /**
   * Enable or disable alert rule
   */
  public toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled;
    rule.updatedAt = new Date();

    this.logger.info(`Alert rule ${enabled ? 'enabled' : 'disabled'}: ${rule.name}`, 
      { service: 'alerting', operation: 'toggle_rule' },
      { ruleId, source: rule.source });

    return true;
  }

  /**
   * Get all alert rules
   */
  public getRules(): AlertRule[] {
    return Array.from(this.rules.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active')
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Get all alerts with optional filtering
   */
  public getAlerts(options: {
    status?: Alert['status'];
    source?: AlertRule['source'];
    severity?: AlertRule['severity'];
    limit?: number;
    offset?: number;
  } = {}): Alert[] {
    let alerts = Array.from(this.alerts.values());

    // Apply filters
    if (options.status) {
      alerts = alerts.filter(alert => alert.status === options.status);
    }
    if (options.source) {
      alerts = alerts.filter(alert => alert.source === options.source);
    }
    if (options.severity) {
      alerts = alerts.filter(alert => alert.severity === options.severity);
    }

    // Sort by triggered date (newest first)
    alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || alerts.length;
    
    return alerts.slice(offset, offset + limit);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string, reason?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    this.logger.info(`Alert resolved: ${alert.title}`, 
      { service: 'alerting', operation: 'resolve_alert', correlationId: alert.context.correlationId },
      { alertId, ruleId: alert.ruleId, reason, duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime() });

    // Send resolution notification
    this.sendNotification(alert, 'resolved', reason);

    return true;
  }

  /**
   * Suppress an alert
   */
  public suppressAlert(alertId: string, reason?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') return false;

    alert.status = 'suppressed';

    this.logger.info(`Alert suppressed: ${alert.title}`, 
      { service: 'alerting', operation: 'suppress_alert', correlationId: alert.context.correlationId },
      { alertId, ruleId: alert.ruleId, reason });

    return true;
  }

  /**
   * Update alerting configuration
   */
  public updateConfig(newConfig: Partial<AlertingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    this.logger.info('Alerting configuration updated', 
      { service: 'alerting', operation: 'update_config' },
      { updatedFields: Object.keys(newConfig) });

    // Restart monitoring if enabled status changed
    if (newConfig.enabled !== undefined) {
      this.stopMonitoring();
      if (newConfig.enabled) {
        this.startMonitoring();
      }
    }
  }

  /**
   * Get alerting configuration
   */
  public getConfig(): AlertingConfig {
    return { ...this.config };
  }

  /**
   * Get alerting summary
   */
  public getSummary(): AlertingSummary {
    const rules = Array.from(this.rules.values());
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(alert => alert.status === 'active');

    // Count alerts by source
    const alertsBySource: Record<string, number> = {};
    for (const alert of activeAlerts) {
      alertsBySource[alert.source] = (alertsBySource[alert.source] || 0) + 1;
    }

    // Count alerts by severity
    const alertsBySeverity: Record<string, number> = {};
    for (const alert of activeAlerts) {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    }

    // Top rules by alert count
    const ruleCounts: Record<string, { name: string; count: number }> = {};
    for (const alert of alerts) {
      const rule = this.rules.get(alert.ruleId);
      if (rule) {
        if (!ruleCounts[alert.ruleId]) {
          ruleCounts[alert.ruleId] = { name: rule.name, count: 0 };
        }
        ruleCounts[alert.ruleId].count++;
      }
    }

    const topRules = Object.entries(ruleCounts)
      .map(([ruleId, data]) => ({ ruleId, name: data.name, alertCount: data.count }))
      .sort((a, b) => b.alertCount - a.alertCount)
      .slice(0, 10);

    return {
      totalRules: rules.length,
      activeRules: rules.filter(rule => rule.enabled).length,
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      alertsBySource,
      alertsBySeverity,
      recentAlerts: alerts.slice(0, 20),
      topRules,
    };
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: Array<Omit<AlertRule, 'createdAt' | 'updatedAt'>> = [
      {
        id: 'high-error-rate',
        name: 'High API Error Rate',
        description: 'Alert when API error rate exceeds 5% over 5 minutes',
        enabled: true,
        source: 'performance',
        conditions: [
          { metric: 'api_error_rate', aggregation: 'avg', value: 0 }
        ],
        aggregationWindow: 5 * 60 * 1000, // 5 minutes
        threshold: 5,
        operator: 'gt',
        severity: 'high',
        channels: [{ type: 'console', config: {}, enabled: true }],
        cooldownPeriod: 10 * 60 * 1000, // 10 minutes
        maxAlerts: 5,
        autoResolve: true,
        autoResolveAfter: 15 * 60 * 1000, // 15 minutes
        tags: ['performance', 'api'],
      },
      {
        id: 'slow-response-time',
        name: 'Slow API Response Time',
        description: 'Alert when average response time exceeds 10 seconds',
        enabled: true,
        source: 'performance',
        conditions: [
          { metric: 'api_response_time', aggregation: 'avg', value: 0 }
        ],
        aggregationWindow: 5 * 60 * 1000,
        threshold: 10000, // 10 seconds in ms
        operator: 'gt',
        severity: 'medium',
        channels: [{ type: 'console', config: {}, enabled: true }],
        cooldownPeriod: 5 * 60 * 1000,
        maxAlerts: 10,
        autoResolve: true,
        autoResolveAfter: 10 * 60 * 1000,
        tags: ['performance', 'latency'],
      },
      {
        id: 'budget-exceeded',
        name: 'Budget Threshold Exceeded',
        description: 'Alert when budget usage exceeds 90%',
        enabled: true,
        source: 'cost',
        conditions: [
          { metric: 'budget_usage_percent', value: 0 }
        ],
        aggregationWindow: 60 * 1000, // 1 minute
        threshold: 90,
        operator: 'gte',
        severity: 'critical',
        channels: [{ type: 'console', config: {}, enabled: true }],
        cooldownPeriod: 30 * 60 * 1000, // 30 minutes
        maxAlerts: 3,
        autoResolve: false, // Manual resolution required
        autoResolveAfter: 0,
        tags: ['cost', 'budget'],
      },
      {
        id: 'security-critical-events',
        name: 'Critical Security Events',
        description: 'Alert on critical security events',
        enabled: true,
        source: 'security',
        conditions: [
          { metric: 'security_events', field: 'severity', value: 'critical' }
        ],
        aggregationWindow: 60 * 1000,
        threshold: 1,
        operator: 'gte',
        severity: 'critical',
        channels: [{ type: 'console', config: {}, enabled: true }],
        cooldownPeriod: 0, // No cooldown for critical security events
        maxAlerts: 50,
        autoResolve: false,
        autoResolveAfter: 0,
        tags: ['security', 'critical'],
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Alert when memory usage exceeds 80%',
        enabled: true,
        source: 'performance',
        conditions: [
          { metric: 'memory_usage_percent', value: 0 }
        ],
        aggregationWindow: 2 * 60 * 1000, // 2 minutes
        threshold: 80,
        operator: 'gt',
        severity: 'medium',
        channels: [{ type: 'console', config: {}, enabled: true }],
        cooldownPeriod: 10 * 60 * 1000,
        maxAlerts: 5,
        autoResolve: true,
        autoResolveAfter: 5 * 60 * 1000,
        tags: ['performance', 'memory'],
      },
    ];

    for (const rule of defaultRules) {
      this.addRule(rule);
    }

    this.logger.info(`Initialized ${defaultRules.length} default alert rules`, 
      { service: 'alerting', operation: 'initialize_rules' });
  }

  /**
   * Evaluate all enabled alert rules
   */
  private async evaluateRules(): Promise<void> {
    if (!this.config.enabled) return;

    const enabledRules = Array.from(this.rules.values()).filter(rule => rule.enabled);
    
    for (const rule of enabledRules) {
      try {
        await this.evaluateRule(rule);
      } catch (error) {
        this.logger.error(`Failed to evaluate alert rule: ${rule.name}`, 
          { service: 'alerting', operation: 'evaluate_rule' },
          error instanceof Error ? error : new Error('Unknown error'),
          { ruleId: rule.id, source: rule.source });
      }
    }
  }

  /**
   * Evaluate a specific alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Check if we've exceeded max alerts for this rule
    const alertCount = this.alertCounts.get(rule.id) || 0;
    if (alertCount >= rule.maxAlerts) {
      return; // Skip evaluation
    }

    // Get current value based on rule source and conditions
    const currentValue = await this.getCurrentValue(rule);
    if (currentValue === null) return; // Skip if value unavailable

    // Check if condition is met
    const conditionMet = this.evaluateCondition(currentValue, rule.threshold, rule.operator);
    
    // Check if there's already an active alert for this rule
    const existingAlert = Array.from(this.alerts.values())
      .find(alert => alert.ruleId === rule.id && alert.status === 'active');

    if (conditionMet) {
      if (!existingAlert) {
        // Create new alert
        await this.createAlert(rule, currentValue);
      } else {
        // Update existing alert
        existingAlert.currentValue = currentValue;
        existingAlert.metadata.lastEvaluated = new Date();
      }
    } else if (existingAlert && rule.autoResolve) {
      // Auto-resolve if condition is no longer met
      const alertAge = Date.now() - existingAlert.triggeredAt.getTime();
      if (alertAge >= rule.autoResolveAfter) {
        this.resolveAlert(existingAlert.id, 'Auto-resolved: condition no longer met');
      }
    }
  }

  /**
   * Get current value for alert rule evaluation
   */
  private async getCurrentValue(rule: AlertRule): Promise<number | null> {
    try {
      switch (rule.source) {
        case 'performance':
          return await this.getPerformanceMetricValue(rule);
          
        case 'cost':
          return await this.getCostMetricValue(rule);
          
        case 'security':
          return await this.getSecurityMetricValue(rule);
          
        case 'health':
          return await this.getHealthMetricValue(rule);
          
        default:
          return null;
      }
    } catch (error) {
      this.logger.error(`Failed to get current value for rule: ${rule.name}`, 
        { service: 'alerting', operation: 'get_current_value' },
        error instanceof Error ? error : new Error('Unknown error'),
        { ruleId: rule.id, source: rule.source });
      return null;
    }
  }

  /**
   * Get performance metric value
   */
  private async getPerformanceMetricValue(rule: AlertRule): Promise<number | null> {
    const timeRange = Math.ceil(rule.aggregationWindow / (60 * 1000)) + 'm'; // Convert to minutes
    const summary = this.metrics.getPerformanceSummary(timeRange);
    
    const condition = rule.conditions[0];
    switch (condition.metric) {
      case 'api_error_rate':
        return summary.errorRate;
      case 'api_response_time':
        return summary.averageResponseTime;
      case 'memory_usage_percent':
        const memUsage = process.memoryUsage();
        return (memUsage.heapUsed / memUsage.heapTotal) * 100;
      default:
        return null;
    }
  }

  /**
   * Get cost metric value
   */
  private async getCostMetricValue(rule: AlertRule): Promise<number | null> {
    const budgetStatus = await this.costTracker.getBudgetStatus();
    
    const condition = rule.conditions[0];
    switch (condition.metric) {
      case 'budget_usage_percent':
        return budgetStatus.percentageUsed;
      case 'current_spend':
        return budgetStatus.currentSpend;
      default:
        return null;
    }
  }

  /**
   * Get security metric value
   */
  private async getSecurityMetricValue(rule: AlertRule): Promise<number | null> {
    const metrics = this.securityMonitor.getMetrics();
    
    const condition = rule.conditions[0];
    switch (condition.metric) {
      case 'security_events':
        if (condition.field === 'severity' && condition.value === 'critical') {
          return metrics.eventsBySeverity.critical;
        }
        return metrics.eventsLastHour;
      default:
        return null;
    }
  }

  /**
   * Get health metric value
   */
  private async getHealthMetricValue(rule: AlertRule): Promise<number | null> {
    // This would integrate with MonitoringService health checks
    // For now, return a placeholder
    return null;
  }

  /**
   * Evaluate condition against current value
   */
  private evaluateCondition(currentValue: number, threshold: number, operator: AlertRule['operator']): boolean {
    switch (operator) {
      case 'gt': return currentValue > threshold;
      case 'gte': return currentValue >= threshold;
      case 'lt': return currentValue < threshold;
      case 'lte': return currentValue <= threshold;
      case 'eq': return currentValue === threshold;
      default: return false;
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(rule: AlertRule, currentValue: number): Promise<void> {
    // Check cooldown period
    const lastAlert = Array.from(this.alerts.values())
      .filter(alert => alert.ruleId === rule.id)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())[0];

    if (lastAlert && Date.now() - lastAlert.triggeredAt.getTime() < rule.cooldownPeriod) {
      return; // Still in cooldown period
    }

    // Check total alert limits
    const totalActiveAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active').length;
    
    if (totalActiveAlerts >= this.config.maxTotalAlerts) {
      this.logger.warn('Maximum total alerts reached, skipping new alert', 
        { service: 'alerting', operation: 'create_alert' },
        { maxAlerts: this.config.maxTotalAlerts, ruleId: rule.id });
      return;
    }

    const correlationId = this.logger.generateCorrelationId();
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      ruleId: rule.id,
      title: rule.name,
      message: this.generateAlertMessage(rule, currentValue),
      severity: rule.severity,
      source: rule.source,
      status: 'active',
      triggeredAt: new Date(),
      context: { correlationId, service: 'alerting' },
      metadata: {
        rule: rule.name,
        conditions: rule.conditions,
        evaluatedAt: new Date(),
      },
      currentValue,
      threshold: rule.threshold,
      operator: rule.operator,
      notificationsSent: 0,
      channels: [],
    };

    this.alerts.set(alert.id, alert);

    // Update alert count for this rule
    this.alertCounts.set(rule.id, (this.alertCounts.get(rule.id) || 0) + 1);

    this.logger.warn(`Alert triggered: ${alert.title}`, 
      { service: 'alerting', operation: 'create_alert', correlationId },
      { 
        alertId: alert.id, 
        ruleId: rule.id, 
        currentValue, 
        threshold: rule.threshold,
        severity: rule.severity,
        source: rule.source 
      });

    // Send notifications
    await this.sendNotification(alert, 'triggered');
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const operatorText = {
      'gt': 'is greater than',
      'gte': 'is greater than or equal to',
      'lt': 'is less than',
      'lte': 'is less than or equal to',
      'eq': 'equals',
      'contains': 'contains',
    };

    return `${rule.description} - Current value: ${currentValue}, ${operatorText[rule.operator]} threshold: ${rule.threshold}`;
  }

  /**
   * Send alert notification through configured channels
   */
  private async sendNotification(alert: Alert, type: 'triggered' | 'resolved', reason?: string): Promise<void> {
    const rule = this.rules.get(alert.ruleId);
    if (!rule) return;

    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendChannelNotification(alert, channel, type, reason);
        
        if (type === 'triggered') {
          alert.notificationsSent++;
          alert.lastNotificationAt = new Date();
          alert.channels.push(channel.type);
        }

      } catch (error) {
        this.logger.error(`Failed to send alert notification via ${channel.type}`, 
          { service: 'alerting', operation: 'send_notification', correlationId: alert.context.correlationId },
          error instanceof Error ? error : new Error('Unknown error'),
          { alertId: alert.id, channelType: channel.type });
      }
    }
  }

  /**
   * Send notification through specific channel
   */
  private async sendChannelNotification(
    alert: Alert,
    channel: AlertChannel,
    type: 'triggered' | 'resolved',
    reason?: string
  ): Promise<void> {
    switch (channel.type) {
      case 'console':
        this.sendConsoleNotification(alert, type, reason);
        break;
        
      case 'webhook':
        await this.sendWebhookNotification(alert, channel, type, reason);
        break;
        
      // Additional channel types can be implemented here
      default:
        this.logger.warn(`Unsupported notification channel: ${channel.type}`, 
          { service: 'alerting', operation: 'send_channel_notification' });
    }
  }

  /**
   * Send console notification
   */
  private sendConsoleNotification(alert: Alert, type: 'triggered' | 'resolved', reason?: string): void {
    const emoji = {
      low: '📝',
      medium: '⚠️',
      high: '❌',
      critical: '🚨',
    };

    const message = type === 'resolved' 
      ? `${emoji[alert.severity]} Alert RESOLVED: ${alert.title}${reason ? ` (${reason})` : ''}`
      : `${emoji[alert.severity]} Alert ${type.toUpperCase()}: ${alert.message}`;

    if (alert.severity === 'critical' || alert.severity === 'high') {
      console.error(message);
    } else {
      console.warn(message);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    alert: Alert,
    channel: AlertChannel,
    type: 'triggered' | 'resolved',
    reason?: string
  ): Promise<void> {
    const webhookUrl = channel.config.url;
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      type,
      alert: {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        source: alert.source,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        triggeredAt: alert.triggeredAt,
        resolvedAt: alert.resolvedAt,
        reason,
      },
      metadata: alert.metadata,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...channel.config.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Clean up old alerts and resolved alerts
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.config.retentionPeriod;
    const alertsToDelete: string[] = [];

    for (const [id, alert] of this.alerts.entries()) {
      // Delete old resolved alerts
      if (alert.status === 'resolved' && alert.resolvedAt && alert.resolvedAt.getTime() < cutoff) {
        alertsToDelete.push(id);
      }
      // Auto-resolve old active alerts if configured
      else if (alert.status === 'active') {
        const rule = this.rules.get(alert.ruleId);
        if (rule && rule.autoResolve && rule.autoResolveAfter > 0) {
          const alertAge = now - alert.triggeredAt.getTime();
          if (alertAge >= rule.autoResolveAfter) {
            this.resolveAlert(alert.id, 'Auto-resolved: timeout');
          }
        }
      }
    }

    // Clean up old alerts
    for (const id of alertsToDelete) {
      this.alerts.delete(id);
    }

    if (alertsToDelete.length > 0) {
      this.logger.info(`Alerting cleanup: removed ${alertsToDelete.length} old alerts`, 
        { service: 'alerting', operation: 'cleanup' });
    }
  }

  /**
   * Health check for alerting service
   */
  public healthCheck(): boolean {
    try {
      // Check if monitoring is running
      const monitoringActive = this.evaluationInterval !== undefined;
      
      // Check if we can access dependencies
      const canAccessLogger = this.logger.healthCheck();
      
      return this.config.enabled && monitoringActive && canAccessLogger;
    } catch (error) {
      this.logger.error('Alerting service health check failed', 
        { service: 'alerting', operation: 'health_check' },
        error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    enabled: boolean;
    totalRules: number;
    activeRules: number;
    totalAlerts: number;
    activeAlerts: number;
    notificationsSent: number;
    evaluationInterval: number | null;
  } {
    const rules = Array.from(this.rules.values());
    const alerts = Array.from(this.alerts.values());
    const totalNotifications = alerts.reduce((sum, alert) => sum + alert.notificationsSent, 0);

    return {
      enabled: this.config.enabled,
      totalRules: rules.length,
      activeRules: rules.filter(rule => rule.enabled).length,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(alert => alert.status === 'active').length,
      notificationsSent: totalNotifications,
      evaluationInterval: this.evaluationInterval ? 30000 : null,
    };
  }
}

export default AlertingService;