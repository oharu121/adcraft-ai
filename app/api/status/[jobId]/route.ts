import { NextRequest, NextResponse } from 'next/server';
import {
  JobStatusRequestSchema,
  createApiResponseSchema,
  ValidationUtils
} from '@/lib/utils/validation';
import type { JobStatusResponse } from '@/lib/utils/validation';
import type { VideoJob } from '@/types';
import { VeoService } from '@/lib/services/veo';
import { FirestoreService } from '@/lib/services/firestore';
import { JobTracker } from '@/lib/utils/job-tracker';
import RateLimiterService from '@/lib/monitor/rate-limiter';

/**
 * Collect rich metadata from agent sessions for video gallery/detail pages
 */
async function collectVideoMetadata(sessionId: string, jobId: string) {
  const firestoreService = FirestoreService.getInstance();

  try {
    // Get main video session
    const session = await firestoreService.getSession(sessionId);

    // Get product intelligence session data
    let productAnalysisData = null;
    try {
      const piSession = await firestoreService.getPISession(sessionId);
      productAnalysisData = piSession?.productAnalysis;
    } catch (error) {
      console.warn(`Could not get PI session for ${sessionId}:`, error);
    }

    // Get creative director session data
    let creativeDirectionData = null;
    try {
      const creativeSession = await firestoreService.getCreativeSession(sessionId);
      creativeDirectionData = creativeSession?.creativeDirection;
    } catch (error) {
      console.warn(`Could not get creative session for ${sessionId}:`, error);
    }

    // Extract product name from multiple sources
    const productName = productAnalysisData?.product?.name ||
                       creativeDirectionData?.productName ||
                       "Commercial Video";

    // Create rich metadata object
    const metadata = {
      // Basic video info
      productName,
      title: `Commercial for ${productName}`,
      description: productAnalysisData?.product?.description ||
                   `A stunning commercial video for ${productName} created with AdCraft AI`,
      duration: 8, // Default duration
      quality: "720p",

      // Product analysis from Maya
      productAnalysis: productAnalysisData ? {
        keyFeatures: productAnalysisData.product?.keyFeatures?.slice(0, 3) || [],
        targetAudience: productAnalysisData.targetAudience?.description,
        keyMessages: productAnalysisData.keyMessages?.supportingMessages?.slice(0, 2) || [],
        confidenceScore: productAnalysisData.metadata?.confidenceScore
      } : null,

      // Creative direction from David
      creativeDirection: creativeDirectionData ? {
        narrativeStyle: creativeDirectionData.narrativeStyle,
        visualStyle: creativeDirectionData.visualStyle,
        colorPalette: creativeDirectionData.colorPalette?.slice(0, 3) || [],
        musicGenre: creativeDirectionData.musicGenre,
        pacing: creativeDirectionData.pacing
      } : null,

      // Production metadata (default values for now)
      productionMetadata: {
        narrativeStyle: creativeDirectionData?.narrativeStyle || "Cinematic",
        musicGenre: creativeDirectionData?.musicGenre || "Orchestral",
        videoFormat: "16:9 HD",
        pacing: creativeDirectionData?.pacing || "Dynamic"
      }
    };

    console.log(`[METADATA] Collected for ${jobId}:`, {
      productName: metadata.productName,
      hasProductAnalysis: !!metadata.productAnalysis,
      hasCreativeDirection: !!metadata.creativeDirection
    });

    return metadata;

  } catch (error) {
    console.error(`[METADATA] Collection failed for session ${sessionId}:`, error);

    // Return minimal metadata as fallback
    return {
      productName: "Commercial Video",
      title: "Commercial Video",
      description: "A commercial video created with AdCraft AI",
      duration: 8,
      quality: "720p",
      productAnalysis: null,
      creativeDirection: null,
      productionMetadata: {
        narrativeStyle: "Cinematic",
        musicGenre: "Orchestral",
        videoFormat: "16:9 HD",
        pacing: "Dynamic"
      }
    };
  }
}

const JobStatusResponseApiSchema = createApiResponseSchema(
  JobStatusRequestSchema.omit({ jobId: true }).extend({
    jobId: JobStatusRequestSchema.shape.jobId,
    status: JobStatusRequestSchema.shape.jobId,
    progress: JobStatusRequestSchema.shape.jobId.optional(),
    statusMessage: JobStatusRequestSchema.shape.jobId,
    videoUrl: JobStatusRequestSchema.shape.jobId.optional(),
    thumbnailUrl: JobStatusRequestSchema.shape.jobId.optional(),
    estimatedTimeRemaining: JobStatusRequestSchema.shape.jobId.optional(),
    error: JobStatusRequestSchema.shape.jobId.optional(),
  })
);

