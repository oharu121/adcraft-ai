'use client';

import { useState, useCallback, forwardRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { Dictionary } from '@/lib/dictionaries';

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
  className?: string;
  onSubmit?: (value: string) => void;
  showSuggestions?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  dict: Dictionary;
}

/**
 * Specialized text input for video generation prompts
 * Features character counting, suggestions, and prompt validation
 */
export const PromptInput = forwardRef<HTMLInputElement, PromptInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      maxLength = 500,
      disabled = false,
      error,
      className,
      onSubmit,
      showSuggestions = true,
      suggestions = [],
      onSuggestionClick,
      dict,
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);

    const characterCount = value.length;
    const remainingCharacters = maxLength - characterCount;
    const isNearLimit = characterCount > maxLength * 0.8;
    const isOverLimit = characterCount > maxLength;

    // Default prompt suggestions
    const defaultSuggestions = [
      'A serene mountain landscape at sunset with flowing clouds',
      'Urban cityscape with bustling traffic and neon lights at night',
      'Ocean waves crashing against rocky cliffs in slow motion',
      'Person walking through a colorful autumn forest path',
      'Close-up of coffee being poured into a white ceramic mug',
      'Aerial view of a winding river through green valleys',
    ];

    const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= maxLength) {
          onChange(newValue);
        }
      },
      [onChange, maxLength]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
          e.preventDefault();
          if (value.trim() && !isOverLimit) {
            onSubmit(value.trim());
          }
        }
      },
      [onSubmit, value, isOverLimit]
    );

    const handleSuggestionClick = useCallback(
      (suggestion: string) => {
        onChange(suggestion);
        onSuggestionClick?.(suggestion);
      },
      [onChange, onSuggestionClick]
    );

    const getCharacterCountColor = () => {
      if (isOverLimit) return 'text-red-500';
      if (isNearLimit) return 'text-orange-500';
      return 'text-gray-400';
    };

    return (
      <div className={cn('w-full space-y-4', className)}>
        {/* Main Input */}
        <div className="relative">
          <Input
            ref={ref}
            variant="magical"
            enchanted={true}
            glow={focused}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder || dict.home.placeholder}
            disabled={disabled}
            error={error}
            maxLength={maxLength}
            showCharacterCount={true}
            className="text-base py-4 px-6 min-h-[4rem]"
            aria-label="Video generation prompt"
            aria-describedby="prompt-help"
          />

          {/* Character count display */}
          <div className="flex justify-between items-center mt-2 px-1">
            <div className="text-xs text-gray-300" id="prompt-help">
              Describe your video idea with specific visual details for best results
            </div>
            <div className={cn('text-xs font-medium', 
              isOverLimit ? 'text-red-400' : 
              isNearLimit ? 'text-orange-400' : 'text-gray-400'
            )}>
              {remainingCharacters} characters remaining
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && displaySuggestions.length > 0 && (
          <Card variant="glass" padding="lg">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <h3 className="text-sm font-medium text-white">
                  Try these prompt ideas:
                </h3>
              </div>

              <div className="grid gap-3">
                {displaySuggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      'text-left p-4 glass-card rounded-lg',
                      'hover:bg-white/10 hover:border-purple-400/50',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500',
                      'transition-all duration-300 interactive-lift',
                      'text-sm text-gray-200',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={disabled}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-300 text-center pt-3 border-t border-gray-600">
                Click any suggestion to use it as your prompt
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quality Tips */}
        <Card variant="glass" padding="lg">
          <CardContent>
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 text-emerald-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-white mb-3">
                  Tips for better videos:
                </h4>
                <ul className="text-sm text-gray-200 space-y-2 list-disc list-inside">
                  <li>Include specific camera angles (close-up, wide shot, overhead)</li>
                  <li>Describe lighting (golden hour, soft light, dramatic shadows)</li>
                  <li>Add motion details (slow-motion, smooth movement, flowing)</li>
                  <li>Specify style (cinematic, realistic, artistic)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

PromptInput.displayName = 'PromptInput';