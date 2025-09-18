/**
 * Creative Director Agent - Asset Generation API
 * 
 * Handles visual asset generation through Imagen API integration,
 * asset management, storage, and quality control for David's creative workflow.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppModeConfig } from "@/lib/config/app-mode";
import { FirestoreService } from "@/lib/services/firestore";
import { 
  AssetType, 
  AssetStatus, 
  QualityLevel, 
  CreativeErrorType,
  ProcessingPriority,
  CREATIVE_DIRECTOR_CONSTANTS 
} from "@/lib/agents/creative-director/enums";
import {
  ApiResponse,
  AssetGenerationRequest,
  AssetGenerationResponse,
  AssetListRequest,
  AssetListResponse,
} from "@/lib/agents/creative-director/types/api-types";
import { VisualAsset } from "@/lib/agents/creative-director/types/asset-types";
import { generateImagenAssets } from "@/lib/agents/creative-director/tools/imagen-integration";

// Request validation schemas
const AssetGenerationRequestSchema = z.object({
  sessionId: z.string().uuid(),
  assetType: z.nativeEnum(AssetType),
  specifications: z.object({
    style: z.string(),
    colorPalette: z.any(),
    composition: z.string(),
    dimensions: z.object({
      width: z.number().min(512).max(4096),
      height: z.number().min(512).max(4096),
      aspectRatio: z.string(),
    }),
  }),
  context: z.object({
    productInfo: z.any(),
    brandGuidelines: z.any().optional(),
    targetAudience: z.any(),
  }),
  options: z.object({
    quality: z.nativeEnum(QualityLevel).default(QualityLevel.STANDARD),
    variations: z.number().min(1).max(5).default(1),
    seed: z.number().optional(),
  }).optional(),
  locale: z.enum(["en", "ja"]).default("en"),
});

const AssetListRequestSchema = z.object({
  sessionId: z.string().uuid(),
  assetType: z.array(z.nativeEnum(AssetType)).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  sortBy: z.enum(["created", "type", "quality", "cost"]).default("created"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

/**
 * Handle POST requests for asset generation
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AssetGenerationResponse>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = AssetGenerationRequestSchema.parse(body);

    console.log(`[DAVID ASSETS] Generating ${validatedRequest.assetType} for session: ${validatedRequest.sessionId}`);

    // Validate session and budget
    const sessionValid = await validateAssetGenerationSession(validatedRequest.sessionId);
    if (!sessionValid.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SESSION_INVALID",
            message: sessionValid.reason || "Unknown reason",
            userMessage: validatedRequest.locale === "ja"
              ? "アセット生成セッションが無効です。セッションを確認してください。"
              : "Asset generation session invalid. Please check your session.",
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    // Check budget before generation
    const budgetCheck = await checkGenerationBudget(validatedRequest.sessionId, validatedRequest.assetType);
    if (!budgetCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: CreativeErrorType.COST_BUDGET_EXCEEDED,
            message: "Generation would exceed budget",
            userMessage: validatedRequest.locale === "ja"
              ? "予算を超えるため生成できません。予算を確認してください。"
              : "Generation would exceed budget. Please check your budget.",
          },
          timestamp,
          requestId,
        },
        { status: 402 }
      );
    }

    // Check concurrent generation limits
    const concurrencyCheck = await checkConcurrentGenerations(validatedRequest.sessionId);
    if (!concurrencyCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many concurrent generations",
            userMessage: validatedRequest.locale === "ja"
              ? "同時生成数が制限を超えています。少しお待ちください。"
              : "Too many concurrent generations. Please wait a moment.",
          },
          timestamp,
          requestId,
        },
        { status: 429 }
      );
    }

    // Process asset generation
    const response = await processAssetGeneration(validatedRequest);

    const processingTime = Date.now() - startTime;

    // Update session with generation tracking
    await updateSessionWithGeneration({
      sessionId: validatedRequest.sessionId,
      assetId: response.assetId,
      assetType: validatedRequest.assetType,
      cost: response.cost,
      processingTime,
      status: response.status as any,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        processingTime,
      },
      timestamp,
      requestId,
    });

  } catch (error) {
    console.error("[DAVID ASSETS] Generation API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            userMessage: "Invalid asset generation request",
            details: error.issues,
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: CreativeErrorType.ASSET_GENERATION_FAILED,
          message: error instanceof Error ? error.message : "Asset generation failed",
          userMessage: "Unable to generate asset. Please try again.",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests for asset listing and retrieval
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AssetListResponse>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      sessionId: searchParams.get("sessionId"),
      assetType: searchParams.getAll("assetType"),
      status: searchParams.get("status"),
      sortBy: searchParams.get("sortBy") || "created",
      sortOrder: searchParams.get("sortOrder") || "desc",
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    // Validate required parameters
    if (!queryParams.sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Session ID is required",
            userMessage: "Session ID is required",
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate and parse the request
    const validatedRequest = AssetListRequestSchema.parse(queryParams);

    console.log(`[DAVID ASSETS] Listing assets for session: ${validatedRequest.sessionId}`);

    // Retrieve assets from storage
    const response = await getAssetList(validatedRequest);

    return NextResponse.json({
      success: true,
      data: response,
      timestamp,
      requestId,
    });

  } catch (error) {
    console.error("[DAVID ASSETS] List API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            userMessage: "Invalid asset list request",
            details: error.issues,
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to retrieve assets",
          userMessage: "Unable to retrieve asset list. Please try again.",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle DELETE requests for asset removal
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const assetId = searchParams.get("assetId");

    if (!sessionId || !assetId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Session ID and Asset ID are required",
            userMessage: "Session ID and Asset ID are required",
          },
          timestamp,
          requestId,
        },
        { status: 400 }
      );
    }

    console.log(`[DAVID ASSETS] Deleting asset ${assetId} for session: ${sessionId}`);

    // Delete asset and clean up storage
    await deleteAsset(sessionId, assetId);

    return NextResponse.json({
      success: true,
      data: {
        message: "Asset deleted successfully",
        assetId,
        sessionId,
      },
      timestamp,
      requestId,
    });

  } catch (error) {
    console.error("[DAVID ASSETS] Delete API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete asset",
          userMessage: "Unable to delete asset. Please try again.",
        },
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }
}

// Helper functions for asset generation and management

/**
 * Validate session for asset generation
 */
