'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface JobStatusData {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  statusMessage: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  estimatedTimeRemaining?: number;
  error?: string;
}

export interface JobStatusState {
  data?: JobStatusData;
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface JobStatusActions {
  startPolling: (jobId: string, interval?: number) => void;
  stopPolling: () => void;
  checkStatus: (jobId: string) => Promise<JobStatusData | undefined>;
  clearStatus: () => void;
}

export interface UseJobStatusOptions {
  onStatusChange?: (status: JobStatusData) => void;
  onCompleted?: (videoUrl: string, jobId: string) => void;
  onFailed?: (error: string, jobId: string) => void;
  autoStart?: boolean;
  defaultInterval?: number;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Custom hook for polling job status with automatic retries and error handling
 * Manages real-time status updates for video generation jobs
 */
export function useJobStatus(
  initialJobId?: string,
  options: UseJobStatusOptions = {}
): [JobStatusState, JobStatusActions] {
  const {
    onStatusChange,
    onCompleted,
    onFailed,
    autoStart = true,
    defaultInterval = 10000, // 10 seconds
    maxRetries = 5,
    timeout = 900000, // 15 minutes
  } = options;

  const [state, setState] = useState<JobStatusState>({
    isLoading: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const currentJobIdRef = useRef<string | undefined>(initialJobId);

  // Auto-start polling if jobId provided and autoStart is true
  useEffect(() => {
    if (initialJobId && autoStart) {
      startPolling(initialJobId);
    }

    return () => {
      stopPolling();
    };
  }, [initialJobId, autoStart]);

  const checkStatus = useCallback(async (jobId: string): Promise<JobStatusData | undefined> => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: undefined,
      }));

      const response = await fetch(`/api/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found or has expired');
        }
        if (response.status === 410) {
          throw new Error('Job has expired');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const statusData: JobStatusData = result.data;

      setState(prev => ({
        ...prev,
        data: statusData,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      // Reset retry count on successful request
      retryCountRef.current = 0;

      // Call status change callback
      onStatusChange?.(statusData);

      // Handle completion
      if (statusData.status === 'completed' && statusData.videoUrl) {
        stopPolling();
        onCompleted?.(statusData.videoUrl, jobId);
      }

      // Handle failure
      if (statusData.status === 'failed') {
        stopPolling();
        onFailed?.(statusData.error || 'Job failed', jobId);
      }

      return statusData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check status';
      
      retryCountRef.current++;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Stop polling if max retries reached
      if (retryCountRef.current >= maxRetries) {
        stopPolling();
        onFailed?.(errorMessage, jobId);
      }

      throw error;
    }
  }, [onStatusChange, onCompleted, onFailed, maxRetries]);

  const startPolling = useCallback((jobId: string, interval: number = defaultInterval) => {
    // Stop any existing polling
    stopPolling();

    currentJobIdRef.current = jobId;
    startTimeRef.current = Date.now();
    retryCountRef.current = 0;

    // Initial status check
    checkStatus(jobId).catch(() => {
      // Error already handled in checkStatus
    });

    // Set up polling interval
    const poll = async () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      // Stop polling if timeout reached
      if (elapsed > timeout) {
        stopPolling();
        setState(prev => ({
          ...prev,
          error: 'Polling timeout - job may have failed',
        }));
        onFailed?.('Polling timeout - job may have failed', jobId);
        return;
      }

      // Continue polling if job is still active
      try {
        const status = await checkStatus(jobId);
        
        if (status && (status.status === 'pending' || status.status === 'processing')) {
          // Schedule next poll with exponential backoff for retries
          const nextInterval = retryCountRef.current > 0 
            ? Math.min(interval * Math.pow(2, retryCountRef.current), 60000) // Max 1 minute
            : interval;
            
          intervalRef.current = setTimeout(poll, nextInterval);
        }
      } catch (error) {
        // Error handled in checkStatus, but continue polling if retries available
        if (retryCountRef.current < maxRetries) {
          const retryInterval = Math.min(interval * Math.pow(2, retryCountRef.current), 60000);
          intervalRef.current = setTimeout(poll, retryInterval);
        }
      }
    };

    // Start polling
    intervalRef.current = setTimeout(poll, interval);
  }, [checkStatus, defaultInterval, timeout, maxRetries, onFailed]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearStatus = useCallback(() => {
    stopPolling();
    setState({
      isLoading: false,
    });
    currentJobIdRef.current = undefined;
    retryCountRef.current = 0;
  }, [stopPolling]);

  const actions: JobStatusActions = {
    startPolling,
    stopPolling,
    checkStatus,
    clearStatus,
  };

  return [state, actions];
}

/**
 * Hook for managing multiple job statuses
 */
export function useMultipleJobStatus(): [
  Map<string, JobStatusState>,
  {
    addJob: (jobId: string, options?: UseJobStatusOptions) => void;
    removeJob: (jobId: string) => void;
    checkJob: (jobId: string) => Promise<void>;
    clearAll: () => void;
  }
] {
  const [jobStates, setJobStates] = useState<Map<string, JobStatusState>>(new Map());
  const jobHooksRef = useRef<Map<string, [JobStatusState, JobStatusActions]>>(new Map());

  const addJob = useCallback((jobId: string, options: UseJobStatusOptions = {}) => {
    if (jobHooksRef.current.has(jobId)) {
      return; // Job already being tracked
    }

    // This is a simplified implementation - in a real app you'd need to properly manage the hooks
    setJobStates(prev => new Map(prev.set(jobId, { isLoading: true })));
  }, []);

  const removeJob = useCallback((jobId: string) => {
    const hookData = jobHooksRef.current.get(jobId);
    if (hookData) {
      const [, actions] = hookData;
      actions.stopPolling();
      jobHooksRef.current.delete(jobId);
    }

    setJobStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(jobId);
      return newMap;
    });
  }, []);

  const checkJob = useCallback(async (jobId: string) => {
    const hookData = jobHooksRef.current.get(jobId);
    if (hookData) {
      const [, actions] = hookData;
      await actions.checkStatus(jobId);
    }
  }, []);

  const clearAll = useCallback(() => {
    jobHooksRef.current.forEach(([, actions]) => {
      actions.stopPolling();
    });
    jobHooksRef.current.clear();
    setJobStates(new Map());
  }, []);

  return [
    jobStates,
    {
      addJob,
      removeJob,
      checkJob,
      clearAll,
    },
  ];
}