'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing localStorage with TypeScript support and SSR safety
 * Provides automatic serialization/deserialization and change synchronization
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    syncAcrossTabs?: boolean;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true,
  } = options;

  // Get value from localStorage on client side
  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize value from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      setStoredValue(getStoredValue());
      setIsInitialized(true);
    }
  }, [getStoredValue, isInitialized]);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = typeof value === 'function' 
          ? (value as (prev: T) => T)(storedValue)
          : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(valueToStore));
          
          // Dispatch custom event for cross-tab synchronization
          if (syncAcrossTabs) {
            window.dispatchEvent(
              new CustomEvent('localStorage-change', {
                detail: { key, value: valueToStore },
              })
            );
          }
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue, syncAcrossTabs]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent('localStorage-change', {
              detail: { key, value: null },
            })
          );
        }
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, syncAcrossTabs]);

  // Listen for cross-tab changes
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        if (e.detail.value === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(e.detail.value);
        }
      }
    };

    const handleNativeStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error deserializing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('localStorage-change', handleStorageChange as EventListener);
    window.addEventListener('storage', handleNativeStorageChange);

    return () => {
      window.removeEventListener('localStorage-change', handleStorageChange as EventListener);
      window.removeEventListener('storage', handleNativeStorageChange);
    };
  }, [key, initialValue, deserialize, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing user preferences in localStorage
 */
export function useUserPreferences() {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage('adcraft-preferences', {
    theme: 'light' as 'light' | 'dark',
    language: 'en' as 'en' | 'ja',
    autoPlayVideos: true,
    showCostInfo: true,
    defaultVideoStyle: 'realistic' as string,
    defaultVideoDuration: 15,
    defaultAspectRatio: '16:9' as string,
  });

  const updatePreference = useCallback(<K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, [setPreferences]);

  return {
    preferences,
    updatePreference,
    clearPreferences,
  };
}

/**
 * Hook for managing recent prompts in localStorage
 */
export function useRecentPrompts(maxPrompts: number = 10) {
  const [prompts, setPrompts] = useLocalStorage<string[]>('adcraft-recent-prompts', []);

  const addPrompt = useCallback((prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || trimmedPrompt.length < 10) {
      return;
    }

    setPrompts(prev => {
      const filtered = prev.filter(p => p !== trimmedPrompt);
      return [trimmedPrompt, ...filtered].slice(0, maxPrompts);
    });
  }, [setPrompts, maxPrompts]);

  const removePrompt = useCallback((prompt: string) => {
    setPrompts(prev => prev.filter(p => p !== prompt));
  }, [setPrompts]);

  const clearPrompts = useCallback(() => {
    setPrompts([]);
  }, [setPrompts]);

  return {
    prompts,
    addPrompt,
    removePrompt,
    clearPrompts,
  };
}

/**
 * Hook for managing session data in localStorage
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue, removeValue] = useLocalStorage(
    `session-${key}`,
    initialValue,
    { syncAcrossTabs: false }
  );

  // Auto-cleanup session data after 24 hours
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionKey = `session-${key}-timestamp`;
    const timestamp = localStorage.getItem(sessionKey);
    const now = Date.now();

    if (timestamp) {
      const age = now - parseInt(timestamp, 10);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        removeValue();
        localStorage.removeItem(sessionKey);
      }
    } else {
      localStorage.setItem(sessionKey, now.toString());
    }
  }, [key, removeValue]);

  return [value, setValue, removeValue];
}