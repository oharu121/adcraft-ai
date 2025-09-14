/**
 * Alex - Video Producer Production Types (DEFERRED)
 *
 * IMPLEMENTATION STATUS: DEFERRED FOR FUTURE DEVELOPMENT
 */

// DEFERRED: Complete video production job
export interface VideoProductionJob {
  readonly jobId: string;
  readonly sessionId: string;
  readonly status: ProductionStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly plan: any;
  readonly progress: ProductionProgress;
  readonly result?: VideoProductionResult;
  readonly error?: ProductionError;
}

// DEFERRED: Production status tracking
export type ProductionStatus =
  | 'pending'
  | 'planning'
  | 'generating'
  | 'processing'
  | 'optimizing'
  | 'completed'
  | 'failed';

// DEFERRED: Production progress tracking
export interface ProductionProgress {
  readonly currentStep: string;
  readonly completedSteps: string[];
  readonly totalSteps: number;
  readonly percentage: number;
  readonly estimatedTimeRemaining?: number; // seconds
}

// DEFERRED: Final video production result
export interface VideoProductionResult {
  readonly videoUrl: string;
  readonly thumbnailUrl: string;
  readonly duration: number;
  readonly fileSize: number;
  readonly format: any;
  readonly resolution: any;
  readonly metadata: VideoMetadata;
}

// DEFERRED: Video metadata
export interface VideoMetadata {
  readonly title: string;
  readonly description: string;
  readonly tags: string[];
  readonly createdAt: Date;
  readonly productInfo: ProductReference;
  readonly agentContributions: AgentContribution[];
}

// DEFERRED: Reference to original product
export interface ProductReference {
  readonly productId: string;
  readonly productName: string;
  readonly category: string;
}

// DEFERRED: Track contributions from each agent
export interface AgentContribution {
  readonly agentId: 'maya' | 'david' | 'alex';
  readonly contribution: string;
  readonly timestamp: Date;
}

// DEFERRED: Production error information
export interface ProductionError {
  readonly code: string;
  readonly message: string;
  readonly details: Record<string, any>;
  readonly timestamp: Date;
  readonly recoverable: boolean;
}