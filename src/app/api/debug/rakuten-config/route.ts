/**
 * Debug API endpoint for Rakuten API configuration status
 * 
 * This endpoint provides comprehensive information about the Rakuten API configuration,
 * including API key validation, environment setup, and health check results.
 * Only available in development and staging environments for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { config, validateConfig, getEnvironmentSpecificConfig } from '@/lib/config';
import { apiKeyValidator, getRakutenSetupInstructions } from '@/lib/rakuten-api-validator';
import { getCachedHealthStatus, getCurrentHealthStatus } from '@/lib/rakuten-health-monitor';

// Interface for the debug response
interface RakutenConfigDebugResponse {
  timestamp: string;
  environment: string;
  configuration: {
    apiKey: {
      configured: boolean;
      formatValid: boolean;
      connectionValid?: boolean;
      connectionError?: string;
      responseTime?: number;
    };
    environment: {
      nodeEnv: string;
      vercelEnv?: string;
      detectedEnv: string;
      useMockData: boolean;
      healthChecksEnabled: boolean;
    };
    validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      recommendations: string[];
    };
    rateLimit: {
      requestsPerSecond: number;
      requestsPerDay: number;
      burstLimit: number;
    };
    monitoring: {
      enableHealthChecks: boolean;
      healthCheckInterval: number;
      logLevel: string;
    };
  };
  health: {
    current?: {
      isHealthy: boolean;
      lastChecked: string;
      responseTime?: number;
      error?: string;
      endpoint?: string;
    };
    cached?: {
      isHealthy: boolean;
      lastChecked: string;
      responseTime?: number;
      error?: string;
      endpoint?: string;
    };
  };
  setup: {
    instructions: {
      environment: string;
      steps: string[];
      environmentVariables: Record<string, string>;
      troubleshooting: string[];
      links: Array<{ title: string; url: string }>;
    };
    missingVariables: string[];
    recommendedActions: string[];
  };
  system: {
    appName: string;
    appVersion: string;
    baseUrl: string;
    rakutenBaseUrl: string;
    timeout: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Security check - only allow in development and staging
    const envConfig = getEnvironmentSpecificConfig();
    if (envConfig.isProduction) {
      return NextResponse.json({
        error: 'Configuration debug endpoint is not available in production',
        timestamp: new Date().toISOString(),
      }, { 
        status: 403,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Validate configuration
    const configValidation = validateConfig();

    // Test API key if configured
    let apiKeyConnectionTest: { valid?: boolean; error?: string; responseTime?: number } = {};
    if (config.rakuten.applicationId) {
      try {
        const connectionResult = await apiKeyValidator.validateConnection(config.rakuten.applicationId);
        apiKeyConnectionTest = {
          valid: connectionResult.isValid,
          error: connectionResult.error,
          responseTime: connectionResult.details?.responseTime,
        };
      } catch (error) {
        apiKeyConnectionTest = {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown connection test error',
        };
      }
    }

    // Get health status
    const [currentHealth, cachedHealth] = await Promise.all([
      getCurrentHealthStatus().catch(() => null),
      Promise.resolve(getCachedHealthStatus()),
    ]);

    // Get setup instructions for current environment
    const setupInstructions = getRakutenSetupInstructions(envConfig.environment as any);

    // Identify missing environment variables
    const missingVariables: string[] = [];
    const recommendedActions: string[] = [];

    if (!config.rakuten.applicationId) {
      missingVariables.push('RAKUTEN_APPLICATION_ID');
      recommendedActions.push('Set up Rakuten API key to enable real recipe data');
    }

    if (envConfig.isStaging && config.features.useMockRecipes) {
      recommendedActions.push('Consider setting USE_MOCK_RECIPES=false for staging environment testing');
    }

    if (!config.rakuten.monitoring.enableHealthChecks && !envConfig.isDevelopment) {
      recommendedActions.push('Enable health checks with RAKUTEN_ENABLE_HEALTH_CHECKS=true');
    }

    // Build comprehensive response
    const debugResponse: RakutenConfigDebugResponse = {
      timestamp: new Date().toISOString(),
      environment: envConfig.environment,
      configuration: {
        apiKey: {
          configured: config.rakuten.validation.isConfigured,
          formatValid: config.rakuten.validation.isValid,
          connectionValid: apiKeyConnectionTest.valid,
          connectionError: apiKeyConnectionTest.error,
          responseTime: apiKeyConnectionTest.responseTime,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'unknown',
          vercelEnv: process.env.VERCEL_ENV,
          detectedEnv: envConfig.environment,
          useMockData: config.features.useMockRecipes,
          healthChecksEnabled: config.rakuten.monitoring.enableHealthChecks,
        },
        validation: configValidation,
        rateLimit: config.rakuten.rateLimit,
        monitoring: config.rakuten.monitoring,
      },
      health: {
        current: currentHealth ? {
          isHealthy: currentHealth.isHealthy,
          lastChecked: currentHealth.lastChecked.toISOString(),
          responseTime: currentHealth.responseTime,
          error: currentHealth.error,
          endpoint: currentHealth.endpoint,
        } : undefined,
        cached: cachedHealth ? {
          isHealthy: cachedHealth.isHealthy,
          lastChecked: cachedHealth.lastChecked.toISOString(),
          responseTime: cachedHealth.responseTime,
          error: cachedHealth.error,
          endpoint: cachedHealth.endpoint,
        } : undefined,
      },
      setup: {
        instructions: setupInstructions,
        missingVariables,
        recommendedActions,
      },
      system: {
        appName: config.app.name,
        appVersion: config.app.version,
        baseUrl: config.app.baseUrl,
        rakutenBaseUrl: config.rakuten.baseUrl,
        timeout: config.rakuten.timeout,
      },
    };

    // Determine response status based on configuration validity
    let statusCode = 200;
    if (!configValidation.isValid) {
      statusCode = 422; // Unprocessable Entity - configuration issues
    } else if (apiKeyConnectionTest.valid === false) {
      statusCode = 503; // Service Unavailable - API connection issues
    }

    return NextResponse.json(debugResponse, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Rakuten config debug endpoint error:', error);
    
    return NextResponse.json({
      error: 'Configuration debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

// Support HEAD requests for simple availability checks
export async function HEAD(request: NextRequest) {
  try {
    // Security check - only allow in development and staging
    const envConfig = getEnvironmentSpecificConfig();
    if (envConfig.isProduction) {
      return new NextResponse(null, { 
        status: 403,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Quick validation check
    const configValidation = validateConfig();
    const statusCode = configValidation.isValid ? 200 : 422;
    
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