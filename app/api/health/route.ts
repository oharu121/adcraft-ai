/**
 * Comprehensive Health Check API Route
 * Advanced health monitoring with service dependencies and detailed status
 */

import { NextRequest, NextResponse } from "next/server";
import { MonitoringService } from "@/lib/monitor/monitoring";
import { Logger } from "@/lib/utils/logger";
import { MetricsService } from "@/lib/monitor/metrics";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  const correlationId = logger.generateCorrelationId();
  const startTime = Date.now();

  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const detailed = searchParams.get("detailed") === "true";
  const checkServices = searchParams.get("services") !== "false"; // Default: true

  try {
    // Record health check metrics
    const metricsService = MetricsService.getInstance();
    metricsService.recordAPIMetric(
      "/api/health",
      "GET",
      200,
      0, // Will update with actual time
      correlationId
    );

    let healthStatus: any = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "0.1.0",
      correlationId,
    };

    if (checkServices) {
      // Get comprehensive health check from monitoring service
      const monitoringService = MonitoringService.getInstance();
      const systemHealth = await monitoringService.performHealthCheck();

      healthStatus = {
        ...healthStatus,
        status: systemHealth.status,
        overallScore: systemHealth.overallScore,
        services: systemHealth.services.map((service) => ({
          name: service.name,
          status: service.status,
          responseTime: service.responseTime,
          available: service.details.available,
          issues: service.issues.length > 0 ? service.issues : undefined,
        })),
      };

      // Add critical issues if any
      if (systemHealth.criticalIssues.length > 0) {
        healthStatus.criticalIssues = systemHealth.criticalIssues;
      }

      // Add warnings if any
      if (systemHealth.warnings.length > 0) {
        healthStatus.warnings = systemHealth.warnings;
      }

      if (detailed) {
        // Add detailed system information
        const memUsage = process.memoryUsage();
        healthStatus.system = {
          memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          },
          cpu: {
            usage: process.cpuUsage(),
          },
          process: {
            pid: process.pid,
            ppid: process.ppid,
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
          },
        };

        // Add recent performance metrics
        const performanceSummary = metricsService.getPerformanceSummary("1h");
        healthStatus.performance = {
          requests: performanceSummary.totalRequests,
          averageResponseTime: Math.round(performanceSummary.averageResponseTime),
          errorRate: Math.round(performanceSummary.errorRate * 100) / 100,
        };
      }
    } else {
      // Simple health check without service dependencies
      healthStatus.message = "Basic health check - services not checked";
    }

    // Update metrics with actual response time
    const duration = Date.now() - startTime;
    metricsService.recordAPIMetric("/api/health", "GET", 200, duration, correlationId);

    // Log health check
    logger.info("Health check completed", {
      correlationId,
      endpoint: "/api/health",
      method: "GET",
      status: healthStatus.status,
      detailed,
      checkServices,
      duration,
    });

    // Determine HTTP status code based on health
    let httpStatus = 200;
    if (healthStatus.status === "unhealthy") {
      httpStatus = 503; // Service Unavailable
    } else if (healthStatus.status === "critical") {
      httpStatus = 503; // Service Unavailable
    } else if (healthStatus.status === "degraded") {
      httpStatus = 200; // Still available but degraded
    }

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Correlation-ID": correlationId,
        "X-Health-Check-Duration": duration.toString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log health check failure
    logger.error(
      "Health check failed",
      {
        correlationId,
        endpoint: "/api/health",
        method: "GET",
        duration,
      },
      error instanceof Error ? error : new Error(errorMessage)
    );

    // Update metrics with error
    const metricsService = MetricsService.getInstance();
    metricsService.recordAPIMetric(
      "/api/health",
      "GET",
      500,
      duration,
      correlationId,
      undefined,
      undefined,
      errorMessage
    );

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        correlationId,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "0.1.0",
      },
      {
        status: 500,
        headers: {
          "X-Correlation-ID": correlationId,
          "X-Health-Check-Duration": duration.toString(),
        },
      }
    );
  }
}

/**
 * HEAD /api/health
 * Lightweight health check for load balancers
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Quick health check without detailed analysis
    const monitoringService = MonitoringService.getInstance();
    const currentHealth = monitoringService.getCurrentHealth();

    // Use cached health status if available (within last 5 minutes)
    let status = "healthy";
    if (currentHealth && Date.now() - currentHealth.timestamp.getTime() < 5 * 60 * 1000) {
      status = currentHealth.status;
    }

    const httpStatus = status === "critical" || status === "unhealthy" ? 503 : 200;

    return new NextResponse(null, {
      status: httpStatus,
      headers: {
        "X-Health-Status": status,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        "X-Health-Status": "error",
      },
    });
  }
}
