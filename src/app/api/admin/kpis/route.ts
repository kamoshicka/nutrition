/**
 * KPI Dashboard API endpoint
 * Provides business metrics and analytics data for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { analytics } from '../../../../../lib/analytics';
import { monitoring } from '../../../../../lib/monitoring';
import { dbOptimizer } from '../../../../../lib/database-optimizer';
import { logger } from '../../../../../lib/logger';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

// Simple admin authentication (in production, use proper auth)
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
    const timeRange = searchParams.get('timeRange') as '24h' | '7d' | '30d' || '30d';
    const includeDetails = searchParams.get('details') === 'true';

    // Open database connection
    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    try {
      // Calculate KPIs
      const kpis = await analytics.calculateKPIs(db, timeRange);
      
      // Get additional metrics if requested
      let additionalData = {};
      
      if (includeDetails) {
        const [conversionFunnel, cohortAnalysis, queryStats, healthStatus] = await Promise.all([
          analytics.getConversionFunnel(db),
          analytics.getCohortAnalysis(db),
          Promise.resolve(dbOptimizer.getQueryStats()),
          monitoring.runHealthChecks()
        ]);

        additionalData = {
          conversionFunnel,
          cohortAnalysis,
          queryStats,
          healthStatus: {
            status: healthStatus.status,
            uptime: healthStatus.uptime,
            checks: Object.keys(healthStatus.checks).reduce((acc, key) => {
              acc[key] = healthStatus.checks[key].status;
              return acc;
            }, {} as Record<string, string>)
          },
          recentEvents: analytics.getRecentEvents(50)
        };
      }

      const duration = Date.now() - start;
      monitoring.recordResponseTime('/api/admin/kpis', duration, 200);

      logger.info('KPI dashboard data requested', {
        timeRange,
        includeDetails,
        duration,
        type: 'admin_kpi_request'
      });

      const response = {
        timeRange,
        generatedAt: new Date().toISOString(),
        kpis,
        ...additionalData
      };

      return NextResponse.json(response);

    } finally {
      await db.close();
    }

  } catch (error) {
    const duration = Date.now() - start;
    monitoring.recordResponseTime('/api/admin/kpis', duration, 500);

    logger.error('KPI dashboard request failed', {
      error: error.message,
      duration,
      type: 'admin_kpi_error'
    });

    return NextResponse.json(
      { 
        error: 'Failed to fetch KPI data',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'clear_cache':
        dbOptimizer.clearCache();
        analytics.clearEvents();
        result = { message: 'Cache cleared successfully' };
        break;

      case 'optimize_database':
        const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');
        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        try {
          await dbOptimizer.analyzeAndOptimize(db);
          result = { message: 'Database optimization completed' };
        } finally {
          await db.close();
        }
        break;

      case 'track_event':
        if (!params.event || !params.sessionId) {
          return NextResponse.json(
            { error: 'Missing required parameters: event, sessionId' },
            { status: 400 }
          );
        }
        
        analytics.trackEvent({
          userId: params.userId,
          sessionId: params.sessionId,
          event: params.event,
          properties: params.properties
        });
        
        result = { message: 'Event tracked successfully' };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const duration = Date.now() - start;
    monitoring.recordResponseTime('/api/admin/kpis', duration, 200);

    logger.info('Admin action executed', {
      action,
      duration,
      type: 'admin_action'
    });

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - start;
    monitoring.recordResponseTime('/api/admin/kpis', duration, 500);

    logger.error('Admin action failed', {
      error: error.message,
      duration,
      type: 'admin_action_error'
    });

    return NextResponse.json(
      { 
        error: 'Action failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}