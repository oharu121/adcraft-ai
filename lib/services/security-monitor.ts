/**
 * Security Monitoring Service
 * Tracks security events, anomalies, and provides alerting capabilities
 */

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  source: string; // IP address or client identifier
  details: Record<string, any>;
  userAgent?: string;
  endpoint?: string;
}

type SecurityEventType = 
  | 'rate_limit_exceeded'
  | 'malicious_input_detected'
  | 'suspicious_file_upload'
  | 'content_policy_violation'
  | 'repeated_failures'
  | 'unusual_access_pattern'
  | 'injection_attempt'
  | 'xss_attempt'
  | 'brute_force_attempt';

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<SecuritySeverity, number>;
  eventsByType: Record<SecurityEventType, number>;
  uniqueSourcesCount: number;
  eventsLast24h: number;
  eventsLastHour: number;
}

interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  count: number;
  sources: string[];
  firstOccurrence: Date;
  lastOccurrence: Date;
  resolved: boolean;
}

export class SecurityMonitorService {
  private static instance: SecurityMonitorService;
  private events: Map<string, SecurityEvent> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private suspiciousSources: Map<string, number> = new Map();
  
  // Alert thresholds
  private readonly alertThresholds: Partial<Record<SecurityEventType, { count: number; timeWindow: number }>> = {
    rate_limit_exceeded: { count: 5, timeWindow: 5 * 60 * 1000 }, // 5 in 5 minutes
    malicious_input_detected: { count: 3, timeWindow: 10 * 60 * 1000 }, // 3 in 10 minutes
    content_policy_violation: { count: 2, timeWindow: 15 * 60 * 1000 }, // 2 in 15 minutes
    repeated_failures: { count: 10, timeWindow: 5 * 60 * 1000 }, // 10 in 5 minutes
    injection_attempt: { count: 1, timeWindow: 0 }, // Immediate alert
    xss_attempt: { count: 1, timeWindow: 0 }, // Immediate alert
    suspicious_file_upload: { count: 3, timeWindow: 10 * 60 * 1000 }, // 3 in 10 minutes
    unusual_access_pattern: { count: 5, timeWindow: 15 * 60 * 1000 }, // 5 in 15 minutes
    brute_force_attempt: { count: 10, timeWindow: 5 * 60 * 1000 }, // 10 in 5 minutes
  };

  private constructor() {
    // Cleanup old events every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
    
    // Check for alerts every minute
    setInterval(() => this.checkForAlerts(), 60 * 1000);
  }

  public static getInstance(): SecurityMonitorService {
    if (!SecurityMonitorService.instance) {
      SecurityMonitorService.instance = new SecurityMonitorService();
    }
    return SecurityMonitorService.instance;
  }

  /**
   * Log a security event
   */
  public logEvent(
    type: SecurityEventType,
    source: string,
    details: Record<string, any> = {},
    severity: SecuritySeverity = 'medium',
    endpoint?: string,
    userAgent?: string
  ): void {
    const event: SecurityEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      type,
      severity,
      timestamp: new Date(),
      source,
      details,
      userAgent,
      endpoint,
    };

    this.events.set(event.id, event);

    // Track suspicious sources
    this.trackSuspiciousSource(source, severity);

    // Log to console for immediate visibility
    this.logToConsole(event);

