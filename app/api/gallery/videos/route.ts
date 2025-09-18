import { NextRequest, NextResponse } from "next/server";
import { FirestoreService } from "@/lib/services/firestore";
import { validateAndParse } from "@/lib/utils/validation";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("12"),
  sortBy: z.enum(["recent", "popular", "views"]).optional().default("recent"),
});

/**
 * GET /api/gallery/videos
 * Fetch paginated list of completed videos for gallery display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = validateAndParse(QuerySchema, {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "12",
      sortBy: searchParams.get("sortBy") || "recent",
    });

    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 50); // Max 50 per page
    const offset = (page - 1) * limit;

    const firestoreService = FirestoreService.getInstance();

    // Use the new method to get completed videos
    const result = await firestoreService.getCompletedVideos({
      page,
      limit,
      sortBy: query.sortBy,
    });

    const totalPages = Math.ceil(result.totalCount / limit);

    return NextResponse.json({
      success: true,
      data: result.videos,
      pagination: {
        page,
        limit,
        totalCount: result.totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error("Gallery videos API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GALLERY_FETCH_ERROR",
          message: "Failed to fetch gallery videos",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}