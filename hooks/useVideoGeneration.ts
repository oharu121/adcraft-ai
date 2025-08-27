'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface VideoGenerationState {
  prompt: string;
  status: 'idle' | 'generating' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  sessionId?: string;
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  estimatedCost: number;
  estimatedTimeRemaining?: number;
}

export interface VideoGenerationActions {
  setPrompt: (prompt: string) => void;
  generateVideo: (options?: { duration?: number; aspectRatio?: string; style?: string }) => Promise<void>;
  cancelGeneration: () => Promise<void>;
  resetState: () => void;
  pollStatus: (jobId: string) => Promise<void>;
}

export interface UseVideoGenerationOptions {
  onSuccess?: (videoUrl: string, jobId: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number, status: string) => void;
  pollingInterval?: number; // milliseconds
  maxPollingTime?: number; // milliseconds
}

/**
 * Custom hook for managing video generation state and actions
 * Handles the complete video generation workflow with polling and error handling
 */
export function useVideoGeneration(options: UseVideoGenerationOptions = {}): [
  VideoGenerationState,
  VideoGenerationActions
] {
  const {
    onSuccess,
    onError,
    onProgress,
    pollingInterval = 10000, // 10 seconds
    maxPollingTime = 600000, // 10 minutes
  } = options;

  const [state, setState] = useState<VideoGenerationState>({
    prompt: '',
    status: 'idle',
    progress: 0,
    estimatedCost: 1.5,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Call progress callback when progress changes
  useEffect(() => {
    if (onProgress && state.status !== 'idle') {
      onProgress(state.progress, state.status);
    }
  }, [state.progress, state.status, onProgress]);

  const setPrompt = useCallback((prompt: string) => {
    setState(prev => ({ ...prev, prompt, error: undefined }));
  }, []);

  const generateVideo = useCallback(async (options: { duration?: number; aspectRatio?: string; style?: string } = {}) => {
    try {
      // Reset state
      setState(prev => ({
        ...prev,
        status: 'generating',
        progress: 0,
        error: undefined,
        jobId: undefined,
        sessionId: undefined,
        videoUrl: undefined,
        thumbnailUrl: undefined,
        estimatedTimeRemaining: undefined,
      }));

      startTimeRef.current = Date.now();
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: state.prompt,
          duration: options.duration || 15,
          aspectRatio: options.aspectRatio || '16:9',
          style: options.style || 'realistic',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to start video generation');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        status: 'processing',
        jobId: data.data.jobId,
        sessionId: data.data.sessionId,
        estimatedTimeRemaining: data.data.estimatedCompletionTime,
        progress: 5, // Small initial progress
      }));

      // Start polling for status updates
      if (data.data.jobId) {
        startPolling(data.data.jobId);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
        progress: 0,
      }));
      onError?.(errorMessage);
    }
  }, [state.prompt, onError]);

  const startPolling = useCallback((jobId: string) => {
    const poll = async () => {
      try {
        const elapsed = Date.now() - startTimeRef.current;
        
        // Stop polling if max time exceeded
        if (elapsed > maxPollingTime) {
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Generation timeout - please try again',
          }));
          onError?.('Generation timeout - please try again');
          return;
        }

        const response = await fetch(`/api/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const statusData = await response.json();
        const jobData = statusData.data;

        setState(prev => ({
          ...prev,
          status: jobData.status,
          progress: jobData.progress || prev.progress,
          videoUrl: jobData.videoUrl,
          thumbnailUrl: jobData.thumbnailUrl,
          estimatedTimeRemaining: jobData.estimatedTimeRemaining,
          error: jobData.error,
        }));

        if (jobData.status === 'completed') {
          setState(prev => ({ ...prev, progress: 100 }));
          onSuccess?.(jobData.videoUrl, jobId);
        } else if (jobData.status === 'failed') {
          onError?.(jobData.error || 'Video generation failed');
        } else {
          // Continue polling
          pollingRef.current = setTimeout(poll, pollingInterval);
        }

      } catch (error) {
        console.error('Status polling error:', error);
        
        // Retry polling a few times before giving up
        const retryCount = state.progress < 10 ? 3 : 1;
        if (retryCount > 0) {
          pollingRef.current = setTimeout(poll, pollingInterval * 2);
        } else {
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Lost connection to server',
          }));
          onError?.('Lost connection to server');
        }
      }
    };

    // Start first poll
    pollingRef.current = setTimeout(poll, pollingInterval);
  }, [maxPollingTime, pollingInterval, onSuccess, onError, state.progress]);

  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const statusData = await response.json();
      const jobData = statusData.data;

      setState(prev => ({
        ...prev,
        status: jobData.status,
        progress: jobData.progress || prev.progress,
        videoUrl: jobData.videoUrl,
        thumbnailUrl: jobData.thumbnailUrl,
        estimatedTimeRemaining: jobData.estimatedTimeRemaining,
        error: jobData.error,
        jobId: jobId,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check status';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  const cancelGeneration = useCallback(async () => {
    try {
      // Cancel current request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Stop polling
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }

      // Cancel on server if we have a job ID
      if (state.jobId) {
        try {
          await fetch(`/api/status/${state.jobId}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.warn('Failed to cancel on server:', error);
        }
      }

      setState(prev => ({
        ...prev,
        status: 'idle',
        progress: 0,
        error: undefined,
        jobId: undefined,
        sessionId: undefined,
        videoUrl: undefined,
        thumbnailUrl: undefined,
        estimatedTimeRemaining: undefined,
      }));

    } catch (error) {
      console.error('Cancellation error:', error);
    }
  }, [state.jobId]);

  const resetState = useCallback(() => {
    // Stop any ongoing polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      prompt: '',
      status: 'idle',
      progress: 0,
      estimatedCost: 1.5,
    });
  }, []);

  const actions: VideoGenerationActions = {
    setPrompt,
    generateVideo,
    cancelGeneration,
    resetState,
    pollStatus,
  };

  return [state, actions];
}