    // Check if this event should trigger an alert
    this.evaluateForAlert(event);
  }

  /**
   * Log rate limiting violation
   */
  public logRateLimitExceeded(
    source: string,
    endpoint: string,
    details: Record<string, any> = {}
  ): void {
    this.logEvent(
      'rate_limit_exceeded',
      source,
      {
        ...details,
        endpoint,
        message: `Rate limit exceeded for endpoint: ${endpoint}`,
      },
      'medium',
      endpoint
    );
  }

  /**
   * Log malicious input detection
   */
  public logMaliciousInput(
    source: string,
    input: string,
    violation: string,
    endpoint?: string
  ): void {
    this.logEvent(
      'malicious_input_detected',
      source,
      {
        input: input.substring(0, 200), // Truncate for logging
        violation,
        inputLength: input.length,
      },
      'high',
      endpoint
    );
  }

  /**
   * Log content policy violation
   */
  public logContentPolicyViolation(
    source: string,
    content: string,
    violations: string[],
    endpoint?: string
  ): void {
    this.logEvent(
      'content_policy_violation',
      source,
      {
        content: content.substring(0, 200),
        violations,
        contentLength: content.length,
      },
      'high',
      endpoint
    );
  }

  /**
   * Log XSS attempt
   */
  public logXSSAttempt(
    source: string,
    payload: string,
    endpoint?: string,
    userAgent?: string
  ): void {
    this.logEvent(
      'xss_attempt',
      source,
      {
        payload: payload.substring(0, 200),
        payloadLength: payload.length,
      },
      'critical',
      endpoint,
      userAgent
    );
  }

  /**
   * Log injection attempt
   */
  public logInjectionAttempt(
    source: string,
    payload: string,
    injectionType: string,
    endpoint?: string
  ): void {
    this.logEvent(
      'injection_attempt',
      source,
      {
        payload: payload.substring(0, 200),
        injectionType,
        payloadLength: payload.length,
      },
      'critical',
      endpoint
    );
  }

  /**
   * Log suspicious file upload
   */
  public logSuspiciousFileUpload(
    source: string,
    fileName: string,
    fileType: string,
    reason: string,
    endpoint?: string
  ): void {
    this.logEvent(
      'suspicious_file_upload',
      source,
      {
        fileName,
        fileType,
        reason,
      },
      'medium',
      endpoint
    );
  }

  /**
   * Get security metrics
   */
  public getMetrics(): SecurityMetrics {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const lastHour = now - 60 * 60 * 1000;

    const metrics: SecurityMetrics = {
      totalEvents: this.events.size,
      eventsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      eventsByType: {} as Record<SecurityEventType, number>,
      uniqueSourcesCount: 0,
      eventsLast24h: 0,
      eventsLastHour: 0,
    };

    const uniqueSources = new Set<string>();

    for (const event of this.events.values()) {
      metrics.eventsBySeverity[event.severity]++;
      metrics.eventsByType[event.type] = (metrics.eventsByType[event.type] || 0) + 1;
      uniqueSources.add(event.source);

      const eventTime = event.timestamp.getTime();
      if (eventTime >= last24h) {
        metrics.eventsLast24h++;
      }
      if (eventTime >= lastHour) {
        metrics.eventsLastHour++;
      }
    }

    metrics.uniqueSourcesCount = uniqueSources.size;
    return metrics;
  }

  /**
   * Get recent security events
   */
  public getRecentEvents(count: number = 50, severity?: SecuritySeverity): SecurityEvent[] {
    const events = Array.from(this.events.values());
    
    const filteredEvents = severity 
      ? events.filter(event => event.severity === severity)
      : events;

    return filteredEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  /**
   * Get active security alerts
   */
  public getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime());
  }

  /**
   * Get all security alerts
   */
  public getAllAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime());
  }

  /**
   * Resolve a security alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Check if a source is suspicious
   */
  public isSuspiciousSource(source: string): boolean {
    const suspiciousScore = this.suspiciousSources.get(source) || 0;
    return suspiciousScore > 10; // Threshold for suspicious activity
  }

  /**
   * Get top suspicious sources
   */
  public getTopSuspiciousSources(count: number = 10): Array<{ source: string; score: number }> {
    return Array.from(this.suspiciousSources.entries())
      .map(([source, score]) => ({ source, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * Export security report
   */
  public exportSecurityReport(): {
    generatedAt: Date;
    metrics: SecurityMetrics;
    recentEvents: SecurityEvent[];
    activeAlerts: SecurityAlert[];
    suspiciousSources: Array<{ source: string; score: number }>;
  } {
    return {
      generatedAt: new Date(),
      metrics: this.getMetrics(),
      recentEvents: this.getRecentEvents(100),
      activeAlerts: this.getActiveAlerts(),
      suspiciousSources: this.getTopSuspiciousSources(20),
    };
  }

  /**
   * Track suspicious source activity
   */
  private trackSuspiciousSource(source: string, severity: SecuritySeverity): void {
    const currentScore = this.suspiciousSources.get(source) || 0;
    
    const severityScores = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15,
    };

    const newScore = currentScore + severityScores[severity];
    this.suspiciousSources.set(source, newScore);
  }

  /**
   * Log event to console with proper formatting
   */
  private logToConsole(event: SecurityEvent): void {
    const timestamp = event.timestamp.toISOString();
    const prefix = event.severity === 'critical' ? '🚨' : 
                  event.severity === 'high' ? '⚠️' : 
                  event.severity === 'medium' ? '🔍' : '📝';
    
    console.log(
      `${prefix} [SECURITY] ${timestamp} - ${event.type.toUpperCase()} from ${event.source}`,
      event.details
    );
  }

  /**
   * Evaluate if an event should trigger an alert
   */
  private evaluateForAlert(event: SecurityEvent): void {
    const threshold = this.alertThresholds[event.type];
    if (!threshold) return;

    const timeWindow = threshold.timeWindow;
    const countThreshold = threshold.count;
    const now = Date.now();
    const windowStart = now - timeWindow;

    // Count recent events of the same type
    const recentEvents = Array.from(this.events.values())
      .filter(e => 
        e.type === event.type && 
        e.timestamp.getTime() >= windowStart &&
        e.source === event.source
      );

    if (recentEvents.length >= countThreshold) {
      this.createOrUpdateAlert(event, recentEvents);
    }
  }

  /**
   * Create or update a security alert
   */
  private createOrUpdateAlert(event: SecurityEvent, relatedEvents: SecurityEvent[]): void {
    const alertKey = `${event.type}-${event.source}`;
    const existingAlert = this.alerts.get(alertKey);

    if (existingAlert && !existingAlert.resolved) {
      // Update existing alert
      existingAlert.count = relatedEvents.length;
      existingAlert.lastOccurrence = event.timestamp;
    } else {
      // Create new alert
      const alert: SecurityAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        type: event.type,
        severity: this.getAlertSeverity(event.type, relatedEvents.length),
        message: this.generateAlertMessage(event.type, event.source, relatedEvents.length),
        count: relatedEvents.length,
        sources: [event.source],
        firstOccurrence: relatedEvents[0].timestamp,
        lastOccurrence: event.timestamp,
        resolved: false,
      };

      this.alerts.set(alertKey, alert);
      
      console.error(`🚨 SECURITY ALERT: ${alert.message}`);
    }
  }

  /**
   * Determine alert severity based on event type and frequency
   */
  private getAlertSeverity(eventType: SecurityEventType, count: number): SecuritySeverity {
    if (['injection_attempt', 'xss_attempt'].includes(eventType)) {
      return 'critical';
    }
    if (['malicious_input_detected', 'content_policy_violation'].includes(eventType)) {
      return count > 5 ? 'critical' : 'high';
    }
    if (count > 20) return 'high';
    if (count > 10) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable alert message
   */
  private generateAlertMessage(
    eventType: SecurityEventType,
    source: string,
    count: number
  ): string {
    const messages = {
      rate_limit_exceeded: `Rate limiting violations from ${source} (${count} occurrences)`,
      malicious_input_detected: `Malicious input attempts from ${source} (${count} occurrences)`,
      content_policy_violation: `Content policy violations from ${source} (${count} occurrences)`,
      injection_attempt: `Injection attack attempts from ${source} (${count} occurrences)`,
      xss_attempt: `XSS attack attempts from ${source} (${count} occurrences)`,
      suspicious_file_upload: `Suspicious file uploads from ${source} (${count} occurrences)`,
      repeated_failures: `Repeated failures from ${source} (${count} occurrences)`,
      unusual_access_pattern: `Unusual access patterns from ${source} (${count} occurrences)`,
      brute_force_attempt: `Brute force attempts from ${source} (${count} occurrences)`,
    };

    return messages[eventType] || `Security events of type ${eventType} from ${source}`;
  }

  /**
   * Check for new alerts based on recent activity
   */
  private checkForAlerts(): void {
    // This runs periodically to check for alert conditions
    // Implementation could include pattern detection, anomaly detection, etc.
  }

  /**
   * Clean up old events and alerts
   */
  private cleanup(): void {
    const now = Date.now();
    const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = now - retentionPeriod;

    // Clean up old events
    const eventsToDelete: string[] = [];
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp.getTime() < cutoff) {
        eventsToDelete.push(id);
      }
    }

    for (const id of eventsToDelete) {
      this.events.delete(id);
    }

    // Clean up resolved alerts older than 24 hours
    const alertCutoff = now - 24 * 60 * 60 * 1000;
    const alertsToDelete: string[] = [];
    
    for (const [key, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.lastOccurrence.getTime() < alertCutoff) {
        alertsToDelete.push(key);
      }
    }

    for (const key of alertsToDelete) {
      this.alerts.delete(key);
    }

    // Clean up suspicious sources (decay scores over time)
    for (const [source, score] of this.suspiciousSources.entries()) {
      const decayedScore = Math.max(0, score - 1); // Decay by 1 per hour
      if (decayedScore === 0) {
        this.suspiciousSources.delete(source);
      } else {
        this.suspiciousSources.set(source, decayedScore);
      }
    }

    if (eventsToDelete.length > 0 || alertsToDelete.length > 0) {
      console.log(`Security monitor cleanup: removed ${eventsToDelete.length} events, ${alertsToDelete.length} alerts`);
    }
  }
}

export default SecurityMonitorService;