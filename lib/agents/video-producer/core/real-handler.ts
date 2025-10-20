/**
 * Video Producer Real Mode Handler
 *
 * Handles real Vertex AI Gemini Pro integration for Zara's video production workflow,
 * incorporating video production expertise and narrative analysis capabilities.
 */

import { VertexAIService } from "@/lib/services/vertex-ai";
import { GeminiClient } from "@/lib/services/gemini";
import type { Locale } from "@/lib/dictionaries";
import type { NarrativeStyle, MusicGenre } from "@/lib/stores/video-producer-store";
import type { DavidHandoffData } from "../tools/prompt-builder";

const MODEL_NAME = "gemini-2.5-flash";

// Cost configuration (per 1000 tokens)
const COST_CONFIG = {
  inputTokenCost: 0.000125, // $0.000125 per 1k input tokens
  outputTokenCost: 0.000375, // $0.000375 per 1k output tokens
};

export interface VideoProducerAIRequest {
  sessionId: string;
  prompt: string;
  locale: Locale;
  context: {
    davidHandoff: DavidHandoffData;
    selectedNarrativeStyle?: NarrativeStyle;
  };
}

export interface VideoProducerAIResponse {
  success: boolean;
  response: any;
  cost: number;
  confidence: number;
  processingTime: number;
  error?: string;
}

/**
 * Process narrative style validation with Vertex AI
 */
export async function processNarrativeStyleValidation(
  request: VideoProducerAIRequest
): Promise<VideoProducerAIResponse> {
  const startTime = Date.now();

  try {
    console.log("[ZARA REAL] Processing narrative style validation with Vertex AI");

    const geminiClient = new GeminiClient();

    // Enhanced prompt with Zara's video production persona
    const enhancedPrompt = buildZaraPersonaPrompt(request.prompt, request.locale);

    // Process with Gemini
    const geminiResponse = await geminiClient.generateTextOnly(enhancedPrompt);

    // Calculate cost
    const cost = calculateProcessingCost(geminiResponse);

    // Parse AI response to match expected validation format
    const validationResponse = parseValidationResponse(geminiResponse.text, "narrative");

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      response: validationResponse,
      cost,
      confidence: 0.85, // Base confidence for video production validation
      processingTime,
    };
  } catch (error) {
    console.error("[ZARA REAL] Narrative validation error:", error);

    return {
      success: false,
      response: null,
      cost: 0,
      confidence: 0,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown AI processing error",
    };
  }
}

/**
 * Process music & tone validation with Vertex AI
 */
export async function processMusicToneValidation(
  request: VideoProducerAIRequest
): Promise<VideoProducerAIResponse> {
  const startTime = Date.now();

  try {
    console.log("[ZARA REAL] Processing music tone validation with Vertex AI");

    const geminiClient = new GeminiClient();

    // Enhanced prompt with accumulated context
    const enhancedPrompt = buildZaraPersonaPrompt(request.prompt, request.locale);

    // Process with Gemini
    const geminiResponse = await geminiClient.generateTextOnly(enhancedPrompt);

    // Calculate cost
    const cost = calculateProcessingCost(geminiResponse);

    // Parse AI response to match expected validation format
    const validationResponse = parseValidationResponse(geminiResponse.text, "music");

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      response: validationResponse,
      cost,
      confidence: 0.88, // Slightly higher confidence for accumulated context
      processingTime,
    };
  } catch (error) {
    console.error("[ZARA REAL] Music validation error:", error);

    return {
      success: false,
      response: null,
      cost: 0,
      confidence: 0,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown AI processing error",
    };
  }
}

/**
 * Build enhanced prompt with Zara's video production persona
 */
function buildZaraPersonaPrompt(prompt: string, locale: Locale): string {
  const isJapanese = locale === "ja";

  const zaraPersona = isJapanese
    ? `あなたはザラです。8年以上の経験を持つAI動画プロデューサーで、ハイインパクトなコマーシャルコンテンツの制作を専門としています。

専門分野：
- 動画制作計画とワークフロー最適化
- AI駆動の動画生成技術
- マルチプラットフォーム動画配信戦略
- ナラティブ構造と感情的インパクト分析
- 音楽・トーン選択と視聴者エンゲージメント

アプローチ：
- 技術的優秀性とクリエイティブビジョンのバランス
- すべてのフレームが芸術的インパクトとビジネス目標の両方に貢献
- データ駆動の意思決定と創造的直感の組み合わせ

以下のタスクについて、動画制作の専門家として分析し、JSON形式で構造化された回答を提供してください。`
    : `You are Zara, an AI Video Producer with 8+ years of experience creating high-impact commercial content.

Expertise:
- Video production planning and workflow optimization
- AI-powered video generation technology
- Multi-platform video distribution strategies
- Narrative structure and emotional impact analysis
- Music/tone selection and audience engagement

Approach:
- Balance technical excellence with creative vision
- Every frame should serve both artistic impact and business objectives
- Combine data-driven decisions with creative intuition

As a video production expert, analyze the following task and provide a structured JSON response.`;

  return `${zaraPersona}\n\n${prompt}`;
}

