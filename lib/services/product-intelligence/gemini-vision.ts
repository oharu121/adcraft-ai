/**
 * Product Intelligence Agent - Gemini Pro Vision Integration
 * 
 * Specialized service for analyzing product images using Vertex AI Gemini Pro Vision
 * with structured output for product analysis and cost tracking.
 */

import { VertexAIService } from '../vertex-ai';
import { ProductAnalysis, ProductCategory } from '@/types/product-intelligence';

export interface VisionAnalysisRequest {
  sessionId: string;
  imageData: string; // Base64 encoded image data (without data URL prefix)
  description?: string;
  locale: 'en' | 'ja';
  analysisOptions?: {
    detailLevel: 'basic' | 'detailed' | 'comprehensive';
    includeTargetAudience: boolean;
    includePositioning: boolean;
    includeVisualPreferences: boolean;
  };
}

export interface VisionAnalysisResponse {
  analysis: ProductAnalysis;
  processingTime: number;
  cost: number;
  confidence: number;
  rawResponse?: string; // For debugging
  warnings?: string[];
}

export interface GeminiVisionRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generation_config: {
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
  };
}

/**
 * Gemini Pro Vision service for product image analysis
 */
export class GeminiVisionService {
  private static instance: GeminiVisionService;
  private vertexAI: VertexAIService;
  private readonly MODEL_NAME = 'gemini-1.5-pro-vision-preview';
  private readonly isMockMode: boolean;

  // Cost configuration (per 1000 tokens)
  private readonly COST_CONFIG = {
    inputTokenCost: 0.00025,  // $0.00025 per 1k input tokens
    outputTokenCost: 0.0005,  // $0.0005 per 1k output tokens
    imageBaseCost: 0.00125,   // Base cost per image analysis
  };

