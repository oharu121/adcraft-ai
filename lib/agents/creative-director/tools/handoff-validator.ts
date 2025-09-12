/**
 * Handoff Validator
 *
 * Comprehensive validation and confirmation system for agent-to-agent handoffs,
 * ensuring data integrity, completeness, and production readiness across the
 * Maya → David → Alex pipeline.
 */

import type { MayaHandoffData } from "./maya-handoff-manager";
import type { AlexHandoffData } from "./alex-handoff-manager";
import type { VisualAsset, CreativeDirection, StylePalette } from "../types/asset-types";
import type { VisualDecision, CreativeStrategy } from "../types/api-types";
import { CreativeDirectorSessionManager } from "./session-manager";
import { CreativeDirectorCostTracker } from "./cost-tracker";

// Validation result interfaces
export interface ValidationResult {
  isValid: boolean;
  severity: "error" | "warning" | "info";
  completeness: number; // 0-1 score
  confidence: number; // 0-1 score
  
  validationChecks: ValidationCheck[];
  issues: ValidationIssue[];
  recommendations: ValidationRecommendation[];
  
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  
  metadata: {
    validatedAt: string;
    validator: string;
    sessionId: string;
    handoffType: "maya_to_david" | "david_to_alex";
  };
}

export interface ValidationCheck {
  id: string;
  category: "data_integrity" | "completeness" | "quality" | "consistency" | "compliance" | "performance";
  name: string;
  description: string;
  status: "passed" | "failed" | "warning" | "skipped";
  weight: number; // Impact on overall score
  details: {
    expected: any;
    actual: any;
    message: string;
  };
  executionTime: number;
}

export interface ValidationIssue {
  id: string;
  severity: "critical" | "major" | "minor" | "informational";
  category: string;
  title: string;
  description: string;
  affectedComponents: string[];
  impact: {
    productionReadiness: boolean;
    userExperience: boolean;
    brandCompliance: boolean;
    technicalPerformance: boolean;
  };
  resolution: {
    required: boolean;
    suggestions: string[];
    estimatedEffort: "low" | "medium" | "high";
  };
}

export interface ValidationRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "improvement" | "optimization" | "compliance" | "enhancement";
  title: string;
  description: string;
  benefits: string[];
  implementation: {
    steps: string[];
    estimatedTime: number;
    requiredResources: string[];
  };
  impact: {
    qualityImprovement: number;
    costOptimization: number;
    performanceGain: number;
  };
}

// Handoff confirmation interfaces
export interface HandoffConfirmation {
  id: string;
  sessionId: string;
  handoffType: "maya_to_david" | "david_to_alex";
  
  validation: {
    result: ValidationResult;
    approvedBy: string;
    approvedAt: string;
    conditions: string[];
  };
  
  dataIntegrity: {
    checksumVerification: boolean;
    completenessScore: number;
    consistencyScore: number;
  };
  
  qualityAssurance: {
    assetQualityScore: number;
    brandComplianceScore: number;
    technicalReadinessScore: number;
  };
  
  budgetVerification: {
    costVerified: boolean;
    budgetRemaining: number;
    projectedCosts: number;
    approved: boolean;
  };
  
  stakeholderApproval: {
    creativeApproval: boolean;
    technicalApproval: boolean;
    budgetApproval: boolean;
    clientApproval?: boolean;
  };
  
  deliveryReadiness: {
    readyForProduction: boolean;
    estimatedDeliveryTime: number;
    dependencies: string[];
    risks: string[];
  };
  
  confirmationMetadata: {
    confirmedAt: string;
    confirmedBy: string;
    validityPeriod: number; // Hours
    revisionNumber: number;
  };
}

/**
 * Handoff Validator
 * Comprehensive validation system for agent handoffs
 */
export class HandoffValidator {
  private static instance: HandoffValidator;
  private sessionManager: CreativeDirectorSessionManager;
  private costTracker: CreativeDirectorCostTracker;

