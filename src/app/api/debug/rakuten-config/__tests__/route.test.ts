/**
 * Tests for Rakuten API configuration debug endpoint
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, HEAD } from '../route';

// Mock the dependencies
jest.mock('../../../../../lib/config', () => ({
  config: {
    rakuten: {
      applicationId: 'test12345678901234567890',
      baseUrl: 'https://app.rakuten.co.jp/services/api',
      timeout: 10000,
      validation: {
        isConfigured: true,
        isValid: true,
        lastValidated: null,
      },
      rateLimit: {
        requestsPerSecond: 5,
        requestsPerDay: 10000,
        burstLimit: 10,
      },
      monitoring: {
        enableHealthChecks: true,
        healthCheckInterval: 300000,
        logLevel: 'info',
      },
    },
    app: {
      name: 'Test App',
      version: '1.0.0',
      environment: 'development',
      baseUrl: 'http://localhost:3000',
    },
    features: {
      useMockRecipes: false,
    },
  },
  validateConfig: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
  })),
  getEnvironmentSpecificConfig: jest.fn(() => ({
    environment: 'development',
    isProduction: false,
    isStaging: false,
    isDevelopment: true,
  })),
}));

jest.mock('../../../../../lib/rakuten-api-validator', () => ({
  apiKeyValidator: {
    validateConnection: jest.fn(),
  },
  getRakutenSetupInstructions: jest.fn(() => ({
    environment: 'development',
    steps: ['Step 1', 'Step 2'],
    environmentVariables: {
      'RAKUTEN_APPLICATION_ID': 'your_api_key_here',
    },
    troubleshooting: ['Troubleshooting tip 1'],
    links: [
      { title: 'Rakuten Portal', url: 'https://webservice.rakuten.co.jp/' },
    ],
  })),
}));

jest.mock('../../../../../lib/rakuten-health-monitor', () => ({
  getCachedHealthStatus: jest.fn(() => ({
    isHealthy: true,
    lastChecked: new Date('2023-01-01T00:00:00Z'),
    responseTime: 150,
    endpoint: '/test',
  })),
  getCurrentHealthStatus: jest.fn(() => Promise.resolve({
    isHealthy: true,
    lastChecked: new Date('2023-01-01T00:00:00Z'),
    responseTime: 150,
    endpoint: '/test',
  })),
}));

// Mock console methods to avoid noise in tests
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  info: jest.spyOn(console, 'info').mockImplementation(() => {}),
};

describe('/api/debug/rakuten-config', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/debug/rakuten-config');
    jest.clearAllMocks();
    
    // Reset mocks to default values
    const { getEnvironmentSpecificConfig, config, validateConfig } = require('../../../../../lib/config');
    getEnvironmentSpecificConfig.mockReturnValue({
      environment: 'development',
      isProduction: false,
      isStaging: false,
      isDevelopment: true,
    });
    
    config.rakuten.applicationId = 'test12345678901234567890';
    config.rakuten.validation.isConfigured = true;
    config.rakuten.validation.isValid = true;
    config.features.useMockRecipes = false;
    config.rakuten.monitoring.enableHealthChecks = true;
    
    validateConfig.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    });
  });

  afterAll(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('GET endpoint', () => {
    it('should return comprehensive configuration status in development', async () => {
      const { apiKeyValidator } = require('../../../../../lib/rakuten-api-validator');
      apiKeyValidator.validateConnection.mockResolvedValue({
        isValid: true,
        details: { responseTime: 200 },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('environment', 'development');
      expect(data).toHaveProperty('configuration');
      expect(data).toHaveProperty('health');
      expect(data).toHaveProperty('setup');
      expect(data).toHaveProperty('system');

      // Check configuration section
      expect(data.configuration.apiKey).toEqual({
        configured: true,
        formatValid: true,
        connectionValid: true,
        responseTime: 200,
      });

      expect(data.configuration.environment).toEqual({
        nodeEnv: 'test',
        detectedEnv: 'development',
        useMockData: false,
        healthChecksEnabled: true,
      });

      // Check health section
      expect(data.health.current).toBeDefined();
      expect(data.health.cached).toBeDefined();

      // Check setup section
      expect(data.setup.instructions).toBeDefined();
      expect(data.setup.missingVariables).toEqual([]);
      expect(data.setup.recommendedActions).toEqual([]);
    });

    it('should return 403 in production environment', async () => {
      const { getEnvironmentSpecificConfig } = require('../../../../../lib/config');
      getEnvironmentSpecificConfig.mockReturnValue({
        environment: 'production',
        isProduction: true,
        isStaging: false,
        isDevelopment: false,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('not available in production');
    });

    it('should handle missing API key configuration', async () => {
      const { config } = require('../../../../../lib/config');
      config.rakuten.applicationId = undefined;
      config.rakuten.validation.isConfigured = false;
      config.rakuten.validation.isValid = false;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configuration.apiKey.configured).toBe(false);
      expect(data.configuration.apiKey.formatValid).toBe(false);
      expect(data.setup.missingVariables).toContain('RAKUTEN_APPLICATION_ID');
      expect(data.setup.recommendedActions).toContain('Set up Rakuten API key to enable real recipe data');
    });

    it('should handle API key connection validation failure', async () => {
      const { apiKeyValidator } = require('../../../../../lib/rakuten-api-validator');
      apiKeyValidator.validateConnection.mockResolvedValue({
        isValid: false,
        error: 'Invalid API key',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.configuration.apiKey.connectionValid).toBe(false);
      expect(data.configuration.apiKey.connectionError).toBe('Invalid API key');
    });

    it('should handle configuration validation errors', async () => {
      const { validateConfig } = require('../../../../../lib/config');
      validateConfig.mockReturnValue({
        isValid: false,
        errors: ['API key format invalid'],
        warnings: ['Rate limit high'],
        recommendations: ['Use mock data in development'],
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.configuration.validation.isValid).toBe(false);
      expect(data.configuration.validation.errors).toContain('API key format invalid');
      expect(data.configuration.validation.warnings).toContain('Rate limit high');
      expect(data.configuration.validation.recommendations).toContain('Use mock data in development');
    });

    it('should handle API key validation connection errors', async () => {
      const { apiKeyValidator } = require('../../../../../lib/rakuten-api-validator');
      apiKeyValidator.validateConnection.mockRejectedValue(new Error('Network error'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503); // Service unavailable due to connection error
      expect(data.configuration.apiKey.connectionValid).toBe(false);
      expect(data.configuration.apiKey.connectionError).toBe('Network error');
    });

    it('should handle health check failures gracefully', async () => {
      const { getCurrentHealthStatus, apiKeyValidator } = require('../../../../../lib/rakuten-health-monitor');
      const { apiKeyValidator: validator } = require('../../../../../lib/rakuten-api-validator');
      
      // Mock successful API key validation to avoid 503 status
      validator.validateConnection.mockResolvedValue({
        isValid: true,
        details: { responseTime: 200 },
      });
      
      getCurrentHealthStatus.mockRejectedValue(new Error('Health check failed'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.health.current).toBeUndefined();
      expect(data.health.cached).toBeDefined(); // Should still have cached data
    });

    it('should provide staging environment recommendations', async () => {
      const { getEnvironmentSpecificConfig, config } = require('../../../../../lib/config');
      const { apiKeyValidator } = require('../../../../../lib/rakuten-api-validator');
      
      getEnvironmentSpecificConfig.mockReturnValue({
        environment: 'staging',
        isProduction: false,
        isStaging: true,
        isDevelopment: false,
      });
      config.features.useMockRecipes = true;
      
      // Mock successful API key validation to avoid 503 status
      apiKeyValidator.validateConnection.mockResolvedValue({
        isValid: true,
        details: { responseTime: 200 },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.setup.recommendedActions).toContain(
        'Consider setting USE_MOCK_RECIPES=false for staging environment testing'
      );
    });

    it('should recommend enabling health checks in non-development environments', async () => {
      const { getEnvironmentSpecificConfig, config } = require('../../../../../lib/config');
      const { apiKeyValidator } = require('../../../../../lib/rakuten-api-validator');
      
      getEnvironmentSpecificConfig.mockReturnValue({
        environment: 'staging',
        isProduction: false,
        isStaging: true,
        isDevelopment: false,
      });
      config.rakuten.monitoring.enableHealthChecks = false;
      
      // Mock successful API key validation to avoid 503 status
      apiKeyValidator.validateConnection.mockResolvedValue({
        isValid: true,
        details: { responseTime: 200 },
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.setup.recommendedActions).toContain(
        'Enable health checks with RAKUTEN_ENABLE_HEALTH_CHECKS=true'
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      const { validateConfig } = require('../../../../../lib/config');
      validateConfig.mockImplementation(() => {
        throw new Error('Unexpected validation error');
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Configuration debug check failed');
      expect(data.message).toBe('Unexpected validation error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include proper cache control headers', async () => {
      const response = await GET(mockRequest);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('HEAD endpoint', () => {
    it('should return 200 for valid configuration in development', async () => {
      const response = await HEAD(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('should return 403 in production environment', async () => {
      const { getEnvironmentSpecificConfig } = require('../../../../../lib/config');
      getEnvironmentSpecificConfig.mockReturnValue({
        environment: 'production',
        isProduction: true,
        isStaging: false,
        isDevelopment: false,
      });

      const response = await HEAD(mockRequest);

      expect(response.status).toBe(403);
      expect(response.body).toBeNull();
    });

    it('should return 422 for invalid configuration', async () => {
      const { validateConfig } = require('../../../../../lib/config');
      validateConfig.mockReturnValue({
        isValid: false,
        errors: ['Configuration error'],
        warnings: [],
        recommendations: [],
      });

      const response = await HEAD(mockRequest);

      expect(response.status).toBe(422);
      expect(response.body).toBeNull();
    });

    it('should return 500 for unexpected errors', async () => {
      const { validateConfig } = require('../../../../../lib/config');
      validateConfig.mockImplementation(() => {
        throw new Error('Validation error');
      });

      const response = await HEAD(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toBeNull();
    });
  });

  describe('Response structure validation', () => {
    it('should have all required response fields', async () => {
      const { apiKeyValidator } = require('../../../../../lib/rakuten-api-validator');
      const { getCurrentHealthStatus } = require('../../../../../lib/rakuten-health-monitor');
      
      apiKeyValidator.validateConnection.mockResolvedValue({
        isValid: true,
        details: { responseTime: 200 },
      });
      
      // Ensure getCurrentHealthStatus returns a proper value
      getCurrentHealthStatus.mockResolvedValue({
        isHealthy: true,
        lastChecked: new Date('2023-01-01T00:00:00Z'),
        responseTime: 150,
        endpoint: '/test',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      // Validate top-level structure
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('configuration');
      expect(data).toHaveProperty('health');
      expect(data).toHaveProperty('setup');
      expect(data).toHaveProperty('system');

      // Validate configuration structure
      expect(data.configuration).toHaveProperty('apiKey');
      expect(data.configuration).toHaveProperty('environment');
      expect(data.configuration).toHaveProperty('validation');
      expect(data.configuration).toHaveProperty('rateLimit');
      expect(data.configuration).toHaveProperty('monitoring');

      // Validate health structure
      expect(data.health).toHaveProperty('current');
      expect(data.health).toHaveProperty('cached');

      // Validate setup structure
      expect(data.setup).toHaveProperty('instructions');
      expect(data.setup).toHaveProperty('missingVariables');
      expect(data.setup).toHaveProperty('recommendedActions');

      // Validate system structure
      expect(data.system).toHaveProperty('appName');
      expect(data.system).toHaveProperty('appVersion');
      expect(data.system).toHaveProperty('baseUrl');
      expect(data.system).toHaveProperty('rakutenBaseUrl');
      expect(data.system).toHaveProperty('timeout');
    });

    it('should have valid timestamp format', async () => {
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });
  });
});