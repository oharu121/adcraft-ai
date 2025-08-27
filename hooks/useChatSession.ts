'use client';

import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSessionState {
  sessionId?: string;
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
  originalPrompt?: string;
  refinedPrompt?: string;
}

export interface ChatSessionActions {
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  setOriginalPrompt: (prompt: string) => void;
  retryLastMessage: () => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
}

export interface UseChatSessionOptions {
  sessionId?: string;
  onPromptRefined?: (originalPrompt: string, refinedPrompt: string) => void;
  onError?: (error: string) => void;
  maxMessages?: number;
}

/**
 * Custom hook for managing chat session state and actions
 * Handles conversation flow for prompt refinement with the AI
 */
export function useChatSession(options: UseChatSessionOptions = {}): [
  ChatSessionState,
  ChatSessionActions
] {
  const {
    sessionId: initialSessionId,
    onPromptRefined,
    onError,
    maxMessages = 50,
  } = options;

  const [state, setState] = useState<ChatSessionState>({
    sessionId: initialSessionId,
    messages: [],
    isLoading: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');

  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      ...message,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages.slice(-(maxMessages - 1)), newMessage],
    }));

    return newMessage.id;
  }, [generateMessageId, maxMessages]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || state.isLoading) {
      return;
    }

    const trimmedMessage = message.trim();
    lastUserMessageRef.current = trimmedMessage;

    // Add user message
    addMessage({
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    });

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: undefined,
    }));

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: state.sessionId || 'default-session',
          message: trimmedMessage,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to send message');
      }

      const data = await response.json();
      
      // Add assistant response
      addMessage({
        role: 'assistant',
        content: data.data.response,
        timestamp: new Date(),
      });

      // Handle prompt refinement if provided
      if (data.data.refinedPrompt && state.originalPrompt) {
        setState(prev => ({
          ...prev,
          refinedPrompt: data.data.refinedPrompt,
        }));
        
        onPromptRefined?.(state.originalPrompt, data.data.refinedPrompt);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
      }));

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Add error message to chat
      addMessage({
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      });

      onError?.(errorMessage);
    }
  }, [state.isLoading, state.sessionId, state.originalPrompt, addMessage, onPromptRefined, onError]);

  const clearChat = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      messages: [],
      isLoading: false,
      error: undefined,
      refinedPrompt: undefined,
    }));

    lastUserMessageRef.current = '';
  }, []);

  const setOriginalPrompt = useCallback((prompt: string) => {
    setState(prev => ({
      ...prev,
      originalPrompt: prompt,
    }));
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current || state.isLoading) {
      return;
    }

    // Remove the last assistant message if it was an error
    if (state.messages.length > 0 && state.messages[state.messages.length - 1].role === 'assistant') {
      setState(prev => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
      }));
    }

    await sendMessage(lastUserMessageRef.current);
  }, [state.isLoading, state.messages, sendMessage]);

  const regenerateResponse = useCallback(async (messageId: string) => {
    const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1 || state.messages[messageIndex].role !== 'assistant') {
      return;
    }

    // Find the corresponding user message
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && state.messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }

    if (userMessageIndex === -1) {
      return;
    }

    const userMessage = state.messages[userMessageIndex].content;

    // Remove the assistant message we're regenerating
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId),
    }));

    // Resend the user message to get a new response
    await sendMessage(userMessage);
  }, [state.messages, sendMessage]);

  const actions: ChatSessionActions = {
    sendMessage,
    clearChat,
    setOriginalPrompt,
    retryLastMessage,
    regenerateResponse,
  };

  return [state, actions];
}

/**
 * Hook for quick prompt suggestions and tips
 */
export function usePromptSuggestions() {
  const [suggestions] = useState<string[]>([
    'Make the lighting more cinematic with golden hour colors',
    'Add slow-motion effects to emphasize movement',
    'Include more specific camera angles like close-ups or wide shots',
    'Describe the mood and atmosphere in more detail',
    'Add environmental details like weather or time of day',
    'Specify the visual style (realistic, artistic, documentary)',
    'Include color palette preferences',
    'Add more motion and dynamic elements',
  ]);

  const getRandomSuggestions = useCallback((count: number = 3) => {
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, [suggestions]);

  const getSuggestionForPrompt = useCallback((prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (!lowerPrompt.includes('camera') && !lowerPrompt.includes('shot')) {
      return 'Try adding specific camera angles like "close-up", "wide shot", or "overhead view"';
    }
    
    if (!lowerPrompt.includes('light') && !lowerPrompt.includes('sun')) {
      return 'Consider describing the lighting: "golden hour", "soft light", or "dramatic shadows"';
    }
    
    if (!lowerPrompt.includes('motion') && !lowerPrompt.includes('moving')) {
      return 'Add movement descriptions: "slow-motion", "flowing", or "gentle movement"';
    }
    
    if (!lowerPrompt.includes('color')) {
      return 'Specify colors or mood: "warm tones", "vibrant colors", or "muted palette"';
    }

    // Default suggestion
    return getRandomSuggestions(1)[0];
  }, [getRandomSuggestions]);

  return {
    suggestions,
    getRandomSuggestions,
    getSuggestionForPrompt,
  };
}