"use client";

import { useCallback, useRef } from "react";
import { Card, ToastContainer } from "@/components/ui";
import { ModeToggle } from "@/components/debug/ModeIndicator";
import { AppModeConfig } from "@/lib/config/app-mode";
import { useToast } from "@/hooks/useToast";
import { useProductIntelligenceStore } from "@/lib/stores/product-intelligence-store";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { ChatMessage, ProductAnalysis } from "@/types/product-intelligence";
import { SessionStatus } from "@/types/product-intelligence";

// 🚀 Our beautiful new components!
import HeroSection from "@/components/home/HeroSection";
import ProductInputForm from "@/components/home/ProductInputForm";
import AnalysisProgressCard from "@/components/home/AnalysisProgressCard";
import ProductInsightsCard from "@/components/home/ProductInsightsCard";
import CommercialStrategyCard from "@/components/home/CommercialStrategyCard";
import InstructionsCard from "@/components/home/InstructionsCard";
import ImageModal from "@/components/home/ImageModal";

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
  // Toast system
  const { toasts, showErrorToast, hideToast } = useToast();
  
  // 🚀 ZUSTAND POWER! All state in one beautiful store
  const {
    // Session state
    sessionId, sessionStatus, isConnected, isAgentTyping,
    setSessionId, setSessionStatus, setIsConnected, setIsAgentTyping,
    
    // Product input state
    uploadedImage, productName, productDescription, inputMode,
    setUploadedImage, setProductName, setProductDescription, setInputMode,
    
    // UI flow state
    currentStep, showCommercialChat, showImageModal, showAllFeatures, showProductNameError,
    setCurrentStep, setShowCommercialChat, setShowImageModal, setShowAllFeatures, setShowProductNameError,
    
    // Analysis state
    messages, analysis, analysisProgress, analysisStartTime, elapsedTime, errorMessage, analysisError,
    setMessages, addMessage, setAnalysis, setAnalysisProgress, setAnalysisStartTime, setElapsedTime, setErrorMessage, setAnalysisError,
    
    // 🎯 THE HERO: Chat state that PERSISTS!
    chatInputMessage, setChatInputMessage,
    
    // Accordion state
    expandedSections, toggleSection,
    
    // Complex actions
    resetSession, startAnalysis, completeAnalysis
  } = useProductIntelligenceStore();

  // Ref for tracking analysis start time for progress calculation
  const analysisStartRef = useRef<number>(0);
  // Ref for text input auto-focus
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  // Ref for product name input focus
  const productNameInputRef = useRef<HTMLInputElement>(null);

  // 🚀 Zustand magic - no useCallback needed!

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
  }, [setSessionId, setIsConnected]);

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      // Validate product name is provided
      if (!productName.trim()) {
        setErrorMessage(dict.productIntelligence.productNameRequired);
        setShowProductNameError(true);
        productNameInputRef.current?.focus();
        showErrorToast(
          dict.productIntelligence.productNameRequired,
          dict.productIntelligence.validationError || "Validation Error"
        );
        return;
      }
      
      // Clear error state if validation passes
      setShowProductNameError(false);

      setUploadedImage(file);

      // 🚀 Use our beautiful startAnalysis action!
      startAnalysis();
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

        // Already handled by startAnalysis() action! 🎉

        // Start progress simulation
        const progressInterval = setInterval(() => {
          const currentProgress = useProductIntelligenceStore.getState().analysisProgress;
          setAnalysisProgress(Math.round(Math.min(currentProgress + Math.random() * 15, 90)));
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
            showErrorToast(
              dict.productIntelligence.analysisFailedDemo,
              dict.productIntelligence.analysisError
            );
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
      setShowProductNameError(true);
      productNameInputRef.current?.focus();
      showErrorToast(
        dict.productIntelligence.productNameRequired,
        dict.productIntelligence.validationError || "Validation Error"
      );
      return;
    }
    
    // Clear error state if validation passes
    setShowProductNameError(false);

    if (!productDescription.trim()) return;

    // 🚀 Use our beautiful startAnalysis action!
    startAnalysis();
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

      // Already handled by startAnalysis()! 🎉

      // Start progress simulation
      const progressInterval = setInterval(() => {
        const currentProgress = useProductIntelligenceStore.getState().analysisProgress;
        setAnalysisProgress(Math.round(Math.min(currentProgress + Math.random() * 15, 90)));
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

        // 🎉 Complete analysis with our beautiful action
        completeAnalysis();
        setElapsedTime(Date.now() - analysisStartRef.current);

        // Check if analysis had errors or limitations
        if (result.data?.canProceed === false || result.data?.nextAction === "error_recovery") {
          setAnalysisError({
            type: result.data?.errorType || "unknown",
            canProceed: false,
          });
          setSessionStatus(SessionStatus.ERROR);

          // Show error toast
          showErrorToast(
            dict.productIntelligence.analysisFailedDemo,
            dict.productIntelligence.analysisError
          );
        } else {
          setAnalysisError(null);
          // completeAnalysis() already handled this! 🚀
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
        // currentStep already set by completeAnalysis()
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

      addMessage(userMessage);
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

          addMessage(agentMessage);
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

        addMessage(errorMessage);
      } finally {
        setIsAgentTyping(false);
      }
    },
    [sessionId, locale, productName]
  );

  // 🚀 Reset session - ONE LINE with Zustand!
  const handleReset = useCallback(() => {
    resetSession();
    analysisStartRef.current = 0;
  }, [resetSession]);

  // Scroll to product intelligence section
  const scrollToProductIntelligence = useCallback(() => {
    const element = document.getElementById("product-intelligence-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Focus on product name input
  const focusProductNameInput = useCallback(() => {
    setTimeout(() => {
      productNameInputRef.current?.focus();
    }, 500); // Small delay to ensure scroll completes first
  }, []);

  return (
    <div className="min-h-screen">
      {/* 🚀 Hero Section - Now a clean server component! */}
      <HeroSection 
        dict={dict} 
        onScrollToSection={scrollToProductIntelligence}
        onFocusProductName={focusProductNameInput}
      />

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

          {/* 🚀 Main Workflow - Now beautifully organized! */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Upload & Analysis */}
            <div className="space-y-6">
              {/* Step 1: Product Input */}
              {currentStep === "upload" && (
                <ProductInputForm
                  dict={dict}
                  locale={locale}
                  onImageUpload={handleImageUpload}
                  onTextSubmit={handleTextSubmit}
                  productNameInputRef={productNameInputRef}
                  onValidationError={(message) => {
                    setShowProductNameError(true);
                    productNameInputRef.current?.focus();
                    showErrorToast(
                      message,
                      dict.productIntelligence.validationError || "Validation Error"
                    );
                  }}
                />
              )}

              {/* Step 2: Analysis Display */}
              {currentStep === "analyze" && (
                <AnalysisProgressCard dict={dict} />
              )}

              {/* 📊 Product Insights - Beautifully componentized */}
              {currentStep === "chat" && (
                <ProductInsightsCard 
                  dict={dict} 
                  onImageClick={() => setShowImageModal(true)} 
                />
              )}
            </div>

            {/* 🎨 Right Column - Now beautifully organized */}
            <div className="space-y-6">
              {/* 🎬 Step 3: Commercial Strategy - Beautifully componentized! */}
              {currentStep === "chat" && (
                <CommercialStrategyCard
                  dict={dict}
                  locale={locale}
                  onSendMessage={handleSendMessage}
                  onReset={handleReset}
                  onProceedToHandoff={() => setCurrentStep("handoff")}
                />
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

              {/* 📝 Instructions - Clean server component */}
              {currentStep === "upload" && (
                <InstructionsCard dict={dict} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🖼️ Image Modal - Clean component */}
      <ImageModal dict={dict} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={hideToast} position="top-center" />

      {/* Development Mode Toggle */}
      <ModeToggle />
    </div>
  );
}
