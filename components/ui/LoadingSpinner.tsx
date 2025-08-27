import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
}

/**
 * Loading spinner component with multiple sizes and variants
 * Can be used inline or as a full-screen overlay
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      className,
      size = 'md',
      variant = 'primary',
      text,
      fullScreen = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    };

    const variantClasses = {
      primary: 'text-blue-600',
      secondary: 'text-gray-600',
      white: 'text-white',
    };

    const textSizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    };

    const containerClasses = fullScreen
      ? [
          'fixed inset-0 z-50',
          'bg-white/80 backdrop-blur-sm',
          'flex items-center justify-center',
          'min-h-screen',
        ]
      : [
          'flex items-center justify-center',
        ];

    const Spinner = () => (
      <svg
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="img"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <div
        ref={ref}
        className={cn(containerClasses, className)}
        role="status"
        aria-live="polite"
        {...props}
      >
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          
          {text && (
            <p
              className={cn(
                'font-medium',
                textSizeClasses[size],
                variant === 'white' ? 'text-white' : 'text-gray-700'
              )}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Inline loading spinner for buttons and small spaces
 */
export const InlineSpinner = forwardRef<
  HTMLDivElement,
  Omit<LoadingSpinnerProps, 'fullScreen' | 'text'>
>(({ size = 'sm', ...props }, ref) => {
  return (
    <LoadingSpinner
      ref={ref}
      size={size}
      className="inline-flex"
      {...props}
    />
  );
});

InlineSpinner.displayName = 'InlineSpinner';

/**
 * Page loading overlay
 */
export const PageLoader = forwardRef<
  HTMLDivElement,
  Pick<LoadingSpinnerProps, 'text' | 'className'>
>(({ text = 'Loading...', ...props }, ref) => {
  return (
    <LoadingSpinner
      ref={ref}
      size="lg"
      variant="primary"
      text={text}
      fullScreen={true}
      {...props}
    />
  );
});

PageLoader.displayName = 'PageLoader';