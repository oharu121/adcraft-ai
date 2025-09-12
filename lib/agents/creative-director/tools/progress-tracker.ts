/**
 * Creative Director Progress Tracker
 *
 * Real-time progress tracking for David's asset generation with creative commentary,
 * providing professional insights and guidance throughout the creative process.
 */

import { CreativeDirectorPerformanceMonitor } from './performance-monitor';

export interface ProgressStage {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // in milliseconds
  weight: number; // 0-1, contribution to overall progress
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  commentary?: DavidCommentary;
}

export interface DavidCommentary {
  stage: string;
  message: string;
  tone: 'encouraging' | 'explanatory' | 'professional' | 'excited' | 'thoughtful';
  insights?: string[];
  tips?: string[];
  brandConsiderations?: string[];
}

export interface AssetProgressTracking {
  assetId: string;
  assetType: string;
  quality: string;
  sessionId: string;
  
  overall: {
    progress: number; // 0-100
    currentStage: string;
    estimatedCompletion: number; // timestamp
    elapsedTime: number;
    remainingTime: number;
  };
  
  stages: ProgressStage[];
  commentary: DavidCommentary[];
  
  performance: {
    bottlenecks: string[];
    optimizations: string[];
    qualityPrediction: number; // 0-1
  };
  
  creative: {
    brandAlignment: number; // 0-1
    marketAppeal: number; // 0-1
    technicalQuality: number; // 0-1
    overallScore: number; // 0-1
  };
  
  metadata: {
    timestamp: string;
    lastUpdated: string;
    userId?: string;
    promptComplexity: number;
    culturalContext?: string;
  };
}

export interface CreativeWorkflowProgress {
  workflowId: string;
  sessionId: string;
  workflowType: 'asset_generation' | 'style_development' | 'brand_analysis' | 'creative_review';
  
  overall: {
    progress: number;
    currentPhase: string;
    estimatedCompletion: number;
  };
  
  assets: AssetProgressTracking[];
  commentary: DavidCommentary[];
  
  insights: {
    creativeTrends: string[];
    brandOpportunities: string[];
    optimizationSuggestions: string[];
  };
}

/**
 * Creative Director Progress Tracker
 * Provides real-time progress tracking with David's professional creative commentary
 */
export class CreativeDirectorProgressTracker {
  private static instance: CreativeDirectorProgressTracker;
  private performanceMonitor: CreativeDirectorPerformanceMonitor;
  private activeTracking: Map<string, AssetProgressTracking> = new Map();
  private workflowTracking: Map<string, CreativeWorkflowProgress> = new Map();
  
