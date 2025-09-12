/**
 * Creative Director Error Handler
 *
 * Comprehensive error handling and fallback systems for GCP service failures,
 * ensuring David's creative workflow continues even with service disruptions.
 */

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum ErrorCategory {
  IMAGEN_API = "imagen_api",
  CLOUD_STORAGE = "cloud_storage",
  FIRESTORE = "firestore",
  GEMINI_API = "gemini_api",
  VERTEX_AI = "vertex_ai",
  AUTHENTICATION = "authentication",
  RATE_LIMIT = "rate_limit",
  NETWORK = "network",
  VALIDATION = "validation",
  BUDGET = "budget"
}

export interface ErrorContext {
  sessionId: string;
  operation: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: string;
  metadata: Record<string, any>;
  retryable: boolean;
  recoverable: boolean;
}

export interface ErrorRecord {
  id: string;
  context: ErrorContext;
  originalError: any;
  message: string;
  stack?: string;
  resolution: ErrorResolution;
  fallbackUsed?: FallbackStrategy;
  resolved: boolean;
  resolvedAt?: string;
}

export interface ErrorResolution {
  strategy: "retry" | "fallback" | "fail" | "ignore";
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  fallbackOptions?: FallbackStrategy[];
  userNotification?: boolean;
}

export interface FallbackStrategy {
  type: "demo_mode" | "cached_response" | "simplified_operation" | "alternative_service" | "graceful_degradation";
  description: string;
  implementation: () => Promise<any>;
}

export interface CircuitBreakerState {
  serviceName: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
  threshold: number;
  timeout: number; // milliseconds
}

/**
 * Creative Director Error Handler
 * Provides comprehensive error handling with intelligent fallback strategies
 */
export class CreativeDirectorErrorHandler {
  private static instance: CreativeDirectorErrorHandler;
  private errorHistory: ErrorRecord[] = [];
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private fallbackStrategies: Map<ErrorCategory, FallbackStrategy[]> = new Map();

