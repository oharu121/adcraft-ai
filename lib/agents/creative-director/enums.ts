/**
 * Creative Director Enums
 *
 * Enumerated types for David's visual styles, constants,
 * and creative decision categories.
 */

// Session status for Creative Director
export enum SessionStatus {
  INITIALIZING = "initializing",
  READY = "ready", 
  ANALYZING = "analyzing",
  CREATING = "creating",
  GENERATING_ASSETS = "generating_assets",
  AWAITING_INPUT = "awaiting_input",
  FINALIZING = "finalizing",
  COMPLETED = "completed",
  ERROR = "error",
  PAUSED = "paused",
}

// Agent types in the pipeline
export enum AgentType {
  MAYA = "maya",
  DAVID = "david",
  ALEX = "alex",
}

// Visual style categories
export enum VisualStyle {
  MINIMALIST = "minimalist",
  LUXURY = "luxury", 
  MODERN = "modern",
  CLASSIC = "classic",
  BOLD = "bold",
  ORGANIC = "organic",
  TECH = "tech",
  ARTISAN = "artisan",
  URBAN = "urban",
  NATURAL = "natural",
  SOPHISTICATED = "sophisticated",
  PLAYFUL = "playful",
}

// Color palette moods
export enum ColorMood {
  ENERGETIC = "energetic",
  CALMING = "calming",
  SOPHISTICATED = "sophisticated", 
  WARM = "warm",
  COOL = "cool",
  VIBRANT = "vibrant",
  MUTED = "muted",
  NATURAL = "natural",
  DRAMATIC = "dramatic",
  PROFESSIONAL = "professional",
  FRIENDLY = "friendly",
  PREMIUM = "premium",
}

// Asset generation status
export enum AssetStatus {
  PENDING = "pending",
  GENERATING = "generating",
  PROCESSING = "processing",
  READY = "ready",
  NEEDS_REVISION = "needs_revision",
  APPROVED = "approved",
  REJECTED = "rejected",
  ARCHIVED = "archived",
  ERROR = "error",
}

// Asset types for generation
export enum AssetType {
  BACKGROUND = "background",
  PRODUCT_HERO = "product-hero",
  LIFESTYLE_SCENE = "lifestyle-scene",
  OVERLAY = "overlay",
  MOOD_BOARD = "mood-board",
  STYLE_FRAME = "style-frame",
  COLOR_PALETTE = "color-palette",
  COMPOSITION_GUIDE = "composition-guide",
  TEXTURE = "texture",
  PATTERN = "pattern",
  LIGHTING_REFERENCE = "lighting-reference",
  TYPOGRAPHY_TREATMENT = "typography-treatment",
}

// Creative decision types
export enum CreativeDecisionType {
  STYLE_DIRECTION = "style_direction",
  COLOR_PALETTE = "color_palette",
  COMPOSITION = "composition",
  LIGHTING = "lighting",
  TYPOGRAPHY = "typography",
  MOOD = "mood",
  BRAND_ALIGNMENT = "brand_alignment",
  TARGET_AUDIENCE = "target_audience",
}

// Quality levels
export enum QualityLevel {
  DRAFT = "draft",
  STANDARD = "standard", 
  HIGH = "high",
  PREMIUM = "premium",
}

// Message types for Creative Director
export enum CreativeMessageType {
  CREATIVE_INTRODUCTION = "CREATIVE_INTRODUCTION",
  VISUAL_ANALYSIS = "VISUAL_ANALYSIS",
  STYLE_RECOMMENDATION = "STYLE_RECOMMENDATION", 
  ASSET_DISCUSSION = "ASSET_DISCUSSION",
  CREATIVE_DECISION = "CREATIVE_DECISION",
  DIRECTION_CONFIRMATION = "DIRECTION_CONFIRMATION",
  COLLABORATION_REQUEST = "COLLABORATION_REQUEST",
  ASSET_GENERATION_UPDATE = "ASSET_GENERATION_UPDATE",
  HANDOFF_PREPARATION = "HANDOFF_PREPARATION",
  CREATIVE_INSIGHT = "CREATIVE_INSIGHT",
  MARKET_INSIGHT = "MARKET_INSIGHT",
  CULTURAL_ADAPTATION = "CULTURAL_ADAPTATION",
}

// Quick action types for David's interface
export enum CreativeQuickActionType {
  STYLE_SELECTION = "STYLE_SELECTION",
  COLOR_APPROVAL = "COLOR_APPROVAL",
  ASSET_GENERATION = "ASSET_GENERATION",
  COMPOSITION_CHOICE = "COMPOSITION_CHOICE", 
  REVISION_REQUEST = "REVISION_REQUEST",
  DIRECTION_CONFIRMATION = "DIRECTION_CONFIRMATION",
  HANDOFF_INITIATION = "HANDOFF_INITIATION",
}

