/**
 * Creative Director Session Manager
 *
 * Handles David's specialized session management, creative decision persistence,
 * and visual asset tracking with proper Firestore integration.
 */

import { FirestoreService } from "@/lib/services/firestore";
import type { CreativeChatMessage } from "../types/chat-types";
import type { VisualAsset, StylePalette, CreativeDirection } from "../types/asset-types";
import type { CreativeStrategy, VisualDecision } from "../types/api-types";

export interface CreativeDirectorSession {
  id: string;
  
  // Cross-agent session tracking
  agentPipeline: {
    currentAgent: "maya" | "david" | "alex";
    mayaCompleted: boolean;
    davidCompleted: boolean;
    alexCompleted: boolean;
    pipelineProgress: number; // 0-1 completion score
  };
  
  // Maya handoff data with enhanced context preservation
  mayaHandoffData?: {
    productAnalysis: any;
    commercialStrategy: any;
    transferredAt: string;
    strategicContext: any;
    validationResult?: any;
    contextIntegrity: {
      checksumVerified: boolean;
      dataCompleteness: number;
      preservationScore: number;
    };
  };
  
  // David's creative work
  creativeDirection?: CreativeDirection;
  visualStyle?: {
    selectedStyle: string;
    colorPalette: StylePalette;
    composition: string;
    mood: string;
    reasoning: string;
  };
  
  // Generated assets
  generatedAssets: VisualAsset[];
  assetProgress: {
    totalRequested: number;
    completed: number;
    failed: number;
    inProgress: number;
  };
  
  // Creative decisions with enhanced tracking
  creativeDecisions: VisualDecision[];
  approvedDecisions: string[]; // IDs of approved decisions
  decisionHistory: {
    decisionId: string;
    timestamp: string;
    previousValue?: any;
    newValue: any;
    reasoning: string;
    agent: "maya" | "david" | "alex";
  }[];
  
  // Conversation history with cross-agent context
  conversationHistory: CreativeChatMessage[];
  crossAgentContext: {
    mayaInsights: string[];
    davidCreativeDecisions: string[];
    alexProductionNotes: string[];
    sharedContext: Record<string, any>;
  };
  
  // Alex handoff preparation with comprehensive data
  alexHandoffPackage?: {
    creativeDirection: CreativeDirection;
    selectedAssets: string[]; // Asset IDs
    sceneMapping: any[];
    productionNotes: string;
    budgetUtilized: number;
    preparedAt: string;
    validationResult?: any;
    productionReadiness: boolean;
  };
  
  // Session state preservation
  stateSnapshots: {
    timestamp: string;
    agent: "maya" | "david" | "alex";
    stateData: any;
    contextMetadata: Record<string, any>;
  }[];
  
  // Session metadata
  status: "initializing" | "active" | "generating" | "handoff_ready" | "completed" | "expired";
  locale: "en" | "ja";
  totalCost: number;
  budgetAllocated: number;
  budgetUsed: number;
  
  // Enhanced continuity tracking
  continuityMetrics: {
    mayaToDavidPreservation: number; // 0-1 score
    davidToAlexPreservation: number; // 0-1 score
    overallContinuity: number; // 0-1 score
    contextLossPoints: string[];
    recoveryActions: string[];
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  handoffToAlexAt?: Date;
  mayaHandoffAt?: Date;
}

export interface CreativeDecisionRecord {
  id: string;
  sessionId: string;
  decisionType: "style_selection" | "color_palette" | "asset_approval" | "composition" | "mood";
  decisionData: any;
  reasoning: string;
  confidence: number;
  userApproved: boolean;
  createdAt: Date;
}

export interface AssetGenerationRecord {
  id: string;
  sessionId: string;
  assetId: string;
  generationRequest: any;
  generationResponse?: any;
  status: "pending" | "generating" | "completed" | "failed";
  cost: number;
  processingTime?: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Creative Director Session Manager
 * Provides specialized session management for David's creative workflow
 */
export class CreativeDirectorSessionManager {
  private static instance: CreativeDirectorSessionManager;
  private firestore: FirestoreService;

