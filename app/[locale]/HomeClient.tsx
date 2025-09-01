'use client';

import { useCallback, useState } from 'react';
import { Card } from '@/components/ui';
import { 
  ImageUploadArea,
  ChatContainer,
  ProductAnalysisCard
} from '@/components/product-intelligence';
import type { Dictionary, Locale } from '@/lib/dictionaries';
import type { 
  ChatMessage, 
  ProductAnalysis, 
  SessionState
} from '@/types/product-intelligence';
import { SessionStatus } from '@/types/product-intelligence';

interface HomeClientProps {
  dict: Dictionary;
  locale: Locale;
}

export default function HomeClient({ dict, locale }: HomeClientProps) {
  // Product Intelligence Agent State
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.INITIALIZING);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'chat' | 'handoff'>('upload');
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [productDescription, setProductDescription] = useState<string>('');

  // Initialize session on component mount
  const initializeSession = useCallback(async () => {
    try {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      setSessionId(newSessionId);
      setIsConnected(true);
      console.log('Session initialized:', newSessionId);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setIsConnected(false);
    }
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    console.log('Uploading image:', file.name);
    setUploadedImage(file);
    
    try {
      // Initialize session if not already done
      if (!sessionId) {
        await initializeSession();
      }

      setSessionStatus(SessionStatus.ANALYZING);
      setCurrentStep('analyze');

      // Mock analysis request
      const analysisResponse = await fetch('/api/agents/product-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId || `session-${Date.now()}`,
          action: 'analyze',
          locale,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }
        }),
      });

      if (analysisResponse.ok) {
        const result = await analysisResponse.json();
        console.log('Analysis result:', result);
        
        // Add system message
        const systemMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          type: 'system',
          content: result.data?.agentResponse || (locale === 'ja' 
            ? '画像分析が完了しました。何でもお聞きください！' 
            : 'Image analysis complete. Ask me anything about your product!'),
          timestamp: Date.now(),
          agentName: 'Product Intelligence Agent'
        };
        
        setMessages([systemMessage]);
        setSessionStatus(SessionStatus.ACTIVE);
        setCurrentStep('chat');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Image upload/analysis failed:', error);
      setSessionStatus(SessionStatus.ERROR);
    }
  }, [sessionId, locale, initializeSession]);

  // Handle text-based product description
  const handleTextSubmit = useCallback(async () => {
    if (!productDescription.trim()) return;
    
    console.log('Processing text description:', productDescription);
    
    try {
      // Initialize session if not already done
      if (!sessionId) {
        await initializeSession();
      }

      setSessionStatus(SessionStatus.ANALYZING);
      setCurrentStep('analyze');

      // Send text analysis request
      const analysisResponse = await fetch('/api/agents/product-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId || `session-${Date.now()}`,
          action: 'analyze',
          locale,
          message: productDescription,
          metadata: {
            inputType: 'text',
            description: productDescription
          }
        }),
      });

      if (analysisResponse.ok) {
        const result = await analysisResponse.json();
        console.log('Analysis result:', result);
        
        // Add system message
        const systemMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          type: 'system',
          content: result.data?.agentResponse || (locale === 'ja' 
            ? 'テキスト分析が完了しました。何でもお聞きください！' 
            : 'Text analysis complete. Ask me anything about your product!'),
          timestamp: Date.now(),
          agentName: 'Product Intelligence Agent'
        };
        
        setMessages([systemMessage]);
        setSessionStatus(SessionStatus.ACTIVE);
        setCurrentStep('chat');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Text analysis failed:', error);
      setSessionStatus(SessionStatus.ERROR);
    }
  }, [sessionId, productDescription, locale, initializeSession]);

  // Handle sending chat messages
  const handleSendMessage = useCallback(async (message: string) => {
    if (!sessionId) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsAgentTyping(true);

    try {
      const response = await fetch('/api/agents/product-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          action: 'chat',
          message,
          locale
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const agentMessage: ChatMessage = {
          id: `msg-${Date.now()}-agent`,
          type: 'agent',
          content: result.data?.agentResponse || (locale === 'ja' 
            ? 'ありがとうございます。詳しく教えていただけますか？'
            : 'Thank you for your question. Could you tell me more?'),
          timestamp: Date.now(),
          agentName: 'Product Intelligence Agent',
          metadata: {
            processingTime: result.data?.processingTime || 0,
            cost: result.data?.cost?.current || 0
          }
        };

        setMessages(prev => [...prev, agentMessage]);
      } else {
        throw new Error('Chat message failed');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'system',
        content: locale === 'ja' 
          ? 'メッセージの送信に失敗しました。もう一度お試しください。'
          : 'Failed to send message. Please try again.',
        timestamp: Date.now(),
        agentName: 'System'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAgentTyping(false);
    }
  }, [sessionId, locale]);

  // Reset session
  const handleReset = useCallback(() => {
    setSessionId('');
    setSessionStatus(SessionStatus.INITIALIZING);
    setMessages([]);
    setAnalysis(null);
    setUploadedImage(null);
    setProductDescription('');
    setCurrentStep('upload');
    setIsConnected(false);
    setIsAgentTyping(false);
  }, []);

  // Scroll to product intelligence section
  const scrollToProductIntelligence = useCallback(() => {
    const element = document.getElementById('product-intelligence-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
              <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 magical-text">
            {locale === 'ja' ? 'AI Product AdCraft' : 'AI Product AdCraft'}
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-4 md:mb-6 max-w-4xl mx-auto leading-relaxed">
            {locale === 'ja' 
              ? '商品画像から、プロフェッショナルなコマーシャル動画を自動生成'
              : 'Transform product images into professional commercial videos with AI agents'
            }
          </p>
          
          <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-12 max-w-3xl mx-auto">
            {locale === 'ja' 
              ? '3つの専門AIエージェントがリアルタイムで対話しながら、最適なマーケティング戦略とビジュアルコンテンツを提案・制作します'
              : 'Three specialized AI agents collaborate in real-time to analyze, design, and produce your perfect marketing video'
            }
          </p>

          {/* Call to Action Button */}
          <button
            onClick={scrollToProductIntelligence}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {locale === 'ja' ? '今すぐ始める' : 'Get Started Now'}
          </button>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
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
              {locale === 'ja' ? 'プロダクト・インテリジェンス・エージェント' : 'Product Intelligence Agent'}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-3 md:mb-4 max-w-3xl mx-auto leading-relaxed">
              {locale === 'ja' 
                ? '商品を分析し、ターゲット、ポジショニング、マーケティング戦略について詳しく相談できるAIエージェント'
                : 'Analyze your product and chat with our AI about target audience, positioning, and marketing strategy'
              }
            </p>
            <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
              {locale === 'ja' 
                ? '分析費用: $0.20-0.40 | チャット: $0.05/メッセージ'
                : 'Analysis: $0.20-0.40 | Chat: $0.05/message'
              }
            </p>
          </div>

        {/* Main Workflow */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Analysis */}
          <div className="space-y-6">
            {/* Step 1: Product Input */}
            {currentStep === 'upload' && (
              <Card variant="magical" hover glow className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {locale === 'ja' ? 'ステップ 1: 商品情報を入力' : 'Step 1: Enter Product Information'}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    {locale === 'ja' 
                      ? '商品画像をアップロード、またはテキストで商品を説明してください'
                      : 'Upload a product image or describe your product with text'
                    }
                  </p>
                </div>

                {/* Input Mode Toggle */}
                <div className="mb-6">
                  <div className="flex rounded-lg bg-gray-800 p-1 max-w-md mx-auto">
                    <button
                      onClick={() => setInputMode('image')}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        inputMode === 'image'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {locale === 'ja' ? '画像から画像' : 'Image to Image'}
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        inputMode === 'text'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {locale === 'ja' ? 'テキストから画像' : 'Text to Image'}
                    </button>
                  </div>
                </div>

                {/* Image Upload Mode */}
                {inputMode === 'image' && (
                  <ImageUploadArea
                    onImageUpload={handleImageUpload}
                    isUploading={sessionStatus === SessionStatus.ANALYZING}
                    locale={locale}
                  />
                )}

                {/* Text Input Mode */}
                {inputMode === 'text' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder={locale === 'ja' 
                          ? '商品の詳細な説明を入力してください（例：高品質なオーガニックコーヒー豆、エチオピア産、フルーティーな香り...）'
                          : 'Describe your product in detail (e.g., Premium organic coffee beans from Ethiopia, fruity aroma, medium roast...)'
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none transition-colors"
                        rows={6}
                        disabled={sessionStatus === SessionStatus.ANALYZING}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>{productDescription.length}/1000</span>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {locale === 'ja' ? '詳しく書くほど精度が上がります' : 'More details = better analysis'}
                      </div>
                    </div>

                    <button
                      onClick={handleTextSubmit}
                      disabled={!productDescription.trim() || sessionStatus === SessionStatus.ANALYZING}
                      className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                    >
                      {sessionStatus === SessionStatus.ANALYZING ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {locale === 'ja' ? '分析中...' : 'Analyzing...'}
                        </div>
                      ) : (
                        <>
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {locale === 'ja' ? '分析開始' : 'Start Analysis'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </Card>
            )}

            {/* Step 2: Analysis Display */}
            {currentStep === 'analyze' && (
              <Card variant="magical" glow className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {locale === 'ja' ? '画像を分析中...' : 'Analyzing Image...'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {locale === 'ja' 
                      ? 'AIが商品の特徴、ターゲット層、市場ポジションを分析しています'
                      : 'AI is analyzing product features, target audience, and market positioning'
                    }
                  </p>
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
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-300">
                      {locale === 'ja' ? 'セッション' : 'Session'}: {sessionId.slice(0, 8)}...
                    </span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {locale === 'ja' ? 'リセット' : 'Reset'}
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Chat Interface */}
          <div className="space-y-6">
            {/* Step 3: Chat Interface */}
            {currentStep === 'chat' && (
              <Card variant="magical" hover glow className="h-[600px]">
                <ChatContainer
                  sessionId={sessionId}
                  messages={messages}
                  isConnected={isConnected}
                  isAgentTyping={isAgentTyping}
                  onSendMessage={handleSendMessage}
                  locale={locale}
                  className="h-full"
                />
              </Card>
            )}

            {/* Handoff Preparation */}
            {currentStep === 'handoff' && (
              <Card variant="magical" glow className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {locale === 'ja' ? '分析完了！' : 'Analysis Complete!'}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    {locale === 'ja' 
                      ? 'Creative Directorエージェントに引き継いでコマーシャル制作に進みますか？'
                      : 'Ready to hand off to Creative Director Agent for commercial creation?'
                    }
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:scale-105 transition-transform">
                    {locale === 'ja' ? '次のエージェントへ' : 'Proceed to Next Agent'}
                  </button>
                </div>
              </Card>
            )}

            {/* Instructions */}
            {currentStep === 'upload' && (
              <Card className="p-6 bg-gray-800/30 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {locale === 'ja' ? '使い方' : 'How it works'}
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">1</span>
                    <p>{locale === 'ja' ? '商品画像をアップロードします' : 'Upload your product image'}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">2</span>
                    <p>{locale === 'ja' ? 'AIが自動で商品を分析します' : 'AI automatically analyzes your product'}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">3</span>
                    <p>{locale === 'ja' ? 'エージェントとチャットで詳細を相談します' : 'Chat with the agent to refine insights'}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">4</span>
                    <p>{locale === 'ja' ? 'Creative Directorエージェントへ引き継ぎます' : 'Hand off to Creative Director Agent'}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}