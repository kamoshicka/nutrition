/**
 * Rakuten API Health Monitoring System
 * 
 * This module provides comprehensive health monitoring for the Rakuten Recipe API,
 * including connection testing, status tracking, caching, and scheduled monitoring.
 */

import { config } from './config';

// Health status interfaces
export interface HealthStatus {
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  rateLimitStatus?: {
    remaining: number;
    resetTime: Date;
  };
  apiVersion?: string;
  endpoint?: string;
}

export interface HealthCheckResult {
  status: HealthStatus;
  details: {
    connectionTest: boolean;
    authenticationTest: boolean;
    rateLimitCheck: boolean;
    responseTimeMs: number;
  };
}

export interface ApiHealthMonitor {
  checkApiHealth(): Promise<HealthStatus>;
  getLastHealthCheck(): HealthStatus | null;
  scheduleHealthChecks(): void;
  stopHealthChecks(): void;
  getCachedHealthStatus(): HealthStatus | null;
}

// Health check cache
class HealthCheckCache {
  private cache: HealthStatus | null = null;
  private cacheExpiry: Date | null = null;
  private readonly cacheTtl: number = 60000; // 1 minute cache

  set(status: HealthStatus): void {
    this.cache = status;
    this.cacheExpiry = new Date(Date.now() + this.cacheTtl);
  }

  get(): HealthStatus | null {
    if (!this.cache || !this.cacheExpiry || new Date() > this.cacheExpiry) {
      return null;
    }
    return this.cache;
  }

  clear(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }

  isExpired(): boolean {
    return !this.cacheExpiry || new Date() > this.cacheExpiry;
  }
}

// Rate limiter for health checks
class HealthCheckRateLimiter {
  private lastCheck: Date | null = null;
  private readonly minInterval: number = 30000; // 30 seconds minimum between checks

  canCheck(): boolean {
    if (!this.lastCheck) return true;
    return Date.now() - this.lastCheck.getTime() >= this.minInterval;
  }

  recordCheck(): void {
    this.lastCheck = new Date();
  }
}

