/**
 * Agent Handoff Types
 *
 * TypeScript interfaces for data exchange between agents in the 3-agent architecture.
 * Defines structured handoff data formats for Maya → David and David → Alex transitions.
 */

import { ProductAnalysis } from "@/lib/agents/product-intelligence/types/product-analysis";

// Base handoff metadata shared by all agent transitions
export interface BaseHandoffMetadata {
  readonly sessionId: string;
  readonly timestamp: Date;
  readonly version: '1.0';
  readonly sourceAgent: 'maya' | 'david' | 'alex';
  readonly targetAgent: 'maya' | 'david' | 'alex';
  readonly handoffId: string; // UUID for tracking
}

// Validation results for handoff data integrity
export interface HandoffValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly completeness: number; // 0-1 score
  readonly timestamp: Date;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly severity: 'critical' | 'error';
  readonly code: string;
}

export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly severity: 'warning' | 'info';
  readonly recommendation?: string;
}

// Maya to David Handoff Data
export interface MayaToDataHandoffData extends BaseHandoffMetadata {
  readonly sourceAgent: 'maya';
  readonly targetAgent: 'david';

  // Core product analysis from Maya (refined scope)
  readonly productAnalysis: ProductAnalysisRefined;

  // Strategic insights and messaging strategy (Maya's enhanced focus)
  readonly strategicInsights: StrategicInsights;
  readonly messagingStrategy: MessagingStrategy;

  // Handoff preparation data
  readonly handoffSummary: HandoffSummary;
  readonly davidInstructions: DavidInstructions;
  readonly validationResults: HandoffValidationResult;
}

// Refined product analysis for Maya's reduced scope (no visual/audio elements)
export interface ProductAnalysisRefined {
  readonly sessionId: string;
  readonly productId: string;
  readonly analysisId: string;
  readonly timestamp: Date;

  // Core product information (preserved from original)
  readonly basicInfo: {
    readonly name: string;
    readonly category: string;
    readonly description: string;
    readonly price?: number;
    readonly brand?: string;
    readonly targetMarket: string;
  };

  // Enhanced messaging focus (Maya's new strength)
  readonly messaging: {
    readonly coreValue: string;
    readonly uniqueSellingPoints: string[];
    readonly targetAudienceInsights: TargetAudienceInsights;
    readonly competitiveAdvantage: string[];
    readonly brandPositioning: string;
  };

  // Strategic analysis (Maya's enhanced capability)
  readonly strategic: {
    readonly marketOpportunity: string;
    readonly audienceAlignment: number; // 0-1 score
    readonly brandConsistency: number; // 0-1 score
    readonly recommendedApproach: string;
    readonly keyInsights: string[];
  };

  // Preserved technical data
  readonly metadata: {
    readonly confidence: number;
    readonly processingTime: number;
    readonly cost: number;
    readonly analysisVersion: string;
  };
}

export interface TargetAudienceInsights {
  readonly primary: {
    readonly demographics: string;
    readonly psychographics: string;
    readonly painPoints: string[];
    readonly motivations: string[];
  };
  readonly secondary?: {
    readonly demographics: string;
    readonly opportunitySize: string;
  };
  readonly messaging: {
    readonly tone: string;
    readonly approach: string;
    readonly keyMessages: string[];
  };
}

// Strategic insights (Maya's enhanced focus area)
export interface StrategicInsights {
  readonly overallStrategy: string;
  readonly marketPosition: string;
  readonly competitiveAdvantage: string[];
  readonly brandAlignment: {
    readonly score: number; // 0-1
    readonly strengths: string[];
    readonly opportunities: string[];
    readonly recommendations: string[];
  };
  readonly audienceStrategy: {
    readonly primary: string;
    readonly secondary: string[];
    readonly engagementApproach: string;
  };
  readonly successMetrics: string[];
}

// Messaging strategy (Maya's new core capability)
export interface MessagingStrategy {
  readonly coreMessage: string;
  readonly keyMessages: string[];
  readonly callToAction: string;
  readonly emotionalTone: string;
  readonly communicationStyle: string;
  readonly brandVoice: {
    readonly personality: string[];
    readonly tone: string;
    readonly language: string;
    readonly avoidance: string[];
  };
  readonly audienceAdaptation: {
    readonly primary: string;
    readonly secondary: Record<string, string>; // audience -> adapted message
  };
}

// Handoff summary for David's context
export interface HandoffSummary {
  readonly productOverview: string;
  readonly strategicDirection: string;
  readonly keyInsights: string[];
  readonly creativeOpportunities: string[];
  readonly constraintsAndConsiderations: string[];
  readonly successCriteria: string[];
}

