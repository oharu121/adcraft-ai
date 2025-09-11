/**
 * Agent Configurations - Multi-Agent System
 * 
 * Centralized configuration for all AI agents including their personas,
 * visual assets, and behavioral characteristics.
 */

import { MAYA_PERSONA } from './maya-persona';

// Agent asset paths interface
export interface AgentAssets {
  idle: string;
  thinking: string;
  speaking: string;
}

// Agent configuration interface
export interface AgentConfig {
  name: string;
  persona: typeof MAYA_PERSONA; // Will be generic when we add more personas
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
      speaking: "/agent-avatar/maya-speaking.gif"
    },
    color: "#3B82F6" // Blue theme
  },
  // Future agents can be added here:
  // bob: {
  //   name: "Bob", 
  //   persona: BOB_PERSONA,
  //   assets: {
  //     idle: "/agent-avatar/bob-idling.gif",
  //     thinking: "/agent-avatar/bob-thinking.gif",
  //     speaking: "/agent-avatar/bob-speaking.gif"
  //   },
  //   color: "#10B981" // Green theme
  // }
} as const;

// Type helpers
export type AgentId = keyof typeof AGENTS;
export type AgentState = keyof AgentAssets;

// Helper functions
export const getAgent = (agentId: AgentId): AgentConfig => AGENTS[agentId];
export const getAgentAsset = (agentId: AgentId, state: AgentState): string => 
  AGENTS[agentId].assets[state];