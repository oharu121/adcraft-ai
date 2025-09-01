/**
 * Rate Limiting Service for API Security
 * Implements IP-based and endpoint-specific rate limiting
 * Uses in-memory storage for demo (consider Redis for production)
 */

interface RateLimit {
  count: number;
  resetTime: number;
  lastAccess: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiterService {
  private static instance: RateLimiterService;
  private limits: Map<string, RateLimit> = new Map();
  
  // Default rate limit configurations
  private defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute per IP
  };

  private endpointConfigs: Map<string, RateLimitConfig> = new Map([
    ['video-generation', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 video generations per hour per IP
    }],
    ['chat-refinement', {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20, // 20 chat messages per 5 minutes
    }],
    ['status-check', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 status checks per minute (1 per second)
    }],
    // Product Intelligence Agent endpoints
    ['product-intelligence-analyze', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 image/text analyses per hour (expensive operations)
    }],
    ['product-intelligence-chat', {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 30, // 30 chat messages per 5 minutes
    }],
    ['product-intelligence-handoff', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 handoffs per hour
    }],
  ]);

  private constructor() {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  /**
   * Check if request should be rate limited
   * @param identifier - Usually IP address, can include endpoint
   * @param endpoint - Specific endpoint for different limits
   * @returns Object with allowed status and retry info
   */
  public checkRateLimit(identifier: string, endpoint?: string): {
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const config = endpoint ? this.endpointConfigs.get(endpoint) || this.defaultConfig : this.defaultConfig;
    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    const now = Date.now();

    // Get or create rate limit entry
    let limit = this.limits.get(key);
    if (!limit) {
      limit = {
        count: 0,
        resetTime: now + config.windowMs,
        lastAccess: now,
      };
      this.limits.set(key, limit);
    }

    // Reset if time window has passed
    if (now >= limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + config.windowMs;
    }

    // Update last access
    limit.lastAccess = now;

    // Check if limit exceeded
    if (limit.count >= config.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: limit.resetTime,
        retryAfter: Math.ceil((limit.resetTime - now) / 1000),
      };
    }

    // Increment count
    limit.count++;

    return {
      allowed: true,
      remainingRequests: config.maxRequests - limit.count,
      resetTime: limit.resetTime,
    };
  }

  /**
   * Get rate limit status without incrementing counter
   */
  public getRateLimitStatus(identifier: string, endpoint?: string): {
    remainingRequests: number;
    resetTime: number;
    totalRequests: number;
  } {
    const config = endpoint ? this.endpointConfigs.get(endpoint) || this.defaultConfig : this.defaultConfig;
    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    const now = Date.now();

    const limit = this.limits.get(key);
    if (!limit || now >= limit.resetTime) {
      return {
        remainingRequests: config.maxRequests,
        resetTime: now + config.windowMs,
        totalRequests: 0,
      };
    }

    return {
      remainingRequests: config.maxRequests - limit.count,
      resetTime: limit.resetTime,
      totalRequests: limit.count,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   * Useful for testing or manual overrides
   */
  public resetRateLimit(identifier: string, endpoint?: string): void {
    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    this.limits.delete(key);
  }

  /**
   * Get client identifier from request
   * Considers proxy headers for Cloud Run deployment
   */
  public getClientIdentifier(request: Request): string {
    // Try to get real IP from proxy headers (Cloud Run, Load Balancer)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    // Use the first IP from x-forwarded-for (most likely the original client)
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0] || 'unknown';
    }

    if (realIp) return realIp;
    if (cfConnectingIp) return cfConnectingIp;

    // Fallback to a default identifier
    return 'unknown';
  }

  /**
   * Create rate limit middleware response
   */
  public createRateLimitResponse(rateLimitResult: {
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
    retryAfter?: number;
  }) {
    const headers: Record<string, string> = {
      'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
    };

    if (!rateLimitResult.allowed && rateLimitResult.retryAfter) {
      headers['Retry-After'] = rateLimitResult.retryAfter.toString();
    }

    return {
      status: rateLimitResult.allowed ? 200 : 429,
      headers,
      body: rateLimitResult.allowed
        ? null
        : {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
              details: {
                retryAfter: rateLimitResult.retryAfter,
                resetTime: rateLimitResult.resetTime,
              },
              timestamp: new Date(),
            },
            timestamp: new Date(),
          },
    };
  }

  /**
   * Update rate limit configuration for an endpoint
   */
  public updateEndpointConfig(endpoint: string, config: RateLimitConfig): void {
    this.endpointConfigs.set(endpoint, config);
  }

  /**
   * Get current rate limit configuration
   */
  public getEndpointConfig(endpoint: string): RateLimitConfig {
    return this.endpointConfigs.get(endpoint) || this.defaultConfig;
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, limit] of this.limits.entries()) {
      // Remove entries that haven't been accessed in 24 hours
      if (now - limit.lastAccess > 24 * 60 * 60 * 1000) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.limits.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`Rate limiter cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Get statistics about current rate limiting
   */
  public getStatistics(): {
    totalEntries: number;
    activeEntries: number;
    endpointConfigs: number;
  } {
    const now = Date.now();
    let activeEntries = 0;

    for (const limit of this.limits.values()) {
      if (now < limit.resetTime) {
        activeEntries++;
      }
    }

    return {
      totalEntries: this.limits.size,
      activeEntries,
      endpointConfigs: this.endpointConfigs.size,
    };
  }
}

export default RateLimiterService;