/**
 * Product Intelligence Agent - Gemini Pro Chat Integration
 * 
 * Handles real-time conversations with users using Vertex AI Gemini Pro,
 * maintaining context and steering conversations toward product insights.
 */

import { VertexAIService } from '../vertex-ai';
import { ChatMessage, ConversationContext, ProductAnalysis } from '@/types/product-intelligence';

export interface ChatRequest {
  sessionId: string;
  message: string;
  locale: 'en' | 'ja';
  context: {
    productAnalysis?: ProductAnalysis;
    conversationHistory: ChatMessage[];
    conversationContext: ConversationContext;
    userPreferences?: any;
  };
}

export interface ChatResponse {
  messageId: string;
  response: string;
  processingTime: number;
  cost: number;
  confidence: number;
  nextAction: 'continue' | 'complete' | 'clarify' | 'handoff';
  suggestedFollowUps?: string[];
  topicProgress?: {
    currentTopic: string;
    completedTopics: string[];
    nextTopic?: string;
  };
}

export interface GeminiChatRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
    role: 'user' | 'model';
  }>;
  generation_config: {
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
  };
  safety_settings: Array<{
    category: string;
    threshold: string;
  }>;
}

/**
 * Gemini Pro Chat service for product intelligence conversations
 */
export class GeminiChatService {
  private static instance: GeminiChatService;
  private vertexAI: VertexAIService;
  private readonly MODEL_NAME = 'gemini-1.5-pro';
  private readonly isMockMode: boolean;

  // Cost configuration (per 1000 tokens)
  private readonly COST_CONFIG = {
    inputTokenCost: 0.000125,   // $0.000125 per 1k input tokens
    outputTokenCost: 0.000375,  // $0.000375 per 1k output tokens
  };

  private constructor() {
    this.vertexAI = VertexAIService.getInstance();
    this.isMockMode = process.env.NODE_ENV === 'development' && 
                      process.env.ENABLE_MOCK_MODE === 'true';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GeminiChatService {
    if (!GeminiChatService.instance) {
      GeminiChatService.instance = new GeminiChatService();
    }
    return GeminiChatService.instance;
  }

  /**
   * Process chat message with context-aware response
   */
  public async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      if (this.isMockMode) {
        return await this.generateMockResponse(request, startTime);
      }

      // Generate contextual conversation prompt
      const conversationPrompt = this.generateConversationPrompt(request);
      
      // Call Gemini Pro for chat response
      const geminiResponse = await this.callGeminiChat(conversationPrompt);
      
      // Parse response and determine next actions
      const responseAnalysis = this.analyzeResponse(geminiResponse.text, request);
      
      const processingTime = Date.now() - startTime;
      const cost = this.calculateCost(geminiResponse.usage);

      return {
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        response: responseAnalysis.cleanedResponse,
        processingTime,
        cost,
        confidence: responseAnalysis.confidence,
        nextAction: responseAnalysis.nextAction,
        suggestedFollowUps: responseAnalysis.suggestedFollowUps,
        topicProgress: responseAnalysis.topicProgress
      };

    } catch (error) {
      console.error('Gemini chat processing failed:', error);
      throw new Error(`Chat processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate conversation prompt with context
   */
  private generateConversationPrompt(request: ChatRequest): string {
    const locale = request.locale;
    const systemPrompt = this.getSystemPrompt(locale);
    const contextPrompt = this.buildContextPrompt(request);
    const conversationHistory = this.formatConversationHistory(request.context.conversationHistory, locale);
    
    return `${systemPrompt}

${contextPrompt}

CONVERSATION HISTORY:
${conversationHistory}

USER MESSAGE: ${request.message}

Please respond as the Product Intelligence Agent. Focus on gathering insights about the product, target audience, and positioning. If you have enough information, guide toward completion and handoff to the Creative Director Agent.`;
  }

  /**
   * Get system prompt based on locale
   */
  private getSystemPrompt(locale: 'en' | 'ja'): string {
    if (locale === 'ja') {
      return `あなたは「プロダクト・インテリジェンス・エージェント」です。AdCraft AIシステムの一部として、商品画像の分析とユーザーとの対話を通じて、商用ビデオ制作のための深い商品理解を提供します。

役割と目標:
- 商品の特徴、ターゲットオーディエンス、ブランドポジショニングについて理解を深める
- ユーザーとの自然な対話を通じて商品に関する洞察を収集する
- 十分な情報が収集できたら、クリエイティブ・ディレクター・エージェントへの引き継ぎを準備する
- 常に日本語で回答し、日本の文化的文脈を考慮する

対話スタイル:
- 友好的でプロフェッショナル
- 質問は明確で具体的に
- ユーザーの回答に基づいて深掘りする
- 商用ビデオ制作の観点から価値のある洞察を引き出す`;
    } else {
      return `You are the Product Intelligence Agent, part of the AdCraft AI system. Your role is to analyze product images and engage in conversations with users to develop deep product understanding for commercial video creation.

Your Role & Goals:
- Understand product features, target audience, and brand positioning
- Gather insights through natural conversation with users
- When sufficient information is collected, prepare for handoff to Creative Director Agent
- Provide valuable insights for commercial video production

Conversation Style:
- Friendly and professional
- Ask clear, specific questions
- Build on user responses to go deeper
- Focus on insights valuable for commercial video creation
- Keep responses concise but informative`;
    }
  }

  /**
   * Build context prompt from analysis and conversation state
   */
  private buildContextPrompt(request: ChatRequest): string {
    let contextPrompt = '';

    // Add product analysis context if available
    if (request.context.productAnalysis) {
      const analysis = request.context.productAnalysis;
      contextPrompt += `CURRENT PRODUCT ANALYSIS:
Product: ${analysis.product.name} (${analysis.product.category})
Key Features: ${analysis.product.keyFeatures.join(', ')}
Target Age: ${analysis.targetAudience.primary.demographics.ageRange}
Positioning: ${analysis.positioning.valueProposition.primaryBenefit}
Confidence: ${Math.round(analysis.metadata.confidenceScore * 100)}%

`;
    }

    // Add conversation context
    const context = request.context.conversationContext;
    const completedTopics = Object.entries(context.topics)
      .filter(([_, status]) => status === 'completed')
      .map(([topic, _]) => topic);
    
    const pendingTopics = Object.entries(context.topics)
      .filter(([_, status]) => status === 'pending')
      .map(([topic, _]) => topic);

    contextPrompt += `CONVERSATION STATUS:
Completed Topics: ${completedTopics.join(', ') || 'None'}
Pending Topics: ${pendingTopics.join(', ') || 'None'}
Key Insights So Far: ${context.keyInsights.join('; ') || 'None yet'}
Current Uncertainties: ${context.uncertainties.join('; ') || 'None'}

`;

    return contextPrompt;
  }

  /**
   * Format conversation history for context
   */
  private formatConversationHistory(messages: ChatMessage[], locale: 'en' | 'ja'): string {
    // Keep only the last 10 messages for context
    const recentMessages = messages.slice(-10);
    
    return recentMessages.map(msg => {
      const speaker = msg.type === 'user' ? (locale === 'ja' ? 'ユーザー' : 'User') : 'Agent';
      return `${speaker}: ${msg.content}`;
    }).join('\n');
  }

  /**
   * Call Gemini Pro Chat API
   */
  private async callGeminiChat(prompt: string): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const accessToken = await this.vertexAI.getAccessToken();
    const baseUrl = this.vertexAI.getBaseUrl();

    const request: GeminiChatRequest = {
      contents: [
        {
          parts: [{ text: prompt }],
          role: 'user'
        }
      ],
      generation_config: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        max_output_tokens: 1024
      },
      safety_settings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const response = await fetch(
      `${baseUrl}/publishers/google/models/${this.MODEL_NAME}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Chat API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response format from Gemini Chat API');
    }

    return {
      text: result.candidates[0].content.parts[0].text,
      usage: result.usage_metadata || { input_tokens: 800, output_tokens: 200 }
    };
  }

