/**
 * Product Intelligence Agent - Analysis Engine
 * 
 * Orchestrates the complete product analysis workflow including image processing,
 * Vertex AI integration, result structuring, and session management.
 */

import { GeminiVisionService, VisionAnalysisRequest, VisionAnalysisResponse } from './gemini-vision';
import { ProductImageStorageService, ProductImageUpload } from './image-storage';
import { ProductIntelligenceFirestore } from './firestore-schema';
import { SessionState, ProductAnalysis, SessionStatus } from '@/types/product-intelligence';

export interface ProductAnalysisEngineRequest {
  sessionId: string;
  image?: {
    file: File;
    description?: string;
  };
  imageUrl?: string;
  productName?: string;
  locale: 'en' | 'ja';
  options?: {
    detailLevel: 'basic' | 'detailed' | 'comprehensive';
    includeTargetAudience: boolean;
    includePositioning: boolean;
    includeVisualPreferences: boolean;
    storageRetentionHours: number;
  };
}

export interface ProductAnalysisEngineResponse {
  sessionId: string;
  analysis: ProductAnalysis;
  imageUrls: {
    original: string;
    optimized: string;
    thumbnail: string;
  };
  processingMetrics: {
    imageUploadTime: number;
    analysisTime: number;
    totalTime: number;
  };
  cost: {
    imageProcessing: number;
    aiAnalysis: number;
    storage: number;
    total: number;
  };
  warnings: string[];
}

/**
 * Main product analysis engine
 * Orchestrates the entire analysis workflow from image to structured insights
 */
export class ProductAnalysisEngine {
  private static instance: ProductAnalysisEngine;
  private geminiVision: GeminiVisionService;
  private imageStorage: ProductImageStorageService;
  private firestore: ProductIntelligenceFirestore;

