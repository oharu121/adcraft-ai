/**
 * Admin Monitoring Dashboard API Endpoint
 * Provides comprehensive monitoring data for system administration
 */

import { NextRequest, NextResponse } from "next/server";
import { MonitoringService } from "@/lib/monitor/monitoring";
import { Logger } from "@/lib/utils/logger";
import { MetricsService } from "@/lib/monitor/metrics";
import { CostTracker } from "@/lib/utils/cost-tracker";
import { SecurityMonitorService } from "@/lib/monitor/security-monitor";

interface AdminAuthResult {
  isAuthorized: boolean;
  reason?: string;
}

/**
 * Simple admin authentication for monitoring dashboard
 * In production, this should integrate with proper authentication system
 */
function authenticateAdmin(request: NextRequest): AdminAuthResult {
  // Check for admin API key in environment
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey) {
    return { isAuthorized: false, reason: "Admin API key not configured" };
  }

  // Check Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAuthorized: false, reason: "Missing or invalid Authorization header" };
  }

  const providedKey = authHeader.substring(7); // Remove "Bearer " prefix
  if (providedKey !== adminApiKey) {
    return { isAuthorized: false, reason: "Invalid admin API key" };
  }

  return { isAuthorized: true };
}

/**
 * GET /api/admin/monitoring
 * Returns comprehensive monitoring dashboard data
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

  logger.info("Admin monitoring dashboard accessed", {
    correlationId,
    endpoint: "/api/admin/monitoring",
    method: "GET",
    ip: clientIP,
    userAgent,
  });

  try {
    // Authenticate admin access
    const authResult = authenticateAdmin(request);
    if (!authResult.isAuthorized) {
      logger.warn("Unauthorized admin monitoring access attempt", {
        correlationId,
        endpoint: "/api/admin/monitoring",
        method: "GET",
        ip: clientIP,
        userAgent,
        reason: authResult.reason,
      });

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin access required for monitoring dashboard",
          correlationId,
        },
        { status: 401 }
      );
    }

    // Get monitoring service instance
    const monitoringService = MonitoringService.getInstance();

    // Extract query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get("section"); // 'overview', 'health', 'performance', 'costs', 'security', 'alerts'
    const timeRange = searchParams.get("timeRange") || "24h";
    const includeDetails = searchParams.get("details") === "true";

    let responseData: any = {};

    if (!section || section === "overview") {
      // Get comprehensive dashboard data
      responseData = await monitoringService.getMonitoringDashboard();

      // Add system information
      responseData.system = {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        pid: process.pid,
        environment: process.env.NODE_ENV || "development",
      };
    } else {
      // Handle specific section requests
      switch (section) {
        case "health":
          responseData.health = await monitoringService.performHealthCheck();
          if (includeDetails) {
            responseData.healthHistory = monitoringService.exportMonitoringData(
              new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            ).healthChecks;
          }
          break;

        case "performance":
          const metricsService = MetricsService.getInstance();
          responseData.performance = {
            summary: metricsService.getPerformanceSummary(timeRange),
            apiMetrics: metricsService.getAPIMetrics({ timeRange, limit: 100 }),
            videoMetrics: metricsService.getVideoGenerationMetrics({ timeRange, limit: 50 }),
            systemMetrics: metricsService.getSystemMetrics(timeRange),
          };
          break;

        case "costs":
          const costTracker = CostTracker.getInstance();
          responseData.costs = await costTracker.getDetailedMetrics();
          break;

        case "security":
          const securityMonitor = SecurityMonitorService.getInstance();
          responseData.security = {
            metrics: securityMonitor.getMetrics(),
            recentEvents: securityMonitor.getRecentEvents(100),
            activeAlerts: securityMonitor.getActiveAlerts(),
            suspiciousSources: securityMonitor.getTopSuspiciousSources(20),
            report: securityMonitor.exportSecurityReport(),
          };
          break;

        case "alerts":
          const monitoring = MonitoringService.getInstance();
          const dashboardData = await monitoring.getMonitoringDashboard();
          responseData.alerts = dashboardData.alerts;
          const securityMonitorForAlerts = SecurityMonitorService.getInstance();
          const metricsServiceForAlerts = MetricsService.getInstance();
          const costTrackerForAlerts = CostTracker.getInstance();
          responseData.alertDetails = {
            security: securityMonitorForAlerts.getActiveAlerts(),
            performance: metricsServiceForAlerts.getActiveAlerts(),
            cost: costTrackerForAlerts.getActiveAlerts(),
          };
          break;

        case "logs":
          const loggerService = Logger.getInstance();
          responseData.logs = {
            metrics: loggerService.getMetrics(),
            recent: loggerService.getRecentLogs(200),
            errors: loggerService.getRecentLogs(50, "ERROR"),
          };
          if (includeDetails) {
            responseData.logs.critical = loggerService.getRecentLogs(20, "CRITICAL");
          }
          break;

        default:
          return NextResponse.json(
            {
              error: "Invalid section",
              message: `Unknown monitoring section: ${section}`,
              availableSections: [
                "overview",
                "health",
                "performance",
                "costs",
                "security",
                "alerts",
                "logs",
              ],
              correlationId,
            },
            { status: 400 }
          );
      }
    }

    // Add metadata
    responseData.metadata = {
      correlationId,
      timestamp: new Date().toISOString(),
      section: section || "overview",
      timeRange,
      generatedIn: Date.now() - startTime,
      version: process.env.npm_package_version || "0.1.0",
    };

    // Log successful response
    const duration = Date.now() - startTime;
    logger.info("Admin monitoring dashboard served", {
      correlationId,
      endpoint: "/api/admin/monitoring",
      method: "GET",
      ip: clientIP,
      section: section || "overview",
      duration,
    });

    // Return monitoring data
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      "Admin monitoring dashboard error",
      {
        correlationId,
        endpoint: "/api/admin/monitoring",
        method: "GET",
        ip: clientIP,
        duration,
      },
      error instanceof Error ? error : new Error(errorMessage)
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to retrieve monitoring data",
        correlationId,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/monitoring
 * Handles admin monitoring actions (force health check, clear trends, etc.)
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
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Authenticate admin access
    const authResult = authenticateAdmin(request);
    if (!authResult.isAuthorized) {
      logger.warn("Unauthorized admin monitoring action attempt", {
        correlationId,
        endpoint: "/api/admin/monitoring",
        method: "POST",
        ip: clientIP,
        userAgent,
        reason: authResult.reason,
      });

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin access required for monitoring actions",
          correlationId,
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { action, ...params } = body;

    logger.info("Admin monitoring action requested", {
      correlationId,
      endpoint: "/api/admin/monitoring",
      method: "POST",
      ip: clientIP,
      action,
    });

    const monitoringService = MonitoringService.getInstance();
    let result: any = {};

    switch (action) {
      case "force_health_check":
        result.healthCheck = await monitoringService.forceHealthCheck();
        result.message = "Health check completed";
        break;

      case "clear_trends":
        monitoringService.clearTrends();
        result.message = "System trends cleared";
        break;

      case "update_config":
        if (!params.config) {
          throw new Error("Missing config parameter");
        }
        monitoringService.updateConfig(params.config);
        result.message = "Monitoring configuration updated";
        result.newConfig = monitoringService.getConfig();
        break;

      case "resolve_alert":
        if (!params.alertId || !params.source) {
          throw new Error("Missing alertId or source parameter");
        }

        let resolved = false;
        switch (params.source) {
          case "security":
            resolved = SecurityMonitorService.getInstance().resolveAlert(params.alertId);
            break;
          case "performance":
            resolved = MetricsService.getInstance().resolveAlert(params.alertId);
            break;
          case "cost":
            resolved = CostTracker.getInstance().resolveAlert(params.alertId);
            break;
          default:
            throw new Error(`Unknown alert source: ${params.source}`);
        }

        result.resolved = resolved;
        result.message = resolved ? "Alert resolved" : "Alert not found";
        break;

      case "export_data":
        const startDate = params.startDate ? new Date(params.startDate) : undefined;
        const endDate = params.endDate ? new Date(params.endDate) : undefined;
        result.data = monitoringService.exportMonitoringData(startDate, endDate);
        result.message = "Monitoring data exported";
        break;

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            message: `Unknown monitoring action: ${action}`,
            availableActions: [
              "force_health_check",
              "clear_trends",
              "update_config",
              "resolve_alert",
              "export_data",
            ],
            correlationId,
          },
          { status: 400 }
        );
    }

    // Add metadata
    result.metadata = {
      correlationId,
      timestamp: new Date().toISOString(),
      action,
      executedIn: Date.now() - startTime,
    };

    // Log successful action
    const duration = Date.now() - startTime;
    logger.info("Admin monitoring action completed", {
      correlationId,
      endpoint: "/api/admin/monitoring",
      method: "POST",
      ip: clientIP,
      action,
      duration,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      "Admin monitoring action error",
      {
        correlationId,
        endpoint: "/api/admin/monitoring",
        method: "POST",
        ip: clientIP,
        duration,
      },
      error instanceof Error ? error : new Error(errorMessage)
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to execute monitoring action",
        correlationId,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/admin/monitoring
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
