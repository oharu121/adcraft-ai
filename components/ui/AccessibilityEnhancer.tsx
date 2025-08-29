'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useViewport } from '@/hooks';

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  focusRingVisible: boolean;
  screenReaderOptimized: boolean;
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  isAccessibilityMode: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') {
      return {
        reduceMotion: false,
        highContrast: false,
        fontSize: 'medium',
        focusRingVisible: false,
        screenReaderOptimized: false
      };
    }

    // Detect accessibility preferences from browser/system
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Try to load from localStorage
    const saved = localStorage.getItem('accessibility-settings');
    const savedSettings = saved ? JSON.parse(saved) : {};

    return {
      reduceMotion,
      highContrast,
      fontSize: 'medium',
      focusRingVisible: false,
      screenReaderOptimized: false,
      ...savedSettings
    };
  });

  const { isMobile } = useViewport();

  const updateSettings = React.useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
      }
      
      return newSettings;
    });
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Reduce motion
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    
    // Focus rings
    root.classList.toggle('focus-visible', settings.focusRingVisible);
    
    // Screen reader optimizations
    root.classList.toggle('screen-reader-optimized', settings.screenReaderOptimized);
    
  }, [settings]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)')
    ];

    const handleMotionChange = (e: MediaQueryListEvent) => {
      updateSettings({ reduceMotion: e.matches });
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      updateSettings({ highContrast: e.matches });
    };

    mediaQueries[0].addEventListener('change', handleMotionChange);
    mediaQueries[1].addEventListener('change', handleContrastChange);

    return () => {
      mediaQueries[0].removeEventListener('change', handleMotionChange);
      mediaQueries[1].removeEventListener('change', handleContrastChange);
    };
  }, [updateSettings]);

  const isAccessibilityMode = settings.reduceMotion || 
                              settings.highContrast || 
                              settings.screenReaderOptimized ||
                              settings.fontSize !== 'medium';

  return (
    <AccessibilityContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        isAccessibilityMode 
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

interface SkipToContentProps {
  targetId: string;
  className?: string;
}

export function SkipToContent({ targetId, className }: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-blue-600 text-white px-4 py-2 rounded-lg z-50 ${className || ''}`}
    >
      Skip to main content
    </a>
  );
}

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={`sr-only ${className || ''}`}>
      {children}
    </span>
  );
}

interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ 
  children, 
  priority = 'polite', 
  className 
}: LiveRegionProps) {
  return (
    <div 
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className || ''}`}
    >
      {children}
    </div>
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function FocusTrap({ children, enabled = true }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}

export default AccessibilityProvider;