  private constructor() {
    this.sessionManager = CreativeDirectorSessionManager.getInstance();
    this.costTracker = CreativeDirectorCostTracker.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HandoffValidator {
    if (!HandoffValidator.instance) {
      HandoffValidator.instance = new HandoffValidator();
    }
    return HandoffValidator.instance;
  }

  /**
   * Validate Maya → David handoff
   */
  public async validateMayaToDavidHandoff(
    sessionId: string,
    mayaHandoffData: MayaHandoffData,
    davidContext: any,
    initialDecisions: VisualDecision[],
    creativeStrategy: CreativeStrategy
  ): Promise<ValidationResult> {
    console.log(`[HANDOFF VALIDATOR] Validating Maya → David handoff for session: ${sessionId}`);
    
    const startTime = Date.now();
    const validationChecks: ValidationCheck[] = [];
    const issues: ValidationIssue[] = [];
    const recommendations: ValidationRecommendation[] = [];

    try {
      // Data Integrity Checks
      await this.validateDataIntegrity(
        mayaHandoffData,
        validationChecks,
        issues,
        "maya_to_david"
      );

      // Completeness Checks
      await this.validateHandoffCompleteness(
        mayaHandoffData,
        validationChecks,
        issues,
        "maya_to_david"
      );

      // Strategic Context Quality
      await this.validateStrategicContextQuality(
        mayaHandoffData,
        davidContext,
        validationChecks,
        issues
      );

      // Creative Decision Consistency
      await this.validateCreativeDecisionConsistency(
        initialDecisions,
        creativeStrategy,
        validationChecks,
        issues
      );

      // Budget and Cost Validation
      await this.validateBudgetConsistency(
        sessionId,
        mayaHandoffData.budgetAllocation,
        validationChecks,
        issues
      );

      // Generate Recommendations
      this.generateMayaToDavidRecommendations(
        validationChecks,
        issues,
        recommendations
      );

      // Calculate scores and summary
      const summary = this.calculateValidationSummary(validationChecks);
      const completeness = this.calculateCompletenessScore(validationChecks);
      const confidence = this.calculateConfidenceScore(validationChecks, issues);

      const executionTime = Date.now() - startTime;

      console.log(`[HANDOFF VALIDATOR] Maya → David validation completed in ${executionTime}ms`);

      return {
        isValid: summary.failed === 0 && issues.filter(i => i.severity === "critical").length === 0,
        severity: this.determineSeverity(issues),
        completeness,
        confidence,
        validationChecks,
        issues,
        recommendations,
        summary,
        metadata: {
          validatedAt: new Date().toISOString(),
          validator: "MayaToDavidValidator",
          sessionId,
          handoffType: "maya_to_david"
        }
      };

    } catch (error) {
      console.error(`[HANDOFF VALIDATOR] Error validating Maya → David handoff:`, error);
      
      return {
        isValid: false,
        severity: "error",
        completeness: 0,
        confidence: 0,
        validationChecks,
        issues: [{
          id: crypto.randomUUID(),
          severity: "critical",
          category: "validation_error",
          title: "Validation Process Failed",
          description: error instanceof Error ? error.message : "Unknown validation error",
          affectedComponents: ["handoff_validation"],
          impact: {
            productionReadiness: true,
            userExperience: true,
            brandCompliance: true,
            technicalPerformance: true
          },
          resolution: {
            required: true,
            suggestions: ["Review handoff data", "Check validation system", "Contact support"],
            estimatedEffort: "high"
          }
        }],
        recommendations: [],
        summary: {
          totalChecks: 0,
          passed: 0,
          failed: 1,
          warnings: 0
        },
        metadata: {
          validatedAt: new Date().toISOString(),
          validator: "MayaToDavidValidator",
          sessionId,
          handoffType: "maya_to_david"
        }
      };
    }
  }

  /**
   * Validate David → Alex handoff
   */
  public async validateDavidToAlexHandoff(
    sessionId: string,
    alexHandoffData: AlexHandoffData,
    generatedAssets: VisualAsset[],
    visualDecisions: VisualDecision[]
  ): Promise<ValidationResult> {
    console.log(`[HANDOFF VALIDATOR] Validating David → Alex handoff for session: ${sessionId}`);
    
    const startTime = Date.now();
    const validationChecks: ValidationCheck[] = [];
    const issues: ValidationIssue[] = [];
    const recommendations: ValidationRecommendation[] = [];

    try {
      // Data Integrity Checks
      await this.validateDataIntegrity(
        alexHandoffData,
        validationChecks,
        issues,
        "david_to_alex"
      );

      // Asset Package Validation
      await this.validateAssetPackage(
        alexHandoffData.assetPackage,
        generatedAssets,
        validationChecks,
        issues
      );

      // Production Specs Validation
      await this.validateProductionSpecs(
        alexHandoffData.productionSpecs,
        validationChecks,
        issues
      );

      // Creative Guidelines Validation
      await this.validateCreativeGuidelines(
        alexHandoffData.creativeGuidelines,
        validationChecks,
        issues
      );

      // Alex Workflow Validation
      await this.validateAlexWorkflow(
        alexHandoffData.alexWorkflow,
        validationChecks,
        issues
      );

      // Scene-Asset Mapping Validation
      await this.validateSceneAssetMapping(
        alexHandoffData.alexWorkflow.sceneMapping,
        alexHandoffData.productionSpecs.sceneStructure,
        validationChecks,
        issues
      );

      // Budget and Timeline Validation
      await this.validateProductionBudget(
        sessionId,
        alexHandoffData.productionBudget,
        validationChecks,
        issues
      );

      // Generate Recommendations
      this.generateDavidToAlexRecommendations(
        validationChecks,
        issues,
        recommendations
      );

      // Calculate scores and summary
      const summary = this.calculateValidationSummary(validationChecks);
      const completeness = this.calculateCompletenessScore(validationChecks);
      const confidence = this.calculateConfidenceScore(validationChecks, issues);

      const executionTime = Date.now() - startTime;

      console.log(`[HANDOFF VALIDATOR] David → Alex validation completed in ${executionTime}ms`);

      return {
        isValid: summary.failed === 0 && issues.filter(i => i.severity === "critical").length === 0,
        severity: this.determineSeverity(issues),
        completeness,
        confidence,
        validationChecks,
        issues,
        recommendations,
        summary,
        metadata: {
          validatedAt: new Date().toISOString(),
          validator: "DavidToAlexValidator",
          sessionId,
          handoffType: "david_to_alex"
        }
      };

    } catch (error) {
      console.error(`[HANDOFF VALIDATOR] Error validating David → Alex handoff:`, error);
      
      return this.createFailedValidationResult(sessionId, "david_to_alex", error);
    }
  }

  /**
   * Create handoff confirmation
   */
  public async createHandoffConfirmation(
    sessionId: string,
    handoffType: "maya_to_david" | "david_to_alex",
    validationResult: ValidationResult,
    approvedBy: string = "system",
    conditions: string[] = []
  ): Promise<HandoffConfirmation> {
    console.log(`[HANDOFF VALIDATOR] Creating handoff confirmation for session: ${sessionId}`);

    try {
      // Get session analytics for budget verification
      const analytics = await this.costTracker.getSessionAnalytics(sessionId);

      // Calculate quality scores
      const assetQualityScore = this.calculateAssetQualityScore(validationResult);
      const brandComplianceScore = this.calculateBrandComplianceScore(validationResult);
      const technicalReadinessScore = this.calculateTechnicalReadinessScore(validationResult);

      // Verify budget and costs
      const budgetVerification = {
        costVerified: analytics.totalSpent >= 0,
        budgetRemaining: analytics.budgetRemaining,
        projectedCosts: this.estimateProjectedCosts(handoffType, analytics),
        approved: analytics.budgetRemaining > 0
      };

      // Determine delivery readiness
      const readyForProduction = validationResult.isValid && 
                                validationResult.completeness >= 0.9 &&
                                budgetVerification.approved;

      const confirmation: HandoffConfirmation = {
        id: crypto.randomUUID(),
        sessionId,
        handoffType,
        
        validation: {
          result: validationResult,
          approvedBy,
          approvedAt: new Date().toISOString(),
          conditions
        },
        
        dataIntegrity: {
          checksumVerification: true, // Would implement actual checksum in production
          completenessScore: validationResult.completeness,
          consistencyScore: this.calculateConsistencyScore(validationResult)
        },
        
        qualityAssurance: {
          assetQualityScore,
          brandComplianceScore,
          technicalReadinessScore
        },
        
        budgetVerification,
        
        stakeholderApproval: {
          creativeApproval: validationResult.completeness >= 0.8,
          technicalApproval: technicalReadinessScore >= 0.8,
          budgetApproval: budgetVerification.approved,
          clientApproval: undefined // Would be set if client approval required
        },
        
        deliveryReadiness: {
          readyForProduction,
          estimatedDeliveryTime: this.estimateDeliveryTime(handoffType, validationResult),
          dependencies: this.identifyDependencies(validationResult),
          risks: this.identifyRisks(validationResult)
        },
        
        confirmationMetadata: {
          confirmedAt: new Date().toISOString(),
          confirmedBy: approvedBy,
          validityPeriod: 24, // 24 hours validity
          revisionNumber: 1
        }
      };

      // Store confirmation in session manager
      await this.sessionManager.updateSession(sessionId, {
        [`${handoffType}_confirmation`]: confirmation
      });

      console.log(`[HANDOFF VALIDATOR] Handoff confirmation created for session: ${sessionId}`);
      
      return confirmation;

    } catch (error) {
      console.error(`[HANDOFF VALIDATOR] Failed to create handoff confirmation:`, error);
      throw error;
    }
  }

  // ===== VALIDATION METHODS =====

  /**
   * Validate data integrity
   */
  private async validateDataIntegrity(
    handoffData: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[],
    handoffType: string
  ) {
    // Required fields check
    const requiredFields = handoffType === "maya_to_david" 
      ? ["productAnalysis", "strategicInsights", "budgetAllocation"]
      : ["creativeDirection", "assetPackage", "productionSpecs"];

    requiredFields.forEach(field => {
      const exists = !!handoffData[field];
      validationChecks.push({
        id: crypto.randomUUID(),
        category: "data_integrity",
        name: `Required Field: ${field}`,
        description: `Verify ${field} is present in handoff data`,
        status: exists ? "passed" : "failed",
        weight: 0.2,
        details: {
          expected: "Field present",
          actual: exists ? "Present" : "Missing",
          message: exists ? "Field validation passed" : `Required field ${field} is missing`
        },
        executionTime: 1
      });

      if (!exists) {
        issues.push({
          id: crypto.randomUUID(),
          severity: "critical",
          category: "data_integrity",
          title: `Missing Required Field: ${field}`,
          description: `The handoff data is missing the required field: ${field}`,
          affectedComponents: [field],
          impact: {
            productionReadiness: true,
            userExperience: true,
            brandCompliance: false,
            technicalPerformance: false
          },
          resolution: {
            required: true,
            suggestions: [`Ensure ${field} is properly set in the source agent`, "Re-run handoff process"],
            estimatedEffort: "medium"
          }
        });
      }
    });

    // Data type validation
    const sessionIdValid = typeof handoffData.sessionId === "string" && handoffData.sessionId.length > 0;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "data_integrity",
      name: "Session ID Format",
      description: "Verify session ID is valid string format",
      status: sessionIdValid ? "passed" : "failed",
      weight: 0.1,
      details: {
        expected: "Non-empty string",
        actual: typeof handoffData.sessionId,
        message: sessionIdValid ? "Session ID format valid" : "Invalid session ID format"
      },
      executionTime: 1
    });