  private constructor() {
    this.firestore = FirestoreService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorSessionManager {
    if (!CreativeDirectorSessionManager.instance) {
      CreativeDirectorSessionManager.instance = new CreativeDirectorSessionManager();
    }
    return CreativeDirectorSessionManager.instance;
  }

  /**
   * Create new Creative Director session with Maya handoff data
   */
  public async createSession(
    sessionId: string,
    mayaHandoffData?: any,
    locale: "en" | "ja" = "en"
  ): Promise<CreativeDirectorSession> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    const sessionData: CreativeDirectorSession = {
      id: sessionId,
      
      // Initialize cross-agent pipeline
      agentPipeline: {
        currentAgent: mayaHandoffData ? "david" : "maya",
        mayaCompleted: !!mayaHandoffData,
        davidCompleted: false,
        alexCompleted: false,
        pipelineProgress: mayaHandoffData ? 0.33 : 0
      },
      
      mayaHandoffData: mayaHandoffData ? {
        productAnalysis: mayaHandoffData.productAnalysis,
        commercialStrategy: mayaHandoffData.commercialStrategy,
        transferredAt: now.toISOString(),
        strategicContext: mayaHandoffData.strategicContext || {},
        contextIntegrity: {
          checksumVerified: true,
          dataCompleteness: 1.0,
          preservationScore: 0.9
        }
      } : undefined,
      
      generatedAssets: [],
      assetProgress: {
        totalRequested: 0,
        completed: 0,
        failed: 0,
        inProgress: 0
      },
      
      creativeDecisions: [],
      approvedDecisions: [],
      decisionHistory: [],
      
      conversationHistory: [],
      crossAgentContext: {
        mayaInsights: [],
        davidCreativeDecisions: [],
        alexProductionNotes: [],
        sharedContext: {}
      },
      
      stateSnapshots: [],
      
      status: "initializing",
      locale,
      totalCost: 0,
      budgetAllocated: mayaHandoffData?.budgetAllocated || 50, // Default $50 for creative work
      budgetUsed: 0,
      
      continuityMetrics: {
        mayaToDavidPreservation: 0,
        davidToAlexPreservation: 0,
        overallContinuity: 0,
        contextLossPoints: [],
        recoveryActions: []
      },
      
      createdAt: now,
      updatedAt: now,
      expiresAt
    };

    try {
      await this.firestore.createCreativeSession(sessionId, sessionData);
      console.log(`[CREATIVE SESSION] Created session: ${sessionId}`);
      return sessionData;
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to create session:", error);
      throw error;
    }
  }

  /**
   * Get Creative Director session
   */
  public async getSession(sessionId: string): Promise<CreativeDirectorSession | null> {
    try {
      const sessionData = await this.firestore.getCreativeSession(sessionId);
      
      if (!sessionData) {
        console.log(`[CREATIVE SESSION] Session not found: ${sessionId}`);
        return null;
      }

      // Convert Firestore timestamps to Date objects
      return {
        ...sessionData,
        createdAt: sessionData.createdAt?.toDate ? sessionData.createdAt.toDate() : new Date(sessionData.createdAt),
        updatedAt: sessionData.updatedAt?.toDate ? sessionData.updatedAt.toDate() : new Date(sessionData.updatedAt),
        expiresAt: sessionData.expiresAt?.toDate ? sessionData.expiresAt.toDate() : new Date(sessionData.expiresAt),
        handoffToAlexAt: sessionData.handoffToAlexAt?.toDate ? sessionData.handoffToAlexAt.toDate() : undefined
      };
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to get session:", error);
      return null;
    }
  }

  /**
   * Update session with creative progress
   */
  public async updateSession(
    sessionId: string, 
    updates: Partial<CreativeDirectorSession>
  ): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      const success = await this.firestore.updateCreativeSession(sessionId, updateData);
      
      if (success) {
        console.log(`[CREATIVE SESSION] Updated session: ${sessionId}`);
      }
      
      return success;
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to update session:", error);
      return false;
    }
  }

