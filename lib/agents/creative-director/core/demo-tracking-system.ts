/**
 * Demo Mode Creative Decision Tracking and Cost Simulation System
 * 
 * Comprehensive system that tracks creative decisions, maintains conversation
 * continuity, and provides realistic cost simulation for David's creative
 * direction services. Integrates all demo mode components into a cohesive
 * professional experience.
 * 
 * Features:
 * - Creative decision history and evolution tracking
 * - Visual choice impact analysis and dependencies
 * - Cost simulation based on realistic creative industry pricing
 * - Budget tracking with alert thresholds and recommendations
 * - Decision continuity across conversation sessions
 * - Professional cost transparency and justification
 * - ROI analysis for creative decisions
 * - Alternative cost scenarios and optimization suggestions
 */

import { AssetType } from "../types/asset-types";

// Creative decision tracking interfaces
export interface CreativeDecision {
  id: string;
  sessionId: string;
  timestamp: number;
  
  // Decision details
  category: CreativeDecisionCategory;
  decision: string;
  reasoning: string;
  alternativesConsidered: string[];
  
  // Impact analysis
  impact: {
    brandAlignment: number;
    budgetImpact: number;
    timelineImpact: number;
    qualityImpact: number;
    strategicValue: number;
  };
  
  // Dependencies and relationships
  dependencies: string[]; // Other decision IDs this depends on
  influences: string[]; // Decision IDs this influences
  reversible: boolean;
  
  // Implementation details
  implementation: {
    cost: number;
    timeRequired: string;
    resources: string[];
    complexity: "low" | "medium" | "high";
    riskLevel: "low" | "medium" | "high";
  };
  
  // Status tracking
  status: "proposed" | "approved" | "implemented" | "revised" | "rejected";
  approvedBy?: string;
  implementedAt?: number;
  revisionHistory: DecisionRevision[];
  
  // Metadata
  locale: "en" | "ja";
  createdBy: "david" | "user" | "system";
}

export type CreativeDecisionCategory = 
  | "color-palette"
  | "typography" 
  | "composition"
  | "imagery-style"
  | "brand-direction"
  | "asset-generation"
  | "style-framework"
  | "budget-allocation"
  | "timeline-adjustment"
  | "scope-change";

export interface DecisionRevision {
  timestamp: number;
  previousValue: string;
  newValue: string;
  reason: string;
  costImpact: number;
}

// Cost simulation and tracking
export interface CostSimulation {
  sessionId: string;
  
  // Budget allocation
  budget: {
    total: number;
    allocated: number;
    spent: number;
    remaining: number;
    reserved: number; // For approved but not yet spent decisions
  };
  
  // Cost breakdown by category
  breakdown: {
    consultation: CostCategory;
    conceptDevelopment: CostCategory;
    assetGeneration: CostCategory;
    revisions: CostCategory;
    projectManagement: CostCategory;
  };
  
  // Cost tracking
  transactions: CostTransaction[];
  
  // Projections and analysis
  projections: {
    estimatedTotal: number;
    confidenceLevel: number;
    riskFactors: string[];
    optimizationOpportunities: string[];
  };
  
  // Alerts and thresholds
  alerts: CostAlert[];
  thresholds: {
    warning: number; // Percentage of budget
    critical: number; // Percentage of budget
    projectHold: number; // Percentage of budget
  };
  
  // ROI analysis
  roi: {
    estimatedValue: number;
    projectedReturn: number;
    timeToValue: string;
    riskAdjustedReturn: number;
  };
}

export interface CostCategory {
  budgeted: number;
  spent: number;
  remaining: number;
  projected: number;
  items: CostItem[];
}

export interface CostItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  status: "planned" | "in-progress" | "completed";
  decisionId?: string;
  timestamp: number;
}

export interface CostTransaction {
  id: string;
  timestamp: number;
  category: keyof CostSimulation['breakdown'];
  description: string;
  amount: number;
  decisionId?: string;
  justification: string;
}

export interface CostAlert {
  id: string;
  timestamp: number;
  type: "warning" | "critical" | "opportunity" | "milestone";
  message: string;
  action?: string;
  resolved: boolean;
}

// Session continuity tracking
export interface SessionContinuity {
  sessionId: string;
  
  // Creative journey tracking
  journey: {
    currentPhase: CreativePhase;
    completedPhases: CreativePhase[];
    nextPhase?: CreativePhase;
    milestones: Milestone[];
  };
  
