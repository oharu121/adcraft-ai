import { FirestoreService, VideoJob } from './firestore';
import { VeoService, VideoJobStatus } from './veo';
import { CostTracker } from './cost-tracker';

export interface JobProgress {
  jobId: string;
  status: VideoJob['status'];
  progress: number; // 0-100
  statusMessage: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

export interface JobMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number; // seconds
  successRate: number; // 0-1
}

/**
 * Job tracking service for monitoring video generation progress
 * Provides real-time status updates and job management
 */
export class JobTracker {
  private static instance: JobTracker;
  private firestore: FirestoreService;
  private veoService: VeoService;
  private costTracker: CostTracker;
  private statusUpdateInterval: number = 30000; // 30 seconds

  private constructor() {
    this.firestore = FirestoreService.getInstance();
    this.veoService = VeoService.getInstance();
    this.costTracker = CostTracker.getInstance();
  }

  /**
   * Get singleton instance of JobTracker
   */
  public static getInstance(): JobTracker {
    if (!JobTracker.instance) {
      JobTracker.instance = new JobTracker();
    }
    return JobTracker.instance;
  }

  /**
   * Create and start tracking a new video job
   */
  public async createJob(
    sessionId: string,
    prompt: string,
    veoJobId: string,
    estimatedCost: number
  ): Promise<string> {
    try {
      // Create job record in Firestore
      const job = await this.firestore.createVideoJob(sessionId, prompt, estimatedCost);
      
      // Start tracking the job
      this.startJobTracking(job.id, veoJobId);
      
      return job.id;

    } catch (error) {
      console.error('Failed to create job:', error);
      throw new Error(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current job progress
   */
  public async getJobProgress(jobId: string): Promise<JobProgress | null> {
    try {
      const job = await this.firestore.getVideoJob(jobId);
      if (!job) {
        return null;
      }

      let statusMessage = this.getStatusMessage(job.status, job.progress);
      let estimatedTimeRemaining = this.calculateTimeRemaining(job);

      return {
        jobId: job.id,
        status: job.status,
        progress: job.progress || 0,
        statusMessage,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        estimatedTimeRemaining,
        error: job.error,
      };

    } catch (error) {
      console.error('Failed to get job progress:', error);
      return null;
    }
  }

  /**
   * Update job status from external source (webhook/polling)
   */
  public async updateJobStatus(jobId: string, status: VideoJobStatus): Promise<boolean> {
    try {
      const updates: Partial<VideoJob> = {
        status: status.status,
        progress: status.progress,
        error: status.error,
      };

      if (status.videoUrl) {
        updates.videoUrl = status.videoUrl;
      }

      if (status.thumbnailUrl) {
        updates.thumbnailUrl = status.thumbnailUrl;
      }

      // Record actual cost when job completes
      if (status.status === 'completed') {
        await this.recordActualCost(jobId);
      }

      const success = await this.firestore.updateVideoJob(jobId, updates);
      
      if (success) {
        console.log(`Job ${jobId} updated to status: ${status.status}`);
      }

      return success;

    } catch (error) {
      console.error('Failed to update job status:', error);
      return false;
    }
  }

  /**
   * Cancel a running job
   */
  public async cancelJob(jobId: string, veoJobId?: string): Promise<boolean> {
    try {
      // Cancel in Veo API if veoJobId provided
      if (veoJobId) {
        await this.veoService.cancelJob(veoJobId);
      }

      // Update status in Firestore
      const success = await this.firestore.updateVideoJob(jobId, {
        status: 'failed',
        error: 'Cancelled by user',
      });

      return success;

    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  /**
   * Get all jobs for a session
   */
  public async getSessionJobs(sessionId: string): Promise<VideoJob[]> {
    try {
      // This would require a Firestore query by sessionId
      // For now, we'll implement a simple approach
      const allJobs = await this.firestore.getJobsByStatus('completed', 100);
      return allJobs.filter(job => job.sessionId === sessionId);

    } catch (error) {
      console.error('Failed to get session jobs:', error);
      return [];
    }
  }

  /**
   * Get job metrics and statistics
   */
  public async getJobMetrics(): Promise<JobMetrics> {
    try {
      const [pendingJobs, processingJobs, completedJobs, failedJobs] = await Promise.all([
        this.firestore.getJobsByStatus('pending'),
        this.firestore.getJobsByStatus('processing'),
        this.firestore.getJobsByStatus('completed'),
        this.firestore.getJobsByStatus('failed'),
      ]);

      const totalJobs = pendingJobs.length + processingJobs.length + completedJobs.length + failedJobs.length;
      const successRate = totalJobs > 0 ? completedJobs.length / totalJobs : 0;

      // Calculate average processing time from completed jobs
      const averageProcessingTime = this.calculateAverageProcessingTime(completedJobs);

      return {
        totalJobs,
        pendingJobs: pendingJobs.length,
        processingJobs: processingJobs.length,
        completedJobs: completedJobs.length,
        failedJobs: failedJobs.length,
        averageProcessingTime,
        successRate,
      };

    } catch (error) {
      console.error('Failed to get job metrics:', error);
      return {
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
        successRate: 0,
      };
    }
  }

  /**
   * Start background tracking of a job
   */
  private startJobTracking(jobId: string, veoJobId: string): void {
    const trackJob = async () => {
      try {
        // Get status from Veo API
        const veoStatus = await this.veoService.getJobStatus(veoJobId);
        
        // Update local job status
        await this.updateJobStatus(jobId, veoStatus);
        
        // Continue tracking if job is not finished
        if (veoStatus.status === 'pending' || veoStatus.status === 'processing') {
          setTimeout(trackJob, this.statusUpdateInterval);
        }

      } catch (error) {
        console.error(`Failed to track job ${jobId}:`, error);
        
        // Mark job as failed if tracking fails
        await this.firestore.updateVideoJob(jobId, {
          status: 'failed',
          error: 'Job tracking failed',
        });
      }
    };

    // Start tracking after initial delay
    setTimeout(trackJob, this.statusUpdateInterval);
  }

  /**
   * Get human-readable status message
   */
  private getStatusMessage(status: VideoJob['status'], progress?: number): string {
    switch (status) {
      case 'pending':
        return 'Video generation request queued...';
      case 'processing':
        const progressText = progress ? ` (${Math.round(progress)}%)` : '';
        return `Generating your video${progressText}...`;
      case 'completed':
        return 'Video generation completed successfully!';
      case 'failed':
        return 'Video generation failed. Please try again.';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateTimeRemaining(job: VideoJob): number | undefined {
    if (job.status !== 'processing') {
      return undefined;
    }

    const progress = job.progress || 0;
    if (progress === 0) {
      return 300; // 5 minutes default
    }

    const elapsedTime = (Date.now() - job.createdAt.getTime()) / 1000;
    const totalEstimatedTime = elapsedTime / (progress / 100);
    const remainingTime = totalEstimatedTime - elapsedTime;

    return Math.max(0, Math.round(remainingTime));
  }

  /**
   * Calculate average processing time from completed jobs
   */
  private calculateAverageProcessingTime(completedJobs: VideoJob[]): number {
    if (completedJobs.length === 0) {
      return 300; // 5 minutes default
    }

    const totalTime = completedJobs.reduce((sum, job) => {
      const processingTime = (job.updatedAt.getTime() - job.createdAt.getTime()) / 1000;
      return sum + processingTime;
    }, 0);

    return Math.round(totalTime / completedJobs.length);
  }

  /**
   * Record actual cost when job completes
   */
  private async recordActualCost(jobId: string): Promise<void> {
    try {
      const job = await this.firestore.getVideoJob(jobId);
      if (!job) {
        return;
      }

      // For now, use estimated cost as actual cost
      // In production, you'd get actual cost from billing APIs
      const actualCost = job.estimatedCost;

      await this.firestore.updateVideoJob(jobId, {
        actualCost,
      });

      await this.costTracker.recordCost(
        'veo',
        actualCost,
        `Video generation - Job ${jobId}`,
        job.sessionId,
        jobId
      );

    } catch (error) {
      console.error('Failed to record actual cost:', error);
    }
  }

  /**
   * Clean up old completed jobs (called by scheduled task)
   */
  public async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // For now, we'll just return 0 as cleanup would require more complex queries
      // In a full implementation, you'd query for jobs older than cutoffDate
      console.log(`Job cleanup would remove jobs older than ${cutoffDate.toISOString()}`);
      return 0;

    } catch (error) {
      console.error('Job cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Health check for job tracker service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const metrics = await this.getJobMetrics();
      return true;
    } catch (error) {
      console.error('Job tracker health check failed:', error);
      return false;
    }
  }

  /**
   * Get system status for monitoring
   */
  public async getSystemStatus(): Promise<{
    isHealthy: boolean;
    activeJobs: number;
    queuedJobs: number;
    budgetStatus: string;
    lastUpdate: Date;
  }> {
    try {
      const metrics = await this.getJobMetrics();
      const budgetStatus = await this.costTracker.getBudgetStatus();

      return {
        isHealthy: true,
        activeJobs: metrics.processingJobs,
        queuedJobs: metrics.pendingJobs,
        budgetStatus: `${budgetStatus.percentageUsed.toFixed(1)}% used`,
        lastUpdate: new Date(),
      };

    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        isHealthy: false,
        activeJobs: 0,
        queuedJobs: 0,
        budgetStatus: 'Unknown',
        lastUpdate: new Date(),
      };
    }
  }
}