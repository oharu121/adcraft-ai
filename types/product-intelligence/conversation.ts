/**
 * Conversation and Chat Data Structures
 * 
 * Types for managing real-time conversations between users and the Product Intelligence Agent,
 * including WebSocket communication, message handling, and conversation flow control.
 */

import { MessageType, TopicStatus } from './enums';

// Individual chat message structure
export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  agentName?: string;
  metadata?: {
    processingTime?: number;
    cost?: number;
    confidence?: number;
    messageType?: MessageType;
  };
}

// Conversation topic tracking
export interface ConversationTopics {
  productFeatures: TopicStatus;
  targetAudience: TopicStatus;
  brandPositioning: TopicStatus;
  visualPreferences: TopicStatus;
}

// Conversation context management
export interface ConversationContext {
  topics: ConversationTopics;
  userIntent: string;
  keyInsights: string[];
  uncertainties: string[];
  followUpQuestions: string[];
}

// User message from WebSocket client
export interface UserMessage {
  type: MessageType;
  sessionId: string;
  content?: string;
  timestamp: number;
  locale: 'en' | 'ja';
}

// Agent response message
export interface AgentMessage {
  type: MessageType;
  sessionId: string;
  content?: string;
  agentName: string;
  timestamp: number;
  metadata?: {
    cost: {
      current: number;
      total: number;
      remaining: number;
    };
    processingTime: number;
    nextAction: string;
    confidence?: number;
  };
}

// Status update message
export interface StatusUpdate {
  type: 'status_update';
  sessionId: string;
  status: string;
  progress: {
    step: number;
    totalSteps: number;
    description: string;
  };
}

// WebSocket message union type
export type WebSocketMessage = UserMessage | AgentMessage | StatusUpdate;

// Conversation flow state
export interface ConversationFlow {
  currentStep: 'initial_analysis' | 'feature_refinement' | 'audience_identification' | 'positioning_discussion' | 'visual_preferences' | 'completion_check';
  completedSteps: string[];
  nextStep?: string;
  canProceed: boolean;
  requiresUserInput: boolean;
  estimatedRemainingTime: number; // minutes
}

// Agent conversation capabilities
export interface AgentCapabilities {
  canAnalyzeImages: boolean;
  canConductConversations: boolean;
  canRefineInsights: boolean;
  canDetectCompletion: boolean;
  canHandoffToNext: boolean;
  supportedLanguages: ('en' | 'ja')[];
}

// Conversation quality metrics
export interface ConversationMetrics {
  messageCount: number;
  averageResponseTime: number;
  userSatisfactionSignals: number;
  topicsCompleted: number;
  insightsGenerated: number;
  clarificationNeeded: number;
}

// Conversation session summary
export interface ConversationSummary {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  messageCount: number;
  topicsDiscussed: string[];
  keyInsights: string[];
  userPreferences: Record<string, any>;
  completionStatus: 'partial' | 'complete';
  handoffReady: boolean;
}