  /**
   * Add creative decision to session
   */
  public async addCreativeDecision(
    sessionId: string,
    decision: Omit<CreativeDecisionRecord, "id" | "sessionId" | "createdAt">
  ): Promise<boolean> {
    try {
      const decisionRecord: CreativeDecisionRecord = {
        id: crypto.randomUUID(),
        sessionId,
        ...decision,
        createdAt: new Date()
      };

      // Get current session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Add decision to session
      session.creativeDecisions.push(decisionRecord as any);
      
      // Update session
      return await this.updateSession(sessionId, {
        creativeDecisions: session.creativeDecisions
      });
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to add creative decision:", error);
      return false;
    }
  }

  /**
   * Approve creative decision
   */
  public async approveCreativeDecision(
    sessionId: string,
    decisionId: string
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Add to approved decisions if not already there
      if (!session.approvedDecisions.includes(decisionId)) {
        session.approvedDecisions.push(decisionId);
      }

      // Update the specific decision
      const decision = session.creativeDecisions.find(d => d.id === decisionId);
      if (decision) {
        (decision as any).userApproved = true;
      }

      return await this.updateSession(sessionId, {
        approvedDecisions: session.approvedDecisions,
        creativeDecisions: session.creativeDecisions
      });
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to approve decision:", error);
      return false;
    }
  }

  /**
   * Add generated asset to session
   */
  public async addGeneratedAsset(
    sessionId: string,
    asset: VisualAsset
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Add asset to session
      session.generatedAssets.push(asset);
      
      // Update asset progress
      session.assetProgress.completed++;
      session.assetProgress.inProgress = Math.max(0, session.assetProgress.inProgress - 1);
      
      // Update total cost
      session.totalCost += asset.cost.totalCost;
      session.budgetUsed += asset.cost.totalCost;

      return await this.updateSession(sessionId, {
        generatedAssets: session.generatedAssets,
        assetProgress: session.assetProgress,
        totalCost: session.totalCost,
        budgetUsed: session.budgetUsed
      });
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to add generated asset:", error);
      return false;
    }
  }

  /**
   * Add chat message to session history
   */
  public async addChatMessage(
    sessionId: string,
    message: CreativeChatMessage
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      session.conversationHistory.push(message);

      return await this.updateSession(sessionId, {
        conversationHistory: session.conversationHistory
      });
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to add chat message:", error);
      return false;
    }
  }

  /**
   * Update asset generation progress
   */
  public async updateAssetProgress(
    sessionId: string,
    progressUpdate: {
      totalRequested?: number;
      completed?: number;
      failed?: number;
      inProgress?: number;
    }
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Update progress counters
      Object.assign(session.assetProgress, progressUpdate);

      return await this.updateSession(sessionId, {
        assetProgress: session.assetProgress
      });
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to update asset progress:", error);
      return false;
    }
  }

  /**
   * Prepare handoff package for Alex
   */
  public async prepareAlexHandoff(
    sessionId: string,
    selectedAssetIds: string[],
    productionNotes: string
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Create handoff package
      const handoffPackage = {
        creativeDirection: session.creativeDirection!,
        selectedAssets: selectedAssetIds,
        sceneMapping: this.generateSceneMapping(session.generatedAssets, selectedAssetIds),
        productionNotes,
        budgetUtilized: session.budgetUsed,
        preparedAt: new Date().toISOString(),
        productionReadiness: true,
      };

      const success = await this.updateSession(sessionId, {
        alexHandoffPackage: handoffPackage,
        status: "handoff_ready",
        handoffToAlexAt: new Date()
      });

      if (success) {
        console.log(`[CREATIVE SESSION] Prepared Alex handoff for session: ${sessionId}`);
      }

      return success;
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to prepare Alex handoff:", error);
      return false;
    }
  }

  /**
   * Get session statistics for analytics
   */
  public async getSessionStats(sessionId: string): Promise<{
    totalAssets: number;
    approvedDecisions: number;
    budgetUtilization: number;
    conversationLength: number;
    processingTime: number;
    qualityScores: {
      averageQuality: number;
      brandAlignment: number;
      creativeAlignment: number;
    };
  }> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const processingTime = session.updatedAt.getTime() - session.createdAt.getTime();
      
      // Calculate quality scores from generated assets
      const qualityScores = this.calculateQualityScores(session.generatedAssets);

      return {
        totalAssets: session.generatedAssets.length,
        approvedDecisions: session.approvedDecisions.length,
        budgetUtilization: session.budgetUsed / session.budgetAllocated,
        conversationLength: session.conversationHistory.length,
        processingTime,
        qualityScores
      };
    } catch (error) {
      console.error("[CREATIVE SESSION] Failed to get session stats:", error);
      return {
        totalAssets: 0,
        approvedDecisions: 0,
        budgetUtilization: 0,
        conversationLength: 0,
        processingTime: 0,
        qualityScores: {
          averageQuality: 0,
          brandAlignment: 0,
          creativeAlignment: 0
        }
      };
    }
  }

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<{
    cleanedSessions: number;
    errors: string[];
  }> {
    try {
      // This would typically iterate through sessions and clean up expired ones
      // For now, let the base Firestore service handle general cleanup
      const cleanedCount = await this.firestore.cleanupExpiredSessions();
      
      return {
        cleanedSessions: cleanedCount,
        errors: []
      };
    } catch (error) {
      console.error("[CREATIVE SESSION] Cleanup failed:", error);
      return {
        cleanedSessions: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"]
      };
    }
  }

  /**
   * Generate scene mapping for Alex handoff
   */
  private generateSceneMapping(assets: VisualAsset[], selectedAssetIds: string[]): any[] {
    return selectedAssetIds.map(assetId => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return null;

      return {
        assetId,
        assetType: asset.type,
        sceneRole: this.determineSceneRole(asset.type),
        timing: this.suggestTiming(asset.type),
        transitions: this.suggestTransitions(asset.type),
        creativeNotes: asset.creativeContext.purpose
      };
    }).filter(Boolean);
  }

  /**
   * Determine scene role for asset
   */
  private determineSceneRole(assetType: string): string {
    const roleMapping: Record<string, string> = {
      'product-hero': 'main_focus',
      'lifestyle-scene': 'context_setting',
      'background': 'scene_base',
      'mood-board': 'style_reference',
      'style-frame': 'visual_guide'
    };
    
    return roleMapping[assetType] || 'supporting';
  }

  /**
   * Suggest timing for asset usage in video
   */
  private suggestTiming(assetType: string): { start: number; duration: number } {
    const timingMapping: Record<string, { start: number; duration: number }> = {
      'product-hero': { start: 5, duration: 8 },
      'lifestyle-scene': { start: 0, duration: 5 },
      'background': { start: 0, duration: 15 },
      'mood-board': { start: 13, duration: 2 },
      'style-frame': { start: 0, duration: 15 }
    };
    
    return timingMapping[assetType] || { start: 0, duration: 3 };
  }

  /**
   * Suggest transitions for asset
   */
  private suggestTransitions(assetType: string): string[] {
    const transitionMapping: Record<string, string[]> = {
      'product-hero': ['fade_in', 'zoom_in', 'slide_from_right'],
      'lifestyle-scene': ['cross_fade', 'dissolve'],
      'background': ['static', 'slow_pan'],
      'mood-board': ['quick_cut', 'overlay'],
      'style-frame': ['overlay', 'mask_transition']
    };
    
    return transitionMapping[assetType] || ['fade_in'];
  }

  /**
   * Calculate quality scores from generated assets
   */
  private calculateQualityScores(assets: VisualAsset[]): {
    averageQuality: number;
    brandAlignment: number;
    creativeAlignment: number;
  } {
    if (assets.length === 0) {
      return { averageQuality: 0, brandAlignment: 0, creativeAlignment: 0 };
    }

    const totalQuality = assets.reduce((sum, asset) => sum + asset.quality.overallScore, 0);
    const totalBrandAlignment = assets.reduce((sum, asset) => sum + asset.quality.brandConsistency, 0);
    const totalCreativeAlignment = assets.reduce((sum, asset) => sum + asset.quality.creativeAlignment, 0);

    return {
      averageQuality: totalQuality / assets.length,
      brandAlignment: totalBrandAlignment / assets.length,
      creativeAlignment: totalCreativeAlignment / assets.length
    };
  }

  // ===== CROSS-AGENT SESSION MANAGEMENT METHODS =====

  /**
   * Initialize cross-agent session pipeline tracking
   */
  public async initializeCrossAgentPipeline(
    sessionId: string,
    startingAgent: "maya" | "david" | "alex" = "maya"
  ): Promise<void> {
    console.log(`[CROSS-AGENT] Initializing pipeline for session: ${sessionId}`);

    const agentPipeline = {
      currentAgent: startingAgent,
      mayaCompleted: startingAgent !== "maya",
      davidCompleted: false,
      alexCompleted: false,
      pipelineProgress: startingAgent === "maya" ? 0 : startingAgent === "david" ? 0.33 : 0.66
    };

    const crossAgentContext = {
      mayaInsights: [],
      davidCreativeDecisions: [],
      alexProductionNotes: [],
      sharedContext: {}
    };

    const continuityMetrics = {
      mayaToDavidPreservation: 0,
      davidToAlexPreservation: 0,
      overallContinuity: 0,
      contextLossPoints: [],
      recoveryActions: []
    };

    await this.updateSession(sessionId, {
      agentPipeline,
      crossAgentContext,
      continuityMetrics,
      decisionHistory: [],
      stateSnapshots: []
    });
  }

  /**
   * Create state snapshot for context preservation
   */
  public async createStateSnapshot(
    sessionId: string,
    agent: "maya" | "david" | "alex",
    stateData: any,
    contextMetadata: Record<string, any> = {}
  ): Promise<void> {
    console.log(`[CROSS-AGENT] Creating state snapshot for ${agent} in session: ${sessionId}`);

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const snapshot = {
      timestamp: new Date().toISOString(),
      agent,
      stateData,
      contextMetadata: {
        ...contextMetadata,
        snapshotType: "agent_transition",
        dataSize: JSON.stringify(stateData).length,
        preservationScore: this.calculatePreservationScore(stateData)
      }
    };

    const updatedSnapshots = [...(session.stateSnapshots || []), snapshot];

    // Keep only last 10 snapshots per agent
    const filteredSnapshots = this.limitSnapshotsPerAgent(updatedSnapshots);

    await this.updateSession(sessionId, {
      stateSnapshots: filteredSnapshots
    });
  }

  /**
   * Transition pipeline to next agent
   */
  public async transitionToNextAgent(
    sessionId: string,
    fromAgent: "maya" | "david" | "alex",
    toAgent: "maya" | "david" | "alex",
    handoffData: any,
    preservationMetrics: {
      contextPreserved: number;
      dataIntegrity: number;
      continuityScore: number;
    }
  ): Promise<void> {
    console.log(`[CROSS-AGENT] Transitioning ${fromAgent} → ${toAgent} for session: ${sessionId}`);

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update pipeline status
    const agentPipeline = {
      ...session.agentPipeline,
      currentAgent: toAgent,
      [`${fromAgent}Completed`]: true,
      pipelineProgress: this.calculatePipelineProgress(fromAgent, toAgent)
    };

    // Update continuity metrics
    const continuityMetrics = {
      ...session.continuityMetrics,
      [`${fromAgent}To${this.capitalize(toAgent)}Preservation`]: preservationMetrics.contextPreserved,
      overallContinuity: this.calculateOverallContinuity(session.continuityMetrics, preservationMetrics)
    };

    // Add handoff timestamp
    const timestamp = new Date();
    const handoffTimestamp = fromAgent === "maya" && toAgent === "david" 
      ? { mayaHandoffAt: timestamp }
      : fromAgent === "david" && toAgent === "alex"
      ? { handoffToAlexAt: timestamp }
      : {};

    await this.updateSession(sessionId, {
      agentPipeline,
      continuityMetrics,
      [`${fromAgent}HandoffData`]: handoffData,
      ...handoffTimestamp
    });
  }

  /**
   * Update cross-agent context with new insights
   */
  public async updateCrossAgentContext(
    sessionId: string,
    agent: "maya" | "david" | "alex",
    contextUpdates: {
      insights?: string[];
      decisions?: string[];
      notes?: string[];
      sharedData?: Record<string, any>;
    }
  ): Promise<void> {
    console.log(`[CROSS-AGENT] Updating context for ${agent} in session: ${sessionId}`);

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const crossAgentContext = {
      ...session.crossAgentContext,
      mayaInsights: agent === "maya" && contextUpdates.insights 
        ? [...session.crossAgentContext.mayaInsights, ...contextUpdates.insights]
        : session.crossAgentContext.mayaInsights,
      
      davidCreativeDecisions: agent === "david" && contextUpdates.decisions
        ? [...session.crossAgentContext.davidCreativeDecisions, ...contextUpdates.decisions]
        : session.crossAgentContext.davidCreativeDecisions,
      
      alexProductionNotes: agent === "alex" && contextUpdates.notes
        ? [...session.crossAgentContext.alexProductionNotes, ...contextUpdates.notes]
        : session.crossAgentContext.alexProductionNotes,
      
      sharedContext: contextUpdates.sharedData
        ? { ...session.crossAgentContext.sharedContext, ...contextUpdates.sharedData }
        : session.crossAgentContext.sharedContext
    };

    await this.updateSession(sessionId, {
      crossAgentContext
    });
  }

  /**
   * Record decision in cross-agent history
   */
  public async recordCrossAgentDecision(
    sessionId: string,
    decisionId: string,
    agent: "maya" | "david" | "alex",
    previousValue: any,
    newValue: any,
    reasoning: string
  ): Promise<void> {
    console.log(`[CROSS-AGENT] Recording decision for ${agent} in session: ${sessionId}`);

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const decisionRecord = {
      decisionId,
      timestamp: new Date().toISOString(),
      previousValue,
      newValue,
      reasoning,
      agent
    };

    const decisionHistory = [...(session.decisionHistory || []), decisionRecord];

    await this.updateSession(sessionId, {
      decisionHistory
    });
  }

  /**
   * Validate session continuity across agents
   */
  public async validateSessionContinuity(
    sessionId: string
  ): Promise<{
    isValid: boolean;
    continuityScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    console.log(`[CROSS-AGENT] Validating session continuity for: ${sessionId}`);

    const session = await this.getSession(sessionId);
    if (!session) {
      return {
        isValid: false,
        continuityScore: 0,
        issues: ["Session not found"],
        recommendations: ["Verify session exists"]
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check pipeline completeness
    const pipeline = session.agentPipeline;
    if (pipeline && pipeline.pipelineProgress < 0.3 && pipeline.currentAgent === "alex") {
      issues.push("Pipeline advanced too quickly without completing previous stages");
      recommendations.push("Ensure Maya and David stages are properly completed");
    }

    // Check context preservation
    const continuity = session.continuityMetrics;
    if (continuity && continuity.overallContinuity < 0.7) {
      issues.push("Low context preservation between agents");
      recommendations.push("Improve handoff data completeness and validation");
    }

    // Check for missing critical data
    if (!session.mayaHandoffData && pipeline?.mayaCompleted) {
      issues.push("Maya completion marked but no handoff data found");
      recommendations.push("Verify Maya handoff was properly processed");
    }

    if (!session.alexHandoffPackage && pipeline?.currentAgent === "alex") {
      issues.push("Alex handoff initiated but no handoff package found");
      recommendations.push("Complete David → Alex handoff preparation");
    }

    // Check state snapshots continuity
    const snapshots = session.stateSnapshots || [];
    const agentTransitions = this.countAgentTransitions(snapshots);
    const expectedTransitions = pipeline?.pipelineProgress * 3; // Rough estimate

    if (agentTransitions < expectedTransitions * 0.5) {
      issues.push("Insufficient state snapshots for proper continuity tracking");
      recommendations.push("Increase state snapshot frequency during agent transitions");
    }

    const continuityScore = this.calculateSessionContinuityScore(session);

    return {
      isValid: issues.length === 0,
      continuityScore,
      issues,
      recommendations: recommendations.length > 0 ? recommendations : ["Session continuity is good"]
    };
  }

  /**
   * Recover session context from snapshots
   */
  public async recoverSessionContext(
    sessionId: string,
    targetAgent: "maya" | "david" | "alex",
    targetTimestamp?: string
  ): Promise<{
    success: boolean;
    recoveredData: any;
    recoveryMetadata: {
      sourceSnapshot: any;
      dataCompleteness: number;
      confidenceScore: number;
    };
  }> {
    console.log(`[CROSS-AGENT] Recovering context for ${targetAgent} in session: ${sessionId}`);

    const session = await this.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        recoveredData: null,
        recoveryMetadata: {
          sourceSnapshot: null,
          dataCompleteness: 0,
          confidenceScore: 0
        }
      };
    }

    const snapshots = session.stateSnapshots || [];
    
    // Find appropriate snapshot
    let targetSnapshot = null;
    
    if (targetTimestamp) {
      // Find closest snapshot to target timestamp
      targetSnapshot = snapshots
        .filter(s => s.agent === targetAgent && s.timestamp <= targetTimestamp)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    } else {
      // Find most recent snapshot for agent
      targetSnapshot = snapshots
        .filter(s => s.agent === targetAgent)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }

    if (!targetSnapshot) {
      return {
        success: false,
        recoveredData: null,
        recoveryMetadata: {
          sourceSnapshot: null,
          dataCompleteness: 0,
          confidenceScore: 0
        }
      };
    }

    // Calculate recovery confidence
    const dataCompleteness = this.assessDataCompleteness(targetSnapshot.stateData);
    const confidenceScore = this.calculateRecoveryConfidence(targetSnapshot, session);

    return {
      success: true,
      recoveredData: targetSnapshot.stateData,
      recoveryMetadata: {
        sourceSnapshot: {
          timestamp: targetSnapshot.timestamp,
          agent: targetSnapshot.agent,
          metadataSize: JSON.stringify(targetSnapshot.contextMetadata).length
        },
        dataCompleteness,
        confidenceScore
      }
    };
  }

  /**
   * Get complete cross-agent session analytics
   */
  public async getCrossAgentAnalytics(
    sessionId: string
  ): Promise<{
    pipelineStatus: any;
    continuityMetrics: any;
    agentContributions: Record<string, any>;
    handoffQuality: Record<string, number>;
    recommendations: string[];
  }> {
    console.log(`[CROSS-AGENT] Getting analytics for session: ${sessionId}`);

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const agentContributions = {
      maya: {
        insights: session.crossAgentContext?.mayaInsights?.length || 0,
        dataProvided: !!session.mayaHandoffData,
        completionStatus: session.agentPipeline?.mayaCompleted || false
      },
      david: {
        decisions: session.crossAgentContext?.davidCreativeDecisions?.length || 0,
        assetsGenerated: session.generatedAssets?.length || 0,
        creativeDirectionFinalized: !!session.creativeDirection,
        completionStatus: session.agentPipeline?.davidCompleted || false
      },
      alex: {
        productionNotes: session.crossAgentContext?.alexProductionNotes?.length || 0,
        handoffPackageReady: !!session.alexHandoffPackage?.productionReadiness,
        completionStatus: session.agentPipeline?.alexCompleted || false
      }
    };

    const handoffQuality = {
      mayaToDavid: session.continuityMetrics?.mayaToDavidPreservation || 0,
      davidToAlex: session.continuityMetrics?.davidToAlexPreservation || 0
    };

    const recommendations = this.generateCrossAgentRecommendations(session);

    return {
      pipelineStatus: session.agentPipeline,
      continuityMetrics: session.continuityMetrics,
      agentContributions,
      handoffQuality,
      recommendations
    };
  }

  // ===== HELPER METHODS =====

  /**
   * Calculate preservation score for state data
   */
  private calculatePreservationScore(stateData: any): number {
    // Simple heuristic based on data completeness
    const dataSize = JSON.stringify(stateData).length;
    const hasRequiredFields = stateData && typeof stateData === "object" && Object.keys(stateData).length > 0;
    
    if (!hasRequiredFields) return 0;
    
    // Score based on data richness (more data = better preservation)
    const sizeScore = Math.min(dataSize / 10000, 1); // Normalize to 0-1
    return sizeScore * 0.7 + 0.3; // Base score of 0.3 + size-based score
  }

  /**
   * Limit snapshots to prevent storage overflow
   */
  private limitSnapshotsPerAgent(snapshots: any[]): any[] {
    const maxSnapshotsPerAgent = 10;
    const agentCounts: Record<string, number> = {};
    
    return snapshots
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .filter(snapshot => {
        const count = agentCounts[snapshot.agent] || 0;
        if (count < maxSnapshotsPerAgent) {
          agentCounts[snapshot.agent] = count + 1;
          return true;
        }
        return false;
      });
  }

  /**
   * Calculate pipeline progress percentage
   */
  private calculatePipelineProgress(fromAgent: string, toAgent: string): number {
    const progressMap = {
      maya: 0,
      david: 0.33,
      alex: 0.66,
      completed: 1.0
    };
    
    return progressMap[toAgent as keyof typeof progressMap] || 0;
  }

  /**
   * Calculate overall continuity score
   */
  private calculateOverallContinuity(
    continuityMetrics: any,
    newPreservationMetrics: any
  ): number {
    const mayaToDavid = continuityMetrics.mayaToDavidPreservation || 0;
    const davidToAlex = continuityMetrics.davidToAlexPreservation || newPreservationMetrics.contextPreserved || 0;
    
    return (mayaToDavid + davidToAlex) / 2;
  }

  /**
   * Count agent transitions in snapshots
   */
  private countAgentTransitions(snapshots: any[]): number {
    if (snapshots.length < 2) return 0;
    
    let transitions = 0;
    let lastAgent = snapshots[0].agent;
    
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i].agent !== lastAgent) {
        transitions++;
        lastAgent = snapshots[i].agent;
      }
    }
    
    return transitions;
  }

  /**
   * Calculate session continuity score
   */
  private calculateSessionContinuityScore(session: CreativeDirectorSession): number {
    const continuity = session.continuityMetrics;
    if (!continuity) return 0;
    
    const weights = {
      overallContinuity: 0.4,
      dataCompleteness: 0.3,
      pipelineProgress: 0.2,
      errorRecovery: 0.1
    };
    
    const scores = {
      overallContinuity: continuity.overallContinuity || 0,
      dataCompleteness: session.mayaHandoffData ? 1 : 0,
      pipelineProgress: session.agentPipeline?.pipelineProgress || 0,
      errorRecovery: continuity.recoveryActions?.length > 0 ? 0.8 : 1
    };
    
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);
  }

  /**
   * Assess data completeness
   */
  private assessDataCompleteness(stateData: any): number {
    if (!stateData || typeof stateData !== "object") return 0;
    
    const keys = Object.keys(stateData);
    const values = Object.values(stateData);
    
    const nonEmptyValues = values.filter(v => v != null && v !== "").length;
    
    return keys.length > 0 ? nonEmptyValues / keys.length : 0;
  }

  /**
   * Calculate recovery confidence
   */
  private calculateRecoveryConfidence(snapshot: any, session: CreativeDirectorSession): number {
    const ageInHours = (Date.now() - new Date(snapshot.timestamp).getTime()) / (1000 * 60 * 60);
    const ageScore = Math.max(0, 1 - (ageInHours / 24)); // Reduce confidence over 24 hours
    
    const dataCompleteness = this.assessDataCompleteness(snapshot.stateData);
    const preservationScore = snapshot.contextMetadata?.preservationScore || 0;
    
    return (ageScore * 0.3) + (dataCompleteness * 0.4) + (preservationScore * 0.3);
  }

  /**
   * Generate cross-agent recommendations
   */
  private generateCrossAgentRecommendations(session: CreativeDirectorSession): string[] {
    const recommendations: string[] = [];
    
    const pipeline = session.agentPipeline;
    const continuity = session.continuityMetrics;
    
    if (pipeline?.pipelineProgress < 0.5 && pipeline.currentAgent === "alex") {
      recommendations.push("Consider slowing pipeline progression to ensure quality");
    }
    
    if (continuity?.overallContinuity < 0.7) {
      recommendations.push("Improve handoff data completeness for better context preservation");
    }
    
    if ((session.stateSnapshots?.length || 0) < 3) {
      recommendations.push("Increase state snapshot frequency for better recovery capabilities");
    }
    
    if (!session.crossAgentContext?.mayaInsights?.length && pipeline?.mayaCompleted) {
      recommendations.push("Ensure Maya insights are properly captured and transferred");
    }
    
    return recommendations.length > 0 ? recommendations : ["Cross-agent session management is optimal"];
  }

  /**
   * Capitalize first letter of string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}