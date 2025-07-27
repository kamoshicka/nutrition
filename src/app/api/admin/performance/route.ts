/**
 * Performance monitoring API endpoint
 * Provides detailed performance metrics and system health data
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '../../../../../lib/monitoring';
import { dbOptimizer } from '../../../../../lib/database-optimizer';
import { errorMonitoring } from '../../../../../lib/error-monitoring';
import { logger } from '../../../../../lib/logger';

// Simple admin authentication
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_API_TOKEN;
  
  if (!adminToken) {
    logger.warn('Admin API token not configured');
    return false;
  }
  
  return authHeader === `Bearer ${adminToken}`;
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000', 10); // Default 1 hour
    const includeDetails = searchParams.get('details') === 'true';

    // Gather performance data
    const [
      healthStatus,
      queryStats,
      errorStats,
      systemMetrics
    ] = await Promise.all([
      monitoring.runHealthChecks(),
      Promise.resolve(dbOptimizer.getQueryStats()),
      Promise.resolve(errorMonitoring.getErrorStats(timeWindow)),
      Promise.resolve(getSystemMetrics())
    ]);

    let detailedData = {};
    
    if (includeDetails) {
      detailedData = {
        recentErrors: errorMonitoring.getRecentErrors(20),
        cacheStats: dbOptimizer.getCacheStats(),
        recentMetrics: monitoring.getMetrics().slice(-100),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };
    }

    const duration = Date.now() - start;
    monitoring.recordResponseTime('/api/admin/performance', duration, 200);

    const response = {
      timestamp: new Date().toISOString(),
      timeWindow,
      health: {
        status: healthStatus.status,
        uptime: healthStatus.uptime,
        checks: healthStatus.checks
      },
      database: {
        ...queryStats,
        cacheSize: dbOptimizer.getCacheStats().size
      },
      errors: errorStats,
      system: systemMetrics,
      ...detailedData
    };

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - start;
    monitoring.recordResponseTime('/api/admin/performance', duration, 500);

    logger.error('Performance monitoring request failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
      type: 'performance_monitoring_error'
    });

    return NextResponse.json(
      { 
        error: 'Failed to fetch performance data',
        message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) // %
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
      total: cpuUsage.user + cpuUsage.system
    },
    uptime: Math.round(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}