import { NextResponse } from "next/server";
import { FirestoreService } from "@/lib/services/firestore";

interface BrokenJob {
  id: string;
  videoUrl: string;
  reason: string;
}

interface ValidJob {
  id: string;
  videoUrl: string;
}

/**
 * POST /api/debug/cleanup-broken-videos
 * Remove video jobs with broken/irregular URL patterns
 */
export async function POST() {
  try {
    console.log("[CLEANUP] Starting broken video cleanup...");

    const firestoreService = FirestoreService.getInstance();

    // Get all completed jobs using the new public method
    const allJobs = await firestoreService.getAllCompletedJobsForCleanup();

    console.log(`[CLEANUP] Found ${allJobs.length} completed jobs`);

    const brokenJobs: BrokenJob[] = [];
    const validJobs: ValidJob[] = [];

    allJobs.forEach(job => {
      const videoUrl = job.videoUrl;

      // Identify broken patterns
      const isBroken =
        !videoUrl ||
        (videoUrl.startsWith("/api/video/") && !videoUrl.startsWith("/api/video/proxy/")) ||
        videoUrl === "" ||
        videoUrl === null;

      if (isBroken) {
        brokenJobs.push({
          id: job.id,
          videoUrl,
          reason: !videoUrl ? "no videoUrl" :
                  videoUrl.startsWith("/api/video/") ? "wrong API pattern" : "invalid URL"
        });
      } else {
        validJobs.push({
          id: job.id,
          videoUrl
        });
      }
    });

    console.log(`[CLEANUP] Analysis complete:`, {
      total: allJobs.length,
      broken: brokenJobs.length,
      valid: validJobs.length
    });

    // Delete broken jobs using the new public method
    const deletePromises = brokenJobs.map(job =>
      firestoreService.deleteVideoJob(job.id)
    );

    const deleteResults = await Promise.all(deletePromises);
    const successfulDeletes = deleteResults.filter(result => result).length;

    console.log(`[CLEANUP] Successfully deleted ${successfulDeletes}/${brokenJobs.length} broken video jobs`);

    return NextResponse.json({
      success: true,
      summary: {
        totalJobs: allJobs.length,
        attemptedDeletes: brokenJobs.length,
        successfulDeletes,
        remainingJobs: validJobs.length
      },
      deletedJobs: brokenJobs,
      remainingJobs: validJobs
    });

  } catch (error) {
    console.error("[CLEANUP] Error during cleanup:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}