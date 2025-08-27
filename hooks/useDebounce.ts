'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updating the debounced value until after the specified delay
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debounced callbacks
 * Returns a debounced version of the provided callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...dependencies]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook for debounced search functionality
 * Provides search state management with automatic debouncing
 */
export function useDebouncedSearch(
  searchFunction: (query: string) => Promise<any[]> | any[],
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, delay);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await Promise.resolve(searchFunction(searchQuery));
      setResults(searchResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchFunction]);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
  };
}

/**
 * Hook for debounced form validation
 * Validates form fields after user stops typing
 */
export function useDebouncedValidation<T>(
  values: T,
  validator: (values: T) => Record<string, string> | Promise<Record<string, string>>,
  delay: number = 500
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValues = useDebounce(values, delay);

  useEffect(() => {
    const validate = async () => {
      setIsValidating(true);
      
      try {
        const validationErrors = await Promise.resolve(validator(debouncedValues));
        setErrors(validationErrors);
      } catch (error) {
        console.warn('Validation error:', error);
        setErrors({});
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [debouncedValues, validator]);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    isValidating,
  };
}

/**
 * Hook for debounced auto-save functionality
 * Automatically saves data after user stops making changes
 */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void> | void,
  delay: number = 2000,
  options: {
    enabled?: boolean;
    onSave?: () => void;
    onError?: (error: string) => void;
  } = {}
) {
  const { enabled = true, onSave, onError } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const debouncedData = useDebounce(data, delay);
  const initialDataRef = useRef<T>(data);
  const hasChangesRef = useRef(false);

  // Track if data has changed from initial value
  useEffect(() => {
    hasChangesRef.current = JSON.stringify(data) !== JSON.stringify(initialDataRef.current);
  }, [data]);

  const save = useCallback(async (dataToSave: T) => {
    if (!enabled || !hasChangesRef.current) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await Promise.resolve(saveFunction(dataToSave));
      setLastSaved(new Date());
      initialDataRef.current = dataToSave;
      hasChangesRef.current = false;
      onSave?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setSaveError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [enabled, saveFunction, onSave, onError]);

  useEffect(() => {
    save(debouncedData);
  }, [debouncedData, save]);

  const forceSave = useCallback(() => {
    save(data);
  }, [data, save]);

  return {
    isSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges: hasChangesRef.current,
    forceSave,
  };
}