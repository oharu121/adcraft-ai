'use client';

import { useState, useCallback, forwardRef } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';
import type { Dictionary } from '@/lib/dictionaries';

export interface GenerateButtonProps {
  onGenerate: () => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  prompt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  estimatedCost?: number;
  remainingBudget?: number;
  showCostInfo?: boolean;
  dict: Dictionary;
}

/**
 * Video generation button with loading states and cost information
 * Handles async generation requests with proper feedback
 */
export const GenerateButton = forwardRef<HTMLButtonElement, GenerateButtonProps>(
  (
    {
      onGenerate,
      disabled = false,
      isLoading = false,
      prompt = '',
      className,
      size = 'lg',
      estimatedCost = 1.5,
      remainingBudget,
      showCostInfo = true,
      dict,
      ...props
    },
    ref
  ) => {
    const [localLoading, setLocalLoading] = useState(false);

    const promptLength = prompt.trim().length;
    const isPromptValid = promptLength >= 10 && promptLength <= 500;
    const isDisabled = disabled || isLoading || localLoading || !isPromptValid;
    const displayLoading = isLoading || localLoading;

    const handleClick = useCallback(async () => {
      if (isDisabled) return;

      setLocalLoading(true);
      try {
        await Promise.resolve(onGenerate());
      } catch (error) {
        console.error('Generation failed:', error);
      } finally {
        setLocalLoading(false);
      }
    }, [onGenerate, isDisabled]);

    const getButtonText = () => {
      if (displayLoading) return dict.videoGenerator.generating;
      if (!isPromptValid && promptLength === 0) return dict.errors.promptEmpty;
      if (!isPromptValid && promptLength < 10) return dict.validation.minLength.replace('{min}', '10');
      if (!isPromptValid && promptLength > 500) return dict.validation.maxLength.replace('{max}', '500');
      return dict.videoGenerator.generateVideo;
    };

    const getButtonVariant = (): 'magical' | 'glass' | 'secondary' => {
      if (!isPromptValid) return 'secondary';
      return 'magical';
    };

    const LoadingIcon = () => (
      <LoadingSpinner size="sm" variant="white" />
    );

    const GenerateIcon = () => (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000-6h-1m1 6V9a3 3 0 003-3m-3 6h3m-3 0l3-3m-3 3l3 3"
        />
      </svg>
    );

    return (
      <div className={cn('w-full space-y-3', className)}>
        {/* Cost Information */}
        {showCostInfo && (
          <div className="flex items-center justify-between text-sm glass-card rounded-xl p-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              <span className="text-gray-200">
                Estimated cost: <strong className="text-emerald-300">${estimatedCost.toFixed(2)}</strong>
              </span>
            </div>

            {remainingBudget !== undefined && (
              <div className="text-gray-200">
                Budget remaining: <strong className="text-emerald-300">${remainingBudget.toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Generation Progress */}
        {displayLoading && (
          <div className="glass-card rounded-xl p-6 border border-yellow-400/30">
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" variant="white" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-300 mb-2">
                  Processing your request...
                </h4>
                <p className="text-xs text-gray-300">
                  This usually takes 5-8 minutes. You can track progress on the next page.
                </p>
              </div>
            </div>

            <div className="mt-4 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse" style={{ width: '30%' }} />
            </div>
          </div>
        )}

        {/* Main Generate Button */}
        <Button
          ref={ref}
          type="button"
          size={size}
          variant={getButtonVariant()}
          shimmer={isPromptValid && !displayLoading}
          glow={isPromptValid}
          disabled={isDisabled}
          isLoading={displayLoading}
          onClick={handleClick}
          className={cn(
            'w-full font-bold text-lg py-4 px-8',
            displayLoading && 'cursor-wait',
            !isPromptValid && !displayLoading && 'cursor-not-allowed'
          )}
          leftIcon={displayLoading ? <LoadingIcon /> : <GenerateIcon />}
          aria-describedby="generation-info"
          {...props}
        >
          {getButtonText()}
        </Button>

        {/* Additional Information */}
        <div id="generation-info" className="text-center">
          {!displayLoading && isPromptValid && (
            <p className="text-sm text-gray-300">
              Click to start generating your 15-second video
            </p>
          )}

          {!displayLoading && !isPromptValid && promptLength > 0 && (
            <p className="text-sm text-orange-400">
              {promptLength < 10
                ? `Add ${10 - promptLength} more characters to continue`
                : `Remove ${promptLength - 500} characters to continue`}
            </p>
          )}

          {displayLoading && (
            <p className="text-sm text-gray-300">
              Processing time: ~5-8 minutes • Cost: ${estimatedCost.toFixed(2)}
            </p>
          )}
        </div>

        {/* Budget Warning */}
        {remainingBudget !== undefined && estimatedCost > remainingBudget && (
          <div className="glass-card border border-red-400/50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-sm font-medium text-red-300">
                Insufficient Budget
              </span>
            </div>
            <p className="text-sm text-red-200">
              This request costs ${estimatedCost.toFixed(2)} but you only have ${remainingBudget.toFixed(2)} remaining.
            </p>
          </div>
        )}
      </div>
    );
  }
);

GenerateButton.displayName = 'GenerateButton';