/**
 * Product Intelligence Agent - Main API Route (Simplified)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GeminiVisionService } from '@/lib/services/product-intelligence/gemini-vision';
import { GeminiChatService } from '@/lib/services/product-intelligence/gemini-chat';
import { AppModeConfig } from '@/lib/config/app-mode';
import { TopicStatus } from '@/types/product-intelligence/enums';

// Locale-specific response constants
const LOCALE_MESSAGES = {
  en: {
    productNameRequired: 'Product name is required for generating realistic commercial strategies.',
    analysisComplete: 'I\'ve analyzed your product description: "{description}"\n\nAsk me anything about target audience, positioning, or marketing strategy!',
    imageAnalysisComplete: 'Product image analysis complete! You can now view detailed product insights, target audience analysis, and marketing strategies. Feel free to ask me any questions!',
    imageUploadError: 'There\'s an issue processing the image data. Please try uploading the image again.',
    aiServiceError: 'The AI analysis service is temporarily experiencing issues.',
    systemError: 'A system error occurred.',
    analysisFailedMessage: 'Sorry, {error}\n\nYour options:\n• Switch to demo mode to experience the full workflow\n• Wait a moment and retry\n• Try text-based analysis instead\n\nNote: You cannot proceed to the next agent without a successful analysis.',
    chatFallback: 'There was an issue with AI processing, but I can still help. What would you like to explore about your product?',
    handoffMessage: 'Analysis complete. Handing off to Creative Director Agent.',
    demoAnalysisComplete: 'Product analysis complete! I\'ve generated comprehensive market insights and commercial strategy for premium wireless headphones. The target audience is professionals aged 25-45 who value premium quality. Let\'s discuss your product strategy!',
    chatFallbackGeneric: 'That\'s a great question! Based on the product analysis, I can provide detailed insights about target audience, positioning, competitive advantages, and visual strategy. Which area would you like to explore further?',
    chatFallbackFollowUps: ['Target audience insights', 'Positioning strategy', 'Visual concepts', 'Proceed to Creative Director'],
    demoProduct: {
      name: 'Premium Wireless Headphones',
      description: 'Professional wireless headphones featuring premium sound quality, long battery life, and exceptional comfort',
      keyFeatures: ['Active Noise Cancellation', '30-hour Battery', 'Premium Sound', 'Comfortable Fit'],
      usageContext: ['professional work', 'music enjoyment', 'commuting', 'focused tasks'],
      positioning: {
        primaryBenefit: 'Perfect audio experience for professionals',
        supportingBenefits: ['All-day comfort', 'Superior noise cancellation', 'Extended battery life'],
        differentiators: ['Professional-grade sound', 'Ergonomic design', 'Premium materials']
      },
      commercialStrategy: {
        headline: 'Premium Sound for Professionals',
        tagline: 'Quality, Comfort, Performance',
        supportingMessages: ['All-day comfort', 'Supreme quality', 'Professional grade'],
        emotionalTrigger: 'Professional achievement and success',
        confidenceTrigger: 'Confidence in quality choice',
        callToAction: 'Experience Now',
        secondaryActions: ['Learn More', 'Compare Models'],
        narrative: 'Reliable tool empowering professional success',
        conflict: 'Cannot afford failure in crucial moments',
        resolution: 'Peace of mind with superior performance'
      }
    },
    demoChat: {
      targetAudienceResponse: "Based on my analysis, your primary target audience is professionals aged 25-45 with premium income levels. They're tech-savvy, quality-focused individuals who value productivity and premium audio experiences. They typically work in urban environments and are willing to invest in tools that enhance their professional performance. Would you like me to dive deeper into their specific behaviors and preferences?",
      targetAudienceFollowUps: ["Tell me about their shopping habits", "What motivates them to buy?", "How do they make purchasing decisions?"],
      positioningResponse: "Your positioning should focus on 'Premium Audio for Professionals' - emphasizing superior sound quality, all-day comfort, and reliability for critical work situations. Key differentiators include the 30-hour battery life, advanced noise cancellation, and premium materials. You're positioned as a challenger in the premium segment, competing on professional-grade quality rather than consumer lifestyle features.",
      positioningFollowUps: ["What's our competitive advantage?", "How do we stand out?", "What's our value proposition?"],
      creativeResponse: "Perfect! Based on the analysis, I recommend a modern professional visual style with a sophisticated color palette of deep navy, silver gray, and electric blue accents. The mood should be confident and sophisticated, with clean minimal composition and natural lighting in professional workspace settings. Ready to hand off to our Creative Director Agent to develop the actual commercial concept?",
      creativeFollowUps: ["Yes, let's proceed to creative", "Tell me more about the visual style", "What kind of commercial works best?"],
      priceResponse: "Given the premium positioning and target audience of professionals willing to invest in quality tools, this product should be priced in the premium tier - likely $200-350 range. The target customers prioritize quality over price and view this as a professional investment rather than a consumer purchase. They're research-driven buyers who focus on value and long-term benefits.",
      priceFollowUps: ["What justifies the premium price?", "How price-sensitive are they?", "What's the sweet spot?"]
    }
  },
  ja: {
    productNameRequired: '商品名は必須です。リアルなCM戦略生成のために必要です。',
    analysisComplete: '商品の説明を分析しました：「{description}」\n\nターゲット層、ポジショニング、マーケティング戦略について何でもお聞きください！',
    imageAnalysisComplete: '商品画像の分析が完了しました！詳細な商品情報、ターゲット層、マーケティング戦略を確認できます。何かご質問があればお気軽にお聞きください！',
    imageUploadError: '画像データの処理に問題があります。画像を再度アップロードしてお試しください。',
    aiServiceError: 'AI分析サービスに一時的な問題が発生しています。',
    systemError: 'システムエラーが発生しました。',
    analysisFailedMessage: '申し訳ございません。{error}\n\n以下のオプションがあります：\n• デモモードに切り替えて体験する\n• しばらく待ってから再試行する\n• テキスト説明での分析を試す\n\n注意：現在の分析結果なしに次のエージェントには進めません。',
    chatFallback: 'AI分析に問題が発生しましたが、引き続きサポートします。どのような点について詳しく知りたいですか？',
    handoffMessage: '分析が完了しました。Creative Directorエージェントに引き継ぎます。',
    demoAnalysisComplete: '商品分析が完了しました！高品質なワイヤレスヘッドフォンの詳細な市場分析と商用戦略を生成しました。ターゲット層は25-45歳のプロフェッショナルで、プレミアム品質を重視する方々です。商品戦略について何でもご相談ください！',
    chatFallbackGeneric: 'とても興味深い質問ですね！商品の分析結果を基に、ターゲット層、ポジショニング、競合優位性、ビジュアル戦略について詳しくご相談できます。どの分野について詳しく知りたいですか？',
    chatFallbackFollowUps: ['ターゲット層について', 'ポジショニング戦略', 'ビジュアルコンセプト', 'Creative Directorへ進む'],
    demoProduct: {
      name: 'プレミアム ワイヤレス ヘッドフォン',
      description: '高品質なサウンド、長時間バッテリー、快適な装着感を実現したプロフェッショナル向けワイヤレスヘッドフォン',
      keyFeatures: ['アクティブノイズキャンセリング', '30時間バッテリー', 'プレミアムサウンド', '快適フィット'],
      usageContext: ['プロフェッショナル作業', '音楽鑑賞', '通勤・移動', '集中作業'],
      positioning: {
        primaryBenefit: 'プロフェッショナルのための完璧なオーディオ体験',
        supportingBenefits: ['一日中快適な装着感', '卓越したノイズキャンセリング', '長時間バッテリー'],
        differentiators: ['プロ仕様のサウンド品質', '人間工学デザイン', 'プレミアム素材']
      },
      commercialStrategy: {
        headline: 'プロフェッショナルのためのプレミアムサウンド',
        tagline: '品質、快適性、パフォーマンス',
        supportingMessages: ['一日中快適', '最高音質', 'プロ仕様'],
        emotionalTrigger: 'プロフェッショナルとしての達成感',
        confidenceTrigger: '品質への自信',
        callToAction: '今すぐ体験',
        secondaryActions: ['詳細を見る', '比較する'],
        narrative: 'プロフェッショナルの成功を支える信頼できるツール',
        conflict: '重要な場面で失敗できない',
        resolution: '最高品質で安心のパフォーマンス'
      }
    },
    demoChat: {
      targetAudienceResponse: "分析結果によると、主要ターゲット層は25-45歳のプロフェッショナルで、プレミアム収入層の方々です。テクノロジーに精通し、品質を重視する方で、生産性とプレミアムなオーディオ体験を大切にしています。都市部で働き、仕事のパフォーマンスを向上させるツールに投資することを惜しまない方々です。具体的な行動パターンや好みについて詳しく知りたいですか？",
      targetAudienceFollowUps: ["購買行動について教えて", "何が購入動機になる？", "どのように購入を決める？"],
      positioningResponse: "ポジショニングは「プロフェッショナルのためのプレミアムオーディオ」に焦点を当て、優れた音質、一日中の快適さ、重要な仕事での信頼性を強調すべきです。主要な差別化要因は30時間のバッテリー寿命、高度なノイズキャンセリング、プレミアム素材です。プレミアムセグメントでチャレンジャーとしてポジショニングし、コンシューマー向けライフスタイル機能ではなく、プロフェッショナル向け品質で競争します。",
      positioningFollowUps: ["競合優位性は何？", "どのように差別化する？", "価値提案は何？"],
      creativeResponse: "素晴らしい！分析に基づき、深いネイビー、シルバーグレー、エレクトリックブルーのアクセントを使った洗練されたカラーパレットで、モダンプロフェッショナルなビジュアルスタイルをお勧めします。ムードは自信に満ち洗練されており、クリーンでミニマルな構成と、プロフェッショナルなワークスペース設定での自然光照明が良いでしょう。実際のコマーシャルコンセプトを開発するために、Creative Directorエージェントに引き継ぐ準備はできていますか？",
      creativeFollowUps: ["はい、クリエイティブに進みましょう", "ビジュアルスタイルについてもっと教えて", "どんなコマーシャルが最適？"],
      priceResponse: "プレミアムポジショニングと品質ツールに投資を惜しまないプロフェッショナルというターゲット層を考慮すると、この商品はプレミアム価格帯（おそらく200-350ドル範囲）で価格設定すべきです。ターゲット顧客は価格よりも品質を優先し、これをコンシューマー購入ではなく専門的投資として捉えています。彼らは研究主導の購入者で、価値と長期的メリットに焦点を当てます。",
      priceFollowUps: ["プレミアム価格の根拠は？", "価格感度はどの程度？", "最適価格帯は？"]
    }
  }
} as const;

// Simple request interface for now
interface SimpleRequest {
  sessionId: string;
  action: 'analyze' | 'chat' | 'handoff';
  message?: string;
  productName?: string; // Optional product name for better commercial generation
  locale?: 'en' | 'ja';
  appMode?: 'demo' | 'real'; // Client-sent mode override
  metadata?: any;
}

/**
 * Handle POST requests to the Product Intelligence Agent
 */
