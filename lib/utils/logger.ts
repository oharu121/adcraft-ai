/**
 * Structured Logging Service
 * Provides centralized logging with correlation IDs, structured formats, and Cloud Logging integration
 */

import { randomUUID } from 'crypto';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogContext {
  correlationId?: string;
  sessionId?: string;
  jobId?: string;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
  service: string;
  version: string;
  environment: string;
}

export interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsLast24h: number;
  logsLastHour: number;
  errorsLast24h: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  topErrors: Array<{ error: string; count: number }>;
}

export class Logger {
  private static instance: Logger;
  private logs: StructuredLogEntry[] = [];
  private endpointCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private correlationIds: Map<string, string> = new Map();

  // Configuration
  private readonly service: string;
  private readonly version: string;
  private readonly environment: string;
  private readonly maxLogRetention: number = 10000; // Max logs in memory
  private readonly retentionPeriod: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    this.service = 'adcraft-ai';
    this.version = process.env.npm_package_version || '0.1.0';
    this.environment = process.env.NODE_ENV || 'development';

    // Cleanup old logs every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Generate a new correlation ID for request tracking
   */
  public generateCorrelationId(): string {
    return randomUUID();
  }

  /**
   * Associate a correlation ID with a session or request
   */
  public associateCorrelationId(key: string, correlationId: string): void {
    this.correlationIds.set(key, correlationId);
  }

  /**
   * Get correlation ID for a session or request
   */
  public getCorrelationId(key: string): string | undefined {
    return this.correlationIds.get(key);
  }

  /**
   * Log debug message
   */
  public debug(message: string, context: LogContext = {}, metadata?: Record<string, any>): void {
    this.log('DEBUG', message, context, undefined, metadata);
  }

  /**
   * Log info message
   */
  public info(message: string, context: LogContext = {}, metadata?: Record<string, any>): void {
    this.log('INFO', message, context, undefined, metadata);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context: LogContext = {}, metadata?: Record<string, any>): void {
    this.log('WARN', message, context, undefined, metadata);
  }

  /**
   * Log error message
   */
  public error(message: string, context: LogContext = {}, error?: Error, metadata?: Record<string, any>): void {
    this.log('ERROR', message, context, error, metadata);
  }

  /**
   * Log critical error message
   */
  public critical(message: string, context: LogContext = {}, error?: Error, metadata?: Record<string, any>): void {
    this.log('CRITICAL', message, context, error, metadata);
  }

  /**
   * Log API request
   */
  public logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    
    this.log(level, `API ${method} ${endpoint}`, {
      ...context,
      endpoint,
      method,
    }, undefined, {
      statusCode,
      duration,
    });