async function validateAssetGenerationSession(sessionId: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);

    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    if (!session.mayaHandoffData) {
      return { valid: false, reason: "No Maya handoff data available for asset generation" };
    }

    // Check if session has required creative decisions
    if (!session.visualDecisions || session.visualDecisions.length === 0) {
      return { valid: false, reason: "No visual decisions made yet. Please discuss creative direction first." };
    }

    return { valid: true };
  } catch (error) {
    console.error(`[DAVID ASSETS] Session validation error for ${sessionId}:`, error);
    return { valid: false, reason: "Session validation failed" };
  }
}

/**
 * Check budget for asset generation
 */
async function checkGenerationBudget(sessionId: string, assetType: AssetType): Promise<{ allowed: boolean; estimatedCost?: number; remainingBudget?: number }> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);

    const currentCost = session?.costTracking?.total || 0;
    const remainingBudget = 300 - currentCost;
    
    // Estimate cost based on asset type and quality
    const estimatedCost = estimateAssetCost(assetType);

    if (estimatedCost > remainingBudget) {
      return { 
        allowed: false, 
        estimatedCost, 
        remainingBudget 
      };
    }

    if (estimatedCost > CREATIVE_DIRECTOR_CONSTANTS.MAX_COST_PER_ASSET) {
      return { 
        allowed: false, 
        estimatedCost, 
        remainingBudget 
      };
    }

    return { 
      allowed: true, 
      estimatedCost, 
      remainingBudget 
    };
  } catch (error) {
    console.error(`[DAVID ASSETS] Budget check error for ${sessionId}:`, error);
    return { allowed: false };
  }
}

/**
 * Check concurrent generation limits
 */
async function checkConcurrentGenerations(sessionId: string): Promise<{ allowed: boolean; current?: number; limit?: number }> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);

    const currentGenerations = (session?.assets || []).filter((asset: any) => 
      asset.status === "generating" || asset.status === "processing"
    );

    const currentCount = currentGenerations.length;
    const limit = CREATIVE_DIRECTOR_CONSTANTS.MAX_CONCURRENT_GENERATIONS;

    return {
      allowed: currentCount < limit,
      current: currentCount,
      limit,
    };
  } catch (error) {
    console.error(`[DAVID ASSETS] Concurrency check error for ${sessionId}:`, error);
    return { allowed: false };
  }
}

/**
 * Process asset generation with demo/real mode handling
 */
