import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ToastProps {
  id?: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: (id?: string) => void;
  showCloseButton?: boolean;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  showCloseButton = true,
  position = 'top-center'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-600',
      border: 'border-green-500',
      text: 'text-white',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-600',
      border: 'border-red-500',
      text: 'text-white',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-600',
      border: 'border-yellow-500',
      text: 'text-white',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-600',
      border: 'border-blue-500',
      text: 'text-white',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const positionStyles = {
    'top-right': 'top-4 right-0',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-0',
    'bottom-right': 'bottom-4 right-0',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-0'
  };

  const animationClasses = isExiting 
    ? 'animate-fade-out'
    : position.includes('top') 
      ? 'animate-slide-down' 
      : 'animate-slide-up';

  const currentStyle = typeStyles[type];

  return (
    <div
      className={cn(
        'fixed z-50 max-w-md mx-4',
        positionStyles[position],
        animationClasses
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className={cn(
          'px-6 py-4 rounded-lg shadow-lg border',
          currentStyle.bg,
          currentStyle.border,
          currentStyle.text,
          'backdrop-blur-sm'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {currentStyle.icon}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="font-semibold mb-1 leading-tight">
                {title}
              </div>
            )}
            <div className={cn(
              'text-sm leading-relaxed',
              title ? 'opacity-90' : 'font-medium'
            )}>
              {message}
            </div>
          </div>
          
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={handleClose}
              className={cn(
                'flex-shrink-0 ml-2 p-1 rounded-full',
                'hover:bg-white/20 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-white/50'
              )}
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Progress Bar */}
        {duration > 0 && (
          <div className="mt-3 -mb-1 -mx-6">
            <div className="h-1 bg-white/30 rounded-b-lg overflow-hidden">
              <div 
                className="h-full bg-white/60 w-full"
                style={{
                  transformOrigin: 'center',
                  animation: `toast-progress-center ${duration}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Container for multiple toasts
export interface ToastContainerProps {
  toasts: (ToastProps & { id: string })[];
  onRemoveToast: (id: string) => void;
  position?: ToastProps['position'];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast,
  position = 'top-center'
}) => {
  if (toasts.length === 0) return null;

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          position={position}
          onClose={onRemoveToast}
        />
      ))}
    </>
  );
};