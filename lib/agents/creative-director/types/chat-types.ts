/**
 * Creative Director Chat Types
 *
 * TypeScript interfaces for David's conversation system,
 * including creative messages, visual decisions, and UI state.
 */

// Chat message types specific to Creative Director
export interface CreativeChatMessage {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: number;
  sessionId: string;
  
  // Creative-specific message data
  messageType?: 
    | "CREATIVE_INTRODUCTION"
    | "VISUAL_ANALYSIS" 
    | "STYLE_RECOMMENDATION"
    | "ASSET_DISCUSSION"
    | "CREATIVE_DECISION"
    | "DIRECTION_CONFIRMATION"
    | "COLLABORATION_REQUEST"
    | "ASSET_GENERATION_UPDATE"
    | "HANDOFF_PREPARATION"
    | "CREATIVE_INSIGHT"
    | "MARKET_INSIGHT"
    | "CULTURAL_ADAPTATION";
  
  // Visual context and attachments
  visualContext?: {
    styleReferences?: VisualReference[];
    colorPalette?: ColorPalette;
    assetPreviews?: AssetPreview[];
    compositionExamples?: CompositionExample[];
  };
  
  // Creative decision data
  creativeDecisions?: {
    styleDirection?: string;
    colorChoices?: any;
    compositionPreferences?: string[];
    assetRequirements?: string[];
    brandAlignmentNotes?: string;
  };
  
  // Processing metadata
  processingTime?: number;
  cost?: number;
  confidence?: number;
  
  // UI interaction data
  quickActions?: CreativeQuickAction[];
  suggestedResponses?: string[];
  attachments?: MessageAttachment[];
  
  // Localization
  locale: "en" | "ja";
}

// Visual reference for chat context
export interface VisualReference {
  id: string;
  type: "mood" | "style" | "color" | "composition" | "competitor";
  title: string;
  description?: string;
  imageUrl?: string;
  relevance: number; // 0-1 score
  source?: string;
}

// Color palette for visual context
export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    neutral: string[];
  };
  mood: string;
  brandAlignment: number;
  culturalContext?: "universal" | "western" | "eastern" | "localized";
}

// Asset preview for chat
export interface AssetPreview {
  id: string;
  type: "background" | "product-hero" | "lifestyle-scene" | "overlay";
  thumbnailUrl: string;
  status: "generating" | "ready" | "needs-revision";
  description: string;
  specs: {
    dimensions: string;
    format: string;
    quality: "draft" | "final";
  };
}

// Composition example for guidance
export interface CompositionExample {
  id: string;
  name: string;
  description: string;
  visualGuide?: string; // URL to composition guide image
  principles: string[];
  suitability: {
    productTypes: string[];
    brandStyles: string[];
    targetAudiences: string[];
  };
}

// Quick actions specific to Creative Director
export interface CreativeQuickAction {
  id: string;
  type: 
    | "STYLE_SELECTION"
    | "COLOR_APPROVAL"
    | "ASSET_GENERATION"
    | "COMPOSITION_CHOICE"
    | "REVISION_REQUEST"
    | "DIRECTION_CONFIRMATION"
    | "HANDOFF_INITIATION";
  label: string;
  description?: string;
  icon?: string;
  data?: any; // Action-specific payload
  requiresConfirmation?: boolean;
}

// Message attachments
export interface MessageAttachment {
  id: string;
  type: "image" | "video" | "document" | "reference";
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Conversation state for Creative Director
export interface CreativeConversationState {
  sessionId: string;
  agentStatus: "initializing" | "ready" | "thinking" | "creating" | "awaiting_input" | "finalizing";
  currentPhase: "analysis" | "creative_development" | "asset_generation" | "finalization";
  
  // Conversation context
  messageCount: number;
  lastMessageAt: number;
  conversationSummary?: string;
  
  // Creative context
  visualDecisions: {
    styleDirection?: string;
    approvedPalettes: string[];
    selectedCompositions: string[];
    assetRequirements: string[];
    brandAlignmentScore: number;
  };
  
  // Asset generation state
  assetGeneration: {
    inProgress: string[]; // Asset IDs currently generating
    completed: string[];  // Asset IDs ready
    failed: string[];     // Asset IDs that failed
    totalCost: number;
  };
  
  // Handoff preparation
  handoffReadiness: {
    directionFinalized: boolean;
    assetsReady: boolean;
    productionNotesComplete: boolean;
    readyForAlex: boolean;
  };
  
  // User preferences learned during conversation
  userPreferences: {
    visualStyle?: string;
    colorPreferences?: string[];
    communicationStyle?: "detailed" | "concise" | "collaborative";
    decisionMakingSpeed?: "fast" | "deliberate" | "collaborative";
    feedbackStyle?: "direct" | "guided" | "supportive";
  };
}

// Conversation analytics
export interface CreativeConversationAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  
  messageStats: {
    total: number;
    userMessages: number;
    agentMessages: number;
    averageResponseTime: number;
  };
  
  creativeActivity: {
    decisionsRequested: number;
    decisionsMade: number;
    revisionsRequested: number;
    assetsGenerated: number;
    collaborativeInteractions: number;
  };
  
  qualityMetrics: {
    userSatisfactionScore?: number;
    creativeMomentumScore: number; // How smoothly creative process flowed
    decisionEfficiencyScore: number; // Speed of reaching creative decisions
    collaborationScore: number; // Quality of David-user collaboration
  };
  
  costAnalysis: {
    totalCost: number;
    costPerMessage: number;
    costPerAsset: number;
    budgetUtilization: number;
  };
}

// Chat UI state specific to Creative Director
export interface CreativeChatUIState {
  // Visual interface state
  showStylePalette: boolean;
  showAssetGallery: boolean;
  showCompositionGuide: boolean;
  showColorPicker: boolean;
  
  // Asset generation UI
  assetGenerationProgress: {
    [assetId: string]: {
      progress: number;
      stage: string;
      estimatedCompletion: number;
    };
  };
  
  // Creative decision UI
  pendingDecisions: {
    styleChoices?: string[];
    colorOptions?: ColorPalette[];
    compositionOptions?: CompositionExample[];
  };
  
  // Collaboration UI
  collaborativeMode: boolean;
  awaitingUserInput: boolean;
  inputSuggestions: string[];
  
  // Visual feedback UI
  assetFeedbackMode: boolean;
  selectedAssetForFeedback?: string;
  
  // Handoff preparation UI
  handoffChecklist: {
    directionReview: boolean;
    assetApproval: boolean;
    productionNotes: boolean;
  };
}