export async function POST(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const timestamp = new Date().toISOString();

  try {
    // Parse request body
    const body: SimpleRequest = await request.json();
    console.log('Received request:', body);

    // Basic validation
    if (!body.sessionId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required',
          userMessage: 'Session ID is required'
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    if (!body.action) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Action is required',
          userMessage: 'Action is required'
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    // Validate product name for analyze actions
    if (body.action === 'analyze' && !body.productName?.trim()) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product name is required for analysis',
          userMessage: LOCALE_MESSAGES[body.locale || 'en'].productNameRequired
        },
        timestamp,
        requestId
      }, { status: 400 });
    }

    // Route to appropriate handler
    let response;
    
    switch (body.action) {
      case 'analyze':
        response = await handleAnalyzeRequest(body);
        break;
      case 'chat':
        response = await handleChatRequest(body);
        break;
      case 'handoff':
        response = await handleHandoffRequest(body);
        break;
      default:
        throw new Error('Invalid action type');
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp,
      requestId
    });

  } catch (error) {
    console.error('Product Intelligence Agent API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'An internal error occurred. Please try again.'
      },
      timestamp,
      requestId
    }, { status: 500 });
  }
}

/**
 * Handle image analysis requests
 */
async function handleAnalyzeRequest(request: SimpleRequest) {
  const { sessionId, locale = 'en', appMode } = request;
  const startTime = Date.now();
  
  try {
    // Use client-sent mode if available, otherwise fallback to server config
    const isDemoMode = appMode === 'demo' || (!appMode && AppModeConfig.isDemoMode);
    
    if (isDemoMode) {
      // Use the updated GeminiVisionService for demo mode with key scenes
      const geminiVision = GeminiVisionService.getInstance();
      
      const visionRequest = {
        sessionId,
        locale: locale as "en" | "ja",
        productName: request.productName,
        imageData: request.metadata?.imageData || "",
        analysisOptions: {
          detailLevel: "comprehensive" as const,
          includeTargetAudience: true,
          includePositioning: true,
          includeVisualPreferences: true
        }
      };
      
      const visionResult = await geminiVision.analyzeProductImage(visionRequest, { forceMode: "demo" });
      
      return {
        analysis: visionResult.analysis,
        agentResponse: LOCALE_MESSAGES[locale].analysisComplete.replace(
          '{description}', 
          visionResult.analysis.product.description.substring(0, 50) + '...'
        ),
        processingTime: visionResult.processingTime,
        cost: {
          current: visionResult.cost,
          total: visionResult.cost,
          breakdown: {
            imageAnalysis: visionResult.cost,
            chatInteractions: 0
          },
          remaining: 299.68,
          budgetAlert: false
        },
        confidence: visionResult.confidence,
        nextAction: 'chat_ready',
        canProceed: true,
        warnings: visionResult.warnings || []
      };
    }

    // Real mode - determine if this is image or text analysis
    const inputType = request.metadata?.inputType || 'image';
    const description = request.message || '';
    
    console.log(`[REAL MODE] Processing ${inputType} analysis for session: ${sessionId}`);
    
    let analysisResult;
    let cost: number;
    let agentResponse: string;
    
    if (inputType === 'text') {
      // For text analysis, create a simple structured response
      cost = 0.15;
      agentResponse = LOCALE_MESSAGES[locale].analysisComplete.replace('{description}', description.substring(0, 50) + (description.length > 50 ? '...' : ''));
    } else {
      // For image analysis, use real Gemini Vision API
      const geminiVision = GeminiVisionService.getInstance();
      
      // Get base64 image data from request metadata
      const imageData = request.metadata?.imageData;
      
      if (!imageData) {
        throw new Error('No image data provided for analysis');
      }
      
      console.log(`Analyzing image with Gemini Vision (base64 data length: ${imageData.length})`);
      
      analysisResult = await geminiVision.analyzeProductImage({
        sessionId,
        imageData, // Use base64 data instead of URL
        description,
        productName: request.productName, // Include product name if provided
        locale,
        analysisOptions: {
          detailLevel: 'detailed',
          includeTargetAudience: true,
          includePositioning: true,
          includeVisualPreferences: true
        }
      }, { forceMode: appMode });
      
      cost = analysisResult.cost;
      agentResponse = LOCALE_MESSAGES[locale].imageAnalysisComplete;
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      sessionId: request.sessionId,
      nextAction: 'continue_chat',
      cost: {
        current: cost,
        total: cost,
        remaining: 300 - cost
      },
      processingTime: Math.round(processingTime),
      agentResponse,
      ...(analysisResult && { analysis: analysisResult.analysis })
    };
    
  } catch (error) {
    console.error(`Analysis failed for session ${sessionId}:`, error);
    
    // Determine error type for user-friendly messaging
    let errorType = 'unknown';
    let userErrorMessage = '';
    
    if (error instanceof Error && (error.message.includes('No image data provided') || error.message.includes('base64'))) {
      errorType = 'image_upload';
      userErrorMessage = LOCALE_MESSAGES[locale].imageUploadError;
    } else if (error instanceof Error && (error.message.includes('Vertex AI') || error.message.includes('Gemini'))) {
      errorType = 'ai_service';
      userErrorMessage = LOCALE_MESSAGES[locale].aiServiceError;
    } else {
      errorType = 'system';
      userErrorMessage = LOCALE_MESSAGES[locale].systemError;
    }
    
    const cost = 0.01;
    const agentResponse = LOCALE_MESSAGES[locale].analysisFailedMessage.replace('{error}', userErrorMessage);
    
    return {
      sessionId: request.sessionId,
      nextAction: 'error_recovery', // Special status to prevent progression
      cost: {
        current: cost,
        total: cost,
        remaining: 300 - cost
      },
      processingTime: Math.round(Date.now() - startTime),
      agentResponse,
      errorType,
      warnings: [`Real AI analysis failed: ${errorType}`],
      canProceed: false // Explicitly block progression
    };
  }
}