  private constructor() {
    this.performanceMonitor = CreativeDirectorPerformanceMonitor.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorProgressTracker {
    if (!CreativeDirectorProgressTracker.instance) {
      CreativeDirectorProgressTracker.instance = new CreativeDirectorProgressTracker();
    }
    return CreativeDirectorProgressTracker.instance;
  }

  /**
   * Start tracking asset generation progress
   */
  public startAssetTracking(
    assetId: string,
    assetType: string,
    quality: string,
    sessionId: string,
    promptComplexity: number = 0.5,
    culturalContext?: string
  ): AssetProgressTracking {
    const stages = this.createAssetGenerationStages(assetType, quality);
    const estimatedCompletion = Date.now() + this.calculateTotalDuration(stages);
    
    const tracking: AssetProgressTracking = {
      assetId,
      assetType,
      quality,
      sessionId,
      
      overall: {
        progress: 0,
        currentStage: stages[0].name,
        estimatedCompletion,
        elapsedTime: 0,
        remainingTime: this.calculateTotalDuration(stages)
      },
      
      stages,
      commentary: [this.generateInitialCommentary(assetType, quality, culturalContext)],
      
      performance: {
        bottlenecks: [],
        optimizations: [],
        qualityPrediction: this.predictQuality(quality, promptComplexity)
      },
      
      creative: {
        brandAlignment: 0.8, // Will be updated as we progress
        marketAppeal: 0.7,
        technicalQuality: 0.9,
        overallScore: 0.8
      },
      
      metadata: {
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        promptComplexity,
        culturalContext
      }
    };

    this.activeTracking.set(assetId, tracking);
    
    // Start performance monitoring
    this.performanceMonitor.startTracking(
      `asset-${assetId}`,
      sessionId,
      `generate_${assetType}`,
      'generation',
      { assetType, quality, culturalContext }
    );

    console.log(`[PROGRESS TRACKER] Started tracking asset generation: ${assetType} (${assetId})`);
    return tracking;
  }

  /**
   * Update progress for specific stage
   */
  public updateStageProgress(
    assetId: string,
    stageName: string,
    progress: number,
    metadata?: any
  ): AssetProgressTracking | null {
    const tracking = this.activeTracking.get(assetId);
    if (!tracking) {
      console.warn(`[PROGRESS TRACKER] No tracking found for asset: ${assetId}`);
      return null;
    }

    // Update stage
    const stage = tracking.stages.find(s => s.name === stageName);
    if (stage) {
      if (stage.status === 'pending') {
        stage.status = 'in_progress';
        stage.startTime = Date.now();
      }
      
      // Mark as completed if progress is 100
      if (progress >= 100 && stage.status === 'in_progress') {
        stage.status = 'completed';
        stage.endTime = Date.now();
      }
    }

    // Calculate overall progress
    const totalWeight = tracking.stages.reduce((sum, s) => sum + s.weight, 0);
    const completedWeight = tracking.stages
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.weight, 0);
    const inProgressWeight = tracking.stages
      .filter(s => s.status === 'in_progress')
      .reduce((sum, s) => sum + (s.weight * (progress / 100)), 0);
    
    tracking.overall.progress = Math.round(((completedWeight + inProgressWeight) / totalWeight) * 100);
    tracking.overall.elapsedTime = Date.now() - new Date(tracking.metadata.timestamp).getTime();
    
    // Update current stage
    const currentStage = tracking.stages.find(s => s.status === 'in_progress') || 
                        tracking.stages.find(s => s.status === 'pending');
    if (currentStage) {
      tracking.overall.currentStage = currentStage.name;
    }

    // Generate contextual commentary
    const commentary = this.generateProgressCommentary(tracking, stageName, progress, metadata);
    if (commentary) {
      tracking.commentary.push(commentary);
    }

    // Update performance metrics
    if (metadata?.performance) {
      tracking.performance = { ...tracking.performance, ...metadata.performance };
    }

    // Update creative metrics
    if (metadata?.creative) {
      tracking.creative = { ...tracking.creative, ...metadata.creative };
    }

    tracking.metadata.lastUpdated = new Date().toISOString();
    this.activeTracking.set(assetId, tracking);

    console.log(`[PROGRESS TRACKER] Updated ${assetId} - Stage: ${stageName}, Progress: ${tracking.overall.progress}%`);
    return tracking;
  }

  /**
   * Complete asset tracking
   */
  public completeAssetTracking(
    assetId: string,
    success: boolean,
    finalMetadata?: any
  ): AssetProgressTracking | null {
    const tracking = this.activeTracking.get(assetId);
    if (!tracking) return null;

    // Mark all stages as completed or failed
    tracking.stages.forEach(stage => {
      if (stage.status !== 'completed') {
        stage.status = success ? 'completed' : 'failed';
        stage.endTime = Date.now();
      }
    });

    tracking.overall.progress = success ? 100 : 0;
    tracking.overall.elapsedTime = Date.now() - new Date(tracking.metadata.timestamp).getTime();

    // Generate completion commentary
    const completionCommentary = this.generateCompletionCommentary(tracking, success, finalMetadata);
    tracking.commentary.push(completionCommentary);

    // End performance monitoring
    this.performanceMonitor.endTracking(`asset-${assetId}`, success, finalMetadata);

    tracking.metadata.lastUpdated = new Date().toISOString();
    
    console.log(`[PROGRESS TRACKER] Completed asset tracking: ${assetId} (${success ? 'SUCCESS' : 'FAILED'})`);
    return tracking;
  }