// Main health monitor implementation
class RakutenHealthMonitor implements ApiHealthMonitor {
  private cache = new HealthCheckCache();
  private rateLimiter = new HealthCheckRateLimiter();
  private scheduledCheckInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  /**
   * Perform a comprehensive health check of the Rakuten API
   */
  async checkApiHealth(): Promise<HealthStatus> {
    // Return cached result if available and rate limiter prevents new check
    const cached = this.cache.get();
    if (cached && !this.rateLimiter.canCheck()) {
      return cached;
    }

    // Prevent concurrent health checks
    if (this.isChecking) {
      return cached || this.createUnhealthyStatus('Health check already in progress');
    }

    this.isChecking = true;
    this.rateLimiter.recordCheck();

    try {
      const startTime = Date.now();
      const healthStatus = await this.performHealthCheck();
      const responseTime = Date.now() - startTime;

      const status: HealthStatus = {
        ...healthStatus,
        responseTime,
        lastChecked: new Date(),
      };

      // Cache the result
      this.cache.set(status);

      // Log health status based on configuration
      this.logHealthStatus(status);

      return status;
    } catch (error) {
      const errorStatus = this.createUnhealthyStatus(
        error instanceof Error ? error.message : 'Unknown health check error'
      );
      this.cache.set(errorStatus);
      return errorStatus;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Get the last cached health check result
   */
  getLastHealthCheck(): HealthStatus | null {
    return this.cache.get();
  }

  /**
   * Get cached health status without triggering a new check
   */
  getCachedHealthStatus(): HealthStatus | null {
    return this.cache.get();
  }

  /**
   * Start scheduled health checks
   */
  scheduleHealthChecks(): void {
    if (!config.rakuten.monitoring.enableHealthChecks) {
      console.info('Health checks are disabled in configuration');
      return;
    }

    if (this.scheduledCheckInterval) {
      console.warn('Health checks are already scheduled');
      return;
    }

    const interval = config.rakuten.monitoring.healthCheckInterval;
    console.info(`Starting scheduled health checks every ${interval}ms`);

    this.scheduledCheckInterval = setInterval(async () => {
      try {
        await this.checkApiHealth();
      } catch (error) {
        console.error('Scheduled health check failed:', error);
      }
    }, interval);

    // Perform initial health check
    this.checkApiHealth().catch(error => {
      console.error('Initial health check failed:', error);
    });
  }

  /**
   * Stop scheduled health checks
   */
  stopHealthChecks(): void {
    if (this.scheduledCheckInterval) {
      clearInterval(this.scheduledCheckInterval);
      this.scheduledCheckInterval = null;
      console.info('Stopped scheduled health checks');
    }
  }

  /**
   * Perform the actual health check against Rakuten API
   */
  private async performHealthCheck(): Promise<Omit<HealthStatus, 'lastChecked' | 'responseTime'>> {
    // If no API key is configured, return healthy status for mock mode
    if (!config.rakuten.applicationId) {
      return {
        isHealthy: true,
        endpoint: 'mock-data',
        apiVersion: 'mock',
      };
    }

    try {
      // Test basic connectivity with a lightweight endpoint
      const testEndpoint = '/Recipe/CategoryList/20170426';
      const testUrl = `${config.rakuten.baseUrl}${testEndpoint}`;
      
      const searchParams = new URLSearchParams({
        applicationId: config.rakuten.applicationId,
        format: 'json',
        elements: 'categoryId,categoryName', // Minimal data to reduce response size
      });

      const response = await fetch(`${testUrl}?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `${config.app.name}/${config.app.version}`,
        },
        signal: AbortSignal.timeout(config.rakuten.timeout),
      });

      // Check response status
      if (!response.ok) {
        return this.handleApiError(response);
      }

      // Parse response to verify API is working correctly
      const data = await response.json();
      
      // Validate response structure
      if (!data.result || !Array.isArray(data.result.large)) {
        return {
          isHealthy: false,
          error: 'Invalid API response structure',
          endpoint: testEndpoint,
        };
      }

      // Extract rate limit information if available
      const rateLimitStatus = this.extractRateLimitInfo(response);

      return {
        isHealthy: true,
        endpoint: testEndpoint,
        apiVersion: '20170426',
        rateLimitStatus,
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            isHealthy: false,
            error: `API request timeout after ${config.rakuten.timeout}ms`,
          };
        }
        return {
          isHealthy: false,
          error: `Network error: ${error.message}`,
        };
      }
      return {
        isHealthy: false,
        error: 'Unknown error during health check',
      };
    }
  }

  /**
   * Handle API error responses
   */
  private async handleApiError(response: Response): Promise<Omit<HealthStatus, 'lastChecked' | 'responseTime'>> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorText = await response.text();
      if (errorText) {
        errorMessage += ` - ${errorText}`;
      }
    } catch {
      // Ignore error text parsing failures
    }

    // Specific handling for common error codes
    switch (response.status) {
      case 401:
        return {
          isHealthy: false,
          error: 'Authentication failed - Invalid API key',
        };
      case 429:
        return {
          isHealthy: false,
          error: 'Rate limit exceeded',
          rateLimitStatus: this.extractRateLimitInfo(response),
        };
      case 503:
        return {
          isHealthy: false,
          error: 'Service temporarily unavailable',
        };
      default:
        return {
          isHealthy: false,
          error: errorMessage,
        };
    }
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitInfo(response: Response): HealthStatus['rateLimitStatus'] {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining && reset) {
      return {
        remaining: parseInt(remaining, 10),
        resetTime: new Date(parseInt(reset, 10) * 1000),
      };
    }

    return undefined;
  }

  /**
   * Create an unhealthy status object
   */
  private createUnhealthyStatus(error: string): HealthStatus {
    return {
      isHealthy: false,
      lastChecked: new Date(),
      error,
    };
  }

  /**
   * Log health status based on configuration
   */
  private logHealthStatus(status: HealthStatus): void {
    const logLevel = config.rakuten.monitoring.logLevel;
    const message = `Rakuten API Health: ${status.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`;
    const details = {
      responseTime: status.responseTime,
      endpoint: status.endpoint,
      error: status.error,
      rateLimitRemaining: status.rateLimitStatus?.remaining,
    };

    if (!status.isHealthy) {
      if (logLevel === 'error' || logLevel === 'warn' || logLevel === 'info' || logLevel === 'debug') {
        console.error(message, details);
      }
    } else {
      if (logLevel === 'info' || logLevel === 'debug') {
        console.info(message, details);
      } else if (logLevel === 'debug') {
        console.debug(message, details);
      }
    }
  }
}

// Singleton instance
let healthMonitorInstance: RakutenHealthMonitor | null = null;

/**
 * Get the singleton health monitor instance
 */
export function getHealthMonitor(): ApiHealthMonitor {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new RakutenHealthMonitor();
  }
  return healthMonitorInstance;
}

/**
 * Initialize health monitoring system
 * Should be called during application startup
 */
export function initializeHealthMonitoring(): void {
  const monitor = getHealthMonitor();
  monitor.scheduleHealthChecks();
}

/**
 * Shutdown health monitoring system
 * Should be called during application shutdown
 */
export function shutdownHealthMonitoring(): void {
  if (healthMonitorInstance) {
    healthMonitorInstance.stopHealthChecks();
  }
}

/**
 * Utility function to check if API is currently healthy
 */
export async function isApiHealthy(): Promise<boolean> {
  const monitor = getHealthMonitor();
  const status = await monitor.checkApiHealth();
  return status.isHealthy;
}

/**
 * Utility function to get current health status
 */
export async function getCurrentHealthStatus(): Promise<HealthStatus> {
  const monitor = getHealthMonitor();
  return await monitor.checkApiHealth();
}

/**
 * Utility function to get cached health status without triggering new check
 */
export function getCachedHealthStatus(): HealthStatus | null {
  const monitor = getHealthMonitor();
  return monitor.getCachedHealthStatus();
}