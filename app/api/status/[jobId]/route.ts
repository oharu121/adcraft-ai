import { NextRequest, NextResponse } from 'next/server';
import { 
  VeoService,
  FirestoreService,
  JobTracker,
  CloudStorageService
} from '@/lib/services';
import { 
  JobStatusRequestSchema,
  createApiResponseSchema,
  ValidationUtils
} from '@/lib/utils/validation';
import type { JobStatusResponse } from '@/lib/utils/validation';

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

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!ValidationUtils.validateRateLimit(clientIP, sanitizedJobId)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please slow down status checks.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 429 });
    }

    // Initialize services
    const veoService = VeoService.getInstance();
    const firestoreService = FirestoreService.getInstance();
    const jobTracker = JobTracker.getInstance();
    const storageService = CloudStorageService.getInstance();

    // Get job information from Firestore
    const videoJob = await firestoreService.getVideoJob(sanitizedJobId);
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
        // Query Veo service for latest status
        const veoStatus = await veoService.getJobStatus(sanitizedJobId);
        
        // Update local variables with latest info
        currentStatus = veoStatus.status;
        progress = veoStatus.progress || progress;
        error = veoStatus.error || error;
        
        // If job completed, get video URLs
        if (veoStatus.status === 'completed' && veoStatus.videoUrl) {
          // Create signed URLs for secure access
          try {
            const signedVideoUrl = await storageService.getSignedUrl(
              veoStatus.videoUrl, 
              'read',
              60 * 60 // 1 hour expiry
            );
            videoUrl = signedVideoUrl;

            if (veoStatus.thumbnailUrl) {
              const signedThumbnailUrl = await storageService.getSignedUrl(
                veoStatus.thumbnailUrl,
                'read',
                60 * 60 // 1 hour expiry
              );
              thumbnailUrl = signedThumbnailUrl;
            }
          } catch (urlError) {
            console.warn('Failed to generate signed URLs:', urlError);
            // Fall back to direct URLs if signed URL generation fails
            videoUrl = veoStatus.videoUrl;
            thumbnailUrl = veoStatus.thumbnailUrl;
          }
        }

        // Update job record in Firestore if status changed
        if (currentStatus !== videoJob.status) {
          await firestoreService.updateVideoJob(sanitizedJobId, {
            status: currentStatus,
            progress: progress,
            videoUrl: veoStatus.videoUrl, // Store original URL
            thumbnailUrl: veoStatus.thumbnailUrl,
            error: error,
            updatedAt: new Date(),
          });

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

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!ValidationUtils.validateRateLimit(clientIP, sanitizedJobId)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please slow down.',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }, { status: 429 });
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