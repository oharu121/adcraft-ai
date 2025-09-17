/**
 * App Phase Management Types
 * Defines the workflow phases and transitions between agents
 */

export type AppPhase =
  | "product-input" // Initial product upload/description
  | "maya-analysis" // Maya analyzing product
  | "maya-strategy" // Maya showing strategy, chat available
  | "david-creative" // David creating visual direction
  | "zara-production" // Zara producing final video
  | "completed"; // Workflow complete

export interface PhaseState {
  currentPhase: AppPhase;
  completedPhases: AppPhase[];
  canAccessPhase: (phase: AppPhase) => boolean;
  getNextPhase: () => AppPhase | null;
  getPreviousPhase: () => AppPhase | null;
}

export interface PhaseTransitionData {
  from: AppPhase;
  to: AppPhase;
  agentHandoff?: {
    fromAgent: string;
    toAgent: string;
    data: any;
  };
}

// Phase progression order
export const PHASE_ORDER: AppPhase[] = [
  "product-input",
  "maya-analysis",
  "maya-strategy",
  "david-creative",
  "zara-production",
  "completed",
];

// Agent mapping
export const PHASE_AGENTS: Record<AppPhase, string> = {
  "product-input": "user",
  "maya-analysis": "maya",
  "maya-strategy": "maya",
  "david-creative": "david",
  "zara-production": "zara",
  completed: "system",
};
