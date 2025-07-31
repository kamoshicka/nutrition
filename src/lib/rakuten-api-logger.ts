/**
 * Rakuten API Operations Logger
 * 
 * Provides comprehensive, structured logging for all Rakuten API operations
 * with production-safe handling of sensitive information and development-friendly
 * indicators for mock vs real data usage.
 */

import { logger } from '../../lib/logger';
import { config } from './config';

// Log entry types for structured logging
export interface ApiOperationLogEntry {
  operation: string;
  operationType: 'validation' | 'request' | 'health_check' | 'configuration';
  dataSource: 'real_api' | 'mock_data' | 'cache';
  success: boolean;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ApiKeyValidationLogEntry {
  validationType: 'format' | 'connection' | 'startup';
  isValid: boolean;
  hasApiKey: boolean;
  environment: string;
  error?: string;
  responseTime?: number;
}

export interface ApiRequestLogEntry {
  endpoint: string;
  method: string;
  dataSource: 'real_api' | 'mock_data' | 'cache';
  success: boolean;
  statusCode?: number;
  responseTime: number;
  rateLimitRemaining?: number;
  fallbackReason?: string;
  error?: string;
}

export interface ApiHealthLogEntry {
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  endpoint?: string;
  error?: string;
  rateLimitStatus?: {
    remaining: number;
    resetTime: Date;
  };
}

/**
 * Rakuten API Logger Class
 * Provides structured logging with production-safe sensitive data handling
 */
export class RakutenApiLogger {
  private _isProduction?: boolean;
  private _isDevelopment?: boolean;
  private _logLevel?: string;

  private get isProduction(): boolean {
    if (this._isProduction === undefined) {
      this._isProduction = config.app.environment === 'production';
    }
    return this._isProduction;
  }

  private get isDevelopment(): boolean {
    if (this._isDevelopment === undefined) {
      this._isDevelopment = config.app.environment === 'development';
    }
    return this._isDevelopment;
  }

  private get logLevel(): string {
    if (this._logLevel === undefined) {
      this._logLevel = config.rakuten.monitoring.logLevel;
    }
    return this._logLevel;
  }

  /**
   * Log API key validation operations
   */
  logApiKeyValidation(entry: ApiKeyValidationLogEntry): void {
    const logData: ApiOperationLogEntry = {
      operation: 'api_key_validation',
      operationType: 'validation',
      dataSource: entry.hasApiKey ? 'real_api' : 'mock_data',
      success: entry.isValid,
      duration: entry.responseTime,
      error: entry.error,
      metadata: {
        validationType: entry.validationType,
        environment: entry.environment,
        hasApiKey: entry.hasApiKey,
        // Never log the actual API key
        apiKeyConfigured: entry.hasApiKey,
      },
    };

    if (entry.isValid) {
      if (this.isDevelopment) {
        logger.info(`✅ API Key Validation: ${entry.validationType} - Valid`, {
          ...logData.metadata,
          dataSource: logData.dataSource,
          responseTime: entry.responseTime,
        });
      } else {
        logger.info('API key validation successful', logData.metadata);
      }
    } else {
      if (this.isDevelopment) {
        logger.warn(`❌ API Key Validation: ${entry.validationType} - Failed`, {
          ...logData.metadata,
          error: entry.error,
          responseTime: entry.responseTime,
        });
      } else {
        logger.warn('API key validation failed', {
          ...logData.metadata,
          error: this.sanitizeError(entry.error),
        });
      }
    }

    // Log structured data for monitoring
    logger.info('rakuten_api_operation', logData);
  }

