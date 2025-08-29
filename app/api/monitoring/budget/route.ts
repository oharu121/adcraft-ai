/**
 * Budget Monitoring API Endpoint
 * Provides budget and cost information for monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { CostTracker } from '@/lib/services/cost-tracker';
import { Logger } from '@/lib/services/logger';

/**
 * GET /api/monitoring/budget
 * Returns budget and cost data for monitoring
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  const correlationId = logger.generateCorrelationId();
  const startTime = Date.now();

  // Extract client info and query parameters
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
  const searchParams = request.nextUrl.searchParams;
  const includeTransactions = searchParams.get('transactions') === 'true';
  const includeProjections = searchParams.get('projections') === 'true';
  const timeRange = searchParams.get('timeRange') || '24h';

  logger.info('Budget data requested', {
    correlationId,
    endpoint: '/api/monitoring/budget',
    method: 'GET',
    ip: clientIP,
    includeTransactions,
    includeProjections,
    timeRange,
  });

  try {
    // Get cost tracker instance
    const costTracker = CostTracker.getInstance();
    
    // Get basic budget data
    const budgetStatus = await costTracker.getBudgetStatus();
    const detailedMetrics = await costTracker.getDetailedMetrics();

    // Prepare response data
    const responseData: any = {
      budget: budgetStatus,
      metrics: detailedMetrics,
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        generatedIn: Date.now() - startTime,
        timeRange,
      },
    };

    // Include transaction history if requested
    if (includeTransactions) {
      responseData.transactions = detailedMetrics.recentCosts;
    }

    // Include cost projections if requested
    if (includeProjections) {
      const projections = await costTracker.getCostProjection();
      responseData.projections = projections;
    }

    // Add service breakdown from costBreakdown
    responseData.serviceBreakdown = {
      veo: detailedMetrics.costBreakdown.veo || 0,
      gemini: detailedMetrics.costBreakdown.gemini || 0,
      imagen: 0, // Not in original breakdown, defaulting to 0
      storage: detailedMetrics.costBreakdown.storage || 0,
      firestore: 0, // Not in original breakdown, defaulting to 0
      other: detailedMetrics.costBreakdown.other || 0,
    };

    // Add alerts
    responseData.alerts = costTracker.getActiveAlerts();

    // Log successful response
    const duration = Date.now() - startTime;
    logger.info('Budget data served', {
      correlationId,
      endpoint: '/api/monitoring/budget',
      method: 'GET',
      ip: clientIP,
      duration,
      currentSpend: budgetStatus.currentSpend,
      percentageUsed: budgetStatus.percentageUsed,
    });

    // Return budget data
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60', // Cache for 1 minute
        'X-Correlation-ID': correlationId,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Budget data retrieval error', {
      correlationId,
      endpoint: '/api/monitoring/budget',
      method: 'GET',
      ip: clientIP,
      duration,
    }, error instanceof Error ? error : new Error(errorMessage));

    return NextResponse.json(
      {
        error: 'Budget data unavailable',
        message: 'Failed to retrieve budget information',
        correlationId,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
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
 * OPTIONS /api/monitoring/budget
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