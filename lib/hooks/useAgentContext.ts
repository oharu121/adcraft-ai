/**
 * Hook to detect current agent context based on store states
 * Returns the active agent and provides styling hints
 */
'use client';

import { useProductIntelligenceStore } from '@/lib/stores/product-intelligence-store';
import { useCreativeDirectorStore } from '@/lib/stores/creative-director-store';
import { useVideoProducerStore } from '@/lib/stores/video-producer-store';
import { SessionStatus as MayaSessionStatus } from '@/lib/agents/product-intelligence/enums';
import { SessionStatus as DavidSessionStatus } from '@/lib/agents/creative-director/enums';

export type AgentContext = 'maya' | 'david' | 'zara' | 'neutral';

export interface AgentContextInfo {
  agent: AgentContext;
  name: string;
  color: string;
  accentColor: string;
  isActive: boolean;
}

export function useAgentContext(): AgentContextInfo {
  // Store states
  const mayaStore = useProductIntelligenceStore();
  const davidStore = useCreativeDirectorStore();
  const zaraStore = useVideoProducerStore();

  // Detect active agent based on store states
  const detectActiveAgent = (): AgentContext => {
    // Check Zara (Video Producer) - highest priority when active
    if (zaraStore.isInitialized || zaraStore.isProducing || zaraStore.finalVideoUrl) {
      return 'zara';
    }

    // Check David (Creative Director) - active when has creative direction or in progress
    if (davidStore.sessionStatus === DavidSessionStatus.ANALYZING ||
        davidStore.sessionStatus === DavidSessionStatus.READY ||
        davidStore.creativeDirection ||
        davidStore.mayaHandoffData.productAnalysis) {
      return 'david';
    }

    // Check Maya (Product Intelligence) - active when analyzing or has analysis
    if (mayaStore.sessionStatus === MayaSessionStatus.ANALYZING ||
        mayaStore.sessionStatus === MayaSessionStatus.ACTIVE ||
        mayaStore.analysis ||
        mayaStore.currentStep === 'analyze' ||
        mayaStore.currentStep === 'chat') {
      return 'maya';
    }

    // Default to neutral
    return 'neutral';
  };

  const activeAgent = detectActiveAgent();

  // Agent color schemes matching the application theme
  const getAgentInfo = (agent: AgentContext): AgentContextInfo => {
    switch (agent) {
      case 'maya':
        return {
          agent: 'maya',
          name: 'Maya',
          color: '#3B82F6', // blue-500
          accentColor: '#DBEAFE', // blue-100
          isActive: true,
        };
      case 'david':
        return {
          agent: 'david',
          name: 'David',
          color: '#8B5CF6', // violet-500
          accentColor: '#EDE9FE', // violet-100
          isActive: true,
        };
      case 'zara':
        return {
          agent: 'zara',
          name: 'Zara',
          color: '#EF4444', // red-500
          accentColor: '#FEE2E2', // red-100
          isActive: true,
        };
      default:
        return {
          agent: 'neutral',
          name: 'AdCraft AI',
          color: '#64748B', // slate-500
          accentColor: '#F1F5F9', // slate-100
          isActive: false,
        };
    }
  };

  return getAgentInfo(activeAgent);
}