  private constructor() {
    this.geminiVision = GeminiVisionService.getInstance();
    this.imageStorage = ProductImageStorageService.getInstance();
    this.firestore = new ProductIntelligenceFirestore();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProductAnalysisEngine {
    if (!ProductAnalysisEngine.instance) {
      ProductAnalysisEngine.instance = new ProductAnalysisEngine();
    }
    return ProductAnalysisEngine.instance;
  }

  /**
   * Perform complete product analysis
   */
  public async analyzeProduct(request: ProductAnalysisEngineRequest): Promise<ProductAnalysisEngineResponse> {
    const startTime = Date.now();
    let imageUploadTime = 0;
    let analysisTime = 0;
    
    try {
      // Update session status to analyzing
      await this.updateSessionStatus(request.sessionId, SessionStatus.ANALYZING);
      
      let imageUrl: string;
      let imageUrls: ProductAnalysisEngineResponse['imageUrls'];
      let imageCost = 0;
      
      // Handle image processing
      if (request.image) {
        const uploadStart = Date.now();
        
        // Process and upload image
        const imageResult = await this.imageStorage.uploadProductImage({
          sessionId: request.sessionId,
          originalFile: request.image.file,
          originalName: request.image.file.name,
          contentType: request.image.file.type
        });
        
        imageUploadTime = Date.now() - uploadStart;
        imageUrl = imageResult.signedUrl; // Use signed URL for Vertex AI
        imageCost = 0.05; // Estimated storage cost
        
        imageUrls = {
          original: imageResult.originalUrl,
          optimized: imageResult.optimizedUrl,
          thumbnail: imageResult.thumbnailUrl
        };
        
      } else if (request.imageUrl) {
        imageUrl = request.imageUrl;
        imageUrls = {
          original: request.imageUrl,
          optimized: request.imageUrl,
          thumbnail: request.imageUrl
        };
      } else {
        throw new Error('Either image file or imageUrl must be provided');
      }
      
      // Perform AI analysis
      const analysisStart = Date.now();
      
      const visionRequest: VisionAnalysisRequest = {
        sessionId: request.sessionId,
        imageData: imageUrl, // TODO: This should be base64 imageData, not imageUrl
        description: request.image?.description,
        productName: request.productName,
        locale: request.locale,
        analysisOptions: {
          detailLevel: request.options?.detailLevel || 'detailed',
          includeTargetAudience: request.options?.includeTargetAudience ?? true,
          includePositioning: request.options?.includePositioning ?? true,
          includeVisualPreferences: request.options?.includeVisualPreferences ?? true
        }
      };
      
      const visionResponse = await this.geminiVision.analyzeProductImage(visionRequest);
      analysisTime = visionResponse.processingTime;
      
      // Update analysis with actual costs and timing
      const updatedAnalysis = this.updateAnalysisMetadata(
        visionResponse.analysis,
        {
          imageUploadTime,
          analysisTime,
          totalTime: Date.now() - startTime,
          imageCost,
          aiCost: visionResponse.cost
        }
      );
      
      // Store analysis results
      await this.storeAnalysisResults(request.sessionId, updatedAnalysis, imageUrls);
      
      // Update session status to complete
      await this.updateSessionStatus(request.sessionId, SessionStatus.READY_FOR_HANDOFF);
      
      const totalTime = Date.now() - startTime;
      
      return {
        sessionId: request.sessionId,
        analysis: updatedAnalysis,
        imageUrls,
        processingMetrics: {
          imageUploadTime,
          analysisTime,
          totalTime
        },
        cost: {
          imageProcessing: imageCost,
          aiAnalysis: visionResponse.cost,
          storage: 0.01, // Minimal storage cost
          total: imageCost + visionResponse.cost + 0.01
        },
        warnings: visionResponse.warnings || []
      };
      
    } catch (error) {
      console.error('Product analysis failed:', error);
      
      // Update session status to error
      await this.updateSessionStatus(request.sessionId, SessionStatus.ERROR);
      
      throw new Error(`Product analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get existing analysis for a session
   */
  public async getAnalysis(sessionId: string): Promise<ProductAnalysis | null> {
    try {
      const session = await this.firestore.getPISession(sessionId);
      return session?.product.analysis || null;
    } catch (error) {
      console.error('Failed to get analysis:', error);
      return null;
    }
  }

  /**
   * Update analysis based on user feedback or additional context
   */
  public async refineAnalysis(
    sessionId: string,
    refinementRequest: {
      topic: string;
      userFeedback: string;
      locale: 'en' | 'ja';
    }
  ): Promise<ProductAnalysis> {
    try {
      // Get existing analysis
      const existingAnalysis = await this.getAnalysis(sessionId);
      if (!existingAnalysis) {
        throw new Error('No existing analysis found for session');
      }
      
      // TODO: Implement refinement logic using Gemini Pro Chat
      // This would involve sending the existing analysis + user feedback
      // to Gemini Pro for targeted improvements
      
      // For now, return existing analysis with updated metadata
      const refinedAnalysis = {
        ...existingAnalysis,
        metadata: {
          ...existingAnalysis.metadata,
          agentInteractions: existingAnalysis.metadata.agentInteractions + 1,
          timestamp: new Date().toISOString()
        }
      };
      
      // Store updated analysis
      await this.firestore.storePIAnalysis(sessionId, refinedAnalysis);
      
      return refinedAnalysis;
      
    } catch (error) {
      console.error('Analysis refinement failed:', error);
      throw new Error(`Analysis refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get analysis summary for handoff to next agent
   */
  public async prepareHandoffData(sessionId: string): Promise<{
    analysis: ProductAnalysis;
    sessionSummary: string;
    handoffMetadata: any;
  }> {
    try {
      const session = await this.firestore.getPISession(sessionId);
      if (!session || !session.product.analysis) {
        throw new Error('Session or analysis not found for handoff preparation');
      }
      
      const analysis = session.product.analysis;
      
      // Generate session summary
      const sessionSummary = this.generateSessionSummary(session, analysis);
      
      // Prepare handoff metadata
      const handoffMetadata = {
        completedTopics: session.conversation.completedTopics,
        keyInsights: session.conversation.context.keyInsights,
        userPreferences: session.user.preferences,
        analysisConfidence: analysis.metadata.confidenceScore,
        totalCost: session.costs.total,
        processingTime: analysis.metadata.processingTime,
        locale: session.user.locale
      };
      
      return {
        analysis,
        sessionSummary,
        handoffMetadata
      };
      
    } catch (error) {
      console.error('Handoff preparation failed:', error);
      throw new Error(`Handoff preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up session resources
   */
  public async cleanupSession(sessionId: string): Promise<boolean> {
    try {
      // Clean up image storage
      await this.imageStorage.cleanupSessionImages(sessionId);
      
      // Note: Session data cleanup is handled by Firestore TTL
      console.log(`Cleaned up resources for session: ${sessionId}`);
      return true;
      
    } catch (error) {
      console.error('Session cleanup failed:', error);
      return false;
    }
  }

  /**
   * Update session status
   */
  private async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    try {
      const session = await this.firestore.getPISession(sessionId);
      if (session) {
        await this.firestore.updatePISession(sessionId, {
          ...session,
          status,
          metadata: {
            ...session.metadata,
            updatedAt: Date.now()
          }
        });
      }
    } catch (error) {
      console.error('Failed to update session status:', error);
    }
  }

  /**
   * Update analysis metadata with processing information
   */
  private updateAnalysisMetadata(
    analysis: ProductAnalysis,
    metrics: {
      imageUploadTime: number;
      analysisTime: number;
      totalTime: number;
      imageCost: number;
      aiCost: number;
    }
  ): ProductAnalysis {
    return {
      ...analysis,
      metadata: {
        ...analysis.metadata,
        processingTime: metrics.totalTime,
        cost: {
          current: metrics.imageCost + metrics.aiCost,
          total: metrics.imageCost + metrics.aiCost,
          breakdown: {
            imageAnalysis: metrics.aiCost,
            chatInteractions: 0
          },
          remaining: 300 - (metrics.imageCost + metrics.aiCost),
          budgetAlert: (metrics.imageCost + metrics.aiCost) > 200
        }
      }
    };
  }

  /**
   * Store analysis results in Firestore
   */
  private async storeAnalysisResults(
    sessionId: string,
    analysis: ProductAnalysis,
    imageUrls: ProductAnalysisEngineResponse['imageUrls']
  ): Promise<void> {
    try {
      // Store the analysis
      await this.firestore.storePIAnalysis(sessionId, analysis);
      
      // Update session with analysis reference
      const session = await this.firestore.getPISession(sessionId);
      if (session) {
        await this.firestore.updatePISession(sessionId, {
          ...session,
          product: {
            ...session.product,
            analysis,
            processingStatus: 'complete' as const
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to store analysis results:', error);
      throw error;
    }
  }

  /**
   * Generate session summary for handoff
   */
  private generateSessionSummary(session: SessionState, analysis: ProductAnalysis): string {
    const locale = session.user.locale;
    
    if (locale === 'ja') {
      return `商品分析セッションの要約:
商品: ${analysis.product.name} (${analysis.product.category})
主要機能: ${analysis.product.keyFeatures.join(', ')}
ターゲット: ${analysis.targetAudience.primary.demographics.ageRange}歳の${analysis.targetAudience.primary.demographics.incomeLevel}層
ポジショニング: ${analysis.positioning.valueProposition.primaryBenefit}
信頼度: ${Math.round(analysis.metadata.confidenceScore * 100)}%
メッセージ数: ${session.conversation.messages?.length || 0}
処理時間: ${analysis.metadata.processingTime}ms`;
    } else {
      return `Product Analysis Session Summary:
Product: ${analysis.product.name} (${analysis.product.category})
Key Features: ${analysis.product.keyFeatures.join(', ')}
Target: ${analysis.targetAudience.primary.demographics.ageRange} year-old ${analysis.targetAudience.primary.demographics.incomeLevel} tier
Positioning: ${analysis.positioning.valueProposition.primaryBenefit}
Confidence: ${Math.round(analysis.metadata.confidenceScore * 100)}%
Messages: ${session.conversation.messages?.length || 0}
Processing Time: ${analysis.metadata.processingTime}ms`;
    }
  }
}