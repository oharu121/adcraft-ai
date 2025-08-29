/**
 * Lightweight System Status API Endpoint
 * Provides quick status check for monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/services/monitoring';
import { Logger } from '@/lib/services/logger';

/**
 * GET /api/monitoring/status
 * Returns lightweight system status (optimized for frequent polling)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  const correlationId = logger.generateCorrelationId();
  const startTime = Date.now();

  // Extract client info
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';

  logger.debug('System status check', {
    correlationId,
    endpoint: '/api/monitoring/status',
    method: 'GET',
    ip: clientIP,
  });

  try {
    // Get monitoring service instance
    const monitoringService = MonitoringService.getInstance();
    
    // Get lightweight status data
    const systemStatus = monitoringService.getSystemStatus();
    const currentHealth = monitoringService.getCurrentHealth();

    // Prepare response data
    const responseData = {
      status: systemStatus.status,
      uptime: systemStatus.uptime,
      score: systemStatus.score,
      alerts: systemStatus.alerts,
      lastCheck: systemStatus.lastCheck,
      services: currentHealth ? {
        total: currentHealth.services.length,
        healthy: currentHealth.services.filter(s => s.status === 'healthy').length,
        degraded: currentHealth.services.filter(s => s.status === 'degraded').length,
        unhealthy: currentHealth.services.filter(s => s.status === 'unhealthy').length,
        critical: currentHealth.services.filter(s => s.status === 'critical').length,
      } : null,
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        generatedIn: Date.now() - startTime,
      },
    };

    // Log successful response (debug level to avoid spam)
    const duration = Date.now() - startTime;
    logger.debug('System status served', {
      correlationId,
      endpoint: '/api/monitoring/status',
      method: 'GET',
      ip: clientIP,
      duration,
      status: systemStatus.status,
    });

    // Return status data with aggressive caching for performance
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=10, s-maxage=10', // Cache for 10 seconds
        'X-Correlation-ID': correlationId,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('System status check error', {
      correlationId,
      endpoint: '/api/monitoring/status',
      method: 'GET',
      ip: clientIP,
      duration,
    }, error instanceof Error ? error : new Error(errorMessage));

    // Return degraded status instead of error to avoid cascading failures
    return NextResponse.json(
      {
        status: 'unknown',
        uptime: process.uptime(),
        score: 0,
        alerts: -1,
        lastCheck: null,
        services: null,
        error: 'Status check failed',
        metadata: {
          correlationId,
          timestamp: new Date().toISOString(),
          generatedIn: Date.now() - startTime,
        },
      },
      { status: 200 } // Return 200 to avoid triggering error states in UI
    );
  }
}

/**
 * OPTIONS /api/monitoring/status
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}