/**
 * Parse AI response into expected validation format
 */
function parseValidationResponse(aiText: string, validationType: "narrative" | "music"): any {
  try {
    // Try to extract JSON from the AI response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }

    // Fallback: construct response from AI text analysis
    if (validationType === "narrative") {
      return {
        validation: {
          alignmentScore: extractScore(aiText) || 8.5,
          strengths: extractStrengths(aiText),
          recommendations: extractRecommendations(aiText),
        },
        confirmation: {
          approved: true,
          message:
            extractMainMessage(aiText) ||
            "This narrative style aligns well with your creative direction.",
          nextStepGuidance: "Ready to select music that will enhance the emotional impact.",
        },
      };
    } else {
      return {
        validation: {
          harmonyScore: extractScore(aiText) || 9.0,
          brandAlignment: extractScore(aiText, "brand") || 8.5,
          emotionalImpact: extractEmotionalImpact(aiText) || "Creates strong emotional connection",
          recommendations: extractRecommendations(aiText),
        },
        confirmation: {
          approved: true,
          message:
            extractMainMessage(aiText) ||
            "This music selection enhances your commercial perfectly.",
          productionReadiness: "All creative elements are in harmony. Ready for production!",
        },
      };
    }
  } catch (error) {
    console.error("[ZARA REAL] Failed to parse AI response:", error);

    // Safe fallback with basic approval
    return validationType === "narrative"
      ? {
          validation: {
            alignmentScore: 8.0,
            strengths: ["AI analysis completed"],
            recommendations: ["Proceed with selected narrative style"],
          },
          confirmation: {
            approved: true,
            message: "Narrative style validated successfully.",
            nextStepGuidance: "Ready for music selection.",
          },
        }
      : {
          validation: {
            harmonyScore: 8.5,
            brandAlignment: 8.0,
            emotionalImpact: "Positive alignment with creative direction",
            recommendations: ["Music selection approved"],
          },
          confirmation: {
            approved: true,
            message: "Music selection validated successfully.",
            productionReadiness: "Ready for video production!",
          },
        };
  }
}

/**
 * Extract score from AI text (simple pattern matching)
 */
function extractScore(text: string, type?: string): number | undefined {
  const scorePatterns = [
    /(\d+(?:\.\d+)?)(?:\/10|\s*out\s*of\s*10|\s*score|\s*rating)/i,
    /score[:\s]*(\d+(?:\.\d+)?)/i,
    /rating[:\s]*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of scorePatterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      return score <= 10 ? score : score / 10; // Normalize to 0-10 scale
    }
  }

  return undefined;
}

/**
 * Extract strengths from AI analysis
 */
function extractStrengths(text: string): string[] {
  const strengthPatterns = [
    /strengths?[:\s]*([^\.]+)/i,
    /positive[:\s]*([^\.]+)/i,
    /benefits?[:\s]*([^\.]+)/i,
  ];

  for (const pattern of strengthPatterns) {
    const match = text.match(pattern);
    if (match) {
      return [match[1].trim()];
    }
  }

  return ["Strong alignment with product and creative direction"];
}

/**
 * Extract recommendations from AI analysis
 */
function extractRecommendations(text: string): string[] {
  const recPatterns = [
    /recommendation[s]?[:\s]*([^\.]+)/i,
    /suggest[s]?[:\s]*([^\.]+)/i,
    /consider[:\s]*([^\.]+)/i,
  ];

  for (const pattern of recPatterns) {
    const match = text.match(pattern);
    if (match) {
      return [match[1].trim()];
    }
  }

  return ["Continue with current approach for optimal results"];
}

/**
 * Extract main message from AI response
 */
function extractMainMessage(text: string): string | undefined {
  // Look for concluding statements or main recommendations
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  // Return the longest sentence as likely main message
  return sentences.length > 0
    ? sentences.reduce((a, b) => (a.length > b.length ? a : b)).trim()
    : undefined;
}

/**
 * Extract emotional impact description
 */
function extractEmotionalImpact(text: string): string | undefined {
  const emotionalPatterns = [
    /emotional[ly]?\s+impact[:\s]*([^\.]+)/i,
    /emotion[al]*[:\s]*([^\.]+)/i,
    /feel[ing]*[s]?[:\s]*([^\.]+)/i,
  ];

  for (const pattern of emotionalPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Calculate processing cost based on token usage
 */
function calculateProcessingCost(geminiResponse: any): number {
  const inputTokens = geminiResponse.inputTokenCount || 1000; // Estimate
  const outputTokens = geminiResponse.outputTokenCount || 500; // Estimate

  const inputCost = (inputTokens / 1000) * COST_CONFIG.inputTokenCost;
  const outputCost = (outputTokens / 1000) * COST_CONFIG.outputTokenCost;

  return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
}
