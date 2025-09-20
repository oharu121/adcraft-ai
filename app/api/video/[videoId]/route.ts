 import { NextRequest, NextResponse } from "next/server";
import { FirestoreService } from "@/lib/services/firestore";

/**
 * GET /api/video/[videoId]
 * Proxy endpoint to serve video files by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    console.log("[VIDEO PROXY] Request for deprecated video ID:", videoId);

    // This endpoint handles legacy/broken video URLs that should be cleaned up
    // The correct pattern is /api/video/proxy/{fileId} for Gemini API videos
    // or direct URLs for storage-hosted videos

    return NextResponse.json(
      {
        error: "Video not found",
        details: "This video URL pattern is deprecated. Videos should use /api/video/proxy/{fileId} or direct storage URLs.",
        suggestion: "Please run the cleanup script to remove broken video references.",
        cleanupEndpoint: "/api/debug/cleanup-broken-videos"
      },
      { status: 404 }
    );

  } catch (error) {
    console.error("[VIDEO PROXY] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}