  /**
   * Log API request operations
   */
  logApiRequest(entry: ApiRequestLogEntry): void {
    const logData: ApiOperationLogEntry = {
      operation: 'api_request',
      operationType: 'request',
      dataSource: entry.dataSource,
      success: entry.success,
      duration: entry.responseTime,
      error: entry.error,
      metadata: {
        endpoint: entry.endpoint,
        method: entry.method,
        statusCode: entry.statusCode,
        rateLimitRemaining: entry.rateLimitRemaining,
        fallbackReason: entry.fallbackReason,
      },
    };

    if (entry.success) {
      if (this.isDevelopment) {
        const dataSourceIcon = entry.dataSource === 'real_api' ? '🌐' : 
                              entry.dataSource === 'mock_data' ? '🎭' : '💾';
        logger.info(`${dataSourceIcon} API Request: ${entry.method} ${entry.endpoint} - ${entry.responseTime}ms`, {
          ...logData.metadata,
          dataSource: entry.dataSource,
        });
      } else {
        logger.info('API request successful', logData.metadata);
      }
    } else {
      if (this.isDevelopment) {
        logger.error(`❌ API Request Failed: ${entry.method} ${entry.endpoint}`, {
          ...logData.metadata,
          error: entry.error,
          fallbackReason: entry.fallbackReason,
        });
      } else {
        logger.error('API request failed', {
          ...logData.metadata,
          error: this.sanitizeError(entry.error),
        });
      }
    }

    // Log structured data for monitoring
    logger.info('rakuten_api_operation', logData);
  }

  /**
   * Log API health check operations
   */
  logApiHealth(entry: ApiHealthLogEntry): void {
    const logData: ApiOperationLogEntry = {
      operation: 'health_check',
      operationType: 'health_check',
      dataSource: entry.healthStatus === 'healthy' ? 'real_api' : 'mock_data',
      success: entry.healthStatus === 'healthy',
      duration: entry.responseTime,
      error: entry.error,
      metadata: {
        healthStatus: entry.healthStatus,
        endpoint: entry.endpoint,
        rateLimitStatus: entry.rateLimitStatus,
      },
    };

    if (entry.healthStatus === 'healthy') {
      if (this.isDevelopment) {
        logger.info(`💚 API Health Check: Healthy - ${entry.responseTime}ms`, {
          ...logData.metadata,
          responseTime: entry.responseTime,
        });
      } else {
        logger.info('API health check successful', logData.metadata);
      }
    } else {
      if (this.isDevelopment) {
        logger.warn(`💔 API Health Check: ${entry.healthStatus}`, {
          ...logData.metadata,
          error: entry.error,
        });
      } else {
        logger.warn('API health check failed', {
          ...logData.metadata,
          error: this.sanitizeError(entry.error),
        });
      }
    }

    // Log structured data for monitoring
    logger.info('rakuten_api_operation', logData);
  }

  /**
   * Log configuration operations
   */
  logConfiguration(operation: string, success: boolean, metadata?: Record<string, any>, error?: string): void {
    const logData: ApiOperationLogEntry = {
      operation: `configuration_${operation}`,
      operationType: 'configuration',
      dataSource: success ? 'real_api' : 'mock_data',
      success,
      error,
      metadata: {
        operation,
        ...metadata,
      },
    };

    if (success) {
      if (this.isDevelopment) {
        logger.info(`⚙️ Configuration: ${operation} - Success`, logData.metadata);
      } else {
        logger.info(`Configuration ${operation} successful`, logData.metadata);
      }
    } else {
      if (this.isDevelopment) {
        logger.error(`⚙️ Configuration: ${operation} - Failed`, {
          ...logData.metadata,
          error,
        });
      } else {
        logger.error(`Configuration ${operation} failed`, {
          ...logData.metadata,
          error: this.sanitizeError(error),
        });
      }
    }

    // Log structured data for monitoring
    logger.info('rakuten_api_operation', logData);
  }

  /**
   * Log data source usage for development visibility
   */
  logDataSourceUsage(operation: string, dataSource: 'real_api' | 'mock_data' | 'cache', reason?: string): void {
    if (!this.isDevelopment) return; // Only log in development

    const icon = dataSource === 'real_api' ? '🌐' : 
                 dataSource === 'mock_data' ? '🎭' : '💾';
    
    let message = `${icon} Data Source: ${operation} using ${dataSource}`;
    if (reason) {
      message += ` (${reason})`;
    }

    logger.info(message, {
      operation,
      dataSource,
      reason,
      type: 'data_source_usage',
    });
  }

