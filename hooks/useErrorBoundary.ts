'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ErrorInfo {
  error: Error;
  errorInfo?: {
    componentStack?: string;
    [key: string]: any;
  };
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorBoundaryActions {
  captureError: (error: Error, errorInfo?: any) => void;
  clearError: () => void;
  reportError: (errorInfo: ErrorInfo) => Promise<void>;
  retryLastAction: () => void;
}

export interface UseErrorBoundaryOptions {
  onError?: (errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  reportEndpoint?: string;
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  maxRetries?: number;
}

/**
 * Custom hook for error boundary functionality
 * Provides error capture, reporting, and recovery mechanisms
 */
export function useErrorBoundary(options: UseErrorBoundaryOptions = {}): [
  ErrorBoundaryState,
  ErrorBoundaryActions
] {
  const {
    onError,
    enableReporting = true,
    reportEndpoint = '/api/errors',
    maxRetries = 3,
  } = options;

  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  });

  const retryCountRef = useRef(0);
  const lastActionRef = useRef<(() => void) | null>(null);

  const generateErrorId = useCallback(() => {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const captureError = useCallback(
    (error: Error, errorInfo?: any) => {
      const errorId = generateErrorId();
      const fullErrorInfo: ErrorInfo = {
        error,
        errorInfo,
        timestamp: new Date(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      };

      setState({
        hasError: true,
        error,
        errorInfo: fullErrorInfo,
        errorId,
      });

      // Log error to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error captured by error boundary:', error);
        console.error('Error info:', errorInfo);
      }

      // Call error callback
      onError?.(fullErrorInfo);

      // Report error if enabled
      if (enableReporting) {
        reportError(fullErrorInfo).catch(reportingError => {
          console.warn('Failed to report error:', reportingError);
        });
      }
    },
    [generateErrorId, onError, enableReporting]
  );

  const clearError = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
    retryCountRef.current = 0;
  }, []);

  const reportError = useCallback(async (errorInfo: ErrorInfo) => {
    if (!enableReporting || typeof window === 'undefined') {
      return;
    }

    try {
      await fetch(reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: errorInfo.error.message,
          stack: errorInfo.error.stack,
          name: errorInfo.error.name,
          timestamp: errorInfo.timestamp.toISOString(),
          url: errorInfo.url,
          userAgent: errorInfo.userAgent,
          errorInfo: errorInfo.errorInfo,
        }),
      });
    } catch (reportingError) {
      console.warn('Failed to report error to endpoint:', reportingError);
    }
  }, [enableReporting, reportEndpoint]);

  const retryLastAction = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      console.warn('Max retries exceeded');
      return;
    }

    retryCountRef.current++;
    clearError();

    if (lastActionRef.current) {
      try {
        lastActionRef.current();
      } catch (error) {
        if (error instanceof Error) {
          captureError(error, { retryAttempt: retryCountRef.current });
        }
      }
    }
  }, [maxRetries, clearError, captureError]);

  // Set up global error handlers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled promise rejection');
      error.stack = event.reason?.stack;
      captureError(error, { type: 'unhandledRejection', reason: event.reason });
    };

    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = event.error?.stack;
      captureError(error, {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [captureError]);

  return [
    state,
    {
      captureError,
      clearError,
      reportError,
      retryLastAction,
    },
  ];
}

/**
 * Hook for wrapping async operations with error handling
 */
export function useAsyncErrorHandler<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  options: {
    onError?: (error: Error) => void;
    onRetry?: () => void;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
) {
  const { onError, onRetry, maxRetries = 3, retryDelay = 1000 } = options;
  const [errorState, { captureError }] = useErrorBoundary();
  
  const [isLoading, setIsLoading] = useState(false);
  const retryCountRef = useRef(0);

  const execute = useCallback(async (...args: T): Promise<R> => {
    setIsLoading(true);

    try {
      const result = await asyncFunction(...args);
      retryCountRef.current = 0; // Reset on success
      return result;
    } catch (error) {
      if (error instanceof Error) {
        captureError(error, { args, attempt: retryCountRef.current + 1 });
        onError?.(error);

        // Auto-retry if under max retries
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          onRetry?.();
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return execute(...args);
        }
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, captureError, onError, onRetry, maxRetries, retryDelay]);

  return {
    execute,
    isLoading,
    error: errorState.error,
    retryCount: retryCountRef.current,
    canRetry: retryCountRef.current < maxRetries,
  };
}

/**
 * Hook for creating safe async operations that won't crash the app
 */
export function useSafeAsync<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  fallbackValue: R
) {
  const { execute } = useAsyncErrorHandler(asyncFunction, {
    onError: (error) => {
      console.warn('Safe async operation failed:', error.message);
    },
  });

  const safeExecute = useCallback(async (...args: T): Promise<R> => {
    try {
      return await execute(...args);
    } catch (error) {
      return fallbackValue;
    }
  }, [execute, fallbackValue]);

  return safeExecute;
}