  // Decision dependencies and flow
  decisionGraph: {
    nodes: CreativeDecision[];
    edges: Array<{
      from: string;
      to: string;
      relationship: "depends_on" | "influences" | "conflicts_with";
      strength: number;
    }>;
  };
  
  // Conversation context
  conversationContext: {
    keyTopics: string[];
    userPreferences: Record<string, any>;
    unexploredAreas: string[];
    priorityItems: string[];
  };
  
  // Quality and consistency tracking
  consistency: {
    brandAlignment: number;
    styleConsistency: number;
    strategicCoherence: number;
    implementationFeasibility: number;
  };
}

export type CreativePhase = 
  | "strategy-analysis"
  | "concept-development"
  | "style-definition"
  | "asset-planning"
  | "asset-generation"
  | "refinement"
  | "finalization"
  | "handoff-preparation";

export interface Milestone {
  id: string;
  name: string;
  phase: CreativePhase;
  timestamp: number;
  description: string;
  value: number; // Business value delivered
  dependencies: string[];
  status: "upcoming" | "active" | "completed" | "blocked";
}

// Demo tracking system implementation
class DemoCreativeTracker {
  private decisions = new Map<string, CreativeDecision[]>();
  private costSimulations = new Map<string, CostSimulation>();
  private sessionContinuity = new Map<string, SessionContinuity>();

  /**
   * Initialize tracking for a new session
   */
  initializeSession(
    sessionId: string,
    initialBudget: number = 5000,
    locale: "en" | "ja" = "en"
  ): void {
    // Initialize decision tracking
    this.decisions.set(sessionId, []);
    
    // Initialize cost simulation
    this.costSimulations.set(sessionId, this.createInitialCostSimulation(initialBudget));
    
    // Initialize session continuity
    this.sessionContinuity.set(sessionId, this.createInitialContinuity(sessionId));
  }

  /**
   * Track a new creative decision
   */
  trackDecision(
    sessionId: string,
    decision: Omit<CreativeDecision, 'id' | 'timestamp' | 'sessionId' | 'revisionHistory'>
  ): CreativeDecision {
    const fullDecision: CreativeDecision = {
      ...decision,
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      timestamp: Date.now(),
      revisionHistory: []
    };
    
    // Add to session decisions
    const sessionDecisions = this.decisions.get(sessionId) || [];
    sessionDecisions.push(fullDecision);
    this.decisions.set(sessionId, sessionDecisions);
    
    // Update cost simulation
    this.updateCostSimulation(sessionId, fullDecision);
    
    // Update session continuity
    this.updateSessionContinuity(sessionId, fullDecision);
    
    return fullDecision;
  }

  /**
   * Get all decisions for a session with analysis
   */
  getSessionDecisions(sessionId: string): {
    decisions: CreativeDecision[];
    summary: {
      totalDecisions: number;
      approvedDecisions: number;
      totalCostImpact: number;
      avgQualityImpact: number;
      criticalDependencies: number;
    };
    recommendations: string[];
  } {
    const decisions = this.decisions.get(sessionId) || [];
    
    const summary = {
      totalDecisions: decisions.length,
      approvedDecisions: decisions.filter(d => d.status === 'approved').length,
      totalCostImpact: decisions.reduce((sum, d) => sum + d.implementation.cost, 0),
      avgQualityImpact: decisions.reduce((sum, d) => sum + d.impact.qualityImpact, 0) / Math.max(decisions.length, 1),
      criticalDependencies: decisions.filter(d => d.dependencies.length > 2).length
    };
    
    const recommendations = this.generateDecisionRecommendations(decisions);
    
    return { decisions, summary, recommendations };
  }

  /**
   * Get cost simulation with current status
   */
  getCostSimulation(sessionId: string): CostSimulation & {
    analysis: {
      budgetUtilization: number;
      projectedOverrun: number;
      efficiency: number;
      riskLevel: "low" | "medium" | "high";
    };
    optimizations: Array<{
      description: string;
      potentialSaving: number;
      impact: string;
    }>;
  } {
    const simulation = this.costSimulations.get(sessionId);
    if (!simulation) {
      throw new Error(`No cost simulation found for session ${sessionId}`);
    }
    
    const analysis = {
      budgetUtilization: simulation.budget.allocated / simulation.budget.total,
      projectedOverrun: Math.max(0, simulation.projections.estimatedTotal - simulation.budget.total),
      efficiency: simulation.roi.projectedReturn / simulation.projections.estimatedTotal,
      riskLevel: this.calculateRiskLevel(simulation)
    };
    
    const optimizations = this.generateOptimizations(simulation);
    
    return { ...simulation, analysis, optimizations };
  }