  /**
   * Analyze response and determine next actions
   */
  private analyzeResponse(responseText: string, request: ChatRequest): {
    cleanedResponse: string;
    confidence: number;
    nextAction: 'continue' | 'complete' | 'clarify' | 'handoff';
    suggestedFollowUps: string[];
    topicProgress: {
      currentTopic: string;
      completedTopics: string[];
      nextTopic?: string;
    };
  } {
    // Clean the response text
    const cleanedResponse = responseText.trim();
    
    // Analyze conversation completeness
    const context = request.context.conversationContext;
    const completedTopics = Object.entries(context.topics)
      .filter(([_, status]) => status === 'completed')
      .map(([topic, _]) => topic);
    
    // Determine if we have enough information for handoff
    const readyForHandoff = this.assessHandoffReadiness(request.context);
    
    // Generate appropriate follow-up suggestions
    const suggestedFollowUps = this.generateFollowUpSuggestions(request, cleanedResponse);
    
    // Determine current topic focus
    const currentTopic = this.identifyCurrentTopic(cleanedResponse, request.context);
    
    return {
      cleanedResponse,
      confidence: 0.85, // Could be improved with more sophisticated analysis
      nextAction: readyForHandoff ? 'handoff' : 'continue',
      suggestedFollowUps,
      topicProgress: {
        currentTopic,
        completedTopics,
        nextTopic: this.suggestNextTopic(context)
      }
    };
  }

  /**
   * Generate mock response for development
   */
  private async generateMockResponse(request: ChatRequest, startTime: number): Promise<ChatResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const locale = request.locale;
    const responses = {
      en: [
        "That's very helpful! Can you tell me more about who you think would be most interested in this product?",
        "Interesting insight! What do you think makes this product different from competitors?",
        "I see. How do you envision your customers using this product in their daily lives?",
        "Great point! What emotional response do you hope customers have when they see this product?",
        "Thanks for sharing that. What's the most important benefit this product provides?",
        "That helps me understand better. What kind of environment or setting best showcases this product?"
      ],
      ja: [
        "とても参考になります！この商品に最も興味を持ちそうなのはどのような方々だと思いますか？",
        "興味深い洞察ですね！この商品が競合他社と違う点は何だと思いますか？",
        "そうですね。お客様が日常生活でこの商品をどのように使用することを想像していますか？",
        "素晴らしい指摘ですね！お客様がこの商品を見たときにどのような感情的な反応を期待していますか？",
        "それを共有していただき、ありがとうございます。この商品が提供する最も重要なメリットは何ですか？",
        "より良く理解できました。この商品を最もよく紹介できる環境や設定はどのようなものでしょうか？"
      ]
    };

