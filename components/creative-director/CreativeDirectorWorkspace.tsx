"use client";

import React, { useState, useCallback } from "react";
import ImprovedCreativeDirectorCard from "@/components/home/ImprovedCreativeDirectorCard";
import ProjectSummary from "./ProjectSummary";
import CreativeChatContainer from "./CreativeChatContainer";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";

interface CreativeDirectorWorkspaceProps {
  dict: Dictionary;
  locale: Locale;
  onScrollToChatSection?: () => void;
}

export default function CreativeDirectorWorkspace({
  dict,
  locale,
  onScrollToChatSection,
}: CreativeDirectorWorkspaceProps) {
  const [showChat, setShowChat] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("production-style");

  const {
    sessionId,
    messages,
    isConnected,
    isAgentTyping,
    chatInputMessage,
    setChatInputMessage,
    addMessage,
    setIsAgentTyping,
    mayaHandoffData,
    currentPhase,
    selectedStyleOption,
  } = useCreativeDirectorStore();

  // Handle step navigation from summary
  const handleNavigateToStep = useCallback((step: string) => {
    setCurrentStep(step);
  }, []);

  // Handle chat toggle
  const handleToggleChat = useCallback(() => {
    setShowChat(prev => !prev);
  }, []);

  // Handle chat message sending
  const handleSendMessage = useCallback(
    async (message: string) => {
      try {
        setIsAgentTyping(true);

        // Add user message to store
        const userMessage = {
          id: crypto.randomUUID(),
          type: "user" as const,
          content: message,
          timestamp: Date.now(),
          sessionId,
          locale: locale || "en",
        };
        addMessage(userMessage);

        // Call our Creative Director API
        const response = await fetch(`/api/agents/creative-director/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            message,
            locale,
            currentPhase,
            selectedStyle: selectedStyleOption?.id,
            context: {
              mayaHandoffData,
              conversationHistory: messages,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Add agent response
        const agentMessage = {
          id: crypto.randomUUID(),
          type: "agent" as const,
          content: data.message || "I'm working on your creative direction!",
          timestamp: Date.now(),
          sessionId,
          locale: locale || "en",
          processingTime: data.data?.processingTime,
          cost: data.metadata?.cost,
          confidence: data.metadata?.confidence,
          quickActions: data.data?.quickActions || [],
        };
        addMessage(agentMessage);
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsAgentTyping(false);
      }
    },
    [sessionId, locale, addMessage, setIsAgentTyping, currentPhase, selectedStyleOption, mayaHandoffData, messages]
  );

  return (
    <div className="flex gap-6">
      {/* Main Creative Director Card */}
      <div className="flex-1">
        <ImprovedCreativeDirectorCard
          dict={dict}
          locale={locale}
          onScrollToChatSection={onScrollToChatSection}
          onNavigateToStep={handleNavigateToStep}
          showChat={showChat}
          onToggleChat={handleToggleChat}
        />
      </div>

      {/* Right Sidebar - Summary + Chat */}
      <div className="w-80 space-y-4">
        {/* Project Summary */}
        <ProjectSummary
          onNavigateToStep={handleNavigateToStep}
        />

        {/* Chat Sidebar */}
        {showChat && (
          <div className="bg-gray-800/30 rounded-xl border border-gray-600/50 flex flex-col max-h-96">
            <div className="p-4 border-b border-gray-600/50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Chat with David</h3>
                <button
                  onClick={handleToggleChat}
                  className="cursor-pointer text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <CreativeChatContainer
                sessionId={sessionId}
                messages={messages}
                isConnected={isConnected}
                isAgentTyping={isAgentTyping}
                onSendMessage={handleSendMessage}
                dict={dict}
                locale={locale}
                inputMessage={chatInputMessage}
                onInputMessageChange={setChatInputMessage}
                onScrollRequest={onScrollToChatSection}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}