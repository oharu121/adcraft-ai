/**
 * API-specific type definitions and request/response interfaces
 */

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  path?: string;
  statusCode?: number;
}

// Pagination
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Rate limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitResponse {
  rateLimitInfo: RateLimitInfo;
  error?: ApiError;
}

// Request context
export interface RequestContext {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  locale?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

// Health check endpoints
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number; // seconds
  services: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number; // ms
  lastCheck: Date;
  error?: string;
  dependencies?: string[];
}

// File upload types
export interface UploadRequest {
  file: File;
  folder?: string;
  metadata?: Record<string, any>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes/second
  remainingTime?: number; // seconds
}

// Webhook types
export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: Record<string, any>;
  signature?: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  error?: string;
}

// Streaming responses
export interface StreamChunk {
  id: string;
  type: 'data' | 'error' | 'end';
  data?: any;
  error?: string;
  timestamp: Date;
}

// Cache control
export interface CacheConfig {
  maxAge?: number; // seconds
  staleWhileRevalidate?: number; // seconds
  private?: boolean;
  noCache?: boolean;
}

// API endpoint configurations
export interface EndpointConfig {
  path: string;
  method: HttpMethod;
  auth?: 'required' | 'optional' | 'none';
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
  cache?: CacheConfig;
  timeout?: number; // ms
}

// Error codes for the application
export const API_ERROR_CODES = {
  // Authentication/Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Service errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Business logic
  INSUFFICIENT_BUDGET: 'INSUFFICIENT_BUDGET',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  VIDEO_GENERATION_FAILED: 'VIDEO_GENERATION_FAILED',
  CONTENT_POLICY_VIOLATION: 'CONTENT_POLICY_VIOLATION',

  // File operations
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Standard HTTP status codes we use
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  PDF: 'application/pdf',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  VIDEO_MP4: 'video/mp4',
} as const;

export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

// API versioning
export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
  supportEndDate?: Date;
  migrationGuide?: string;
}