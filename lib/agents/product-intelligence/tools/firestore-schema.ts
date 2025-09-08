/**
 * Product Intelligence Agent - Firestore Collections Schema
 * 
 * Extends the existing FirestoreService to support Product Intelligence Agent
 * specific data structures including product analysis sessions, chat history,
 * and agent handoff coordination.
 */

import { Firestore, CollectionReference, DocumentData, QuerySnapshot, FieldValue, Timestamp } from '@google-cloud/firestore';
import { AgentType, HandoffStatus, SessionStatus, TopicStatus } from '../enums';
import { ChatMessage, ProductAnalysis, SessionState,  } from '../types';
import { FirestoreService } from '@/lib/services/firestore';

// Firestore-compatible session interface (with Timestamp fields)
export interface ProductIntelligenceSessionDoc {
  sessionId: string;
  status: SessionStatus;
  currentAgent: AgentType;
  
  // User data
  user: {
    locale: 'en' | 'ja';
    ipAddress: string;
    preferences: {
      language: 'en' | 'ja';
      communicationStyle: 'formal' | 'casual';
      detailLevel: 'brief' | 'detailed';
      visualFeedback: boolean;
      notifications: boolean;
    };
    joinedAt: Timestamp;
    lastActivity: Timestamp;
  };
  
  // Product data
  product: {
    imageUrl: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    uploadTimestamp: Timestamp;
    initialDescription?: string;
    analysis?: ProductAnalysis;
    processingStatus: 'uploaded' | 'analyzing' | 'complete' | 'error';
  };
  
  // Conversation data
  conversation: {
    messageCount: number;
    currentTopic?: string;
    completedTopics: string[];
    lastMessageTimestamp: Timestamp;
    context: {
      topics: {
        productFeatures: 'pending' | 'in_progress' | 'completed';
        targetAudience: 'pending' | 'in_progress' | 'completed';
        brandPositioning: 'pending' | 'in_progress' | 'completed';
        visualPreferences: 'pending' | 'in_progress' | 'completed';
      };
      userIntent: string;
      keyInsights: string[];
      uncertainties: string[];
      followUpQuestions: string[];
    };
    flow: {
      currentStep: 'initial_analysis' | 'feature_refinement' | 'audience_identification' | 'positioning_discussion' | 'visual_preferences' | 'completion_check';
      completedSteps: string[];
      nextStep?: string;
      canProceed: boolean;
      requiresUserInput: boolean;
      estimatedRemainingTime: number;
    };
    metrics: {
      messageCount: number;
      averageResponseTime: number;
      userSatisfactionSignals: number;
      topicsCompleted: number;
      insightsGenerated: number;
      clarificationNeeded: number;
    };
  };
  
  // Progress tracking
  progress: {
    currentStep: number;
    totalSteps: number;
    stepsCompleted: string[];
    nextActions: string[];
    estimatedTimeRemaining: number;
    completionPercentage: number;
  };
  
  // Cost tracking
  costs: {
    current: number;
    total: number;
    breakdown: {
      imageUpload: number;
      imageAnalysis: number;
      chatInteractions: number;
      dataStorage: number;
      apiCalls: number;
    };
    remaining: number;
    budgetAlert: boolean;
    costPerMessage: number;
    projectedTotal: number;
  };
  
  // Performance metrics
  performance: {
    startTime: Timestamp;
    lastActivity: Timestamp;
    processingTimes: Record<string, number>;
    totalProcessingTime: number;
    averageResponseTime: number;
    errorCount: number;
    retryCount: number;
  };
  
  // Agent handoff data
  handoff: {
    readyForNext: boolean;
    nextAgent?: AgentType;
    serializedContext?: string;
    handoffTimestamp?: Timestamp;
    status: HandoffStatus;
    validationErrors: string[];
    dataIntegrity: boolean;
  };
  
  // Rate limiting
  rateLimit: {
    requestCount: number;
    lastRequestTime: Timestamp;
    resetTime: Timestamp;
    limitReached: boolean;
    remainingRequests: number;
  };
  
