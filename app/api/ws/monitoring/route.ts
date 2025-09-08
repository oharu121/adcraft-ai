import { NextRequest } from "next/server";
import {
  MonitoringService,
  MonitoringDashboardData as ServiceMonitoringData,
} from "@/lib/monitor/monitoring";
import { MonitoringDashboardData } from "@/types/monitoring";

// Server-Sent Events for real-time updates (more compatible than WebSocket with Next.js)
export interface MonitoringEvent {
  type: "health-change" | "budget-update" | "new-alert" | "metrics-update" | "connection-status";
  data?: any;
  timestamp: string;
  id: string;
}

// Connection tracking for Server-Sent Events
const sseConnections = new Set<ReadableStreamDefaultController>();
let updateInterval: NodeJS.Timeout | null = null;
let lastData: ServiceMonitoringData | null = null;

// Broadcast to all connected SSE clients
function broadcast(event: MonitoringEvent) {
  const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\nid: ${event.id}\n\n`;

  const deadConnections: ReadableStreamDefaultController[] = [];

  sseConnections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(sseMessage));
    } catch (error) {
      console.error("Error sending SSE message:", error);
      deadConnections.push(controller);
    }
  });

  // Clean up dead connections
  deadConnections.forEach((controller) => {
    sseConnections.delete(controller);
    try {
      controller.close();
    } catch (error) {
      // Ignore close errors
    }
  });
}

// Generate unique event ID
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Convert service monitoring data to dashboard format
function convertToDashboardData(serviceData: ServiceMonitoringData): MonitoringDashboardData {
  return {
    systemHealth: serviceData.systemHealth,
    performance: {
      totalRequests: serviceData.performance.totalRequests,
      averageResponseTime: serviceData.performance.averageResponseTime,
      errorRate: serviceData.performance.errorRate,
      p95ResponseTime: serviceData.performance.p95ResponseTime,
      p99ResponseTime: serviceData.performance.p99ResponseTime,
      totalVideoGenerations: serviceData.performance.totalRequests, // Approximate
      averageGenerationTime: serviceData.performance.averageResponseTime,
      videoGenerationSuccessRate: 100 - serviceData.performance.errorRate,
      currentCpuUsage: 0, // Will be populated by metrics
      currentMemoryUsage: 0, // Will be populated by metrics
    },
    budget: serviceData.budget,
    alerts: serviceData.alerts,
    trends: serviceData.trends,
    metadata: {
      correlationId: generateEventId(),
      timestamp: new Date().toISOString(),
      generatedIn: 0, // Will be calculated
      version: "1.0.0",
    },
  };
}

// Compare monitoring data for changes
function hasSignificantChanges(
  oldData: ServiceMonitoringData | null,
  newData: ServiceMonitoringData
): boolean {
  if (!oldData) return true;

  // Check system health status change
  if (oldData.systemHealth.status !== newData.systemHealth.status) {
    return true;
  }

  // Check overall health score change (> 5 point change)
  if (Math.abs(oldData.systemHealth.overallScore - newData.systemHealth.overallScore) > 5) {
    return true;
  }

  // Check budget percentage change (> 1% change)
  if (Math.abs(oldData.budget.percentageUsed - newData.budget.percentageUsed) > 1) {
    return true;
  }

  // Check budget alert level change
  if (oldData.budget.alertLevel !== newData.budget.alertLevel) {
    return true;
  }

  // Check for new alerts
  if (oldData.alerts.total !== newData.alerts.total) {
    return true;
  }

  // Check for significant performance changes (> 10% change in response time)
  if (oldData.performance.averageResponseTime > 0 && newData.performance.averageResponseTime > 0) {
    const responseTimeChange = Math.abs(
      (newData.performance.averageResponseTime - oldData.performance.averageResponseTime) /
        oldData.performance.averageResponseTime
    );
    if (responseTimeChange > 0.1) {
      return true;
    }
  }

  // Check for significant error rate changes (> 5% change)
  if (Math.abs(oldData.performance.errorRate - newData.performance.errorRate) > 5) {
    return true;
  }

  return false;
}

// Start monitoring updates
function startMonitoring() {
  if (updateInterval) return;

  console.log("Starting monitoring updates for SSE connections");

  updateInterval = setInterval(async () => {
    if (sseConnections.size === 0) return;

    try {
      const monitoringService = MonitoringService.getInstance();
      const serviceData = await monitoringService.getDashboardData();
      const newData = convertToDashboardData(serviceData);

      if (hasSignificantChanges(lastData, serviceData)) {
        // Determine specific event types based on what changed
        if (lastData) {
          if (
            lastData.systemHealth.status !== serviceData.systemHealth.status ||
            Math.abs(lastData.systemHealth.overallScore - serviceData.systemHealth.overallScore) > 5
          ) {
            broadcast({
              type: "health-change",
              data: {
                oldStatus: lastData.systemHealth.status,
                newStatus: serviceData.systemHealth.status,
                oldScore: lastData.systemHealth.overallScore,
                newScore: serviceData.systemHealth.overallScore,
                systemHealth: newData.systemHealth,
              },
              timestamp: new Date().toISOString(),
              id: generateEventId(),
            });
          }

          if (
            Math.abs(lastData.budget.percentageUsed - serviceData.budget.percentageUsed) > 1 ||
            lastData.budget.alertLevel !== serviceData.budget.alertLevel
          ) {
            broadcast({
              type: "budget-update",
              data: {
                oldPercentage: lastData.budget.percentageUsed,
                newPercentage: serviceData.budget.percentageUsed,
                oldAlertLevel: lastData.budget.alertLevel,
                newAlertLevel: serviceData.budget.alertLevel,
                budget: newData.budget,
              },
              timestamp: new Date().toISOString(),
              id: generateEventId(),
            });
          }

          if (lastData.alerts.total !== serviceData.alerts.total) {
            broadcast({
              type: "new-alert",
              data: {
                newAlerts: serviceData.alerts.total - lastData.alerts.total,
                oldTotal: lastData.alerts.total,
                newTotal: serviceData.alerts.total,
                alerts: newData.alerts,
                recentAlerts: newData.alerts.recent.slice(0, 3), // Send most recent 3 alerts
              },
              timestamp: new Date().toISOString(),
              id: generateEventId(),
            });
          }
        }

        // Send general metrics update
        broadcast({
          type: "metrics-update",
          data: {
            performance: newData.performance,
            trends: newData.trends,
            metadata: newData.metadata,
            fullData: newData, // Include full data for complete updates
          },
          timestamp: new Date().toISOString(),
          id: generateEventId(),
        });
      }

      lastData = serviceData;
    } catch (error) {
      console.error("Error fetching monitoring data for SSE:", error);

      // Send error event to clients
      broadcast({
        type: "connection-status",
        data: {
          status: "error",
          message: "Failed to fetch monitoring data",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
        id: generateEventId(),
      });
    }
  }, 15000); // Check every 15 seconds
}

// Stop monitoring updates
function stopMonitoring() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log("Stopped monitoring updates");
  }
}

// Server-Sent Events endpoint
export async function GET(request: NextRequest) {
  try {
    const stream = new ReadableStream({
      start(controller) {
        // Add connection to tracking
        sseConnections.add(controller);
        console.log(`SSE connection established. Total connections: ${sseConnections.size}`);

        // Start monitoring if this is the first connection
        startMonitoring();

        // Send initial connection event
        const welcomeEvent: MonitoringEvent = {
          type: "connection-status",
          data: {
            status: "connected",
            message: "Real-time monitoring connected",
            connectionId: generateEventId(),
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
          id: generateEventId(),
        };

        const sseMessage = `event: ${welcomeEvent.type}\ndata: ${JSON.stringify(welcomeEvent)}\nid: ${welcomeEvent.id}\n\n`;
        controller.enqueue(new TextEncoder().encode(sseMessage));

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
            controller.enqueue(new TextEncoder().encode(heartbeat));
          } catch (error) {
            clearInterval(heartbeatInterval);
            sseConnections.delete(controller);
            if (sseConnections.size === 0) {
              stopMonitoring();
            }
          }
        }, 30000);

        // Handle connection cleanup
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeatInterval);
          sseConnections.delete(controller);
          console.log(`SSE connection closed. Remaining connections: ${sseConnections.size}`);

          if (sseConnections.size === 0) {
            stopMonitoring();
          }

          try {
            controller.close();
          } catch (error) {
            // Ignore close errors
          }
        });
      },

      cancel() {
        // This will be called when the client disconnects
        console.log("SSE stream cancelled by client");
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("Error establishing SSE connection:", error);
    return new Response("Failed to establish SSE connection", { status: 500 });
  }
}

// Handle connection cleanup
export async function DELETE() {
  console.log("Cleaning up all SSE connections");

  sseConnections.forEach((controller) => {
    try {
      controller.close();
    } catch (error) {
      // Ignore close errors
    }
  });

  sseConnections.clear();
  stopMonitoring();

  return new Response("All SSE connections cleaned up", { status: 200 });
}
