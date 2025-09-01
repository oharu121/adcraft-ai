/**
 * Product Intelligence Agent Services
 * 
 * Exports all Product Intelligence Agent service classes and utilities.
 */

export { GeminiVisionService } from './gemini-vision';
export { GeminiChatService } from './gemini-chat';
export { ProductAnalysisEngine } from './analysis-engine';
export { ProductImageStorageService } from './image-storage';
export { ProductIntelligenceFirestore } from './firestore-schema';

export type { VisionAnalysisRequest, VisionAnalysisResponse } from './gemini-vision';
export type { ChatRequest, ChatResponse } from './gemini-chat';
export type { 
  ProductAnalysisEngineRequest, 
  ProductAnalysisEngineResponse 
} from './analysis-engine';
export type { 
  ProductImageUpload, 
  ProductImageResult, 
  ImageValidationResult 
} from './image-storage';
export type { 
  ProductIntelligenceSessionDoc, 
  ChatMessageDoc, 
  ProductAnalysisDoc, 
  AgentHandoffDoc 
} from './firestore-schema';