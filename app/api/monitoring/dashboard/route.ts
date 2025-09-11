/**
 * Public Monitoring Dashboard API Endpoint
 * Provides monitoring data for the public dashboard UI
 */

import { NextRequest, NextResponse } from "next/server";
import { MonitoringService } from "@/lib/monitor/monitoring";
import { Logger } from "@/lib/utils/logger";

/**
 * GET /api/monitoring/dashboard
 * Returns public monitoring dashboard data (no authentication required)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  const correlationId = logger.generateCorrelationId();
  const startTime = Date.now();

  // Extract client info
  const clientIP =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  logger.info("Public monitoring dashboard accessed", {
    correlationId,
    endpoint: "/api/monitoring/dashboard",
    method: "GET",
    ip: clientIP,
    userAgent,
  });

  try {
    // Get monitoring service instance
    const monitoringService = MonitoringService.getInstance();

    // Get comprehensive dashboard data
    const dashboardData = await monitoringService.getMonitoringDashboard();

    // Filter sensitive information for public consumption
    const publicData = {
      systemHealth: {
        status: dashboardData.systemHealth.status,
        timestamp: dashboardData.systemHealth.timestamp,
        uptime: dashboardData.systemHealth.uptime,
        overallScore: dashboardData.systemHealth.overallScore,
        services: dashboardData.systemHealth.services.map((service) => ({
          name: service.name,
          status: service.status,
          responseTime: service.responseTime,
          lastCheck: service.lastCheck,
          details: {
            available: service.details.available,
            latency: service.details.latency,
            errorRate: service.details.errorRate,
          },
        })),
        criticalIssues: dashboardData.systemHealth.criticalIssues,
        warnings: dashboardData.systemHealth.warnings,
      },
      performance: {
        totalRequests: dashboardData.performance.totalRequests,
        averageResponseTime: dashboardData.performance.averageResponseTime,
        errorRate: dashboardData.performance.errorRate,
        p95ResponseTime: dashboardData.performance.p95ResponseTime,
        p99ResponseTime: dashboardData.performance.p99ResponseTime,
        totalVideoGenerations: dashboardData.performance.totalVideoGenerations,
        averageGenerationTime: dashboardData.performance.averageGenerationTime,
        videoGenerationSuccessRate: dashboardData.performance.videoGenerationSuccessRate,
        currentCpuUsage: dashboardData.performance.currentCpuUsage,
        currentMemoryUsage: dashboardData.performance.currentMemoryUsage,
      },
      budget: dashboardData.budget,
      alerts: {
        total: dashboardData.alerts.total,
        critical: dashboardData.alerts.critical,
        high: dashboardData.alerts.high,
        medium: dashboardData.alerts.medium,
        low: dashboardData.alerts.low,
        recent: dashboardData.alerts.recent.slice(0, 5), // Only show 5 most recent
      },
      trends: dashboardData.trends,
    };

    // Add metadata
    const responseData = {
      ...publicData,
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        generatedIn: Date.now() - startTime,
        version: process.env.npm_package_version || "0.2.2",
      },
    };

    // Log successful response
    const duration = Date.now() - startTime;
    logger.info("Public monitoring dashboard served", {
      correlationId,
      endpoint: "/api/monitoring/dashboard",
      method: "GET",
      ip: clientIP,
      duration,
    });

    // Return monitoring data with appropriate caching headers
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=30", // Cache for 30 seconds
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      "Public monitoring dashboard error",
      {
        correlationId,
        endpoint: "/api/monitoring/dashboard",
        method: "GET",
        ip: clientIP,
        duration,
      },
      error instanceof Error ? error : new Error(errorMessage)
    );

    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
        message: "Failed to retrieve monitoring data",
        correlationId,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/monitoring/dashboard
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
