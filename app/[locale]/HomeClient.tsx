"use client";

import { useCallback, useState, useRef } from "react";
import { Card } from "@/components/ui";
import {
  ImageUploadArea,
  ChatContainer,
  ProductAnalysisCard,
} from "@/components/product-intelligence";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { ChatMessage, ProductAnalysis, SessionState } from "@/types/product-intelligence";
import { SessionStatus } from "@/types/product-intelligence";

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
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCommercialChat, setShowCommercialChat] = useState<boolean>(false);
  const [chatInputMessage, setChatInputMessage] = useState<string>('');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

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
          setAnalysisProgress((prev) => Math.min(prev + Math.random() * 15, 90));
          setElapsedTime(Date.now() - analysisStartRef.current);
        }, 500);

        // Mock analysis request
        const analysisResponse = await fetch("/api/agents/product-intelligence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            action: "analyze",
            locale,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            },
          }),
        });

        clearInterval(progressInterval);

        if (analysisResponse.ok) {
          const result = await analysisResponse.json();

          // Complete progress
          setAnalysisProgress(100);
          setElapsedTime(Date.now() - analysisStartRef.current);

          // Add detailed analysis message instead of greeting
          const analysisMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            type: "agent",
            content:
              locale === "ja"
                ? `商品画像の分析が完了しました！\n何か調整したいことがあれば、お気軽にお聞きください！`
                : `Product analysis complete!\nFeel free to talk to me if you want to adjust anything!`,
            timestamp: Date.now(),
            agentName: "Product Intelligence Agent",
          };

          setMessages([analysisMessage]);
          setSessionStatus(SessionStatus.ACTIVE);
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
    [sessionId, locale]
  );

  // Handle text-based product description
  const handleTextSubmit = useCallback(async () => {
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
        setAnalysisProgress((prev) => Math.min(prev + Math.random() * 15, 90));
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

        // Add system message
        const systemMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          type: "system",
          content:
            result.data?.agentResponse ||
            (locale === "ja"
              ? "テキスト分析が完了しました。何でもお聞きください！"
              : "Text analysis complete. Ask me anything about your product!"),
          timestamp: Date.now(),
          agentName: "Product Intelligence Agent",
        };

        setMessages([systemMessage]);
        setSessionStatus(SessionStatus.ACTIVE);
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
  }, [sessionId, productDescription, locale]);

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
          }),
        });

        if (response.ok) {
          const result = await response.json();

          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-agent`,
            type: "agent",
            content:
              result.data?.agentResponse ||
              (locale === "ja"
                ? "ありがとうございます。詳しく教えていただけますか？"
                : "Thank you for your question. Could you tell me more?"),
            timestamp: Date.now(),
            agentName: "Product Intelligence Agent",
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
          content:
            locale === "ja"
              ? "メッセージの送信に失敗しました。もう一度お試しください。"
              : "Failed to send message. Please try again.",
          timestamp: Date.now(),
          agentName: "System",
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsAgentTyping(false);
      }
    },
    [sessionId, locale]
  );

  // Reset session
  const handleReset = useCallback(() => {
    setSessionId("");
    setSessionStatus(SessionStatus.INITIALIZING);
    setMessages([]);
    setAnalysis(null);
    setUploadedImage(null);
    setProductDescription("");
    setCurrentStep("upload");
    setIsConnected(false);
    setIsAgentTyping(false);
    setAnalysisProgress(0);
    setAnalysisStartTime(0);
    setElapsedTime(0);
    setErrorMessage("");
    setShowCommercialChat(false);
    setChatInputMessage('');
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
            {locale === "ja" ? "AI Product AdCraft" : "AI Product AdCraft"}
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-4 md:mb-6 max-w-4xl mx-auto leading-relaxed">
            {locale === "ja"
              ? "商品画像から、プロフェッショナルなコマーシャル動画を自動生成"
              : "Transform product images into professional commercial videos with AI agents"}
          </p>

          <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-12 max-w-3xl mx-auto">
            {locale === "ja"
              ? "3つの専門AIエージェントがリアルタイムで対話しながら、最適なマーケティング戦略とビジュアルコンテンツを提案・制作します"
              : "Three specialized AI agents collaborate in real-time to analyze, design, and produce your perfect marketing video"}
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
            {locale === "ja" ? "今すぐ始める" : "Get Started Now"}
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
              {locale === "ja"
                ? "プロダクト・インテリジェンス・エージェント"
                : "Product Intelligence Agent"}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-3 md:mb-4 max-w-3xl mx-auto leading-relaxed">
              {locale === "ja"
                ? "商品を分析し、ターゲット、ポジショニング、マーケティング戦略について詳しく相談できるAIエージェント"
                : "Analyze your product and chat with our AI about target audience, positioning, and marketing strategy"}
            </p>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
              {locale === "ja"
                ? "分析費用: $0.20-0.40 | チャット: $0.05/メッセージ"
                : "Analysis: $0.20-0.40 | Chat: $0.05/message"}
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
                      {locale === "ja"
                        ? "ステップ 1: 商品情報を入力"
                        : "Step 1: Enter Product Information"}
                    </h2>
                    <p className="text-gray-300 text-sm">
                      {locale === "ja"
                        ? "商品画像をアップロード、またはテキストで商品を説明してください"
                        : "Upload a product image or describe your product with text"}
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
                        {locale === "ja" ? "画像から広告へ" : "Image to Commercial"}
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
                        {locale === "ja" ? "テキストから広告へ" : "Text to Commercial"}
                      </button>
                    </div>
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
                          placeholder={
                            locale === "ja"
                              ? "商品の詳細な説明を入力してください（例：高品質なオーガニックコーヒー豆、エチオピア産、フルーティーな香り...）"
                              : "Describe your product in detail (e.g., Premium organic coffee beans from Ethiopia, fruity aroma, medium roast...)"
                          }
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
                          {locale === "ja"
                            ? "詳しく書くほど精度が上がります"
                            : "More details = better analysis"}
                        </div>
                      </div>

                      <button
                        onClick={handleTextSubmit}
                        disabled={
                          !productDescription.trim() || sessionStatus === SessionStatus.ANALYZING
                        }
                        className="cursor-pointer w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                      >
                        {sessionStatus === SessionStatus.ANALYZING ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {locale === "ja" ? "分析中..." : "Analyzing..."}
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
                            {locale === "ja" ? "分析開始" : "Start Analysis"}
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
                        ? locale === "ja"
                          ? "画像を分析中..."
                          : "Analyzing Image..."
                        : locale === "ja"
                          ? "商品を分析中..."
                          : "Analyzing Product..."}
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
                      {locale === "ja"
                        ? "AIが商品の特徴、ターゲット層、市場ポジションを分析しています"
                        : "AI is analyzing product features, target audience, and market positioning"}
                    </p>

                    {/* Error Display */}
                    {errorMessage && (
                      <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
                        <p className="text-red-300 text-sm">{errorMessage}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        >
                          {locale === "ja" ? "再試行" : "Retry"}
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
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {locale === "ja" ? "📦 プロダクト分析" : "📦 Product Analysis"}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {locale === "ja"
                          ? "AI分析に基づいた商品の洞察"
                          : "AI-powered product insights"}
                      </p>
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
                                {locale === "ja" ? "商品説明" : "Product Description"}
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

                      {/* Compact Analysis Summary */}
                      <div className="bg-gray-800/30 rounded-lg p-3">
                        <div className="space-y-3">
                          {/* Product Features */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                ✨
                              </span>
                              {locale === "ja" ? "商品特徴" : "Features"}
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {locale === "ja"
                                ? "視覚的に魅力的、高品質素材、モダンスタイル"
                                : "Visually appealing, premium materials, modern style"}
                            </p>
                          </div>

                          {/* Target & Positioning */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                🎯
                              </span>
                              {locale === "ja" ? "ターゲット・ポジション" : "Target & Position"}
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {locale === "ja"
                                ? "25-40歳都市部、品質重視、プレミアム・ミドルレンジ"
                                : "25-40 urban professionals, quality-focused, premium-mid range"}
                            </p>
                          </div>

                          {/* Marketing Approach */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                              <span className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs mr-2">
                                📈
                              </span>
                              {locale === "ja" ? "マーケティング" : "Marketing"}
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {locale === "ja"
                                ? "ライフスタイル向上、利便性、自己表現"
                                : "Lifestyle enhancement, convenience, self-expression"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

              {/* Product Analysis Card */}
              {analysis && (
                <ProductAnalysisCard
                  analysis={analysis}
                  locale={locale}
                  onRefineRequest={(topic: string, question: string) => {
                    // Handle refinement request
                    handleSendMessage(`I'd like to refine the ${topic} analysis: ${question}`);
                  }}
                />
              )}

              {/* Session Status */}
              {sessionId && (
                <Card className="p-4 bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <span className="text-sm text-gray-300">
                        {locale === "ja" ? "セッション" : "Session"}: {sessionId.slice(0, 8)}...
                      </span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {locale === "ja" ? "リセット" : "Reset"}
                    </button>
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
                            ? locale === "ja"
                              ? "💬 戦略についてチャット"
                              : "💬 Chat About Strategy"
                            : locale === "ja"
                              ? "🎬 コマーシャル戦略"
                              : "🎬 Commercial Strategy"}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {showCommercialChat
                            ? locale === "ja"
                              ? "戦略について質問や改善提案をしてください"
                              : "Ask questions or suggest improvements to the strategy"
                            : locale === "ja"
                              ? "AI分析に基づいた撮影・制作の提案"
                              : "AI-powered filming and production recommendations"}
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
                            {locale === "ja" ? "戦略表示" : "Show Strategy"}
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
                            {locale === "ja" ? "AIチャット" : "Chat with AI"}
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
                    /* Strategy View */
                    <div className="space-y-6">
                      {/* Visual Style */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm mr-3">
                            🎨
                          </span>
                          {locale === "ja" ? "ビジュアルスタイル" : "Visual Style"}
                        </h4>
                        <ul className="space-y-2 text-gray-300">
                          <li className="flex items-start">
                            <span className="text-purple-400 mr-2">•</span>
                            {locale === "ja"
                              ? "シネマティック撮影（映画的な質感）"
                              : "Cinematic filming (movie-like quality)"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-400 mr-2">•</span>
                            {locale === "ja"
                              ? "明るく鮮やかな色調"
                              : "Bright and vibrant color palette"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-400 mr-2">•</span>
                            {locale === "ja"
                              ? "クローズアップと広角の組み合わせ"
                              : "Mix of close-ups and wide shots"}
                          </li>
                        </ul>
                      </div>

                      {/* Narrative Structure */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm mr-3">
                            📝
                          </span>
                          {locale === "ja" ? "ナラティブ構造" : "Narrative Structure"}
                        </h4>
                        <ul className="space-y-2 text-gray-300">
                          <li className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            {locale === "ja"
                              ? "ライフスタイル提案型（日常への溶け込み）"
                              : "Lifestyle integration approach"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            {locale === "ja"
                              ? "感情的なストーリーテリング"
                              : "Emotional storytelling"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            {locale === "ja" ? "30秒の短編構成" : "30-second short format"}
                          </li>
                        </ul>
                      </div>

                      {/* Key Scenes */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm mr-3">
                            📍
                          </span>
                          {locale === "ja" ? "重要シーン" : "Key Scenes"}
                        </h4>
                        <ul className="space-y-2 text-gray-300">
                          <li className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            {locale === "ja"
                              ? "商品のクローズアップ（質感重視）"
                              : "Product close-up (texture focus)"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            {locale === "ja"
                              ? "ターゲット層の使用シーン"
                              : "Target audience usage scenarios"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            {locale === "ja"
                              ? "ブランドロゴ・メッセージの表示"
                              : "Brand logo and message display"}
                          </li>
                        </ul>
                      </div>

                      {/* Music & Tone */}
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                          <span className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm mr-3">
                            🎵
                          </span>
                          {locale === "ja" ? "音楽・トーン" : "Music & Tone"}
                        </h4>
                        <ul className="space-y-2 text-gray-300">
                          <li className="flex items-start">
                            <span className="text-yellow-400 mr-2">•</span>
                            {locale === "ja"
                              ? "アップビートで親しみやすい音楽"
                              : "Upbeat and approachable music"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-yellow-400 mr-2">•</span>
                            {locale === "ja"
                              ? "温かみのあるナレーション"
                              : "Warm and friendly narration"}
                          </li>
                          <li className="flex items-start">
                            <span className="text-yellow-400 mr-2">•</span>
                            {locale === "ja"
                              ? "ポジティブで希望的な雰囲気"
                              : "Positive and optimistic atmosphere"}
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Only show in Strategy View */}
                  {!showCommercialChat && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <button
                        onClick={handleReset}
                        className="cursor-pointer px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-medium hover:border-gray-500 hover:text-white transition-colors"
                      >
                        {locale === "ja" ? "やり直す" : "Start Over"}
                      </button>
                      <button
                        onClick={() => setCurrentStep("handoff")}
                        className="cursor-pointer px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200"
                      >
                        {locale === "ja"
                          ? "Creative Directorエージェントへ進む"
                          : "Proceed to Creative Director"}
                      </button>
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
                      {locale === "ja" ? "分析完了！" : "Analysis Complete!"}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {locale === "ja"
                        ? "Creative Directorエージェントに引き継いでコマーシャル制作に進みますか？"
                        : "Ready to hand off to Creative Director Agent for commercial creation?"}
                    </p>
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:scale-105 transition-transform">
                      {locale === "ja" ? "次のエージェントへ" : "Proceed to Next Agent"}
                    </button>
                  </div>
                </Card>
              )}

              {/* Instructions */}
              {currentStep === "upload" && (
                <Card className="p-6 bg-gray-800/30 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {locale === "ja" ? "使い方" : "How it works"}
                  </h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        1
                      </span>
                      <p>
                        {locale === "ja"
                          ? "商品画像をアップロードまたはテキストを入力します"
                          : "Upload your product image or type in text"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        2
                      </span>
                      <p>
                        {locale === "ja"
                          ? "AIが自動で商品を分析します"
                          : "AI automatically analyzes your product"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        3
                      </span>
                      <p>
                        {locale === "ja"
                          ? "エージェントとチャットで詳細を相談します"
                          : "Chat with the agent to refine insights"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                        4
                      </span>
                      <p>
                        {locale === "ja"
                          ? "Creative Directorエージェントへ引き継ぎます"
                          : "Hand off to Creative Director Agent"}
                      </p>
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
              alt="Product - Full Size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 rounded px-3 py-2">
              <span className="text-white text-sm font-medium">{uploadedImage.name}</span>
              <span className="text-gray-300 text-xs ml-2">Click outside to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