  private constructor() {
    this.vertexAI = VertexAIService.getInstance();
    this.isMockMode = process.env.NODE_ENV === 'development' && 
                      process.env.ENABLE_MOCK_MODE === 'true';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GeminiVisionService {
    if (!GeminiVisionService.instance) {
      GeminiVisionService.instance = new GeminiVisionService();
    }
    return GeminiVisionService.instance;
  }

  /**
   * Analyze product image with Gemini Pro Vision
   */
  public async analyzeProductImage(
    request: VisionAnalysisRequest, 
    options?: { forceMode?: 'demo' | 'real' }
  ): Promise<VisionAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      // Use forced mode if provided, otherwise use instance mock mode
      const shouldUseMockMode = options?.forceMode === 'demo' || 
                               (!options?.forceMode && options?.forceMode !== 'real' && this.isMockMode);
      
      if (shouldUseMockMode) {
        console.log('[GEMINI VISION] Using mock mode for analysis');
        return await this.generateMockAnalysis(request, startTime);
      }

      console.log('[GEMINI VISION] Using real Vertex AI for analysis');

      // Generate analysis prompt
      const prompt = this.generateAnalysisPrompt(request);

      // Make API call to Gemini Pro Vision
      const geminiResponse = await this.callGeminiVision(prompt, request.imageData);
      
      // Parse and structure the response
      const analysis = this.parseAnalysisResponse(geminiResponse.text, request);
      
      // Calculate processing time and cost
      const processingTime = Date.now() - startTime;
      const cost = this.calculateCost(geminiResponse.usage);

      return {
        analysis,
        processingTime,
        cost,
        confidence: this.calculateConfidence(analysis, geminiResponse.text),
        rawResponse: geminiResponse.text,
        warnings: this.validateAnalysisCompleteness(analysis)
      };

    } catch (error) {
      console.error('Gemini Vision analysis failed:', error);
      throw new Error(`Product image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate analysis prompt based on request parameters
   */
  private generateAnalysisPrompt(request: VisionAnalysisRequest): string {
    const basePrompt = request.locale === 'ja' 
      ? this.getJapanesePrompt(request)
      : this.getEnglishPrompt(request);
      
    return basePrompt;
  }

  /**
   * English analysis prompt
   */
  private getEnglishPrompt(request: VisionAnalysisRequest): string {
    const detailLevel = request.analysisOptions?.detailLevel || 'detailed';
    
    let prompt = `You are a product marketing expert analyzing a product image for commercial video creation. 

PRODUCT IMAGE ANALYSIS TASK:
Analyze this product image and provide structured insights for commercial video production.

${request.description ? `ADDITIONAL CONTEXT: ${request.description}` : ''}

Please provide a comprehensive analysis in the following JSON structure:

{
  "product": {
    "category": "electronics|fashion|food-beverage|home-garden|health-beauty|sports-outdoors|automotive|books-media|toys-games|business|other",
    "subcategory": "specific subcategory",
    "name": "product name",
    "description": "detailed product description",
    "keyFeatures": ["feature1", "feature2", "feature3"],
    "materials": ["material1", "material2"],
    "colors": [
      {"name": "color name", "hex": "#000000", "role": "primary|secondary|accent"}
    ],
    "usageContext": ["context1", "context2"],
    "seasonality": "spring|summer|fall|winter|year-round"
  },
  "targetAudience": {
    "primary": {
      "demographics": {
        "ageRange": "age range",
        "gender": "male|female|unisex",
        "incomeLevel": "budget|mid-range|premium|luxury",
        "location": ["urban", "suburban"],
        "lifestyle": ["lifestyle1", "lifestyle2"]
      },
      "psychographics": {
        "values": ["value1", "value2"],
        "interests": ["interest1", "interest2"],
        "personalityTraits": ["trait1", "trait2"],
        "motivations": ["motivation1", "motivation2"]
      },
      "behaviors": {
        "shoppingHabits": ["habit1", "habit2"],
        "mediaConsumption": ["media1", "media2"],
        "brandLoyalty": "low|medium|high",
        "decisionFactors": ["factor1", "factor2"]
      }
    }
  },
  "positioning": {
    "brandPersonality": {
      "traits": ["trait1", "trait2"],
      "tone": "professional|friendly|luxury|playful|authoritative",
      "voice": "description of brand voice"
    },
    "valueProposition": {
      "primaryBenefit": "main benefit",
      "supportingBenefits": ["benefit1", "benefit2"],
      "differentiators": ["diff1", "diff2"]
    },
    "competitiveAdvantages": {
      "functional": ["advantage1", "advantage2"],
      "emotional": ["advantage1", "advantage2"],
      "experiential": ["advantage1", "advantage2"]
    },
    "marketPosition": {
      "tier": "budget|mainstream|premium|luxury",
      "niche": "market niche if applicable",
      "marketShare": "challenger|leader|niche"
    }
  },
  "commercialStrategy": {
    "keyMessages": {
      "headline": "compelling headline",
      "tagline": "memorable tagline",
      "supportingMessages": ["message1", "message2"]
    },
    "emotionalTriggers": {
      "primary": {
        "type": "aspiration|fear|joy|trust|excitement|comfort|pride",
        "description": "trigger description",
        "intensity": "subtle|moderate|strong"
      },
      "secondary": [
        {
          "type": "trigger type",
          "description": "description",
          "intensity": "intensity"
        }
      ]
    },
    "callToAction": {
      "primary": "main CTA",
      "secondary": ["secondary CTA1", "secondary CTA2"]
    },
    "storytelling": {
      "narrative": "story narrative",
      "conflict": "central conflict",
      "resolution": "story resolution"
    }
  },
  "visualPreferences": {
    "overallStyle": "modern|classic|minimalist|bold|organic",
    "colorPalette": {
      "primary": [{"name": "color", "hex": "#000000", "role": "primary"}],
      "secondary": [{"name": "color", "hex": "#000000", "role": "secondary"}],
      "accent": [{"name": "color", "hex": "#000000", "role": "accent"}]
    },
    "mood": "energetic|calm|sophisticated|playful|inspiring",
    "composition": "clean|dynamic|intimate|grand|artistic",
    "lighting": "bright|warm|dramatic|natural|studio",
    "environment": ["environment1", "environment2"]
  }
}

ANALYSIS REQUIREMENTS:
- Provide ${detailLevel} analysis depth
- Focus on commercial video production insights
- Include specific, actionable recommendations
- Ensure all color values are valid hex codes
- Base insights on visual elements observable in the image
- Consider cultural context for marketing effectiveness

Return ONLY the JSON response, no additional text.`;

    return prompt;
  }

  /**
   * Japanese analysis prompt
   */
  private getJapanesePrompt(request: VisionAnalysisRequest): string {
    // TODO: Implement Japanese prompt
    // For now, return English prompt with Japanese instruction
    return this.getEnglishPrompt(request) + '\n\nPlease ensure all text values in the JSON are in Japanese where appropriate for the locale.';
  }

  /**
   * Call Gemini Pro Vision API
   */
  private async callGeminiVision(prompt: string, imageData: string): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    // Check if we have GEMINI_API_KEY for AI Studio API
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      // Use Gemini AI Studio API (simpler authentication)
      return await this.callGeminiAIStudio(prompt, imageData, geminiApiKey);
    } else {
      // Use Vertex AI API (requires service account)
      return await this.callVertexAI(prompt, imageData);
    }
  }

  /**
   * Call Gemini AI Studio API with API key
   */
  private async callGeminiAIStudio(prompt: string, imageData: string, apiKey: string): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const mimeType = this.detectMimeTypeFromBase64(imageData);
    
    const request = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData
              }
            }
          ]
        }
      ],
      generation_config: {
        temperature: 0.3,
        top_p: 0.8,
        top_k: 40,
        max_output_tokens: 4096
      }
    };

    console.log('[GEMINI VISION] Using AI Studio API with API key');
    
    // Use Gemini AI Studio endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini AI Studio API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response format from Gemini AI Studio API');
    }
    
    return {
      text: result.candidates[0].content.parts[0].text,
      usage: result.usage_metadata || { input_tokens: 1000, output_tokens: 2000 }
    };
  }

  /**
   * Call Vertex AI API with service account authentication
   */
  private async callVertexAI(prompt: string, imageData: string): Promise<{
    text: string;
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const accessToken = await this.vertexAI.getAccessToken();
    const baseUrl = this.vertexAI.getBaseUrl();
    
    const mimeType = this.detectMimeTypeFromBase64(imageData);
    
    const request: GeminiVisionRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData
              }
            }
          ]
        }
      ],
      generation_config: {
        temperature: 0.3,
        top_p: 0.8,
        top_k: 40,
        max_output_tokens: 4096
      }
    };

    console.log('[GEMINI VISION] Using Vertex AI API with service account');

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
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response format from Vertex AI API');
    }

    return {
      text: result.candidates[0].content.parts[0].text,
      usage: result.usage_metadata || { input_tokens: 1000, output_tokens: 2000 }
    };
  }

  /**
   * Detect MIME type from base64 image data
   */
  private detectMimeTypeFromBase64(base64Data: string): string {
    // Check the first few characters of base64 data to detect image format
    const header = base64Data.substring(0, 10);
    
    // JPEG: starts with /9j/
    if (header.startsWith('/9j/')) {
      return 'image/jpeg';
    }
    
    // PNG: starts with iVBORw0
    if (header.startsWith('iVBORw0')) {
      return 'image/png';
    }
    
    // WebP: Look for WEBP signature (UklGR for RIFF header)
    if (header.indexOf('UklGR') === 0) {
      return 'image/webp';
    }
    
    // Default to JPEG if unknown
    console.warn('[GEMINI VISION] Unknown image format, defaulting to JPEG');
    return 'image/jpeg';
  }

  /**
   * Parse Gemini response into structured analysis
   */
  private parseAnalysisResponse(responseText: string, request: VisionAnalysisRequest): ProductAnalysis {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Add metadata
      const analysis: ProductAnalysis = {
        ...parsed,
        metadata: {
          sessionId: request.sessionId,
          analysisVersion: '1.0.0',
          confidenceScore: 0.85, // Will be calculated later
          processingTime: 0, // Will be set by caller
          cost: {
            current: 0, // Will be set by caller
            total: 0,
            breakdown: {
              imageAnalysis: 0,
              chatInteractions: 0
            },
            remaining: 300,
            budgetAlert: false
          },
          locale: request.locale,
          timestamp: new Date().toISOString(),
          agentInteractions: 1
        }
      };

      return analysis;

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Response text:', responseText);
      
      // Return minimal fallback analysis
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * Generate mock analysis for development
   */
  private async generateMockAnalysis(request: VisionAnalysisRequest, startTime: number): Promise<VisionAnalysisResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockAnalysis: ProductAnalysis = {
      product: {
        id: request.sessionId,
        category: ProductCategory.ELECTRONICS,
        subcategory: 'smartphone',
        name: request.locale === 'ja' ? 'プレミアムスマートフォン' : 'Premium Smartphone',
        description: request.locale === 'ja' 
          ? '最新技術を搭載した高品質スマートフォン'
          : 'High-quality smartphone with cutting-edge technology',
        keyFeatures: request.locale === 'ja'
          ? ['高解像度カメラ', '長時間バッテリー', '高速プロセッサー', '防水設計']
          : ['High-resolution camera', 'Long battery life', 'Fast processor', 'Water-resistant design'],
        materials: ['aluminum', 'glass', 'ceramic'],
        colors: [
          { name: 'midnight black', hex: '#1a1a1a', role: 'primary' as const },
          { name: 'silver', hex: '#c0c0c0', role: 'secondary' as const },
          { name: 'rose gold', hex: '#e8b4b8', role: 'accent' as const }
        ],
        usageContext: request.locale === 'ja'
          ? ['日常使用', 'ビジネス', '写真撮影', 'エンターテイメント']
          : ['daily use', 'business', 'photography', 'entertainment'],
        seasonality: 'year-round'
      },
      targetAudience: {
        primary: {
          demographics: {
            ageRange: '25-45',
            gender: 'unisex' as const,
            incomeLevel: 'premium' as const,
            location: ['urban', 'suburban'],
            lifestyle: ['tech-savvy', 'professional', 'active']
          },
          psychographics: {
            values: ['innovation', 'quality', 'efficiency', 'status'],
            interests: ['technology', 'photography', 'productivity', 'social media'],
            personalityTraits: ['ambitious', 'detail-oriented', 'trendy', 'practical'],
            motivations: ['staying connected', 'professional success', 'creative expression']
          },
          behaviors: {
            shoppingHabits: ['research-driven', 'brand-conscious', 'quality-focused'],
            mediaConsumption: ['digital-first', 'social media', 'tech blogs', 'video content'],
            brandLoyalty: 'medium' as const,
            decisionFactors: ['features', 'reviews', 'brand reputation', 'design']
          }
        }
      },
      positioning: {
        brandPersonality: {
          traits: ['innovative', 'sophisticated', 'reliable', 'premium'],
          tone: 'professional' as const,
          voice: 'confident, knowledgeable, and aspirational'
        },
        valueProposition: {
          primaryBenefit: 'Ultimate mobile experience for professionals',
          supportingBenefits: [
            'Professional-grade camera system',
            'All-day productivity power',
            'Seamless integration with work tools'
          ],
          differentiators: [
            'Industry-leading camera technology',
            'Premium build quality',
            'Exclusive software features'
          ]
        },
        competitiveAdvantages: {
          functional: ['superior camera quality', 'longer battery life', 'faster processing'],
          emotional: ['status symbol', 'confidence booster', 'creative enabler'],
          experiential: ['intuitive interface', 'premium feel', 'seamless connectivity']
        },
        marketPosition: {
          tier: 'premium' as const,
          niche: 'professional smartphone users',
          marketShare: 'challenger' as const
        }
      },
      commercialStrategy: {
        keyMessages: {
          headline: request.locale === 'ja' 
            ? 'プロフェッショナルのためのスマートフォン'
            : 'The Professional\'s Smartphone',
          tagline: request.locale === 'ja'
            ? '技術、スタイル、信頼性'
            : 'Technology, Style, Reliability',
          supportingMessages: request.locale === 'ja'
            ? ['プロ級のカメラ品質', '一日中持続する電池', 'プレミアムデザイン']
            : ['Pro-level camera quality', 'All-day battery life', 'Premium design']
        },
        emotionalTriggers: {
          primary: {
            type: 'pride' as const,
            description: 'Feeling of accomplishment and professional status',
            intensity: 'strong' as const
          },
          secondary: [
            {
              type: 'trust' as const,
              description: 'Reliability for important moments',
              intensity: 'moderate' as const
            }
          ]
        },
        callToAction: {
          primary: request.locale === 'ja' ? '今すぐ体験' : 'Experience Now',
          secondary: request.locale === 'ja' 
            ? ['詳細を見る', 'モデル比較', 'ストアを検索']
            : ['Learn More', 'Compare Models', 'Find Store']
        },
        storytelling: {
          narrative: 'Professional achieving success with reliable technology',
          conflict: 'Need for dependable performance in crucial moments',
          resolution: 'Confidence and success with the right tools'
        }
      },
      visualPreferences: {
        overallStyle: 'modern' as const,
        colorPalette: {
          primary: [{ name: 'deep blue', hex: '#1e3a8a', role: 'primary' as const }],
          secondary: [{ name: 'silver', hex: '#94a3b8', role: 'secondary' as const }],
          accent: [{ name: 'electric blue', hex: '#3b82f6', role: 'accent' as const }]
        },
        mood: 'sophisticated' as const,
        composition: 'clean' as const,
        lighting: 'natural' as const,
        environment: ['modern office', 'urban setting', 'minimalist background']
      },
      metadata: {
        sessionId: request.sessionId,
        analysisVersion: '1.0.0',
        confidenceScore: 0.88,
        processingTime: Date.now() - startTime,
        cost: {
          current: 0.25,
          total: 0.25,
          breakdown: {
            imageAnalysis: 0.25,
            chatInteractions: 0
          },
          remaining: 299.75,
          budgetAlert: false
        },
        locale: request.locale,
        timestamp: new Date().toISOString(),
        agentInteractions: 1
      }
    };

    return {
      analysis: mockAnalysis,
      processingTime: Date.now() - startTime,
      cost: 0.25,
      confidence: 0.88,
      warnings: []
    };
  }

  /**
   * Generate fallback analysis when parsing fails
   */
  private generateFallbackAnalysis(request: VisionAnalysisRequest): ProductAnalysis {
    return {
      product: {
        id: request.sessionId,
        category: ProductCategory.OTHER,
        subcategory: 'unknown',
        name: 'Product',
        description: 'Product analysis could not be completed',
        keyFeatures: ['Unable to analyze'],
        materials: ['Unknown'],
        colors: [{ name: 'unknown', hex: '#808080', role: 'primary' as const }],
        usageContext: ['General use'],
        seasonality: 'year-round'
      },
      targetAudience: {
        primary: {
          demographics: {
            ageRange: '18-65',
            gender: 'unisex' as const,
            incomeLevel: 'mid-range' as const,
            location: ['general'],
            lifestyle: ['general']
          },
          psychographics: {
            values: ['quality'],
            interests: ['general'],
            personalityTraits: ['practical'],
            motivations: ['functionality']
          },
          behaviors: {
            shoppingHabits: ['value-conscious'],
            mediaConsumption: ['mixed'],
            brandLoyalty: 'medium' as const,
            decisionFactors: ['price', 'quality']
          }
        }
      },
      positioning: {
        brandPersonality: {
          traits: ['practical'],
          tone: 'friendly' as const,
          voice: 'approachable and honest'
        },
        valueProposition: {
          primaryBenefit: 'Reliable solution',
          supportingBenefits: ['Quality', 'Value'],
          differentiators: ['Dependable']
        },
        competitiveAdvantages: {
          functional: ['Reliable performance'],
          emotional: ['Peace of mind'],
          experiential: ['Straightforward experience']
        },
        marketPosition: {
          tier: 'mainstream' as const,
          marketShare: 'challenger' as const
        }
      },
      commercialStrategy: {
        keyMessages: {
          headline: 'Quality Product',
          tagline: 'Reliable and Practical',
          supportingMessages: ['Quality you can trust', 'Practical solution']
        },
        emotionalTriggers: {
          primary: {
            type: 'trust' as const,
            description: 'Reliability and dependability',
            intensity: 'moderate' as const
          },
          secondary: []
        },
        callToAction: {
          primary: 'Learn More',
          secondary: ['View Details']
        },
        storytelling: {
          narrative: 'Finding a reliable solution',
          conflict: 'Need for dependable product',
          resolution: 'Peace of mind with quality choice'
        }
      },
      visualPreferences: {
        overallStyle: 'classic' as const,
        colorPalette: {
          primary: [{ name: 'blue', hex: '#3b82f6', role: 'primary' as const }],
          secondary: [{ name: 'gray', hex: '#6b7280', role: 'secondary' as const }],
          accent: [{ name: 'white', hex: '#ffffff', role: 'accent' as const }]
        },
        mood: 'calm' as const,
        composition: 'clean' as const,
        lighting: 'natural' as const,
        environment: ['neutral background']
      },
      metadata: {
        sessionId: request.sessionId,
        analysisVersion: '1.0.0',
        confidenceScore: 0.3, // Low confidence for fallback
        processingTime: 1000,
        cost: {
          current: 0.1,
          total: 0.1,
          breakdown: {
            imageAnalysis: 0.1,
            chatInteractions: 0
          },
          remaining: 299.9,
          budgetAlert: false
        },
        locale: request.locale,
        timestamp: new Date().toISOString(),
        agentInteractions: 1
      }
    };
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    const inputCost = (usage.input_tokens / 1000) * this.COST_CONFIG.inputTokenCost;
    const outputCost = (usage.output_tokens / 1000) * this.COST_CONFIG.outputTokenCost;
    const imageCost = this.COST_CONFIG.imageBaseCost;
    
    return inputCost + outputCost + imageCost;
  }

  /**
   * Calculate confidence score based on analysis completeness
   */
  private calculateConfidence(analysis: ProductAnalysis, rawResponse: string): number {
    let score = 0.5; // Base score
    
    // Check completeness of key sections
    if (analysis.product.keyFeatures.length > 0) score += 0.1;
    if (analysis.targetAudience.primary.demographics.ageRange !== 'unknown') score += 0.1;
    if (analysis.positioning.valueProposition.primaryBenefit !== 'unknown') score += 0.1;
    if (analysis.commercialStrategy.keyMessages.headline !== 'unknown') score += 0.1;
    if (analysis.visualPreferences.overallStyle !== 'classic') score += 0.1;
    
    // Check response quality indicators
    if (rawResponse.length > 2000) score += 0.05;
    if (analysis.product.colors.length > 1) score += 0.05;
    
    return Math.min(score, 0.95); // Cap at 95%
  }

  /**
   * Validate analysis completeness and return warnings
   */
  private validateAnalysisCompleteness(analysis: ProductAnalysis): string[] {
    const warnings: string[] = [];
    
    if (analysis.product.keyFeatures.length === 0) {
      warnings.push('No product features identified');
    }
    
    if (analysis.product.colors.length === 0) {
      warnings.push('No product colors identified');
    }
    
    if (analysis.targetAudience.primary.demographics.ageRange === 'unknown') {
      warnings.push('Target age range not determined');
    }
    
    if (analysis.metadata.confidenceScore < 0.7) {
      warnings.push('Low confidence analysis - consider manual review');
    }
    
    return warnings;
  }
}