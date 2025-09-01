/**
 * Session State Management Types
 * 
 * Comprehensive session state management for Product Intelligence Agent sessions,
 * including user data, progress tracking, and handoff coordination.
 */

import { 
  SessionStatus, 
  AgentType, 
  HandoffStatus 
} from './enums';
import { ProductAnalysis } from './product-analysis';
import { ChatMessage, ConversationContext, ConversationFlow, ConversationMetrics } from './conversation';

// User preferences and settings
export interface UserPreferences {
  language: 'en' | 'ja';
  communicationStyle: 'formal' | 'casual';
  detailLevel: 'brief' | 'detailed';
  visualFeedback: boolean;
  notifications: boolean;
}

// User session information
export interface UserSession {
  locale: 'en' | 'ja';
  ipAddress: string; // For rate limiting
  preferences: UserPreferences;
  joinedAt: number;
  lastActivity: number;
}

// Product data within session
export interface ProductSession {
  imageUrl: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  uploadTimestamp: number;
  initialDescription?: string;
  analysis?: ProductAnalysis;
  processingStatus: 'uploaded' | 'analyzing' | 'complete' | 'error';
}

// Conversation data within session
export interface ConversationSession {
  messages: ChatMessage[];
  context: ConversationContext;
  flow: ConversationFlow;
  metrics: ConversationMetrics;
  currentTopic?: string;
  completedTopics: string[];
  lastMessageTimestamp: number;
}

// Progress tracking through analysis steps
export interface ProgressTracking {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: string[];
  nextActions: string[];
  estimatedTimeRemaining: number; // minutes
  completionPercentage: number;
}

// Cost breakdown for different operations
export interface DetailedCostBreakdown {
  imageUpload: number;
  imageAnalysis: number;
  chatInteractions: number;
  dataStorage: number;
  apiCalls: number;
}

// Enhanced cost tracking
export interface SessionCostTracking {
  current: number;
  total: number;
  breakdown: DetailedCostBreakdown;
  remaining: number;
  budgetAlert: boolean;
  costPerMessage: number;
  projectedTotal: number;
}

// Performance metrics for session
export interface SessionPerformance {
  startTime: number;
  lastActivity: number;
  processingTimes: Record<string, number>;
  totalProcessingTime: number;
  averageResponseTime: number;
  errorCount: number;
  retryCount: number;
}

// Agent handoff preparation data
export interface HandoffPreparation {
  readyForNext: boolean;
  nextAgent: AgentType;
  serializedContext: string;
  handoffTimestamp?: number;
  status: HandoffStatus;
  validationErrors: string[];
  dataIntegrity: boolean;
}

// Session metadata
export interface SessionMetadata {
  createdAt: number;
  updatedAt: number;
  version: string;
  environment: 'development' | 'staging' | 'production';
  agentVersion: string;
  schemaVersion: string;
}

// Rate limiting information
export interface RateLimitInfo {
  requestCount: number;
  lastRequestTime: number;
  resetTime: number;
  limitReached: boolean;
  remainingRequests: number;
}

// Session health monitoring
export interface SessionHealth {
  isActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastHeartbeat: number;
  errorRate: number;
  warningCount: number;
  performanceScore: number; // 0-100
}

// Complete session state structure
export interface SessionState {
  // Core session identification
  sessionId: string;
  status: SessionStatus;
  currentAgent: AgentType;
  
  // User information
  user: UserSession;
  
  // Product data
  product: ProductSession;
  
  // Conversation management
  conversation: ConversationSession;
  
  // Progress tracking
  progress: ProgressTracking;
  
  // Cost and performance monitoring
  costs: SessionCostTracking;
  performance: SessionPerformance;
  
  // Agent handoff preparation
  handoff: HandoffPreparation;
  
  // Rate limiting
  rateLimit: RateLimitInfo;
  
  // Health monitoring
  health: SessionHealth;
  
  // Metadata
  metadata: SessionMetadata;
}

// Session creation parameters
export interface CreateSessionRequest {
  locale?: 'en' | 'ja';
  userPreferences?: Partial<UserPreferences>;
  initialDescription?: string;
}

// Session update parameters
export interface UpdateSessionRequest {
  status?: SessionStatus;
  userPreferences?: Partial<UserPreferences>;
  progress?: Partial<ProgressTracking>;
}

// Session query filters
export interface SessionQuery {
  status?: SessionStatus;
  agentType?: AgentType;
  createdAfter?: number;
  createdBefore?: number;
  locale?: 'en' | 'ja';
  limit?: number;
  offset?: number;
}

// Session summary for listings
export interface SessionSummary {
  sessionId: string;
  status: SessionStatus;
  currentAgent: AgentType;
  progress: {
    percentage: number;
    currentStep: string;
  };
  costs: {
    total: number;
    remaining: number;
  };
  createdAt: number;
  lastActivity: number;
}