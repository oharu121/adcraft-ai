'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface AsyncActions<T, P extends any[] = []> {
  execute: (...params: P) => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

export interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  initialData?: T;
}

/**
 * Custom hook for managing async operations with loading, error, and success states
 * Provides automatic cancellation and cleanup
 */
export function useAsync<T, P extends any[] = []>(
  asyncFunction: (...params: P) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): [AsyncState<T>, AsyncActions<T, P>] {
  const {
    immediate = false,
    onSuccess,
    onError,
    initialData = null,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (...params: P): Promise<T> => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      if (!isMountedRef.current) {
        throw new Error('Component unmounted');
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      }));

      try {
        const result = await asyncFunction(...params);

        if (!isMountedRef.current || abortControllerRef.current.signal.aborted) {
          throw new Error('Request cancelled');
        }

        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });

        onSuccess?.(result);
        return result;

      } catch (error) {
        if (!isMountedRef.current || abortControllerRef.current?.signal.aborted) {
          return Promise.reject(new Error('Request cancelled'));
        }

        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
        setState({
          data: null,
          error: errorMessage,
          isLoading: false,
          isSuccess: false,
          isError: true,
        });

        onError?.(errorMessage);
        throw error;
      }
    },
    [asyncFunction, onSuccess, onError]
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: initialData,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, [initialData]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as P));
    }
  }, [immediate, execute]);

  return [
    state,
    {
      execute,
      reset,
      cancel,
    },
  ];
}

/**
 * Hook for managing async operations with caching
 * Caches results and provides cache invalidation
 */
export function useAsyncWithCache<T, P extends any[] = []>(
  asyncFunction: (...params: P) => Promise<T>,
  getCacheKey: (...params: P) => string,
  options: UseAsyncOptions<T> & {
    cacheTime?: number; // ms
    staleTime?: number; // ms
  } = {}
): [AsyncState<T>, AsyncActions<T, P> & { invalidateCache: (key?: string) => void }] {
  const { cacheTime = 300000, staleTime = 60000 } = options; // 5min cache, 1min stale
  
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  
  const cachedAsyncFunction = useCallback(
    async (...params: P): Promise<T> => {
      const cacheKey = getCacheKey(...params);
      const cached = cacheRef.current.get(cacheKey);
      const now = Date.now();

      // Return cached data if within stale time
      if (cached && (now - cached.timestamp) < staleTime) {
        return cached.data;
      }

      // Fetch new data
      const result = await asyncFunction(...params);
      
      // Update cache
      cacheRef.current.set(cacheKey, {
        data: result,
        timestamp: now,
      });

      // Cleanup old cache entries
      for (const [key, value] of cacheRef.current.entries()) {
        if ((now - value.timestamp) > cacheTime) {
          cacheRef.current.delete(key);
        }
      }

      return result;
    },
    [asyncFunction, getCacheKey, staleTime, cacheTime]
  );

  const [state, actions] = useAsync(cachedAsyncFunction, options);

  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  return [
    state,
    {
      ...actions,
      invalidateCache,
    },
  ];
}

/**
 * Hook for sequential async operations
 * Executes async operations one after another
 */
export function useAsyncSequence<T>(
  asyncFunctions: (() => Promise<T>)[],
  options: {
    onStepComplete?: (index: number, result: T) => void;
    onAllComplete?: (results: T[]) => void;
    stopOnError?: boolean;
  } = {}
) {
  const { onStepComplete, onAllComplete, stopOnError = true } = options;
  
  const [state, setState] = useState({
    currentStep: -1,
    results: [] as T[],
    errors: [] as (string | null)[],
    isLoading: false,
    isComplete: false,
  });

  const execute = useCallback(async () => {
    setState({
      currentStep: 0,
      results: [],
      errors: [],
      isLoading: true,
      isComplete: false,
    });

    const results: T[] = [];
    const errors: (string | null)[] = [];

    for (let i = 0; i < asyncFunctions.length; i++) {
      setState(prev => ({ ...prev, currentStep: i }));

      try {
        const result = await asyncFunctions[i]();
        results.push(result);
        errors.push(null);
        
        onStepComplete?.(i, result);
        
        setState(prev => ({
          ...prev,
          results: [...results],
          errors: [...errors],
        }));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMessage);
        results.push(null as T);

        setState(prev => ({
          ...prev,
          results: [...results],
          errors: [...errors],
        }));

        if (stopOnError) {
          break;
        }
      }
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      isComplete: true,
      currentStep: -1,
    }));

    onAllComplete?.(results);
  }, [asyncFunctions, onStepComplete, onAllComplete, stopOnError]);

  const reset = useCallback(() => {
    setState({
      currentStep: -1,
      results: [],
      errors: [],
      isLoading: false,
      isComplete: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}