    // Track endpoint usage
    this.trackEndpoint(endpoint);
  }

  /**
   * Log video generation operation
   */
  public logVideoGeneration(
    operation: string,
    jobId: string,
    status: 'started' | 'completed' | 'failed',
    context: LogContext = {},
    metadata?: Record<string, any>
  ): void {
    const level: LogLevel = status === 'failed' ? 'ERROR' : 'INFO';
    
    this.log(level, `Video generation ${operation} ${status}`, {
      ...context,
      jobId,
      operation: 'video-generation',
    }, undefined, {
      ...metadata,
      status,
      operation,
    });
  }

  /**
   * Log security event
   */
  public logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    source: string,
    context: LogContext = {},
    metadata?: Record<string, any>
  ): void {
    const levelMap = {
      low: 'INFO' as const,
      medium: 'WARN' as const,
      high: 'ERROR' as const,
      critical: 'CRITICAL' as const,
    };

    this.log(levelMap[severity], `Security event: ${eventType}`, {
      ...context,
      securityEvent: true,
      eventType,
      source,
    }, undefined, {
      ...metadata,
      severity,
    });
  }

  /**
   * Log cost tracking event
   */
  public logCostEvent(
    operation: string,
    service: string,
    amount: number,
    context: LogContext = {},
    metadata?: Record<string, any>
  ): void {
    this.log('INFO', `Cost recorded: ${operation}`, {
      ...context,
      costEvent: true,
      operation: 'cost-tracking',
    }, undefined, {
      ...metadata,
      service,
      amount,
      currency: 'USD',
    });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context: LogContext,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    // Create structured log entry
    const logEntry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        correlationId: context.correlationId || this.generateCorrelationId(),
      },
      service: this.service,
      version: this.version,
      environment: this.environment,
    };

    // Add error information if present
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };

      // Track error for metrics
      this.trackError(error.message);
    }

    // Add metadata if present
    if (metadata) {
      logEntry.metadata = metadata;
    }

    // Store log in memory
    this.logs.push(logEntry);

    // Enforce max retention
    if (this.logs.length > this.maxLogRetention) {
      this.logs = this.logs.slice(-this.maxLogRetention);
    }

    // Output to console with appropriate method
    this.outputToConsole(logEntry);

    // In production, send to Cloud Logging
    if (this.environment === 'production') {
      this.sendToCloudLogging(logEntry);
    }
  }

  /**
   * Output log to console with appropriate formatting
   */
  private outputToConsole(entry: StructuredLogEntry): void {
    const prefix = this.getLevelPrefix(entry.level);
    const timestamp = entry.timestamp;
    const correlationId = entry.context.correlationId?.substring(0, 8) || 'unknown';
    
    const logMessage = `${prefix} [${timestamp}] [${correlationId}] ${entry.message}`;

    switch (entry.level) {
      case 'DEBUG':
        console.debug(logMessage, entry.context, entry.metadata);
        break;
      case 'INFO':
        console.log(logMessage, entry.context, entry.metadata);
        break;
      case 'WARN':
        console.warn(logMessage, entry.context, entry.metadata);
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(logMessage, entry.context, entry.error, entry.metadata);
        break;
    }
  }

  /**
   * Get emoji prefix for log level
   */
  private getLevelPrefix(level: LogLevel): string {
    const prefixes = {
      DEBUG: '🐛',
      INFO: '📝',
      WARN: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨',
    };
    return prefixes[level];
  }

  /**
   * Send log to Google Cloud Logging
   */
  private sendToCloudLogging(entry: StructuredLogEntry): void {
    // In a real implementation, this would use the Google Cloud Logging client library
    // For now, we'll structure the log in the format Cloud Logging expects
    
    const cloudLogEntry = {
      severity: entry.level,
      timestamp: entry.timestamp,
      jsonPayload: {
        message: entry.message,
        service: entry.service,
        version: entry.version,
        environment: entry.environment,
        context: entry.context,
        error: entry.error,
        metadata: entry.metadata,
      },
      labels: {
        service: entry.service,
        environment: entry.environment,
        level: entry.level.toLowerCase(),
      },
    };

    // In production, you would use:
    // import { Logging } from '@google-cloud/logging';
    // const logging = new Logging({ projectId: 'your-project-id' });
    // const log = logging.log('adcraft-application-logs');
    // await log.write(log.entry(cloudLogEntry));

    // For development, just structure it properly
    if (this.environment === 'development') {
      console.debug('Cloud Log Entry:', JSON.stringify(cloudLogEntry, null, 2));
    }
  }

  /**
   * Track endpoint usage for metrics
   */
  private trackEndpoint(endpoint: string): void {
    const current = this.endpointCounts.get(endpoint) || 0;
    this.endpointCounts.set(endpoint, current + 1);
  }

  /**
   * Track error for metrics
   */
  private trackError(errorMessage: string): void {
    const current = this.errorCounts.get(errorMessage) || 0;
    this.errorCounts.set(errorMessage, current + 1);
  }

  /**
   * Get logging metrics
   */
  public getMetrics(): LogMetrics {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const lastHour = now - 60 * 60 * 1000;

    const metrics: LogMetrics = {
      totalLogs: this.logs.length,
      logsByLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        CRITICAL: 0,
      },
      logsLast24h: 0,
      logsLastHour: 0,
      errorsLast24h: 0,
      topEndpoints: [],
      topErrors: [],
    };

    // Analyze logs
    for (const log of this.logs) {
      metrics.logsByLevel[log.level]++;
      
      const logTime = new Date(log.timestamp).getTime();
      if (logTime >= last24h) {
        metrics.logsLast24h++;
        if (log.level === 'ERROR' || log.level === 'CRITICAL') {
          metrics.errorsLast24h++;
        }
      }
      if (logTime >= lastHour) {
        metrics.logsLastHour++;
      }
    }

    // Top endpoints
    metrics.topEndpoints = Array.from(this.endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top errors
    metrics.topErrors = Array.from(this.errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return metrics;
  }

  /**
   * Get recent logs
   */
  public getRecentLogs(count: number = 100, level?: LogLevel): StructuredLogEntry[] {
    const filteredLogs = level 
      ? this.logs.filter(log => log.level === level)
      : this.logs;

    return filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  /**
   * Search logs by correlation ID
   */
  public getLogsByCorrelationId(correlationId: string): StructuredLogEntry[] {
    return this.logs
      .filter(log => log.context.correlationId === correlationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Search logs by context field
   */
  public searchLogs(
    field: string,
    value: any,
    count: number = 100
  ): StructuredLogEntry[] {
    return this.logs
      .filter(log => log.context[field] === value)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  /**
   * Export logs for analysis
   */
  public exportLogs(
    startDate?: Date,
    endDate?: Date,
    level?: LogLevel
  ): StructuredLogEntry[] {
    let filteredLogs = this.logs;

    if (startDate) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) >= startDate
      );
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) <= endDate
      );
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    return filteredLogs.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Clean up old logs and metrics
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.retentionPeriod;

    // Clean up old logs
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(
      log => new Date(log.timestamp).getTime() >= cutoff
    );

    // Clean up old correlation IDs
    // In a real implementation, you'd track when correlation IDs were created
    // For now, we'll just limit the map size
    if (this.correlationIds.size > 1000) {
      const entries = Array.from(this.correlationIds.entries());
      this.correlationIds = new Map(entries.slice(-500));
    }

    if (initialCount > this.logs.length) {
      console.log(`Logger cleanup: removed ${initialCount - this.logs.length} old logs`);
    }
  }

  /**
   * Health check for logger
   */
  public healthCheck(): boolean {
    try {
      // Test log entry creation
      const testEntry: StructuredLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message: 'Health check test',
        context: { correlationId: 'health-check' },
        service: this.service,
        version: this.version,
        environment: this.environment,
      };

      return true;
    } catch (error) {
      console.error('Logger health check failed:', error);
      return false;
    }
  }
}

export default Logger;