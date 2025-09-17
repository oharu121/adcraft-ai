/**
 * Handoff Storage Types
 *
 * TypeScript interfaces for Firestore-based handoff data storage and persistence.
 * Defines collection schemas, document structures, and metadata for agent handoffs.
 */

import { HandoffData, HandoffStatus, HandoffValidationResult } from "./agent-handoff-types";

// Firestore collection names
export const FIRESTORE_COLLECTIONS = {
  HANDOFF_DATA: "agent_handoffs",
  HANDOFF_METADATA: "handoff_metadata",
  HANDOFF_HISTORY: "handoff_history",
  SESSION_DATA: "session_data",
} as const;

// Base Firestore document interface
export interface FirestoreDocument {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
}

// Handoff data stored in Firestore
export interface FirestoreHandoffDocument extends FirestoreDocument {
  // Document identification
  readonly handoffId: string;
  readonly sessionId: string;

  // Handoff routing information
  readonly sourceAgent: "maya" | "david" | "zara";
  readonly targetAgent: "maya" | "david" | "zara";
  readonly handoffDirection: "maya-to-david" | "david-to-zara";

  // Handoff data payload (encrypted if sensitive)
  readonly data: string; // JSON serialized HandoffData
  readonly dataHash: string; // SHA-256 hash for integrity verification
  readonly encrypted: boolean;

  // Status and processing information
  readonly status: HandoffStatus;
  readonly processingStarted?: Date;
  readonly processingCompleted?: Date;
  readonly processingTime?: number; // seconds

  // Validation results
  readonly validationResults?: HandoffValidationResult;
  readonly validationErrors?: string[];
  readonly validationWarnings?: string[];

  // Metadata and tracking
  readonly size: number; // Data size in bytes
  readonly compression?: "gzip" | "none";
  readonly retryCount: number;
  readonly lastRetryAt?: Date;

  // Automatic cleanup (TTL)
  readonly expiresAt: Date; // 48 hours after creation
  readonly cleanupScheduled: boolean;
}

// Handoff metadata for quick queries and monitoring
export interface HandoffMetadataDocument extends FirestoreDocument {
  readonly handoffId: string;
  readonly sessionId: string;
  readonly sourceAgent: "maya" | "david" | "zara";
  readonly targetAgent: "maya" | "david" | "zara";
  readonly status: HandoffStatus;
  readonly dataSize: number;
  readonly processingTime?: number;
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
  readonly retryCount: number;
}

// Handoff history for audit trail
export interface HandoffHistoryDocument extends FirestoreDocument {
  readonly handoffId: string;
  readonly sessionId: string;
  readonly event: HandoffEvent;
  readonly timestamp: Date;
  readonly details: Record<string, any>;
  readonly agentContext?: {
    agent: "maya" | "david" | "zara";
    version: string;
    processingTime?: number;
    cost?: number;
  };
}

export type HandoffEvent =
  | "handoff_initiated"
  | "data_prepared"
  | "validation_started"
  | "validation_completed"
  | "validation_failed"
  | "processing_started"
  | "processing_completed"
  | "processing_failed"
  | "data_received"
  | "handoff_completed"
  | "handoff_failed"
  | "retry_attempted"
  | "cleanup_scheduled"
  | "cleanup_completed";

// Session data aggregation for handoff tracking
export interface SessionHandoffSummary extends FirestoreDocument {
  readonly sessionId: string;

  // Handoff tracking
  readonly handoffs: {
    readonly completed: number;
    readonly failed: number;
    readonly pending: number;
    readonly total: number;
  };

  // Agent progression
  readonly agentStatus: {
    readonly maya: "completed" | "active" | "pending";
    readonly david: "completed" | "active" | "pending" | "waiting";
    readonly zara: "completed" | "active" | "pending" | "waiting" | "deferred";
  };

  // Performance metrics
  readonly performance: {
    readonly totalProcessingTime: number; // seconds
    readonly averageHandoffTime: number; // seconds
    readonly successRate: number; // 0-1
  };

  // Cost tracking
  readonly costs: {
    readonly totalCost: number;
    readonly handoffCosts: number;
    readonly processingCosts: number;
  };

  // Last activity
  readonly lastHandoffAt?: Date;
  readonly lastActivityAt: Date;
}

