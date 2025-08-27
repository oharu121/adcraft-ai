'use client';

import { useState, useCallback, useEffect } from 'react';

export interface BudgetStatus {
  totalBudget: number;
  currentSpend: number;
  remainingBudget: number;
  percentageUsed: number;
  alertLevel: 'safe' | 'warning' | 'danger' | 'exceeded';
  canProceed: boolean;
}

export interface CostEstimate {
  videoGeneration: number;
  promptRefinement: number;
  fileStorage: number;
  total: number;
}

export interface CostTrackingState {
  budgetStatus?: BudgetStatus;
  costEstimate: CostEstimate;
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface CostTrackingActions {
  refreshBudgetStatus: () => Promise<void>;
  estimateOperationCost: (operation: 'video' | 'chat' | 'storage', params?: any) => number;
  checkCanProceed: (estimatedCost: number) => Promise<boolean>;
  formatCurrency: (amount: number) => string;
}

export interface UseCostTrackingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onBudgetAlert?: (status: BudgetStatus) => void;
  onBudgetExceeded?: () => void;
}

/**
 * Custom hook for monitoring budget status and cost tracking
 * Provides real-time budget information and cost estimates
 */
export function useCostTracking(options: UseCostTrackingOptions = {}): [
  CostTrackingState,
  CostTrackingActions
] {
  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    onBudgetAlert,
    onBudgetExceeded,
  } = options;

  const [state, setState] = useState<CostTrackingState>({
    costEstimate: {
      videoGeneration: 1.5,
      promptRefinement: 0.2,
      fileStorage: 0.01,
      total: 1.71,
    },
    isLoading: false,
  });

  // Auto-refresh budget status
  useEffect(() => {
    if (autoRefresh) {
      refreshBudgetStatus();
      
      const interval = setInterval(() => {
        refreshBudgetStatus();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Monitor budget alerts
  useEffect(() => {
    if (state.budgetStatus) {
      if (state.budgetStatus.alertLevel === 'exceeded') {
        onBudgetExceeded?.();
      } else if (state.budgetStatus.alertLevel !== 'safe') {
        onBudgetAlert?.(state.budgetStatus);
      }
    }
  }, [state.budgetStatus, onBudgetAlert, onBudgetExceeded]);

  const refreshBudgetStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Check the health endpoint which includes budget status
      const response = await fetch('/api/generate-video', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch budget status');
      }

      const data = await response.json();
      
      // Extract budget information from the health check response
      const budgetInfo = data.data.services.budget;
      
      if (budgetInfo?.details) {
        setState(prev => ({
          ...prev,
          budgetStatus: budgetInfo.details,
          isLoading: false,
          lastUpdated: new Date(),
        }));
      } else {
        throw new Error('Budget information not available');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh budget status';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const estimateOperationCost = useCallback((
    operation: 'video' | 'chat' | 'storage',
    params?: any
  ): number => {
    switch (operation) {
      case 'video':
        // Video generation cost based on duration
        const duration = params?.duration || 15;
        const baseCost = 1.5; // Base cost for 15 seconds
        return (duration / 15) * baseCost;
        
      case 'chat':
        // Chat/refinement cost based on message complexity
        const messageLength = params?.messageLength || 100;
        const baseChatCost = 0.05;
        // Longer messages cost slightly more
        return baseChatCost + (Math.max(0, messageLength - 100) / 1000) * 0.01;
        
      case 'storage':
        // Storage cost (minimal)
        const hours = params?.hours || 12;
        return 0.01 * (hours / 12);
        
      default:
        return 0;
    }
  }, []);

  const checkCanProceed = useCallback(async (estimatedCost: number): Promise<boolean> => {
    try {
      // Refresh budget status first
      await refreshBudgetStatus();
      
      if (!state.budgetStatus) {
        // If we can't get budget status, be conservative
        return false;
      }

      return (
        state.budgetStatus.canProceed &&
        state.budgetStatus.remainingBudget >= estimatedCost
      );

    } catch (error) {
      console.error('Error checking budget:', error);
      return false; // Conservative approach on error
    }
  }, [state.budgetStatus, refreshBudgetStatus]);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const actions: CostTrackingActions = {
    refreshBudgetStatus,
    estimateOperationCost,
    checkCanProceed,
    formatCurrency,
  };

  return [state, actions];
}

/**
 * Hook for displaying budget status in a user-friendly way
 */
export function useBudgetDisplay() {
  const [costState] = useCostTracking();

  const getBudgetColor = useCallback((alertLevel?: string) => {
    switch (alertLevel) {
      case 'safe':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'exceeded':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getBudgetIcon = useCallback((alertLevel?: string): string => {
    switch (alertLevel) {
      case 'safe':
        return 'check';
      case 'warning':
        return 'warning';
      case 'danger':
      case 'exceeded':
        return 'error';
      default:
        return 'info';
    }
  }, []);

  const getBudgetMessage = useCallback((budgetStatus?: BudgetStatus) => {
    if (!budgetStatus) {
      return 'Budget status unavailable';
    }

    const { percentageUsed, remainingBudget, alertLevel } = budgetStatus;

    switch (alertLevel) {
      case 'safe':
        return `${percentageUsed.toFixed(1)}% of budget used. ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remainingBudget)} remaining.`;
      case 'warning':
        return `Approaching budget limit: ${percentageUsed.toFixed(1)}% used. Please monitor usage.`;
      case 'danger':
        return `Budget critically low: ${percentageUsed.toFixed(1)}% used. New operations may be limited.`;
      case 'exceeded':
        return 'Budget exceeded. No new operations allowed until next billing cycle.';
      default:
        return 'Budget status unknown';
    }
  }, []);

  return {
    getBudgetColor,
    getBudgetIcon,
    getBudgetMessage,
    ...costState,
  };
}