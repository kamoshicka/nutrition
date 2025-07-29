/**
 * Debug API endpoint for Rakuten API health status
 * 
 * This endpoint provides detailed information about the Rakuten API health status,
 * configuration validation, and monitoring system status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentHealthStatus, getCachedHealthStatus } from '@/lib/rakuten-health-monitor';
import { config, validateConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get current and cached health status
    const [currentHealth, cachedHealth] = await Promise.all([
      getCurrentHealthStatus(),
      Promise.resolve(getCachedHealthStatus()),
    ]);

    // Validate configuration
    const configValidation = validateConfig();

    // Prepare response data
    const healthReport = {
      timestamp: new Date().toISOString(),
      environment: config.app.environment,
      
      // Health status
      health: {
        current: currentHealth,
        cached: cachedHealth,
        isMonitoringEnabled: config.rakuten.monitoring.enableHealthChecks,
        healthCheckInterval: config.rakuten.monitoring.healthCheckInterval,
      },
      
      // Configuration status
      configuration: {
        apiKeyConfigured: config.rakuten.validation.isConfigured,
        apiKeyValid: config.rakuten.validation.isValid,
        useMockData: config.features.useMockRecipes,
        baseUrl: config.rakuten.baseUrl,
        timeout: config.rakuten.timeout,
        rateLimit: config.rakuten.rateLimit,
        validation: configValidation,
      },
      
      // System information
      system: {
        appName: config.app.name,
        appVersion: config.app.version,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
    };

    // Return appropriate status code based on health
    const statusCode = currentHealth.isHealthy ? 200 : 503;
    
    return NextResponse.json(healthReport, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Health check endpoint error:', error);
    
    return NextResponse.json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const cachedHealth = getCachedHealthStatus();
    
    // If we have cached health status, use it; otherwise assume healthy
    const isHealthy = cachedHealth ? cachedHealth.isHealthy : true;
    const statusCode = isHealthy ? 200 : 503;
    
    return new NextResponse(null, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse(null, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}