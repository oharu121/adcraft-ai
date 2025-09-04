import { useState, useCallback } from 'react';

export interface ToastData {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  showCloseButton?: boolean;
}

export interface UseToastReturn {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccessToast: (message: string, title?: string, duration?: number) => string;
  showErrorToast: (message: string, title?: string, duration?: number) => string;
  showWarningToast: (message: string, title?: string, duration?: number) => string;
  showInfoToast: (message: string, title?: string, duration?: number) => string;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>): string => {
    const id = generateId();
    const newToast: ToastData = {
      id,
      duration: 5000,
      showCloseButton: true,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, [generateId]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const showSuccessToast = useCallback((
    message: string, 
    title?: string, 
    duration: number = 4000
  ): string => {
    return showToast({ message, title, type: 'success', duration });
  }, [showToast]);

  const showErrorToast = useCallback((
    message: string, 
    title?: string, 
    duration: number = 6000
  ): string => {
    return showToast({ message, title, type: 'error', duration });
  }, [showToast]);

  const showWarningToast = useCallback((
    message: string, 
    title?: string, 
    duration: number = 5000
  ): string => {
    return showToast({ message, title, type: 'warning', duration });
  }, [showToast]);

  const showInfoToast = useCallback((
    message: string, 
    title?: string, 
    duration: number = 4000
  ): string => {
    return showToast({ message, title, type: 'info', duration });
  }, [showToast]);

  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
  };
};