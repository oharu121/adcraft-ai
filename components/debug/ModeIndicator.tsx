'use client';

import { useState, useEffect } from 'react';
import { AppModeConfig } from '@/lib/config/app-mode';

interface ModeInfo {
  mode: 'demo' | 'real';
  displayName: string;
  description: string;
  emoji: string;
  bgColor: string;
  textColor: string;
}

/**
 * Mode Indicator Component
 * 
 * Shows current application mode on the home page.
 * Only visible in development environment.
 */
export function ModeIndicator() {
  const [modeInfo, setModeInfo] = useState<ModeInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Get initial mode info
    const info = AppModeConfig.getModeInfo();
    setModeInfo(info);
    setIsVisible(true);

    // Optional: Poll for mode changes (in case it's changed via API)
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/debug/mode');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const currentInfo = AppModeConfig.getModeInfo();
            setModeInfo(currentInfo);
          }
        }
      } catch (error) {
        // Silently ignore - mode indicator is not critical
        console.debug('Mode indicator update failed:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !modeInfo) {
    return null;
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${modeInfo.bgColor} ${modeInfo.textColor} border border-current/20`}>
      <span className="mr-1">{modeInfo.emoji}</span>
      <span className="font-semibold">{modeInfo.displayName}</span>
      
      {/* Tooltip on hover */}
      <div className="group relative">
        <span className="ml-1 cursor-help">ℹ️</span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          {modeInfo.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Development Mode Toggle Component
 * 
 * Provides a toggle switch for developers to change modes.
 * Only visible in development environment.
 */
export function ModeToggle() {
  const [modeInfo, setModeInfo] = useState<ModeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const info = AppModeConfig.getModeInfo();
    setModeInfo(info);
    setIsVisible(true);
  }, []);

  const switchMode = async () => {
    if (!modeInfo || isLoading) return;

    setIsLoading(true);
    try {
      const newMode = modeInfo.mode === 'demo' ? 'real' : 'demo';
      
      const response = await fetch('/api/debug/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: newMode })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state immediately
          AppModeConfig.setMode(newMode);
          const updatedInfo = AppModeConfig.getModeInfo();
          setModeInfo(updatedInfo);
          
          // Force a clean page reload to reinitialize everything with new mode
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to switch mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible || !modeInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg max-w-xs z-50">
      <div className="text-sm font-medium mb-2 text-gray-700">
        Developer Controls
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">Current Mode:</span>
        <ModeIndicator />
      </div>
      
      <button
        onClick={switchMode}
        disabled={isLoading}
        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isLoading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : modeInfo.mode === 'demo'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Switching...
          </span>
        ) : (
          `Switch to ${modeInfo.mode === 'demo' ? '🤖 Real' : '🎭 Demo'} Mode`
        )}
      </button>
      
      <div className="text-xs text-gray-500 mt-2">
        {modeInfo.mode === 'demo' 
          ? '⚡ Zero API costs, perfect demos' 
          : '💸 Live AI, real costs'
        }
      </div>
    </div>
  );
}