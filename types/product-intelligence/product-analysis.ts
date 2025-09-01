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
  EmotionalTriggerType
} from './enums';

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
  unit: 'cm' | 'inch' | 'kg' | 'lb';
}

// Price range information
export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// Basic product information structure
export interface ProductInfo {
  id: string;
  category: ProductCategory;
  subcategory: string;
  name: string;
  description: string;
  keyFeatures: string[];
  materials: string[];
  colors: Color[];
  dimensions?: ProductDimensions;
  priceRange?: PriceRange;
  usageContext: string[];
  seasonality?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
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

// Complete target audience analysis
export interface TargetAudience {
  primary: TargetAudienceSegment;
  secondary?: TargetAudienceSegment;
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
  marketShare?: 'challenger' | 'leader' | 'niche';
}

// Brand positioning strategy
export interface Positioning {
  brandPersonality: BrandPersonality;
  valueProposition: ValueProposition;
  competitiveAdvantages: CompetitiveAdvantages;
  marketPosition: MarketPosition;
}

// Key commercial messages
export interface KeyMessages {
  headline: string;
  tagline: string;
  supportingMessages: string[];
}

// Emotional trigger definition
export interface EmotionalTrigger {
  type: EmotionalTriggerType;
  description: string;
  intensity: 'subtle' | 'moderate' | 'strong';
}

// Emotional triggers for marketing
export interface EmotionalTriggers {
  primary: EmotionalTrigger;
  secondary: EmotionalTrigger[];
}

// Call to action options
export interface CallToAction {
  primary: string;
  secondary: string[];
}

// Storytelling structure for commercials
export interface Storytelling {
  narrative: string;
  conflict: string;
  resolution: string;
}

// Commercial strategy insights
export interface CommercialStrategy {
  keyMessages: KeyMessages;
  emotionalTriggers: EmotionalTriggers;
  callToAction: CallToAction;
  storytelling: Storytelling;
}

// Color palette for visual direction
export interface ColorPalette {
  primary: Color[];
  secondary: Color[];
  accent: Color[];
}

// Visual preferences for creative direction
export interface VisualPreferences {
  overallStyle: VisualStyle;
  colorPalette: ColorPalette;
  mood: Mood;
  composition: Composition;
  lighting: Lighting;
  environment: string[];
}

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
  locale: 'en' | 'ja';
  timestamp: string;
  agentInteractions: number;
}

// Complete Product Analysis structure
export interface ProductAnalysis {
  // Core product information
  product: ProductInfo;
  
  // Target audience analysis
  targetAudience: TargetAudience;
  
  // Brand positioning strategy
  positioning: Positioning;
  
  // Commercial strategy insights
  commercialStrategy: CommercialStrategy;
  
  // Visual direction for Creative Director Agent
  visualPreferences: VisualPreferences;
  
  // Session and processing metadata
  metadata: AnalysisMetadata;
}