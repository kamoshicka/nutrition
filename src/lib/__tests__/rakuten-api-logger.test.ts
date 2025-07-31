/**
 * Tests for Rakuten API Logger
 * 
 * This test suite verifies the comprehensive logging functionality for API operations,
 * including structured logging, production-safe sensitive data handling, and 
 * development-friendly indicators for mock vs real data usage.
 */

// Mock the logger dependency
jest.mock('../../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}));

// Mock the config dependency
jest.mock('../config', () => ({
  config: {
    app: {
      environment: 'test',
    },
    rakuten: {
      monitoring: {
        logLevel: 'info',
      },
    },
  },
}));

import { 
  RakutenApiLogger,
  rakutenApiLogger,
  logApiKeyValidation,
  logApiRequest,
  logApiHealth,
  logConfiguration,
  logDataSourceUsage,
  logApiUsageStats,
  createTimer,
  logStartupSummary,
  type ApiKeyValidationLogEntry,
  type ApiRequestLogEntry,
  type ApiHealthLogEntry
} from '../rakuten-api-logger';

import { logger } from '../../../lib/logger';
import { config } from '../config';

describe('RakutenApiLogger', () => {
  const mockLogger = logger as jest.Mocked<typeof logger>;
  const mockConfig = config as jest.Mocked<typeof config>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment for each test
    mockConfig.app.environment = 'test';
  });

  describe('API Key Validation Logging', () => {
    it('should log successful API key validation in development', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiKeyValidationLogEntry = {
        validationType: 'format',
        isValid: true,
        hasApiKey: true,
        environment: 'development',
        responseTime: 150,
      };

      logApiKeyValidation(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('✅ API Key Validation: format - Valid'),
        expect.objectContaining({
          validationType: 'format',
          environment: 'development',
          hasApiKey: true,
          dataSource: 'real_api',
          responseTime: 150,
        })
      );

      // Should also log structured data
      expect(mockLogger.info).toHaveBeenCalledWith(
        'rakuten_api_operation',
        expect.objectContaining({
          operation: 'api_key_validation',
          operationType: 'validation',
          success: true,
        })
      );
    });

    it('should log failed API key validation in development', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiKeyValidationLogEntry = {
        validationType: 'connection',
        isValid: false,
        hasApiKey: true,
        environment: 'development',
        responseTime: 5000,
        error: 'Connection timeout',
      };

      logApiKeyValidation(entry);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('❌ API Key Validation: connection - Failed'),
        expect.objectContaining({
          validationType: 'connection',
          error: 'Connection timeout',
          responseTime: 5000,
        })
      );
    });

    it('should log API key validation in production without sensitive details', () => {
      mockConfig.app.environment = 'production';
      
      const entry: ApiKeyValidationLogEntry = {
        validationType: 'startup',
        isValid: false,
        hasApiKey: true,
        environment: 'production',
        error: 'Invalid API key format: sk_test_1234567890abcdef',
      };

      logApiKeyValidation(entry);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'API key validation failed',
        expect.objectContaining({
          validationType: 'startup',
          environment: 'production',
          hasApiKey: true,
          // Error should be sanitized
          error: expect.not.stringContaining('sk_test_1234567890abcdef'),
        })
      );
    });

    it('should handle missing API key scenario', () => {
      const entry: ApiKeyValidationLogEntry = {
        validationType: 'format',
        isValid: false,
        hasApiKey: false,
        environment: 'development',
        responseTime: 1,
        error: 'API key not provided',
      };

      logApiKeyValidation(entry);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('❌ API Key Validation: format - Failed'),
        expect.objectContaining({
          dataSource: 'mock_data',
          hasApiKey: false,
        })
      );
    });
  });

  describe('API Request Logging', () => {
    it('should log successful API request in development', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiRequestLogEntry = {
        endpoint: '/Recipe/CategoryList/20170426',
        method: 'GET',
        dataSource: 'real_api',
        success: true,
        statusCode: 200,
        responseTime: 250,
        rateLimitRemaining: 95,
      };

      logApiRequest(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('🌐 API Request: GET /Recipe/CategoryList/20170426 - 250ms'),
        expect.objectContaining({
          endpoint: '/Recipe/CategoryList/20170426',
          method: 'GET',
          statusCode: 200,
          rateLimitRemaining: 95,
          dataSource: 'real_api',
        })
      );
    });

    it('should log mock data usage with appropriate icon', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiRequestLogEntry = {
        endpoint: '/Recipe/CategoryList/20170426',
        method: 'GET',
        dataSource: 'mock_data',
        success: true,
        responseTime: 5,
        fallbackReason: 'API key not configured',
      };

      logApiRequest(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('🎭 API Request: GET /Recipe/CategoryList/20170426 - 5ms'),
        expect.objectContaining({
          dataSource: 'mock_data',
          fallbackReason: 'API key not configured',
        })
      );
    });

    it('should log cached data usage', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiRequestLogEntry = {
        endpoint: '/Recipe/CategoryList/20170426',
        method: 'GET',
        dataSource: 'cache',
        success: true,
        responseTime: 2,
      };

      logApiRequest(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('💾 API Request: GET /Recipe/CategoryList/20170426 - 2ms'),
        expect.objectContaining({
          dataSource: 'cache',
        })
      );
    });

    it('should log failed API request', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiRequestLogEntry = {
        endpoint: '/Recipe/CategoryList/20170426',
        method: 'GET',
        dataSource: 'real_api',
        success: false,
        statusCode: 429,
        responseTime: 1000,
        error: 'Rate limit exceeded',
        fallbackReason: 'RATE_LIMIT: Too many requests',
      };

      logApiRequest(entry);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ API Request Failed: GET /Recipe/CategoryList/20170426'),
        expect.objectContaining({
          statusCode: 429,
          error: 'Rate limit exceeded',
          fallbackReason: 'RATE_LIMIT: Too many requests',
        })
      );
    });

    it('should sanitize sensitive information in production', () => {
      mockConfig.app.environment = 'production';
      
      const entry: ApiRequestLogEntry = {
        endpoint: '/Recipe/CategoryList/20170426',
        method: 'GET',
        dataSource: 'real_api',
        success: false,
        responseTime: 1000,
        error: 'Authentication failed: applicationId=sk_test_1234567890abcdef is invalid',
      };

      logApiRequest(entry);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'API request failed',
        expect.objectContaining({
          error: expect.not.stringContaining('sk_test_1234567890abcdef'),
        })
      );
    });
  });

  describe('API Health Logging', () => {
    it('should log healthy API status', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiHealthLogEntry = {
        healthStatus: 'healthy',
        responseTime: 180,
        endpoint: '/Recipe/CategoryList/20170426',
        rateLimitStatus: {
          remaining: 98,
          resetTime: new Date('2024-01-01T12:00:00Z'),
        },
      };

      logApiHealth(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('💚 API Health Check: Healthy - 180ms'),
        expect.objectContaining({
          healthStatus: 'healthy',
          endpoint: '/Recipe/CategoryList/20170426',
          responseTime: 180,
        })
      );
    });

    it('should log unhealthy API status', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiHealthLogEntry = {
        healthStatus: 'unhealthy',
        error: 'Connection timeout',
      };

      logApiHealth(entry);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('💔 API Health Check: unhealthy'),
        expect.objectContaining({
          healthStatus: 'unhealthy',
          error: 'Connection timeout',
        })
      );
    });
  });

  describe('Configuration Logging', () => {
    it('should log successful configuration operations', () => {
      mockConfig.app.environment = 'development';
      
      logConfiguration('startup', true, { environment: 'development' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('⚙️ Configuration: startup - Success'),
        expect.objectContaining({
          operation: 'startup',
          environment: 'development',
        })
      );
    });

    it('should log failed configuration operations', () => {
      mockConfig.app.environment = 'development';
      
      logConfiguration('validation', false, { apiKey: 'present' }, 'Invalid format');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('⚙️ Configuration: validation - Failed'),
        expect.objectContaining({
          operation: 'validation',
          apiKey: 'present',
          error: 'Invalid format',
        })
      );
    });
  });

  describe('Data Source Usage Logging', () => {
    it('should log data source usage in development only', () => {
      mockConfig.app.environment = 'development';
      
      logDataSourceUsage('searchRecipes', 'mock_data', 'API key not configured');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('🎭 Data Source: searchRecipes using mock_data (API key not configured)'),
        expect.objectContaining({
          operation: 'searchRecipes',
          dataSource: 'mock_data',
          reason: 'API key not configured',
          type: 'data_source_usage',
        })
      );
    });

    it('should not log data source usage in production', () => {
      mockConfig.app.environment = 'production';
      
      logDataSourceUsage('searchRecipes', 'real_api', 'Using configured API key');

      // Should not log anything in production
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Data Source:'),
        expect.any(Object)
      );
    });

    it('should use correct icons for different data sources', () => {
      mockConfig.app.environment = 'development';
      
      // Test real API icon
      logDataSourceUsage('test', 'real_api');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('🌐 Data Source:'),
        expect.any(Object)
      );

      // Test cache icon
      logDataSourceUsage('test', 'cache');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('💾 Data Source:'),
        expect.any(Object)
      );
    });
  });

  describe('API Usage Statistics Logging', () => {
    it('should log usage statistics with calculated rates', () => {
      const stats = {
        totalRequests: 100,
        successfulRequests: 85,
        failedRequests: 15,
        mockDataUsage: 30,
        averageResponseTime: 250,
        rateLimitHits: 5,
      };

      logApiUsageStats(stats);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'rakuten_api_usage_stats',
        expect.objectContaining({
          ...stats,
          successRate: 85.0,
          mockUsageRate: 30.0,
          type: 'api_usage_stats',
        })
      );
    });

    it('should handle zero requests gracefully', () => {
      const stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        mockDataUsage: 0,
        averageResponseTime: 0,
        rateLimitHits: 0,
      };

      logApiUsageStats(stats);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'rakuten_api_usage_stats',
        expect.objectContaining({
          successRate: 0,
          mockUsageRate: 0,
        })
      );
    });

    it('should log development-friendly summary', () => {
      mockConfig.app.environment = 'development';
      
      const stats = {
        totalRequests: 50,
        successfulRequests: 40,
        failedRequests: 10,
        mockDataUsage: 20,
        averageResponseTime: 300,
        rateLimitHits: 2,
      };

      logApiUsageStats(stats);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('📊 API Usage Stats: 50 requests, 80.00% success, 40.00% mock data'),
        expect.objectContaining({
          ...stats,
          successRate: 80.0,
          mockUsageRate: 40.0,
        })
      );
    });
  });

  describe('Timer Functionality', () => {
    it('should create a working timer', () => {
      const timer = createTimer();
      
      // Wait a small amount of time
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Small delay
      }
      
      const duration = timer.end();
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(typeof duration).toBe('number');
    });
  });

  describe('Startup Summary Logging', () => {
    it('should log comprehensive startup summary in development', () => {
      mockConfig.app.environment = 'development';
      
      const startupConfig = {
        hasApiKey: true,
        isValidApiKey: true,
        useMockData: false,
        environment: 'development',
        healthChecksEnabled: true,
        logLevel: 'info' as const,
      };

      logStartupSummary(startupConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Rakuten API Startup Summary:'),
        expect.objectContaining({
          apiKeyStatus: expect.stringContaining('✅ Valid'),
          dataSource: expect.stringContaining('🌐 Real API'),
          environment: 'development',
          healthChecks: 'Enabled',
          logLevel: 'info',
        })
      );
    });

    it('should log startup summary for missing API key', () => {
      mockConfig.app.environment = 'development';
      
      const startupConfig = {
        hasApiKey: false,
        isValidApiKey: false,
        useMockData: true,
        environment: 'development',
        healthChecksEnabled: false,
        logLevel: 'warn' as const,
      };

      logStartupSummary(startupConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Rakuten API Startup Summary:'),
        expect.objectContaining({
          apiKeyStatus: expect.stringContaining('⚠️ Not configured'),
          dataSource: expect.stringContaining('🎭 Mock data'),
        })
      );
    });

    it('should log production-safe startup summary', () => {
      mockConfig.app.environment = 'production';
      
      const startupConfig = {
        hasApiKey: true,
        isValidApiKey: false,
        useMockData: true,
        environment: 'production',
        healthChecksEnabled: true,
        logLevel: 'error' as const,
      };

      logStartupSummary(startupConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Rakuten API initialized',
        expect.objectContaining({
          hasApiKey: true,
          isValidApiKey: false,
          useMockData: true,
          environment: 'production',
          type: 'startup_summary',
        })
      );
    });
  });

  describe('Error Sanitization', () => {
    it('should sanitize API keys in production', () => {
      mockConfig.app.environment = 'production';
      const logger = new RakutenApiLogger();
      
      const entry: ApiRequestLogEntry = {
        endpoint: '/test',
        method: 'GET',
        dataSource: 'real_api',
        success: false,
        responseTime: 100,
        error: 'Failed with applicationId=sk_test_1234567890abcdef and api_key=secret123',
      };

      logApiRequest(entry);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'API request failed',
        expect.objectContaining({
          error: expect.stringMatching(/applicationId=\*\*\*/),
        })
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'API request failed',
        expect.objectContaining({
          error: expect.stringMatching(/api_key=\*\*\*/),
        })
      );
    });

    it('should not sanitize errors in development', () => {
      mockConfig.app.environment = 'development';
      
      const entry: ApiRequestLogEntry = {
        endpoint: '/test',
        method: 'GET',
        dataSource: 'real_api',
        success: false,
        responseTime: 100,
        error: 'Failed with applicationId=sk_test_1234567890abcdef',
      };

      logApiRequest(entry);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ API Request Failed'),
        expect.objectContaining({
          error: 'Failed with applicationId=sk_test_1234567890abcdef',
        })
      );
    });
  });

  describe('Singleton Instance', () => {
    it('should provide a singleton instance', () => {
      expect(rakutenApiLogger).toBeInstanceOf(RakutenApiLogger);
      expect(rakutenApiLogger).toBe(rakutenApiLogger); // Same instance
    });

    it('should provide convenience functions', () => {
      expect(typeof logApiKeyValidation).toBe('function');
      expect(typeof logApiRequest).toBe('function');
      expect(typeof logApiHealth).toBe('function');
      expect(typeof logConfiguration).toBe('function');
      expect(typeof logDataSourceUsage).toBe('function');
      expect(typeof logApiUsageStats).toBe('function');
      expect(typeof createTimer).toBe('function');
      expect(typeof logStartupSummary).toBe('function');
    });
  });
});