/**
 * Handle chat conversation requests
 */
async function handleChatRequest(request: SimpleRequest) {
  const { sessionId, message, locale = 'en', appMode } = request;
  
  if (!message) {
    throw new Error('Message is required for chat requests');
  }

  try {
    // Use client-sent mode if available, otherwise fallback to server config
    const isDemoMode = appMode === 'demo' || (!appMode && AppModeConfig.isDemoMode);
    
    if (isDemoMode) {
      return await handleDemoChat(request);
    }

    console.log(`[REAL MODE] Processing chat for session: ${sessionId}`);
    
    const geminiChat = GeminiChatService.getInstance();
    
    // Build context from session (in a real app, this would come from database)
    const chatContext = {
      productAnalysis: request.metadata?.productAnalysis || null,
      conversationHistory: request.metadata?.conversationHistory || [],
      conversationContext: {
        topics: {
          productFeatures: TopicStatus.PENDING,
          targetAudience: TopicStatus.PENDING,
          brandPositioning: TopicStatus.PENDING,
          visualPreferences: TopicStatus.PENDING
        },
        userIntent: '',
        keyInsights: [],
        uncertainties: [],
        followUpQuestions: [],
        completionScore: 0.0
      },
      userPreferences: {}
    };

    // Process message with Gemini Chat
    const chatResponse = await geminiChat.processMessage({
      sessionId,
      message,
      locale,
      context: chatContext
    }, { forceMode: appMode });
    
    return {
      sessionId: request.sessionId,
      nextAction: chatResponse.nextAction === 'handoff' ? 'ready_for_handoff' : 'continue_chat',
      cost: {
        current: chatResponse.cost,
        total: 0.30 + chatResponse.cost,
        remaining: 300 - (0.30 + chatResponse.cost)
      },
      processingTime: chatResponse.processingTime,
      agentResponse: chatResponse.response,
      suggestedFollowUps: chatResponse.suggestedFollowUps
    };
    
  } catch (error) {
    console.error(`Chat failed for session ${sessionId}:`, error);
    
    // Fallback to basic response if AI fails
    const cost = 0.01;
    const agentResponse = LOCALE_MESSAGES[locale].chatFallback;
    
    return {
      sessionId: request.sessionId,
      nextAction: 'continue_chat',
      cost: {
        current: cost,
        total: 0.31,
        remaining: 299.69
      },
      processingTime: 1000,
      agentResponse,
      warnings: ['AI chat temporarily unavailable']
    };
  }
}

