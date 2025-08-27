import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Reusable Button component with multiple variants and sizes
 * Supports loading states, icons, and full accessibility
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center rounded-lg font-medium transition-all',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Prevent text selection
      'select-none',
    ];

    const variantClasses = {
      primary: [
        'bg-blue-600 text-white border border-blue-600',
        'hover:bg-blue-700 hover:border-blue-700',
        'focus:ring-blue-500',
        'active:bg-blue-800',
      ],
      secondary: [
        'bg-gray-100 text-gray-900 border border-gray-200',
        'hover:bg-gray-200 hover:border-gray-300',
        'focus:ring-gray-500',
        'active:bg-gray-300',
      ],
      outline: [
        'bg-transparent text-blue-600 border border-blue-600',
        'hover:bg-blue-50',
        'focus:ring-blue-500',
        'active:bg-blue-100',
      ],
      ghost: [
        'bg-transparent text-gray-700 border border-transparent',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
        'active:bg-gray-200',
      ],
      destructive: [
        'bg-red-600 text-white border border-red-600',
        'hover:bg-red-700 hover:border-red-700',
        'focus:ring-red-500',
        'active:bg-red-800',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-2.5 text-base gap-2',
      xl: 'px-8 py-3 text-lg gap-2.5',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}
        
        {!isLoading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        
        <span>{children}</span>
        
        {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';