// Instructions and guidance for David
export interface DavidInstructions {
  readonly visualDirection: string;
  readonly styleRecommendations: string[];
  readonly creativeGuidance: string[];
  readonly brandConsiderations: string[];
  readonly audienceConsiderations: string[];
  readonly technicalRequirements: string[];
  readonly budgetGuidelines: {
    readonly estimatedRange: string;
    readonly priorityAssets: string[];
    readonly costConsiderations: string[];
  };
}

// David to Alex Handoff Data
export interface DavidToAlexHandoffData extends BaseHandoffMetadata {
  readonly sourceAgent: 'david';
  readonly targetAgent: 'alex';

  // Creative brief and concept from David
  readonly creativeBrief: CreativeBrief;
  readonly visualConcept: VisualConcept;
  readonly brandGuidelines: BrandGuidelines;

  // Generated assets from David
  readonly generatedAssets: GeneratedAsset[];
  readonly sceneComposition: SceneComposition[];
  readonly styleGuide: StyleGuide;

  // Production requirements for Alex
  readonly productionRequirements: ProductionRequirements;
  readonly deliverySpecs: DeliverySpecifications;
  readonly approvalStatus: ApprovalStatus;

  // Context from Maya (passed through David)
  readonly mayaContext: {
    readonly productAnalysis: ProductAnalysisRefined;
    readonly strategicInsights: StrategicInsights;
    readonly messagingStrategy: MessagingStrategy;
  };
}

// Creative brief from David for Alex
export interface CreativeBrief {
  readonly concept: string;
  readonly targetAudience: string;
  readonly keyMessages: string[];
  readonly callToAction: string;
  readonly tone: string;
  readonly duration: number; // preferred duration in seconds
  readonly visualTheme: string;
  readonly narrative: string;
}

// Visual concept and direction
export interface VisualConcept {
  readonly theme: string;
  readonly colorPalette: ColorPalette;
  readonly visualStyle: string;
  readonly mood: string;
  readonly moodBoard: string[]; // URLs to reference images
  readonly compositionStyle: string;
}

export interface ColorPalette {
  readonly primary: string[];
  readonly secondary: string[];
  readonly accent: string[];
  readonly neutral: string[];
  readonly metadata: {
    readonly mood: string;
    readonly harmony: string;
    readonly contrast: number; // 0-1
  };
}

// Brand guidelines for video production
export interface BrandGuidelines {
  readonly brandName: string;
  readonly logoUrl: string;
  readonly primaryColors: string[];
  readonly secondaryColors: string[];
  readonly typography: TypographyGuide;
  readonly restrictions: BrandRestriction[];
  readonly guidelines: BrandGuideline[];
}

export interface TypographyGuide {
  readonly primaryFont: string;
  readonly secondaryFont: string;
  readonly headingStyle: TextStyle;
  readonly bodyStyle: TextStyle;
}

export interface TextStyle {
  readonly fontSize: number;
  readonly fontWeight: string;
  readonly lineHeight: number;
  readonly color: string;
  readonly letterSpacing?: number;
}

export interface BrandRestriction {
  readonly type: 'color' | 'content' | 'placement' | 'timing' | 'style';
  readonly description: string;
  readonly severity: 'warning' | 'error';
  readonly alternatives?: string[];
}

export interface BrandGuideline {
  readonly area: 'visual' | 'content' | 'tone' | 'usage';
  readonly rule: string;
  readonly examples?: string[];
  readonly rationale?: string;
}

// Generated assets from David
export interface GeneratedAsset {
  readonly assetId: string;
  readonly type: 'product-shot' | 'lifestyle' | 'background' | 'logo' | 'overlay';
  readonly url: string;
  readonly dimensions: { width: number; height: number };
  readonly description: string;
  readonly usageGuidelines: string;
  readonly quality: {
    readonly score: number; // 0-1
    readonly feedback: string[];
  };
  readonly generationTime: number;
  readonly cost: number;
}

// Scene composition for video production
export interface SceneComposition {
  readonly sceneId: string;
  readonly duration: number;
  readonly description: string;
  readonly keyAssets: string[]; // asset IDs
  readonly transitions: TransitionSpec[];
  readonly voiceoverScript?: string;
  readonly cameraDirection?: CameraDirection;
}

export interface TransitionSpec {
  readonly type: 'fade' | 'cut' | 'slide' | 'zoom' | 'dissolve';
  readonly duration: number;
  readonly easing: string;
  readonly parameters?: Record<string, any>;
}

export interface CameraDirection {
  readonly shot: 'close-up' | 'medium' | 'wide' | 'macro';
  readonly angle: 'eye-level' | 'high' | 'low' | 'dutch';
  readonly movement?: 'static' | 'pan' | 'zoom' | 'dolly';
  readonly focus: string;
}

