/**
 * Creative Director Agent - Public API
 *
 * Public exports for the Creative Director Agent (David).
 * This is the main entry point for importing David's functionality.
 */

// Core persona and configuration
export { DAVID_PERSONA } from "../../constants/david-persona";
export type { DavidPersonaType } from "../../constants/david-persona";

// Type definitions
export * from "./types/api-types";
export * from "./types/chat-types"; 
export * from "./types/asset-types";

// Enums and constants
export * from "./enums";

// Main agent functions (will be implemented in Phase 3)
// export { initializeCreativeDirector } from "./core/chat";
// export { processCreativeChat } from "./core/chat";
// export { generateAsset } from "./core/asset-generation";
// export { finalizeDirection } from "./core/handoff";

// Utility functions (will be implemented in Phase 2)
// export { analyzeVisualOpportunities } from "./tools/visual-analyzer";
// export { generateStyleRecommendations } from "./tools/style-generator";
// export { buildImagenPrompt } from "./tools/imagen-integration";

// Store integration 
export { useCreativeDirectorStore } from "../../stores/creative-director-store";

// Re-export commonly used types for convenience
export type {
  AssetGenerationRequest,
  AssetGenerationResponse,
  CreativeDirectorInitRequest,
  CreativeDirectorInitResponse,
} from "./types/api-types";

export type {
  VisualAsset,
  CreativeDirection,
  StylePalette,
} from "./types/asset-types";

export type {
  CreativeChatMessage,
} from "./types/chat-types";

export type {
  AssetType,
  AssetStatus,
  VisualStyle,
  ColorMood,
  CreativePhase,
} from "./enums";