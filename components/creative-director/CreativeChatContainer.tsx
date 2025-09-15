/**
 * Creative Chat Container - David's Chat Interface
 *
 * Specialized chat interface for Creative Director (David) agent featuring:
 * - David's personality and visual focus
 * - Creative decision support and visual terminology
 * - Asset generation request integration
 * - Visual decision confirmation system
 * - David-specific quick actions and suggestions
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import AgentAvatar from "@/components/ui/AgentAvatar";
import type { Dictionary } from "@/lib/dictionaries";
import { CreativeChatMessage } from "@/lib/agents/creative-director/types/chat-types";

export interface CreativeChatContainerProps {
  sessionId: string;
  messages: CreativeChatMessage[];
  isConnected: boolean;
  isAgentTyping: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onVisualDecisionConfirmation?: (confirmed: boolean) => Promise<void>;
  onAssetGeneration?: (assetType: string, prompt: string) => Promise<void>;
  dict: Dictionary;
  locale?: "en" | "ja";
  className?: string;
  inputMessage?: string;
  onInputMessageChange?: (message: string) => void;
  onScrollRequest?: () => void;
  onTextareaFocus?: () => void;
}

const CreativeChatContainer: React.FC<CreativeChatContainerProps> = ({
  sessionId,
  messages,
  isConnected,
  isAgentTyping,
  onSendMessage,
  onVisualDecisionConfirmation,
  onAssetGeneration,
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
  const [isConfirmingDecision, setIsConfirmingDecision] = useState(false);
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Use dictionary for localized text
  const t = dict.creativeDirector.chat;

  // Check if we're awaiting visual decision confirmation
  const lastAgentMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.type === "agent");
  const isAwaitingDecisionConfirmation =
    lastAgentMessage && lastAgentMessage.messageType === "DIRECTION_CONFIRMATION";

  // Handle visual decision confirmation
  const handleVisualDecisionConfirmation = useCallback(
    async (confirmed: boolean) => {
      if (!onVisualDecisionConfirmation) return;

      setIsConfirmingDecision(true);
      try {
        await onVisualDecisionConfirmation(confirmed);
      } catch (error) {
        console.error("Visual decision confirmation failed:", error);
      } finally {
        setIsConfirmingDecision(false);
      }
    },
    [onVisualDecisionConfirmation]
  );

  // Handle asset generation request
  const handleAssetGeneration = useCallback(
    async (assetType: string, prompt: string) => {
      if (!onAssetGeneration) return;

      setIsGeneratingAsset(true);
      try {
        await onAssetGeneration(assetType, prompt);
      } catch (error) {
        console.error("Asset generation request failed:", error);
      } finally {
        setIsGeneratingAsset(false);
      }
    },
    [onAssetGeneration]
  );

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

  // Scroll when new messages arrive or agent starts thinking
  useEffect(() => {
    if (isAgentTyping) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }

    if (messages.length > 0) {
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
  const startTypingEffect = useCallback((message: CreativeChatMessage) => {
    if (message.type === "user") return;

    const messageId = message.id;
    const fullContent = message.content;

    const existingInterval = typingIntervalsRef.current.get(messageId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    setTypingMessages((prev) => new Set(prev).add(messageId));
    setVisibleContent((prev) => new Map(prev).set(messageId, ""));

    let charIndex = 0;
    const typingSpeed = 15; // Slightly slower for creative content

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
      lastMessage.type === "agent" &&
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

      if (
        !inputMessage.trim() ||
        isSubmitting ||
        !isConnected ||
        isAwaitingDecisionConfirmation ||
        isConfirmingDecision
      ) {
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
    [
      inputMessage,
      isSubmitting,
      isConnected,
      onSendMessage,
      isAwaitingDecisionConfirmation,
      isConfirmingDecision,
      onInputMessageChange,
    ]
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
  const getAvatarState = (
    message: CreativeChatMessage
  ): "idle" | "thinking" | "speaking" | "creating" => {
    if (message.type !== "agent") return "idle";
    if (typingMessages.has(message.id)) return "speaking";
    if (message.messageType === "ASSET_GENERATION_UPDATE") return "creating";
    return "idle";
  };

  // Render individual message
  const renderMessage = (message: CreativeChatMessage, index: number) => {
    const isUser = message.type === "user";
    const isTyping = typingMessages.has(message.id);
    const displayContent = isTyping ? visibleContent.get(message.id) || "" : message.content;
    const isLastMessage = index === messages.length - 1;

    return (
      <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
          {/* Avatar */}
          {!isUser && (
            <div className="flex items-center mb-1">
              <div className="mr-2">
                <AgentAvatar agent="david" size="md" state={getAvatarState(message)} />
              </div>
              <span className="text-xs text-gray-500">David</span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-3 rounded-lg ${
              isUser
                ? "bg-purple-600 text-white rounded-br-sm"
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">
              {displayContent}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>

            {/* Message metadata */}
            {message.processingTime && (
              <div className={`mt-2 text-xs ${isUser ? "text-purple-100" : "text-gray-500"}`}>
                {message.processingTime && (
                  <span>Processed in {(message.processingTime / 1000).toFixed(1)}s</span>
                )}
                {message.cost && (
                  <span className="ml-2">
                    Cost: $
                    {typeof message.cost === "number"
                      ? message.cost.toFixed(3)
                      : typeof message.cost === "object" &&
                          message.cost &&
                          "current" in message.cost
                        ? (message.cost as { current: number }).current.toFixed(3)
                        : message.cost}
                  </span>
                )}
                {message.confidence && (
                  <span className="ml-2">Confidence: {Math.round(message.confidence * 100)}%</span>
                )}
              </div>
            )}
          </div>

          {/* Visual Decision Confirmation Buttons */}
          {!isUser &&
            isLastMessage &&
            !isTyping &&
            message.messageType === "DIRECTION_CONFIRMATION" && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-600 mb-3">
                  {locale === "ja"
                    ? "このビジュアルディレクションを承認しますか？"
                    : "Do you approve this visual direction?"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVisualDecisionConfirmation(true)}
                    disabled={isConfirmingDecision}
                    className="cursor-pointer flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {locale === "ja" ? "はい、承認します" : "Yes, approve direction"}
                  </button>
                  <button
                    onClick={() => handleVisualDecisionConfirmation(false)}
                    disabled={isConfirmingDecision}
                    className="cursor-pointer flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                  >
                    {locale === "ja" ? "いいえ、修正要求" : "No, request changes"}
                  </button>
                </div>
              </div>
            )}

          {/* Quick Actions for David's messages */}
          {!isUser &&
            isLastMessage &&
            !isTyping &&
            message.quickActions &&
            message.messageType !== "DIRECTION_CONFIRMATION" && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 mb-2">{t.quickActionsTitle}</p>
                {message.quickActions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={() => onInputMessageChange && onInputMessageChange(action.label)}
                    className="cursor-pointer block w-full text-left px-3 py-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

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
              <AgentAvatar agent="david" size="md" state="thinking" />
            </div>
            <span className="text-xs text-gray-500">{t.agentTyping}</span>
          </div>

          <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render greeting message when no messages exist (like Maya's suggestions)
  const renderGreeting = () => {
    if (messages.length > 0) return null;

    return (
      <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center mb-2">
          <div className="mr-2">
            <AgentAvatar agent="david" size="md" state="idle" />
          </div>
          <span className="text-purple-900 font-medium text-sm">David</span>
        </div>
        <p className="text-purple-800 text-sm whitespace-pre-wrap">
          {dict.creativeDirector.chat.welcomeMessage}
        </p>
      </div>
    );
  };

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>

        {/* Connection status */}
        <div className="flex items-center text-sm">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-purple-500" : "bg-red-500"}`}
          />
          <span className={isConnected ? "text-purple-600" : "text-red-600"}>
            {isConnected ? t.connected : t.disconnected}
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
                isAwaitingDecisionConfirmation
                  ? locale === "ja"
                    ? "ビジュアル決定の承認をお待ちください..."
                    : "Awaiting visual decision confirmation..."
                  : t.placeholder
              }
              disabled={
                !isConnected ||
                isSubmitting ||
                isAgentTyping ||
                typingMessages.size > 0 ||
                isAwaitingDecisionConfirmation ||
                isConfirmingDecision
              }
              className="scrollbar-hidden w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
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
              typingMessages.size > 0 ||
              isAwaitingDecisionConfirmation ||
              isConfirmingDecision
            }
            className="px-4 py-2 min-w-[80px] bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting || isConfirmingDecision ? <LoadingSpinner size="sm" /> : t.send}
          </Button>
        </form>

        {/* User typing indicator */}
        {userTyping && <div className="mt-1 text-xs text-gray-400">{t.userTyping}</div>}
      </div>
    </div>
  );
};

export default CreativeChatContainer;