// Style guide from David
export interface StyleGuide {
  readonly overallStyle: string;
  readonly lighting: LightingGuide;
  readonly cameraWork: CameraGuide;
  readonly effects: EffectGuide[];
  readonly consistency: ConsistencyRules;
}

export interface LightingGuide {
  readonly mood: 'bright' | 'dramatic' | 'soft' | 'natural';
  readonly keyLighting: string;
  readonly shadowIntensity: number; // 0-1
  readonly colorTemperature: string;
}

export interface CameraGuide {
  readonly preferredShots: string[];
  readonly movementStyle: string;
  readonly focusStrategy: string;
  readonly framingRules: string[];
}

export interface EffectGuide {
  readonly effectType: string;
  readonly intensity: number; // 0-1
  readonly timing: 'start' | 'middle' | 'end' | 'throughout';
  readonly parameters: Record<string, any>;
}

export interface ConsistencyRules {
  readonly colorConsistency: string;
  readonly styleConsistency: string;
  readonly brandingRules: string[];
  readonly qualityStandards: string[];
}

// Production requirements for Alex
export interface ProductionRequirements {
  readonly targetDuration: number; // seconds
  readonly resolution: Resolution;
  readonly frameRate: number;
  readonly aspectRatio: string;
  readonly deliveryFormat: VideoFormat;
  readonly qualityLevel: 'standard' | 'high' | 'premium';
  readonly technicalSpecs: TechnicalSpecs;
}

export interface Resolution {
  readonly width: number;
  readonly height: number;
  readonly label: string; // e.g., '1080p', '4K'
}

export interface VideoFormat {
  readonly format: 'mp4' | 'webm' | 'mov';
  readonly codec: string;
  readonly quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface TechnicalSpecs {
  readonly bitrate: number;
  readonly compression: string;
  readonly colorSpace: string;
  readonly audioSpecs?: AudioSpecs;
}

export interface AudioSpecs {
  readonly format: 'mp3' | 'aac' | 'wav';
  readonly sampleRate: number;
  readonly bitrate: number;
  readonly channels: number;
}

// Delivery specifications
export interface DeliverySpecifications {
  readonly platforms: DeliveryPlatform[];
  readonly fileSize: FileSizeLimit;
  readonly compressionSettings: CompressionSettings;
  readonly deliveryDeadline: Date;
  readonly deliveryMethod: 'download' | 'streaming' | 'both';
}

export interface DeliveryPlatform {
  readonly platform: 'web' | 'mobile' | 'social' | 'tv' | 'email';
  readonly specifications: PlatformSpec;
}

export interface PlatformSpec {
  readonly maxDuration: number;
  readonly preferredAspectRatio: string;
  readonly maxFileSize: number;
  readonly requiredFormats: VideoFormat[];
  readonly optimizations: string[];
}

export interface FileSizeLimit {
  readonly maximum: number; // MB
  readonly preferred: number; // MB
  readonly acceptable: number; // MB
}

export interface CompressionSettings {
  readonly codec: string;
  readonly bitrate: number;
  readonly quality: number; // 0-100
  readonly preset: string;
}

// Approval status from David
export interface ApprovalStatus {
  readonly approved: boolean;
  readonly approvedBy: string;
  readonly approvedAt: Date;
  readonly conditions?: string[];
  readonly revisionRequests?: RevisionRequest[];
  readonly qualityAssurance: QualityAssurance;
}

export interface RevisionRequest {
  readonly requestId: string;
  readonly description: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly affectedScenes: string[];
  readonly suggestedChanges: string[];
}

export interface QualityAssurance {
  readonly overallScore: number; // 0-1
  readonly criteria: QualityCriteria[];
  readonly passedChecks: string[];
  readonly failedChecks: string[];
  readonly recommendations: string[];
}

export interface QualityCriteria {
  readonly criterion: string;
  readonly passed: boolean;
  readonly score: number; // 0-1
  readonly feedback: string;
}

// Handoff processing status
export type HandoffStatus =
  | 'pending'
  | 'validating'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

// Handoff processing result
export interface HandoffProcessingResult {
  readonly handoffId: string;
  readonly status: HandoffStatus;
  readonly processedAt: Date;
  readonly processingTime: number; // seconds
  readonly validationResults: HandoffValidationResult;
  readonly errors?: ProcessingError[];
  readonly warnings?: ProcessingWarning[];
}

export interface ProcessingError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly severity: 'error' | 'critical';
}

export interface ProcessingWarning {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly impact: string;
}

// Export utility types
export type HandoffData = MayaToDataHandoffData | DavidToAlexHandoffData;
export type AgentType = 'maya' | 'david' | 'alex';
export type HandoffDirection = 'maya-to-david' | 'david-to-alex';