/**
 * GET /api/status/[jobId]
 * 
 * Retrieves the current status of a video generation job
 * Provides real-time updates on processing progress, completion status, and video URLs
 * 
 * @param request - HTTP request with jobId in the URL path
 * @returns Current job status, progress, and video URLs when available
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate jobId parameter
    try {
      JobStatusRequestSchema.parse({ jobId });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_JOB_ID',
          message: 'Invalid job ID format.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Sanitize job ID
    const sanitizedJobId = ValidationUtils.sanitizeInput(jobId);

    // Enhanced rate limiting for status checks
    const rateLimiter = RateLimiterService.getInstance();
    const clientId = rateLimiter.getClientIdentifier(request);
    const rateLimitResult = rateLimiter.checkRateLimit(clientId, 'status-check');
    
    if (!rateLimitResult.allowed) {
      const response = rateLimiter.createRateLimitResponse(rateLimitResult);
      return NextResponse.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Initialize services
    const veoService = VeoService.getInstance();
    const firestoreService = FirestoreService.getInstance();
    const jobTracker = JobTracker.getInstance();

    // Get job information from Firestore
    const videoJob: VideoJob | null = await firestoreService.getVideoJob(sanitizedJobId);
    if (!videoJob) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Video job not found or has expired.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 404 });
    }

    // Check if job has expired (older than 24 hours)
    const jobAge = Date.now() - videoJob.createdAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (jobAge > maxAge) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'JOB_EXPIRED',
          message: 'Job has expired. Please start a new video generation.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 410 }); // 410 Gone
    }

    // Get current status from Veo API if job is still processing
    let currentStatus = videoJob.status;
    let progress = videoJob.progress || 0;
    let videoUrl = videoJob.videoUrl;
    let thumbnailUrl = videoJob.thumbnailUrl;
    let estimatedTimeRemaining: number | undefined = undefined;
    let error = videoJob.error;

    if (['pending', 'processing'].includes(currentStatus)) {
      try {
        // Query Veo service for latest status using the stored operation ID
        const operationId = videoJob.veoJobId || sanitizedJobId;
        console.log(`🎬 Checking status for operation: ${operationId}`);
        const veoStatus = await veoService.getJobStatus(operationId);
        
        // Update local variables with latest info
        currentStatus = veoStatus.status;
        progress = veoStatus.progress || progress;
        error = veoStatus.error || error;
        
        // If job completed, handle permanent storage migration
        if (veoStatus.status === 'completed' && veoStatus.videoUrl) {
          console.log(`🎬 Video completed, handling permanent storage...`);

          // Import app mode config
          const { AppModeConfig } = await import('@/lib/config/app-mode');
          const isDemoMode = AppModeConfig.getMode() === 'demo';

          if (isDemoMode) {
            // Demo mode: Create permanent-style URLs but don't actually store anything
            videoUrl = `https://storage.googleapis.com/adcraft-videos/demo/videos/${sanitizedJobId}.mp4`;
            thumbnailUrl = `https://storage.googleapis.com/adcraft-videos/demo/thumbnails/${sanitizedJobId}.jpg`;
            console.log(`🎬 Demo mode: Using mock permanent URLs for ${sanitizedJobId}`);
          } else {
            // Production mode: Migrate to real Cloud Storage
            try {
              const { VideoStorageService } = await import('@/lib/services/video-storage');
              const videoStorage = VideoStorageService.getInstance();

              // Collect rich metadata from agent sessions
              const metadata = await collectVideoMetadata(videoJob.sessionId, sanitizedJobId);

              // Migrate video to permanent Cloud Storage
              const migrationResult = await videoStorage.migrateFromGeminiApi(
                veoStatus.videoUrl,
                sanitizedJobId,
                {
                  productName: metadata.productName,
                  duration: metadata.duration,
                  quality: metadata.quality,
                }
              );

              if (migrationResult.success) {
                // Use permanent URLs instead of temporary proxy URLs
                videoUrl = migrationResult.newVideoUrl;
                thumbnailUrl = migrationResult.newThumbnailUrl;
                console.log(`🎬 Video migrated to permanent storage: ${videoUrl}`);
              } else {
                console.error(`🎬 Video migration failed: ${migrationResult.error}`);
                // Fallback to proxy URLs
                videoUrl = veoStatus.videoUrl;
                thumbnailUrl = veoStatus.thumbnailUrl;
              }
            } catch (error) {
              console.error(`🎬 Video migration error:`, error);
              // Fallback to proxy URLs
              videoUrl = veoStatus.videoUrl;
              thumbnailUrl = veoStatus.thumbnailUrl;
            }
          }
        }

        // Update job record in Firestore if status changed
        if (currentStatus !== videoJob.status) {
          // Collect metadata for completed videos
          const updateData: any = {
            status: currentStatus,
            progress: progress,
            videoUrl: videoUrl, // Use permanent URL if migration succeeded
            thumbnailUrl: thumbnailUrl,
            error: error,
            updatedAt: new Date(),
          };

          // Add rich metadata for completed videos
          if (currentStatus === 'completed' && videoJob.sessionId) {
            try {
              const richMetadata = await collectVideoMetadata(videoJob.sessionId, sanitizedJobId);
              updateData.productName = richMetadata.productName;
              updateData.title = richMetadata.title;
              updateData.description = richMetadata.description;
              updateData.duration = richMetadata.duration;
              updateData.quality = richMetadata.quality;
              updateData.completedAt = new Date();
              updateData.productAnalysis = richMetadata.productAnalysis;
              updateData.creativeDirection = richMetadata.creativeDirection;
              updateData.productionMetadata = richMetadata.productionMetadata;

              console.log(`🎬 Added rich metadata for video: ${sanitizedJobId}`, {
                productName: updateData.productName,
                videoUrl: videoUrl
              });
            } catch (metadataError) {
              console.warn(`🎬 Failed to collect metadata for ${sanitizedJobId}:`, metadataError);
            }
          }

          await firestoreService.updateVideoJob(sanitizedJobId, updateData);

          // Update session status if job completed
          if (currentStatus === 'completed' && videoJob.sessionId) {
            await firestoreService.updateSession(videoJob.sessionId, {
              status: 'completed',
              updatedAt: new Date(),
            });
          }
        }

        // Get estimated time remaining from job tracker
        const jobProgress = await jobTracker.getJobProgress(sanitizedJobId);
        estimatedTimeRemaining = jobProgress?.estimatedTimeRemaining;

      } catch (veoError) {
        console.warn('Failed to get latest status from Veo API:', veoError);
        // Continue with cached status from Firestore
      }
    }

    // Generate status message
    let statusMessage: string;
    switch (currentStatus) {
      case 'pending':
        statusMessage = 'Your video generation is queued and will begin shortly.';
        break;
      case 'processing':
        statusMessage = `Generating your video... ${Math.round(progress)}% complete.`;
        break;
      case 'completed':
        statusMessage = 'Your video is ready! Click to view and download.';
        break;
      case 'failed':
        statusMessage = error || 'Video generation failed. Please try again.';
        break;
      default:
        statusMessage = 'Unknown status.';
    }

    // Prepare response
    const response: JobStatusResponse = {
      jobId: sanitizedJobId,
      status: currentStatus,
      progress: progress > 0 ? Math.round(progress) : undefined,
      statusMessage,
      videoUrl,
      thumbnailUrl,
      estimatedTimeRemaining: estimatedTimeRemaining ? Math.round(estimatedTimeRemaining) : undefined,
      error,
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Status check failed:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 400 });
      }

      if (error.message.includes('not found') || error.message.includes('expired')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found or has expired.',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 404 });
      }

      if (error.message.includes('Firestore')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database temporarily unavailable. Please try again.',
            timestamp: new Date(),
          },
          timestamp: new Date(),
        }, { status: 502 });
      }
    }

    // Generic server error
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while checking job status.',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}

/**
 * DELETE /api/status/[jobId]
 * 
 * Cancels a video generation job if it's still processing
 * 
 * @param request - HTTP request with jobId in the URL path
 * @returns Cancellation confirmation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate jobId parameter
    try {
      JobStatusRequestSchema.parse({ jobId });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_JOB_ID',
          message: 'Invalid job ID format.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 400 });
    }

    // Sanitize job ID
    const sanitizedJobId = ValidationUtils.sanitizeInput(jobId);

    // Enhanced rate limiting for job cancellation
    const rateLimiter = RateLimiterService.getInstance();
    const clientId = rateLimiter.getClientIdentifier(request);
    const rateLimitResult = rateLimiter.checkRateLimit(clientId, 'status-check'); // Same limits as status check
    
    if (!rateLimitResult.allowed) {
      const response = rateLimiter.createRateLimitResponse(rateLimitResult);
      return NextResponse.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Initialize services
    const veoService = VeoService.getInstance();
    const firestoreService = FirestoreService.getInstance();
    const jobTracker = JobTracker.getInstance();

    // Get job information
    const videoJob = await firestoreService.getVideoJob(sanitizedJobId);
    if (!videoJob) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Video job not found.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 404 });
    }

    // Check if job can be cancelled
    if (!['pending', 'processing'].includes(videoJob.status)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: `Job cannot be cancelled. Current status: ${videoJob.status}`,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 409 });
    }

    // Attempt to cancel the job
    const cancelled = await veoService.cancelJob(sanitizedJobId);

    if (cancelled) {
      // Update job status in Firestore
      await firestoreService.updateVideoJob(sanitizedJobId, {
        status: 'failed',
        error: 'Job cancelled by user',
        updatedAt: new Date(),
      });

      // Note: Job tracking will automatically stop when status changes

      // Update session status
      if (videoJob.sessionId) {
        await firestoreService.updateSession(videoJob.sessionId, {
          status: 'failed',
          updatedAt: new Date(),
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          jobId: sanitizedJobId,
          status: 'cancelled',
          message: 'Job cancelled successfully.',
        },
        timestamp: new Date(),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CANCELLATION_FAILED',
          message: 'Failed to cancel job. It may have already completed.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Job cancellation failed:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while cancelling the job.',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}