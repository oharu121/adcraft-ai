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
 */
export class FirestoreService {
  private static instance: FirestoreService;
  private db: Firestore;
  private sessionsCollection: CollectionReference<DocumentData>;
  private jobsCollection: CollectionReference<DocumentData>;
  private costsCollection: CollectionReference<DocumentData>;

  private constructor() {
    const projectId = process.env.GCP_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required');
    }

    // Initialize Firestore
    this.db = new Firestore({
      projectId,
      databaseId: '(default)',
    });

    // Initialize collections
    this.sessionsCollection = this.db.collection('sessions');
    this.jobsCollection = this.db.collection('videoJobs');
    this.costsCollection = this.db.collection('costs');
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
  public async createSession(prompt: string, userId?: string): Promise<VideoSession> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

      const sessionData: Omit<VideoSession, 'id'> = {
        userId,
        prompt,
        chatHistory: [],
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      const docRef = await this.sessionsCollection.add(sessionData);
      
      return {
        id: docRef.id,
        ...sessionData,
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

      await this.sessionsCollection.doc(sessionId).update(updateData);
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
    estimatedCost: number
  ): Promise<VideoJob> {
    try {
      const now = new Date();
      
      const jobData: Omit<VideoJob, 'id'> = {
        sessionId,
        prompt,
        status: 'pending',
        estimatedCost,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.jobsCollection.add(jobData);
      
      return {
        id: docRef.id,
        ...jobData,
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

      await this.jobsCollection.doc(jobId).update(updateData);
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
      const costData = {
        ...entry,
        timestamp: new Date(),
      };

      const docRef = await this.costsCollection.add(costData);
      
      return {
        id: docRef.id,
        ...costData,
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