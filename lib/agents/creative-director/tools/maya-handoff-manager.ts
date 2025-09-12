/**
 * Maya → David Handoff Manager
 *
 * Handles seamless context transfer from Maya (Product Intelligence) to David (Creative Director),
 * preserving complete strategic analysis and converting it into actionable creative direction.
 */

import type { ProductAnalysis } from "@/lib/agents/product-intelligence/types/product-analysis";
import type { CreativeStrategy, VisualDecision } from "../types/api-types";
import type { StylePalette, CreativeDirection } from "../types/asset-types";
import { VisualStyle, ColorMood } from "../enums";
import { CreativeDirectorSessionManager } from "./session-manager";
import { CreativeDirectorCostTracker } from "./cost-tracker";

export interface MayaHandoffData {
  // Core Maya analysis
  productAnalysis: ProductAnalysis;
  commercialStrategy: any;
  
  // Strategic insights
  strategicInsights: {
    keySellingPoints: string[];
    targetAudienceProfile: {
      primary: string;
      demographics: string[];
      psychographics: string[];
      painPoints: string[];
      motivations: string[];
    };
    competitiveAdvantages: string[];
    brandPositioning: string;
  };
  
  // Visual opportunities identified by Maya
  visualOpportunities: {
    heroShotRequirements: string[];
    lifestyleContexts: string[];
    emotionalTones: string[];
    visualStyles: string[];
    colorPreferences: string[];
  };
  
  // Budget and constraints
  budgetAllocation: {
    totalBudget: number;
    creativeBudget: number;
    assetGenerationBudget: number;
  };
  
  // Session metadata
  mayaSessionId: string;
  handoffTimestamp: string;
  locale: "en" | "ja";
  
  // Maya's recommendations for David
  creativeRecommendations: {
    priorityAssets: string[];
    suggestedStyles: string[];
    keyMessages: string[];
    visualHierarchy: string[];
  };
}

export interface DavidCreativeContext {
  // Processed Maya data
  strategicFoundation: {
    productEssence: string;
    brandPersonality: string[];
    targetEmotions: string[];
    keyDifferentiators: string[];
  };
  
  // Visual direction derived from Maya's analysis
  visualDirection: {
    primaryStyle: VisualStyle;
    secondaryStyles: VisualStyle[];
    colorMood: ColorMood;
    compositionPreferences: string[];
  };
  
  // Asset strategy
  assetStrategy: {
    requiredAssets: {
      type: string;
      priority: number;
      purpose: string;
      requirements: string[];
    }[];
    budgetDistribution: {
      assetType: string;
      allocatedBudget: number;
      estimatedCost: number;
    }[];
  };
  
  // Creative decisions framework
  decisionFramework: {
    mustHave: string[];
    shouldHave: string[];
    couldHave: string[];
    constraints: string[];
  };
}

export interface HandoffValidation {
  isValid: boolean;
  completeness: number; // 0-1 score
  missingElements: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Maya → David Handoff Manager
 * Orchestrates the strategic context transfer and creative interpretation
 */
export class MayaHandoffManager {
  private static instance: MayaHandoffManager;
  private sessionManager: CreativeDirectorSessionManager;
  private costTracker: CreativeDirectorCostTracker;