  /**
   * Log API usage statistics for monitoring
   */
  logApiUsageStats(stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    mockDataUsage: number;
    averageResponseTime: number;
    rateLimitHits: number;
  }): void {
    const successRate = stats.totalRequests > 0 ? 
      (stats.successfulRequests / stats.totalRequests * 100).toFixed(2) : '0';
    
    const mockUsageRate = stats.totalRequests > 0 ? 
      (stats.mockDataUsage / stats.totalRequests * 100).toFixed(2) : '0';

    if (this.isDevelopment) {
      logger.info(`📊 API Usage Stats: ${stats.totalRequests} requests, ${successRate}% success, ${mockUsageRate}% mock data`, {
        ...stats,
        successRate: parseFloat(successRate),
        mockUsageRate: parseFloat(mockUsageRate),
      });
    }

    // Always log structured stats for monitoring
    logger.info('rakuten_api_usage_stats', {
      ...stats,
      successRate: parseFloat(successRate),
      mockUsageRate: parseFloat(mockUsageRate),
      type: 'api_usage_stats',
    });
  }

  /**
   * Sanitize error messages for production logging
   * Removes sensitive information while keeping useful debugging info
   */
  private sanitizeError(error?: string): string | undefined {
    if (!error) return undefined;
    
    if (this.isProduction) {
      // In production, sanitize sensitive information
      return error
        .replace(/applicationId=[^&\s]+/gi, 'applicationId=***')
        .replace(/api[_-]?key[^&\s]*=[^&\s]+/gi, 'api_key=***')
        .replace(/token[^&\s]*=[^&\s]+/gi, 'token=***')
        .replace(/authorization:\s*[^\s]+/gi, 'authorization: ***');
    }
    
    return error;
  }

  /**
   * Create a performance timer for measuring operation duration
   */
  createTimer(): { end: () => number } {
    const start = Date.now();
    return {
      end: () => Date.now() - start,
    };
  }

  /**
   * Log startup configuration summary
   */
  logStartupSummary(config: {
    hasApiKey: boolean;
    isValidApiKey: boolean;
    useMockData: boolean;
    environment: string;
    healthChecksEnabled: boolean;
    logLevel: string;
  }): void {
    const dataSource = config.useMockData ? 'mock_data' : 'real_api';
    
    if (this.isDevelopment) {
      const apiIcon = config.hasApiKey ? (config.isValidApiKey ? '✅' : '❌') : '⚠️';
      const dataIcon = config.useMockData ? '🎭' : '🌐';
      
      logger.info(`🚀 Rakuten API Startup Summary:`, {
        apiKeyStatus: `${apiIcon} ${config.hasApiKey ? (config.isValidApiKey ? 'Valid' : 'Invalid') : 'Not configured'}`,
        dataSource: `${dataIcon} ${config.useMockData ? 'Mock data' : 'Real API'}`,
        environment: config.environment,
        healthChecks: config.healthChecksEnabled ? 'Enabled' : 'Disabled',
        logLevel: config.logLevel,
      });
    } else {
      logger.info('Rakuten API initialized', {
        hasApiKey: config.hasApiKey,
        isValidApiKey: config.isValidApiKey,
        useMockData: config.useMockData,
        environment: config.environment,
        healthChecksEnabled: config.healthChecksEnabled,
        type: 'startup_summary',
      });
    }

    this.logConfiguration('startup', true, {
      dataSource,
      environment: config.environment,
      healthChecksEnabled: config.healthChecksEnabled,
    });
  }
}

// Create singleton instance
export const rakutenApiLogger = new RakutenApiLogger();

// Convenience functions for common logging operations
export const logApiKeyValidation = (entry: ApiKeyValidationLogEntry) => 
  rakutenApiLogger.logApiKeyValidation(entry);

export const logApiRequest = (entry: ApiRequestLogEntry) => 
  rakutenApiLogger.logApiRequest(entry);

export const logApiHealth = (entry: ApiHealthLogEntry) => 
  rakutenApiLogger.logApiHealth(entry);

export const logConfiguration = (operation: string, success: boolean, metadata?: Record<string, any>, error?: string) => 
  rakutenApiLogger.logConfiguration(operation, success, metadata, error);

export const logDataSourceUsage = (operation: string, dataSource: 'real_api' | 'mock_data' | 'cache', reason?: string) => 
  rakutenApiLogger.logDataSourceUsage(operation, dataSource, reason);

export const logApiUsageStats = (stats: Parameters<typeof rakutenApiLogger.logApiUsageStats>[0]) => 
  rakutenApiLogger.logApiUsageStats(stats);

export const createTimer = () => rakutenApiLogger.createTimer();

export const logStartupSummary = (config: Parameters<typeof rakutenApiLogger.logStartupSummary>[0]) => 
  rakutenApiLogger.logStartupSummary(config);