/**
 * Enums and constants for Product Intelligence Agent
 */

// Product Categories supported by the analysis engine
export enum ProductCategory {
  ELECTRONICS = "electronics",
  FASHION = "fashion",
  FOOD_BEVERAGE = "food-beverage",
  HOME_GARDEN = "home-garden",
  HEALTH_BEAUTY = "health-beauty",
  SPORTS_OUTDOORS = "sports-outdoors",
  AUTOMOTIVE = "automotive",
  BOOKS_MEDIA = "books-media",
  TOYS_GAMES = "toys-games",
  BUSINESS = "business",
  OTHER = "other",
}

// Session status progression through the agent workflow
export enum SessionStatus {
  INITIALIZING = "initializing",
  ACTIVE = "active",
  ANALYZING = "analyzing",
  CHATTING = "chatting",
  READY_FOR_HANDOFF = "ready_for_handoff",
  COMPLETED = "completed",
  ERROR = "error",
  EXPIRED = "expired",
}

// Agent types in the multi-agent pipeline
export enum AgentType {
  PRODUCT_INTELLIGENCE = "product-intelligence",
  CREATIVE_DIRECTOR = "creative-director",
  VIDEO_PRODUCER = "video-producer",
}

// Conversation topic completion status
export enum TopicStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

// Emotional triggers for commercial strategy
export enum EmotionalTriggerType {
  ASPIRATION = "aspiration",
  FEAR = "fear",
  JOY = "joy",
  TRUST = "trust",
  EXCITEMENT = "excitement",
  COMFORT = "comfort",
  PRIDE = "pride",
}

// Message types for WebSocket communication
export enum MessageType {
  USER_MESSAGE = "user_message",
  AGENT_MESSAGE = "agent_message",
  TYPING_START = "typing_start",
  TYPING_STOP = "typing_stop",
  AGENT_TYPING = "agent_typing",
  STATUS_UPDATE = "status_update",
  ERROR = "error",
}

// Brand positioning tiers
export enum MarketTier {
  BUDGET = "budget",
  MAINSTREAM = "mainstream",
  PREMIUM = "premium",
  LUXURY = "luxury",
}

// Color roles in product analysis
export enum ColorRole {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  ACCENT = "accent",
}

// Gender targeting options
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  UNISEX = "unisex",
}

// Income levels for targeting
export enum IncomeLevel {
  BUDGET = "budget",
  MID_RANGE = "mid-range",
  PREMIUM = "premium",
  LUXURY = "luxury",
}

// Brand loyalty levels
export enum BrandLoyalty {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

// Brand tone options
export enum BrandTone {
  PROFESSIONAL = "professional",
  FRIENDLY = "friendly",
  LUXURY = "luxury",
  PLAYFUL = "playful",
  AUTHORITATIVE = "authoritative",
}

// Visual style preferences
export enum VisualStyle {
  MODERN = "modern",
  CLASSIC = "classic",
  MINIMALIST = "minimalist",
  BOLD = "bold",
  ORGANIC = "organic",
}

// Mood options for commercial direction
export enum Mood {
  ENERGETIC = "energetic",
  CALM = "calm",
  SOPHISTICATED = "sophisticated",
  PLAYFUL = "playful",
  INSPIRING = "inspiring",
}

// Composition styles
export enum Composition {
  CLEAN = "clean",
  DYNAMIC = "dynamic",
  INTIMATE = "intimate",
  GRAND = "grand",
  ARTISTIC = "artistic",
}

// Lighting preferences
export enum Lighting {
  BRIGHT = "bright",
  WARM = "warm",
  DRAMATIC = "dramatic",
  NATURAL = "natural",
  STUDIO = "studio",
}

// Handoff status tracking
export enum HandoffStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Error codes used throughout the API
export enum ApiErrorCode {
  // General errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  INTERNAL_ERROR = "INTERNAL_ERROR",

  // Upload errors
  INVALID_FILE = "INVALID_FILE",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT",
  UPLOAD_FAILED = "UPLOAD_FAILED",

  // Session errors
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_INVALID_STATE = "SESSION_INVALID_STATE",
  CONCURRENT_MODIFICATION = "CONCURRENT_MODIFICATION",

  // Processing errors
  ANALYSIS_FAILED = "ANALYSIS_FAILED",
  VERTEX_AI_ERROR = "VERTEX_AI_ERROR",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  BUDGET_EXHAUSTED = "BUDGET_EXHAUSTED",

  // Agent errors
  AGENT_UNAVAILABLE = "AGENT_UNAVAILABLE",
  HANDOFF_FAILED = "HANDOFF_FAILED",
  CONVERSATION_ERROR = "CONVERSATION_ERROR",
  CONTEXT_LOST = "CONTEXT_LOST",
}

export enum ImageFormat {
  JPEG = "image/jpeg",
  PNG = "image/png",
  WEBP = "image/webp",
  GIF = "image/gif",
  UNKNOWN = "image/unknown",
}