/**
 * Trends and Analytics API Endpoint
 * Provides time-series data for monitoring dashboard charts
 */

import { NextRequest, NextResponse } from "next/server";
import { MonitoringService } from "@/lib/monitor/monitoring";
import { MetricsService } from "@/lib/monitor/metrics";
import { CostTracker } from "@/lib/utils/cost-tracker";
import { Logger } from "@/lib/utils/logger";

/**
 * GET /api/monitoring/trends
 * Returns time-series data for dashboard charts
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
  const timeRange = searchParams.get("timeRange") || "24h";
  const metrics = searchParams.get("metrics")?.split(",") || ["performance", "system", "costs"];
  const granularity = searchParams.get("granularity") || "auto";

  logger.info("Trends data requested", {
    correlationId,
    endpoint: "/api/monitoring/trends",
    method: "GET",
    ip: clientIP,
    timeRange,
    metrics,
    granularity,
  });

  try {
    // Get service instances
    const monitoringService = MonitoringService.getInstance();
    const metricsService = MetricsService.getInstance();
    const costTracker = CostTracker.getInstance();

    // Get system trends from monitoring service
    const systemTrends = monitoringService.exportMonitoringData().trends;

    // Prepare response data
    const responseData: any = {
      timeRange,
      granularity,
      trends: {},
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        generatedIn: Date.now() - startTime,
      },
    };

    // Add requested metrics
    if (metrics.includes("performance")) {
      const performanceMetrics = metricsService.getAPIMetrics({
        timeRange,
        limit: 100,
      });

      responseData.trends.performance = {
        responseTime: systemTrends.requestTrend.map((point, index) => ({
          timestamp: point.timestamp,
          value: systemTrends.requestTrend[index]?.value || 0,
        })),
        errorRate: systemTrends.errorTrend,
        throughput: systemTrends.requestTrend,
        requestVolume: performanceMetrics.metrics.map((metric) => ({
          timestamp: metric.timestamp,
          value: metric.responseTime, // Use responseTime as a proxy for request data
        })),
      };
    }

    if (metrics.includes("system")) {
      responseData.trends.system = {
        cpu: systemTrends.cpuTrend,
        memory: systemTrends.memoryTrend,
        healthScore: [], // Could be derived from health checks
      };
    }

    if (metrics.includes("costs")) {
      const costMetrics = await costTracker.getDetailedMetrics();
      responseData.trends.costs = {
        totalCost: systemTrends.costTrend,
        serviceBreakdown: Object.entries(costMetrics.costBreakdown).map(([service, cost]) => ({
          service,
          cost,
          timestamp: new Date(),
        })),
        burnRate: [
          {
            timestamp: new Date(),
            value: costMetrics.projection.projectedDailySpend,
          },
        ],
      };
    }

    if (metrics.includes("alerts")) {
      // Get alert trends (simplified)
      responseData.trends.alerts = {
        total: [
          {
            timestamp: new Date(),
            value: (await monitoringService.getMonitoringDashboard()).alerts.total,
          },
        ],
        bySeverity: [
          {
            severity: "critical",
            count: (await monitoringService.getMonitoringDashboard()).alerts.critical,
          },
          {
            severity: "high",
            count: (await monitoringService.getMonitoringDashboard()).alerts.high,
          },
          {
            severity: "medium",
            count: (await monitoringService.getMonitoringDashboard()).alerts.medium,
          },
          { severity: "low", count: (await monitoringService.getMonitoringDashboard()).alerts.low },
        ],
      };
    }

    // Add data quality metrics
    responseData.dataQuality = {
      completeness: calculateDataCompleteness(responseData.trends),
      freshness: calculateDataFreshness(responseData.trends),
      accuracy: "high", // Simplified
    };

    // Log successful response
    const duration = Date.now() - startTime;
    logger.info("Trends data served", {
      correlationId,
      endpoint: "/api/monitoring/trends",
      method: "GET",
      ip: clientIP,
      duration,
      metricsCount: metrics.length,
      dataPoints: Object.keys(responseData.trends).length,
    });

    // Return trends data
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=120, s-maxage=120", // Cache for 2 minutes
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      "Trends data retrieval error",
      {
        correlationId,
        endpoint: "/api/monitoring/trends",
        method: "GET",
        ip: clientIP,
        duration,
      },
      error instanceof Error ? error : new Error(errorMessage)
    );

    return NextResponse.json(
      {
        error: "Trends data unavailable",
        message: "Failed to retrieve trends data",
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
 * Calculate data completeness score
 */
function calculateDataCompleteness(trends: any): number {
  let totalDataPoints = 0;
  let completeDataPoints = 0;

  Object.values(trends).forEach((trendData: any) => {
    if (Array.isArray(trendData)) {
      totalDataPoints += trendData.length;
      completeDataPoints += trendData.filter(
        (point: any) => point.value !== null && point.value !== undefined
      ).length;
    } else if (typeof trendData === "object") {
      Object.values(trendData).forEach((subData: any) => {
        if (Array.isArray(subData)) {
          totalDataPoints += subData.length;
          completeDataPoints += subData.filter(
            (point: any) => point.value !== null && point.value !== undefined
          ).length;
        }
      });
    }
  });

  return totalDataPoints > 0 ? (completeDataPoints / totalDataPoints) * 100 : 100;
}

/**
 * Calculate data freshness score
 */
function calculateDataFreshness(trends: any): number {
  const now = new Date();
  let totalDataPoints = 0;
  let freshDataPoints = 0;
  const freshThreshold = 5 * 60 * 1000; // 5 minutes

  Object.values(trends).forEach((trendData: any) => {
    if (Array.isArray(trendData)) {
      totalDataPoints += trendData.length;
      freshDataPoints += trendData.filter(
        (point: any) =>
          point.timestamp && now.getTime() - new Date(point.timestamp).getTime() < freshThreshold
      ).length;
    } else if (typeof trendData === "object") {
      Object.values(trendData).forEach((subData: any) => {
        if (Array.isArray(subData)) {
          totalDataPoints += subData.length;
          freshDataPoints += subData.filter(
            (point: any) =>
              point.timestamp &&
              now.getTime() - new Date(point.timestamp).getTime() < freshThreshold
          ).length;
        }
      });
    }
  });

  return totalDataPoints > 0 ? (freshDataPoints / totalDataPoints) * 100 : 100;
}

/**
 * OPTIONS /api/monitoring/trends
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
