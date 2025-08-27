import { ChatMessage } from '../lib/utils/validation';

/**
 * Extended session interfaces for application use
 */
export interface VideoSession {
  id: string;
  userId?: string;
  prompt: string;
  refinedPrompt?: string;
  chatHistory: ChatMessage[];
  videoJobId?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  metadata?: SessionMetadata;
}

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  locale?: string;
  referrer?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browserName?: string;
}

export interface SessionSummary {
  id: string;
  prompt: string;
  status: VideoSession['status'];
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  duration?: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  failedSessions: number;
  averageSessionDuration: number; // in minutes
}

/**
 * Chat-related interfaces
 */
export interface ChatContext {
  sessionId: string;
  messages: ChatMessage[];
  lastActivity: Date;
  totalMessages: number;
}

export interface ChatSuggestion {
  type: 'prompt_improvement' | 'style_suggestion' | 'technical_tip';
  title: string;
  description: string;
  action?: string;
}

export interface ConversationFlow {
  step: number;
  totalSteps: number;
  currentPhase: 'prompt_creation' | 'refinement' | 'generation' | 'review';
  nextSuggestion?: string;
  canProceed: boolean;
}