import { NextRequest, NextResponse } from "next/server";
import { SecurityMonitorService } from "@/lib/monitor/security-monitor";

/**
 * GET /api/admin/security
 *
 * Security dashboard endpoint for monitoring security events and metrics
 * NOTE: This endpoint should be protected with proper authentication in production
 *
 * @param request - HTTP request with optional query parameters for filtering
 * @returns Security metrics, recent events, and active alerts
 */
export async function GET(request: NextRequest) {
  try {
    // NOTE: In production, add proper authentication here
    // const isAuthorized = await checkAdminAuthentication(request);
    // if (!isAuthorized) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const securityMonitor = SecurityMonitorService.getInstance();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const eventsCount = parseInt(searchParams.get("events") || "50");
    const severity = searchParams.get("severity") as "low" | "medium" | "high" | "critical" | null;
    const includeReport = searchParams.get("report") === "true";

    // Get security data
    const metrics = securityMonitor.getMetrics();
    const recentEvents = securityMonitor.getRecentEvents(eventsCount, severity || undefined);
    const activeAlerts = securityMonitor.getActiveAlerts();
    const allAlerts = securityMonitor.getAllAlerts();
    const suspiciousSources = securityMonitor.getTopSuspiciousSources();

    // Prepare response
    const response: any = {
      success: true,
      data: {
        timestamp: new Date(),
        metrics,
        recentEvents: recentEvents.length,
        recentEventsList: recentEvents,
        activeAlerts: activeAlerts.length,
        activeAlertsList: activeAlerts,
        totalAlerts: allAlerts.length,
        suspiciousSources: suspiciousSources.slice(0, 10), // Top 10
      },
      timestamp: new Date(),
    };

    // Include full security report if requested
    if (includeReport) {
      response.data.fullReport = securityMonitor.exportSecurityReport();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Security dashboard endpoint failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SECURITY_DASHBOARD_ERROR",
          message: "Failed to retrieve security information",
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security
 *
 * Security management actions (resolve alerts, reset suspicious sources, etc.)
 *
 * @param request - HTTP request with action and parameters
 * @returns Action result
 */
export async function POST(request: NextRequest) {
  try {
    // NOTE: In production, add proper authentication here
    // const isAuthorized = await checkAdminAuthentication(request);
    // if (!isAuthorized) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { action, alertId, source } = body;

    const securityMonitor = SecurityMonitorService.getInstance();
    let result: any = {};

    switch (action) {
      case "resolve_alert":
        if (!alertId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "MISSING_ALERT_ID",
                message: "Alert ID is required",
                timestamp: new Date(),
              },
              timestamp: new Date(),
            },
            { status: 400 }
          );
        }

        const resolved = securityMonitor.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "ALERT_NOT_FOUND",
                message: "Alert not found or already resolved",
                timestamp: new Date(),
              },
              timestamp: new Date(),
            },
            { status: 404 }
          );
        }

        result = {
          action: "resolve_alert",
          alertId,
          message: "Alert resolved successfully",
        };
        break;

      case "get_security_report":
        result = {
          action: "get_security_report",
          report: securityMonitor.exportSecurityReport(),
        };
        break;

      case "check_suspicious_source":
        if (!source) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "MISSING_SOURCE",
                message: "Source identifier is required",
                timestamp: new Date(),
              },
              timestamp: new Date(),
            },
            { status: 400 }
          );
        }

        result = {
          action: "check_suspicious_source",
          source,
          isSuspicious: securityMonitor.isSuspiciousSource(source),
          suspiciousSources: securityMonitor
            .getTopSuspiciousSources()
            .find((s) => s.source === source),
        };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_ACTION",
              message: `Unknown action: ${action}`,
              timestamp: new Date(),
            },
            timestamp: new Date(),
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Security management action failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SECURITY_ACTION_ERROR",
          message: "Failed to execute security action",
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/security
 *
 * Update security configuration or settings
 *
 * @param request - HTTP request with configuration updates
 * @returns Update confirmation
 */
export async function PUT(request: NextRequest) {
  try {
    // NOTE: In production, add proper authentication here

    const body = await request.json();
    const { configType, config } = body;

    // Placeholder for security configuration updates
    // This could include rate limit adjustments, alert thresholds, etc.

    return NextResponse.json({
      success: true,
      data: {
        message: "Security configuration endpoint - not implemented in demo version",
        configType,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Security configuration update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONFIG_UPDATE_ERROR",
          message: "Failed to update security configuration",
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
