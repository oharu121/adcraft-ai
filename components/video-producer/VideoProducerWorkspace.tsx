"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import VideoProducerProgress from "./VideoProducerProgress";
import VideoProducerChatContainer from "./VideoProducerChatContainer";
import ProductionProgress from "@/components/video/ProductionProgress";
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
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
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
    isInitialized,
    setIsInitialized,
    setAvailableNarrativeStyles,
    setAvailableMusicGenres,
    setAvailableVideoFormats,
    // Video production state
    isProducing,
    productionProgress,
    finalVideoUrl,
    currentJobId,
    startVideoProduction,
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

  // Initialize Zara when Creative Director handoff data is available
  useEffect(() => {
    console.log("🔍 VideoProducerWorkspace: useEffect triggered", {
      hasHandoffData: !!creativeDirectorHandoffData,
      isInitialized,
      locale,
      handoffSessionId: creativeDirectorHandoffData?.creativeDirectorSessionId,
    });

    const initializeZara = async () => {
      if (creativeDirectorHandoffData && !isInitialized) {
        console.log("🎬 VideoProducer: Starting initialization...", {
          handoffData: creativeDirectorHandoffData,
          locale,
        });

        try {
          const requestBody = {
            sessionId,
            action: "initialize",
            locale,
            data: {
              creativeDirectorHandoffData,
            },
          };
          console.log("🎬 VideoProducer: Sending request:", requestBody);

          const response = await fetch("/api/agents/video-producer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          console.log("🎬 VideoProducer: Response status:", response.status);
          const result = await response.json();
          console.log("🎬 VideoProducer: Full API response:", result);

          if (result.success && result.data) {
            console.log("🎬 VideoProducer: Processing API data...", {
              narrativeStylesCount: result.data.narrativeStyles?.length || 0,
              musicGenresCount: result.data.musicGenres?.length || 0,
              videoFormatsCount: result.data.videoFormats?.length || 0,
            });

            // Store the API-generated options in Zustand store
            if (result.data.narrativeStyles) {
              console.log("📝 Setting narrative styles:", result.data.narrativeStyles);
              setAvailableNarrativeStyles(result.data.narrativeStyles);
            }
            if (result.data.musicGenres) {
              console.log("📝 Setting music genres:", result.data.musicGenres);
              setAvailableMusicGenres(result.data.musicGenres);
            }
            if (result.data.videoFormats) {
              console.log("📝 Setting video formats:", result.data.videoFormats);
              setAvailableVideoFormats(result.data.videoFormats);
            }

            setIsInitialized(true);
            console.log("✅ VideoProducer: Initialization complete - store updated");
          } else {
            console.error("❌ VideoProducer: API returned failure:", result);
          }
        } catch (error) {
          console.error("❌ VideoProducer: Initialization failed:", error);
        }
      } else {
        console.log("⏭️ VideoProducer: Skipping initialization", {
          reason: !creativeDirectorHandoffData ? "no handoff data" : "already initialized",
        });
      }
    };

    initializeZara();
  }, [
    creativeDirectorHandoffData,
    isInitialized,
    locale,
    setIsInitialized,
    setAvailableNarrativeStyles,
    setAvailableMusicGenres,
    setAvailableVideoFormats,
  ]);

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
    <>
      <div className="flex gap-6 min-h-screen items-start">
        {/* Left: Main Video Producer Card - Full width on mobile, flex-1 on desktop */}
        <div className="w-full lg:flex-1" ref={mainContentRef}>
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

        {/* Right: Sidebar - Hidden on mobile (< lg), visible on desktop */}
        <div
          className="hidden lg:flex w-80 flex-col"
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

      {/* Mobile Floating Chat Button - Only visible on mobile (< lg) */}
      <button
        onClick={() => setIsMobileChatOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {messages.length}
          </div>
        )}
      </button>

      {/* Mobile Chat Modal - Full screen on mobile */}
      {isMobileChatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-900">
          {/* Header */}
          <div className="bg-gradient-to-br from-red-900/90 via-red-800/80 to-orange-900/90 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💬</span>
              {dict.common.chat || "Chat"}
            </h2>
            <button
              onClick={() => setIsMobileChatOpen(false)}
              className="cursor-pointer w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 flex items-center justify-center"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex flex-col h-[calc(100vh-64px)]">
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
              onTextareaFocus={() => {}}
            />
          </div>
        </div>
      )}
    </>
  );
}
