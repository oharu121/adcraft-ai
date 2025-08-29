'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MonitoringDashboardData, BudgetOverviewProps } from '@/types/monitoring';
import { cn } from '@/lib/utils/cn';

interface BudgetOverviewComponentProps {
  data?: MonitoringDashboardData;
  loading?: boolean;
  onRefresh?: () => void;
  dictionary: any;
  className?: string;
  showProjections?: boolean;
  showBreakdown?: boolean;
}

export function BudgetOverview({
  data,
  loading,
  onRefresh,
  dictionary,
  className,
  showProjections = true,
  showBreakdown = true
}: BudgetOverviewComponentProps) {
  const budget = data?.budget;
  
  if (loading && !budget) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  const getAlertColor = (alertLevel?: string) => {
    switch (alertLevel) {
      case 'safe': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'danger': return 'text-orange-500';
      case 'exceeded': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getAlertBg = (alertLevel?: string) => {
    switch (alertLevel) {
      case 'safe': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-orange-500';
      case 'exceeded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '$0.00';
    return `${dictionary.monitoring.units.currency}${amount.toFixed(2)}`;
  };

  const percentageUsed = budget?.percentageUsed || 0;

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {dictionary.monitoring.budget.title}
        </h2>
        {loading && (
          <LoadingSpinner size="sm" />
        )}
      </div>

      <div className="space-y-4">
        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {dictionary.monitoring.budget.utilizationRate}
            </span>
            <span className={cn('text-sm font-semibold', getAlertColor(budget?.alertLevel))}>
              {percentageUsed.toFixed(1)}{dictionary.monitoring.units.percent}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={cn('h-3 rounded-full transition-all duration-300', getAlertBg(budget?.alertLevel))}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Budget Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {dictionary.monitoring.budget.currentSpend}
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(budget?.currentSpend)}
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {dictionary.monitoring.budget.remaining}
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(budget?.remainingBudget)}
            </div>
          </div>
        </div>

        {/* Total Budget */}
        <div className="text-center py-2 border-t">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {dictionary.monitoring.budget.totalBudget}
          </div>
          <div className="text-xl font-bold">
            {formatCurrency(budget?.totalBudget)}
          </div>
        </div>

        {/* Alert Status */}
        {budget?.alertLevel && budget.alertLevel !== 'safe' && (
          <div className={cn(
            'rounded-lg p-3 border',
            budget.alertLevel === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
            budget.alertLevel === 'danger' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
            'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          )}>
            <div className="flex items-center space-x-2">
              <div className={cn('w-3 h-3 rounded-full', getAlertBg(budget.alertLevel))} />
              <div className="text-sm">
                {budget.alertLevel === 'warning' && 'Budget usage approaching limit'}
                {budget.alertLevel === 'danger' && 'Budget usage critical'}
                {budget.alertLevel === 'exceeded' && 'Budget limit exceeded'}
              </div>
            </div>
          </div>
        )}

        {/* Safe Status */}
        {budget?.alertLevel === 'safe' && (
          <div className="text-center py-2">
            <div className="text-green-500 mb-2">
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Budget usage is within safe limits
            </p>
          </div>
        )}

        {/* Can/Cannot Proceed Indicator */}
        <div className={cn(
          'text-center text-sm font-medium py-2 px-3 rounded-lg',
          budget?.canProceed 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        )}>
          {budget?.canProceed ? 'Operations: Allowed' : 'Operations: Restricted'}
        </div>
      </div>
    </Card>
  );
}

export default BudgetOverview;