  /**
   * Generate professional cost justification
   */
  generateCostJustification(
    sessionId: string,
    locale: "en" | "ja" = "en"
  ): {
    overview: string;
    breakdown: Array<{
      category: string;
      cost: number;
      justification: string;
      valueDelivered: string;
    }>;
    totalValue: string;
    recommendations: string[];
  } {
    const simulation = this.costSimulations.get(sessionId);
    if (!simulation) {
      throw new Error(`No cost simulation found for session ${sessionId}`);
    }
    
    const justifications = {
      en: {
        overview: `Professional creative direction investment of $${simulation.projections.estimatedTotal.toLocaleString()} delivers strategic visual assets with estimated ${Math.round(simulation.roi.projectedReturn * 100)}% ROI through enhanced brand positioning and market differentiation.`,
        consultation: "Strategic creative consultation ensures visual decisions align with business objectives and market positioning",
        conceptDevelopment: "Professional concept development creates differentiated brand experience that drives customer engagement",
        assetGeneration: "High-quality visual assets provide lasting brand value and consistent market presentation",
        revisions: "Iterative refinement ensures optimal creative outcomes and stakeholder alignment",
        projectManagement: "Professional project management ensures timely delivery and budget control"
      },
      ja: {
        overview: `$${simulation.projections.estimatedTotal.toLocaleString()}のプロフェッショナル・クリエイティブ・ディレクション投資は、ブランド・ポジショニングの強化と市場差別化により、推定${Math.round(simulation.roi.projectedReturn * 100)}%のROIで戦略的ビジュアル・アセットを提供します。`,
        consultation: "戦略的クリエイティブ・コンサルテーションにより、ビジュアル決定がビジネス目標と市場ポジショニングに合致することを保証",
        conceptDevelopment: "プロフェッショナル・コンセプト開発により、顧客エンゲージメントを促進する差別化されたブランド体験を創造",
        assetGeneration: "高品質ビジュアル・アセットは持続的なブランド価値と一貫した市場プレゼンテーションを提供",
        revisions: "反復的改良により最適なクリエイティブ成果とステークホルダー合意を確保",
        projectManagement: "プロフェッショナル・プロジェクト管理により適時配信と予算管理を保証"
      }
    };
    
    const breakdown = Object.entries(simulation.breakdown).map(([category, data]) => ({
      category: category,
      cost: data.projected,
      justification: justifications[locale][category as keyof typeof justifications[typeof locale]],
      valueDelivered: this.calculateValueDelivered(category, data, locale)
    }));
    
    return {
      overview: justifications[locale].overview,
      breakdown,
      totalValue: this.calculateTotalValue(simulation, locale),
      recommendations: this.generateCostRecommendations(simulation, locale)
    };
  }

  // Private helper methods
  private createInitialCostSimulation(budget: number): CostSimulation {
    return {
      sessionId: '',
      budget: {
        total: budget,
        allocated: 0,
        spent: 0,
        remaining: budget,
        reserved: 0
      },
      breakdown: {
        consultation: { budgeted: budget * 0.25, spent: 0, remaining: budget * 0.25, projected: budget * 0.25, items: [] },
        conceptDevelopment: { budgeted: budget * 0.3, spent: 0, remaining: budget * 0.3, projected: budget * 0.3, items: [] },
        assetGeneration: { budgeted: budget * 0.3, spent: 0, remaining: budget * 0.3, projected: budget * 0.3, items: [] },
        revisions: { budgeted: budget * 0.1, spent: 0, remaining: budget * 0.1, projected: budget * 0.1, items: [] },
        projectManagement: { budgeted: budget * 0.05, spent: 0, remaining: budget * 0.05, projected: budget * 0.05, items: [] }
      },
      transactions: [],
      projections: {
        estimatedTotal: budget,
        confidenceLevel: 0.85,
        riskFactors: [],
        optimizationOpportunities: []
      },
      alerts: [],
      thresholds: {
        warning: 75,
        critical: 90,
        projectHold: 100
      },
      roi: {
        estimatedValue: budget * 2.5,
        projectedReturn: 2.5,
        timeToValue: "3-6 months",
        riskAdjustedReturn: 2.0
      }
    };
  }