// Firestore query interfaces
export interface HandoffQuery {
  readonly sessionId?: string;
  readonly sourceAgent?: "maya" | "david" | "zara";
  readonly targetAgent?: "maya" | "david" | "zara";
  readonly status?: HandoffStatus;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly hasErrors?: boolean;
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: "createdAt" | "updatedAt" | "processingTime" | "size";
  readonly orderDirection?: "asc" | "desc";
}

export interface HandoffQueryResult {
  readonly documents: FirestoreHandoffDocument[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
  readonly queryTime: number; // milliseconds
}

// Storage configuration and limits
export interface HandoffStorageConfig {
  readonly encryption: {
    readonly enabled: boolean;
    readonly algorithm: "AES-256-GCM";
    readonly keyRotationDays: number;
  };
  readonly compression: {
    readonly enabled: boolean;
    readonly algorithm: "gzip";
    readonly minSize: number; // bytes
  };
  readonly retention: {
    readonly defaultTTL: number; // hours
    readonly maxTTL: number; // hours
    readonly cleanupInterval: number; // hours
  };
  readonly limits: {
    readonly maxDocumentSize: number; // bytes (Firestore limit: 1MB)
    readonly maxRetries: number;
    readonly retryDelay: number; // milliseconds
  };
  readonly monitoring: {
    readonly enableMetrics: boolean;
    readonly enableLogging: boolean;
    readonly alertThresholds: AlertThresholds;
  };
}

export interface AlertThresholds {
  readonly failureRate: number; // 0-1, alert if exceeded
  readonly processingTime: number; // seconds, alert if exceeded
  readonly retryCount: number; // alert if exceeded
  readonly storageSize: number; // MB, alert if exceeded
}

// Storage operation results
export interface StorageOperationResult {
  readonly success: boolean;
  readonly documentId?: string;
  readonly processingTime: number; // milliseconds
  readonly error?: StorageError;
  readonly warnings?: string[];
}

export interface StorageError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, any>;
  readonly retryable: boolean;
}

// Batch operations for efficient storage
export interface BatchHandoffOperation {
  readonly operationType: "create" | "update" | "delete";
  readonly documentId: string;
  readonly data?: Partial<FirestoreHandoffDocument>;
}

export interface BatchOperationResult {
  readonly success: boolean;
  readonly completedOperations: number;
  readonly failedOperations: number;
  readonly errors: Array<{
    documentId: string;
    error: StorageError;
  }>;
  readonly processingTime: number; // milliseconds
}

// Handoff data encryption interface
export interface EncryptedHandoffData {
  readonly encryptedData: string; // Base64 encoded
  readonly iv: string; // Initialization vector
  readonly authTag: string; // Authentication tag for GCM
  readonly keyId: string; // Reference to encryption key
  readonly algorithm: "AES-256-GCM";
  readonly encryptedAt: Date;
}

// Handoff data compression interface
export interface CompressedHandoffData {
  readonly compressedData: string; // Base64 encoded
  readonly originalSize: number; // bytes
  readonly compressedSize: number; // bytes
  readonly compressionRatio: number; // originalSize / compressedSize
  readonly algorithm: "gzip";
  readonly compressedAt: Date;
}

// Data integrity verification
export interface DataIntegrityCheck {
  readonly originalHash: string; // SHA-256 of original data
  readonly storedHash: string; // SHA-256 of stored data
  readonly isValid: boolean;
  readonly checkedAt: Date;
  readonly discrepancies?: string[];
}

// Monitoring and analytics interfaces
export interface HandoffMetrics {
  readonly period: "hour" | "day" | "week" | "month";
  readonly startTime: Date;
  readonly endTime: Date;
  readonly totalHandoffs: number;
  readonly successfulHandoffs: number;
  readonly failedHandoffs: number;
  readonly successRate: number; // 0-1
  readonly averageProcessingTime: number; // seconds
  readonly totalDataTransferred: number; // bytes
  readonly retryRate: number; // 0-1
}

export interface AgentHandoffStats {
  readonly sourceAgent: "maya" | "david" | "zara";
  readonly targetAgent: "maya" | "david" | "zara";
  readonly handoffCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly averageProcessingTime: number; // seconds
  readonly averageDataSize: number; // bytes
  readonly lastHandoffAt?: Date;
}

// Export utility types
export type HandoffStorageDocument =
  | FirestoreHandoffDocument
  | HandoffMetadataDocument
  | HandoffHistoryDocument
  | SessionHandoffSummary;

export type StorageCollectionName = keyof typeof FIRESTORE_COLLECTIONS;