  // Session health
  health: {
    isActive: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    lastHeartbeat: Timestamp;
    errorRate: number;
    warningCount: number;
    performanceScore: number;
  };
  
  // Metadata
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    expiresAt: Timestamp; // Auto-cleanup after 24 hours
    version: string;
    environment: 'development' | 'staging' | 'production';
    agentVersion: string;
    schemaVersion: string;
  };
}

// Chat message document for separate collection
export interface ChatMessageDoc {
  id: string;
  sessionId: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Timestamp;
  agentName?: string;
  metadata?: {
    processingTime?: number;
    cost?: number;
    confidence?: number;
    messageType?: string;
  };
}

// Product analysis document for separate collection (with auto-cleanup)
export interface ProductAnalysisDoc {
  sessionId: string;
  analysis: ProductAnalysis;
  version: string;
  createdAt: Timestamp;
  expiresAt: Timestamp; // Auto-cleanup after 24 hours
}

// Agent handoff tracking document
export interface AgentHandoffDoc {
  sessionId: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  handoffTimestamp: Timestamp;
  serializedData: string;
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  status: HandoffStatus;
  metadata: {
    dataSize: number;
    processingTime: number;
    confidence: number;
  };
}

/**
 * Extended Firestore service for Product Intelligence Agent
 */
export class ProductIntelligenceFirestore {
  private piSessionsCollection: CollectionReference<DocumentData> | null = null;
  private piChatCollection: CollectionReference<DocumentData> | null = null;
  private piAnalysisCollection: CollectionReference<DocumentData> | null = null;
  private piHandoffCollection: CollectionReference<DocumentData> | null = null;

  // Mock data stores for development
  private static mockPISessions: Map<string, ProductIntelligenceSessionDoc> = new Map();
  private static mockPIChats: Map<string, ChatMessageDoc[]> = new Map();
  private static mockPIAnalyses: Map<string, ProductAnalysisDoc> = new Map();
  private static mockPIHandoffs: Map<string, AgentHandoffDoc[]> = new Map();

  private firebaseService: FirestoreService;
  private isMockMode: boolean;

  constructor() {
    this.firebaseService = FirestoreService.getInstance();
    this.isMockMode = process.env.NODE_ENV === 'development' && 
                      process.env.ENABLE_MOCK_MODE === 'true';
    
    if (!this.isMockMode) {
      // Initialize Product Intelligence specific collections
      const db = this.getFirestoreInstance();
      if (db) {
        this.piSessionsCollection = db.collection('productIntelligenceSessions');
        this.piChatCollection = db.collection('productIntelligenceChats');
        this.piAnalysisCollection = db.collection('productAnalyses');
        this.piHandoffCollection = db.collection('agentHandoffs');
      }
    }
  }

  /**
   * Check if service is running in mock mode
   */
  public isMock(): boolean {
    return this.isMockMode;
  }

  // Helper method to get Firestore instance (protected method)
  private getFirestoreInstance(): Firestore | null {
    try {
      // Access the protected db property through type assertion
      return (this as any).db;
    } catch {
      return null;
    }
  }

