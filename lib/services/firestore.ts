import {
  Firestore,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  FieldValue,
} from "@google-cloud/firestore";
import { ProductAnalysis } from "@/lib/agents/product-intelligence/types/product-analysis";
import { ChatMessage as PIChat } from "@/lib/agents/product-intelligence/types/conversation";
import { AppModeConfig } from "@/lib/config/app-mode";

export interface VideoSession {
  id: string;
  userId?: string;
  prompt: string;
  refinedPrompt?: string;
  chatHistory: ChatMessage[];
  videoJobId?: string;
  status: "draft" | "generating" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface VideoJob {
  id: string;
  sessionId: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
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
  service: "veo" | "gemini" | "storage" | "imagen" | "vertex-ai" | "firestore" | "other";
  amount: number;
  currency: "USD";
  description: string;
  sessionId?: string;
  jobId?: string;
  timestamp: Date;
}

export interface ProductIntelligenceSession {
  id: string;
  productAnalysis: ProductAnalysis | null;
  conversationHistory: PIChat[];
  status: "active" | "completed" | "expired";
  locale: "en" | "ja";
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
  private creativeSessionsCollection: CollectionReference<DocumentData> | null = null;

  // Mock data stores for development (static to persist across instances)
  private static mockSessions: Map<string, VideoSession> = new Map();
  private static mockJobs: Map<string, VideoJob> = new Map();
  private static mockCosts: CostEntry[] = [];
  private static mockPISessions: Map<string, ProductIntelligenceSession> = new Map();
  private static mockCreativeSessions: Map<string, any> = new Map();

  private constructor() {
    const projectId = process.env.GCP_PROJECT_ID;

    // Initialize Firestore if we have credentials (for production)
    if (projectId) {
      this.db = new Firestore({
        projectId: projectId!,
        databaseId: "(default)",
      });

      // Initialize collections
      this.sessionsCollection = this.db.collection("sessions");
      this.jobsCollection = this.db.collection("videoJobs");
      this.costsCollection = this.db.collection("costs");
      this.piSessionsCollection = this.db.collection("productIntelligenceSessions");
      this.creativeSessionsCollection = this.db.collection("creativeDirectorSessions");
      console.log("[FIRESTORE] Initialized with real Firestore");
    } else {
      console.log(
        "[FIRESTORE] No GCP credentials - will use mock mode when AppModeConfig.getMode() === demo"
      );
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
  public async createSession(
    prompt: string,
    userId?: string,
    sessionId?: string
  ): Promise<VideoSession> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours
      const finalSessionId = sessionId || crypto.randomUUID();

      const sessionData: VideoSession = {
        id: finalSessionId,
        userId,
        prompt,
        chatHistory: [],
        status: "draft",
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      if (AppModeConfig.getMode() === "demo") {
        FirestoreService.mockSessions.set(finalSessionId, sessionData);
        console.log(`[MOCK MODE] Created session: ${finalSessionId}`);
        return sessionData;
      }

      if (!this.sessionsCollection) {
        throw new Error("Firestore not initialized");
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
      console.error("Failed to create session:", error);
      throw new Error(
        `Failed to create session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<VideoSession | null> {
    try {
      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
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
        chatHistory:
          data?.chatHistory?.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date(),
          })) || [],
      } as VideoSession;
    } catch (error) {
      console.error("Failed to get session:", error);
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

      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
      }

      // Filter out undefined values for Firestore
      const firestoreUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await this.sessionsCollection.doc(sessionId).update(firestoreUpdateData);
      return true;
    } catch (error) {
      console.error("Failed to update session:", error);
      return false;
    }
  }

  /**
   * Add message to chat history
   */
  public async addChatMessage(
    sessionId: string,
    message: Omit<ChatMessage, "id">
  ): Promise<boolean> {
    try {
      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        ...message,
      };

      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
      }

      await this.sessionsCollection.doc(sessionId).update({
        chatHistory: FieldValue.arrayUnion(chatMessage),
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Failed to add chat message:", error);
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
        status: "pending",
        estimatedCost,
        createdAt: now,
        updatedAt: now,
        ...(operationId && { veoJobId: operationId }), // Store operation ID if provided
      };

      if (AppModeConfig.getMode() === "demo") {
        FirestoreService.mockJobs.set(finalJobId, jobData);
        console.log(`[MOCK MODE] Created video job: ${finalJobId}`);
        return jobData;
      }

      if (!this.jobsCollection) {
        throw new Error("Firestore not initialized");
      }

      // Use set() with the custom job ID instead of add() to maintain ID consistency
      await this.jobsCollection.doc(finalJobId).set(jobData);

      // Return the job with the original custom ID
      return jobData;
    } catch (error) {
      console.error("Failed to create video job:", error);
      throw new Error(
        `Failed to create video job: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get video job by ID
   */
  public async getVideoJob(jobId: string): Promise<VideoJob | null> {
    try {
      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
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
      console.error("Failed to get video job:", error);
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

      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
      }

      // Filter out undefined values for Firestore
      const firestoreUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await this.jobsCollection.doc(jobId).update(firestoreUpdateData);
      return true;
    } catch (error) {
      console.error("Failed to update video job:", error);
      return false;
    }
  }

  /**
   * Get jobs by status
   */
  public async getJobsByStatus(status: VideoJob["status"], limit = 50): Promise<VideoJob[]> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        const filteredJobs = Array.from(FirestoreService.mockJobs.values())
          .filter((job) => job.status === status)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
        console.log(`[MOCK MODE] Retrieved ${filteredJobs.length} jobs with status: ${status}`);
        return filteredJobs;
      }

      if (!this.jobsCollection) {
        throw new Error("Firestore not initialized");
      }

      const snapshot: QuerySnapshot<DocumentData> = await this.jobsCollection
        .where("status", "==", status)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as VideoJob;
      });
    } catch (error) {
      console.error("Failed to get jobs by status:", error);
      return [];
    }
  }

