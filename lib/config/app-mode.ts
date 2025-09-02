/**
 * Application Mode Configuration
 * 
 * Controls whether the app runs in demo mode (pre-scripted, zero-failure)
 * or real mode (live AI integration). This is primarily for development
 * and demo purposes.
 */

export type AppMode = 'demo' | 'real';

export class AppModeConfig {
  private static _mode: AppMode;
  private static _initialized = false;

  /**
   * Initialize the mode configuration
   */
  private static initialize(): void {
    if (this._initialized) return;

    // Check for runtime override first (client-side only)
    if (typeof window !== 'undefined') {
      const runtimeMode = sessionStorage.getItem('app-mode') as AppMode;
      if (runtimeMode && ['demo', 'real'].includes(runtimeMode)) {
        this._mode = runtimeMode;
        console.log(`[AppMode] Initialized with runtime override: ${this._mode} mode`);
        this._initialized = true;
        return;
      }
    }

    // Fall back to environment variable
    const envMode = process.env.APP_MODE as AppMode;
    this._mode = envMode === 'real' ? 'real' : 'demo';
    this._initialized = true;

    if (typeof window === 'undefined') {
      console.log(`[AppMode] Initialized in ${this._mode} mode`);
    }
  }

  /**
   * Get current application mode
   */
  static get mode(): AppMode {
    this.initialize();
    return this._mode;
  }

  /**
   * Set application mode (development only)
   */
  static setMode(mode: AppMode): void {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[AppMode] Mode switching disabled in production');
      return;
    }

    this._mode = mode;
    
    // Persist to sessionStorage for runtime switching
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app-mode', mode);
    }
    
    console.log(`[AppMode] Switched to ${mode} mode`);
  }

  /**
   * Check if currently in demo mode
   */
  static get isDemoMode(): boolean {
    this.initialize();
    return this._mode === 'demo';
  }

  /**
   * Check if currently in real mode
   */
  static get isRealMode(): boolean {
    this.initialize();
    return this._mode === 'real';
  }

  /**
   * Get mode display information
   */
  static getModeInfo(): {
    mode: AppMode;
    displayName: string;
    description: string;
    emoji: string;
    bgColor: string;
    textColor: string;
  } {
    const mode = this.mode;
    
    if (mode === 'demo') {
      return {
        mode: 'demo',
        displayName: 'Demo Mode',
        description: 'Pre-scripted responses, zero-failure demo experience',
        emoji: '🎭',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    } else {
      return {
        mode: 'real',
        displayName: 'Real Mode',
        description: 'Live AI integration with Vertex AI services',
        emoji: '🤖',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      };
    }
  }

  /**
   * Development helper - check if mode switching is allowed
   */
  static get canSwitchMode(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}