  private createInitialContinuity(sessionId: string): SessionContinuity {
    return {
      sessionId,
      journey: {
        currentPhase: "strategy-analysis",
        completedPhases: [],
        milestones: []
      },
      decisionGraph: {
        nodes: [],
        edges: []
      },
      conversationContext: {
        keyTopics: [],
        userPreferences: {},
        unexploredAreas: ["color-preferences", "style-direction", "budget-priorities"],
        priorityItems: []
      },
      consistency: {
        brandAlignment: 0.8,
        styleConsistency: 0.8,
        strategicCoherence: 0.8,
        implementationFeasibility: 0.8
      }
    };
  }

  private updateCostSimulation(sessionId: string, decision: CreativeDecision): void {
    const simulation = this.costSimulations.get(sessionId);
    if (!simulation) return;
    
    // Add cost transaction
    const transaction: CostTransaction = {
      id: `trans-${Date.now()}`,
      timestamp: decision.timestamp,
      category: this.mapDecisionToCategory(decision.category),
      description: decision.decision,
      amount: decision.implementation.cost,
      decisionId: decision.id,
      justification: decision.reasoning
    };
    
    simulation.transactions.push(transaction);
    
    // Update budget allocation
    simulation.budget.allocated += decision.implementation.cost;
    simulation.budget.remaining = simulation.budget.total - simulation.budget.allocated;
    
    // Check thresholds and create alerts
    const utilizationPercent = (simulation.budget.allocated / simulation.budget.total) * 100;
    if (utilizationPercent >= simulation.thresholds.warning && !simulation.alerts.some(a => a.type === 'warning' && !a.resolved)) {
      simulation.alerts.push({
        id: `alert-${Date.now()}`,
        timestamp: Date.now(),
        type: 'warning',
        message: `Budget utilization at ${Math.round(utilizationPercent)}% - approaching warning threshold`,
        action: 'Review remaining decisions and consider optimization opportunities',
        resolved: false
      });
    }
  }

  private updateSessionContinuity(sessionId: string, decision: CreativeDecision): void {
    const continuity = this.sessionContinuity.get(sessionId);
    if (!continuity) return;
    
    // Add decision to graph
    continuity.decisionGraph.nodes.push(decision);
    
    // Update conversation context
    if (!continuity.conversationContext.keyTopics.includes(decision.category)) {
      continuity.conversationContext.keyTopics.push(decision.category);
    }
    
    // Update phase progression
    const newPhase = this.determinePhaseFromDecision(decision.category);
    if (newPhase && newPhase !== continuity.journey.currentPhase) {
      continuity.journey.completedPhases.push(continuity.journey.currentPhase);
      continuity.journey.currentPhase = newPhase;
    }
  }

  private mapDecisionToCategory(decisionCategory: CreativeDecisionCategory): keyof CostSimulation['breakdown'] {
    const mapping: Record<CreativeDecisionCategory, keyof CostSimulation['breakdown']> = {
      'color-palette': 'conceptDevelopment',
      'typography': 'conceptDevelopment',
      'composition': 'conceptDevelopment',
      'imagery-style': 'conceptDevelopment',
      'brand-direction': 'consultation',
      'asset-generation': 'assetGeneration',
      'style-framework': 'conceptDevelopment',
      'budget-allocation': 'projectManagement',
      'timeline-adjustment': 'projectManagement',
      'scope-change': 'revisions'
    };
    
    return mapping[decisionCategory] || 'consultation';
  }

  private calculateRiskLevel(simulation: CostSimulation): "low" | "medium" | "high" {
    const utilization = simulation.budget.allocated / simulation.budget.total;
    const projectedOverrun = simulation.projections.estimatedTotal / simulation.budget.total - 1;
    
    if (utilization > 0.9 || projectedOverrun > 0.2) return "high";
    if (utilization > 0.75 || projectedOverrun > 0.1) return "medium";
    return "low";
  }

  private generateOptimizations(simulation: CostSimulation): Array<{
    description: string;
    potentialSaving: number;
    impact: string;
  }> {
    return [
      {
        description: "Combine similar asset generation tasks for efficiency",
        potentialSaving: simulation.breakdown.assetGeneration.projected * 0.15,
        impact: "Reduces timeline by 1-2 weeks while maintaining quality"
      },
      {
        description: "Use template-based approach for secondary applications",
        potentialSaving: simulation.breakdown.conceptDevelopment.projected * 0.2,
        impact: "Faster implementation with consistent brand application"
      },
      {
        description: "Phase implementation to spread costs",
        potentialSaving: 0,
        impact: "Improves cash flow and allows for iterative refinement"
      }
    ];
  }