  // Cost Tracking

  /**
   * Record cost entry
   */
  public async recordCost(entry: Omit<CostEntry, "id">): Promise<CostEntry> {
    try {
      const costId = crypto.randomUUID();
      const costData: CostEntry = {
        id: costId,
        ...entry,
        timestamp: new Date(),
      };

      if (AppModeConfig.getMode() === "demo") {
        FirestoreService.mockCosts.push(costData);
        console.log(`[MOCK MODE] Recorded cost: $${costData.amount} for ${costData.service}`);
        return costData;
      }

      if (!this.costsCollection) {
        throw new Error("Firestore not initialized");
      }

      const docRef = await this.costsCollection.add(costData);

      return {
        ...costData,
        id: docRef.id,
      };
    } catch (error) {
      console.error("Failed to record cost:", error);
      throw new Error(
        `Failed to record cost: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get total costs for time period
   */
  public async getTotalCosts(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        // Filter mock costs by date range if provided
        let filteredCosts = FirestoreService.mockCosts;

        if (startDate) {
          filteredCosts = filteredCosts.filter((cost) => cost.timestamp >= startDate);
        }
        if (endDate) {
          filteredCosts = filteredCosts.filter((cost) => cost.timestamp <= endDate);
        }

        const total = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
        console.log(`[MOCK MODE] Total costs: $${total.toFixed(2)}`);
        return total;
      }

      if (!this.costsCollection) {
        throw new Error("Firestore not initialized");
      }

      let query = this.costsCollection as any;

      if (startDate) {
        query = query.where("timestamp", ">=", startDate);
      }
      if (endDate) {
        query = query.where("timestamp", "<=", endDate);
      }

      const snapshot: QuerySnapshot<DocumentData> = await query.get();

      return snapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        return total + (data.amount || 0);
      }, 0);
    } catch (error) {
      console.error("Failed to get total costs:", error);
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
        query = query.where("timestamp", ">=", startDate);
      }
      if (endDate) {
        query = query.where("timestamp", "<=", endDate);
      }

      const snapshot: QuerySnapshot<DocumentData> = await query.get();

      const breakdown: Record<string, number> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const service = data.service || "other";
        breakdown[service] = (breakdown[service] || 0) + (data.amount || 0);
      });

      return breakdown;
    } catch (error) {
      console.error("Failed to get cost breakdown:", error);
      return {};
    }
  }

  // Cleanup and Maintenance

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<number> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        const now = new Date();
        const expiredSessionIds: string[] = [];

        FirestoreService.mockSessions.forEach((session, sessionId) => {
          if (session.expiresAt <= now) {
            expiredSessionIds.push(sessionId);
          }
        });

        expiredSessionIds.forEach((sessionId) => {
          FirestoreService.mockSessions.delete(sessionId);
        });

        console.log(`[MOCK MODE] Cleaned up ${expiredSessionIds.length} expired sessions`);
        return expiredSessionIds.length;
      }

      if (!this.sessionsCollection || !this.db) {
        throw new Error("Firestore not initialized");
      }

      const now = new Date();
      const snapshot: QuerySnapshot<DocumentData> = await this.sessionsCollection
        .where("expiresAt", "<=", now)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Cleaned up ${snapshot.docs.length} expired sessions`);
      return snapshot.docs.length;
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
      return 0;
    }
  }