  /**
   * Get current progress for asset
   */
  public getAssetProgress(assetId: string): AssetProgressTracking | null {
    return this.activeTracking.get(assetId) || null;
  }

  /**
   * Get all active trackings
   */
  public getAllActiveTracking(): AssetProgressTracking[] {
    return Array.from(this.activeTracking.values());
  }

  /**
   * Start workflow tracking
   */
  public startWorkflowTracking(
    workflowId: string,
    sessionId: string,
    workflowType: CreativeWorkflowProgress['workflowType']
  ): CreativeWorkflowProgress {
    const workflow: CreativeWorkflowProgress = {
      workflowId,
      sessionId,
      workflowType,
      
      overall: {
        progress: 0,
        currentPhase: 'Initialization',
        estimatedCompletion: Date.now() + 300000 // 5 minutes default
      },
      
      assets: [],
      commentary: [this.generateWorkflowCommentary(workflowType)],
      
      insights: {
        creativeTrends: [],
        brandOpportunities: [],
        optimizationSuggestions: []
      }
    };

    this.workflowTracking.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Update workflow with asset progress
   */
  public updateWorkflowProgress(workflowId: string): CreativeWorkflowProgress | null {
    const workflow = this.workflowTracking.get(workflowId);
    if (!workflow) return null;

    // Get all assets for this workflow
    const workflowAssets = Array.from(this.activeTracking.values())
      .filter(asset => asset.sessionId === workflow.sessionId);

    workflow.assets = workflowAssets;

    if (workflowAssets.length > 0) {
      // Calculate overall workflow progress
      const totalProgress = workflowAssets.reduce((sum, asset) => sum + asset.overall.progress, 0);
      workflow.overall.progress = Math.round(totalProgress / workflowAssets.length);

      // Update current phase
      const activeAsset = workflowAssets.find(asset => asset.overall.progress < 100);
      workflow.overall.currentPhase = activeAsset?.overall.currentStage || 'Completed';

      // Generate insights
      workflow.insights = this.generateWorkflowInsights(workflowAssets);
    }

    return workflow;
  }

  /**
   * Create asset generation stages based on type and quality
   */
  private createAssetGenerationStages(assetType: string, quality: string): ProgressStage[] {
    const baseStages: ProgressStage[] = [
      {
        id: crypto.randomUUID(),
        name: 'Prompt Analysis',
        description: 'Analyzing creative requirements and optimizing generation prompts',
        estimatedDuration: 3000,
        weight: 0.1,
        status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        name: 'Style Configuration',
        description: 'Configuring visual style and creative parameters',
        estimatedDuration: 2000,
        weight: 0.1,
        status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        name: 'AI Generation',
        description: 'Generating visual asset with advanced AI models',
        estimatedDuration: this.getGenerationDuration(assetType, quality),
        weight: 0.6,
        status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        name: 'Quality Assessment',
        description: 'Evaluating creative quality and brand alignment',
        estimatedDuration: 4000,
        weight: 0.1,
        status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        name: 'Storage & Delivery',
        description: 'Processing and delivering your creative asset',
        estimatedDuration: 3000,
        weight: 0.1,
        status: 'pending'
      }
    ];

    // Add specialized stages based on asset type
    if (assetType === 'product-hero') {
      baseStages.splice(2, 0, {
        id: crypto.randomUUID(),
        name: 'Product Enhancement',
        description: 'Optimizing product presentation and visual impact',
        estimatedDuration: 8000,
        weight: 0.2,
        status: 'pending'
      });
    }

    if (quality === 'premium') {
      baseStages.splice(-1, 0, {
        id: crypto.randomUUID(),
        name: 'Premium Polish',
        description: 'Applying premium finishing touches and refinements',
        estimatedDuration: 10000,
        weight: 0.15,
        status: 'pending'
      });
    }

    // Normalize weights
    const totalWeight = baseStages.reduce((sum, stage) => sum + stage.weight, 0);
    baseStages.forEach(stage => {
      stage.weight = stage.weight / totalWeight;
    });

    return baseStages;
  }

  /**
   * Generate initial commentary from David
   */
  private generateInitialCommentary(
    assetType: string, 
    quality: string, 
    culturalContext?: string
  ): DavidCommentary {
    const assetTypeNames: Record<string, string> = {
      'product-hero': 'product hero shot',
      'lifestyle-scene': 'lifestyle scene',
      'background': 'background element',
      'mood-board': 'mood board',
      'style-frame': 'style frame'
    };

    const qualityDescriptions: Record<string, string> = {
      'draft': 'quick concept',
      'standard': 'professional quality',
      'high': 'premium standard',
      'premium': 'luxury-grade excellence'
    };

    const assetName = assetTypeNames[assetType] || assetType;
    const qualityDesc = qualityDescriptions[quality] || quality;

    let message = `Excellent! I'm crafting your ${assetName} with ${qualityDesc}. `;
    
    if (culturalContext === 'japanese') {
      message += "I'm incorporating Japanese aesthetic principles of harmony and refined elegance. ";
    } else if (culturalContext === 'western') {
      message += "I'm applying dynamic Western visual approaches for maximum impact. ";
    }

    message += "This will be a compelling piece that elevates your brand story.";

    return {
      stage: 'initialization',
      message,
      tone: 'excited',
      insights: [
        `${assetName} generation optimized for ${qualityDesc}`,
        'Creative process tailored to your brand requirements',
        culturalContext ? `Cultural adaptation for ${culturalContext} market` : 'Universal design excellence'
      ].filter(Boolean) as string[],
      brandConsiderations: [
        'Maintaining brand consistency throughout generation',
        'Ensuring commercial viability and market appeal',
        'Balancing creativity with strategic objectives'
      ]
    };
  }

  /**
   * Generate progress commentary during stages
   */
  private generateProgressCommentary(
    tracking: AssetProgressTracking,
    stageName: string,
    progress: number,
    metadata?: any
  ): DavidCommentary | null {
    // Generate commentary for significant milestones
    if (progress < 25 || progress % 25 !== 0) return null;

    const stageCommentary: Record<string, (progress: number) => DavidCommentary> = {
      'Prompt Analysis': (p) => ({
        stage: stageName,
        message: "I'm analyzing your creative brief and optimizing the generation parameters. The visual concept is coming together beautifully.",
        tone: 'explanatory',
        insights: ['Creative prompt optimization in progress', 'Brand alignment scoring active']
      }),

      'Style Configuration': (p) => ({
        stage: stageName,
        message: "Perfect! I'm configuring the visual style to match your brand personality. This will ensure authentic creative expression.",
        tone: 'professional',
        insights: ['Visual style parameters configured', 'Brand-specific adaptations applied']
      }),

      'AI Generation': (p) => ({
        stage: stageName,
        message: p < 50 ? 
          "The AI is working its magic! I can see the visual elements taking shape with remarkable detail and creativity." :
          "Wonderful progress! The asset is developing beautifully. I'm particularly pleased with the composition and color harmony.",
        tone: 'encouraging',
        insights: p < 50 ? 
          ['Advanced AI models processing your vision', 'Creative elements materializing'] :
          ['Visual composition achieving excellent balance', 'Color theory principles successfully applied']
      }),

      'Product Enhancement': (p) => ({
        stage: stageName,
        message: "I'm enhancing the product presentation to maximize visual impact. This is where your product truly becomes the hero of the story.",
        tone: 'excited',
        insights: ['Product positioning optimization active', 'Visual impact enhancement in progress']
      }),

      'Quality Assessment': (p) => ({
        stage: stageName,
        message: "Excellent! I'm evaluating the creative quality against professional standards. The brand alignment is looking very strong.",
        tone: 'thoughtful',
        insights: ['Professional quality standards validation', 'Brand consistency verification']
      }),

      'Premium Polish': (p) => ({
        stage: stageName,
        message: "Adding those premium finishing touches that make all the difference. This level of refinement will truly set your brand apart.",
        tone: 'professional',
        insights: ['Premium quality enhancements applied', 'Luxury-grade finishing touches']
      })
    };

    const generator = stageCommentary[stageName];
    return generator ? generator(progress) : null;
  }

  /**
   * Generate completion commentary
   */
  private generateCompletionCommentary(
    tracking: AssetProgressTracking,
    success: boolean,
    metadata?: any
  ): DavidCommentary {
    if (success) {
      const qualityScore = tracking.creative.overallScore;
      const brandScore = tracking.creative.brandAlignment;

      let message = "Fantastic! Your asset is complete and I'm thrilled with the results. ";
      
      if (qualityScore > 0.9) {
        message += "The quality exceeded expectations - this is truly premium work. ";
      } else if (qualityScore > 0.7) {
        message += "The quality is excellent and perfectly suited for your needs. ";
      }

      if (brandScore > 0.8) {
        message += "The brand alignment is spot-on, maintaining perfect consistency with your visual identity.";
      }

      return {
        stage: 'completion',
        message,
        tone: 'excited',
        insights: [
          `Creative quality achieved: ${Math.round(qualityScore * 100)}%`,
          `Brand alignment score: ${Math.round(brandScore * 100)}%`,
          'Asset ready for production use'
        ],
        tips: [
          'Consider this asset for hero positioning in your campaign',
          'The visual style can be adapted for additional asset variations',
          'This quality level maintains consistency across your brand family'
        ]
      };
    } else {
      return {
        stage: 'completion',
        message: "I encountered an issue with this generation, but don't worry - I'm already analyzing how to optimize for better results. This is part of the creative process.",
        tone: 'professional',
        insights: [
          'Generation parameters being analyzed for optimization',
          'Alternative approaches being prepared',
          'Quality standards maintained for retry attempts'
        ],
        tips: [
          'Consider adjusting the prompt complexity',
          'Alternative style approaches may yield better results',
          'I can retry with optimized parameters'
        ]
      };
    }
  }

  /**
   * Generate workflow commentary
   */
  private generateWorkflowCommentary(workflowType: string): DavidCommentary {
    const messages: Record<string, DavidCommentary> = {
      'asset_generation': {
        stage: 'workflow_start',
        message: "Let's create some remarkable visual assets! I'm coordinating the entire generation workflow to ensure each piece perfectly serves your creative vision.",
        tone: 'excited',
        insights: ['Multiple asset generation workflow initiated', 'Creative consistency protocols active']
      },
      'style_development': {
        stage: 'workflow_start',
        message: "I'm developing a comprehensive visual style that will define your brand's creative direction. This foundational work will guide all future creative decisions.",
        tone: 'thoughtful',
        insights: ['Visual style development in progress', 'Brand personality mapping active']
      },
      'brand_analysis': {
        stage: 'workflow_start',
        message: "I'm conducting a thorough analysis of your brand's visual opportunities. This strategic foundation will inform all our creative decisions.",
        tone: 'professional',
        insights: ['Brand analysis protocols initiated', 'Market positioning assessment active']
      },
      'creative_review': {
        stage: 'workflow_start',
        message: "I'm reviewing all creative elements to ensure they meet our quality standards and strategic objectives. Excellence is in the details.",
        tone: 'professional',
        insights: ['Comprehensive creative review initiated', 'Quality assurance protocols active']
      }
    };

    return messages[workflowType] || messages['asset_generation'];
  }

  /**
   * Generate workflow insights
   */
  private generateWorkflowInsights(assets: AssetProgressTracking[]): CreativeWorkflowProgress['insights'] {
    const creativeTrends: string[] = [];
    const brandOpportunities: string[] = [];
    const optimizationSuggestions: string[] = [];

    // Analyze asset types and qualities
    const assetTypes = new Set(assets.map(a => a.assetType));
    const averageQuality = assets.reduce((sum, a) => sum + a.creative.overallScore, 0) / assets.length;
    const averageBrandAlignment = assets.reduce((sum, a) => sum + a.creative.brandAlignment, 0) / assets.length;

    // Generate trends
    if (assetTypes.has('product-hero') && assetTypes.has('lifestyle-scene')) {
      creativeTrends.push('Product-lifestyle integration creating strong narrative');
    }
    if (averageQuality > 0.8) {
      creativeTrends.push('Consistently high creative quality across asset portfolio');
    }

    // Generate opportunities
    if (averageBrandAlignment > 0.85) {
      brandOpportunities.push('Strong brand consistency enables portfolio expansion');
    }
    if (assets.some(a => a.creative.marketAppeal > 0.9)) {
      brandOpportunities.push('High market appeal assets suitable for premium positioning');
    }

    // Generate optimizations
    if (assets.some(a => a.performance.bottlenecks.length > 0)) {
      optimizationSuggestions.push('Address generation bottlenecks for improved workflow efficiency');
    }
    if (averageQuality < 0.7) {
      optimizationSuggestions.push('Consider quality parameter optimization for better results');
    }

    return {
      creativeTrends,
      brandOpportunities,
      optimizationSuggestions
    };
  }

  /**
   * Get generation duration based on asset type and quality
   */
  private getGenerationDuration(assetType: string, quality: string): number {
    const baseDurations: Record<string, number> = {
      'background': 15000,
      'product-hero': 25000,
      'lifestyle-scene': 30000,
      'mood-board': 20000,
      'style-frame': 18000
    };

    const qualityMultipliers: Record<string, number> = {
      'draft': 0.6,
      'standard': 1.0,
      'high': 1.4,
      'premium': 2.0
    };

    const baseDuration = baseDurations[assetType] || 20000;
    const multiplier = qualityMultipliers[quality] || 1.0;
    
    return Math.round(baseDuration * multiplier);
  }

  /**
   * Calculate total duration for stages
   */
  private calculateTotalDuration(stages: ProgressStage[]): number {
    return stages.reduce((total, stage) => total + stage.estimatedDuration, 0);
  }

  /**
   * Predict quality based on parameters
   */
  private predictQuality(quality: string, promptComplexity: number): number {
    const qualityScores: Record<string, number> = {
      'draft': 0.6,
      'standard': 0.75,
      'high': 0.85,
      'premium': 0.95
    };

    const baseScore = qualityScores[quality] || 0.75;
    const complexityImpact = (promptComplexity - 0.5) * 0.1; // -0.05 to +0.05
    
    return Math.max(0.5, Math.min(1.0, baseScore + complexityImpact));
  }

  /**
   * Health check for progress tracking system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test basic tracking functionality
      const testAssetId = crypto.randomUUID();
      const tracking = this.startAssetTracking(testAssetId, 'test-asset', 'standard', 'health-check');
      
      // Test progress update
      this.updateStageProgress(testAssetId, 'Prompt Analysis', 50);
      
      // Test completion
      this.completeAssetTracking(testAssetId, true);
      
      // Clean up
      this.activeTracking.delete(testAssetId);
      
      console.log("[PROGRESS TRACKER] Health check completed successfully");
      return true;
    } catch (error) {
      console.error("[PROGRESS TRACKER] Health check failed:", error);
      return false;
    }
  }
}