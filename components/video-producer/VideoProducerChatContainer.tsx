/**
 * Video Producer Chat Container - Zara's Chat Interface
 *
 * Specialized chat interface for Video Producer (Zara) agent featuring:
 * - Zara's personality and video production focus
 * - Production decision support and timing terminology
 * - Video generation request integration
 * - Production progress updates
 * - Zara-specific quick actions and suggestions
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import AgentAvatar from "@/components/ui/AgentAvatar";
import type { Dictionary } from "@/lib/dictionaries";
import { useVideoProducerStore, VideoProducerWorkflowStep } from "@/lib/stores/video-producer-store";

export interface VideoProducerChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface VideoProducerChatContainerProps {
  sessionId: string;
  messages: VideoProducerChatMessage[];
  isConnected: boolean;
  isAgentTyping: boolean;
  onSendMessage: (message: string) => Promise<void>;
  dict: Dictionary;
  locale?: "en" | "ja";
  className?: string;
  inputMessage?: string;
  onInputMessageChange?: (message: string) => void;
  onScrollRequest?: () => void;
  onTextareaFocus?: () => void;
}

const VideoProducerChatContainer: React.FC<VideoProducerChatContainerProps> = ({
  sessionId,
  messages,
  isConnected,
  isAgentTyping,
  onSendMessage,
  dict,
  locale = "en",
  className = "",
  inputMessage = "",
  onInputMessageChange,
  onScrollRequest,
  onTextareaFocus,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [typingMessages, setTypingMessages] = useState<Set<string>>(new Set());
  const [visibleContent, setVisibleContent] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get currentStep from store for step-based behavior
  const { currentStep, isProducing } = useVideoProducerStore();

  // Use dictionary for localized text
  const t = dict.videoProducer;

  // Determine chat mode based on current step
  const isNarrativeMode = currentStep === VideoProducerWorkflowStep.NARRATIVE_STYLE;
  const isMusicMode = currentStep === VideoProducerWorkflowStep.MUSIC_TONE;
  const isProductionMode = currentStep === VideoProducerWorkflowStep.FINAL_PRODUCTION;

  // Auto-focus input when component mounts and restore cursor position
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const length = inputMessage.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [inputMessage.length]);

  // Track previous message count to only scroll on new messages
  const prevMessageCountRef = useRef(0);

  // Scroll when new messages arrive or agent starts thinking
  useEffect(() => {
    if (isAgentTyping) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }

    // Only scroll if there are actually NEW messages (not just state updates)
    if (messages.length > prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;

      if (onScrollRequest) {
        onScrollRequest();
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, isAgentTyping, onScrollRequest]);

  // Handle user typing detection
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (inputMessage.trim()) {
      setUserTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setUserTyping(false);
      }, 2000);
    } else {
      setUserTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputMessage]);

  // Typing effect for agent messages
  const startTypingEffect = useCallback((message: VideoProducerChatMessage) => {
    if (message.role === "user") return;

    const messageId = message.id;
    const fullContent = message.content;

    const existingInterval = typingIntervalsRef.current.get(messageId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    setTypingMessages((prev) => new Set(prev).add(messageId));
    setVisibleContent((prev) => new Map(prev).set(messageId, ""));

    let charIndex = 0;
    const typingSpeed = 12; // Slightly faster for video production energy

    const interval = setInterval(() => {
      if (charIndex < fullContent.length) {
        setVisibleContent((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, fullContent.slice(0, charIndex + 1));
          return newMap;
        });
        charIndex++;

        if (charIndex % 10 === 0 || fullContent[charIndex - 1] === "\\n") {
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 10);
        }
      } else {
        clearInterval(interval);
        typingIntervalsRef.current.delete(messageId);
        setTypingMessages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        setVisibleContent((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, fullContent);
          return newMap;
        });

        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      }
    }, typingSpeed);

    typingIntervalsRef.current.set(messageId, interval);
  }, []);

  // Start typing effect for new agent messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      !typingMessages.has(lastMessage.id) &&
      !visibleContent.has(lastMessage.id)
    ) {
      setTimeout(() => startTypingEffect(lastMessage), 100);
    }
  }, [messages, startTypingEffect, typingMessages, visibleContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      typingIntervalsRef.current.forEach((interval) => clearInterval(interval));
      typingIntervalsRef.current.clear();
    };
  }, []);

  // Handle message submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!inputMessage.trim() || isSubmitting || !isConnected) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSendMessage(inputMessage.trim());
        if (onInputMessageChange) {
          onInputMessageChange("");
        }
        inputRef.current?.focus();
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [inputMessage, isSubmitting, isConnected, onSendMessage, onInputMessageChange]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [handleSubmit]
  );

  // Get avatar state for message
  const getAvatarState = (message: VideoProducerChatMessage): "idle" | "thinking" | "speaking" => {
    if (message.role !== "assistant") return "idle";
    if (typingMessages.has(message.id)) return "speaking";
    return "idle";
  };

  // Render individual message
  const renderMessage = (message: VideoProducerChatMessage, index: number) => {
    const isUser = message.role === "user";
    const isTyping = typingMessages.has(message.id);
    const displayContent = isTyping ? visibleContent.get(message.id) || "" : message.content;

    return (
      <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
          {/* Avatar */}
          {!isUser && (
            <div className="flex items-center mb-1">
              <div className="mr-2">
                <AgentAvatar agent="zara" size="md" state={getAvatarState(message)} />
              </div>
              <span className="text-xs text-gray-500">Zara</span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-3 rounded-lg ${
              isUser
                ? "bg-red-600 text-white rounded-br-sm"
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">
              {displayContent}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>

          {/* Timestamp */}
          <div className={`text-xs text-gray-400 mt-1 ${isUser ? "text-right" : "text-left"}`}>
            {new Date(message.timestamp).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isAgentTyping) return null;

    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-3xl">
          <div className="flex items-center mb-1">
            <div className="mr-2">
              <AgentAvatar agent="zara" size="md" state="thinking" />
            </div>
            <span className="text-xs text-gray-500">Zara is thinking...</span>
          </div>

          <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render greeting message when no messages exist
  const renderGreeting = () => {
    if (messages.length > 0) return null;

    // Get step-specific greeting message
    const getGreetingMessage = () => {
      if (isNarrativeMode) {
        return locale === "ja"
          ? "こんにちは！ナラティブスタイルについて何か質問はありますか？ペーシングやトーンについてお気軽にお聞きください。"
          : "Hi! Any questions about narrative styles? Feel free to ask about pacing, tone, or storytelling approaches!";
      } else if (isMusicMode) {
        return locale === "ja"
          ? "音楽の選択について質問がありますか？ムード、エネルギー、楽器について何でもお聞きください。"
          : "Questions about music selection? Ask me about mood, energy levels, or instrumentation choices!";
      } else if (isProductionMode) {
        return locale === "ja"
          ? "動画制作の準備ができました！制作プロセス、タイミング、技術的な質問があればお聞きください。"
          : "Ready for video production! Ask me about the production process, timing, or any technical questions!";
      } else {
        return locale === "ja"
          ? "こんにちは！動画制作について何でもお聞きください。お手伝いします！"
          : "Hi! Ask me anything about video production. I'm here to help!";
      }
    };

    return (
      <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center mb-2">
          <div className="mr-2">
            <AgentAvatar agent="zara" size="md" state="idle" />
          </div>
          <span className="text-red-900 font-medium text-sm">Zara</span>
          <span className="ml-2 text-xs text-red-600 bg-red-200 px-2 py-1 rounded">
            {isProductionMode && isProducing
              ? locale === "ja" ? "制作中" : "Producing"
              : locale === "ja" ? "準備完了" : "Ready"}
          </span>
        </div>
        <p className="text-red-800 text-sm whitespace-pre-wrap">
          {getGreetingMessage()}
        </p>
      </div>
    );
  };

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900">Chat with Zara</h3>

        {/* Connection status */}
        <div className="flex items-center text-sm">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-red-500" : "bg-red-500"}`}
          />
          <span className={isConnected ? "text-red-600" : "text-red-600"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-0 bg-white scrollbar-hidden"
      >
        {renderGreeting()}
        {messages.map(renderMessage)}
        {renderTypingIndicator()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => onInputMessageChange && onInputMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => onTextareaFocus && onTextareaFocus()}
              placeholder={
                isNarrativeMode
                  ? locale === "ja"
                    ? "ナラティブスタイルについて質問してください..."
                    : "Ask about narrative styles..."
                  : isMusicMode
                    ? locale === "ja"
                      ? "音楽の選択について質問してください..."
                      : "Ask about music selection..."
                    : isProductionMode
                      ? locale === "ja"
                        ? "動画制作について質問してください..."
                        : "Ask about video production..."
                      : t.chatPlaceholder || "Ask Zara about video production..."
              }
              disabled={!isConnected || isSubmitting || isAgentTyping || typingMessages.size > 0}
              className="scrollbar-hidden w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
              rows={1}
              style={{
                minHeight: "40px",
                maxHeight: "120px",
                resize: "none",
              }}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={
              !inputMessage.trim() ||
              !isConnected ||
              isSubmitting ||
              isAgentTyping ||
              typingMessages.size > 0
            }
            className="px-4 py-2 min-w-[80px] bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : "Send"}
          </Button>
        </form>

        {/* User typing indicator */}
        {userTyping && <div className="mt-1 text-xs text-gray-400">You are typing...</div>}
      </div>
    </div>
  );
};

export default VideoProducerChatContainer;