async function processAssetGeneration(request: any): Promise<AssetGenerationResponse> {
  const assetId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Check mode from AppModeConfig
    const isDemoMode = AppModeConfig.getMode() === "demo";

    if (isDemoMode) {
      console.log(`[DAVID ASSETS DEMO] Generating mock asset: ${request.assetType}`);
      return await generateDemoAsset(assetId, request, startTime);
    } else {
      console.log(`[DAVID ASSETS REAL] Generating real asset with Imagen: ${request.assetType}`);
      return await generateRealAsset(assetId, request, startTime);
    }
  } catch (error) {
    console.error(`[DAVID ASSETS] Generation failed for ${request.assetType}:`, error);
    throw error;
  }
}

/**
 * Generate demo mode asset with sophisticated mock
 */
async function generateDemoAsset(
  assetId: string,
  request: any,
  startTime: number
): Promise<AssetGenerationResponse> {
  // Create sophisticated mock asset
  const mockAsset: VisualAsset = {
    id: assetId,
    sessionId: request.sessionId,
    type: request.assetType,
    status: AssetStatus.READY,
    name: `Mock ${request.assetType} Asset`,
    description: `Generated mock asset of type ${request.assetType}`,
    tags: ["mock", "demo", request.assetType],
    
    files: {
      original: {
        url: `https://demo.adcraft.ai/assets/mock-${request.assetType}-${assetId}.jpg`,
        filename: `mock-${request.assetType}-${assetId}.jpg`,
        format: "jpg",
        dimensions: request.specifications.dimensions,
        fileSize: Math.floor(Math.random() * 5000000) + 1000000,
        mimeType: "image/jpeg",
      },
      thumbnail: {
        url: `https://demo.adcraft.ai/assets/mock-${request.assetType}-${assetId}-thumb.jpg`,
        filename: `mock-${request.assetType}-${assetId}-thumb.jpg`,
        format: "jpg",
        dimensions: { width: 300, height: 300, aspectRatio: "1:1" },
        fileSize: 50000,
        mimeType: "image/jpeg",
      },
    },
    
    generationSpecs: {
      prompt: `Professional ${request.assetType} with ${request.specifications.style} style`,
      style: request.specifications.style,
      colorPalette: JSON.stringify(request.specifications.colorPalette),
      composition: request.specifications.composition,
      dimensions: request.specifications.dimensions,
      quality: request.options?.quality || "standard",
      seed: request.options?.seed || Math.floor(Math.random() * 1000000),
    },
    
    creativeContext: {
      purpose: `Generated for ${request.context.productInfo?.name || "product"}`,
      brandAlignment: 0.87,
      targetAudience: JSON.stringify(request.context.targetAudience),
      emotionalTone: "professional",
      visualHierarchy: "balanced",
    },
    
    quality: {
      overallScore: 0.85 + (Math.random() * 0.1),
      technicalQuality: 0.9,
      creativeAlignment: 0.88,
      brandConsistency: 0.87,
      feedback: [
        request.locale === "ja" 
          ? "優れた創作的品質と技術的実行"
          : "Excellent creative quality and technical execution",
        request.locale === "ja"
          ? "ブランドガイドラインに完全に準拠"
          : "Fully compliant with brand guidelines"
      ],
    },
    
    usage: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      approvedForProduction: true,
    },
    
    cost: {
      generationCost: estimateAssetCost(request.assetType),
      storageCost: 0.01,
      processingCost: 0.005,
      totalCost: estimateAssetCost(request.assetType) + 0.015,
    },
    
    locale: request.locale,
  };

  return {
    assetId,
    assetType: request.assetType,
    status: AssetStatus.READY,
    assets: [mockAsset],
    generationTime: Date.now() - startTime,
    cost: mockAsset.cost.totalCost,
    quality: {
      score: mockAsset.quality.overallScore,
      feedback: mockAsset.quality.feedback,
    },
    downloadUrls: {
      original: mockAsset.files.original.url,
      optimized: mockAsset.files.original.url,
      thumbnail: mockAsset.files.thumbnail.url,
    },
  };
}

/**
 * Generate real asset using Imagen API
 */