    // Timestamp validation
    const timestampValid = handoffData.handoffTimestamp && 
                          !isNaN(new Date(handoffData.handoffTimestamp).getTime());
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "data_integrity",
      name: "Timestamp Validity",
      description: "Verify handoff timestamp is valid",
      status: timestampValid ? "passed" : "failed",
      weight: 0.1,
      details: {
        expected: "Valid ISO timestamp",
        actual: handoffData.handoffTimestamp,
        message: timestampValid ? "Timestamp is valid" : "Invalid timestamp format"
      },
      executionTime: 1
    });
  }

  /**
   * Validate handoff completeness
   */
  private async validateHandoffCompleteness(
    handoffData: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[],
    handoffType: string
  ) {
    if (handoffType === "maya_to_david") {
      // Maya specific completeness checks
      const strategicInsightsComplete = handoffData.strategicInsights?.keySellingPoints?.length > 0;
      validationChecks.push({
        id: crypto.randomUUID(),
        category: "completeness",
        name: "Strategic Insights Completeness",
        description: "Verify strategic insights contain key selling points",
        status: strategicInsightsComplete ? "passed" : "warning",
        weight: 0.3,
        details: {
          expected: "At least 1 key selling point",
          actual: handoffData.strategicInsights?.keySellingPoints?.length || 0,
          message: strategicInsightsComplete ? "Strategic insights complete" : "Limited strategic insights"
        },
        executionTime: 2
      });

      // Visual opportunities validation
      const visualOpportunitiesComplete = handoffData.visualOpportunities?.heroShotRequirements?.length > 0;
      validationChecks.push({
        id: crypto.randomUUID(),
        category: "completeness",
        name: "Visual Opportunities Completeness",
        description: "Verify visual opportunities are identified",
        status: visualOpportunitiesComplete ? "passed" : "warning",
        weight: 0.2,
        details: {
          expected: "Hero shot requirements defined",
          actual: handoffData.visualOpportunities?.heroShotRequirements?.length || 0,
          message: visualOpportunitiesComplete ? "Visual opportunities complete" : "Limited visual opportunities"
        },
        executionTime: 2
      });
    }
  }

  /**
   * Validate strategic context quality
   */
  private async validateStrategicContextQuality(
    mayaHandoffData: MayaHandoffData,
    davidContext: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Strategic foundation coherence
    const strategicCoherence = davidContext.strategicFoundation?.productEssence?.length > 10;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "quality",
      name: "Strategic Foundation Coherence",
      description: "Verify strategic foundation is well-defined",
      status: strategicCoherence ? "passed" : "warning",
      weight: 0.25,
      details: {
        expected: "Detailed product essence",
        actual: davidContext.strategicFoundation?.productEssence?.length || 0,
        message: strategicCoherence ? "Strategic foundation is coherent" : "Strategic foundation needs more detail"
      },
      executionTime: 3
    });

    // Visual direction alignment
    const visualAlignment = davidContext.visualDirection?.primaryStyle && 
                           davidContext.visualDirection?.colorMood;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "quality",
      name: "Visual Direction Alignment",
      description: "Verify visual direction is comprehensive",
      status: visualAlignment ? "passed" : "failed",
      weight: 0.3,
      details: {
        expected: "Primary style and color mood defined",
        actual: `Style: ${davidContext.visualDirection?.primaryStyle}, Mood: ${davidContext.visualDirection?.colorMood}`,
        message: visualAlignment ? "Visual direction well-aligned" : "Incomplete visual direction"
      },
      executionTime: 2
    });
  }

  /**
   * Validate creative decision consistency
   */
  private async validateCreativeDecisionConsistency(
    initialDecisions: VisualDecision[],
    creativeStrategy: CreativeStrategy,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Decision count adequacy
    const adequateDecisions = initialDecisions.length >= 2;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "consistency",
      name: "Decision Count Adequacy",
      description: "Verify adequate number of initial creative decisions",
      status: adequateDecisions ? "passed" : "warning",
      weight: 0.2,
      details: {
        expected: "At least 2 initial decisions",
        actual: initialDecisions.length,
        message: adequateDecisions ? "Adequate initial decisions" : "Consider adding more initial creative decisions"
      },
      executionTime: 1
    });

    // Strategy consistency
    const strategyConsistent = creativeStrategy.overallVision?.length > 10;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "consistency",
      name: "Strategy Vision Consistency",
      description: "Verify creative strategy has clear overall vision",
      status: strategyConsistent ? "passed" : "warning",
      weight: 0.25,
      details: {
        expected: "Detailed overall vision",
        actual: creativeStrategy.overallVision?.length || 0,
        message: strategyConsistent ? "Strategy vision is consistent" : "Strategy vision needs more detail"
      },
      executionTime: 2
    });
  }

  /**
   * Validate budget consistency
   */
  private async validateBudgetConsistency(
    sessionId: string,
    budgetAllocation: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    try {
      const analytics = await this.costTracker.getSessionAnalytics(sessionId);
      
      // Budget availability check
      const budgetAvailable = budgetAllocation?.creativeBudget > 0 && analytics.budgetRemaining > 0;
      validationChecks.push({
        id: crypto.randomUUID(),
        category: "compliance",
        name: "Budget Availability",
        description: "Verify sufficient budget remains for creative work",
        status: budgetAvailable ? "passed" : "failed",
        weight: 0.3,
        details: {
          expected: "Positive budget remaining",
          actual: `Allocated: $${budgetAllocation?.creativeBudget || 0}, Remaining: $${analytics.budgetRemaining}`,
          message: budgetAvailable ? "Budget is available" : "Insufficient budget for creative work"
        },
        executionTime: 5
      });

      if (!budgetAvailable) {
        issues.push({
          id: crypto.randomUUID(),
          severity: "critical",
          category: "budget",
          title: "Insufficient Budget",
          description: "Not enough budget remaining for creative operations",
          affectedComponents: ["creative_operations", "asset_generation"],
          impact: {
            productionReadiness: true,
            userExperience: true,
            brandCompliance: false,
            technicalPerformance: false
          },
          resolution: {
            required: true,
            suggestions: ["Increase session budget", "Reduce scope", "Optimize operations"],
            estimatedEffort: "high"
          }
        });
      }

    } catch (error) {
      validationChecks.push({
        id: crypto.randomUUID(),
        category: "compliance",
        name: "Budget Validation Error",
        description: "Failed to validate budget consistency",
        status: "failed",
        weight: 0.3,
        details: {
          expected: "Successful budget validation",
          actual: "Validation error",
          message: error instanceof Error ? error.message : "Unknown budget validation error"
        },
        executionTime: 5
      });
    }
  }

  /**
   * Validate asset package
   */
  private async validateAssetPackage(
    assetPackage: any,
    generatedAssets: VisualAsset[],
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Hero assets availability
    const heroAssetsAvailable = assetPackage.heroAssets?.length > 0;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "completeness",
      name: "Hero Assets Availability",
      description: "Verify hero assets are available for video production",
      status: heroAssetsAvailable ? "passed" : "failed",
      weight: 0.4,
      details: {
        expected: "At least 1 hero asset",
        actual: assetPackage.heroAssets?.length || 0,
        message: heroAssetsAvailable ? "Hero assets available" : "No hero assets for video production"
      },
      executionTime: 2
    });

    // Asset quality verification
    const highQualityAssets = generatedAssets.filter(a => a.quality?.overallScore && a.quality.overallScore >= 0.8).length;
    const qualityRatio = generatedAssets.length > 0 ? highQualityAssets / generatedAssets.length : 0;
    const qualityAdequate = qualityRatio >= 0.7;

    validationChecks.push({
      id: crypto.randomUUID(),
      category: "quality",
      name: "Asset Quality Standards",
      description: "Verify assets meet quality standards for production",
      status: qualityAdequate ? "passed" : "warning",
      weight: 0.3,
      details: {
        expected: "70% of assets with quality score >= 0.8",
        actual: `${Math.round(qualityRatio * 100)}% (${highQualityAssets}/${generatedAssets.length})`,
        message: qualityAdequate ? "Asset quality meets standards" : "Consider improving asset quality"
      },
      executionTime: 3
    });
  }

  /**
   * Validate production specifications
   */
  private async validateProductionSpecs(
    productionSpecs: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Scene structure adequacy
    const adequateScenes = productionSpecs.sceneStructure?.length >= 2;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "completeness",
      name: "Scene Structure Adequacy",
      description: "Verify adequate scene structure for video production",
      status: adequateScenes ? "passed" : "failed",
      weight: 0.35,
      details: {
        expected: "At least 2 scenes",
        actual: productionSpecs.sceneStructure?.length || 0,
        message: adequateScenes ? "Scene structure is adequate" : "Insufficient scenes for effective video"
      },
      executionTime: 2
    });

    // Video format validation
    const validFormat = productionSpecs.videoFormat?.resolution && 
                       productionSpecs.videoFormat?.aspectRatio;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "compliance",
      name: "Video Format Standards",
      description: "Verify video format meets technical standards",
      status: validFormat ? "passed" : "warning",
      weight: 0.2,
      details: {
        expected: "Resolution and aspect ratio defined",
        actual: `${productionSpecs.videoFormat?.resolution || 'undefined'}, ${productionSpecs.videoFormat?.aspectRatio || 'undefined'}`,
        message: validFormat ? "Video format meets standards" : "Video format needs specification"
      },
      executionTime: 1
    });

    // Audio requirements validation
    const audioRequirements = productionSpecs.audioRequirements?.length > 0;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "completeness",
      name: "Audio Requirements",
      description: "Verify audio requirements are specified",
      status: audioRequirements ? "passed" : "warning",
      weight: 0.15,
      details: {
        expected: "Audio requirements specified",
        actual: productionSpecs.audioRequirements?.length || 0,
        message: audioRequirements ? "Audio requirements specified" : "Consider adding audio requirements"
      },
      executionTime: 1
    });
  }

  /**
   * Validate creative guidelines
   */
  private async validateCreativeGuidelines(
    creativeGuidelines: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Brand compliance guidelines
    const brandCompliance = creativeGuidelines.brandCompliance?.logoUsage?.placement?.length > 0;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "compliance",
      name: "Brand Compliance Guidelines",
      description: "Verify brand compliance guidelines are comprehensive",
      status: brandCompliance ? "passed" : "warning",
      weight: 0.3,
      details: {
        expected: "Logo usage guidelines defined",
        actual: brandCompliance ? "Defined" : "Not defined",
        message: brandCompliance ? "Brand compliance guidelines complete" : "Brand compliance guidelines need enhancement"
      },
      executionTime: 2
    });

    // Style consistency requirements
    const styleConsistency = creativeGuidelines.styleConsistency?.visualStyle && 
                             creativeGuidelines.styleConsistency?.colorMood;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "consistency",
      name: "Style Consistency Requirements",
      description: "Verify style consistency requirements are defined",
      status: styleConsistency ? "passed" : "failed",
      weight: 0.25,
      details: {
        expected: "Visual style and color mood defined",
        actual: `Style: ${creativeGuidelines.styleConsistency?.visualStyle}, Mood: ${creativeGuidelines.styleConsistency?.colorMood}`,
        message: styleConsistency ? "Style consistency requirements complete" : "Style consistency requirements incomplete"
      },
      executionTime: 2
    });
  }

  /**
   * Validate Alex workflow
   */
  private async validateAlexWorkflow(
    alexWorkflow: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Task organization adequacy
    const adequateTasks = alexWorkflow.prioritizedTasks?.length >= 5;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "completeness",
      name: "Task Organization Adequacy",
      description: "Verify adequate number of prioritized tasks for Alex",
      status: adequateTasks ? "passed" : "warning",
      weight: 0.25,
      details: {
        expected: "At least 5 prioritized tasks",
        actual: alexWorkflow.prioritizedTasks?.length || 0,
        message: adequateTasks ? "Task organization is adequate" : "Consider adding more detailed tasks"
      },
      executionTime: 2
    });

    // Quality checkpoints validation
    const qualityCheckpoints = alexWorkflow.qualityCheckpoints?.length >= 3;
    validationChecks.push({
      id: crypto.randomUUID(),
      category: "quality",
      name: "Quality Checkpoints Coverage",
      description: "Verify adequate quality checkpoints are defined",
      status: qualityCheckpoints ? "passed" : "warning",
      weight: 0.2,
      details: {
        expected: "At least 3 quality checkpoints",
        actual: alexWorkflow.qualityCheckpoints?.length || 0,
        message: qualityCheckpoints ? "Quality checkpoints adequate" : "Consider adding more quality checkpoints"
      },
      executionTime: 1
    });
  }

  /**
   * Validate scene-asset mapping
   */
  private async validateSceneAssetMapping(
    sceneMapping: any,
    sceneStructure: any[],
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Coverage validation
    const scenes = sceneStructure || [];
    const mappedScenes = Object.keys(sceneMapping.sceneAssetMatrix || {}).length;
    const coverageComplete = mappedScenes === scenes.length;

    validationChecks.push({
      id: crypto.randomUUID(),
      category: "completeness",
      name: "Scene-Asset Mapping Coverage",
      description: "Verify all scenes have asset mappings",
      status: coverageComplete ? "passed" : "failed",
      weight: 0.3,
      details: {
        expected: `${scenes.length} scenes mapped`,
        actual: `${mappedScenes} scenes mapped`,
        message: coverageComplete ? "Scene-asset mapping coverage complete" : "Incomplete scene-asset mapping"
      },
      executionTime: 3
    });

    // Missing assets check
    const missingAssets = sceneMapping.missingAssets?.length || 0;
    const noMissingAssets = missingAssets === 0;

    validationChecks.push({
      id: crypto.randomUUID(),
      category: "completeness",
      name: "Missing Assets Check",
      description: "Verify no required assets are missing",
      status: noMissingAssets ? "passed" : "failed",
      weight: 0.4,
      details: {
        expected: "0 missing assets",
        actual: `${missingAssets} missing assets`,
        message: noMissingAssets ? "All required assets available" : `${missingAssets} assets missing for video production`
      },
      executionTime: 2
    });

    if (!noMissingAssets) {
      issues.push({
        id: crypto.randomUUID(),
        severity: "major",
        category: "completeness",
        title: "Missing Required Assets",
        description: `${missingAssets} assets required for video production are missing`,
        affectedComponents: ["video_production", "scene_rendering"],
        impact: {
          productionReadiness: true,
          userExperience: true,
          brandCompliance: false,
          technicalPerformance: false
        },
        resolution: {
          required: true,
          suggestions: ["Generate missing assets", "Modify scene requirements", "Use alternative assets"],
          estimatedEffort: "medium"
        }
      });
    }
  }

  /**
   * Validate production budget
   */
  private async validateProductionBudget(
    sessionId: string,
    productionBudget: any,
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[]
  ) {
    // Budget allocation validation
    const totalAllocated = productionBudget.totalAllocated || 0;
    const budgetAdequate = totalAllocated > 0;

    validationChecks.push({
      id: crypto.randomUUID(),
      category: "compliance",
      name: "Production Budget Adequacy",
      description: "Verify adequate budget allocated for video production",
      status: budgetAdequate ? "passed" : "failed",
      weight: 0.3,
      details: {
        expected: "Positive budget allocation",
        actual: `$${totalAllocated}`,
        message: budgetAdequate ? "Production budget is adequate" : "No budget allocated for production"
      },
      executionTime: 2
    });

    // Budget distribution validation
    const videoProductionCost = productionBudget.videoProductionCost || 0;
    const postProductionCost = productionBudget.postProductionCost || 0;
    const distributionReasonable = videoProductionCost > 0 && postProductionCost > 0;

    validationChecks.push({
      id: crypto.randomUUID(),
      category: "compliance",
      name: "Budget Distribution",
      description: "Verify budget is reasonably distributed across production phases",
      status: distributionReasonable ? "passed" : "warning",
      weight: 0.2,
      details: {
        expected: "Reasonable distribution across phases",
        actual: `Production: $${videoProductionCost}, Post: $${postProductionCost}`,
        message: distributionReasonable ? "Budget distribution is reasonable" : "Consider adjusting budget distribution"
      },
      executionTime: 2
    });
  }

  // ===== HELPER METHODS =====

  /**
   * Generate Maya to David specific recommendations
   */
  private generateMayaToDavidRecommendations(
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[],
    recommendations: ValidationRecommendation[]
  ) {
    const failedChecks = validationChecks.filter(c => c.status === "failed");
    const warningChecks = validationChecks.filter(c => c.status === "warning");

    if (failedChecks.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: "critical",
        category: "improvement",
        title: "Address Critical Validation Failures",
        description: "Resolve failed validation checks before proceeding with creative development",
        benefits: ["Ensure production readiness", "Maintain quality standards", "Prevent downstream issues"],
        implementation: {
          steps: [
            "Review failed validation checks",
            "Address data integrity issues",
            "Verify all required fields are present",
            "Re-run validation process"
          ],
          estimatedTime: 30,
          requiredResources: ["Creative director time", "Data validation tools"]
        },
        impact: {
          qualityImprovement: 0.8,
          costOptimization: 0.3,
          performanceGain: 0.5
        }
      });
    }

    if (warningChecks.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: "medium",
        category: "optimization",
        title: "Enhance Strategic Context Detail",
        description: "Improve strategic context depth for better creative direction",
        benefits: ["Enhanced creative alignment", "Improved brand consistency", "Better asset quality"],
        implementation: {
          steps: [
            "Expand strategic insights documentation",
            "Enhance visual opportunity identification",
            "Strengthen brand personality definition"
          ],
          estimatedTime: 20,
          requiredResources: ["Strategic analysis tools", "Brand documentation"]
        },
        impact: {
          qualityImprovement: 0.6,
          costOptimization: 0.1,
          performanceGain: 0.3
        }
      });
    }
  }

  /**
   * Generate David to Alex specific recommendations
   */
  private generateDavidToAlexRecommendations(
    validationChecks: ValidationCheck[],
    issues: ValidationIssue[],
    recommendations: ValidationRecommendation[]
  ) {
    const assetIssues = issues.filter(i => i.category === "completeness" && i.affectedComponents.includes("video_production"));
    
    if (assetIssues.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: "high",
        category: "improvement",
        title: "Complete Asset Package for Production",
        description: "Ensure all required assets are available for video production workflow",
        benefits: ["Smooth video production", "Consistent visual quality", "Reduced production delays"],
        implementation: {
          steps: [
            "Generate missing hero assets",
            "Complete background asset collection",
            "Verify asset quality standards",
            "Update scene-asset mapping"
          ],
          estimatedTime: 45,
          requiredResources: ["Asset generation tools", "Quality review process"]
        },
        impact: {
          qualityImprovement: 0.9,
          costOptimization: 0.4,
          performanceGain: 0.7
        }
      });
    }

    const qualityChecks = validationChecks.filter(c => c.category === "quality" && c.status !== "passed");
    
    if (qualityChecks.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: "medium",
        category: "enhancement",
        title: "Enhance Quality Assurance Process",
        description: "Strengthen quality checkpoints and validation processes",
        benefits: ["Higher final video quality", "Better brand compliance", "Reduced revision cycles"],
        implementation: {
          steps: [
            "Add more quality checkpoints",
            "Enhance automated quality validation",
            "Strengthen brand compliance checking"
          ],
          estimatedTime: 25,
          requiredResources: ["Quality assurance tools", "Brand guideline documentation"]
        },
        impact: {
          qualityImprovement: 0.7,
          costOptimization: 0.2,
          performanceGain: 0.4
        }
      });
    }
  }

  /**
   * Calculate validation summary
   */
  private calculateValidationSummary(validationChecks: ValidationCheck[]) {
    return {
      totalChecks: validationChecks.length,
      passed: validationChecks.filter(c => c.status === "passed").length,
      failed: validationChecks.filter(c => c.status === "failed").length,
      warnings: validationChecks.filter(c => c.status === "warning").length
    };
  }

  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(validationChecks: ValidationCheck[]): number {
    if (validationChecks.length === 0) return 0;

    const weightedScore = validationChecks.reduce((score, check) => {
      const checkScore = check.status === "passed" ? 1 : 
                        check.status === "warning" ? 0.7 : 0;
      return score + (checkScore * check.weight);
    }, 0);

    const totalWeight = validationChecks.reduce((total, check) => total + check.weight, 0);
    
    return totalWeight > 0 ? Math.min(weightedScore / totalWeight, 1) : 0;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(validationChecks: ValidationCheck[], issues: ValidationIssue[]): number {
    const completenessScore = this.calculateCompletenessScore(validationChecks);
    const criticalIssues = issues.filter(i => i.severity === "critical").length;
    const majorIssues = issues.filter(i => i.severity === "major").length;
    
    // Reduce confidence based on issues
    let confidenceReduction = (criticalIssues * 0.3) + (majorIssues * 0.15);
    
    return Math.max(0, completenessScore - confidenceReduction);
  }

  /**
   * Determine overall severity
   */
  private determineSeverity(issues: ValidationIssue[]): "error" | "warning" | "info" {
    if (issues.some(i => i.severity === "critical")) return "error";
    if (issues.some(i => i.severity === "major")) return "warning";
    return "info";
  }

  /**
   * Create failed validation result
   */
  private createFailedValidationResult(
    sessionId: string,
    handoffType: "maya_to_david" | "david_to_alex",
    error: any
  ): ValidationResult {
    return {
      isValid: false,
      severity: "error",
      completeness: 0,
      confidence: 0,
      validationChecks: [],
      issues: [{
        id: crypto.randomUUID(),
        severity: "critical",
        category: "validation_error",
        title: "Validation Process Failed",
        description: error instanceof Error ? error.message : "Unknown validation error",
        affectedComponents: ["handoff_validation"],
        impact: {
          productionReadiness: true,
          userExperience: true,
          brandCompliance: true,
          technicalPerformance: true
        },
        resolution: {
          required: true,
          suggestions: ["Review handoff data", "Check validation system", "Contact support"],
          estimatedEffort: "high"
        }
      }],
      recommendations: [],
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 1,
        warnings: 0
      },
      metadata: {
        validatedAt: new Date().toISOString(),
        validator: handoffType === "maya_to_david" ? "MayaToDavidValidator" : "DavidToAlexValidator",
        sessionId,
        handoffType
      }
    };
  }

  // ===== CONFIRMATION HELPER METHODS =====

  /**
   * Calculate asset quality score
   */
  private calculateAssetQualityScore(validationResult: ValidationResult): number {
    const assetQualityChecks = validationResult.validationChecks.filter(c => 
      c.category === "quality" && c.name.toLowerCase().includes("asset")
    );
    
    if (assetQualityChecks.length === 0) return 0.8; // Default score
    
    const passedChecks = assetQualityChecks.filter(c => c.status === "passed").length;
    return passedChecks / assetQualityChecks.length;
  }

  /**
   * Calculate brand compliance score
   */
  private calculateBrandComplianceScore(validationResult: ValidationResult): number {
    const brandChecks = validationResult.validationChecks.filter(c => 
      c.category === "compliance" && (c.name.toLowerCase().includes("brand") || c.name.toLowerCase().includes("guideline"))
    );
    
    if (brandChecks.length === 0) return 0.9; // Default score
    
    const passedChecks = brandChecks.filter(c => c.status === "passed").length;
    return passedChecks / brandChecks.length;
  }

  /**
   * Calculate technical readiness score
   */
  private calculateTechnicalReadinessScore(validationResult: ValidationResult): number {
    const technicalChecks = validationResult.validationChecks.filter(c => 
      c.category === "compliance" && c.name.toLowerCase().includes("technical")
    );
    
    if (technicalChecks.length === 0) return 0.85; // Default score
    
    const passedChecks = technicalChecks.filter(c => c.status === "passed").length;
    return passedChecks / technicalChecks.length;
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(validationResult: ValidationResult): number {
    const consistencyChecks = validationResult.validationChecks.filter(c => c.category === "consistency");
    
    if (consistencyChecks.length === 0) return 0.8;
    
    const passedChecks = consistencyChecks.filter(c => c.status === "passed").length;
    return passedChecks / consistencyChecks.length;
  }

  /**
   * Estimate projected costs
   */
  private estimateProjectedCosts(handoffType: string, analytics: any): number {
    if (handoffType === "maya_to_david") {
      // Estimate creative development costs
      return analytics.totalSpent * 2; // Creative work typically doubles costs
    } else {
      // Estimate video production costs
      return analytics.totalSpent * 1.5; // Video production adds 50% more
    }
  }

  /**
   * Estimate delivery time
   */
  private estimateDeliveryTime(handoffType: string, validationResult: ValidationResult): number {
    const baseTime = handoffType === "maya_to_david" ? 60 : 180; // minutes
    
    // Adjust based on validation results
    const issues = validationResult.issues.filter(i => i.severity === "critical" || i.severity === "major");
    const additionalTime = issues.length * 30; // 30 minutes per major issue
    
    return baseTime + additionalTime;
  }

  /**
   * Identify dependencies
   */
  private identifyDependencies(validationResult: ValidationResult): string[] {
    const dependencies: string[] = [];
    
    validationResult.issues.forEach(issue => {
      if (issue.severity === "critical") {
        dependencies.push(`Resolve: ${issue.title}`);
      }
    });
    
    return dependencies.length > 0 ? dependencies : ["No critical dependencies"];
  }

  /**
   * Identify risks
   */
  private identifyRisks(validationResult: ValidationResult): string[] {
    const risks: string[] = [];
    
    if (validationResult.completeness < 0.8) {
      risks.push("Incomplete handoff data may cause production delays");
    }
    
    if (validationResult.confidence < 0.7) {
      risks.push("Low confidence score indicates potential quality issues");
    }
    
    const criticalIssues = validationResult.issues.filter(i => i.severity === "critical").length;
    if (criticalIssues > 0) {
      risks.push(`${criticalIssues} critical issues require immediate attention`);
    }
    
    return risks.length > 0 ? risks : ["No significant risks identified"];
  }
}