/**
 * Application Mode Configuration
 *
 * Controls whether the app runs in demo mode (pre-scripted, zero-failure)
 * or real mode (live AI integration). This is primarily for development
 * and demo purposes.
 */

export type AppMode = "demo" | "real";

export class AppModeConfig {
  private static _mode: AppMode = process.env.NODE_ENV === "production" ? "real" : "demo";

  /**
   * Get current application mode
   */
  static getMode(): AppMode {
    return this._mode;
  }

  /**
   * Set application mode (development only)
   */
  static setMode(mode: AppMode): void {
    if (process.env.NODE_ENV === "production") {
      console.warn("[AppMode] Mode switching disabled in production");
      return;
    }

    this._mode = mode;
  }

  static switchMode(): void {
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === "production") {
      console.warn("[AppMode] Mode switching disabled in production");
      return;
    }

    this._mode = this._mode === "demo" ? "real" : "demo";
  }

  /**
   * Check if currently in demo mode
   */
  static get isDemoMode(): boolean {
    return this._mode === "demo";
  }

  /**
   * Check if currently in real mode
   */
  static get isRealMode(): boolean {
    return this._mode === "real";
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
    if (this._mode === "demo") {
      return {
        mode: "demo",
        displayName: "Demo Mode",
        description: "Pre-scripted responses, zero-failure demo experience",
        emoji: "🎭",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
      };
    } else {
      return {
        mode: "real",
        displayName: "Real Mode",
        description: "Live AI integration with Vertex AI services",
        emoji: "🤖",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      };
    }
  }

  /**
   * Development helper - check if mode switching is allowed
   */
  static get canSwitchMode(): boolean {
    return process.env.NODE_ENV !== "production";
  }
}