/**
 * Handle demo mode chat - scripted, contextual responses
 */
async function handleDemoChat(request: SimpleRequest) {
  const { sessionId, message, locale = 'en' } = request;
  
  console.log(`[DEMO MODE] Processing chat for session: ${sessionId}, message: "${message}"`);
  
  // Simulate realistic thinking time (1-2 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const cost = 0.05;
  
  // Demo chat script with pattern matching
  const demoResponses = {
    en: [
      {
        triggers: [/target.*audience/i, /who.*buy/i, /customer/i, /demographic/i],
        response: LOCALE_MESSAGES.en.demoChat.targetAudienceResponse,
        followUps: LOCALE_MESSAGES.en.demoChat.targetAudienceFollowUps
      },
      {
        triggers: [/position/i, /competitor/i, /different/i, /advantage/i],
        response: LOCALE_MESSAGES.en.demoChat.positioningResponse,
        followUps: LOCALE_MESSAGES.en.demoChat.positioningFollowUps
      },
      {
        triggers: [/creative/i, /video/i, /commercial/i, /visual/i, /style/i],
        response: LOCALE_MESSAGES.en.demoChat.creativeResponse,
        followUps: LOCALE_MESSAGES.en.demoChat.creativeFollowUps
      },
      {
        triggers: [/price/i, /cost/i, /budget/i, /expensive/i, /cheap/i],
        response: LOCALE_MESSAGES.en.demoChat.priceResponse,
        followUps: LOCALE_MESSAGES.en.demoChat.priceFollowUps
      }
    ],
    ja: [
      {
        triggers: [/ターゲット/i, /顧客/i, /ユーザー/i, /年齢層/i],
        response: LOCALE_MESSAGES.ja.demoChat.targetAudienceResponse,
        followUps: LOCALE_MESSAGES.ja.demoChat.targetAudienceFollowUps
      },
      {
        triggers: [/ポジション/i, /競合/i, /違い/i, /優位/i],
        response: LOCALE_MESSAGES.ja.demoChat.positioningResponse,
        followUps: LOCALE_MESSAGES.ja.demoChat.positioningFollowUps
      },
      {
        triggers: [/クリエイティブ/i, /動画/i, /コマーシャル/i, /ビジュアル/i, /スタイル/i],
        response: LOCALE_MESSAGES.ja.demoChat.creativeResponse,
        followUps: LOCALE_MESSAGES.ja.demoChat.creativeFollowUps
      },
      {
        triggers: [/価格/i, /値段/i, /コスト/i, /予算/i, /高い/i, /安い/i],
        response: LOCALE_MESSAGES.ja.demoChat.priceResponse,
        followUps: LOCALE_MESSAGES.ja.demoChat.priceFollowUps
      }
    ]
  };
  
  // Find matching response based on user message
  const responses = demoResponses[locale];
  let selectedResponse = null;
  
  for (const responseOption of responses) {
    if (message && responseOption.triggers.some(trigger => trigger.test(message))) {
      selectedResponse = responseOption;
      break;
    }
  }
  
  // Default response if no pattern matches
  if (!selectedResponse) {
    selectedResponse = {
      response: LOCALE_MESSAGES[locale].chatFallbackGeneric,
      followUps: LOCALE_MESSAGES[locale].chatFallbackFollowUps
    };
  }
  
  const processingTime = 1500 + Math.random() * 500; // 1.5-2 seconds
  
  return {
    sessionId: request.sessionId,
    nextAction: message && /creative|director|proceed|進む|引き継/i.test(message) ? 'ready_for_handoff' : 'continue_chat',
    cost: {
      current: cost,
      total: 0.30 + cost,
      remaining: 300 - (0.30 + cost)
    },
    processingTime: Math.round(processingTime),
    agentResponse: selectedResponse.response,
    suggestedFollowUps: selectedResponse.followUps
  };
}

