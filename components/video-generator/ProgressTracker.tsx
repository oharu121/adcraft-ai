'use client';

import { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

export interface ProgressStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedDuration?: number; // seconds
}

export interface ProgressTrackerProps {
  jobId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  statusMessage?: string;
  estimatedTimeRemaining?: number; // seconds
  error?: string;
  onCancel?: () => void;
  className?: string;
  showDetailedSteps?: boolean;
}

const defaultSteps: ProgressStep[] = [
  {
    id: 'queue',
    label: 'Request Queued',
    description: 'Your video generation request has been queued',
    status: 'pending',
    estimatedDuration: 30,
  },
  {
    id: 'analysis',
    label: 'Prompt Analysis',
    description: 'AI is analyzing your prompt for optimal results',
    status: 'pending',
    estimatedDuration: 60,
  },
  {
    id: 'generation',
    label: 'Video Generation',
    description: 'Creating your video using advanced AI models',
    status: 'pending',
    estimatedDuration: 300,
  },
  {
    id: 'processing',
    label: 'Post-Processing',
    description: 'Optimizing video quality and format',
    status: 'pending',
    estimatedDuration: 90,
  },
  {
    id: 'complete',
    label: 'Ready to View',
    description: 'Your video is ready for viewing and download',
    status: 'pending',
    estimatedDuration: 0,
  },
];

/**
 * Real-time progress tracker for video generation
 * Shows current status, progress percentage, and estimated time remaining
 */
export const ProgressTracker = forwardRef<HTMLDivElement, ProgressTrackerProps>(
  (
    {
      jobId,
      status = 'pending',
      progress = 0,
      statusMessage,
      estimatedTimeRemaining,
      error,
      onCancel,
      className,
      showDetailedSteps = true,
    },
    ref
  ) => {
    const [steps, setSteps] = useState<ProgressStep[]>(defaultSteps);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Update steps based on current status and progress
    useEffect(() => {
      const updatedSteps = [...defaultSteps];
      
      if (status === 'failed') {
        updatedSteps.forEach((step, index) => {
          if (index === 0) step.status = 'failed';
          else step.status = 'pending';
        });
      } else if (status === 'completed') {
        updatedSteps.forEach((step) => {
          step.status = 'completed';
        });
      } else if (status === 'processing') {
        const currentStepIndex = Math.floor((progress / 100) * (updatedSteps.length - 1));
        
        updatedSteps.forEach((step, index) => {
          if (index < currentStepIndex) {
            step.status = 'completed';
          } else if (index === currentStepIndex) {
            step.status = 'in-progress';
          } else {
            step.status = 'pending';
          }
        });
      } else {
        // pending status
        updatedSteps[0].status = 'in-progress';
      }
      
      setSteps(updatedSteps);
    }, [status, progress]);

    // Track elapsed time
    useEffect(() => {
      if (status === 'pending' || status === 'processing') {
        const interval = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);
        
        return () => clearInterval(interval);
      }
    }, [status]);

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (stepStatus: ProgressStep['status']): string => {
      switch (stepStatus) {
        case 'completed':
          return 'text-green-600 border-green-200 bg-green-50';
        case 'in-progress':
          return 'text-blue-600 border-blue-200 bg-blue-50';
        case 'failed':
          return 'text-red-600 border-red-200 bg-red-50';
        default:
          return 'text-gray-400 border-gray-200 bg-gray-50';
      }
    };

    const getStatusIcon = (stepStatus: ProgressStep['status']) => {
      switch (stepStatus) {
        case 'completed':
          return (
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          );
        case 'in-progress':
          return <LoadingSpinner size="sm" variant="primary" />;
        case 'failed':
          return (
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          );
        default:
          return (
            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
          );
      }
    };

    const overallProgress = Math.max(progress, status === 'completed' ? 100 : 0);

    return (
      <Card ref={ref} className={cn('w-full', className)} variant="outlined">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status === 'processing' || status === 'pending' ? (
                <LoadingSpinner size="sm" variant="primary" />
              ) : status === 'completed' ? (
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span>Video Generation Progress</span>
            </div>

            {jobId && (
              <span className="text-sm font-mono text-gray-500">
                Job: {jobId.slice(0, 8)}...
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {statusMessage || 'Processing...'}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(overallProgress)}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 ease-out',
                  status === 'failed' ? 'bg-red-500' : 
                  status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Time Information */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <span>Remaining: ~{formatTime(estimatedTimeRemaining)}</span>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-medium text-red-800">Generation Failed</h4>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Detailed Steps */}
          {showDetailedSteps && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Process Steps:</h4>
              
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      getStatusColor(step.status)
                    )}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium truncate">
                        {step.label}
                      </h5>
                      <p className="text-xs opacity-75 truncate">
                        {step.description}
                      </p>
                    </div>

                    {step.estimatedDuration && step.status === 'pending' && (
                      <div className="text-xs opacity-60">
                        ~{Math.ceil(step.estimatedDuration / 60)}m
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {onCancel && (status === 'pending' || status === 'processing') && (
            <div className="flex justify-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-gray-700',
                  'bg-white border border-gray-300 rounded-md',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500',
                  'transition-colors'
                )}
              >
                Cancel Generation
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

ProgressTracker.displayName = 'ProgressTracker';