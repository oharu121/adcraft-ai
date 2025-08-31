import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline' | 'magical' | 'glass';
  enchanted?: boolean;
  glow?: boolean;
}

/**
 * Form input component with validation, labels, and character counting
 * Supports various styles and accessibility features
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      showCharacterCount = false,
      leftIcon,
      rightIcon,
      variant = 'magical',
      enchanted = false,
      glow = false,
      maxLength,
      value,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const currentValue = value !== undefined ? value : internalValue;
    const characterCount = String(currentValue).length;

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = [
      // Base styles
      'block w-full transition-all duration-300',
      'placeholder:text-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const variantClasses = {
      default: [
        'border border-gray-300 rounded-lg px-3 py-2',
        'bg-white text-gray-900',
        'hover:border-gray-400',
        'focus:border-blue-500 focus:ring-blue-500',
      ],
      filled: [
        'border border-transparent rounded-lg px-3 py-2',
        'bg-gray-50 text-gray-900',
        'hover:bg-gray-100',
        'focus:bg-white focus:border-blue-500 focus:ring-blue-500',
      ],
      outline: [
        'border-2 border-gray-200 rounded-lg px-3 py-2',
        'bg-transparent text-gray-900',
        'hover:border-gray-300',
        'focus:border-blue-500 focus:ring-blue-500',
      ],
      magical: [
        'magical-input px-4 py-3 text-white',
        'placeholder:text-gray-300',
        'focus:ring-purple-500 focus:ring-opacity-50',
      ],
      glass: [
        'glass-card px-4 py-3 text-white',
        'placeholder:text-gray-300',
        'hover:bg-opacity-10',
        'focus:ring-purple-500 focus:ring-opacity-50',
      ],
    };

    const errorClasses = error
      ? [
          'border-red-500 focus:border-red-500 focus:ring-red-500',
          'bg-red-50',
        ]
      : [];

    const iconPadding = {
      left: leftIcon ? 'pl-10' : '',
      right: rightIcon ? 'pr-10' : '',
    };

    const enchantedClasses = enchanted 
      ? ['relative overflow-hidden',
         'after:absolute after:inset-0 after:rounded-lg',
         'after:bg-gradient-to-r after:from-purple-400/20 after:via-pink-400/20 after:to-purple-400/20',
         'after:translate-x-[-100%] after:transition-transform after:duration-1000',
         'focus-within:after:translate-x-[100%]']
      : [];

    const glowClasses = glow 
      ? ['focus-within:shadow-lg focus-within:shadow-purple-500/30']
      : [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      props.onChange?.(e);
    };

    const labelColor = variant === 'magical' || variant === 'glass' 
      ? error ? 'text-red-400' : 'text-gray-200'
      : error ? 'text-red-700' : 'text-gray-700';

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              labelColor,
              disabled && 'opacity-50'
            )}
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className={cn('relative', enchantedClasses, glowClasses)}>
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input Element */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              baseClasses,
              variantClasses[variant],
              errorClasses,
              iconPadding.left,
              iconPadding.right,
              className
            )}
            value={currentValue}
            onChange={handleChange}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {/* Helper Text and Character Count */}
        <div className="mt-1 flex justify-between items-center">
          <div className="flex-1">
            {/* Error Message */}
            {error && (
              <p
                id={`${inputId}-error`}
                className="text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Helper Text */}
            {!error && helperText && (
              <p
                id={`${inputId}-helper`}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharacterCount && maxLength && (
            <div
              className={cn(
                'text-xs ml-2',
                characterCount > maxLength * 0.9
                  ? 'text-orange-500'
                  : characterCount === maxLength
                    ? 'text-red-500'
                    : 'text-gray-400'
              )}
              aria-live="polite"
            >
              {characterCount}/{maxLength}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';