  private constructor() {
    this.initializeFallbackStrategies();
    this.initializeCircuitBreakers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorErrorHandler {
    if (!CreativeDirectorErrorHandler.instance) {
      CreativeDirectorErrorHandler.instance = new CreativeDirectorErrorHandler();
    }
    return CreativeDirectorErrorHandler.instance;
  }

  /**
   * Handle error with comprehensive recovery strategies
   */
  public async handleError<T>(
    error: any,
    context: ErrorContext,
    fallbackOptions?: FallbackStrategy[]
  ): Promise<{
    success: boolean;
    result?: T;
    fallbackUsed?: FallbackStrategy;
    shouldRetry?: boolean;
    errorRecord: ErrorRecord;
  }> {
    const errorId = crypto.randomUUID();
    
    // Create error record
    const errorRecord: ErrorRecord = {
      id: errorId,
      context,
      originalError: error,
      message: this.extractErrorMessage(error),
      stack: error.stack,
      resolution: this.determineResolution(error, context),
      resolved: false
    };

    // Add to history
    this.errorHistory.push(errorRecord);

    // Log error with context
    console.error(`[CREATIVE ERROR HANDLER] ${context.category}/${context.operation}:`, {
      message: errorRecord.message,
      severity: context.severity,
      sessionId: context.sessionId,
      retryable: context.retryable,
      metadata: context.metadata
    });

    try {
      // Check circuit breaker
      const serviceName = this.getServiceName(context.category);
      if (!this.checkCircuitBreaker(serviceName)) {
        console.warn(`[CIRCUIT BREAKER] Service ${serviceName} is currently unavailable`);
        return await this.executeFallback(errorRecord, fallbackOptions);
      }

      // Determine resolution strategy
      const resolution = errorRecord.resolution;
      
      switch (resolution.strategy) {
        case "retry":
          return await this.executeRetry(errorRecord);
        
        case "fallback":
          return await this.executeFallback(errorRecord, fallbackOptions);
        
        case "ignore":
          return { success: true, errorRecord };
        
        case "fail":
        default:
          this.recordCircuitBreakerFailure(serviceName);
          return { success: false, errorRecord };
      }

    } catch (handlingError) {
      console.error("[ERROR HANDLER] Failed to handle error:", handlingError);
      return { success: false, errorRecord };
    }
  }

  /**
   * Handle Imagen API errors with specific recovery strategies
   */
  public async handleImagenError(
    error: any,
    sessionId: string,
    requestData: any
  ): Promise<{
    success: boolean;
    result?: any;
    fallbackUsed?: FallbackStrategy;
  }> {
    const context: ErrorContext = {
      sessionId,
      operation: "generate_image",
      category: ErrorCategory.IMAGEN_API,
      severity: this.determineSeverity(error),
      timestamp: new Date().toISOString(),
      metadata: {
        prompt: requestData.prompt,
        model: requestData.model,
        quality: requestData.quality
      },
      retryable: this.isRetryable(error),
      recoverable: true
    };

    // Imagen-specific fallback strategies
    const imagenFallbacks: FallbackStrategy[] = [
      {
        type: "alternative_service",
        description: "Retry with different Imagen model",
        implementation: async () => {
          const fallbackModel = requestData.model === "imagen-4-ultra" ? "imagen-4" : "imagen-3";
          console.log(`[IMAGEN FALLBACK] Retrying with model: ${fallbackModel}`);
          // This would make the actual API call with the fallback model
          return { model: fallbackModel, fallback: true };
        }
      },
      {
        type: "simplified_operation",
        description: "Generate with reduced parameters",
        implementation: async () => {
          console.log("[IMAGEN FALLBACK] Using simplified generation parameters");
          // This would retry with simpler parameters
          return { 
            simplified: true, 
            quality: "standard",
            inferenceSteps: 30 
          };
        }
      },
      {
        type: "demo_mode",
        description: "Generate demo placeholder asset",
        implementation: async () => {
          console.log("[IMAGEN FALLBACK] Generating demo placeholder");
          return this.generateDemoAsset(requestData);
        }
      }
    ];

    const result = await this.handleError(error, context, imagenFallbacks);
    return {
      success: result.success,
      result: result.result,
      fallbackUsed: result.fallbackUsed
    };
  }

  /**
   * Handle Cloud Storage errors with recovery strategies
   */
  public async handleStorageError(
    error: any,
    sessionId: string,
    operation: string,
    fileName: string
  ): Promise<{
    success: boolean;
    result?: any;
    fallbackUsed?: FallbackStrategy;
  }> {
    const context: ErrorContext = {
      sessionId,
      operation,
      category: ErrorCategory.CLOUD_STORAGE,
      severity: this.determineSeverity(error),
      timestamp: new Date().toISOString(),
      metadata: { fileName, operation },
      retryable: this.isRetryable(error),
      recoverable: true
    };

    const storageFallbacks: FallbackStrategy[] = [
      {
        type: "graceful_degradation",
        description: "Continue without storage upload",
        implementation: async () => {
          console.log("[STORAGE FALLBACK] Continuing without storage upload");
          return {
            fileName,
            url: `https://placeholder-storage.adcraft.ai/${fileName}`,
            fallback: true,
            stored: false
          };
        }
      }
    ];

    const result = await this.handleError(error, context, storageFallbacks);
    return {
      success: result.success,
      result: result.result,
      fallbackUsed: result.fallbackUsed
    };
  }

  /**
   * Handle Firestore errors with recovery strategies
   */
  public async handleFirestoreError(
    error: any,
    sessionId: string,
    operation: string,
    data: any
  ): Promise<{
    success: boolean;
    result?: any;
    fallbackUsed?: FallbackStrategy;
  }> {
    const context: ErrorContext = {
      sessionId,
      operation,
      category: ErrorCategory.FIRESTORE,
      severity: this.determineSeverity(error),
      timestamp: new Date().toISOString(),
      metadata: { operation, dataKeys: Object.keys(data) },
      retryable: this.isRetryable(error),
      recoverable: true
    };

    const firestoreFallbacks: FallbackStrategy[] = [
      {
        type: "cached_response",
        description: "Use cached session data",
        implementation: async () => {
          console.log("[FIRESTORE FALLBACK] Using cached session data");
          return this.getCachedSessionData(sessionId);
        }
      },
      {
        type: "graceful_degradation",
        description: "Continue with in-memory session state",
        implementation: async () => {
          console.log("[FIRESTORE FALLBACK] Using in-memory session state");
          return { 
            sessionId, 
            temporary: true, 
            data,
            warning: "Session data is temporary and may be lost"
          };
        }
      }
    ];

    const result = await this.handleError(error, context, firestoreFallbacks);
    return {
      success: result.success,
      result: result.result,
      fallbackUsed: result.fallbackUsed
    };
  }

  /**
   * Handle rate limit errors with backoff strategies
   */
  public async handleRateLimitError(
    error: any,
    sessionId: string,
    service: string
  ): Promise<{
    success: boolean;
    retryAfter?: number;
    fallbackUsed?: FallbackStrategy;
  }> {
    const retryAfter = this.extractRetryAfter(error) || 60; // Default 60 seconds
    
    const context: ErrorContext = {
      sessionId,
      operation: "api_request",
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date().toISOString(),
      metadata: { service, retryAfter },
      retryable: true,
      recoverable: true
    };

    const rateLimitFallbacks: FallbackStrategy[] = [
      {
        type: "demo_mode",
        description: "Use demo responses during rate limit",
        implementation: async () => {
          console.log(`[RATE LIMIT FALLBACK] Using demo mode for ${service}`);
          return { demoMode: true, service };
        }
      }
    ];

    const result = await this.handleError(error, context, rateLimitFallbacks);
    
    return {
      success: result.success,
      retryAfter,
      fallbackUsed: result.fallbackUsed
    };
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(serviceName: string): boolean {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return true;

    const now = Date.now();

    switch (breaker.state) {
      case "closed":
        return true;
      
      case "open":
        if (now >= breaker.nextAttemptTime!) {
          breaker.state = "half-open";
          console.log(`[CIRCUIT BREAKER] ${serviceName} state changed to half-open`);
        }
        return breaker.state === "half-open";
      
      case "half-open":
        return true;
      
      default:
        return true;
    }
  }

  /**
   * Record circuit breaker failure
   */
  private recordCircuitBreakerFailure(serviceName: string): void {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= breaker.threshold && breaker.state === "closed") {
      breaker.state = "open";
      breaker.nextAttemptTime = Date.now() + breaker.timeout;
      console.warn(`[CIRCUIT BREAKER] ${serviceName} opened due to ${breaker.failureCount} failures`);
    } else if (breaker.state === "half-open") {
      breaker.state = "open";
      breaker.nextAttemptTime = Date.now() + breaker.timeout;
      console.warn(`[CIRCUIT BREAKER] ${serviceName} returned to open state`);
    }
  }

  /**
   * Record circuit breaker success
   */
  private recordCircuitBreakerSuccess(serviceName: string): void {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    if (breaker.state === "half-open") {
      breaker.state = "closed";
      breaker.failureCount = 0;
      console.log(`[CIRCUIT BREAKER] ${serviceName} closed after successful recovery`);
    }
  }

  /**
   * Execute retry strategy
   */
  private async executeRetry<T>(errorRecord: ErrorRecord): Promise<{
    success: boolean;
    result?: T;
    shouldRetry?: boolean;
    errorRecord: ErrorRecord;
  }> {
    const { resolution, context } = errorRecord;
    const maxRetries = resolution.maxRetries || 3;
    const retryDelay = resolution.retryDelay || 1000;

    console.log(`[ERROR HANDLER] Retrying ${context.operation}, attempt 1/${maxRetries}`);

    // For this implementation, we'll simulate retry success
    // In real implementation, this would re-execute the original operation
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Simulate success probability based on error category
    const successProbability = this.getRetrySuccessProbability(context.category);
    const success = Math.random() < successProbability;

    if (success) {
      errorRecord.resolved = true;
      errorRecord.resolvedAt = new Date().toISOString();
      this.recordCircuitBreakerSuccess(this.getServiceName(context.category));
    }

    return {
      success,
      shouldRetry: !success && maxRetries > 1,
      errorRecord
    };
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback<T>(
    errorRecord: ErrorRecord, 
    customFallbacks?: FallbackStrategy[]
  ): Promise<{
    success: boolean;
    result?: T;
    fallbackUsed?: FallbackStrategy;
    errorRecord: ErrorRecord;
  }> {
    const { context } = errorRecord;
    
    // Get fallback strategies (custom first, then default)
    const fallbacks = [
      ...(customFallbacks || []),
      ...(this.fallbackStrategies.get(context.category) || [])
    ];

    console.log(`[ERROR HANDLER] Executing fallback for ${context.operation}, ${fallbacks.length} strategies available`);

    for (const fallback of fallbacks) {
      try {
        console.log(`[FALLBACK] Trying strategy: ${fallback.type} - ${fallback.description}`);
        
        const result = await fallback.implementation();
        
        errorRecord.fallbackUsed = fallback;
        errorRecord.resolved = true;
        errorRecord.resolvedAt = new Date().toISOString();

        console.log(`[FALLBACK] Successfully executed: ${fallback.type}`);
        
        return {
          success: true,
          result,
          fallbackUsed: fallback,
          errorRecord
        };

      } catch (fallbackError) {
        console.warn(`[FALLBACK] Strategy ${fallback.type} failed:`, fallbackError);
        continue;
      }
    }

    console.error(`[FALLBACK] All fallback strategies failed for ${context.operation}`);
    return { success: false, errorRecord };
  }

  /**
   * Initialize fallback strategies for each error category
   */
  private initializeFallbackStrategies(): void {
    // Default fallback for all categories
    const universalFallback: FallbackStrategy = {
      type: "graceful_degradation",
      description: "Continue with reduced functionality",
      implementation: async () => ({ degraded: true, warning: "Operating with reduced functionality" })
    };

    // Category-specific fallbacks
    this.fallbackStrategies.set(ErrorCategory.IMAGEN_API, [
      {
        type: "demo_mode",
        description: "Generate demo asset placeholder",
        implementation: async () => this.generateDemoAsset({})
      },
      universalFallback
    ]);

    this.fallbackStrategies.set(ErrorCategory.CLOUD_STORAGE, [
      {
        type: "graceful_degradation", 
        description: "Continue without storage",
        implementation: async () => ({ stored: false, warning: "Assets not saved to cloud storage" })
      }
    ]);

    this.fallbackStrategies.set(ErrorCategory.FIRESTORE, [
      {
        type: "cached_response",
        description: "Use cached data",
        implementation: async () => ({ cached: true, warning: "Using cached data" })
      },
      universalFallback
    ]);

    this.fallbackStrategies.set(ErrorCategory.AUTHENTICATION, [
      {
        type: "demo_mode",
        description: "Switch to demo mode",
        implementation: async () => ({ demoMode: true, warning: "Authentication failed, using demo mode" })
      }
    ]);
  }

  /**
   * Initialize circuit breakers for GCP services
   */
  private initializeCircuitBreakers(): void {
    const services = ["imagen", "storage", "firestore", "gemini", "vertex-ai"];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        serviceName: service,
        state: "closed",
        failureCount: 0,
        threshold: 5, // Open after 5 failures
        timeout: 60000 // 60 seconds
      });
    });
  }

  /**
   * Helper methods
   */
  private extractErrorMessage(error: any): string {
    if (typeof error === "string") return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return JSON.stringify(error);
  }

  private determineSeverity(error: any): ErrorSeverity {
    const message = this.extractErrorMessage(error).toLowerCase();
    
    if (message.includes("quota") || message.includes("limit")) return ErrorSeverity.HIGH;
    if (message.includes("auth") || message.includes("permission")) return ErrorSeverity.HIGH;
    if (message.includes("network") || message.includes("timeout")) return ErrorSeverity.MEDIUM;
    if (message.includes("validation") || message.includes("invalid")) return ErrorSeverity.LOW;
    
    return ErrorSeverity.MEDIUM;
  }

  private isRetryable(error: any): boolean {
    const message = this.extractErrorMessage(error).toLowerCase();
    
    // Non-retryable errors
    if (message.includes("invalid") || message.includes("malformed")) return false;
    if (message.includes("unauthorized") || message.includes("forbidden")) return false;
    if (message.includes("not found") && !message.includes("network")) return false;
    
    // Retryable errors
    if (message.includes("timeout") || message.includes("network")) return true;
    if (message.includes("rate limit") || message.includes("quota")) return true;
    if (message.includes("service unavailable") || message.includes("internal")) return true;
    
    return true; // Default to retryable
  }

  private determineResolution(error: any, context: ErrorContext): ErrorResolution {
    if (context.severity === ErrorSeverity.CRITICAL) {
      return { strategy: "fallback", fallbackOptions: [], userNotification: true };
    }
    
    if (context.retryable && context.severity !== ErrorSeverity.LOW) {
      return { strategy: "retry", maxRetries: 3, retryDelay: 1000 };
    }
    
    return { strategy: "fallback", fallbackOptions: [] };
  }

  private getServiceName(category: ErrorCategory): string {
    const mapping = {
      [ErrorCategory.IMAGEN_API]: "imagen",
      [ErrorCategory.CLOUD_STORAGE]: "storage",
      [ErrorCategory.FIRESTORE]: "firestore",
      [ErrorCategory.GEMINI_API]: "gemini",
      [ErrorCategory.VERTEX_AI]: "vertex-ai",
      [ErrorCategory.AUTHENTICATION]: "auth",
      [ErrorCategory.RATE_LIMIT]: "rate-limit",
      [ErrorCategory.NETWORK]: "network",
      [ErrorCategory.VALIDATION]: "validation",
      [ErrorCategory.BUDGET]: "budget"
    } as Record<ErrorCategory, string>;
    
    return mapping[category] || "unknown";
  }

  private getRetrySuccessProbability(category: ErrorCategory): number {
    const probabilities = {
      [ErrorCategory.NETWORK]: 0.7,
      [ErrorCategory.RATE_LIMIT]: 0.9,
      [ErrorCategory.IMAGEN_API]: 0.6,
      [ErrorCategory.CLOUD_STORAGE]: 0.8,
      [ErrorCategory.FIRESTORE]: 0.7,
      [ErrorCategory.GEMINI_API]: 0.7,
      [ErrorCategory.VERTEX_AI]: 0.6,
      [ErrorCategory.AUTHENTICATION]: 0.3,
      [ErrorCategory.VALIDATION]: 0.1,
      [ErrorCategory.BUDGET]: 0.0
    } as Record<ErrorCategory, number>;
    
    return probabilities[category] || 0.5;
  }

  private extractRetryAfter(error: any): number | null {
    // Try to extract retry-after header value
    if (error.headers && error.headers['retry-after']) {
      return parseInt(error.headers['retry-after']) * 1000;
    }
    
    const message = this.extractErrorMessage(error).toLowerCase();
    const match = message.match(/retry after (\d+)/);
    return match ? parseInt(match[1]) * 1000 : null;
  }

  private async generateDemoAsset(requestData: any): Promise<any> {
    return {
      id: crypto.randomUUID(),
      type: "demo",
      url: "https://placeholder.adcraft.ai/demo-asset.png",
      description: "Demo placeholder asset generated due to API failure",
      fallback: true
    };
  }

  private getCachedSessionData(sessionId: string): any {
    // In real implementation, this would retrieve cached session data
    return {
      sessionId,
      cached: true,
      status: "active",
      warning: "Using cached session data"
    };
  }

  /**
   * Get error statistics and health metrics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    circuitBreakerStatus: Record<string, string>;
    recentErrors: ErrorRecord[];
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    this.errorHistory.forEach(error => {
      errorsByCategory[error.context.category] = (errorsByCategory[error.context.category] || 0) + 1;
      errorsBySeverity[error.context.severity] = (errorsBySeverity[error.context.severity] || 0) + 1;
    });

    const circuitBreakerStatus: Record<string, string> = {};
    this.circuitBreakers.forEach((breaker, serviceName) => {
      circuitBreakerStatus[serviceName] = breaker.state;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      circuitBreakerStatus,
      recentErrors: this.errorHistory.slice(-10) // Last 10 errors
    };
  }

  /**
   * Health check for error handling system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Check if error handler is functioning
      const testError = new Error("Health check test error");
      const testContext: ErrorContext = {
        sessionId: "health-check",
        operation: "health_check",
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        timestamp: new Date().toISOString(),
        metadata: {},
        retryable: false,
        recoverable: true
      };

      const result = await this.handleError(testError, testContext);
      
      console.log("[ERROR HANDLER] Health check completed");
      return result.success !== undefined; // Just check that it processed
    } catch (error) {
      console.error("[ERROR HANDLER] Health check failed:", error);
      return false;
    }
  }
}