import { ProductAnalysis } from "./product-analysis";

export interface VisionAnalysisRequest {
  sessionId: string;
  imageData: string; // Base64 encoded image data (without data URL prefix)
  description?: string;
  productName?: string; // Optional product name for better commercial generation
  locale: "en" | "ja";
  analysisOptions?: {
    detailLevel: "basic" | "detailed" | "comprehensive";
    includeTargetAudience: boolean;
    includePositioning: boolean;
    includeVisualPreferences: boolean;
  };
}

export interface VisionAnalysisResponse {
  analysis: ProductAnalysis;
  processingTime: number;
  cost: number;
  confidence: number;
  rawResponse?: string; // For debugging
  warnings?: string[];
}

export interface GeminiVisionRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generation_config: {
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
  };
}
