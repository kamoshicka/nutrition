/**
 * Health check endpoint for production monitoring
 * Provides system health status and diagnostics
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '../../../../lib/monitoring';
import { logger } from '../../../../lib/logger';

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Run health checks
    const healthResult = await monitoring.runHealthChecks();
    
    // Record response time
    const duration = Date.now() - start;
    monitoring.recordResponseTime('/api/health', duration, 200);
    
    // Set appropriate HTTP status based on health
    let status = 200;
    if (healthResult.status === 'unhealthy') {
      status = 503; // Service Unavailable
    } else if (healthResult.status === 'degraded') {
      status = 200; // OK but with warnings
    }
    
    // Add cache headers to prevent caching of health checks
    const response = NextResponse.json(healthResult, { status });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - start;
    monitoring.recordResponseTime('/api/health', duration, 500);
    
    logger.error('Health check endpoint failed', {
      error: error.message,
      duration,
      type: 'health_check_error'
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: Date.now() - start
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Simple health check endpoint that just returns OK
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}