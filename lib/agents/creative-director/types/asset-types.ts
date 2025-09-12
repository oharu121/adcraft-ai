/**
 * Creative Director Asset Types
 *
 * TypeScript interfaces for visual assets, creative direction,
 * style palettes, and generation specifications.
 */

// Core visual asset structure
export interface VisualAsset {
  id: string;
  sessionId: string;
  type: AssetType;
  status: AssetStatus;
  
  // Asset metadata
  name: string;
  description: string;
  tags: string[];
  
  // File information
  files: {
    original: AssetFile;
    optimized?: AssetFile;
    thumbnail: AssetFile;
    preview?: AssetFile;
  };
  
  // Generation specifications
  generationSpecs: {
    prompt: string;
    negativePrompt?: string;
    style: string;
    colorPalette: string;
    composition: string;
    dimensions: AssetDimensions;
    quality: AssetQuality;
    seed?: number;
    model?: string;
    parameters?: Record<string, any>;
  };
  
  // Creative context
  creativeContext: {
    purpose: string;
    brandAlignment: number;
    targetAudience: string;
    emotionalTone: string;
    visualHierarchy: string;
  };
  
  // Quality assessment
  quality: {
    overallScore: number;
    technicalQuality: number;
    creativeAlignment: number;
    brandConsistency: number;
    feedback: string[];
    improvements?: string[];
  };
  
  // Usage information
  usage: {
    createdAt: number;
    updatedAt: number;
    usageCount: number;
    lastUsed?: number;
    approvedForProduction: boolean;
  };
  
  // Cost tracking
  cost: {
    generationCost: number;
    storageCost: number;
    processingCost: number;
    totalCost: number;
  };
  
  // Localization
  locale: "en" | "ja";
  metadata?: Record<string, any>;
}

// Asset type enumeration
export type AssetType = 
  | "background"
  | "product-hero"
  | "lifestyle-scene"
  | "overlay"
  | "mood-board"
  | "style-frame"
  | "color-palette"
  | "composition-guide"
  | "texture"
  | "pattern"
  | "lighting-reference"
  | "typography-treatment";

// Asset status enumeration
export type AssetStatus = 
  | "pending"
  | "generating"
  | "processing"
  | "ready"
  | "needs-revision"
  | "approved"
  | "rejected"
  | "archived"
  | "error";

// Asset file structure
export interface AssetFile {
  url: string;
  filename: string;
  format: string;
  dimensions: AssetDimensions;
  fileSize: number;
  mimeType: string;
  quality?: AssetQuality;
  cloudStoragePath?: string;
  downloadUrl?: string;
  metadata?: Record<string, any>;
}

// Asset dimensions
export interface AssetDimensions {
  width: number;
  height: number;
  aspectRatio: string;
  dpi?: number;
  units?: "px" | "in" | "cm" | "mm";
}

// Asset quality levels
export type AssetQuality = "draft" | "standard" | "high" | "premium";

// Creative direction structure
export interface CreativeDirection {
  id: string;
  sessionId: string;
  status: "developing" | "finalized" | "approved" | "needs-revision";
  
  // Core creative strategy
  strategy: {
    visualTheme: string;
    emotionalTone: string;
    brandMessage: string;
    targetAudienceAlignment: string;
    competitiveDifferentiation: string;
  };
  
  // Visual specifications
  visualSpecs: {
    styleDirection: VisualStyleDirection;
    colorPalette: StylePalette;
    typographyGuideline: TypographyGuideline;
    compositionRules: CompositionRules;
    lightingDirection: LightingDirection;
  };
  
  // Asset requirements
  assetRequirements: {
    primary: AssetRequirement[];
    secondary: AssetRequirement[];
    optional: AssetRequirement[];
  };
  
  // Production guidelines
  productionGuidelines: {
    videoSpecifications: VideoSpecs;
    technicalRequirements: TechnicalRequirement[];
    qualityStandards: QualityStandard[];
    deliveryFormat: DeliveryFormat[];
  };
  
  // Handoff information for Alex
  alexHandoffData: {
    narrativeFlow: string[];
    sceneBreakdown: SceneBreakdown[];
    assetMapping: AssetMapping[];
    productionNotes: string[];
    timingGuidelines: TimingGuideline[];
  };
  
  // Validation and approval
  validation: {
    isComplete: boolean;
    brandApproved: boolean;
    technicallyValid: boolean;
    creativelySound: boolean;
    readyForProduction: boolean;
    validationErrors: string[];
    approvalTimestamp?: number;
  };
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  version: number;
  cost: CostTracking;
  locale: "en" | "ja";
}

// Visual style direction
export interface VisualStyleDirection {
  primary: string;
  secondary: string[];
  influences: string[];
  mood: string;
  energy: "low" | "medium" | "high";
  sophistication: "casual" | "professional" | "premium" | "luxury";
  innovation: "traditional" | "contemporary" | "cutting-edge";
  culturalContext: "universal" | "localized" | "cross-cultural";
}

// Style palette comprehensive structure
export interface StylePalette {
  id: string;
  name: string;
  description: string;
  
  // Color specifications
  colors: {
    primary: ColorSpec[];
    secondary: ColorSpec[];
    accent: ColorSpec[];
    neutral: ColorSpec[];
    supporting: ColorSpec[];
  };
  
  // Color relationships
  harmony: {
    type: "monochromatic" | "analogous" | "complementary" | "triadic" | "split-complementary";
    temperature: "warm" | "cool" | "neutral" | "mixed";
    contrast: "low" | "medium" | "high";
    saturation: "muted" | "balanced" | "vibrant";
  };
  
