/**
 * Creative Director API Request/Response Types
 *
 * TypeScript interfaces for all API endpoints related to the Creative Director Agent,
 * including asset generation, visual analysis, and creative decision types.
 */

import { SessionStatus, AgentType } from "../enums";
import { VisualAsset, CreativeDirection, StylePalette } from "./asset-types";
import { CostTracking } from "./asset-types";
import type { CreativeConversationState } from "./chat-types";

// Re-export for convenience
export type { CreativeConversationState };

// Visual Decision types for David's creative decision tracking
export interface VisualDecision {
  id: string;
  type: "style_selection" | "color_palette" | "composition" | "asset_approval" | "mood_selection";
  title: string;
  description: string;
  options: VisualDecisionOption[];
  selectedOptionId?: string;
  reasoning?: string;
  confidence: number;
  timestamp: string;
  userApproved?: boolean;
  metadata?: Record<string, any>;
}

export interface VisualDecisionOption {
  id: string;
  label: string;
  description: string;
  previewUrl?: string;
  metadata?: Record<string, any>;
}

// Creative Strategy types for David's strategic creative planning
export interface CreativeStrategy {
  id: string;
  sessionId: string;
  overallVision: string;
  visualDirection: {
    style: string;
    mood: string;
    colorPalette: StylePalette;
    composition: string;
  };
  assetPlan: {
    requiredAssets: string[];
    priorityOrder: number[];
    estimatedCosts: number[];
  };
  brandAlignment: {
    score: number;
    guidelines: string[];
    adaptations: string[];
  };
  targetAudience: {
    primary: string;
    secondary: string[];
    insights: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Base API response structure (matching Maya's pattern)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId: string;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  userMessage: string; // Localized error message
  details?: Record<string, any>;
  stack?: string; // Only in development
}

// Creative Director initialization request (from Maya handoff)
export interface CreativeDirectorInitRequest {
  sessionId: string;
  mayaHandoffData: {
    productAnalysis: any; // Maya's complete analysis
    strategicInsights: any; // Maya's strategic recommendations
    visualOpportunities?: any; // Maya's identified visual needs
  };
  locale: "en" | "ja";
  metadata?: Record<string, any>;
}

// Creative Director initialization response
export interface CreativeDirectorInitResponse {
  sessionId: string;
  agentStatus: "ready" | "processing" | "error";
  creativeAssessment: {
    visualOpportunities: string[];
    styleRecommendations: string[];
    assetNeeds: string[];
    estimatedGenerationTime: number;
  };
  cost: {
    estimated: number;
    remaining: number;
  };
  // Add style options following Maya's quickActions pattern
  styleOptions?: StyleOption[];
}

// Style option structure (following demo data pattern)
export interface StyleOption {
  id: string;
  name: string;
  description: string;
  colorPalette: string[];
  visualKeywords: string[];
  animationStyle: string;
  examples: string[];
  // Required fields for UI display (prevent fallback to English)
  typographyStyle: string; // e.g. "Classic & Refined", "Bold & Modern"
  perfectFor: string; // e.g. "Luxury brands, tech products, sophisticated audiences"
}

// Creative chat request
export interface CreativeChatRequest {
  sessionId: string;
  message: string;
  locale: "en" | "ja";
  context?: {
    mayaHandoffData?: any;
    currentVisualDecisions?: any;
    assetPreferences?: any;
    conversationHistory?: any[];
    // New fields for step-specific context
    selectedProductionStyle?: any;
    selectedStyleOption?: any;
    currentStep?: number;
  };
  metadata?: Record<string, any>;
}

// Creative chat response
export interface CreativeChatResponse {
  messageId: string;
  messageType?: "CREATIVE_INTRODUCTION" | "VISUAL_ANALYSIS" | "STYLE_RECOMMENDATION" | "ASSET_DISCUSSION" | "CREATIVE_DECISION" | "DIRECTION_CONFIRMATION" | "COLLABORATION_REQUEST" | "ASSET_GENERATION_UPDATE" | "HANDOFF_PREPARATION" | "CREATIVE_INSIGHT" | "MARKET_INSIGHT" | "CULTURAL_ADAPTATION";
  agentResponse: string;
  processingTime: number;
  cost: number;
  confidence?: number;
  nextAction: "continue" | "generate_assets" | "finalize_direction" | "handoff" | "awaiting_confirmation";
  suggestedActions?: string[];
  quickActions?: string[];
  visualRecommendations?: {
    styleUpdates?: Partial<StylePalette>;
    compositionSuggestions?: string[];
    colorPaletteAdjustments?: any;
    styleOptions?: Array<{
      name: string;
      alignment: number;
    }>;
    colorPaletteOptions?: any[];
  };
  metadata?: {
    proposedDirection?: CreativeDirection;
    requiresConfirmation?: boolean;
    assetGenerationRequested?: boolean;
    directionConfirmationRequested?: boolean;
    readyForHandoff?: boolean;
  };
}

// Asset generation request
export interface AssetGenerationRequest {
  sessionId: string;
  assetType: "background" | "product-hero" | "lifestyle-scene" | "overlay" | "mood-board" | "style-frame";
  specifications: {
    style: string;
    colorPalette: any;
    composition: string;
    dimensions: {
      width: number;
      height: number;
      aspectRatio: string;
    };
  };
  context: {
    productInfo: any;
    brandGuidelines?: any;
    targetAudience: any;
  };
  options?: {
    quality: "standard" | "high" | "premium";
    variations: number;
    seed?: number;
  };
  locale: "en" | "ja";
}

// Asset generation response
export interface AssetGenerationResponse {
  assetId: string;
  assetType: string;
  status: "pending" | "generating" | "processing" | "ready" | "needs-revision" | "approved" | "rejected" | "archived" | "error";
  assets: VisualAsset[];
  generationTime: number;
  cost: number;
  quality: {
    score: number;
    feedback: string[];
  };
  downloadUrls?: {
    original: string;
    optimized: string;
    thumbnail: string;
  };
}

// Creative direction finalization request
export interface CreativeDirectionRequest {
  sessionId: string;
  finalDirection: CreativeDirection;
  selectedAssets: string[]; // Asset IDs
  customizations?: {
    colorAdjustments?: any;
    compositionTweaks?: any;
    styleRefinements?: any;
  };
  locale: "en" | "ja";
}

// Creative direction response
export interface CreativeDirectionResponse {
  directionId: string;
  finalDirection: CreativeDirection;
  assetPackage: {
    primary: VisualAsset[];
    secondary: VisualAsset[];
    overlays: VisualAsset[];
  };
  alexHandoffData: {
    creativeDirection: CreativeDirection;
    visualAssets: VisualAsset[];
    productionNotes: string[];
    technicalSpecs: any;
  };
  totalCost: number;
  processingTime: number;
}

// David status response
export interface CreativeDirectorStatusResponse {
  sessionId: string;
  status: SessionStatus;
  currentAgent: AgentType;
  progress: {
    phase: "analysis" | "creative_development" | "asset_generation" | "finalization";
    step: number;
    totalSteps: number;
    description: string;
    percentage: number;
  };
  creativeState: {
    visualDecisionsMade: number;
    assetsGenerated: number;
    directionFinalized: boolean;
  };
  cost: CostTracking;
  lastActivity: string;
  health: {
    isActive: boolean;
    connectionStatus: string;
    errorCount: number;
  };
}

// Handoff to Alex request
export interface AlexHandoffRequest {
  sessionId: string;
  validateAssets: boolean;
  includeMetadata: boolean;
  productionReadiness: boolean;
}

// Handoff to Alex response
export interface AlexHandoffResponse {
  success: boolean;
  targetAgent: AgentType;
  handoffTimestamp: string;
  creativePackage: {
    direction: CreativeDirection;
    assets: VisualAsset[];
    productionNotes: string[];
    technicalSpecs: any;
  };
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    assetQuality: {
      ready: string[];
      needsWork: string[];
    };
  };
  estimatedVideoProductionTime: number;
}

// Asset management requests
export interface AssetListRequest {
  sessionId: string;
  assetType?: string[];
  status?: "generating" | "complete" | "error";
  sortBy?: "created" | "type" | "quality" | "cost";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface AssetListResponse {
  assets: VisualAsset[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  summary: {
    totalAssets: number;
    byType: Record<string, number>;
    totalCost: number;
  };
}

// Visual style analysis request
export interface VisualAnalysisRequest {
  sessionId: string;
  analysisType: "style_assessment" | "brand_alignment" | "competitive_analysis";
  context: {
    productInfo: any;
    brandGuidelines?: any;
    targetMarket: any;
    competitiveContext?: any;
  };
  locale: "en" | "ja";
}

// Visual style analysis response
export interface VisualAnalysisResponse {
  analysisId: string;
  analysisType: string;
  insights: {
    styleRecommendations: string[];
    colorPaletteSuggestions: any;
    compositionGuidelines: string[];
    brandAlignmentScore: number;
  };
  visualOpportunities: {
    primary: string[];
    secondary: string[];
    innovative: string[];
  };
  competitiveAdvantage?: {
    differentiators: string[];
    marketPosition: string;
    visualStrategy: string;
  };
  processingTime: number;
  cost: number;
}

// API configuration options (matching Maya's pattern)
export interface ApiOptions {
  timeout?: number;
  retries?: number;
  backoff?: "linear" | "exponential";
  cache?: boolean;
  validateResponse?: boolean;
}

// Gemini chat request (for real mode processing)
export interface GeminiChatRequest {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  locale: "en" | "ja";
}

// API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
  interceptors: {
    request?: ((config: any) => any)[];
    response?: ((response: any) => any)[];
  };
}