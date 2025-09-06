/**
 * Product Intelligence Agent - Chat Container
 *
 * Main chat interface for real-time conversation with the Product Intelligence Agent,
 * including message history, typing indicators, and input controls.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ChatMessage, AgentMessage, UserMessage } from "@/types/product-intelligence";
import type { Dictionary } from "@/lib/dictionaries";
import AgentAvatar from "@/components/ui/AgentAvatar";

export interface ChatContainerProps {
  sessionId: string;
  messages: ChatMessage[];
  isConnected: boolean;
  isAgentTyping: boolean;
  onSendMessage: (message: string) => Promise<void>;
  dict: Dictionary;
  locale?: "en" | "ja";
  className?: string;
  inputMessage?: string;
  onInputMessageChange?: (message: string) => void;
  onScrollRequest?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
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
}) => {
  // inputMessage is now controlled by parent component
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [typingMessages, setTypingMessages] = useState<Set<string>>(new Set());
  const [visibleContent, setVisibleContent] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Use dictionary for localized text
  const t = dict.productIntelligence.chatContainer;

  // Auto-focus input when component mounts (chat opens)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100); // Small delay to ensure component is fully rendered

    return () => clearTimeout(timer);
  }, []);

  // Scroll when new messages arrive or agent starts thinking
  useEffect(() => {
    if (isAgentTyping) {
      // Agent is thinking - scroll chat container to show thinking indicator
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100); // Small delay to ensure thinking indicator is rendered
    }
    
    if (messages.length > 0) {
      if (!!onScrollRequest) {
        // Scroll to chat section header (keeps strategy button visible)
        onScrollRequest();
      } else {
        // Fallback: scroll to bottom of messages
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
  const startTypingEffect = useCallback((message: ChatMessage) => {
    if (message.type === "user" || message.type === "system") return;

    const messageId = message.id;
    const fullContent = message.content;

    // Clear any existing typing for this message
    const existingInterval = typingIntervalsRef.current.get(messageId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start typing effect
    setTypingMessages((prev) => new Set(prev).add(messageId));
    setVisibleContent((prev) => new Map(prev).set(messageId, ""));

    let charIndex = 0;
    const typingSpeed = 10; // 25ms per character - faster typing

    const interval = setInterval(() => {
      if (charIndex < fullContent.length) {
        setVisibleContent((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, fullContent.slice(0, charIndex + 1));
          return newMap;
        });
        charIndex++;

        // Scroll chat container every few characters during typing
        if (charIndex % 10 === 0 || fullContent[charIndex - 1] === "\n") {
          setTimeout(() => {
            // Scroll only the chat container, not the whole page
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 10);
        }
      } else {
        // Typing complete
        clearInterval(interval);
        typingIntervalsRef.current.delete(messageId);
        setTypingMessages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        setVisibleContent((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, fullContent); // Ensure full content is shown
          return newMap;
        });

        // Final scroll when typing is complete
        setTimeout(() => {
          // Scroll chat container to bottom
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
      // Small delay to let the message render first
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
        // Error handling could be improved with toast notifications
      } finally {
        setIsSubmitting(false);
      }
    },
    [inputMessage, isSubmitting, isConnected, onSendMessage]
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
  const getAvatarState = (message: ChatMessage): "idle" | "thinking" | "speaking" => {
    if (message.type !== "agent") return "idle";
    if (typingMessages.has(message.id)) return "speaking";
    return "idle";
  };

  // Render individual message
  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.type === "user";
    const isSystem = message.type === "system";
    const isTyping = typingMessages.has(message.id);
    const displayContent = isTyping ? visibleContent.get(message.id) || "" : message.content;

    return (
      <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
          {/* Avatar */}
          {!isUser && (
            <div className="flex items-center mb-1">
              <div className="mr-2">
                <AgentAvatar agent="maya" size="md" state={getAvatarState(message)} />
              </div>
              <span className="text-xs text-gray-500">Maya</span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-3 rounded-lg ${
              isUser
                ? "bg-blue-600 text-white rounded-br-sm"
                : isSystem
                  ? "bg-gray-100 text-gray-700 border border-gray-200"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">
              {displayContent}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>

            {/* Message metadata */}
            {message.metadata && (
              <div className={`mt-2 text-xs ${isUser ? "text-blue-100" : "text-gray-500"}`}>
                {message.metadata.processingTime && (
                  <span>Processed in {(message.metadata.processingTime / 1000).toFixed(1)}s</span>
                )}
                {message.metadata.cost && (
                  <span className="ml-2">Cost: ${message.metadata.cost.toFixed(3)}</span>
                )}
                {message.metadata.confidence && (
                  <span className="ml-2">
                    Confidence: {Math.round(message.metadata.confidence * 100)}%
                  </span>
                )}
              </div>
            )}
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
              <AgentAvatar agent="maya" size="md" state="thinking" />
            </div>
            <span className="text-xs text-gray-500">{t.agentTyping}</span>
          </div>

          <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render quick suggestions
  const renderSuggestions = () => {
    if (messages.length > 0) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-900 font-medium mb-2">{t.welcomeMessage}</p>
        <p className="text-blue-700 text-sm mb-3">{t.suggestionPrefix}</p>
        <div className="space-y-2">
          {t.suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onInputMessageChange && onInputMessageChange(suggestion)}
              className="block w-full text-left px-3 py-2 text-sm text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
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
            className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className={isConnected ? "text-green-600" : "text-red-600"}>
            {isConnected ? t.connected : t.disconnected}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-0 bg-white scrollbar-hidden"
      >
        {renderSuggestions()}

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
              placeholder={t.placeholder}
              disabled={!isConnected || isSubmitting}
              className="scrollbar-hidden w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
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
            disabled={!inputMessage.trim() || !isConnected || isSubmitting}
            className="px-4 py-2 min-w-[80px]"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : t.send}
          </Button>
        </form>

        {/* User typing indicator */}
        {userTyping && <div className="mt-1 text-xs text-gray-400">{t.userTyping}</div>}
      </div>
    </div>
  );
};

export default ChatContainer;
