import { NextRequest, NextResponse } from "next/server";
import { FirestoreService } from "@/lib/services/firestore";

/**
 * GET /api/video/[videoId]/details
 * Fetch detailed information for a specific video
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    console.log(`[VIDEO DETAILS] Starting request for videoId: ${videoId}`);

    if (!videoId) {
      console.log("[VIDEO DETAILS] Missing videoId in request");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_VIDEO_ID",
            message: "Video ID is required",
          },
        },
        { status: 400 }
      );
    }

    const firestoreService = FirestoreService.getInstance();
    console.log("[VIDEO DETAILS] FirestoreService initialized");

    // Use the new method to get video details
    console.log(`[VIDEO DETAILS] Calling getVideoDetails for: ${videoId}`);
    const videoDetails = await firestoreService.getVideoDetails(videoId);
    console.log("[VIDEO DETAILS] getVideoDetails result:", {
      found: !!videoDetails,
      hasVideoUrl: videoDetails?.videoUrl ? 'yes' : 'no',
      videoUrl: videoDetails?.videoUrl || 'none'
    });

    if (!videoDetails) {
      console.log(`[VIDEO DETAILS] Video not found for ID: ${videoId}`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VIDEO_NOT_FOUND",
            message: "Video not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: videoDetails,
    });

  } catch (error) {
    console.error("Video details API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VIDEO_DETAILS_ERROR",
          message: "Failed to fetch video details",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}