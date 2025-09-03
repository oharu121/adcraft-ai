"use client";

import { useCallback, useState, useRef } from "react";
import { Card } from "@/components/ui";
import { ImageUploadArea, ChatContainer } from "@/components/product-intelligence";
import { ModeIndicator, ModeToggle } from "@/components/debug/ModeIndicator";
import { AppModeConfig } from "@/lib/config/app-mode";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { ChatMessage, ProductAnalysis, SessionState } from "@/types/product-intelligence";
import { SessionStatus } from "@/types/product-intelligence";

// Utility function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Extract base64 data after the data URL prefix (data:image/jpeg;base64,)
        const base64Data = reader.result.split(",")[1];
        resolve(base64Data);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsDataURL(file);
  });
};

interface HomeClientProps {
  dict: Dictionary;
  locale: Locale;
}

export default function HomeClient({ dict, locale }: HomeClientProps) {
  // Product Intelligence Agent State
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.INITIALIZING);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<"upload" | "analyze" | "chat" | "handoff">(
    "upload"
  );
  const [inputMode, setInputMode] = useState<"image" | "text">("image");
  const [productDescription, setProductDescription] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCommercialChat, setShowCommercialChat] = useState<boolean>(false);
  const [chatInputMessage, setChatInputMessage] = useState<string>("");
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<{ type: string; canProceed: boolean } | null>(
    null
  );
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);

  // Ref for tracking analysis start time for progress calculation
  const analysisStartRef = useRef<number>(0);
  // Ref for text input auto-focus
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize session on component mount
  const initializeSession = useCallback(async () => {
    try {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      setSessionId(newSessionId);
      setIsConnected(true);
      console.log("Session initialized:", newSessionId);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      setIsConnected(false);
    }
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      // Validate product name is provided
      if (!productName.trim()) {
        setErrorMessage(dict.productIntelligence.productNameRequired);
        return;
      }

      setUploadedImage(file);

      // Reset progress and error states
      setAnalysisProgress(0);
      setElapsedTime(0);
      setErrorMessage("");
      const startTime = Date.now();
      setAnalysisStartTime(startTime);
      analysisStartRef.current = startTime;

      try {
        // Initialize session if not already done and wait for completion
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
          setSessionId(currentSessionId);
          setIsConnected(true);
        }

        setSessionStatus(SessionStatus.ANALYZING);
        setCurrentStep("analyze");

        // Start progress simulation
        const progressInterval = setInterval(() => {
          setAnalysisProgress((prev) => Math.round(Math.min(prev + Math.random() * 15, 90)));
          setElapsedTime(Date.now() - analysisStartRef.current);
        }, 500);

        // Convert image to base64
        const base64Image = await fileToBase64(file);

        // Analysis request with current mode
        const analysisResponse = await fetch("/api/agents/product-intelligence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            action: "analyze",
            locale,
            appMode: AppModeConfig.mode, // Send current mode to server
            productName: productName.trim() || undefined, // Include product name if provided
            metadata: {
              inputType: "image",
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              imageData: base64Image, // Include base64 image data
            },
          }),
        });

        clearInterval(progressInterval);

        if (analysisResponse.ok) {
          const result = await analysisResponse.json();

          // Complete progress
          setAnalysisProgress(100);
          setElapsedTime(Date.now() - analysisStartRef.current);

          // Check if analysis had errors or limitations
          if (result.data?.canProceed === false || result.data?.nextAction === "error_recovery") {
            setAnalysisError({
              type: result.data?.errorType || "unknown",
              canProceed: false,
            });
            setSessionStatus(SessionStatus.ERROR);

            // Show error toast
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 5000); // Hide after 5 seconds
          } else {
            setAnalysisError(null);
            setSessionStatus(SessionStatus.ACTIVE);
          }

          // Store analysis results (if any)
          setAnalysis(result.data?.analysis || null);

          // Add analysis message (could be success or error feedback)
          const analysisMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            type: result.data?.canProceed === false ? "system" : "agent",
            content: result.data?.agentResponse || dict.productIntelligence.productAnalysisComplete,
            timestamp: Date.now(),
            agentName: dict.agent.productIntelligenceAgent,
          };

          setMessages([analysisMessage]);
          setCurrentStep("chat");
        } else {
          throw new Error(
            `Analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}`
          );
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Analysis failed");
        setSessionStatus(SessionStatus.ERROR);
        setCurrentStep("upload"); // Reset to upload step so user can try again
      }
    },
    [sessionId, locale, productName]
  );

  // Handle text-based product description
  const handleTextSubmit = useCallback(async () => {
    // Validate product name is provided
    if (!productName.trim()) {
      setErrorMessage(dict.productIntelligence.productNameRequired);
      return;
    }

    if (!productDescription.trim()) return;

    // Reset progress and error states
    setAnalysisProgress(0);
    setElapsedTime(0);
    setErrorMessage("");
    const startTime = Date.now();
    setAnalysisStartTime(startTime);
    analysisStartRef.current = startTime;

    try {
      // Initialize session if not already done and wait for completion
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
        setSessionId(currentSessionId);
        setIsConnected(true);
      }

      setSessionStatus(SessionStatus.ANALYZING);
      setCurrentStep("analyze");

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.round(Math.min(prev + Math.random() * 15, 90)));
        setElapsedTime(Date.now() - analysisStartRef.current);
      }, 500);

      // Send text analysis request
      const analysisResponse = await fetch("/api/agents/product-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          action: "analyze",
          locale,
          appMode: AppModeConfig.mode, // Send current mode to server
          productName: productName.trim() || undefined, // Include product name if provided
          message: productDescription,
          metadata: {
            inputType: "text",
            description: productDescription,
          },
        }),
      });

      clearInterval(progressInterval);

      if (analysisResponse.ok) {
        const result = await analysisResponse.json();

        // Complete progress
        setAnalysisProgress(100);
        setElapsedTime(Date.now() - analysisStartRef.current);

        // Check if analysis had errors or limitations
        if (result.data?.canProceed === false || result.data?.nextAction === "error_recovery") {
          setAnalysisError({
            type: result.data?.errorType || "unknown",
            canProceed: false,
          });
          setSessionStatus(SessionStatus.ERROR);

          // Show error toast
          setShowErrorToast(true);
          setTimeout(() => setShowErrorToast(false), 5000); // Hide after 5 seconds
        } else {
          setAnalysisError(null);
          setSessionStatus(SessionStatus.ACTIVE);
        }

        // Store analysis results (if any)
        setAnalysis(result.data?.analysis || null);

        // Add analysis message (could be success or error feedback)
        const systemMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          type: result.data?.canProceed === false ? "system" : "agent",
          content: result.data?.agentResponse || dict.productIntelligence.textAnalysisComplete,
          timestamp: Date.now(),
          agentName: dict.agent.productIntelligenceAgent,
        };

        setMessages([systemMessage]);
        setCurrentStep("chat");
      } else {
        throw new Error(
          `Analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}`
        );
      }
    } catch (error) {
      console.error("Text analysis failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Analysis failed");
      setSessionStatus(SessionStatus.ERROR);
      setCurrentStep("upload"); // Reset to upload step so user can try again
    }
  }, [sessionId, productDescription, locale, productName]);

  // Handle sending chat messages
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!sessionId) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        type: "user",
        content: message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsAgentTyping(true);

      try {
        const response = await fetch("/api/agents/product-intelligence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            action: "chat",
            message,
            locale,
            appMode: AppModeConfig.mode, // Send current mode to server
          }),
        });

        if (response.ok) {
          const result = await response.json();

          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-agent`,
            type: "agent",
            content: result.data?.agentResponse || dict.productIntelligence.thankYouTellMore,
            timestamp: Date.now(),
            agentName: dict.agent.productIntelligenceAgent,
            metadata: {
              processingTime: result.data?.processingTime || 0,
              cost: result.data?.cost?.current || 0,
            },
          };

          setMessages((prev) => [...prev, agentMessage]);
        } else {
          throw new Error("Chat message failed");
        }
      } catch (error) {
        console.error("Failed to send message:", error);

        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          type: "system",
          content: dict.productIntelligence.failedToSendMessage,
          timestamp: Date.now(),
          agentName: dict.agent.systemAgent,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsAgentTyping(false);
      }
    },
    [sessionId, locale, productName]
  );

  // Reset session
  const handleReset = useCallback(() => {
    setSessionId("");
    setSessionStatus(SessionStatus.INITIALIZING);
    setMessages([]);
    setAnalysis(null);
    setUploadedImage(null);
    setProductDescription("");
    setProductName(""); // Reset product name
    setCurrentStep("upload");
    setIsConnected(false);
    setIsAgentTyping(false);
    setAnalysisProgress(0);
    setAnalysisStartTime(0);
    setElapsedTime(0);
    setErrorMessage("");
    setShowCommercialChat(false);
    setChatInputMessage("");
    setAnalysisError(null);
    setShowErrorToast(false);
    analysisStartRef.current = 0;
  }, []);

  // Scroll to product intelligence section
  const scrollToProductIntelligence = useCallback(() => {
    const element = document.getElementById("product-intelligence-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Floating Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          <div className="floating-orb absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          <div className="floating-orb absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Development Mode Indicator */}
          <div className="absolute top-4 right-4">
            <ModeIndicator />
          </div>

          <div className="inline-block mb-6 md:mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-8 h-8 md:w-10 md:h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 magical-text">
            {dict.productIntelligence.title}
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-4 md:mb-6 max-w-4xl mx-auto leading-relaxed">
            {dict.productIntelligence.subtitle}
          </p>

          <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-12 max-w-3xl mx-auto">
            {dict.productIntelligence.description}
          </p>

          {/* Call to Action Button */}
          <button
            onClick={scrollToProductIntelligence}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {dict.productIntelligence.getStarted}
          </button>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Product Intelligence Section */}
      <div id="product-intelligence-section" className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl relative">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 magical-text">
              {dict.productIntelligence.agentSection}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-3 md:mb-4 max-w-3xl mx-auto leading-relaxed">
              {dict.productIntelligence.agentDescription}
            </p>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
              {dict.productIntelligence.costInfo}
            </p>
          </div>

          {/* Main Workflow */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Upload & Analysis */}
            <div className="space-y-6">
              {/* Step 1: Product Input */}
              {currentStep === "upload" && (
                <Card variant="magical" glow className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {dict.productIntelligence.stepEnterInfo}
                    </h2>
                    <p className="text-gray-300 text-sm">
                      {dict.productIntelligence.stepDescription}
                    </p>
                  </div>

                  {/* Input Mode Toggle */}
                  <div className="mb-6">
                    <div className="flex rounded-lg bg-gray-800 p-1 max-w-md mx-auto">
                      <button
                        onClick={() => setInputMode("image")}
                        className={`cursor-pointer flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          inputMode === "image"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {dict.productIntelligence.uploadMethods.imageToCommercial}
                      </button>
                      <button
                        onClick={() => {
                          setInputMode("text");
                          // Auto-focus the textarea after a small delay
                          setTimeout(() => {
                            textInputRef.current?.focus();
                          }, 100);
                        }}
                        className={`cursor-pointer flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          inputMode === "text"
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        {dict.productIntelligence.uploadMethods.textToCommercial}
                      </button>
                    </div>
                  </div>

                  {/* Required Product Name Input */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-white">
                      <svg
                        className="w-4 h-4 mr-2 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {dict.productIntelligence.productName}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder={dict.productIntelligence.productNameExample}
                      className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-colors ${
                        productName.trim() === "" && sessionStatus === SessionStatus.ANALYZING
                          ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      disabled={sessionStatus === SessionStatus.ANALYZING}
                      maxLength={100}
                      required
                    />
                    {productName.trim() === "" && (
                      <p className="text-xs text-red-400 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {dict.productIntelligence.productNameRequiredShort}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {dict.productIntelligence.actualProductName}
                    </p>
                  </div>

                  {/* Image Upload Mode */}
                  {inputMode === "image" && (
                    <ImageUploadArea
                      onImageUpload={handleImageUpload}
                      isUploading={sessionStatus === SessionStatus.ANALYZING}
                      locale={locale}
                    />
                  )}

                  {/* Text Input Mode */}
                  {inputMode === "text" && (
                    <div className="space-y-4">
                      <div className="relative">
                        <textarea
                          ref={textInputRef}
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                          placeholder={dict.productIntelligence.productDescriptionExample}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none transition-colors"
                          rows={6}
                          disabled={sessionStatus === SessionStatus.ANALYZING}
                        />
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>{productDescription.length}/1000</span>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {dict.productIntelligence.moreDetails}
                        </div>
                      </div>

                      <button
                        onClick={handleTextSubmit}
                        disabled={
                          !productDescription.trim() ||
                          !productName.trim() ||
                          sessionStatus === SessionStatus.ANALYZING
                        }
                        className="cursor-pointer w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                      >
                        {sessionStatus === SessionStatus.ANALYZING ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {dict.productIntelligence.analyzing}
                          </div>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 inline mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            {dict.productIntelligence.startAnalysis}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </Card>
              )}

              {/* Step 2: Analysis Display */}
              {currentStep === "analyze" && (
                <Card variant="magical" glow className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {inputMode === "image"
                        ? dict.productIntelligence.imageAnalysis
                        : dict.productIntelligence.productAnalysis}
                    </h3>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${analysisProgress}%` }}
                      ></div>
                    </div>

                    {/* Progress Details */}
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>{analysisProgress}% complete</span>
                      <span>{(elapsedTime / 1000).toFixed(1)}s</span>
                    </div>

                    <p className="text-gray-300 text-sm">
                      {dict.productIntelligence.analysisInProgress}
                    </p>

                    {/* Error Display */}
                    {errorMessage && (
                      <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
                        <p className="text-red-300 text-sm">{errorMessage}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        >
                          {dict.productIntelligence.retry}
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Product Insights - Show when in chat mode */}
              {currentStep === "chat" &&
                (uploadedImage || (inputMode === "text" && productDescription)) && (
                  <Card variant="magical" className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {dict.productAnalysis.title}
                        </h3>
                        {sessionId && (
                          <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded border border-gray-600 font-mono">
                            #{sessionId.slice(-6)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{dict.productAnalysis.subtitle}</p>
                    </div>

                    <div className="space-y-4">
                      {/* Product Input Display */}
                      {uploadedImage ? (
                        /* Image Preview */
                        <div
                          className="relative rounded-lg overflow-hidden bg-gray-700 cursor-pointer group hover:bg-gray-600 transition-colors"
                          onClick={() => setShowImageModal(true)}
                          title="Click to enlarge"
                        >
                          <img
                            src={URL.createObjectURL(uploadedImage)}
                            alt="Product"
                            className="w-full max-h-48 object-contain bg-gray-800"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1">
                            <span className="text-white text-xs">{uploadedImage.name}</span>
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 rounded-full p-2">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        productDescription && (
                          /* Text Description Preview */
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-300 flex items-center">
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                {dict.productAnalysis.productDescription}
                              </h4>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                              {productDescription.length > 200
                                ? `${productDescription.substring(0, 200)}...`
                                : productDescription}
                            </p>
                          </div>
                        )
                      )}

                      {/* Dynamic Product Analysis */}
                      <div className="bg-gray-800/30 rounded-lg p-3 relative">
                        {/* Trust Score - Top Right */}
                        {analysis?.metadata?.confidenceScore && (
                          <div className="absolute top-3 right-3">
                            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium border border-green-500/30">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {Math.round(analysis.metadata.confidenceScore * 100)}%
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 pr-16">
                          {/* Product Name */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                ⚡
                              </span>
                              {dict.productAnalysis.productName} - {analysis?.product.name}
                            </h4>
                          </div>

                          {/* Product Summary */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                🏷️
                              </span>
                              {dict.productAnalysis.productSummary}
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {analysis?.product
                                ? analysis.product.description
                                : dict.productAnalysis.analyzingFeatures}
                            </p>
                          </div>

                          {/* Key Features */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                ✨
                              </span>
                              {dict.productAnalysis.keyFeatures}
                            </h4>
                            <div className="text-xs text-gray-400 leading-relaxed">
                              {analysis?.product?.keyFeatures ? (
                                <ul className="space-y-1">
                                  {analysis.product.keyFeatures
                                    .slice(0, 3)
                                    .map((feature, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-blue-400 mr-2 mt-0.5">•</span>
                                        {feature}
                                      </li>
                                    ))}
                                  {analysis.product.keyFeatures.length > 3 && (
                                    <li className="text-gray-500 ml-4">
                                      +{analysis.product.keyFeatures.length - 3}{" "}
                                      {dict.productAnalysis.moreFeatures}
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <span>{dict.productAnalysis.analyzingFeatures}</span>
                              )}
                            </div>
                          </div>

                          {/* Target Audience */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                🎯
                              </span>
                              {dict.productAnalysis.targetAudience}
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {analysis?.targetAudience?.primary
                                ? `${analysis.targetAudience.primary.demographics.ageRange}, ${analysis.targetAudience.primary.demographics.lifestyle?.join(", ")}`
                                : dict.productAnalysis.analyzingTargetAudience}
                            </p>
                          </div>

                          {/* Marketing */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                📈
                              </span>
                              {dict.productAnalysis.marketing}
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {analysis?.positioning?.valueProposition
                                ? analysis.positioning.valueProposition.primaryBenefit
                                : dict.productAnalysis.analyzingMarketingStrategy}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
            </div>

            {/* Right Column - Analysis Results */}
            <div className="space-y-6">
              {/* Step 3: Commercial Strategy */}
              {currentStep === "chat" && (
                <Card variant="magical" glow className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {showCommercialChat
                            ? dict.productIntelligence.chatAboutStrategyGeneric
                            : dict.productIntelligence.commercialStrategy}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {showCommercialChat
                            ? dict.productIntelligence.askQuestionsStrategy
                            : dict.productIntelligence.aiPoweredRecommendations}
                        </p>
                      </div>

                      {/* Toggle Button */}
                      <button
                        onClick={() => setShowCommercialChat(!showCommercialChat)}
                        className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                          showCommercialChat
                            ? "bg-purple-500 text-white hover:bg-purple-600"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                        }`}
                      >
                        {showCommercialChat ? (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            {dict.productIntelligence.showStrategy}
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            {dict.productIntelligence.chatWithAI}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Toggle between Strategy View and Chat */}
                  {showCommercialChat ? (
                    /* Chat Interface */
                    <div className="h-[500px]">
                      <ChatContainer
                        sessionId={sessionId}
                        messages={messages}
                        isConnected={isConnected}
                        isAgentTyping={isAgentTyping}
                        onSendMessage={handleSendMessage}
                        locale={locale}
                        className="h-full"
                        inputMessage={chatInputMessage}
                        onInputMessageChange={setChatInputMessage}
                      />
                    </div>
                  ) : (
                    /* Dynamic Strategy View */
                    <div className="space-y-6">
                      {/* Key Messages (Headline + Tagline) */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm mr-3">
                            💬
                          </span>
                          {dict.productAnalysis.keyMessages}
                        </h4>
                        <div className="space-y-3 text-gray-300">
                          {analysis?.commercialStrategy?.keyMessages ? (
                            <>
                              <div>
                                <h5 className="text-sm font-semibold text-white mb-1">
                                  {dict.productAnalysis.headline}
                                </h5>
                                <p className="text-red-400 font-medium">
                                  "{analysis.commercialStrategy.keyMessages.headline}"
                                </p>
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-white mb-1">
                                  {dict.productAnalysis.tagline}
                                </h5>
                                <p className="text-red-300">
                                  {analysis.commercialStrategy.keyMessages.tagline}
                                </p>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500">
                              {dict.productAnalysis.analyzingKeyMessages}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Visual Style */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm mr-3">
                            🎨
                          </span>
                          {dict.productAnalysis.visualStyle}
                        </h4>
                        <div className="space-y-2 text-gray-300">
                          {analysis?.visualPreferences ? (
                            <>
                              <div className="flex items-start">
                                <span className="text-purple-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">{dict.productAnalysis.style} </span>
                                  <span className="capitalize">
                                    {analysis.visualPreferences.overallStyle}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-purple-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">{dict.productAnalysis.mood} </span>
                                  <span className="capitalize">
                                    {analysis.visualPreferences.mood}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-purple-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.lighting}{" "}
                                  </span>
                                  <span className="capitalize">
                                    {analysis.visualPreferences.lighting}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500">
                              {dict.productAnalysis.analyzingVisualStyle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Narrative Structure */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm mr-3">
                            📝
                          </span>
                          {dict.productAnalysis.narrativeStructure}
                        </h4>
                        <div className="space-y-2 text-gray-300">
                          {analysis?.commercialStrategy?.storytelling ? (
                            <>
                              <div className="flex items-start">
                                <span className="text-blue-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.narrative}{" "}
                                  </span>
                                  <span>{analysis.commercialStrategy.storytelling.narrative}</span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-blue-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.conflict}{" "}
                                  </span>
                                  <span>{analysis.commercialStrategy.storytelling.conflict}</span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-blue-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.resolution}{" "}
                                  </span>
                                  <span>{analysis.commercialStrategy.storytelling.resolution}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500">
                              {dict.productAnalysis.analyzingNarrativeStructure}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Key Scenes */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm mr-3">
                            📍
                          </span>
                          {dict.productAnalysis.keyScenes}
                        </h4>
                        <div className="space-y-2 text-gray-300">
                          {analysis?.commercialStrategy?.keyScenes ? (
                            <>
                              <div className="flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.opening}{" "}
                                  </span>
                                  <span>{analysis.commercialStrategy.keyScenes.opening}</span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.showcase}{" "}
                                  </span>
                                  <span>
                                    {analysis.commercialStrategy.keyScenes.productShowcase}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.solution}{" "}
                                  </span>
                                  <span>
                                    {analysis.commercialStrategy.keyScenes.problemSolution}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.emotion}{" "}
                                  </span>
                                  <span>
                                    {analysis.commercialStrategy.keyScenes.emotionalMoment}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.callToAction}{" "}
                                  </span>
                                  <span>{analysis.commercialStrategy.keyScenes.callToAction}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500">
                              {dict.productAnalysis.analyzingKeyScenes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Music & Tone */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm mr-3">
                            🎵
                          </span>
                          {dict.productAnalysis.musicTone}
                        </h4>
                        <div className="space-y-2 text-gray-300">
                          {analysis?.visualPreferences ? (
                            <>
                              <div className="flex items-start">
                                <span className="text-yellow-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">{dict.productAnalysis.mood} </span>
                                  <span className="capitalize">
                                    {analysis.visualPreferences.mood} atmosphere
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <span className="text-yellow-400 mr-2">•</span>
                                <div>
                                  <span className="font-medium">
                                    {dict.productAnalysis.composition}{" "}
                                  </span>
                                  <span className="capitalize">
                                    {analysis.visualPreferences.composition} presentation
                                  </span>
                                </div>
                              </div>
                              {analysis.positioning?.brandPersonality && (
                                <div className="flex items-start">
                                  <span className="text-yellow-400 mr-2">•</span>
                                  <div>
                                    <span className="font-medium">
                                      {dict.productAnalysis.brandTone}{" "}
                                    </span>
                                    <span className="capitalize">
                                      {analysis.positioning.brandPersonality.tone}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500">
                              {dict.productAnalysis.analyzingMusicTone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Only show in Strategy View */}
                  {!showCommercialChat && (
                    <div className="mt-8 space-y-4">
                      {/* Error Message */}
                      {analysisError?.canProceed === false && (
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            <span>{dict.productIntelligence.cannotProceed}</span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={handleReset}
                          className="cursor-pointer px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-medium hover:border-gray-500 hover:text-white transition-colors"
                        >
                          {dict.productIntelligence.startOver}
                        </button>
                        <button
                          onClick={() => setCurrentStep("handoff")}
                          disabled={analysisError?.canProceed === false}
                          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                            analysisError?.canProceed === false
                              ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-50"
                              : "cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transform hover:scale-105"
                          }`}
                        >
                          {dict.productIntelligence.proceedToCreativeDirector}
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Handoff Preparation */}
              {currentStep === "handoff" && (
                <Card variant="magical" glow className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {dict.productIntelligence.analysisComplete}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {dict.productIntelligence.handoffToCreativeDirector}
                    </p>
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:scale-105 transition-transform">
                      {dict.productIntelligence.proceedToNextAgent}
                    </button>
                  </div>
                </Card>
              )}

              {/* Instructions */}
              {currentStep === "upload" && (
                <Card className="p-6 bg-gray-800/30 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {dict.productIntelligence.howItWorks}
                  </h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        1
                      </span>
                      <p>{dict.productIntelligence.stepInstructions1}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        2
                      </span>
                      <p>{dict.productIntelligence.stepInstructions2}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        3
                      </span>
                      <p>{dict.productIntelligence.stepInstructions3}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        4
                      </span>
                      <p>{dict.productIntelligence.stepInstructions4}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && uploadedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-4 -right-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition-colors z-10"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={URL.createObjectURL(uploadedImage)}
              alt={dict.productIntelligence.productFullSize}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 rounded px-3 py-2">
              <span className="text-white text-sm font-medium">{uploadedImage.name}</span>
              <span className="text-gray-300 text-xs ml-2">
                {dict.productIntelligence.clickOutsideToClose}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg border border-red-500 max-w-md">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <div className="font-semibold">{dict.productIntelligence.analysisError}</div>
                <div className="text-sm opacity-90">
                  {dict.productIntelligence.analysisFailedDemo}
                </div>
              </div>
              <button
                onClick={() => setShowErrorToast(false)}
                className="ml-2 text-white hover:text-red-200 transition-colors"
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
        </div>
      )}

      {/* Development Mode Toggle */}
      <ModeToggle />
    </div>
  );
}
