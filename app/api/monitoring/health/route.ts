/**
 * System Health API Endpoint
 * Provides detailed health information for system monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { MonitoringService } from "@/lib/monitor/monitoring";
import { Logger } from "@/lib/utils/logger";

/**
 * GET /api/monitoring/health
 * Returns detailed system health data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  const correlationId = logger.generateCorrelationId();
  const startTime = Date.now();

  // Extract client info and query parameters
  const clientIP =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const searchParams = request.nextUrl.searchParams;
  const forceCheck = searchParams.get("force") === "true";
  const includeHistory = searchParams.get("history") === "true";

  logger.info("System health data requested", {
    correlationId,
    endpoint: "/api/monitoring/health",
    method: "GET",
    ip: clientIP,
    forceCheck,
    includeHistory,
  });

  try {
    // Get monitoring service instance
    const monitoringService = MonitoringService.getInstance();

    let healthData;
    if (forceCheck) {
      // Force a new health check
      healthData = await monitoringService.forceHealthCheck();
    } else {
      // Get current health data or perform check if needed
      healthData = monitoringService.getCurrentHealth();
      if (!healthData) {
        healthData = await monitoringService.performHealthCheck();
      }
    }

    // Prepare response data
    const responseData: any = {
      health: healthData,
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        generatedIn: Date.now() - startTime,
        forced: forceCheck,
      },
    };

    // Include health check history if requested
    if (includeHistory) {
      const exportData = monitoringService.exportMonitoringData(
        new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );
      responseData.history = exportData.healthChecks.slice(-20); // Last 20 checks
    }

    // Log successful response
    const duration = Date.now() - startTime;
    logger.info("System health data served", {
      correlationId,
      endpoint: "/api/monitoring/health",
      method: "GET",
      ip: clientIP,
      duration,
      status: healthData.status,
      score: healthData.overallScore,
    });

    // Return health data
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": forceCheck ? "no-cache" : "public, max-age=30, s-maxage=30",
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      "System health check error",
      {
        correlationId,
        endpoint: "/api/monitoring/health",
        method: "GET",
        ip: clientIP,
        duration,
      },
      error instanceof Error ? error : new Error(errorMessage)
    );

    return NextResponse.json(
      {
        error: "Health check failed",
        message: "Failed to retrieve system health data",
        correlationId,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        metadata: {
          correlationId,
          timestamp: new Date().toISOString(),
          generatedIn: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/health
 * Trigger a forced health check
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  const correlationId = logger.generateCorrelationId();
  const startTime = Date.now();

  // Extract client info
  const clientIP =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  logger.info("Forced health check requested", {
    correlationId,
    endpoint: "/api/monitoring/health",
    method: "POST",
    ip: clientIP,
  });

  try {
    // Get monitoring service instance
    const monitoringService = MonitoringService.getInstance();

    // Force a new health check
    const healthData = await monitoringService.forceHealthCheck();

    // Prepare response data
    const responseData = {
      health: healthData,
      message: "Health check completed successfully",
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        generatedIn: Date.now() - startTime,
        forced: true,
      },
    };

    // Log successful response
    const duration = Date.now() - startTime;
    logger.info("Forced health check completed", {
      correlationId,
      endpoint: "/api/monitoring/health",
      method: "POST",
      ip: clientIP,
      duration,
      status: healthData.status,
      score: healthData.overallScore,
    });

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache",
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      "Forced health check error",
      {
        correlationId,
        endpoint: "/api/monitoring/health",
        method: "POST",
        ip: clientIP,
        duration,
      },
      error instanceof Error ? error : new Error(errorMessage)
    );

    return NextResponse.json(
      {
        error: "Health check failed",
        message: "Failed to perform health check",
        correlationId,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        metadata: {
          correlationId,
          timestamp: new Date().toISOString(),
          generatedIn: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/monitoring/health
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
