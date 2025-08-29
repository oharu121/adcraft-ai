/**
 * TypeScript interfaces for monitoring dashboard components
 */

export interface MonitoringDashboardData {
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'critical' | 'unknown';
    timestamp: Date;
    uptime: number;
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
      responseTime: number;
      lastCheck: Date;
      details: {
        available: boolean;
        latency: number;
        errorRate: number;
      };
    }>;
    overallScore: number;
    criticalIssues: string[];
    warnings: string[];
  };
  performance: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalVideoGenerations: number;
    averageGenerationTime: number;
    videoGenerationSuccessRate: number;
    currentCpuUsage: number;
    currentMemoryUsage: number;
  };
  budget: {
    totalBudget: number;
    currentSpend: number;
    remainingBudget: number;
    percentageUsed: number;
    alertLevel: 'safe' | 'warning' | 'danger' | 'exceeded';
    canProceed: boolean;
  };
  alerts: {
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
  };
  trends: {
    cpuTrend: Array<{ timestamp: Date; value: number }>;
    memoryTrend: Array<{ timestamp: Date; value: number }>;
    requestTrend: Array<{ timestamp: Date; value: number }>;
    errorTrend: Array<{ timestamp: Date; value: number }>;
    costTrend: Array<{ timestamp: Date; value: number }>;
  };
  metadata: {
    correlationId: string;
    timestamp: string;
    generatedIn: number;
    version: string;
  };
}

export interface MonitoringComponentProps {
  data?: MonitoringDashboardData;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
}

export interface SystemStatusProps extends MonitoringComponentProps {
  showDetails?: boolean;
  compactMode?: boolean;
}

export interface BudgetOverviewProps extends MonitoringComponentProps {
  showProjections?: boolean;
  showBreakdown?: boolean;
}

export interface ChartProps {
  data: Array<{ timestamp: Date | string; value: number; [key: string]: any }>;
  width?: number;
  height?: number;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  type?: 'line' | 'area' | 'bar' | 'pie';
  title?: string;
  loading?: boolean;
  error?: string | null;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export interface PerformanceChartProps extends ChartProps {
  metrics?: ('responseTime' | 'errorRate' | 'throughput')[];
  showLegend?: boolean;
}

export interface HealthScoreGaugeProps {
  score: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical' | 'unknown';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export interface TrendsVisualizationProps {
  trends: MonitoringDashboardData['trends'];
  timeRange?: string;
  selectedMetrics?: string[];
  onMetricsChange?: (metrics: string[]) => void;
  className?: string;
}

export interface AlertsListProps {
  alerts: MonitoringDashboardData['alerts'];
  maxItems?: number;
  showSeverityFilter?: boolean;
  onAcknowledge?: (alertId: string) => void;
  className?: string;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'reconnecting';
  latency: number;
  lastUpdate: Date | null;
}

export interface WebSocketHookResult {
  connectionStatus: ConnectionStatus;
  data: MonitoringDashboardData | null;
  error: string | null;
  reconnect: () => void;
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';
export type ChartType = 'line' | 'area' | 'bar' | 'pie';
export type MetricType = 'performance' | 'system' | 'costs' | 'alerts' | 'health';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'critical' | 'unknown';