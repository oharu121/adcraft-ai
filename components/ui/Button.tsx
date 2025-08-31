import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'magical' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shimmer?: boolean;
  glow?: boolean;
}

/**
 * Reusable Button component with multiple variants and sizes
 * Supports loading states, icons, and full accessibility
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'magical',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      shimmer = false,
      glow = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center rounded-lg font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'select-none relative overflow-hidden',
      'transition-all duration-300 ease-out',
    ];

    const variantClasses = {
      primary: [
        'bg-blue-600 text-white border border-blue-600',
        'hover:bg-blue-700 hover:border-blue-700 hover:shadow-lg',
        'focus:ring-blue-500',
        'active:bg-blue-800 active:scale-95',
      ],
      secondary: [
        'bg-gray-100 text-gray-900 border border-gray-200',
        'hover:bg-gray-200 hover:border-gray-300 hover:shadow-md',
        'focus:ring-gray-500',
        'active:bg-gray-300 active:scale-95',
      ],
      outline: [
        'bg-transparent text-blue-600 border border-blue-600',
        'hover:bg-blue-50 hover:shadow-md',
        'focus:ring-blue-500',
        'active:bg-blue-100 active:scale-95',
      ],
      ghost: [
        'bg-transparent text-gray-700 border border-transparent',
        'hover:bg-gray-100 hover:shadow-md',
        'focus:ring-gray-500',
        'active:bg-gray-200 active:scale-95',
      ],
      destructive: [
        'bg-red-600 text-white border border-red-600',
        'hover:bg-red-700 hover:border-red-700 hover:shadow-lg',
        'focus:ring-red-500',
        'active:bg-red-800 active:scale-95',
      ],
      magical: [
        'magical-button text-white font-semibold',
        'focus:ring-purple-500',
        'active:scale-95',
      ],
      glass: [
        'glass-card text-white font-semibold',
        'hover:shadow-lg hover:scale-105',
        'focus:ring-purple-500',
        'active:scale-95',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-2.5 text-base gap-2',
      xl: 'px-8 py-3 text-lg gap-2.5',
    };

    const isDisabled = disabled || isLoading;

    const shimmerClasses = shimmer 
      ? ['before:absolute', 'before:inset-0', 'before:bg-gradient-to-r', 
         'before:from-transparent', 'before:via-white/20', 'before:to-transparent',
         'before:translate-x-[-100%]', 'before:transition-transform', 'before:duration-700',
         'hover:before:translate-x-[100%]']
      : [];

    const glowClasses = glow 
      ? ['hover:shadow-2xl', 'hover:shadow-purple-500/50']
      : [];

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          shimmerClasses,
          glowClasses,
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