  private generateDecisionRecommendations(decisions: CreativeDecision[]): string[] {
    const recommendations: string[] = [];
    
    if (decisions.filter(d => d.status === 'proposed').length > 3) {
      recommendations.push("Consider approving pending decisions to maintain project momentum");
    }
    
    if (decisions.some(d => d.impact.budgetImpact > 0.3)) {
      recommendations.push("Review high-impact budget decisions for optimization opportunities");
    }
    
    if (decisions.filter(d => d.implementation.riskLevel === 'high').length > 1) {
      recommendations.push("Mitigate risks in high-complexity decisions through phased approach");
    }
    
    return recommendations;
  }

  private calculateValueDelivered(category: string, data: CostCategory, locale: "en" | "ja"): string {
    const valueDescriptions = {
      en: {
        consultation: "Strategic alignment and reduced revision cycles",
        conceptDevelopment: "Differentiated brand positioning and market appeal",
        assetGeneration: "Professional visual assets with lasting brand value",
        revisions: "Optimized outcomes and stakeholder satisfaction",
        projectManagement: "On-time delivery and budget control"
      },
      ja: {
        consultation: "戦略的整合と修正サイクルの削減",
        conceptDevelopment: "差別化されたブランドポジショニングと市場アピール",
        assetGeneration: "持続的ブランド価値を持つプロフェッショナルビジュアルアセット",
        revisions: "最適化された成果とステークホルダー満足",
        projectManagement: "適時配送と予算管理"
      }
    };
    
    return valueDescriptions[locale][category as keyof typeof valueDescriptions[typeof locale]] || "";
  }

  private calculateTotalValue(simulation: CostSimulation, locale: "en" | "ja"): string {
    const totalValue = simulation.roi.estimatedValue;
    return locale === "en" 
      ? `Total estimated value: $${totalValue.toLocaleString()} over ${simulation.roi.timeToValue}`
      : `総推定価値: $${totalValue.toLocaleString()} (${simulation.roi.timeToValue}にわたって)`;
  }

  private generateCostRecommendations(simulation: CostSimulation, locale: "en" | "ja"): string[] {
    const recommendations = [];
    
    if (simulation.budget.allocated / simulation.budget.total > 0.8) {
      recommendations.push(
        locale === "en" 
          ? "Consider budget optimization to ensure project completion within allocated funds"
          : "割り当てられた資金内でのプロジェクト完了を確保するため予算最適化を検討"
      );
    }
    
    if (simulation.roi.projectedReturn < 2.0) {
      recommendations.push(
        locale === "en"
          ? "Evaluate scope adjustments to improve return on investment"
          : "投資収益率改善のためスコープ調整を評価"
      );
    }
    
    return recommendations;
  }

  private determinePhaseFromDecision(category: CreativeDecisionCategory): CreativePhase | null {
    const phaseMapping: Record<CreativeDecisionCategory, CreativePhase> = {
      'brand-direction': 'concept-development',
      'color-palette': 'style-definition',
      'typography': 'style-definition', 
      'composition': 'style-definition',
      'imagery-style': 'style-definition',
      'style-framework': 'asset-planning',
      'asset-generation': 'asset-generation',
      'budget-allocation': 'strategy-analysis',
      'timeline-adjustment': 'refinement',
      'scope-change': 'refinement'
    };
    
    return phaseMapping[category] || null;
  }
}

// Export singleton instance
export const demoCreativeTracker = new DemoCreativeTracker();

// Export utility functions
export function initializeDemoSession(sessionId: string, budget?: number, locale?: "en" | "ja"): void {
  demoCreativeTracker.initializeSession(sessionId, budget, locale);
}

export function trackCreativeDecision(
  sessionId: string,
  decision: Omit<CreativeDecision, 'id' | 'timestamp' | 'sessionId' | 'revisionHistory'>
): CreativeDecision {
  return demoCreativeTracker.trackDecision(sessionId, decision);
}

export function getSessionAnalysis(sessionId: string) {
  return {
    decisions: demoCreativeTracker.getSessionDecisions(sessionId),
    costs: demoCreativeTracker.getCostSimulation(sessionId),
    justification: demoCreativeTracker.generateCostJustification(sessionId)
  };
}