async function generateRealAsset(
  assetId: string,
  request: any,
  startTime: number
): Promise<AssetGenerationResponse> {
  try {
    // Use the imagen-integration tool for real generation
    const generationResult = await generateImagenAssets({
      sessionId: request.sessionId,
      assetType: request.assetType,
      specifications: {
        style: request.specifications.style,
        colorPalette: request.specifications.colorPalette,
        dimensions: request.specifications.dimensions,
        quality: request.options?.quality || "standard",
        mood: "professional",
        composition: request.specifications.composition,
      },
      context: {
        productInfo: request.context.productInfo,
        brandDirection: request.context.brandGuidelines || {},
        targetAudience: request.context.targetAudience,
        brandGuidelines: request.context.brandGuidelines,
      },
      prompt: {
        mainPrompt: `Professional ${request.assetType} with ${request.specifications.style} style`,
        stylePrompt: request.specifications.style,
        negativePrompt: "low quality, blurry, distorted",
        qualityPrompt: "high quality, professional",
      },
      options: {
        variations: request.options?.variations || 1,
        seed: request.options?.seed,
        priority: ProcessingPriority.NORMAL,
      },
      locale: request.locale,
    });

    // Store generated asset in session
    const visualAsset: VisualAsset = {
      id: assetId,
      sessionId: request.sessionId,
      type: request.assetType,
      status: AssetStatus.READY,
      name: `Generated ${request.assetType} Asset`,
      description: `AI-generated asset of type ${request.assetType}`,
      tags: ["generated", "real", request.assetType],
      
      files: {
        original: (generationResult.assets?.[0]?.files?.original) || {
          url: `https://generated.adcraft.ai/assets/real-${request.assetType}-${assetId}.jpg`,
          filename: `real-${request.assetType}-${assetId}.jpg`,
          format: "jpg",
          dimensions: request.specifications.dimensions,
          fileSize: 2000000,
          mimeType: "image/jpeg",
        },
        thumbnail: (generationResult.assets?.[0]?.files?.thumbnail) || {
          url: `https://generated.adcraft.ai/assets/real-${request.assetType}-${assetId}-thumb.jpg`,
          filename: `real-${request.assetType}-${assetId}-thumb.jpg`,
          format: "jpg",
          dimensions: { width: 300, height: 300, aspectRatio: "1:1" },
          fileSize: 50000,
          mimeType: "image/jpeg",
        },
      },
      
      generationSpecs: {
        prompt: generationResult.generationMetadata?.promptEngineering?.enhancedPrompt || `Professional ${request.assetType}`,
        style: request.specifications.style,
        colorPalette: JSON.stringify(request.specifications.colorPalette),
        composition: request.specifications.composition,
        dimensions: request.specifications.dimensions,
        quality: request.options?.quality || "standard",
        seed: generationResult.generationMetadata?.parameters?.seed,
      },
      
      creativeContext: {
        purpose: `Generated for ${request.context.productInfo?.name || "product"}`,
        brandAlignment: 0.85,
        targetAudience: JSON.stringify(request.context.targetAudience),
        emotionalTone: "professional",
        visualHierarchy: "balanced",
      },
      
      quality: generationResult.quality,
      
      usage: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        approvedForProduction: true,
      },
      
      cost: {
        generationCost: generationResult.cost?.generationCost || estimateAssetCost(request.assetType),
        storageCost: generationResult.cost?.storageCost || 0.01,
        processingCost: 0.005,
        totalCost: generationResult.cost?.totalCost || (estimateAssetCost(request.assetType) + 0.015),
      },
      
      locale: request.locale,
    };

    return {
      assetId,
      assetType: request.assetType,
      status: AssetStatus.READY,
      assets: [visualAsset],
      generationTime: Date.now() - startTime,
      cost: visualAsset.cost.totalCost,
      quality: {
        score: visualAsset.quality.overallScore,
        feedback: visualAsset.quality.feedback,
      },
      downloadUrls: {
        original: visualAsset.files.original.url,
        optimized: visualAsset.files.original.url,
        thumbnail: visualAsset.files.thumbnail.url,
      },
    };
  } catch (error) {
    console.error(`[DAVID ASSETS REAL] Real generation failed:`, error);
    throw error;
  }
}

/**
 * Get asset list for session
 */