  /**
   * Create new Product Intelligence session
   */
  public async createPISession(sessionData: Omit<SessionState, 'metadata'>): Promise<SessionState> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      const firestoreDoc: ProductIntelligenceSessionDoc = {
        ...sessionData,
        user: {
          ...sessionData.user,
          joinedAt: Timestamp.fromDate(sessionData.user.joinedAt ? new Date(sessionData.user.joinedAt) : now),
          lastActivity: Timestamp.fromDate(sessionData.user.lastActivity ? new Date(sessionData.user.lastActivity) : now)
        },
        product: {
          ...sessionData.product,
          uploadTimestamp: Timestamp.fromDate(sessionData.product.uploadTimestamp ? new Date(sessionData.product.uploadTimestamp) : now)
        },
        conversation: {
          ...sessionData.conversation,
          messageCount: sessionData.conversation.messages?.length || 0,
          lastMessageTimestamp: Timestamp.fromDate(sessionData.conversation.lastMessageTimestamp ? new Date(sessionData.conversation.lastMessageTimestamp) : now)
        },
        performance: {
          ...sessionData.performance,
          startTime: Timestamp.fromDate(sessionData.performance.startTime ? new Date(sessionData.performance.startTime) : now),
          lastActivity: Timestamp.fromDate(sessionData.performance.lastActivity ? new Date(sessionData.performance.lastActivity) : now)
        },
        handoff: {
          ...sessionData.handoff,
          handoffTimestamp: sessionData.handoff.handoffTimestamp ? Timestamp.fromDate(new Date(sessionData.handoff.handoffTimestamp)) : undefined
        },
        rateLimit: {
          ...sessionData.rateLimit,
          lastRequestTime: Timestamp.fromDate(sessionData.rateLimit.lastRequestTime ? new Date(sessionData.rateLimit.lastRequestTime) : now),
          resetTime: Timestamp.fromDate(sessionData.rateLimit.resetTime ? new Date(sessionData.rateLimit.resetTime) : new Date(now.getTime() + 3600000))
        },
        health: {
          ...sessionData.health,
          lastHeartbeat: Timestamp.fromDate(sessionData.health.lastHeartbeat ? new Date(sessionData.health.lastHeartbeat) : now)
        },
        metadata: {
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiresAt),
          version: '1.0.0',
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          agentVersion: '1.0.0',
          schemaVersion: '1.0.0'
        }
      };

      if (this.isMock()) {
        ProductIntelligenceFirestore.mockPISessions.set(sessionData.sessionId, firestoreDoc);
        console.log(`[MOCK MODE] Created PI session: ${sessionData.sessionId}`);
        
        // Convert back to SessionState format
        return this.convertFirestoreDocToSessionState(firestoreDoc);
      }

      if (!this.piSessionsCollection) {
        throw new Error('Product Intelligence sessions collection not initialized');
      }

      await this.piSessionsCollection.doc(sessionData.sessionId).set(firestoreDoc);
      
      // Convert back to SessionState format
      return this.convertFirestoreDocToSessionState(firestoreDoc);

    } catch (error) {
      console.error('Failed to create PI session:', error);
      throw new Error(`Failed to create PI session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Product Intelligence session by ID
   */
  public async getPISession(sessionId: string): Promise<SessionState | null> {
    try {
      if (this.isMock()) {
        const session = ProductIntelligenceFirestore.mockPISessions.get(sessionId);
        if (session) {
          console.log(`[MOCK MODE] Retrieved PI session: ${sessionId}`);
          return this.convertFirestoreDocToSessionState(session);
        }
        return null;
      }

      if (!this.piSessionsCollection) {
        throw new Error('Product Intelligence sessions collection not initialized');
      }

      const doc = await this.piSessionsCollection.doc(sessionId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as ProductIntelligenceSessionDoc;
      return this.convertFirestoreDocToSessionState(data);

    } catch (error) {
      console.error('Failed to get PI session:', error);
      return null;
    }
  }

  /**
   * Update Product Intelligence session
   */
  public async updatePISession(sessionId: string, updates: Partial<SessionState>): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        metadata: {
          ...updates.metadata,
          updatedAt: Timestamp.fromDate(new Date())
        }
      };

      if (this.isMock()) {
        const existingSession = ProductIntelligenceFirestore.mockPISessions.get(sessionId);
        if (existingSession) {
          // Convert updates to Firestore format and merge
          const updatedDoc = { ...existingSession, ...this.convertSessionStateToFirestoreDoc(updates as SessionState) };
          ProductIntelligenceFirestore.mockPISessions.set(sessionId, updatedDoc);
          console.log(`[MOCK MODE] Updated PI session: ${sessionId}`);
          return true;
        }
        return false;
      }

      if (!this.piSessionsCollection) {
        throw new Error('Product Intelligence sessions collection not initialized');
      }

      // Convert updates to Firestore format
      const firestoreUpdates = this.convertSessionStateToFirestoreDoc(updates as SessionState);
      
      await this.piSessionsCollection.doc(sessionId).update(firestoreUpdates);
      return true;

    } catch (error) {
      console.error('Failed to update PI session:', error);
      return false;
    }
  }

  /**
   * Add chat message to separate collection
   */
  public async addPIChatMessage(sessionId: string, message: Omit<ChatMessage, 'id'>): Promise<boolean> {
    try {
      const chatMessage: ChatMessageDoc = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        type: message.type,
        content: message.content,
        timestamp: Timestamp.fromDate(new Date(message.timestamp)),
        agentName: message.agentName,
        metadata: message.metadata
      };

      if (this.isMock()) {
        const existingMessages = ProductIntelligenceFirestore.mockPIChats.get(sessionId) || [];
        existingMessages.push(chatMessage);
        ProductIntelligenceFirestore.mockPIChats.set(sessionId, existingMessages);
        console.log(`[MOCK MODE] Added PI chat message to session: ${sessionId}`);
        return true;
      }

      if (!this.piChatCollection) {
        throw new Error('Product Intelligence chat collection not initialized');
      }

      await this.piChatCollection.doc(chatMessage.id).set(chatMessage);
      return true;

    } catch (error) {
      console.error('Failed to add PI chat message:', error);
      return false;
    }
  }

  /**
   * Get chat messages for session
   */
  public async getPIChatMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    try {
      if (this.isMock()) {
        const messages = ProductIntelligenceFirestore.mockPIChats.get(sessionId) || [];
        return messages
          .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime())
          .slice(-limit)
          .map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp.toDate().getTime(),
            agentName: msg.agentName,
            metadata: msg.metadata ? {
              ...msg.metadata,
              messageType: msg.metadata.messageType as any // Type assertion for enum compatibility
            } : undefined
          }));
      }

      if (!this.piChatCollection) {
        throw new Error('Product Intelligence chat collection not initialized');
      }

      const snapshot: QuerySnapshot<DocumentData> = await this.piChatCollection
        .where('sessionId', '==', sessionId)
        .orderBy('timestamp', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data() as ChatMessageDoc;
        return {
          id: data.id,
          type: data.type,
          content: data.content,
          timestamp: data.timestamp.toDate().getTime(),
          agentName: data.agentName,
          metadata: data.metadata ? {
            ...data.metadata,
            messageType: data.metadata.messageType as any // Type assertion for enum compatibility
          } : undefined
        };
      });

    } catch (error) {
      console.error('Failed to get PI chat messages:', error);
      return [];
    }
  }

  /**
   * Store product analysis (with auto-cleanup)
   */
  public async storePIAnalysis(sessionId: string, analysis: ProductAnalysis): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      const analysisDoc: ProductAnalysisDoc = {
        sessionId,
        analysis,
        version: '1.0.0',
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt)
      };

      if (this.isMock()) {
        ProductIntelligenceFirestore.mockPIAnalyses.set(sessionId, analysisDoc);
        console.log(`[MOCK MODE] Stored PI analysis for session: ${sessionId}`);
        return true;
      }

      if (!this.piAnalysisCollection) {
        throw new Error('Product Intelligence analysis collection not initialized');
      }

      await this.piAnalysisCollection.doc(sessionId).set(analysisDoc);
      return true;

    } catch (error) {
      console.error('Failed to store PI analysis:', error);
      return false;
    }
  }

  /**
   * Convert Firestore document to SessionState
   */
  private convertFirestoreDocToSessionState(doc: ProductIntelligenceSessionDoc): SessionState {
    return {
      sessionId: doc.sessionId,
      status: doc.status,
      currentAgent: doc.currentAgent,
      user: {
        ...doc.user,
        joinedAt: doc.user.joinedAt.toDate().getTime(),
        lastActivity: doc.user.lastActivity.toDate().getTime()
      },
      product: {
        ...doc.product,
        uploadTimestamp: doc.product.uploadTimestamp.toDate().getTime()
      },
      conversation: {
        ...doc.conversation,
        lastMessageTimestamp: doc.conversation.lastMessageTimestamp.toDate().getTime(),
        messages: [], // Messages are stored separately
        context: {
          ...doc.conversation.context,
          topics: {
            productFeatures: doc.conversation.context.topics.productFeatures as TopicStatus,
            targetAudience: doc.conversation.context.topics.targetAudience as TopicStatus,
            brandPositioning: doc.conversation.context.topics.brandPositioning as TopicStatus,
            visualPreferences: doc.conversation.context.topics.visualPreferences as TopicStatus
          }
        }
      },
      progress: doc.progress,
      costs: doc.costs,
      performance: {
        ...doc.performance,
        startTime: doc.performance.startTime.toDate().getTime(),
        lastActivity: doc.performance.lastActivity.toDate().getTime()
      },
      handoff: {
        ...doc.handoff,
        handoffTimestamp: doc.handoff.handoffTimestamp?.toDate().getTime()
      },
      rateLimit: {
        ...doc.rateLimit,
        lastRequestTime: doc.rateLimit.lastRequestTime.toDate().getTime(),
        resetTime: doc.rateLimit.resetTime.toDate().getTime()
      },
      health: {
        ...doc.health,
        lastHeartbeat: doc.health.lastHeartbeat.toDate().getTime()
      },
      metadata: {
        createdAt: doc.metadata.createdAt.toDate().getTime(),
        updatedAt: doc.metadata.updatedAt.toDate().getTime(),
        version: doc.metadata.version,
        environment: doc.metadata.environment,
        agentVersion: doc.metadata.agentVersion,
        schemaVersion: doc.metadata.schemaVersion
      }
    };
  }

  /**
   * Convert SessionState to Firestore document (for updates)
   */
  private convertSessionStateToFirestoreDoc(session: SessionState): Partial<ProductIntelligenceSessionDoc> {
    const doc: any = { ...session };
    
    // Convert timestamp fields
    if (session.user?.joinedAt) {
      doc.user.joinedAt = Timestamp.fromDate(new Date(session.user.joinedAt));
    }
    if (session.user?.lastActivity) {
      doc.user.lastActivity = Timestamp.fromDate(new Date(session.user.lastActivity));
    }
    if (session.product?.uploadTimestamp) {
      doc.product.uploadTimestamp = Timestamp.fromDate(new Date(session.product.uploadTimestamp));
    }
    if (session.conversation?.lastMessageTimestamp) {
      doc.conversation.lastMessageTimestamp = Timestamp.fromDate(new Date(session.conversation.lastMessageTimestamp));
    }
    if (session.performance?.startTime) {
      doc.performance.startTime = Timestamp.fromDate(new Date(session.performance.startTime));
    }
    if (session.performance?.lastActivity) {
      doc.performance.lastActivity = Timestamp.fromDate(new Date(session.performance.lastActivity));
    }
    if (session.handoff?.handoffTimestamp) {
      doc.handoff.handoffTimestamp = Timestamp.fromDate(new Date(session.handoff.handoffTimestamp));
    }
    if (session.rateLimit?.lastRequestTime) {
      doc.rateLimit.lastRequestTime = Timestamp.fromDate(new Date(session.rateLimit.lastRequestTime));
    }
    if (session.rateLimit?.resetTime) {
      doc.rateLimit.resetTime = Timestamp.fromDate(new Date(session.rateLimit.resetTime));
    }
    if (session.health?.lastHeartbeat) {
      doc.health.lastHeartbeat = Timestamp.fromDate(new Date(session.health.lastHeartbeat));
    }
    if (session.metadata?.createdAt) {
      doc.metadata.createdAt = Timestamp.fromDate(new Date(session.metadata.createdAt));
    }
    if (session.metadata?.updatedAt) {
      doc.metadata.updatedAt = Timestamp.fromDate(new Date(session.metadata.updatedAt));
    }

    return doc;
  }
}