#!/usr/bin/env tsx

/**
 * Firestore Production Testing Script
 *
 * This script tests the FirestoreService with production settings to ensure:
 * 1. Documents can be created successfully
 * 2. Job IDs are generated properly
 * 3. Updates work correctly
 * 4. Authentication and permissions work in production
 *
 * Run with: npm run test:firestore-prod
 */

import { FirestoreService } from "../lib/services/firestore.js";
import { CostTracker } from "../lib/utils/cost-tracker.js";

// Production environment configuration
process.env.GCP_PROJECT_ID = "adcraft-dev-2025";
process.env.GCP_REGION = "asia-northeast1";
process.env.ENABLE_MOCK_MODE = "false"; // Force production mode

interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  duration?: number;
  data?: any;
}

class FirestoreProductionTester {
  private firestore: FirestoreService;
  private costTracker: CostTracker;
  private results: TestResult[] = [];

  constructor() {
    this.firestore = FirestoreService.getInstance();
    this.costTracker = CostTracker.getInstance();
  }

  /**
   * Add test result
   */
  private addResult(test: string, success: boolean, error?: string, data?: any, duration?: number) {
    this.results.push({ test, success, error, data, duration });

    const status = success ? "✅ PASS" : "❌ FAIL";
    const errorMsg = error ? ` - ${error}` : "";
    const durationMsg = duration ? ` (${duration}ms)` : "";

    console.log(`${status}: ${test}${durationMsg}${errorMsg}`);
    if (data && success) {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  /**
   * Test Firestore health check and connectivity
   */
  async testConnectivity(): Promise<void> {
    console.log("\n🔍 Testing Firestore Connectivity...");

    const startTime = Date.now();
    try {
      const isHealthy = await this.firestore.healthCheck();
      const duration = Date.now() - startTime;

      if (isHealthy) {
        this.addResult("Firestore Health Check", true, undefined, undefined, duration);
        this.addResult("Production Mode Check", !this.firestore.isMock());
      } else {
        this.addResult(
          "Firestore Health Check",
          false,
          "Health check returned false",
          undefined,
          duration
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Firestore Health Check",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
    }
  }

  /**
   * Test video session creation with production settings
   */
  async testSessionCreation(): Promise<string | null> {
    console.log("\n📝 Testing Session Creation...");

    const testPrompt = "A beautiful sunset over mountains with golden light rays";
    const userId = `test-user-${Date.now()}`;

    const startTime = Date.now();
    try {
      const session = await this.firestore.createSession(testPrompt, userId);
      const duration = Date.now() - startTime;

      // Verify session data
      if (!session.id) {
        this.addResult("Session Creation", false, "Session ID not generated");
        return null;
      }

      if (session.prompt !== testPrompt) {
        this.addResult("Session Creation", false, "Prompt not stored correctly");
        return null;
      }

      if (!session.createdAt || !session.updatedAt || !session.expiresAt) {
        this.addResult("Session Creation", false, "Timestamp fields not set correctly");
        return null;
      }

      // Check expiration time (should be 12 hours from now)
      const expectedExpiry = new Date(session.createdAt.getTime() + 12 * 60 * 60 * 1000);
      const timeDiff = Math.abs(session.expiresAt.getTime() - expectedExpiry.getTime());

      if (timeDiff > 60000) {
        // Allow 1 minute tolerance
        this.addResult("Session Creation", false, "Expiration time not set correctly");
        return null;
      }

      this.addResult(
        "Session Creation",
        true,
        undefined,
        {
          id: session.id,
          userId: session.userId,
          status: session.status,
          expiresIn: Math.round((session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)),
        },
        duration
      );

      return session.id;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Session Creation",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
      return null;
    }
  }

  /**
   * Test session retrieval
   */
  async testSessionRetrieval(sessionId: string): Promise<void> {
    console.log("\n🔍 Testing Session Retrieval...");

    const startTime = Date.now();
    try {
      const session = await this.firestore.getSession(sessionId);
      const duration = Date.now() - startTime;

      if (!session) {
        this.addResult("Session Retrieval", false, "Session not found");
        return;
      }

      if (session.id !== sessionId) {
        this.addResult("Session Retrieval", false, "Session ID mismatch");
        return;
      }

      this.addResult(
        "Session Retrieval",
        true,
        undefined,
        {
          id: session.id,
          status: session.status,
          hasExpiryDate: !!session.expiresAt,
        },
        duration
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Session Retrieval",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
    }
  }

  /**
   * Test video job creation with proper ID generation
   */
  async testJobCreation(sessionId: string): Promise<string | null> {
    console.log("\n🎬 Testing Video Job Creation...");

    const testPrompt = "Create a cinematic video of mountain sunrise";
    const estimatedCost = 1.5;
    const operationId = `operations/projects/adcraft-dev-2025/locations/us-central1/operations/operation-${Date.now()}`;

    const startTime = Date.now();
    try {
      const job = await this.firestore.createVideoJob(
        sessionId,
        testPrompt,
        estimatedCost,
        undefined, // Let it generate a simple job ID
        operationId
      );
      const duration = Date.now() - startTime;

      // Verify job data
      if (!job.id) {
        this.addResult("Job Creation", false, "Job ID not generated");
        return null;
      }

      // Job ID should be simple for Firestore compatibility
      if (job.id.includes("/")) {
        this.addResult("Job Creation", false, "Job ID contains slashes (not Firestore compatible)");
        return null;
      }

      if (job.sessionId !== sessionId) {
        this.addResult("Job Creation", false, "Session ID not linked correctly");
        return null;
      }

      if (job.estimatedCost !== estimatedCost) {
        this.addResult("Job Creation", false, "Estimated cost not stored correctly");
        return null;
      }

      if (job.status !== "pending") {
        this.addResult("Job Creation", false, "Initial status not set to pending");
        return null;
      }

      this.addResult(
        "Job Creation",
        true,
        undefined,
        {
          id: job.id,
          sessionId: job.sessionId,
          status: job.status,
          estimatedCost: job.estimatedCost,
          hasOperationId: !!(job as any).veoJobId,
        },
        duration
      );

      return job.id;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Job Creation",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
      return null;
    }
  }

  /**
   * Test job updates and status transitions
   */
  async testJobUpdates(jobId: string): Promise<void> {
    console.log("\n🔄 Testing Job Updates...");

    // Test 1: Update to processing status
    let startTime = Date.now();
    try {
      const success = await this.firestore.updateVideoJob(jobId, {
        status: "processing",
        progress: 25,
      });
      const duration = Date.now() - startTime;

      if (!success) {
        this.addResult("Job Update (Processing)", false, "Update returned false");
      } else {
        // Verify the update
        const updatedJob = await this.firestore.getVideoJob(jobId);
        if (!updatedJob) {
          this.addResult("Job Update (Processing)", false, "Job not found after update");
        } else if (updatedJob.status !== "processing" || updatedJob.progress !== 25) {
          this.addResult(
            "Job Update (Processing)",
            false,
            "Status or progress not updated correctly"
          );
        } else {
          this.addResult(
            "Job Update (Processing)",
            true,
            undefined,
            {
              status: updatedJob.status,
              progress: updatedJob.progress,
            },
            duration
          );
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Job Update (Processing)",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
    }

    // Test 2: Update to completed status with video URL
    startTime = Date.now();
    try {
      const testVideoUrl = "https://storage.googleapis.com/adcraft-storage/videos/test-video.mp4";
      const actualCost = 1.45;

      const success = await this.firestore.updateVideoJob(jobId, {
        status: "completed",
        progress: 100,
        videoUrl: testVideoUrl,
        actualCost: actualCost,
      });
      const duration = Date.now() - startTime;

      if (!success) {
        this.addResult("Job Update (Completed)", false, "Update returned false");
      } else {
        // Verify the update
        const completedJob = await this.firestore.getVideoJob(jobId);
        if (!completedJob) {
          this.addResult("Job Update (Completed)", false, "Job not found after completion update");
        } else if (completedJob.status !== "completed" || completedJob.videoUrl !== testVideoUrl) {
          this.addResult("Job Update (Completed)", false, "Completion data not updated correctly");
        } else {
          this.addResult(
            "Job Update (Completed)",
            true,
            undefined,
            {
              status: completedJob.status,
              progress: completedJob.progress,
              hasVideoUrl: !!completedJob.videoUrl,
              actualCost: completedJob.actualCost,
            },
            duration
          );
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Job Update (Completed)",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
    }
  }

  /**
   * Test cost tracking functionality
   */
  async testCostTracking(sessionId: string, jobId: string): Promise<void> {
    console.log("\n💰 Testing Cost Tracking...");

    const costEntries = [
      {
        service: "veo" as const,
        amount: 1.45,
        currency: "USD" as const,
        description: "Video generation via Veo API",
        sessionId,
        jobId,
        timestamp: new Date(),
      },
      {
        service: "gemini" as const,
        amount: 0.05,
        currency: "USD" as const,
        description: "Prompt processing via Gemini API",
        sessionId,
        jobId,
        timestamp: new Date(),
      },
    ];

    let totalExpectedCost = 0;

    for (const [index, entryData] of costEntries.entries()) {
      const startTime = Date.now();
      try {
        const costEntry = await this.firestore.recordCost(entryData);
        const duration = Date.now() - startTime;
        totalExpectedCost += entryData.amount;

        if (!costEntry.id) {
          this.addResult(`Cost Recording ${index + 1}`, false, "Cost entry ID not generated");
        } else if (costEntry.amount !== entryData.amount) {
          this.addResult(`Cost Recording ${index + 1}`, false, "Cost amount not stored correctly");
        } else {
          this.addResult(
            `Cost Recording ${index + 1}`,
            true,
            undefined,
            {
              id: costEntry.id,
              service: costEntry.service,
              amount: costEntry.amount,
            },
            duration
          );
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(
          `Cost Recording ${index + 1}`,
          false,
          error instanceof Error ? error.message : String(error),
          undefined,
          duration
        );
      }
    }

    // Test cost retrieval and totals
    const startTime = Date.now();
    try {
      const totalCosts = await this.firestore.getTotalCosts();
      const duration = Date.now() - startTime;

      if (totalCosts >= totalExpectedCost) {
        this.addResult(
          "Cost Retrieval",
          true,
          undefined,
          {
            totalCosts: totalCosts,
            expectedMinimum: totalExpectedCost,
          },
          duration
        );
      } else {
        this.addResult(
          "Cost Retrieval",
          false,
          `Total costs (${totalCosts}) less than expected (${totalExpectedCost})`
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Cost Retrieval",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
    }
  }

  /**
   * Test database statistics and queries
   */
  async testDatabaseStats(): Promise<void> {
    console.log("\n📊 Testing Database Statistics...");

    const startTime = Date.now();
    try {
      const stats = await this.firestore.getStats();
      const duration = Date.now() - startTime;

      if (!stats || typeof stats.totalSessions !== "number") {
        this.addResult("Database Stats", false, "Stats not returned correctly");
      } else {
        this.addResult("Database Stats", true, undefined, stats, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Database Stats",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
    }
  }

  /**
   * Test chat message functionality
   */
  async testChatMessages(sessionId: string): Promise<void> {
    console.log("\n💬 Testing Chat Messages...");

    const testMessages = [
      {
        role: "user" as const,
        content: "Can you make the video more cinematic?",
        timestamp: new Date(),
      },
      {
        role: "assistant" as const,
        content: "I can enhance the cinematic quality by adjusting the lighting and camera angles.",
        timestamp: new Date(),
      },
    ];

    for (const [index, messageData] of testMessages.entries()) {
      const startTime = Date.now();
      try {
        const success = await this.firestore.addChatMessage(sessionId, messageData);
        const duration = Date.now() - startTime;

        if (success) {
          this.addResult(
            `Chat Message ${index + 1}`,
            true,
            undefined,
            {
              role: messageData.role,
              contentLength: messageData.content.length,
            },
            duration
          );
        } else {
          this.addResult(`Chat Message ${index + 1}`, false, "Add message returned false");
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(
          `Chat Message ${index + 1}`,
          false,
          error instanceof Error ? error.message : String(error),
          undefined,
          duration
        );
      }
    }

    // Verify messages were added
    const startTime = Date.now();
    try {
      const session = await this.firestore.getSession(sessionId);
      const duration = Date.now() - startTime;

      if (!session) {
        this.addResult("Chat Message Verification", false, "Session not found for verification");
      } else if (session.chatHistory.length < testMessages.length) {
        this.addResult(
          "Chat Message Verification",
          false,
          `Expected ${testMessages.length} messages, found ${session.chatHistory.length}`
        );
      } else {
        this.addResult(
          "Chat Message Verification",
          true,
          undefined,
          {
            messageCount: session.chatHistory.length,
            lastMessage:
              session.chatHistory[session.chatHistory.length - 1]?.content.substring(0, 50) + "...",
          },
          duration
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        "Chat Message Verification",
        false,
        error instanceof Error ? error.message : String(error),
        undefined,
        duration
      );
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log("🚀 Starting Firestore Production Tests...\n");
    console.log(`Project ID: ${process.env.GCP_PROJECT_ID}`);
    console.log(`Region: ${process.env.GCP_REGION}`);
    console.log(`Mock Mode: ${process.env.ENABLE_MOCK_MODE}`);
    console.log(`Node Environment: ${process.env.NODE_ENV}`);
    console.log("=".repeat(60));

    let sessionId: string | null = null;
    let jobId: string | null = null;

    // Run tests in sequence
    await this.testConnectivity();

    sessionId = await this.testSessionCreation();
    if (sessionId) {
      await this.testSessionRetrieval(sessionId);
      await this.testChatMessages(sessionId);

      jobId = await this.testJobCreation(sessionId);
      if (jobId) {
        await this.testJobUpdates(jobId);
        await this.testCostTracking(sessionId, jobId);
      }
    }

    await this.testDatabaseStats();

    // Print summary
    this.printSummary();
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📋 TEST SUMMARY");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log("\n🚨 FAILED TESTS:");
      this.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   - ${r.test}: ${r.error}`);
        });
    }

    // Specific findings for production deployment
    console.log("\n🔍 PRODUCTION DEPLOYMENT FINDINGS:");

    const isConnected = this.results.find((r) => r.test === "Firestore Health Check")?.success;
    const isProdMode = this.results.find((r) => r.test === "Production Mode Check")?.success;
    const canCreateDocs = this.results.find((r) => r.test === "Session Creation")?.success;
    const canUpdateDocs = this.results.find((r) => r.test.includes("Job Update"))?.success;

    console.log(`   - Firestore Connectivity: ${isConnected ? "✅" : "❌"}`);
    console.log(`   - Production Mode: ${isProdMode ? "✅" : "❌"}`);
    console.log(`   - Document Creation: ${canCreateDocs ? "✅" : "❌"}`);
    console.log(`   - Document Updates: ${canUpdateDocs ? "✅" : "❌"}`);

    // Authentication assessment
    if (!isConnected) {
      console.log("\n🔐 AUTHENTICATION ISSUES:");
      console.log("   - Check GOOGLE_APPLICATION_CREDENTIALS environment variable");
      console.log("   - Verify service account has proper Firestore permissions");
      console.log("   - Ensure service account key is properly configured in Cloud Run");
    }

    // Recommendations
    console.log("\n💡 RECOMMENDATIONS:");
    if (failed === 0) {
      console.log("   - All tests passed! Firestore is ready for production deployment.");
    } else {
      console.log("   - Fix the failed tests before deploying to production.");
      console.log("   - Check IAM permissions for the service account.");
      console.log("   - Verify environment variables are properly configured.");
    }

    console.log("\n" + "=".repeat(60));

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests
async function main() {
  const tester = new FirestoreProductionTester();
  await tester.runAllTests();
}

main().catch((error) => {
  console.error("❌ Test runner failed:", error);
  process.exit(1);
});