    const randomResponse = responses[locale][Math.floor(Math.random() * responses[locale].length)];
    
    const followUps = {
      en: [
        "Tell me about the target age group",
        "What's the key selling point?",
        "How should we position this?",
        "What visual style works best?"
      ],
      ja: [
        "ターゲット年齢層について教えてください",
        "主要なセリングポイントは何ですか？",
        "どのようにポジショニングすべきでしょうか？",
        "どのビジュアルスタイルが最適ですか？"
      ]
    };

    return {
      messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      response: randomResponse,
      processingTime: Date.now() - startTime,
      cost: 0.01,
      confidence: 0.85,
      nextAction: 'continue',
      suggestedFollowUps: followUps[locale].slice(0, 2),
      topicProgress: {
        currentTopic: 'productFeatures',
        completedTopics: ['productFeatures'],
        nextTopic: 'targetAudience'
      }
    };
  }

  /**
   * Assess if conversation is ready for handoff
   */
  private assessHandoffReadiness(context: any): boolean {
    const { productAnalysis, conversationContext } = context;
    
    if (!productAnalysis) return false;
    
    const completedTopics = Object.entries(conversationContext.topics)
      .filter(([_, status]) => status === 'completed')
      .length;
    
    const totalTopics = Object.keys(conversationContext.topics).length;
    
    // Ready for handoff if we have analysis and covered at least 60% of topics
    return completedTopics >= (totalTopics * 0.6);
  }

  /**
   * Generate contextual follow-up suggestions
   */
  private generateFollowUpSuggestions(request: ChatRequest, response: string): string[] {
    const locale = request.locale;
    const context = request.context.conversationContext;
    
    const suggestions = {
      en: {
        productFeatures: [
          "What makes this product unique?",
          "What's the main problem it solves?"
        ],
        targetAudience: [
          "Who is your ideal customer?",
          "What age group do you target?"
        ],
        brandPositioning: [
          "How do you want to position this brand?",
          "What's your competitive advantage?"
        ],
        visualPreferences: [
          "What visual style appeals to your audience?",
          "What mood should the commercial convey?"
        ]
      },
      ja: {
        productFeatures: [
          "この商品のユニークな点は何ですか？",
          "主に解決する問題は何ですか？"
        ],
        targetAudience: [
          "理想的な顧客はどのような方ですか？",
          "どの年齢層をターゲットにしていますか？"
        ],
        brandPositioning: [
          "このブランドをどのようにポジショニングしたいですか？",
          "競合優位性は何ですか？"
        ],
        visualPreferences: [
          "オーディエンスにアピールするビジュアルスタイルは？",
          "コマーシャルはどのようなムードを伝えるべきですか？"
        ]
      }
    };
    
    // Find next pending topic
    const pendingTopic = Object.entries(context.topics)
      .find(([_, status]) => status === 'pending')?.[0];
    
    if (pendingTopic && suggestions[locale][pendingTopic as keyof typeof suggestions['en']]) {
      return suggestions[locale][pendingTopic as keyof typeof suggestions['en']];
    }
    
    return suggestions[locale].productFeatures; // Default fallback
  }

  /**
   * Identify current conversation topic
   */
  private identifyCurrentTopic(response: string, context: any): string {
    // Simple keyword-based topic identification
    // Could be improved with more sophisticated NLP
    
    const topicKeywords = {
      productFeatures: ['feature', 'benefit', 'function', 'unique', 'special'],
      targetAudience: ['customer', 'user', 'audience', 'demographic', 'age'],
      brandPositioning: ['brand', 'position', 'competitive', 'advantage', 'different'],
      visualPreferences: ['visual', 'style', 'look', 'design', 'color', 'mood']
    };
    
    const lowerResponse = response.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerResponse.includes(keyword))) {
        return topic;
      }
    }
    
    return 'productFeatures'; // Default
  }

  /**
   * Suggest next conversation topic
   */
  private suggestNextTopic(context: ConversationContext): string | undefined {
    const topicOrder = ['productFeatures', 'targetAudience', 'brandPositioning', 'visualPreferences'];
    
    for (const topic of topicOrder) {
      if (context.topics[topic as keyof typeof context.topics] === 'pending') {
        return topic;
      }
    }
    
    return undefined; // All topics completed
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    const inputCost = (usage.input_tokens / 1000) * this.COST_CONFIG.inputTokenCost;
    const outputCost = (usage.output_tokens / 1000) * this.COST_CONFIG.outputTokenCost;
    
    return inputCost + outputCost;
  }
}