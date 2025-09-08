/**
 * API Request/Response Types
 *
 * TypeScript interfaces for all API endpoints related to the Product Intelligence Agent,
 * including validation schemas and error handling types.
 */

import { SessionStatus, AgentType } from "../enums";
import { ProductAnalysis } from "./product-analysis";
import { SessionState, SessionSummary } from "./session-state";
import { CostTracking } from "./product-analysis";

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId: string;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  userMessage: string; // Localized error message
  details?: Record<string, any>;
  stack?: string; // Only in development
}

// Image upload request
export interface ImageUploadRequest {
  sessionId?: string;
  description?: string;
  locale?: "en" | "ja";
  // File will be handled by multipart/form-data
}

// Image upload response
export interface ImageUploadResponse {
  sessionId: string;
  imageUrl: string;
  uploadTimestamp: string;
  processingStatus: "uploaded" | "analyzing" | "complete" | "error";
  fileInfo: {
    originalName: string;
    size: number;
    mimeType: string;
  };
}

// Agent processing request
export interface AgentProcessRequest {
  sessionId: string;
  action: "analyze" | "chat" | "handoff";
  message?: string; // Required for chat action
  locale: "en" | "ja";
  metadata?: Record<string, any>;
}

// Agent processing response
export interface AgentProcessResponse {
  sessionId: string;
  agentResponse?: string;
  analysis?: ProductAnalysis;
  nextAction: "continue_chat" | "ready_for_handoff" | "error";
  cost: {
    current: number;
    total: number;
    remaining: number;
  };
  processingTime: number;
  confidence?: number;
}

// Session status response
export interface SessionStatusResponse {
  sessionId: string;
  status: SessionStatus;
  currentAgent: AgentType;
  progress: {
    step: number;
    totalSteps: number;
    description: string;
    percentage: number;
  };
  cost: CostTracking;
  lastActivity: string;
  health: {
    isActive: boolean;
    connectionStatus: string;
    errorCount: number;
  };
}

// Session control request
export interface SessionControlRequest {
  action: "pause" | "resume" | "cancel";
  reason?: string;
}

// Chat message request
export interface ChatMessageRequest {
  sessionId: string;
  message: string;
  locale: "en" | "ja";
  metadata?: {
    userAgent?: string;
    timestamp?: number;
  };
}

// Chat message response
export interface ChatMessageResponse {
  messageId: string;
  agentResponse: string;
  processingTime: number;
  cost: number;
  confidence?: number;
  nextAction: "continue" | "complete" | "clarify";
  suggestedFollowUp?: string[];
}

// Analysis request
export interface AnalysisRequest {
  sessionId: string;
  imageUrl?: string;
  description?: string;
  locale: "en" | "ja";
  options?: {
    detailLevel: "basic" | "detailed" | "comprehensive";
    includeVisualization: boolean;
    confidenceThreshold: number;
  };
}

// Analysis response
export interface AnalysisResponse {
  analysis: ProductAnalysis;
  processingTime: number;
  cost: number;
  confidence: number;
  warnings?: string[];
  suggestions?: string[];
}

// Handoff request
export interface HandoffRequest {
  sessionId: string;
  targetAgent: AgentType;
  validateData: boolean;
  includeMetadata: boolean;
}

// Handoff response
export interface HandoffResponse {
  success: boolean;
  targetAgent: AgentType;
  handoffTimestamp: string;
  serializedData: string;
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  estimatedProcessingTime: number;
}

// Session list request
export interface SessionListRequest {
  status?: SessionStatus[];
  agentType?: AgentType;
  locale?: "en" | "ja";
  limit?: number;
  offset?: number;
  sortBy?: "created" | "updated" | "cost" | "progress";
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

// Session list response
export interface SessionListResponse {
  sessions: SessionSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    applied: Record<string, any>;
    available: Record<string, any[]>;
  };
}

// Validation schema type (to be used with Zod)
export interface ValidationSchema<T = any> {
  parse: (input: unknown) => T;
  safeParse: (input: unknown) => { success: boolean; data?: T; error?: any };
}

// API configuration options
export interface ApiOptions {
  timeout?: number;
  retries?: number;
  backoff?: "linear" | "exponential";
  cache?: boolean;
  validateResponse?: boolean;
}

// API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
  interceptors: {
    request?: ((config: any) => any)[];
    response?: ((response: any) => any)[];
  };
}
