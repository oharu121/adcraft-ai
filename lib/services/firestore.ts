import { Firestore, CollectionReference, DocumentData, QuerySnapshot, FieldValue } from '@google-cloud/firestore';
import { ProductAnalysis } from '@/lib/agents/product-intelligence/types/product-analysis';
import { ChatMessage as PIChat } from '@/lib/agents/product-intelligence/types/conversation';
import { AppModeConfig } from '@/lib/config/app-mode';

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
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface VideoJob {
  id: string;
  sessionId: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostEntry {
  id: string;
  service: 'veo' | 'gemini' | 'storage' | 'other';
  amount: number;
  currency: 'USD';
  description: string;
  sessionId?: string;
  jobId?: string;
  timestamp: Date;
}

export interface ProductIntelligenceSession {
  id: string;
  productAnalysis: ProductAnalysis | null;
  conversationHistory: PIChat[];
  status: 'active' | 'completed' | 'expired';
  locale: 'en' | 'ja';
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  pendingStrategy?: any;
  pendingStrategyTimestamp?: Date;
}

/**
 * Firestore service for managing sessions, jobs, and cost tracking
 * Handles all database operations with proper indexing and lifecycle management
 * Supports mock mode for local testing without GCP credentials
 */
export class FirestoreService {
  private static instance: FirestoreService;
  private db: Firestore | null = null;
  private sessionsCollection: CollectionReference<DocumentData> | null = null;
  private jobsCollection: CollectionReference<DocumentData> | null = null;
  private costsCollection: CollectionReference<DocumentData> | null = null;
  private piSessionsCollection: CollectionReference<DocumentData> | null = null;
  
  // Mock data stores for development (static to persist across instances)
  private static mockSessions: Map<string, VideoSession> = new Map();
  private static mockJobs: Map<string, VideoJob> = new Map();
  private static mockCosts: CostEntry[] = [];
  private static mockPISessions: Map<string, ProductIntelligenceSession> = new Map();

  private constructor() {
    const projectId = process.env.GCP_PROJECT_ID;
    
    // Initialize Firestore if we have credentials (for production)
    if (projectId) {
      this.db = new Firestore({
        projectId: projectId!,
        databaseId: '(default)',
      });

      // Initialize collections
      this.sessionsCollection = this.db.collection('sessions');
      this.jobsCollection = this.db.collection('videoJobs');
      this.costsCollection = this.db.collection('costs');
      this.piSessionsCollection = this.db.collection('productIntelligenceSessions');
      console.log('[FIRESTORE] Initialized with real Firestore');
    } else {
      console.log('[FIRESTORE] No GCP credentials - will use mock mode when AppModeConfig.mode === demo');
    }
  }

  /**
   * Get singleton instance of FirestoreService
   */
  public static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }



  // Session Management

  /**
   * Create new video session
   */
  public async createSession(prompt: string, userId?: string, sessionId?: string): Promise<VideoSession> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours
      const finalSessionId = sessionId || crypto.randomUUID();

      const sessionData: VideoSession = {
        id: finalSessionId,
        userId,
        prompt,
        chatHistory: [],
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      if (AppModeConfig.mode === 'demo') {
        FirestoreService.mockSessions.set(finalSessionId, sessionData);
        console.log(`[MOCK MODE] Created session: ${finalSessionId}`);
        return sessionData;
      }

      if (!this.sessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      // Filter out undefined values for Firestore
      const firestoreData = Object.fromEntries(
        Object.entries(sessionData).filter(([_, value]) => value !== undefined)
      );

      // Use set() with the custom session ID instead of add() to maintain ID consistency
      await this.sessionsCollection.doc(finalSessionId).set(firestoreData);
      
      // Return the session with the original custom ID
      return sessionData;

    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<VideoSession | null> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const session = FirestoreService.mockSessions.get(sessionId);
        if (session) {
          console.log(`[MOCK MODE] Retrieved session: ${sessionId}`);
          return session;
        } else {
          console.log(`[MOCK MODE] Session not found: ${sessionId}`);
          return null;
        }
      }

      if (!this.sessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      const doc = await this.sessionsCollection.doc(sessionId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        expiresAt: data?.expiresAt?.toDate() || new Date(),
        chatHistory: data?.chatHistory?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date(),
        })) || [],
      } as VideoSession;

    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Update session
   */
  public async updateSession(sessionId: string, updates: Partial<VideoSession>): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockSessions.get(sessionId);
        if (existingSession) {
          FirestoreService.mockSessions.set(sessionId, { ...existingSession, ...updateData });
          console.log(`[MOCK MODE] Updated session: ${sessionId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] Session not found: ${sessionId}`);
          return false;
        }
      }

      if (!this.sessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      // Filter out undefined values for Firestore
      const firestoreUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await this.sessionsCollection.doc(sessionId).update(firestoreUpdateData);
      return true;

    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }

  /**
   * Add message to chat history
   */
  public async addChatMessage(sessionId: string, message: Omit<ChatMessage, 'id'>): Promise<boolean> {
    try {
      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        ...message,
      };

      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockSessions.get(sessionId);
        if (existingSession) {
          existingSession.chatHistory.push(chatMessage);
          existingSession.updatedAt = new Date();
          console.log(`[MOCK MODE] Added chat message to session: ${sessionId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] Session not found for chat message: ${sessionId}`);
          return false;
        }
      }

      if (!this.sessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      await this.sessionsCollection.doc(sessionId).update({
        chatHistory: FieldValue.arrayUnion(chatMessage),
        updatedAt: new Date(),
      });

      return true;

    } catch (error) {
      console.error('Failed to add chat message:', error);
      return false;
    }
  }

  // Video Job Management

  /**
   * Create new video job
   */
  public async createVideoJob(
    sessionId: string,
    prompt: string,
    estimatedCost: number,
    jobId?: string, // Optional simple job ID for Firestore
    operationId?: string // Optional operation ID from external service (like Veo)
  ): Promise<VideoJob> {
    try {
      const now = new Date();
      const finalJobId = jobId || crypto.randomUUID();
      
      const jobData: VideoJob = {
        id: finalJobId,
        sessionId,
        prompt,
        status: 'pending',
        estimatedCost,
        createdAt: now,
        updatedAt: now,
        ...(operationId && { veoJobId: operationId }), // Store operation ID if provided
      };

      if (AppModeConfig.mode === 'demo') {
        FirestoreService.mockJobs.set(finalJobId, jobData);
        console.log(`[MOCK MODE] Created video job: ${finalJobId}`);
        return jobData;
      }

      if (!this.jobsCollection) {
        throw new Error('Firestore not initialized');
      }

      // Use set() with the custom job ID instead of add() to maintain ID consistency
      await this.jobsCollection.doc(finalJobId).set(jobData);
      
      // Return the job with the original custom ID
      return jobData;

    } catch (error) {
      console.error('Failed to create video job:', error);
      throw new Error(`Failed to create video job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get video job by ID
   */
  public async getVideoJob(jobId: string): Promise<VideoJob | null> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const job = FirestoreService.mockJobs.get(jobId);
        if (job) {
          console.log(`[MOCK MODE] Retrieved video job: ${jobId}`);
          return job;
        } else {
          console.log(`[MOCK MODE] Video job not found: ${jobId}`);
          return null;
        }
      }

      if (!this.jobsCollection) {
        throw new Error('Firestore not initialized');
      }

      const doc = await this.jobsCollection.doc(jobId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      } as VideoJob;

    } catch (error) {
      console.error('Failed to get video job:', error);
      return null;
    }
  }

  /**
   * Update video job
   */
  public async updateVideoJob(jobId: string, updates: Partial<VideoJob>): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (AppModeConfig.mode === 'demo') {
        const existingJob = FirestoreService.mockJobs.get(jobId);
        if (existingJob) {
          FirestoreService.mockJobs.set(jobId, { ...existingJob, ...updateData });
          console.log(`[MOCK MODE] Updated video job: ${jobId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] Video job not found: ${jobId}`);
          return false;
        }
      }

      if (!this.jobsCollection) {
        throw new Error('Firestore not initialized');
      }

      // Filter out undefined values for Firestore
      const firestoreUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await this.jobsCollection.doc(jobId).update(firestoreUpdateData);
      return true;

    } catch (error) {
      console.error('Failed to update video job:', error);
      return false;
    }
  }

  /**
   * Get jobs by status
   */
  public async getJobsByStatus(status: VideoJob['status'], limit = 50): Promise<VideoJob[]> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const filteredJobs = Array.from(FirestoreService.mockJobs.values())
          .filter(job => job.status === status)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
        console.log(`[MOCK MODE] Retrieved ${filteredJobs.length} jobs with status: ${status}`);
        return filteredJobs;
      }

      if (!this.jobsCollection) {
        throw new Error('Firestore not initialized');
      }

      const snapshot: QuerySnapshot<DocumentData> = await this.jobsCollection
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as VideoJob;
      });

    } catch (error) {
      console.error('Failed to get jobs by status:', error);
      return [];
    }
  }

  // Cost Tracking

  /**
   * Record cost entry
   */
  public async recordCost(entry: Omit<CostEntry, 'id'>): Promise<CostEntry> {
    try {
      const costId = crypto.randomUUID();
      const costData: CostEntry = {
        id: costId,
        ...entry,
        timestamp: new Date(),
      };

      if (AppModeConfig.mode === 'demo') {
        FirestoreService.mockCosts.push(costData);
        console.log(`[MOCK MODE] Recorded cost: $${costData.amount} for ${costData.service}`);
        return costData;
      }

      if (!this.costsCollection) {
        throw new Error('Firestore not initialized');
      }

      const docRef = await this.costsCollection.add(costData);
      
      return {
        ...costData,
        id: docRef.id,
      };

    } catch (error) {
      console.error('Failed to record cost:', error);
      throw new Error(`Failed to record cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get total costs for time period
   */
  public async getTotalCosts(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      if (AppModeConfig.mode === 'demo') {
        // Filter mock costs by date range if provided
        let filteredCosts = FirestoreService.mockCosts;
        
        if (startDate) {
          filteredCosts = filteredCosts.filter(cost => cost.timestamp >= startDate);
        }
        if (endDate) {
          filteredCosts = filteredCosts.filter(cost => cost.timestamp <= endDate);
        }

        const total = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
        console.log(`[MOCK MODE] Total costs: $${total.toFixed(2)}`);
        return total;
      }

      if (!this.costsCollection) {
        throw new Error('Firestore not initialized');
      }

      let query = this.costsCollection as any;

      if (startDate) {
        query = query.where('timestamp', '>=', startDate);
      }
      if (endDate) {
        query = query.where('timestamp', '<=', endDate);
      }

      const snapshot: QuerySnapshot<DocumentData> = await query.get();
      
      return snapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        return total + (data.amount || 0);
      }, 0);

    } catch (error) {
      console.error('Failed to get total costs:', error);
      return 0;
    }
  }

  /**
   * Get cost breakdown by service
   */
  public async getCostBreakdown(startDate?: Date, endDate?: Date): Promise<Record<string, number>> {
    try {
      let query = this.costsCollection as any;

      if (startDate) {
        query = query.where('timestamp', '>=', startDate);
      }
      if (endDate) {
        query = query.where('timestamp', '<=', endDate);
      }

      const snapshot: QuerySnapshot<DocumentData> = await query.get();
      
      const breakdown: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const service = data.service || 'other';
        breakdown[service] = (breakdown[service] || 0) + (data.amount || 0);
      });

      return breakdown;

    } catch (error) {
      console.error('Failed to get cost breakdown:', error);
      return {};
    }
  }

  // Cleanup and Maintenance

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<number> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const now = new Date();
        const expiredSessionIds: string[] = [];
        
        FirestoreService.mockSessions.forEach((session, sessionId) => {
          if (session.expiresAt <= now) {
            expiredSessionIds.push(sessionId);
          }
        });
        
        expiredSessionIds.forEach(sessionId => {
          FirestoreService.mockSessions.delete(sessionId);
        });
        
        console.log(`[MOCK MODE] Cleaned up ${expiredSessionIds.length} expired sessions`);
        return expiredSessionIds.length;
      }

      if (!this.sessionsCollection || !this.db) {
        throw new Error('Firestore not initialized');
      }

      const now = new Date();
      const snapshot: QuerySnapshot<DocumentData> = await this.sessionsCollection
        .where('expiresAt', '<=', now)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`Cleaned up ${snapshot.docs.length} expired sessions`);
      return snapshot.docs.length;

    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  /**
   * Health check for Firestore service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (AppModeConfig.mode === 'demo') {
        console.log('[MOCK MODE] Health check passed');
        return true;
      }

      if (!this.sessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      // Try to read from a collection to test connectivity
      const snapshot = await this.sessionsCollection.limit(1).get();
      return true;
    } catch (error) {
      console.error('Firestore health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalJobs: number;
    totalCosts: number;
  }> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const now = new Date();
        const activeSessions = Array.from(FirestoreService.mockSessions.values())
          .filter(session => session.expiresAt > now).length;
        const totalCosts = await this.getTotalCosts();
        
        const stats = {
          totalSessions: FirestoreService.mockSessions.size,
          activeSessions,
          totalJobs: FirestoreService.mockJobs.size,
          totalCosts,
        };
        
        console.log(`[MOCK MODE] Database stats:`, stats);
        return stats;
      }

      if (!this.sessionsCollection || !this.jobsCollection) {
        throw new Error('Firestore not initialized');
      }

      const now = new Date();
      
      const [sessionsSnapshot, activeSessionsSnapshot, jobsSnapshot] = await Promise.all([
        this.sessionsCollection.count().get(),
        this.sessionsCollection.where('expiresAt', '>', now).count().get(),
        this.jobsCollection.count().get(),
      ]);

      const totalCosts = await this.getTotalCosts();

      return {
        totalSessions: sessionsSnapshot.data().count,
        activeSessions: activeSessionsSnapshot.data().count,
        totalJobs: jobsSnapshot.data().count,
        totalCosts,
      };

    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalJobs: 0,
        totalCosts: 0,
      };
    }
  }

  // Product Intelligence Session Management

  /**
   * Create new product intelligence session
   */
  public async createPISession(
    sessionId: string,
    locale: 'en' | 'ja' = 'en',
  ): Promise<ProductIntelligenceSession> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

      const sessionData: ProductIntelligenceSession = {
        id: sessionId,
        productAnalysis: null,
        conversationHistory: [],
        status: 'active',
        locale,
        totalCost: 0,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      if (AppModeConfig.mode === 'demo') {
        FirestoreService.mockPISessions.set(sessionId, sessionData);
        console.log(`[MOCK MODE] Created PI session: ${sessionId}`);
        return sessionData;
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      // Filter out undefined values for Firestore
      const firestoreData = Object.fromEntries(
        Object.entries(sessionData).filter(([_, value]) => value !== undefined)
      );

      await this.piSessionsCollection.doc(sessionId).set(firestoreData);
      console.log(`[FIRESTORE] Created PI session: ${sessionId}`);
      
      return sessionData;

    } catch (error) {
      console.error('Failed to create PI session:', error);
      throw new Error(`Failed to create PI session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get product intelligence session by ID
   */
  public async getPISession(sessionId: string): Promise<ProductIntelligenceSession | null> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const session = FirestoreService.mockPISessions.get(sessionId);
        if (session) {
          console.log(`[MOCK MODE] Retrieved PI session: ${sessionId}`);
          return session;
        } else {
          console.log(`[MOCK MODE] PI session not found: ${sessionId}`);
          return null;
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      const doc = await this.piSessionsCollection.doc(sessionId).get();
      
      if (!doc.exists) {
        console.log(`[FIRESTORE] PI session not found: ${sessionId}`);
        return null;
      }

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        expiresAt: data?.expiresAt?.toDate() || new Date(),
        conversationHistory: data?.conversationHistory || [],
        productAnalysis: data?.productAnalysis || null,
      } as ProductIntelligenceSession;

    } catch (error) {
      console.error('Failed to get PI session:', error);
      return null;
    }
  }

  /**
   * Store product analysis in session
   */
  public async storePIAnalysis(sessionId: string, analysis: ProductAnalysis): Promise<boolean> {
    try {
      const updateData = {
        productAnalysis: analysis,
        updatedAt: new Date(),
      };

      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        if (existingSession) {
          FirestoreService.mockPISessions.set(sessionId, { ...existingSession, ...updateData });
          console.log(`[MOCK MODE] Stored analysis for PI session: ${sessionId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] PI session not found: ${sessionId}`);
          return false;
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      await this.piSessionsCollection.doc(sessionId).update(updateData);
      console.log(`[FIRESTORE] Stored analysis for PI session: ${sessionId}`);
      return true;

    } catch (error) {
      console.error('Failed to store PI analysis:', error);
      return false;
    }
  }

  /**
   * Store pending strategy awaiting user confirmation
   */
  public async storePendingStrategy(sessionId: string, pendingStrategy: any): Promise<boolean> {
    try {
      const updateData = {
        pendingStrategy: pendingStrategy,
        pendingStrategyTimestamp: new Date(),
        updatedAt: new Date(),
      };

      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        if (existingSession) {
          FirestoreService.mockPISessions.set(sessionId, { ...existingSession, ...updateData });
          console.log(`[MOCK MODE] Stored pending strategy for PI session: ${sessionId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] PI session not found for pending strategy: ${sessionId}`);
          return false;
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      await this.piSessionsCollection.doc(sessionId).update(updateData);
      console.log(`[FIRESTORE] Stored pending strategy for PI session: ${sessionId}`);

      return true;
    } catch (error) {
      console.error(`Error storing pending strategy for session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Update session with confirmed strategy
   */
  public async confirmPendingStrategy(sessionId: string): Promise<{ success: boolean; updatedStrategy?: any }> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        console.log(`[DEBUG] Session exists:`, !!existingSession);
        console.log(`[DEBUG] Has pendingStrategy:`, !!existingSession?.pendingStrategy);
        console.log(`[DEBUG] Has productAnalysis:`, !!existingSession?.productAnalysis);
        if (existingSession?.pendingStrategy) {
          console.log(`[DEBUG] pendingStrategy keys:`, Object.keys(existingSession.pendingStrategy));
        }
        if (existingSession && existingSession.pendingStrategy && existingSession.productAnalysis) {
          // Move pending strategy to confirmed strategy
          existingSession.productAnalysis.commercialStrategy = existingSession.pendingStrategy;
          const updatedStrategy = existingSession.pendingStrategy;
          // Clear pending strategy
          delete existingSession.pendingStrategy;
          delete existingSession.pendingStrategyTimestamp;
          existingSession.updatedAt = new Date();
          console.log(`[MOCK MODE] Confirmed pending strategy for PI session: ${sessionId}`);
          return { success: true, updatedStrategy };
        } else {
          console.warn(`[MOCK MODE] No pending strategy found for session: ${sessionId}`);
          return { success: false };
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      // Get current session data
      const sessionDoc = await this.piSessionsCollection.doc(sessionId).get();
      if (!sessionDoc.exists) {
        console.warn(`Session not found for confirmation: ${sessionId}`);
        return { success: false };
      }

      const sessionData = sessionDoc.data();
      if (!sessionData?.pendingStrategy) {
        console.warn(`No pending strategy found for confirmation: ${sessionId}`);
        return { success: false };
      }

      const updatedStrategy = sessionData.pendingStrategy;

      // Update confirmed strategy and clear pending
      await this.piSessionsCollection.doc(sessionId).update({
        'productAnalysis.commercialStrategy': sessionData.pendingStrategy,
        pendingStrategy: FieldValue.delete(),
        pendingStrategyTimestamp: FieldValue.delete(),
        updatedAt: new Date(),
      });

      console.log(`[FIRESTORE] Confirmed pending strategy for PI session: ${sessionId}`);
      return { success: true, updatedStrategy };
    } catch (error) {
      console.error(`Error confirming pending strategy for session ${sessionId}:`, error);
      return { success: false };
    }
  }

  /**
   * Clear pending strategy (user rejected)
   */
  public async clearPendingStrategy(sessionId: string): Promise<boolean> {
    try {
      const updateData = {
        pendingStrategy: FieldValue.delete(),
        pendingStrategyTimestamp: FieldValue.delete(),
        updatedAt: new Date(),
      };

      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        if (existingSession) {
          delete existingSession.pendingStrategy;
          delete existingSession.pendingStrategyTimestamp;
          existingSession.updatedAt = new Date();
          console.log(`[MOCK MODE] Cleared pending strategy for PI session: ${sessionId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] PI session not found for clearing: ${sessionId}`);
          return false;
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      await this.piSessionsCollection.doc(sessionId).update(updateData);
      console.log(`[FIRESTORE] Cleared pending strategy for PI session: ${sessionId}`);

      return true;
    } catch (error) {
      console.error(`Error clearing pending strategy for session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Add chat message to PI session history
   */
  public async addPIChatMessage(sessionId: string, message: PIChat): Promise<boolean> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        if (existingSession) {
          existingSession.conversationHistory.push(message);
          existingSession.updatedAt = new Date();
          console.log(`[MOCK MODE] Added chat message to PI session: ${sessionId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] PI session not found for chat message: ${sessionId}`);
          return false;
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      await this.piSessionsCollection.doc(sessionId).update({
        conversationHistory: FieldValue.arrayUnion(message),
        updatedAt: new Date(),
      });
      console.log(`[FIRESTORE] Added chat message to PI session: ${sessionId}`);

      return true;

    } catch (error) {
      console.error('Failed to add PI chat message:', error);
      return false;
    }
  }

  /**
   * Update PI session cost
   */
  public async updatePICost(sessionId: string, additionalCost: number): Promise<boolean> {
    try {
      if (AppModeConfig.mode === 'demo') {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        if (existingSession) {
          existingSession.totalCost += additionalCost;
          existingSession.updatedAt = new Date();
          console.log(`[MOCK MODE] Updated cost for PI session: ${sessionId} (+$${additionalCost})`);
          return true;
        } else {
          console.warn(`[MOCK MODE] PI session not found for cost update: ${sessionId}`);
          return false;
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error('Firestore not initialized');
      }

      await this.piSessionsCollection.doc(sessionId).update({
        totalCost: FieldValue.increment(additionalCost),
        updatedAt: new Date(),
      });
      console.log(`[FIRESTORE] Updated cost for PI session: ${sessionId} (+$${additionalCost})`);

      return true;

    } catch (error) {
      console.error('Failed to update PI cost:', error);
      return false;
    }
  }
}