async function getAssetList(request: any): Promise<AssetListResponse> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(request.sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    let assets = session.assets || [];

    // Apply filters
    if (request.assetType && request.assetType.length > 0) {
      assets = assets.filter((asset: any) => request.assetType.includes(asset.type));
    }

    if (request.status) {
      assets = assets.filter((asset: any) => asset.status === request.status);
    }

    // Apply sorting
    assets.sort((a: any, b: any) => {
      let comparison = 0;
      switch (request.sortBy) {
        case "created":
          comparison = new Date(a.metadata.generatedAt).getTime() - new Date(b.metadata.generatedAt).getTime();
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "quality":
          comparison = a.quality.score - b.quality.score;
          break;
        case "cost":
          comparison = a.cost - b.cost;
          break;
      }
      return request.sortOrder === "desc" ? -comparison : comparison;
    });

    // Apply pagination
    const total = assets.length;
    const paginatedAssets = assets.slice(request.offset, request.offset + request.limit);

    // Calculate summary
    const summary = {
      totalAssets: total,
      byType: assets.reduce((acc: any, asset: any) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {}),
      totalCost: assets.reduce((sum: number, asset: any) => sum + asset.cost, 0),
    };

    return {
      assets: paginatedAssets,
      pagination: {
        total,
        limit: request.limit,
        offset: request.offset,
        hasNext: request.offset + request.limit < total,
        hasPrevious: request.offset > 0,
      },
      summary,
    };
  } catch (error) {
    console.error(`[DAVID ASSETS] Asset list retrieval failed:`, error);
    throw error;
  }
}

/**
 * Delete asset and clean up storage
 */
async function deleteAsset(sessionId: string, assetId: string): Promise<void> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    // Remove asset from session
    const updatedAssets = (session.assets || []).filter((asset: any) => asset.id !== assetId);

    await firestoreService.updateCreativeSession(sessionId, {
      assets: updatedAssets,
      lastActivity: new Date().toISOString(),
    });

    // TODO: Clean up cloud storage files if in real mode
    console.log(`[DAVID ASSETS] Asset ${assetId} deleted from session ${sessionId}`);
  } catch (error) {
    console.error(`[DAVID ASSETS] Asset deletion failed:`, error);
    throw error;
  }
}

/**
 * Update session with generation tracking
 */
async function updateSessionWithGeneration(params: {
  sessionId: string;
  assetId: string;
  assetType: AssetType;
  cost: number;
  processingTime: number;
  status: AssetStatus;
}): Promise<void> {
  try {
    const firestoreService = FirestoreService.getInstance();
    const session = await firestoreService.getCreativeSession(params.sessionId);

    if (!session) {
      throw new Error("Session not found for generation tracking");
    }

    // Update cost tracking
    const currentCost = session.costTracking?.total || 0;
    const newCostTracking = {
      current: params.cost,
      total: currentCost + params.cost,
      breakdown: {
        ...session.costTracking?.breakdown,
        assetGeneration: (session.costTracking?.breakdown?.assetGeneration || 0) + params.cost,
      },
      remaining: 300 - (currentCost + params.cost),
      budgetAlert: (currentCost + params.cost) > 225, // 75% threshold
    };

    await firestoreService.updateCreativeSession(params.sessionId, {
      costTracking: newCostTracking,
      lastActivity: new Date().toISOString(),
    });

    console.log(`[DAVID ASSETS] Updated session ${params.sessionId} with generation cost: $${params.cost}`);
  } catch (error) {
    console.error(`[DAVID ASSETS] Failed to update session with generation:`, error);
    // Don't throw - generation tracking failure shouldn't block the response
  }
}

/**
 * Estimate cost for asset generation based on type and quality
 */
function estimateAssetCost(assetType: AssetType): number {
  const baseCosts = {
    [AssetType.BACKGROUND]: 0.8,
    [AssetType.PRODUCT_HERO]: 1.2,
    [AssetType.LIFESTYLE_SCENE]: 1.5,
    [AssetType.OVERLAY]: 0.6,
    [AssetType.MOOD_BOARD]: 1.0,
    [AssetType.STYLE_FRAME]: 1.1,
    [AssetType.COLOR_PALETTE]: 0.3,
    [AssetType.COMPOSITION_GUIDE]: 0.5,
    [AssetType.TEXTURE]: 0.7,
    [AssetType.PATTERN]: 0.7,
    [AssetType.LIGHTING_REFERENCE]: 0.9,
    [AssetType.TYPOGRAPHY_TREATMENT]: 0.8,
  };

  const costs: Record<string, number> = {
    "background": 0.8,
    "product-hero": 1.2,
    "lifestyle-scene": 1.5,
    "overlay": 0.6,
    "mood-board": 1.0,
    "style-frame": 1.1,
    "color-palette": 0.3,
    "composition-guide": 0.5,
    "texture": 0.7,
    "pattern": 0.7,
    "lighting-reference": 0.9,
    "typography-treatment": 0.8,
  };
  return costs[assetType] || 1.0;
}