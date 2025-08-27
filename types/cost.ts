/**
 * Cost tracking and budget management types
 */

export interface CostEntry {
  id: string;
  service: 'veo' | 'gemini' | 'storage' | 'other';
  amount: number;
  currency: 'USD';
  description: string;
  sessionId?: string;
  jobId?: string;
  timestamp: Date;
  metadata?: CostMetadata;
}

export interface CostMetadata {
  region?: string;
  operation?: string;
  inputTokens?: number;
  outputTokens?: number;
  processingTime?: number; // seconds
  dataSize?: number; // bytes
  billableUnits?: number;
  discountApplied?: boolean;
  promoCode?: string;
}

export interface BudgetStatus {
  totalBudget: number;
  currentSpend: number;
  remainingBudget: number;
  percentageUsed: number; // 0-100
  alertLevel: 'safe' | 'warning' | 'danger' | 'exceeded';
  canProceed: boolean;
  projectedSpend?: number; // Based on current usage patterns
  daysRemaining?: number; // Until budget reset
}

export interface CostBreakdown {
  veo: number;
  gemini: number;
  storage: number;
  other: number;
  total: number;
  breakdown?: ServiceCostBreakdown[];
}

export interface ServiceCostBreakdown {
  service: CostEntry['service'];
  amount: number;
  percentage: number;
  operations: OperationCost[];
}

export interface OperationCost {
  operation: string;
  count: number;
  totalCost: number;
  averageCost: number;
}

// Budget alerts and thresholds
export interface BudgetAlert {
  id: string;
  type: 'threshold' | 'projection' | 'anomaly';
  level: 'warning' | 'danger' | 'critical';
  threshold: number; // percentage
  currentValue: number;
  message: string;
  triggered: Date;
  acknowledged?: Date;
  actions?: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'pause_operations';
  config: Record<string, any>;
  executed: boolean;
  executedAt?: Date;
  error?: string;
}

// Cost estimates and pricing
export interface CostEstimate {
  operation: string;
  estimatedCost: number;
  breakdown: {
    baseCost: number;
    variableCost: number;
    fees?: number;
  };
  confidence: number; // 0-1
  factors: CostFactor[];
}

export interface CostFactor {
  name: string;
  impact: number; // multiplier
  description: string;
}

export interface PricingTier {
  name: string;
  description: string;
  limits: {
    videosPerMonth: number;
    maxDuration: number; // seconds
    maxResolution: string;
  };
  pricing: {
    basePrice: number; // monthly
    perVideoPrice: number;
    overage: {
      videos: number; // price per additional video
      storage: number; // price per GB
    };
  };
}

// Usage tracking
export interface UsageMetrics {
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalCost: number;
    totalVideos: number;
    totalPrompts: number;
    averageCostPerVideo: number;
    peakUsageTime?: Date;
    costTrend: 'increasing' | 'decreasing' | 'stable';
  };
  breakdown: CostBreakdown;
}

export interface UsagePattern {
  type: 'spike' | 'trend' | 'anomaly' | 'normal';
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
  detectedAt: Date;
}

// Cost optimization
export interface CostOptimization {
  id: string;
  type: 'service_recommendation' | 'usage_pattern' | 'pricing_tier';
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  implementationSteps: string[];
  estimatedTimeToImplement: number; // hours
}

// Budget planning
export interface BudgetPlan {
  id: string;
  name: string;
  totalBudget: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  allocation: ServiceAllocation[];
  constraints: BudgetConstraint[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'archived';
}

export interface ServiceAllocation {
  service: CostEntry['service'];
  allocatedAmount: number;
  percentage: number;
  priority: 'high' | 'medium' | 'low';
  flexibility: number; // 0-1, how flexible this allocation is
}

export interface BudgetConstraint {
  type: 'hard_limit' | 'soft_limit' | 'notification';
  service?: CostEntry['service'];
  amount: number;
  action: 'block' | 'alert' | 'log';
  message?: string;
}

// Billing and invoicing
export interface BillingPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  status: 'current' | 'pending' | 'paid' | 'overdue';
  invoiceUrl?: string;
  breakdown: CostBreakdown;
  adjustments?: BillingAdjustment[];
}

export interface BillingAdjustment {
  type: 'credit' | 'debit' | 'discount';
  amount: number;
  reason: string;
  appliedAt: Date;
  reference?: string;
}

// Cost reporting
export interface CostReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalCost: number;
    costChange: number; // vs previous period
    costChangePercentage: number;
    topServices: { service: string; cost: number }[];
  };
  sections: ReportSection[];
  generatedAt: Date;
  format: 'json' | 'pdf' | 'csv';
}

export interface ReportSection {
  title: string;
  type: 'chart' | 'table' | 'summary';
  data: any;
  insights?: string[];
}

// Export types for external systems
export interface CostExport {
  format: 'csv' | 'json' | 'xlsx';
  filters: {
    startDate?: Date;
    endDate?: Date;
    services?: CostEntry['service'][];
    sessions?: string[];
  };
  columns: string[];
  groupBy?: 'service' | 'day' | 'session';
}

// Cost anomaly detection
export interface CostAnomaly {
  id: string;
  type: 'spike' | 'unusual_pattern' | 'service_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  description: string;
  affectedServices: CostEntry['service'][];
  costImpact: number;
  possibleCauses: string[];
  recommendedActions: string[];
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

export const COST_CONSTANTS = {
  DEFAULT_BUDGET: 300, // $300
  ALERT_THRESHOLDS: {
    WARNING: 0.75, // 75%
    DANGER: 0.90,  // 90%
    CRITICAL: 0.95, // 95%
  },
  SERVICE_ESTIMATES: {
    VEO_PER_15_SECONDS: 1.50,
    GEMINI_PER_1K_TOKENS: 0.002,
    STORAGE_PER_GB_HOUR: 0.00001,
    PROCESSING_OVERHEAD: 0.05,
  },
} as const;