  // Psychological impact
  psychology: {
    emotions: string[];
    brandAssociations: string[];
    culturalMeaning: string;
    targetAudienceResonance: number;
  };
  
  // Usage guidelines
  usage: {
    primary: string; // When to use primary colors
    secondary: string; // When to use secondary colors
    accent: string; // When to use accent colors
    backgrounds: string[]; // Recommended background colors
    text: string[]; // Recommended text colors
    restrictions: string[]; // Colors to avoid or use sparingly
  };
}

// Individual color specification
export interface ColorSpec {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  cmyk?: { c: number; m: number; y: number; k: number };
  pantone?: string;
  description?: string;
  usage?: string;
  accessibility?: {
    wcagAA: boolean;
    wcagAAA: boolean;
    contrastRatio?: number;
  };
}

// Typography guidelines
export interface TypographyGuideline {
  primary: FontSpec;
  secondary?: FontSpec;
  accent?: FontSpec;
  hierarchy: TypographyHierarchy;
  spacing: SpacingSpec;
  treatment: TypographyTreatment;
}

// Font specification
export interface FontSpec {
  family: string;
  weights: number[];
  styles: string[];
  fallbacks: string[];
  characteristics: string[];
  mood: string;
  usage: string;
}

// Typography hierarchy
export interface TypographyHierarchy {
  headline: { size: string; weight: number; lineHeight: string };
  subheadline: { size: string; weight: number; lineHeight: string };
  body: { size: string; weight: number; lineHeight: string };
  caption: { size: string; weight: number; lineHeight: string };
  callout: { size: string; weight: number; lineHeight: string };
}

// Spacing specifications
export interface SpacingSpec {
  letterSpacing: { tight: string; normal: string; wide: string };
  wordSpacing: string;
  lineHeight: { tight: string; normal: string; loose: string };
  paragraphSpacing: string;
}

// Typography treatment
export interface TypographyTreatment {
  effects: string[];
  alignment: string[];
  emphasis: string[];
  decorative: string[];
}

// Composition rules
export interface CompositionRules {
  layout: {
    grid: string;
    balance: "symmetrical" | "asymmetrical" | "radial";
    emphasis: "center" | "rule-of-thirds" | "golden-ratio" | "custom";
    flow: "left-to-right" | "top-to-bottom" | "circular" | "z-pattern";
  };
  
  hierarchy: {
    primary: string;
    secondary: string;
    supporting: string;
  };
  
  spacing: {
    margins: string;
    padding: string;
    gutters: string;
    rhythm: string;
  };
  
  proportions: {
    ratios: string[];
    scaling: string;
    relationships: string;
  };
}

// Lighting direction
export interface LightingDirection {
  mood: "dramatic" | "soft" | "natural" | "artificial" | "mixed";
  temperature: "warm" | "cool" | "neutral" | "variable";
  intensity: "low" | "medium" | "high" | "dramatic";
  direction: "front" | "side" | "back" | "top" | "bottom" | "mixed";
  quality: "hard" | "soft" | "diffused" | "directional";
  shadows: "minimal" | "moderate" | "dramatic" | "creative";
}

// Asset requirement specification
export interface AssetRequirement {
  type: AssetType;
  priority: "critical" | "important" | "nice-to-have";
  specifications: {
    dimensions: AssetDimensions;
    quality: AssetQuality;
    format: string[];
    purpose: string;
    usage: string;
  };
  constraints?: {
    fileSize?: number;
    colorSpace?: string;
    resolution?: number;
    compatibility?: string[];
  };
}

// Video specifications for Alex handoff
export interface VideoSpecs {
  resolution: string;
  frameRate: number;
  aspectRatio: string;
  duration: number;
  format: string;
  codec: string;
  bitrate?: number;
  colorSpace: string;
}

// Technical requirements
export interface TechnicalRequirement {
  category: "file" | "quality" | "compatibility" | "performance";
  requirement: string;
  specification: string;
  priority: "must" | "should" | "could";
  validation: string;
}

// Quality standards
export interface QualityStandard {
  aspect: "visual" | "technical" | "brand" | "creative";
  standard: string;
  measurement: string;
  threshold: number | string;
  validation: string;
}

// Delivery formats
export interface DeliveryFormat {
  name: string;
  extension: string;
  specifications: Record<string, any>;
  usage: string;
  priority: number;
}

// Scene breakdown for video production
export interface SceneBreakdown {
  sceneNumber: number;
  duration: number;
  description: string;
  assets: string[]; // Asset IDs needed for this scene
  mood: string;
  pacing: "slow" | "medium" | "fast";
  transitions: string[];
  notes: string[];
}

// Asset mapping for video production
export interface AssetMapping {
  assetId: string;
  scenes: number[]; // Which scenes use this asset
  usage: "background" | "foreground" | "overlay" | "transition";
  timing: { start: number; end: number }[];
  transformations?: string[];
}

// Timing guidelines
export interface TimingGuideline {
  element: string;
  timing: {
    entrance: number;
    duration: number;
    exit: number;
  };
  animation: string;
  easing: string;
  priority: number;
}

// Cost tracking structure
export interface CostTracking {
  current: number;
  total: number;
  remaining: number;
  breakdown: {
    assetGeneration: number;
    processing: number;
    storage: number;
    aiProcessing: number;
  };
  budget: {
    allocated: number;
    utilized: number;
    percentage: number;
    alerts: string[];
  };
}