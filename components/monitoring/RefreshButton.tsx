'use client';

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

interface RefreshButtonProps {
  onRefresh: () => void;
  loading?: boolean;
  dictionary: any;
  className?: string;
}

export function RefreshButton({
  onRefresh,
  loading = false,
  dictionary,
  className
}: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className={cn(
        'inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
        'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300',
        'text-white disabled:text-blue-100',
        'disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <LoadingSpinner size="sm" variant="white" className="mr-2" />
      ) : (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      {dictionary.monitoring?.refreshData || 'Refresh'}
    </button>
  );
}

export default RefreshButton;