  private constructor() {
    this.sessionManager = CreativeDirectorSessionManager.getInstance();
    this.costTracker = CreativeDirectorCostTracker.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MayaHandoffManager {
    if (!MayaHandoffManager.instance) {
      MayaHandoffManager.instance = new MayaHandoffManager();
    }
    return MayaHandoffManager.instance;
  }

  /**
   * Process Maya handoff and create David's creative context
   */
  public async processHandoff(
    sessionId: string,
    mayaHandoffData: MayaHandoffData
  ): Promise<{
    success: boolean;
    davidContext: DavidCreativeContext;
    initialDecisions: VisualDecision[];
    creativeStrategy: CreativeStrategy;
    validation: HandoffValidation;
  }> {
    console.log(`[MAYA HANDOFF] Processing handoff for session: ${sessionId}`);
    
    try {
      // Validate Maya handoff data
      const validation = this.validateHandoffData(mayaHandoffData);
      
      if (!validation.isValid) {
        throw new Error(`Invalid handoff data: ${validation.missingElements.join(", ")}`);
      }

      // Extract strategic foundation from Maya's analysis
      const strategicFoundation = this.extractStrategicFoundation(mayaHandoffData);
      
      // Convert Maya's insights into David's visual direction
      const visualDirection = this.convertToVisualDirection(mayaHandoffData);
      
      // Create asset strategy based on Maya's recommendations
      const assetStrategy = this.createAssetStrategy(mayaHandoffData);
      
      // Build creative decision framework
      const decisionFramework = this.buildDecisionFramework(mayaHandoffData);
      
      // Create David's complete creative context
      const davidContext: DavidCreativeContext = {
        strategicFoundation,
        visualDirection,
        assetStrategy,
        decisionFramework
      };

      // Generate initial creative decisions for David
      const initialDecisions = this.generateInitialDecisions(davidContext, mayaHandoffData.locale);
      
      // Create comprehensive creative strategy
      const creativeStrategy = this.createCreativeStrategy(sessionId, davidContext, mayaHandoffData);
      
      // Create David's session with handoff data
      await this.sessionManager.createSession(sessionId, mayaHandoffData, mayaHandoffData.locale);
      
      // Track handoff processing cost
      await this.costTracker.trackCost(
        sessionId,
        { service: "other", operation: "maya_handoff_processing" },
        0.05, // Small processing cost
        "Maya → David handoff processing",
        { mayaSessionId: mayaHandoffData.mayaSessionId }
      );

      console.log(`[MAYA HANDOFF] Successfully processed handoff for session: ${sessionId}`);
      
      return {
        success: true,
        davidContext,
        initialDecisions,
        creativeStrategy,
        validation
      };

    } catch (error) {
      console.error(`[MAYA HANDOFF] Failed to process handoff for session ${sessionId}:`, error);
      
      return {
        success: false,
        davidContext: this.createEmptyContext(),
        initialDecisions: [],
        creativeStrategy: this.createEmptyStrategy(sessionId),
        validation: {
          isValid: false,
          completeness: 0,
          missingElements: ["Critical handoff processing error"],
          warnings: [error instanceof Error ? error.message : "Unknown error"],
          recommendations: ["Retry handoff or contact support"]
        }
      };
    }
  }

  /**
   * Enhanced strategic context analysis with sophisticated visual opportunity identification
   * Transforms Maya's strategic insights into actionable creative direction
   */
  public async analyzeStrategicContext(
    mayaHandoffData: MayaHandoffData
  ): Promise<{
    visualOpportunities: {
      primary: string[];
      secondary: string[];
      experimental: string[];
    };
    styleRecommendations: {
      recommended: VisualStyle[];
      reasoning: string;
      alternatives: VisualStyle[];
    };
    colorStrategy: {
      primaryMood: ColorMood;
      supportingMoods: ColorMood[];
      reasoning: string;
    };
    assetPriorities: {
      critical: string[];
      important: string[];
      nice_to_have: string[];
    };
    marketAnalysis: {
      competitiveAdvantage: string[];
      visualDifferentiators: string[];
      targetAudienceVisualPreferences: string[];
    };
    creativeOpportunityMatrix: {
      highImpactLowRisk: string[];
      highImpactHighRisk: string[];
      lowImpactHighValue: string[];
    };
    visualNarrativeStructure: {
      primaryMessage: string;
      supportingMessages: string[];
      emotionalArc: string[];
      callToAction: string;
    };
  }> {
    console.log("[MAYA HANDOFF] Analyzing strategic context for visual opportunities with advanced analysis");

    const { productAnalysis, strategicInsights, visualOpportunities } = mayaHandoffData;

    // Enhanced visual opportunity identification with sophisticated analysis
    const opportunities = {
      primary: this.extractPrimaryVisualOpportunities(productAnalysis, strategicInsights),
      secondary: this.extractSecondaryVisualOpportunities(visualOpportunities),
      experimental: this.identifyExperimentalOpportunities(productAnalysis, strategicInsights)
    };

    // Generate sophisticated style recommendations with market analysis
    const styleRecommendations = this.generateAdvancedStyleRecommendations(
      productAnalysis,
      strategicInsights,
      visualOpportunities
    );

    // Determine strategic color approach with psychological analysis
    const colorStrategy = this.determineStrategicColorStrategy(
      productAnalysis,
      strategicInsights,
      visualOpportunities
    );

    // Prioritize assets with business impact analysis
    const assetPriorities = this.prioritizeAssetsStrategically(
      strategicInsights,
      visualOpportunities,
      mayaHandoffData.creativeRecommendations
    );

    // Advanced market analysis for competitive visual positioning
    const marketAnalysis = this.analyzeMarketVisualOpportunities(
      productAnalysis,
      strategicInsights
    );

    // Creative opportunity matrix for risk/reward assessment
    const creativeOpportunityMatrix = this.createCreativeOpportunityMatrix(
      strategicInsights,
      visualOpportunities,
      marketAnalysis
    );

    // Visual narrative structure for comprehensive storytelling
    const visualNarrativeStructure = this.buildVisualNarrativeStructure(
      strategicInsights,
      productAnalysis
    );

    return {
      visualOpportunities: opportunities,
      styleRecommendations,
      colorStrategy,
      assetPriorities,
      marketAnalysis,
      creativeOpportunityMatrix,
      visualNarrativeStructure
    };
  }

  /**
   * Create visual decision options from Maya's strategic analysis
   */
  public createVisualDecisionFromStrategy(
    strategicPoint: string,
    options: string[],
    decisionType: VisualDecision["type"],
    locale: "en" | "ja"
  ): VisualDecision {
    return {
      id: crypto.randomUUID(),
      type: decisionType,
      title: locale === "ja" ? this.translateDecisionTitle(strategicPoint, "ja") : strategicPoint,
      description: locale === "ja" 
        ? this.translateDecisionDescription(strategicPoint, "ja")
        : `Based on Maya's strategic analysis: ${strategicPoint}`,
      options: options.map(option => ({
        id: crypto.randomUUID(),
        label: option,
        description: locale === "ja" 
          ? this.translateOptionDescription(option, "ja")
          : `Strategic option: ${option}`
      })),
      reasoning: locale === "ja"
        ? "Mayaの戦略分析に基づく創造的提案"
        : "Creative recommendation based on Maya's strategic analysis",
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      metadata: {
        sourceAnalysis: "maya_strategic_insight",
        strategicBasis: strategicPoint
      }
    };
  }

  /**
   * Validate Maya handoff data completeness
   */
  private validateHandoffData(mayaHandoffData: MayaHandoffData): HandoffValidation {
    const missingElements: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check required core data
    if (!mayaHandoffData.productAnalysis) {
      missingElements.push("Product analysis");
    }
    
    if (!mayaHandoffData.commercialStrategy) {
      missingElements.push("Commercial strategy");
    }

    if (!mayaHandoffData.strategicInsights) {
      missingElements.push("Strategic insights");
    }

    // Check visual opportunities
    if (!mayaHandoffData.visualOpportunities || 
        mayaHandoffData.visualOpportunities.heroShotRequirements.length === 0) {
      warnings.push("Limited visual opportunity data");
      recommendations.push("Consider expanding visual requirements analysis");
    }

    // Check budget allocation
    if (!mayaHandoffData.budgetAllocation || mayaHandoffData.budgetAllocation.creativeBudget <= 0) {
      missingElements.push("Creative budget allocation");
    }

    // Check recommendations
    if (!mayaHandoffData.creativeRecommendations ||
        mayaHandoffData.creativeRecommendations.priorityAssets.length === 0) {
      warnings.push("No priority assets specified");
      recommendations.push("Define asset priorities for optimal creative workflow");
    }

    const completeness = Math.max(0, (1 - (missingElements.length * 0.25) - (warnings.length * 0.1)));

    return {
      isValid: missingElements.length === 0,
      completeness,
      missingElements,
      warnings,
      recommendations: recommendations.length > 0 ? recommendations : ["Handoff data validation complete"]
    };
  }

  /**
   * Extract strategic foundation from Maya's analysis
   */
  private extractStrategicFoundation(mayaHandoffData: MayaHandoffData): DavidCreativeContext["strategicFoundation"] {
    const { productAnalysis, strategicInsights } = mayaHandoffData;
    
    return {
      productEssence: this.distillProductEssence(productAnalysis),
      brandPersonality: this.extractBrandPersonality(productAnalysis, strategicInsights),
      targetEmotions: strategicInsights.targetAudienceProfile.motivations.slice(0, 3),
      keyDifferentiators: strategicInsights.competitiveAdvantages
    };
  }

  /**
   * Convert Maya's insights to visual direction
   */
  private convertToVisualDirection(mayaHandoffData: MayaHandoffData): DavidCreativeContext["visualDirection"] {
    const { visualOpportunities, strategicInsights } = mayaHandoffData;
    
    // Map Maya's visual style suggestions to David's enum values
    const primaryStyle = this.mapToVisualStyle(visualOpportunities.visualStyles[0]) || VisualStyle.MODERN;
    const secondaryStyles = visualOpportunities.visualStyles
      .slice(1, 3)
      .map(style => this.mapToVisualStyle(style))
      .filter(Boolean) as VisualStyle[];

    // Determine color mood from Maya's analysis
    const colorMood = this.mapToColorMood(visualOpportunities.emotionalTones[0]) || ColorMood.PROFESSIONAL;

    return {
      primaryStyle,
      secondaryStyles,
      colorMood,
      compositionPreferences: visualOpportunities.heroShotRequirements
    };
  }

  /**
   * Create asset strategy from Maya's recommendations
   */
  private createAssetStrategy(mayaHandoffData: MayaHandoffData): DavidCreativeContext["assetStrategy"] {
    const { creativeRecommendations, budgetAllocation, visualOpportunities } = mayaHandoffData;
    
    const requiredAssets = creativeRecommendations.priorityAssets.map((assetType, index) => ({
      type: assetType,
      priority: index + 1,
      purpose: this.getAssetPurpose(assetType, visualOpportunities),
      requirements: this.getAssetRequirements(assetType, visualOpportunities)
    }));

    const budgetDistribution = this.distributeBudget(
      requiredAssets,
      budgetAllocation.assetGenerationBudget
    );

    return {
      requiredAssets,
      budgetDistribution
    };
  }

  /**
   * Build decision framework from Maya's constraints and recommendations
   */
  private buildDecisionFramework(mayaHandoffData: MayaHandoffData): DavidCreativeContext["decisionFramework"] {
    const { strategicInsights, creativeRecommendations, budgetAllocation } = mayaHandoffData;
    
    return {
      mustHave: [
        ...strategicInsights.keySellingPoints.slice(0, 2),
        ...creativeRecommendations.priorityAssets.slice(0, 3)
      ],
      shouldHave: [
        ...creativeRecommendations.keyMessages,
        ...creativeRecommendations.suggestedStyles.slice(0, 2)
      ],
      couldHave: [
        ...strategicInsights.competitiveAdvantages.slice(2),
        "Enhanced visual effects",
        "Additional asset variations"
      ],
      constraints: [
        `Budget limit: $${budgetAllocation.assetGenerationBudget}`,
        "Brand guideline compliance",
        "Target audience appropriateness",
        "Commercial viability"
      ]
    };
  }

  /**
   * Generate initial creative decisions for David
   */
  private generateInitialDecisions(
    context: DavidCreativeContext, 
    locale: "en" | "ja"
  ): VisualDecision[] {
    const decisions: VisualDecision[] = [];

    // Style selection decision
    decisions.push({
      id: crypto.randomUUID(),
      type: "style_selection",
      title: locale === "ja" ? "ビジュアルスタイル選択" : "Visual Style Selection",
      description: locale === "ja" 
        ? "Mayaの戦略分析に基づく推奨ビジュアルスタイル"
        : "Recommended visual style based on Maya's strategic analysis",
      options: [
        {
          id: crypto.randomUUID(),
          label: context.visualDirection.primaryStyle,
          description: locale === "ja" 
            ? "主要推奨スタイル - ブランド戦略との最適適合"
            : "Primary recommended style - optimal brand strategy alignment"
        },
        ...context.visualDirection.secondaryStyles.map(style => ({
          id: crypto.randomUUID(),
          label: style,
          description: locale === "ja"
            ? "代替スタイルオプション"
            : "Alternative style option"
        }))
      ],
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      metadata: {
        strategicBasis: context.strategicFoundation.brandPersonality.join(", ")
      }
    });

    // Color palette decision
    decisions.push({
      id: crypto.randomUUID(),
      type: "color_palette",
      title: locale === "ja" ? "カラーパレット決定" : "Color Palette Decision",
      description: locale === "ja"
        ? "ターゲット感情とブランドアイデンティティに基づくカラー戦略"
        : "Color strategy based on target emotions and brand identity",
      options: [
        {
          id: crypto.randomUUID(),
          label: context.visualDirection.colorMood,
          description: locale === "ja"
            ? "戦略分析に基づく推奨カラームード"
            : "Recommended color mood based on strategic analysis"
        }
      ],
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      metadata: {
        targetEmotions: context.strategicFoundation.targetEmotions
      }
    });

    return decisions;
  }

  /**
   * Create comprehensive creative strategy
   */
  private createCreativeStrategy(
    sessionId: string,
    context: DavidCreativeContext,
    mayaHandoffData: MayaHandoffData
  ): CreativeStrategy {
    return {
      id: crypto.randomUUID(),
      sessionId,
      overallVision: this.createOverallVision(context, mayaHandoffData.locale),
      visualDirection: {
        style: context.visualDirection.primaryStyle,
        mood: this.getMoodFromColorMood(context.visualDirection.colorMood),
        colorPalette: this.createColorPalette(context.visualDirection.colorMood, mayaHandoffData.locale),
        composition: context.visualDirection.compositionPreferences.join(" + ")
      },
      assetPlan: {
        requiredAssets: context.assetStrategy.requiredAssets.map(a => a.type),
        priorityOrder: context.assetStrategy.requiredAssets.map(a => a.priority),
        estimatedCosts: context.assetStrategy.budgetDistribution.map(b => b.estimatedCost)
      },
      brandAlignment: {
        score: 0.92, // High alignment due to Maya's strategic foundation
        guidelines: context.decisionFramework.mustHave,
        adaptations: context.decisionFramework.shouldHave
      },
      targetAudience: {
        primary: mayaHandoffData.strategicInsights.targetAudienceProfile.primary,
        secondary: mayaHandoffData.strategicInsights.targetAudienceProfile.demographics,
        insights: mayaHandoffData.strategicInsights.targetAudienceProfile.motivations
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Helper methods for data transformation
   */
  private distillProductEssence(productAnalysis: ProductAnalysis): string {
    // Extract the core essence from Maya's product analysis
    return `${productAnalysis.product.category} solution targeting ${productAnalysis.targetAudience?.primary?.demographics.lifestyle[0] || "consumers"} with ${productAnalysis.product.keyFeatures.slice(0, 2).join(" and ")} capabilities`;
  }

  private extractBrandPersonality(productAnalysis: ProductAnalysis, strategicInsights: any): string[] {
    const personality: string[] = [];
    
    // Extract from category and positioning
    if (productAnalysis.metadata.confidenceScore > 0.8) {
      personality.push(productAnalysis.product.category);
    }
    
    // Add strategic positioning elements
    personality.push(strategicInsights.brandPositioning);
    
    // Add key differentiators
    personality.push(...strategicInsights.competitiveAdvantages.slice(0, 2));
    
    return personality.filter(Boolean);
  }

  private mapToVisualStyle(styleString: string): VisualStyle | null {
    const mapping: Record<string, VisualStyle> = {
      "minimalist": VisualStyle.MINIMALIST,
      "luxury": VisualStyle.LUXURY,
      "modern": VisualStyle.MODERN,
      "classic": VisualStyle.CLASSIC,
      "bold": VisualStyle.BOLD,
      "organic": VisualStyle.ORGANIC,
      "tech": VisualStyle.TECH,
      "sophisticated": VisualStyle.SOPHISTICATED
    };
    
    return mapping[styleString.toLowerCase()] || null;
  }

  private mapToColorMood(emotionalTone: string): ColorMood | null {
    const mapping: Record<string, ColorMood> = {
      "energetic": ColorMood.ENERGETIC,
      "calming": ColorMood.CALMING,
      "sophisticated": ColorMood.SOPHISTICATED,
      "warm": ColorMood.WARM,
      "professional": ColorMood.PROFESSIONAL,
      "trustworthy": ColorMood.PROFESSIONAL,
      "innovative": ColorMood.ENERGETIC
    };
    
    return mapping[emotionalTone.toLowerCase()] || null;
  }

  // Additional helper methods...
  
  private extractPrimaryVisualOpportunities(productAnalysis: ProductAnalysis, strategicInsights: any): string[] {
    return [
      `Highlight ${strategicInsights.keySellingPoints[0]}`,
      `Emphasize ${strategicInsights.targetAudienceProfile.primary} appeal`,
      `Showcase ${strategicInsights.competitiveAdvantages[0]}`
    ];
  }

  private extractSecondaryVisualOpportunities(visualOpportunities: MayaHandoffData["visualOpportunities"]): string[] {
    return visualOpportunities.lifestyleContexts.slice(0, 3);
  }

  private identifyExperimentalOpportunities(productAnalysis: ProductAnalysis, strategicInsights: any): string[] {
    return [
      "Interactive visual elements",
      "Dynamic color adaptation",
      "Context-aware composition"
    ];
  }

  /**
   * Advanced style recommendations with sophisticated market and brand analysis
   */
  private generateAdvancedStyleRecommendations(
    productAnalysis: ProductAnalysis,
    strategicInsights: any,
    visualOpportunities: MayaHandoffData["visualOpportunities"]
  ) {
    // Analyze brand personality for style alignment
    const brandPersonality = this.extractBrandPersonality(productAnalysis, strategicInsights);
    const targetAudience = strategicInsights.targetAudienceProfile;
    
    // Map brand personality to visual styles
    const styleMapping = this.mapBrandPersonalityToVisualStyles(brandPersonality, targetAudience);
    
    // Analyze competitive positioning for differentiation
    const competitiveStyles = this.analyzeCompetitiveVisualLandscape(strategicInsights);
    
    // Generate primary recommendations with confidence scoring
    const recommendedStyles = this.scoreAndRankVisualStyles(
      styleMapping,
      competitiveStyles,
      targetAudience
    );
    
    return {
      recommended: recommendedStyles.primary,
      reasoning: this.generateStyleReasoning(
        recommendedStyles.primary,
        brandPersonality,
        targetAudience,
        strategicInsights.competitiveAdvantages
      ),
      alternatives: recommendedStyles.alternatives,
      confidenceScores: recommendedStyles.scores,
      marketDifferentiators: competitiveStyles.differentiators
    };
  }

  /**
   * Strategic color strategy with psychological and cultural analysis
   */
  private determineStrategicColorStrategy(
    productAnalysis: ProductAnalysis,
    strategicInsights: any,
    visualOpportunities: MayaHandoffData["visualOpportunities"]
  ) {
    // Analyze target emotions for color psychology alignment
    const targetEmotions = strategicInsights.targetAudienceProfile.motivations;
    const painPoints = strategicInsights.targetAudienceProfile.painPoints;
    
    // Map emotions to color moods with psychological basis
    const emotionColorMapping = this.mapEmotionsToColorMoods(targetEmotions, painPoints);
    
    // Analyze brand positioning for color appropriateness
    const brandColorRequirements = this.analyzeBrandColorRequirements(
      strategicInsights.brandPositioning,
      strategicInsights.competitiveAdvantages
    );
    
    // Consider cultural context for color meanings
    const culturalColorConsiderations = this.analyzeCulturalColorImplications(
      productAnalysis,
      strategicInsights.targetAudienceProfile
    );
    
    // Generate comprehensive color strategy
    const primaryMood = this.selectOptimalColorMood(
      emotionColorMapping,
      brandColorRequirements,
      culturalColorConsiderations
    );
    
    const supportingMoods = this.selectSupportingColorMoods(
      primaryMood,
      targetEmotions,
      brandColorRequirements
    );
    
    return {
      primaryMood,
      supportingMoods,
      reasoning: this.generateColorStrategyReasoning(
        primaryMood,
        supportingMoods,
        targetEmotions,
        strategicInsights.brandPositioning
      ),
      psychologicalBasis: emotionColorMapping,
      culturalConsiderations: culturalColorConsiderations,
      brandAlignment: brandColorRequirements
    };
  }

  /**
   * Strategic asset prioritization with business impact analysis
   */
  private prioritizeAssetsStrategically(
    strategicInsights: any,
    visualOpportunities: MayaHandoffData["visualOpportunities"],
    creativeRecommendations: MayaHandoffData["creativeRecommendations"]
  ) {
    // Analyze asset types by strategic importance and business impact
    const assetImpactAnalysis = this.analyzeAssetBusinessImpact(
      creativeRecommendations.priorityAssets,
      strategicInsights.keySellingPoints,
      visualOpportunities
    );
    
    // Score assets by conversion potential and brand impact
    const assetScoring = this.scoreAssetsForImpact(
      assetImpactAnalysis,
      strategicInsights.targetAudienceProfile,
      strategicInsights.competitiveAdvantages
    );
    
    // Categorize by urgency and importance matrix
    const prioritizedAssets = this.categorizeAssetsByPriority(assetScoring);
    
    return {
      critical: prioritizedAssets.highUrgencyHighImportance,
      important: prioritizedAssets.highUrgencyMediumImportance,
      nice_to_have: prioritizedAssets.mediumUrgencyLowImportance,
      futureConsideration: prioritizedAssets.lowUrgencyHighPotential,
      impactScores: assetScoring.scores,
      businessJustification: this.generateAssetBusinessJustification(prioritizedAssets)
    };
  }

  private getAssetPurpose(assetType: string, visualOpportunities: MayaHandoffData["visualOpportunities"]): string {
    const purposes: Record<string, string> = {
      "product-hero": "Primary product showcase",
      "lifestyle-scene": "Contextual usage demonstration",
      "background": "Visual foundation and atmosphere",
      "mood-board": "Style and direction reference"
    };
    
    return purposes[assetType] || "Supporting visual element";
  }

  private getAssetRequirements(assetType: string, visualOpportunities: MayaHandoffData["visualOpportunities"]): string[] {
    return visualOpportunities.heroShotRequirements || ["High quality", "Brand consistent", "Target audience appropriate"];
  }

  private distributeBudget(requiredAssets: any[], totalBudget: number) {
    return requiredAssets.map((asset, index) => ({
      assetType: asset.type,
      allocatedBudget: totalBudget / requiredAssets.length,
      estimatedCost: (totalBudget / requiredAssets.length) * 0.8 // 80% of allocation
    }));
  }

  private createOverallVision(context: DavidCreativeContext, locale: "en" | "ja"): string {
    if (locale === "ja") {
      return `${context.strategicFoundation.productEssence}のための革新的で魅力的なビジュアル戦略`;
    }
    return `Innovative and compelling visual strategy for ${context.strategicFoundation.productEssence}`;
  }

  private getMoodFromColorMood(colorMood: ColorMood): string {
    const mapping: Record<ColorMood, string> = {
      [ColorMood.ENERGETIC]: "dynamic",
      [ColorMood.CALMING]: "serene",
      [ColorMood.SOPHISTICATED]: "refined",
      [ColorMood.WARM]: "welcoming",
      [ColorMood.COOL]: "refreshing",
      [ColorMood.VIBRANT]: "lively",
      [ColorMood.MUTED]: "subtle",
      [ColorMood.NATURAL]: "organic",
      [ColorMood.DRAMATIC]: "striking",
      [ColorMood.PROFESSIONAL]: "authoritative",
      [ColorMood.FRIENDLY]: "approachable",
      [ColorMood.PREMIUM]: "luxurious"
    };
    
    return mapping[colorMood] || "balanced";
  }

  private createColorPalette(colorMood: ColorMood, locale: "en" | "ja"): StylePalette {
    // Create a proper color palette based on the mood
    const styleId = `palette-${colorMood}-${Date.now()}`;
    
    return {
      id: styleId,
      name: locale === "ja" ? `${colorMood}パレット` : `${colorMood} Palette`,
      description: locale === "ja" ? `${colorMood}な雰囲気のカラーパレット` : `Color palette with ${colorMood} mood`,
      
      colors: {
        primary: [{
          name: locale === "ja" ? "プライマリブルー" : "Primary Blue",
          hex: "#2563EB",
          rgb: { r: 37, g: 99, b: 235 },
          hsl: { h: 217, s: 91, l: 60 }
        }],
        secondary: [{
          name: locale === "ja" ? "セカンダリグレー" : "Secondary Grey",
          hex: "#64748B",
          rgb: { r: 100, g: 116, b: 139 },
          hsl: { h: 215, s: 16, l: 47 }
        }],
        accent: [{
          name: locale === "ja" ? "アクセントオレンジ" : "Accent Orange",
          hex: "#F59E0B",
          rgb: { r: 245, g: 158, b: 11 },
          hsl: { h: 38, s: 92, l: 50 }
        }],
        neutral: [{
          name: locale === "ja" ? "背景色" : "Background",
          hex: "#F8FAFC",
          rgb: { r: 248, g: 250, b: 252 },
          hsl: { h: 210, s: 40, l: 98 }
        }],
        supporting: [{
          name: locale === "ja" ? "テキスト色" : "Text Color",
          hex: "#1E293B",
          rgb: { r: 30, g: 41, b: 59 },
          hsl: { h: 217, s: 32, l: 17 }
        }]
      },
      
      harmony: {
        type: "complementary",
        temperature: "cool",
        contrast: "medium",
        saturation: "balanced"
      },
      
      psychology: {
        emotions: [this.getMoodFromColorMood(colorMood)],
        brandAssociations: ["professional", "modern", "trustworthy"],
        culturalMeaning: "Universal professional appeal",
        targetAudienceResonance: 0.85
      },
      
      usage: {
        primary: "Main brand elements and call-to-action buttons",
        secondary: "Supporting text and secondary elements", 
        accent: "Highlights and important notifications",
        backgrounds: ["#F8FAFC", "#FFFFFF"],
        text: ["#1E293B", "#64748B"],
        restrictions: ["Avoid using accent color for large areas"]
      }
    };
  }

  // Translation helpers (simplified)
  private translateDecisionTitle(title: string, locale: "ja"): string {
    const translations: Record<string, string> = {
      "Visual Style Selection": "ビジュアルスタイル選択",
      "Color Palette Decision": "カラーパレット決定"
    };
    return translations[title] || title;
  }

  private translateDecisionDescription(desc: string, locale: "ja"): string {
    if (locale === "ja") {
      return "Mayaの戦略分析に基づく創造的提案";
    }
    return desc;
  }

  private translateOptionDescription(option: string, locale: "ja"): string {
    if (locale === "ja") {
      return `戦略的オプション: ${option}`;
    }
    return option;
  }

  // Empty fallback methods
  private createEmptyContext(): DavidCreativeContext {
    return {
      strategicFoundation: {
        productEssence: "",
        brandPersonality: [],
        targetEmotions: [],
        keyDifferentiators: []
      },
      visualDirection: {
        primaryStyle: VisualStyle.MODERN,
        secondaryStyles: [],
        colorMood: ColorMood.PROFESSIONAL,
        compositionPreferences: []
      },
      assetStrategy: {
        requiredAssets: [],
        budgetDistribution: []
      },
      decisionFramework: {
        mustHave: [],
        shouldHave: [],
        couldHave: [],
        constraints: []
      }
    };
  }

  private createEmptyStrategy(sessionId: string): CreativeStrategy {
    return {
      id: crypto.randomUUID(),
      sessionId,
      overallVision: "",
      visualDirection: {
        style: VisualStyle.MODERN.toString(),
        mood: "neutral",
        colorPalette: this.createColorPalette(ColorMood.PROFESSIONAL, "en"),
        composition: ""
      },
      assetPlan: {
        requiredAssets: [],
        priorityOrder: [],
        estimatedCosts: []
      },
      brandAlignment: {
        score: 0,
        guidelines: [],
        adaptations: []
      },
      targetAudience: {
        primary: "",
        secondary: [],
        insights: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // ===== ENHANCED STRATEGIC ANALYSIS METHODS =====

  /**
   * Map brand personality traits to appropriate visual styles
   */
  private mapBrandPersonalityToVisualStyles(
    brandPersonality: string[],
    targetAudience: any
  ): { primary: VisualStyle[]; secondary: VisualStyle[] } {
    const personalityStyleMap: Record<string, VisualStyle[]> = {
      "innovative": [VisualStyle.MODERN, VisualStyle.TECH, VisualStyle.BOLD],
      "sophisticated": [VisualStyle.SOPHISTICATED, VisualStyle.LUXURY, VisualStyle.CLASSIC],
      "accessible": [VisualStyle.ORGANIC, VisualStyle.MODERN, VisualStyle.MINIMALIST],
      "premium": [VisualStyle.LUXURY, VisualStyle.SOPHISTICATED, VisualStyle.CLASSIC],
      "trustworthy": [VisualStyle.CLASSIC, VisualStyle.SOPHISTICATED, VisualStyle.MODERN],
      "dynamic": [VisualStyle.BOLD, VisualStyle.MODERN, VisualStyle.TECH]
    };

    const mappedStyles = new Set<VisualStyle>();
    brandPersonality.forEach(trait => {
      const styles = personalityStyleMap[trait.toLowerCase()] || [VisualStyle.MODERN];
      styles.forEach(style => mappedStyles.add(style));
    });

    const styleArray = Array.from(mappedStyles);
    return {
      primary: styleArray.slice(0, 2),
      secondary: styleArray.slice(2, 5)
    };
  }

  /**
   * Analyze competitive visual landscape for differentiation opportunities
   */
  private analyzeCompetitiveVisualLandscape(strategicInsights: any): {
    commonStyles: VisualStyle[];
    differentiators: string[];
    opportunities: string[];
  } {
    // Analyze competitive advantages for visual differentiation
    const advantages = strategicInsights.competitiveAdvantages || [];
    const differentiators = advantages.map((adv: string) => 
      `Visual emphasis on ${adv.toLowerCase()}`
    );

    return {
      commonStyles: [VisualStyle.MODERN, VisualStyle.MINIMALIST], // Default common styles
      differentiators,
      opportunities: [
        "Unique color palette approach",
        "Distinctive composition style",
        "Innovative visual storytelling",
        "Cultural adaptation elements"
      ]
    };
  }

  /**
   * Score and rank visual styles based on multiple criteria
   */
  private scoreAndRankVisualStyles(
    styleMapping: { primary: VisualStyle[]; secondary: VisualStyle[] },
    competitiveAnalysis: any,
    targetAudience: any
  ): {
    primary: VisualStyle[];
    alternatives: VisualStyle[];
    scores: Record<string, number>;
  } {
    const allStyles = [...styleMapping.primary, ...styleMapping.secondary];
    const scores: Record<string, number> = {};

    // Score each style based on multiple factors
    allStyles.forEach(style => {
      let score = 0.7; // Base score
      
      // Bonus for brand alignment
      if (styleMapping.primary.includes(style)) score += 0.2;
      
      // Bonus for target audience appeal
      if (this.styleAppealsToAudience(style, targetAudience)) score += 0.1;
      
      scores[style] = Math.min(score, 1.0);
    });

    // Sort by score
    const sortedStyles = allStyles.sort((a, b) => scores[b] - scores[a]);
    
    return {
      primary: sortedStyles.slice(0, 2),
      alternatives: sortedStyles.slice(2, 5),
      scores
    };
  }

  /**
   * Check if style appeals to target audience
   */
  private styleAppealsToAudience(style: VisualStyle, targetAudience: any): boolean {
    const audienceDemographics = targetAudience.demographics || [];
    const audiencePsychographics = targetAudience.psychographics || [];
    
    // Simple heuristic mapping
    const styleAudienceMap: Record<VisualStyle, string[]> = {
      [VisualStyle.MODERN]: ["tech-savvy", "urban", "professional"],
      [VisualStyle.LUXURY]: ["high-income", "status-conscious", "premium"],
      [VisualStyle.MINIMALIST]: ["design-conscious", "efficiency-focused"],
      [VisualStyle.ORGANIC]: ["health-conscious", "environmentally-aware"],
      [VisualStyle.BOLD]: ["young", "adventurous", "trendsetter"],
      [VisualStyle.CLASSIC]: ["traditional", "established", "conservative"],
      [VisualStyle.SOPHISTICATED]: ["educated", "refined", "discerning"],
      [VisualStyle.TECH]: ["early-adopter", "innovation-focused"],
      [VisualStyle.ARTISAN]: ["craft-conscious", "authentic", "handmade"],
      [VisualStyle.URBAN]: ["city-dweller", "contemporary", "street-smart"],
      [VisualStyle.NATURAL]: ["outdoors", "eco-friendly", "sustainable"],
      [VisualStyle.PLAYFUL]: ["fun-loving", "creative", "youthful"]
    };

    const styleKeywords = styleAudienceMap[style] || [];
    const allAudienceTraits = [...audienceDemographics, ...audiencePsychographics]
      .map(trait => trait.toLowerCase());

    return styleKeywords.some(keyword => 
      allAudienceTraits.some(trait => trait.includes(keyword.toLowerCase()))
    );
  }

  /**
   * Generate comprehensive reasoning for style recommendations
   */
  private generateStyleReasoning(
    recommendedStyles: VisualStyle[],
    brandPersonality: string[],
    targetAudience: any,
    competitiveAdvantages: string[]
  ): string {
    const styleDescriptions = {
      [VisualStyle.MODERN]: "contemporary and forward-thinking",
      [VisualStyle.SOPHISTICATED]: "refined and premium", 
      [VisualStyle.MINIMALIST]: "clean and focused",
      [VisualStyle.LUXURY]: "exclusive and high-end",
      [VisualStyle.BOLD]: "dynamic and attention-grabbing",
      [VisualStyle.ORGANIC]: "natural and authentic",
      [VisualStyle.CLASSIC]: "timeless and trustworthy",
      [VisualStyle.TECH]: "innovative and cutting-edge",
      [VisualStyle.ARTISAN]: "handcrafted and authentic",
      [VisualStyle.URBAN]: "street-smart and contemporary",
      [VisualStyle.NATURAL]: "organic and sustainable",
      [VisualStyle.PLAYFUL]: "fun and engaging"
    };

    const primaryStyle = recommendedStyles[0];
    const primaryDescription = styleDescriptions[primaryStyle] || "appropriate";
    
    return `${primaryStyle} style recommended as ${primaryDescription} approach that aligns with brand personality (${brandPersonality.join(", ")}) and resonates with target audience preferences. This positioning leverages competitive advantages (${competitiveAdvantages.slice(0, 2).join(", ")}) while maintaining market differentiation.`;
  }

  /**
   * Map target emotions to appropriate color moods
   */
  private mapEmotionsToColorMoods(
    targetEmotions: string[],
    painPoints: string[]
  ): Record<string, ColorMood[]> {
    const emotionColorMap: Record<string, ColorMood[]> = {
      "confidence": [ColorMood.PROFESSIONAL, ColorMood.SOPHISTICATED],
      "trust": [ColorMood.PROFESSIONAL, ColorMood.CALMING],
      "excitement": [ColorMood.ENERGETIC, ColorMood.VIBRANT],
      "calm": [ColorMood.CALMING, ColorMood.NATURAL],
      "luxury": [ColorMood.PREMIUM, ColorMood.SOPHISTICATED],
      "innovation": [ColorMood.ENERGETIC, ColorMood.VIBRANT],
      "reliability": [ColorMood.PROFESSIONAL, ColorMood.WARM],
      "accessibility": [ColorMood.FRIENDLY, ColorMood.WARM]
    };

    const mapping: Record<string, ColorMood[]> = {};
    
    targetEmotions.forEach(emotion => {
      const lowerEmotion = emotion.toLowerCase();
      Object.keys(emotionColorMap).forEach(key => {
        if (lowerEmotion.includes(key)) {
          mapping[emotion] = emotionColorMap[key];
        }
      });
    });

    return mapping;
  }

  /**
   * Analyze brand positioning for color requirements
   */
  private analyzeBrandColorRequirements(
    brandPositioning: string,
    competitiveAdvantages: string[]
  ): {
    requiredMoods: ColorMood[];
    avoidMoods: ColorMood[];
    reasoning: string;
  } {
    const positioning = brandPositioning.toLowerCase();
    
    let requiredMoods: ColorMood[] = [ColorMood.PROFESSIONAL];
    let avoidMoods: ColorMood[] = [];
    
    if (positioning.includes("premium") || positioning.includes("luxury")) {
      requiredMoods = [ColorMood.PREMIUM, ColorMood.SOPHISTICATED];
      avoidMoods = [ColorMood.FRIENDLY, ColorMood.VIBRANT];
    } else if (positioning.includes("accessible") || positioning.includes("friendly")) {
      requiredMoods = [ColorMood.FRIENDLY, ColorMood.WARM];
      avoidMoods = [ColorMood.DRAMATIC, ColorMood.PREMIUM];
    } else if (positioning.includes("innovative") || positioning.includes("tech")) {
      requiredMoods = [ColorMood.ENERGETIC, ColorMood.PROFESSIONAL];
      avoidMoods = [ColorMood.MUTED, ColorMood.NATURAL];
    }

    return {
      requiredMoods,
      avoidMoods,
      reasoning: `Brand positioning as "${brandPositioning}" suggests ${requiredMoods.join(" + ")} color approach`
    };
  }

  /**
   * Analyze cultural color implications
   */
  private analyzeCulturalColorImplications(
    productAnalysis: ProductAnalysis,
    targetAudienceProfile: any
  ): {
    culturalConsiderations: string[];
    recommendedAdaptations: string[];
    globalSafety: boolean;
  } {
    // Simplified cultural analysis - in production would be more sophisticated
    const globalSafety = true; // Most professional colors are globally safe
    
    return {
      culturalConsiderations: [
        "Professional colors work well across cultures",
        "Consider local market preferences for warmth vs. coolness",
        "Avoid culturally sensitive color combinations"
      ],
      recommendedAdaptations: [
        "Slight warmth adjustments for Asian markets",
        "Professional tone maintained globally"
      ],
      globalSafety
    };
  }

  /**
   * Select optimal color mood based on multiple factors
   */
  private selectOptimalColorMood(
    emotionMapping: Record<string, ColorMood[]>,
    brandRequirements: any,
    culturalConsiderations: any
  ): ColorMood {
    const allSuggestedMoods: ColorMood[] = [];
    
    // Collect all suggested moods
    Object.values(emotionMapping).forEach(moods => {
      allSuggestedMoods.push(...moods);
    });
    allSuggestedMoods.push(...brandRequirements.requiredMoods);
    
    // Count frequency and select most common
    const moodCounts: Record<ColorMood, number> = {} as Record<ColorMood, number>;
    allSuggestedMoods.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    
    // Find mood with highest count, defaulting to PROFESSIONAL
    let bestMood = ColorMood.PROFESSIONAL;
    let maxCount = 0;
    
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount && !brandRequirements.avoidMoods.includes(mood as ColorMood)) {
        bestMood = mood as ColorMood;
        maxCount = count;
      }
    });
    
    return bestMood;
  }

  /**
   * Select supporting color moods
   */
  private selectSupportingColorMoods(
    primaryMood: ColorMood,
    targetEmotions: string[],
    brandRequirements: any
  ): ColorMood[] {
    const complementaryMoods: Record<ColorMood, ColorMood[]> = {
      [ColorMood.PROFESSIONAL]: [ColorMood.SOPHISTICATED, ColorMood.WARM],
      [ColorMood.SOPHISTICATED]: [ColorMood.PREMIUM, ColorMood.CALMING],
      [ColorMood.ENERGETIC]: [ColorMood.VIBRANT, ColorMood.FRIENDLY],
      [ColorMood.CALMING]: [ColorMood.NATURAL, ColorMood.MUTED],
      [ColorMood.PREMIUM]: [ColorMood.SOPHISTICATED, ColorMood.DRAMATIC],
      [ColorMood.FRIENDLY]: [ColorMood.WARM, ColorMood.NATURAL],
      [ColorMood.WARM]: [ColorMood.FRIENDLY, ColorMood.NATURAL],
      [ColorMood.COOL]: [ColorMood.PROFESSIONAL, ColorMood.CALMING],
      [ColorMood.VIBRANT]: [ColorMood.ENERGETIC, ColorMood.FRIENDLY],
      [ColorMood.MUTED]: [ColorMood.SOPHISTICATED, ColorMood.CALMING],
      [ColorMood.NATURAL]: [ColorMood.WARM, ColorMood.CALMING],
      [ColorMood.DRAMATIC]: [ColorMood.PREMIUM, ColorMood.SOPHISTICATED]
    };

    return complementaryMoods[primaryMood]?.slice(0, 2) || [ColorMood.SOPHISTICATED, ColorMood.WARM];
  }

  /**
   * Generate comprehensive color strategy reasoning
   */
  private generateColorStrategyReasoning(
    primaryMood: ColorMood,
    supportingMoods: ColorMood[],
    targetEmotions: string[],
    brandPositioning: string
  ): string {
    return `${primaryMood} primary color mood selected to evoke ${targetEmotions.slice(0, 2).join(" and ")} while supporting "${brandPositioning}" brand positioning. Supporting moods (${supportingMoods.join(", ")}) provide emotional depth and visual hierarchy for comprehensive brand expression.`;
  }

  /**
   * Analyze asset business impact for strategic prioritization
   */
  private analyzeAssetBusinessImpact(
    priorityAssets: string[],
    keySellingPoints: string[],
    visualOpportunities: MayaHandoffData["visualOpportunities"]
  ): Record<string, { impact: number; reasoning: string }> {
    const assetImpactMap: Record<string, { impact: number; reasoning: string }> = {};
    
    priorityAssets.forEach(asset => {
      let impact = 0.7; // Base impact score
      let reasoning = "Standard commercial asset";
      
      if (asset.includes("product-hero")) {
        impact = 0.95;
        reasoning = "Primary product showcase - highest conversion impact";
      } else if (asset.includes("lifestyle")) {
        impact = 0.85;
        reasoning = "Lifestyle context - strong emotional connection and usage visualization";
      } else if (asset.includes("background")) {
        impact = 0.75;
        reasoning = "Visual foundation - supports all other elements";
      } else if (asset.includes("mood-board")) {
        impact = 0.6;
        reasoning = "Creative reference - important for consistency but lower direct impact";
      }
      
      assetImpactMap[asset] = { impact, reasoning };
    });
    
    return assetImpactMap;
  }

  /**
   * Score assets for comprehensive impact assessment
   */
  private scoreAssetsForImpact(
    impactAnalysis: Record<string, { impact: number; reasoning: string }>,
    targetAudience: any,
    competitiveAdvantages: string[]
  ): {
    scores: Record<string, number>;
    rankings: string[];
  } {
    const scores: Record<string, number> = {};
    
    Object.entries(impactAnalysis).forEach(([asset, analysis]) => {
      let score = analysis.impact;
      
      // Bonus for audience alignment
      if (this.assetAlignswithAudience(asset, targetAudience)) {
        score += 0.1;
      }
      
      // Bonus for competitive advantage showcase
      if (this.assetShowcasesAdvantage(asset, competitiveAdvantages)) {
        score += 0.15;
      }
      
      scores[asset] = Math.min(score, 1.0);
    });
    
    const rankings = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    
    return { scores, rankings };
  }

  /**
   * Check if asset aligns with target audience
   */
  private assetAlignswithAudience(asset: string, targetAudience: any): boolean {
    const audiencePreferences = targetAudience.psychographics || [];
    
    if (asset.includes("lifestyle") && audiencePreferences.some((pref: string) => 
        pref.toLowerCase().includes("lifestyle") || pref.toLowerCase().includes("experience")
    )) {
      return true;
    }
    
    if (asset.includes("product-hero") && audiencePreferences.some((pref: string) => 
        pref.toLowerCase().includes("quality") || pref.toLowerCase().includes("feature")
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if asset showcases competitive advantage
   */
  private assetShowcasesAdvantage(asset: string, advantages: string[]): boolean {
    return advantages.some(advantage => 
      asset.toLowerCase().includes(advantage.toLowerCase().split(" ")[0])
    );
  }

  /**
   * Categorize assets by priority matrix
   */
  private categorizeAssetsByPriority(assetScoring: any): {
    highUrgencyHighImportance: string[];
    highUrgencyMediumImportance: string[];
    mediumUrgencyLowImportance: string[];
    lowUrgencyHighPotential: string[];
  } {
    const { scores, rankings } = assetScoring;
    const totalAssets = rankings.length;
    
    return {
      highUrgencyHighImportance: rankings.slice(0, Math.ceil(totalAssets * 0.3)),
      highUrgencyMediumImportance: rankings.slice(
        Math.ceil(totalAssets * 0.3), 
        Math.ceil(totalAssets * 0.6)
      ),
      mediumUrgencyLowImportance: rankings.slice(
        Math.ceil(totalAssets * 0.6), 
        Math.ceil(totalAssets * 0.8)
      ),
      lowUrgencyHighPotential: rankings.slice(Math.ceil(totalAssets * 0.8))
    };
  }

  /**
   * Generate business justification for asset priorities
   */
  private generateAssetBusinessJustification(prioritizedAssets: any): string {
    const critical = prioritizedAssets.highUrgencyHighImportance;
    const important = prioritizedAssets.highUrgencyMediumImportance;
    
    return `Critical assets (${critical.join(", ")}) prioritized for immediate development due to high conversion impact and audience alignment. Important assets (${important.join(", ")}) scheduled for secondary phase to maintain creative momentum while optimizing budget allocation.`;
  }

  /**
   * Analyze market visual opportunities for competitive positioning
   */
  private analyzeMarketVisualOpportunities(
    productAnalysis: ProductAnalysis,
    strategicInsights: any
  ): {
    competitiveAdvantage: string[];
    visualDifferentiators: string[];
    targetAudienceVisualPreferences: string[];
  } {
    const category = productAnalysis.product.category;
    const advantages = strategicInsights.competitiveAdvantages || [];
    const targetProfile = strategicInsights.targetAudienceProfile;
    
    return {
      competitiveAdvantage: advantages.map((adv: string) => 
        `Visual emphasis on ${adv} through strategic asset placement`
      ),
      visualDifferentiators: [
        `Unique ${category} visual storytelling approach`,
        "Distinctive color palette and composition style",
        "Cultural adaptation for target market resonance"
      ],
      targetAudienceVisualPreferences: [
        `Appeals to ${targetProfile.primary} aesthetic preferences`,
        "Addresses key motivations through visual cues",
        "Resolves pain points through reassuring visual communication"
      ]
    };
  }

  /**
   * Create creative opportunity matrix for risk/reward assessment
   */
  private createCreativeOpportunityMatrix(
    strategicInsights: any,
    visualOpportunities: MayaHandoffData["visualOpportunities"],
    marketAnalysis: any
  ): {
    highImpactLowRisk: string[];
    highImpactHighRisk: string[];
    lowImpactHighValue: string[];
  } {
    const keySellingPoints = strategicInsights.keySellingPoints || [];
    const heroRequirements = visualOpportunities.heroShotRequirements || [];
    
    return {
      highImpactLowRisk: [
        "Professional product photography with optimal lighting",
        "Clean, modern composition highlighting key features",
        "Consistent brand color application across all assets"
      ],
      highImpactHighRisk: [
        "Innovative visual storytelling approach",
        "Bold creative direction that challenges category norms",
        "Interactive or dynamic visual elements"
      ],
      lowImpactHighValue: [
        "Cultural market adaptations for global appeal",
        "Accessibility-focused visual design choices",
        "Future-proofed visual system for brand evolution"
      ]
    };
  }

  /**
   * Build comprehensive visual narrative structure
   */
  private buildVisualNarrativeStructure(
    strategicInsights: any,
    productAnalysis: ProductAnalysis
  ): {
    primaryMessage: string;
    supportingMessages: string[];
    emotionalArc: string[];
    callToAction: string;
  } {
    const keySellingPoints = strategicInsights.keySellingPoints || [];
    const brandPositioning = strategicInsights.brandPositioning || "";
    const targetMotivations = strategicInsights.targetAudienceProfile?.motivations || [];
    
    return {
      primaryMessage: keySellingPoints[0] || `Experience ${productAnalysis.product.name} innovation`,
      supportingMessages: keySellingPoints.slice(1, 3),
      emotionalArc: [
        "Capture attention with compelling visual hook",
        "Build emotional connection through relatable context",
        "Demonstrate product value and benefit realization",
        "Inspire action with clear, confident call-to-action"
      ],
      callToAction: this.generateCallToAction(brandPositioning, targetMotivations)
    };
  }

  /**
   * Generate appropriate call-to-action based on positioning and motivations
   */
  private generateCallToAction(brandPositioning: string, motivations: string[]): string {
    if (brandPositioning.toLowerCase().includes("premium") || brandPositioning.toLowerCase().includes("luxury")) {
      return "Experience Excellence";
    }
    
    if (motivations.some(m => m.toLowerCase().includes("efficiency") || m.toLowerCase().includes("time"))) {
      return "Start Saving Time Today";
    }
    
    if (motivations.some(m => m.toLowerCase().includes("quality") || m.toLowerCase().includes("reliable"))) {
      return "Trust the Quality";
    }
    
    return "Discover the Difference";
  }
}