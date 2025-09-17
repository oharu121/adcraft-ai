/**
 * Product Analysis Data Structures
 *
 * Comprehensive data structures for product analysis results from Vertex AI Gemini Pro Vision
 * and conversation refinement through the Product Intelligence Agent.
 */

import {
  ProductCategory,
  MarketTier,
  ColorRole,
  Gender,
  IncomeLevel,
  BrandLoyalty,
  BrandTone,
  VisualStyle,
  Mood,
  Composition,
  Lighting,
  EmotionalTriggerType,
} from "../enums";

// Color information extracted from product analysis
export interface Color {
  name: string;
  hex: string;
  role: ColorRole;
}

// Product dimensions and specifications
export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  unit: "cm" | "inch" | "kg" | "lb";
}

// Price range information
export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// Simplified product information structure
export interface ProductInfo {
  name: string;
  description: string;
  keyFeatures: string[];
}

// Demographics for target audience
export interface Demographics {
  ageRange: string;
  gender: Gender;
  incomeLevel: IncomeLevel;
  location: string[];
  lifestyle: string[];
}

// Psychographic information
export interface Psychographics {
  values: string[];
  interests: string[];
  personalityTraits: string[];
  motivations: string[];
}

// Behavioral patterns
export interface Behaviors {
  shoppingHabits: string[];
  mediaConsumption: string[];
  brandLoyalty: BrandLoyalty;
  decisionFactors: string[];
}

// Target audience segment definition
export interface TargetAudienceSegment {
  demographics: Demographics;
  psychographics: Psychographics;
  behaviors: Behaviors;
}

// Simplified target audience analysis
export interface TargetAudience {
  ageRange: string;
  description: string;
}

// Brand personality traits
export interface BrandPersonality {
  traits: string[];
  tone: BrandTone;
  voice: string;
}

// Value proposition structure
export interface ValueProposition {
  primaryBenefit: string;
  supportingBenefits: string[];
  differentiators: string[];
}

// Competitive advantages categorization
export interface CompetitiveAdvantages {
  functional: string[];
  emotional: string[];
  experiential: string[];
}

// Market positioning information
export interface MarketPosition {
  tier: MarketTier;
  niche?: string;
  marketShare?: "challenger" | "leader" | "niche";
}

// Brand positioning strategy
export interface Positioning {
  valueProposition: {
    primaryBenefit: string;
  };
}

// Key commercial messages
export interface KeyMessages {
  headline: string;
  tagline: string;
  supportingMessages: readonly string[];
}

// Emotional trigger definition
export interface EmotionalTrigger {
  type: EmotionalTriggerType;
  description: string;
  intensity: "subtle" | "moderate" | "strong";
}

// Emotional triggers for marketing
export interface EmotionalTriggers {
  primary: EmotionalTrigger;
  secondary: EmotionalTrigger[];
}

// Call to action options
export interface CallToAction {
  primary: string;
  secondary: readonly string[];
}

// Storytelling structure for commercials
export interface Storytelling {
  narrative: string;
  conflict: string;
  resolution: string;
}

// Key scenes for commercial video
export interface KeyScenes {
  scenes: Array<{
    id: string;
    title: string;
    description: string;
    duration?: string; // e.g., "3-5 seconds"
    purpose: string; // e.g., "hook audience", "showcase product", "emotional connection"
  }>;
}

// Note: CommercialStrategy and VisualPreferences moved to David (Creative Director Agent)
// EmotionalTriggers, CallToAction, Storytelling, KeyScenes will be handled by David/Zara
// ColorPalette and visual elements will be handled by David

// Cost breakdown tracking
export interface CostBreakdown {
  imageAnalysis: number;
  chatInteractions: number;
}

// Cost tracking information
export interface CostTracking {
  current: number;
  total: number;
  breakdown: CostBreakdown;
  remaining: number;
  budgetAlert: boolean;
}

// Analysis metadata
export interface AnalysisMetadata {
  sessionId: string;
  analysisVersion: string;
  confidenceScore: number; // 0-1
  processingTime: number; // milliseconds
  cost: CostTracking;
  locale: "en" | "ja";
  timestamp: string;
  agentInteractions: number;
}

// Complete Product Analysis structure
export interface ProductAnalysis {
  // Core product information
  product: ProductInfo;

  // Target audience analysis
  targetAudience: TargetAudience;

  // Key messaging
  keyMessages: KeyMessages;

  // Session and processing metadata
  metadata: AnalysisMetadata;
}

export interface ProductIntelligenceAgentConfig {
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
  maxFileSize: number;
  supportedImageFormats: string[];
  defaultLocale: "en" | "ja";
}

export interface AgentPerformanceMetrics {
  avgProcessingTime: number;
  successRate: number;
  confidenceScore: number;
  totalProcessed: number;
  errorsEncountered: number;
}
