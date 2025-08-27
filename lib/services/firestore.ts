import { Firestore, CollectionReference, DocumentData, QuerySnapshot, FieldValue } from '@google-cloud/firestore';

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
  private isMockMode: boolean;
  
  // Mock data stores for development (static to persist across instances)
  private static mockSessions: Map<string, VideoSession> = new Map();
  private static mockJobs: Map<string, VideoJob> = new Map();
  private static mockCosts: CostEntry[] = [];

  private constructor() {
    const projectId = process.env.GCP_PROJECT_ID;
    this.isMockMode = process.env.NODE_ENV === 'development' && 
                      (process.env.ENABLE_MOCK_MODE === 'true' || !projectId);
    
    if (!projectId && !this.isMockMode) {
      throw new Error('GCP_PROJECT_ID environment variable is required for production mode');
    }

    if (this.isMockMode) {
      console.log('[MOCK MODE] Using in-memory storage for Firestore operations');
    } else {
      // Initialize Firestore
      this.db = new Firestore({
        projectId: projectId!,
        databaseId: '(default)',
      });

      // Initialize collections
      this.sessionsCollection = this.db.collection('sessions');
      this.jobsCollection = this.db.collection('videoJobs');
      this.costsCollection = this.db.collection('costs');
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

  /**
   * Check if service is running in mock mode
   */
  public isMock(): boolean {
    return this.isMockMode;
  }

  // Session Management

  /**
   * Create new video session
   */
  public async createSession(prompt: string, userId?: string, sessionId?: string): Promise<VideoSession> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours
      const finalSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;

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

      if (this.isMockMode) {
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

      const docRef = await this.sessionsCollection.add(firestoreData);
      
      return {
        ...sessionData,
        id: docRef.id,
      };

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
      if (this.isMockMode) {
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

      if (this.isMockMode) {
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
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...message,
      };

      if (this.isMockMode) {
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
      const finalJobId = jobId || `job-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
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

      if (this.isMockMode) {
        FirestoreService.mockJobs.set(finalJobId, jobData);
        console.log(`[MOCK MODE] Created video job: ${finalJobId}`);
        return jobData;
      }

      if (!this.jobsCollection) {
        throw new Error('Firestore not initialized');
      }

      const docRef = await this.jobsCollection.add(jobData);
      
      return {
        ...jobData,
        id: docRef.id,
      };

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
      if (this.isMockMode) {
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

      if (this.isMockMode) {
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
      if (this.isMockMode) {
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
      const costId = `cost-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const costData: CostEntry = {
        id: costId,
        ...entry,
        timestamp: new Date(),
      };

      if (this.isMockMode) {
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
      if (this.isMockMode) {
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
      if (this.isMockMode) {
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
      if (this.isMockMode) {
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
      if (this.isMockMode) {
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
}