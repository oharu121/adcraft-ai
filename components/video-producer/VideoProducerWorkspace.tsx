"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import VideoProducerProgress from "./VideoProducerProgress";
import VideoProducerChatContainer from "./VideoProducerChatContainer";
import { useVideoProducerStore } from "@/lib/stores/video-producer-store";
import { VideoProducerWorkflowStep } from "@/lib/stores/video-producer-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import VideoProducerCard from "./VideoProducerCard";

interface VideoProducerWorkspaceProps {
  dict: Dictionary;
  locale: Locale;
  onScrollToChatSection?: () => void;
}

export default function VideoProducerWorkspace({
  dict,
  locale,
  onScrollToChatSection,
}: VideoProducerWorkspaceProps) {
  const [workflowProgressExpanded, setWorkflowProgressExpanded] = useState(true);
  const [mainContentHeight, setMainContentHeight] = useState<number | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const {
    sessionId,
    messages,
    isAgentTyping,
    chatInputMessage,
    setChatInputMessage,
    addMessage,
    setIsAgentTyping,
    creativeDirectorHandoffData,
    currentStep,
    setCurrentStep,
    selectedNarrativeStyle,
    selectedMusicGenre,
  } = useVideoProducerStore();

  // Handle step navigation from progress sidebar
  const handleNavigateToStep = useCallback(
    (step: VideoProducerWorkflowStep) => {
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
          role: "user" as const,
          content: message,
          timestamp: Date.now(),
        };
        addMessage(userMessage);

        // Call our Video Producer API
        const response = await fetch(`/api/agents/video-producer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            action: "chat",
            locale,
            data: { message },
            context: {
              currentStep,
              selectedNarrativeStyle,
              selectedMusicGenre,
              creativeDirectorHandoffData,
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
          role: "assistant" as const,
          content: data.data?.response || "I'm working on your video production!",
          timestamp: Date.now(),
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
      currentStep,
      selectedNarrativeStyle,
      selectedMusicGenre,
      creativeDirectorHandoffData,
    ]
  );

  return (
    <div className="flex gap-6 min-h-screen items-start">
      {/* Left: Main Video Producer Card - Fully Expanded */}
      <div className="flex-1" ref={mainContentRef}>
        <VideoProducerCard
          dict={dict}
          locale={locale}
          onScrollToChatSection={onScrollToChatSection}
          onNavigateToStep={handleNavigateToStep}
          currentStep={currentStep}
          onStepChange={(step: VideoProducerWorkflowStep) => setCurrentStep(step)}
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
        <VideoProducerProgress
          onNavigateToStep={handleNavigateToStep}
          expanded={workflowProgressExpanded}
          onToggleExpanded={handleToggleWorkflowProgress}
          dict={dict}
          locale={locale}
        />

        {/* Chat - Always visible, expands to fill remaining space after Progress */}
        <div className="flex-1 mt-4 bg-gray-800/30 rounded-xl border border-gray-600/50 flex flex-col min-h-0">
          {/* Chat content expands to fill remaining space */}
          <div className="flex-1 overflow-y-auto">
            <VideoProducerChatContainer
              sessionId={sessionId || ""}
              messages={messages}
              isConnected={true}
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