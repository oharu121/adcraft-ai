/**
 * Agent Configurations - Multi-Agent System
 *
 * Centralized configuration for all AI agents including their personas,
 * visual assets, and behavioral characteristics.
 */

import { MAYA_PERSONA } from "./maya-persona";
import { DAVID_PERSONA } from "./david-persona";
import { ZARA_PERSONA } from "./zara-persona";

// Agent asset paths interface
export interface AgentAssets {
  idle: string;
  thinking: string;
  speaking: string;
  creating?: string; // Optional creating state for creative agents
}

// Agent configuration interface
export interface AgentConfig {
  name: string;
  persona: typeof MAYA_PERSONA | typeof DAVID_PERSONA | typeof ZARA_PERSONA; // Support multiple personas
  assets: AgentAssets;
  color?: string; // Optional theme color for UI consistency
}

// All agent configurations
export const AGENTS = {
  maya: {
    name: "Maya",
    persona: MAYA_PERSONA,
    assets: {
      idle: "/agent-avatar/maya-idling.gif",
      thinking: "/agent-avatar/maya-thinking.gif",
      speaking: "/agent-avatar/maya-speaking.gif",
    },
    color: "#3B82F6", // Blue theme
  },
  david: {
    name: "David",
    persona: DAVID_PERSONA,
    assets: {
      idle: "/agent-avatar/david-idling.gif",
      thinking: "/agent-avatar/david-thinking.gif",
      speaking: "/agent-avatar/david-speaking.gif",
    },
    color: "#8B5CF6", // Purple theme for creative director
  },
  zara: {
    name: "Zara",
    persona: ZARA_PERSONA,
    assets: {
      idle: "/agent-avatar/zara-idling.gif", // TODO: Replace with zara-idling.gif when created
      thinking: "/agent-avatar/zara-thinking.gif", // TODO: Replace with zara-thinking.gif when created
      speaking: "/agent-avatar/zara-speaking.gif", // TODO: Replace with zara-speaking.gif when created
    },
    color: "#EF4444", // Red theme for video producer
  },
} as const;

// Type helpers
export type AgentId = keyof typeof AGENTS;
export type AgentState = keyof AgentAssets;

// Helper functions
export const getAgent = (agentId: AgentId): AgentConfig => AGENTS[agentId];
export const getAgentAsset = (agentId: AgentId, state: AgentState): string => {
  const agent = AGENTS[agentId];
  const asset = (agent.assets as any)[state];
  // Fallback to idle if state doesn't exist (e.g., 'creating' for Maya)
  return asset || agent.assets.idle;
};
