import { NextResponse } from "next/server";
import { FirestoreService } from "@/lib/services/firestore";

/**
 * GET /api/debug/firestore-jobs
 * Debug endpoint to inspect raw Firestore job documents
 */
export async function GET() {
  try {
    console.log("[DEBUG] Starting Firestore jobs inspection...");

    const firestoreService = FirestoreService.getInstance();

    // Get all completed jobs using the public method
    const allJobs = await firestoreService.getAllCompletedJobsForCleanup();

    // Limit to first 10 for debugging
    const limitedJobs = allJobs.slice(0, 10);

    console.log(`[DEBUG] Found ${limitedJobs.length} completed jobs`);

    const jobs = limitedJobs.map(job => {
      const data = job.data;

      // Return complete document data for inspection
      return {
        id: job.id,
        rawData: data,
        fieldAnalysis: {
          allFields: Object.keys(data),
          hasVideoUrl: !!data.videoUrl,
          hasTitle: !!data.title,
          hasProductName: !!data.productName,
          hasProductionMetadata: !!data.productionMetadata,
          hasCreativeDirection: !!data.creativeDirection,
          hasProductAnalysis: !!data.productAnalysis,
          hasMetadata: !!data.metadata,
          status: data.status,
          videoUrlValue: data.videoUrl,
          titleValue: data.title,
          productNameValue: data.productName
        }
      };
    });

    return NextResponse.json({
      success: true,
      totalJobs: allJobs.length,
      displayedJobs: limitedJobs.length,
      jobs,
      summary: {
        jobsWithVideoUrl: jobs.filter(j => j.fieldAnalysis.hasVideoUrl).length,
        jobsWithTitle: jobs.filter(j => j.fieldAnalysis.hasTitle).length,
        jobsWithProductName: jobs.filter(j => j.fieldAnalysis.hasProductName).length,
        jobsWithProductionMetadata: jobs.filter(j => j.fieldAnalysis.hasProductionMetadata).length,
        uniqueVideoUrls: [...new Set(jobs.map(j => j.fieldAnalysis.videoUrlValue).filter(Boolean))].length,
        allFields: [...new Set(jobs.flatMap(j => j.fieldAnalysis.allFields))]
      }
    });

  } catch (error) {
    console.error("[DEBUG] Error inspecting Firestore jobs:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}