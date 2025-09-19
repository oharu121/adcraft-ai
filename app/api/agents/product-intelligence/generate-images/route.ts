import { NextRequest, NextResponse } from "next/server";
import { GeminiClient } from "@/lib/services/gemini";
import { VertexAIService } from "@/lib/services/vertex-ai";
import { AppModeConfig } from "@/lib/config/app-mode";
import fs from "fs";
import path from "path";

/**
 * Load demo product images and convert to base64
 */
async function loadDemoImages(): Promise<string[]> {
  const demoImageFiles = [
    "tea-bag1.webp",
    "tea-bag2.webp",
    "tea-bag3.png",
    "tea-bag4.jpg"
  ];

  const images: string[] = [];

  for (const filename of demoImageFiles) {
    try {
      const imagePath = path.join(process.cwd(), "public", "demo-product-image", filename);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      images.push(base64Image);
    } catch (error) {
      console.warn(`[DEMO IMAGES] Failed to load ${filename}:`, error);
      // Fallback to a 1x1 transparent pixel if image fails to load
      images.push("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=");
    }
  }

  return images;
}

export async function POST(request: NextRequest) {
  try {
    const { productName, productDescription, locale } = await request.json();

    // Validation
    if (!productName || !productDescription) {
      return NextResponse.json(
        { error: "Product name and description are required" },
        { status: 400 }
      );
    }

    // Check app mode
    const isDemoMode = AppModeConfig.getMode() === 'demo';

    if (isDemoMode) {
      // Demo mode: Return actual demo product images
      console.log("[IMAGE GENERATION API] Demo mode - returning demo product images");

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Load actual demo images from public/demo-product-image/
      const demoImages = await loadDemoImages();

      return NextResponse.json({
        success: true,
        data: {
          images: demoImages,
          usage: { input_tokens: 200, output_tokens: 50 },
          cost: 0.0,
          processingTime: 2000
        }
      });
    }

    // Real mode: Use Gemini 2.0 Flash
    console.log("[IMAGE GENERATION API] Real mode - using Gemini 2.0 Flash");

    const startTime = Date.now();

    // Initialize Gemini client using singleton instance (following established pattern)
    const vertexAIService = VertexAIService.getInstance();
    const geminiClient = new GeminiClient(vertexAIService);

    // Create detailed prompt for image generation
    const imagePrompt = `Product: ${productName}

Description: ${productDescription}

Create professional product photography images suitable for commercial advertising. Each image should showcase the product clearly with different angles and compositions.`;

    // Generate 4 images
    const result = await geminiClient.generateImages(imagePrompt, 4);

    const processingTime = Date.now() - startTime;

    // Calculate cost (estimated)
    const estimatedCost = result.usage.input_tokens * 0.001 + result.usage.output_tokens * 0.002;

    return NextResponse.json({
      success: true,
      data: {
        images: result.images,
        usage: result.usage,
        cost: estimatedCost,
        processingTime
      }
    });

  } catch (error) {
    console.error("[IMAGE GENERATION API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        data: null
      },
      { status: 500 }
    );
  }
}