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

    if (!videoId) {
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

    // Use the new method to get video details
    const videoDetails = await firestoreService.getVideoDetails(videoId);

    if (!videoDetails) {
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