/**
 * Handle agent handoff requests
 */
async function handleHandoffRequest(request: SimpleRequest) {
  const { sessionId, locale = 'en' } = request;
  
  try {
    const cost = 0.01;
    const agentResponse = LOCALE_MESSAGES[locale].handoffMessage;
    
    return {
      sessionId: request.sessionId,
      nextAction: 'ready_for_handoff',
      cost: {
        current: cost,
        total: 0.31,
        remaining: 299.69
      },
      processingTime: 500,
      agentResponse
    };
    
  } catch (error) {
    console.error(`Handoff failed for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Handle GET requests for agent status
 */
export async function GET(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const timestamp = new Date().toISOString();
  
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required',
        userMessage: 'Session ID is required'
      },
      timestamp,
      requestId
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      status: 'active',
      currentAgent: 'product-intelligence',
      progress: {
        step: 1,
        totalSteps: 5,
        description: 'Analyzing product',
        percentage: 20
      },
      cost: {
        current: 0.25,
        total: 0.25,
        remaining: 299.75,
        breakdown: {
          analysis: 0.20,
          chat: 0.05
        },
        budgetAlert: false
      },
      lastActivity: new Date().toISOString(),
      health: {
        isActive: true,
        connectionStatus: 'connected',
        errorCount: 0
      }
    }
  });
}