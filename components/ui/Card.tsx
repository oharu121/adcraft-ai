import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'header';
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'main' | 'section';
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'footer';
}

/**
 * Main Card component - flexible content container
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      // Base styles
      'rounded-lg transition-all duration-200',
      'bg-white',
    ];

    const variantClasses = {
      default: [
        'border border-gray-200',
      ],
      outlined: [
        'border-2 border-gray-200',
      ],
      elevated: [
        'shadow-lg border border-gray-100',
        hover && 'hover:shadow-xl',
      ],
      filled: [
        'bg-gray-50 border border-gray-100',
      ],
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    const hoverClasses = hover
      ? [
          'cursor-pointer',
          'hover:border-gray-300',
          'active:scale-[0.98]',
        ]
      : [];

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          hoverClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

/**
 * Card Header component - for titles and actions
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'flex items-center justify-between',
          'pb-3 mb-3 border-b border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

/**
 * Card Content component - main content area
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('flex-1', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

/**
 * Card Footer component - for actions and secondary content
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-2',
          'pt-3 mt-3 border-t border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

/**
 * Card Title component - semantic heading for cards
 */
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }
>(({ className, level = 2, children, ...props }, ref) => {
  const Component = `h${level}` as const;
  
  return (
    <Component
      ref={ref}
      className={cn(
        'text-lg font-semibold text-gray-900',
        'leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

/**
 * Card Description component - subtitle or description text
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        'text-sm text-gray-600',
        'mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});

// Set display names for debugging
Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';