  /**
   * Health check for Firestore service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        console.log("[MOCK MODE] Health check passed");
        return true;
      }

      if (!this.sessionsCollection) {
        throw new Error("Firestore not initialized");
      }

      // Try to read from a collection to test connectivity
      const snapshot = await this.sessionsCollection.limit(1).get();
      return true;
    } catch (error) {
      console.error("Firestore health check failed:", error);
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
      if (AppModeConfig.getMode() === "demo") {
        const now = new Date();
        const activeSessions = Array.from(FirestoreService.mockSessions.values()).filter(
          (session) => session.expiresAt > now
        ).length;
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
        throw new Error("Firestore not initialized");
      }

      const now = new Date();

      const [sessionsSnapshot, activeSessionsSnapshot, jobsSnapshot] = await Promise.all([
        this.sessionsCollection.count().get(),
        this.sessionsCollection.where("expiresAt", ">", now).count().get(),
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
      console.error("Failed to get stats:", error);
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
    locale: "en" | "ja" = "en"
  ): Promise<ProductIntelligenceSession> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

      const sessionData: ProductIntelligenceSession = {
        id: sessionId,
        productAnalysis: null,
        conversationHistory: [],
        status: "active",
        locale,
        totalCost: 0,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      if (AppModeConfig.getMode() === "demo") {
        FirestoreService.mockPISessions.set(sessionId, sessionData);
        console.log(`[MOCK MODE] Created PI session: ${sessionId}`);
        return sessionData;
      }

      if (!this.piSessionsCollection) {
        throw new Error("Firestore not initialized");
      }

      // Filter out undefined values for Firestore
      const firestoreData = Object.fromEntries(
        Object.entries(sessionData).filter(([_, value]) => value !== undefined)
      );

      await this.piSessionsCollection.doc(sessionId).set(firestoreData);
      console.log(`[FIRESTORE] Created PI session: ${sessionId}`);

      return sessionData;
    } catch (error) {
      console.error("Failed to create PI session:", error);
      throw new Error(
        `Failed to create PI session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get product intelligence session by ID
   */
  public async getPISession(sessionId: string): Promise<ProductIntelligenceSession | null> {
    try {
      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
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
      console.error("Failed to get PI session:", error);
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

      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
      }

      await this.piSessionsCollection.doc(sessionId).update(updateData);
      console.log(`[FIRESTORE] Stored analysis for PI session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error("Failed to store PI analysis:", error);
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

      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
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
  public async confirmPendingStrategy(
    sessionId: string
  ): Promise<{ success: boolean; updatedStrategy?: any }> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        console.log(`[DEBUG] Session exists:`, !!existingSession);
        console.log(`[DEBUG] Has pendingStrategy:`, !!existingSession?.pendingStrategy);
        console.log(`[DEBUG] Has productAnalysis:`, !!existingSession?.productAnalysis);
        if (existingSession?.pendingStrategy) {
          console.log(
            `[DEBUG] pendingStrategy keys:`,
            Object.keys(existingSession.pendingStrategy)
          );
        }
        if (existingSession && existingSession.pendingStrategy && existingSession.productAnalysis) {
          // Move pending strategy to confirmed keyMessages (commercialStrategy moved to David)
          existingSession.productAnalysis.keyMessages = existingSession.pendingStrategy;
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
        throw new Error("Firestore not initialized");
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
        "productAnalysis.keyMessages": sessionData.pendingStrategy,
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

      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
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
      if (AppModeConfig.getMode() === "demo") {
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
        throw new Error("Firestore not initialized");
      }

      await this.piSessionsCollection.doc(sessionId).update({
        conversationHistory: FieldValue.arrayUnion(message),
        updatedAt: new Date(),
      });
      console.log(`[FIRESTORE] Added chat message to PI session: ${sessionId}`);

      return true;
    } catch (error) {
      console.error("Failed to add PI chat message:", error);
      return false;
    }
  }

  /**
   * Update PI session cost
   */
  public async updatePICost(sessionId: string, additionalCost: number): Promise<boolean> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        const existingSession = FirestoreService.mockPISessions.get(sessionId);
        if (existingSession) {
          existingSession.totalCost += additionalCost;
          existingSession.updatedAt = new Date();
          console.log(
            `[MOCK MODE] Updated cost for PI session: ${sessionId} (+$${additionalCost})`
          );
          return true;
        } else {
          console.warn(`[MOCK MODE] PI session not found for cost update: ${sessionId}`);
          return false;
        }
      }

      if (!this.piSessionsCollection) {
        throw new Error("Firestore not initialized");
      }

      await this.piSessionsCollection.doc(sessionId).update({
        totalCost: FieldValue.increment(additionalCost),
        updatedAt: new Date(),
      });
      console.log(`[FIRESTORE] Updated cost for PI session: ${sessionId} (+$${additionalCost})`);

      return true;
    } catch (error) {
      console.error("Failed to update PI cost:", error);
      return false;
    }
  }

  // Creative Director Session Management

  /**
   * Create new creative director session
   */
  public async createCreativeSession(
    sessionId: string,
    sessionData: any
  ): Promise<any> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

      const finalSessionData = {
        id: sessionId,
        ...sessionData,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      if (AppModeConfig.getMode() === "demo") {
        FirestoreService.mockCreativeSessions.set(sessionId, finalSessionData);
        console.log(`[MOCK MODE] Created Creative Director session: ${sessionId}`);
        return finalSessionData;
      }

      if (!this.creativeSessionsCollection) {
        throw new Error("Firestore not initialized");
      }

      // Filter out undefined values for Firestore
      const firestoreData = Object.fromEntries(
        Object.entries(finalSessionData).filter(([_, value]) => value !== undefined)
      );

      await this.creativeSessionsCollection.doc(sessionId).set(firestoreData);
      console.log(`[FIRESTORE] Created Creative Director session: ${sessionId}`);

      return finalSessionData;
    } catch (error) {
      console.error("Failed to create Creative Director session:", error);
      throw new Error(
        `Failed to create Creative Director session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get creative director session by ID
   */
  public async getCreativeSession(sessionId: string): Promise<any> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        const session = FirestoreService.mockCreativeSessions.get(sessionId);
        if (session) {
          console.log(`[MOCK MODE] Retrieved Creative Director session: ${sessionId}`);
          return session;
        } else {
          console.log(`[MOCK MODE] Creative Director session not found: ${sessionId}`);
          return null;
        }
      }

      if (!this.creativeSessionsCollection) {
        throw new Error("Firestore not initialized");
      }

      const doc = await this.creativeSessionsCollection.doc(sessionId).get();

      if (!doc.exists) {
        console.log(`[FIRESTORE] Creative Director session not found: ${sessionId}`);
        return null;
      }

      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        expiresAt: data?.expiresAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error("Failed to get Creative Director session:", error);
      return null;
    }
  }

  /**
   * Update creative director session
   */
  public async updateCreativeSession(sessionId: string, updates: any): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      if (AppModeConfig.getMode() === "demo") {
        const existingSession = FirestoreService.mockCreativeSessions.get(sessionId);
        if (existingSession) {
          FirestoreService.mockCreativeSessions.set(sessionId, { ...existingSession, ...updateData });
          console.log(`[MOCK MODE] Updated Creative Director session: ${sessionId}`);
          return true;
        } else {
          console.warn(`[MOCK MODE] Creative Director session not found: ${sessionId}`);
          return false;
        }
      }

      if (!this.creativeSessionsCollection) {
        throw new Error("Firestore not initialized");
      }

      // Filter out undefined values for Firestore
      const firestoreUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await this.creativeSessionsCollection.doc(sessionId).update(firestoreUpdateData);
      console.log(`[FIRESTORE] Updated Creative Director session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error("Failed to update Creative Director session:", error);
      return false;
    }
  }

  /**
   * Create handoff record for agent transitions
   */
  public async createHandoffRecord(sessionId: string, handoffData: any): Promise<boolean> {
    try {
      const recordId = crypto.randomUUID();
      const handoffRecord = {
        id: recordId,
        sessionId,
        ...handoffData,
        createdAt: new Date(),
      };

      if (AppModeConfig.getMode() === "demo") {
        // In demo mode, just log the handoff record
        console.log(`[MOCK MODE] Created handoff record for session: ${sessionId}`);
        return true;
      }

      if (!this.db) {
        throw new Error("Firestore not initialized");
      }

      // Store handoff record in a dedicated collection
      const handoffCollection = this.db.collection("handoffRecords");
      await handoffCollection.doc(recordId).set(handoffRecord);
      console.log(`[FIRESTORE] Created handoff record: ${recordId} for session: ${sessionId}`);

      return true;
    } catch (error) {
      console.error("Failed to create handoff record:", error);
      return false;
    }
  }

  /**
   * Get completed video jobs for gallery with pagination and sorting
   */
  public async getCompletedVideos(options: {
    page?: number;
    limit?: number;
    sortBy?: "recent" | "popular" | "views";
  } = {}): Promise<{
    videos: any[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const { page = 1, limit = 12, sortBy = "recent" } = options;
      const offset = (page - 1) * limit;

      if (AppModeConfig.getMode() === "demo") {
        // Mock data for demo mode
        const mockVideos = Array.from(FirestoreService.mockJobs.values())
          .filter(job => job.status === "completed" && job.videoUrl)
          .map(job => ({
            id: job.id,
            title: `Commercial for Product`,
            thumbnailUrl: job.thumbnailUrl || job.videoUrl,
            videoUrl: job.videoUrl,
            duration: 8,
            createdAt: job.updatedAt || job.createdAt,
            viewCount: Math.floor(Math.random() * 1000),
            productName: "Product",
            narrativeStyle: "Cinematic",
            musicGenre: "Orchestral",
          }));

        // Sort based on sortBy parameter
        if (sortBy === "views" || sortBy === "popular") {
          mockVideos.sort((a, b) => b.viewCount - a.viewCount);
        } else {
          mockVideos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        const paginatedVideos = mockVideos.slice(offset, offset + limit);
        return {
          videos: paginatedVideos,
          totalCount: mockVideos.length,
          hasMore: offset + limit < mockVideos.length,
        };
      }

      if (!this.jobsCollection) {
        throw new Error("Firestore not initialized");
      }

      // Build query for completed videos
      let query = this.jobsCollection
        .where("status", "==", "completed")
        .where("videoUrl", "!=", null);

      // Apply sorting
      if (sortBy === "views" || sortBy === "popular") {
        query = query.orderBy("viewCount", "desc");
      } else {
        query = query.orderBy("completedAt", "desc");
      }

      // Get paginated results
      const snapshot = await query.limit(limit).offset(offset).get();

      const videos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || `Commercial for ${data.productName || 'Product'}`,
          thumbnailUrl: data.thumbnailUrl || data.videoUrl,
          videoUrl: data.videoUrl,
          duration: data.duration || 8,
          createdAt: data.completedAt?.toDate() || data.createdAt?.toDate() || new Date(),
          viewCount: data.viewCount || 0,
          productName: data.productName || 'Product',
          narrativeStyle: data.productionMetadata?.narrativeStyle || 'Cinematic',
          musicGenre: data.productionMetadata?.musicGenre || 'Orchestral',
        };
      });

      // Get total count
      const totalSnapshot = await this.jobsCollection
        .where("status", "==", "completed")
        .where("videoUrl", "!=", null)
        .count()
        .get();

      const totalCount = totalSnapshot.data().count;

      return {
        videos,
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    } catch (error) {
      console.error("Failed to get completed videos:", error);
      return {
        videos: [],
        totalCount: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get detailed video information by ID
   */
  public async getVideoDetails(videoId: string): Promise<any | null> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        const mockJob = FirestoreService.mockJobs.get(videoId);
        if (mockJob && mockJob.status === "completed" && mockJob.videoUrl) {
          return {
            id: videoId,
            title: `Commercial for Product`,
            description: "A stunning commercial video created with AdCraft AI",
            videoUrl: mockJob.videoUrl,
            thumbnailUrl: mockJob.thumbnailUrl || mockJob.videoUrl,
            duration: 8,
            createdAt: mockJob.updatedAt?.toISOString() || new Date().toISOString(),
            viewCount: Math.floor(Math.random() * 1000),
            productName: "Product",
            narrativeStyle: "Cinematic",
            musicGenre: "Orchestral",
            videoFormat: "16:9 HD",
            productionSpecs: {
              resolution: "720p",
              aspectRatio: "16:9",
              frameRate: 24,
            },
          };
        }
        return null;
      }

      if (!this.jobsCollection) {
        throw new Error("Firestore not initialized");
      }

      const videoDoc = await this.jobsCollection.doc(videoId).get();

      if (!videoDoc.exists) {
        return null;
      }

      const videoData = videoDoc.data()!;

      if (videoData.status !== "completed" || !videoData.videoUrl) {
        return null;
      }

      // Get session data for additional context
      let sessionData = null;
      if (videoData.sessionId) {
        try {
          const sessionDoc = await this.sessionsCollection!.doc(videoData.sessionId).get();
          if (sessionDoc.exists) {
            sessionData = sessionDoc.data();
          }
        } catch (error) {
          console.warn("Could not fetch session data:", error);
        }
      }

      return {
        id: videoId,
        title: videoData.title || `Commercial for ${videoData.productName || 'Product'}`,
        description: videoData.description,
        videoUrl: videoData.videoUrl,
        thumbnailUrl: videoData.thumbnailUrl || videoData.videoUrl,
        duration: videoData.duration || 8,
        createdAt: videoData.completedAt?.toDate()?.toISOString() ||
                   videoData.createdAt?.toDate()?.toISOString() ||
                   new Date().toISOString(),
        viewCount: videoData.viewCount || 0,
        productName: videoData.productName || 'Product',
        narrativeStyle: videoData.productionMetadata?.narrativeStyle || 'Cinematic',
        musicGenre: videoData.productionMetadata?.musicGenre || 'Orchestral',
        videoFormat: videoData.productionMetadata?.videoFormat || '16:9 HD',
        productionSpecs: {
          resolution: videoData.productionSpecs?.resolution || "720p",
          aspectRatio: videoData.productionSpecs?.aspectRatio || "16:9",
          frameRate: videoData.productionSpecs?.frameRate || 24,
        },
        productAnalysis: sessionData?.mayaAnalysis ? {
          category: sessionData.mayaAnalysis.productAnalysis?.category,
          targetAudience: sessionData.mayaAnalysis.strategicInsights?.targetAudience,
          keyMessages: sessionData.mayaAnalysis.strategicInsights?.keyMessages || [],
          benefits: sessionData.mayaAnalysis.productAnalysis?.benefits || [],
        } : undefined,
        creativeDirection: sessionData?.davidData?.creativeDirection ? {
          name: sessionData.davidData.creativeDirection.name,
          description: sessionData.davidData.creativeDirection.description,
          colorPalette: sessionData.davidData.creativeDirection.colorPalette || [],
          visualKeywords: sessionData.davidData.creativeDirection.visualKeywords || [],
        } : undefined,
      };
    } catch (error) {
      console.error("Failed to get video details:", error);
      return null;
    }
  }

  /**
   * Increment view count for a video
   */
  public async incrementVideoViews(videoId: string): Promise<{ viewCount: number } | null> {
    try {
      if (AppModeConfig.getMode() === "demo") {
        const mockJob = FirestoreService.mockJobs.get(videoId);
        if (mockJob && mockJob.status === "completed") {
          // Simulate view increment in mock data
          const currentViews = (mockJob as any).viewCount || 0;
          const newViewCount = currentViews + 1;
          (mockJob as any).viewCount = newViewCount;
          (mockJob as any).lastViewedAt = new Date();

          console.log(`[MOCK MODE] Incremented views for video ${videoId} to ${newViewCount}`);
          return { viewCount: newViewCount };
        }
        return null;
      }

      if (!this.jobsCollection) {
        throw new Error("Firestore not initialized");
      }

      const videoRef = this.jobsCollection.doc(videoId);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        return null;
      }

      const videoData = videoDoc.data()!;

      if (videoData.status !== "completed") {
        return null;
      }

      const currentViewCount = videoData.viewCount || 0;
      const newViewCount = currentViewCount + 1;

      await videoRef.update({
        viewCount: newViewCount,
        lastViewedAt: new Date(),
      });

      console.log(`[FIRESTORE] Incremented views for video ${videoId} to ${newViewCount}`);
      return { viewCount: newViewCount };
    } catch (error) {
      console.error("Failed to increment video views:", error);
      return null;
    }
  }
}
