import { NextRequest, NextResponse } from "next/server";
import { FirestoreService } from "@/lib/services/firestore";

/**
 * POST /api/video/[videoId]/view
 * Track video view and increment view count
 */
export async function POST(
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

    // Use the new method to increment video views
    const result = await firestoreService.incrementVideoViews(videoId);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VIDEO_NOT_FOUND",
            message: "Video not found or not ready for viewing",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        viewCount: result.viewCount,
        message: "View tracked successfully",
      },
    });

  } catch (error) {
    console.error("Video view tracking error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VIEW_TRACKING_ERROR",
          message: "Failed to track video view",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}