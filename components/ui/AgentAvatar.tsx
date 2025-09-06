/**
 * Agent Avatar - Generic Multi-Agent Avatar Component
 * 
 * Reusable avatar component that works with any agent configuration.
 * Supports different sizes, states, and agents with optimized GIF loading.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { AGENTS, type AgentId, type AgentState, getAgent, getAgentAsset } from '@/lib/constants/agents';

export interface AgentAvatarProps {
  agent: AgentId;
  size?: 'sm' | 'md' | 'lg';
  state?: AgentState;
  className?: string;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agent,
  size = 'md',
  state = 'idle',
  className = ''
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { size: 32, containerClass: 'w-8 h-8' },
    md: { size: 48, containerClass: 'w-12 h-12' },
    lg: { size: 64, containerClass: 'w-16 h-16' }
  };

  const config = sizeConfig[size];
  const agentConfig = getAgent(agent);
  const gifSource = getAgentAsset(agent, state);

  return (
    <div className={`${config.containerClass} ${className} flex items-center justify-center overflow-hidden`}>
      <div className="relative rounded-full overflow-hidden shadow-sm bg-gray-100">
        <Image
          src={gifSource}
          alt={`${agentConfig.name} Avatar`}
          width={config.size}
          height={config.size}
          className="object-cover w-full h-full rounded-full"
          priority
          unoptimized // Important for GIFs to preserve animation
        />
      </div>
    </div>
  );
};

// Re-export agent configurations for convenience
export { AGENTS, type AgentId, type AgentState };
export default AgentAvatar;