// Creative phases in David's workflow
export enum CreativePhase {
  ANALYSIS = "analysis",
  CREATIVE_DEVELOPMENT = "creative_development",
  ASSET_GENERATION = "asset_generation", 
  FINALIZATION = "finalization",
}

// Composition principles
export enum CompositionPrinciple {
  RULE_OF_THIRDS = "rule-of-thirds",
  GOLDEN_RATIO = "golden-ratio",
  CENTER_FOCUS = "center-focus",
  SYMMETRICAL = "symmetrical",
  ASYMMETRICAL = "asymmetrical", 
  LEADING_LINES = "leading-lines",
  FRAMING = "framing",
  PATTERNS = "patterns",
  CONTRAST = "contrast",
  BALANCE = "balance",
}

// Color harmony types
export enum ColorHarmony {
  MONOCHROMATIC = "monochromatic",
  ANALOGOUS = "analogous",
  COMPLEMENTARY = "complementary",
  TRIADIC = "triadic",
  SPLIT_COMPLEMENTARY = "split-complementary",
  TETRADIC = "tetradic",
}

// Lighting types
export enum LightingType {
  DRAMATIC = "dramatic",
  SOFT = "soft",
  NATURAL = "natural",
  ARTIFICIAL = "artificial",
  MIXED = "mixed",
  DIRECTIONAL = "directional",
  DIFFUSED = "diffused",
}

// Brand alignment levels
export enum BrandAlignment {
  PERFECT = "perfect",
  STRONG = "strong",
  GOOD = "good",
  MODERATE = "moderate",
  WEAK = "weak",
  MISALIGNED = "misaligned",
}

// Creative confidence levels  
export enum CreativeConfidence {
  VERY_HIGH = "very_high",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  VERY_LOW = "very_low",
}

// Cultural context for creative decisions
export enum CulturalContext {
  UNIVERSAL = "universal",
  WESTERN = "western", 
  EASTERN = "eastern",
  LOCALIZED = "localized",
  CROSS_CULTURAL = "cross_cultural",
}

// Processing priorities for asset generation
export enum ProcessingPriority {
  CRITICAL = "critical",
  HIGH = "high",
  NORMAL = "normal",
  LOW = "low",
  BATCH = "batch",
}

// Error types specific to Creative Director
export enum CreativeErrorType {
  ASSET_GENERATION_FAILED = "asset_generation_failed",
  STYLE_ANALYSIS_ERROR = "style_analysis_error", 
  COLOR_PALETTE_ERROR = "color_palette_error",
  COMPOSITION_ERROR = "composition_error",
  BRAND_ALIGNMENT_ERROR = "brand_alignment_error",
  HANDOFF_PREPARATION_ERROR = "handoff_preparation_error",
  COST_BUDGET_EXCEEDED = "cost_budget_exceeded",
  QUALITY_THRESHOLD_FAILED = "quality_threshold_failed",
}

// Constants for Creative Director
export const CREATIVE_DIRECTOR_CONSTANTS = {
  // Asset generation limits
  MAX_ASSETS_PER_SESSION: 50,
  MAX_CONCURRENT_GENERATIONS: 5,
  
  // Quality thresholds
  MIN_QUALITY_SCORE: 0.7,
  MIN_BRAND_ALIGNMENT: 0.8,
  
  // Timing constants
  MAX_GENERATION_TIME_MS: 300000, // 5 minutes
  DEFAULT_TIMEOUT_MS: 120000,     // 2 minutes
  
  // Cost management
  MAX_COST_PER_ASSET: 2.0,
  BUDGET_WARNING_THRESHOLD: 0.75,
  BUDGET_CRITICAL_THRESHOLD: 0.9,
  
  // File size limits
  MAX_ASSET_FILE_SIZE_MB: 50,
  MAX_THUMBNAIL_SIZE_KB: 500,
  
  // Supported formats
  SUPPORTED_IMAGE_FORMATS: ["jpg", "jpeg", "png", "webp"],
  SUPPORTED_VIDEO_FORMATS: ["mp4", "mov", "webm"],
  
  // Default dimensions
  DEFAULT_ASSET_DIMENSIONS: {
    HD: { width: 1920, height: 1080 },
    SQUARE: { width: 1080, height: 1080 },
    VERTICAL: { width: 1080, height: 1920 },
    THUMBNAIL: { width: 300, height: 300 },
  },
} as const;