"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ImprovedCreativeDirectorCard from "@/components/home/ImprovedCreativeDirectorCard";
import WorkflowProgress from "./WorkflowProgress";
import CreativeChatContainer from "./CreativeChatContainer";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import { WorkflowStep } from "@/lib/agents/creative-director/enums";
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
  const [workflowProgressExpanded, setWorkflowProgressExpanded] = useState(true);
  const [mainContentHeight, setMainContentHeight] = useState<number | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

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
    currentStep,
    setCurrentStep,
    selectedStyleOption,
  } = useCreativeDirectorStore();

  // Handle step navigation from summary
  const handleNavigateToStep = useCallback(
    (step: WorkflowStep) => {
      setCurrentStep(step);
      // Expand workflow progress when navigating steps
      setWorkflowProgressExpanded(true);
    },
    [setCurrentStep]
  );

  // Handle workflow progress toggle
  const handleToggleWorkflowProgress = useCallback(() => {
    setWorkflowProgressExpanded((prev) => !prev);
  }, []);

  // Handle expanding workflow progress (for navigation buttons)
  const handleExpandWorkflowProgress = useCallback(() => {
    setWorkflowProgressExpanded(true);
  }, []);

  // Measure main content height and sync sidebar
  useEffect(() => {
    const measureHeight = () => {
      if (mainContentRef.current) {
        const height = mainContentRef.current.offsetHeight;
        setMainContentHeight(height);
      }
    };

    // Initial measurement
    measureHeight();

    // Setup ResizeObserver for dynamic height changes
    const resizeObserver = new ResizeObserver(() => {
      measureHeight();
    });

    if (mainContentRef.current) {
      resizeObserver.observe(mainContentRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
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
    [
      sessionId,
      locale,
      addMessage,
      setIsAgentTyping,
      currentPhase,
      selectedStyleOption,
      mayaHandoffData,
      messages,
    ]
  );

  return (
    <div className="flex gap-6 min-h-screen items-start">
      {/* Left: Main Creative Director Card - Fully Expanded */}
      <div className="flex-1" ref={mainContentRef}>
        <ImprovedCreativeDirectorCard
          dict={dict}
          locale={locale}
          onScrollToChatSection={onScrollToChatSection}
          onNavigateToStep={handleNavigateToStep}
          currentStep={currentStep}
          onStepChange={(step: WorkflowStep) => setCurrentStep(step)}
          onExpandWorkflowProgress={handleExpandWorkflowProgress}
        />
      </div>

      {/* Right: Sidebar matches main content height exactly */}
      <div
        className="w-80 flex flex-col"
        style={{
          height: mainContentHeight ? `${mainContentHeight}px` : "auto",
        }}
      >
        {/* Workflow Progress */}
        <WorkflowProgress
          onNavigateToStep={handleNavigateToStep}
          expanded={workflowProgressExpanded}
          onToggleExpanded={handleToggleWorkflowProgress}
        />

        {/* Chat - Always visible, expands to fill remaining space after WorkflowProgress */}
        <div className="flex-1 mt-4 bg-gray-800/30 rounded-xl border border-gray-600/50 flex flex-col min-h-0">
          <div className="flex-shrink-0 p-4 border-b border-gray-600/50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Chat with David</h3>
            </div>
          </div>

          {/* Chat content expands to fill remaining space */}
          <div className="flex-1 overflow-y-auto">
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
              onTextareaFocus={() => setWorkflowProgressExpanded(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
