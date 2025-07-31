/**
 * Integration tests for startup validation functionality
 * These tests verify that the startup validation requirements are met
 */

import { jest } from '@jest/globals';

// Mock the logger to capture log calls
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../../lib/logger', () => ({
  logger: mockLogger,
}));

// Mock environment setup
jest.mock('../environment-setup', () => ({
  validateEnvironmentSpecificConfig: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    environment: 'development',
  })),
}));

// Mock health monitor
jest.mock('../rakuten-health-monitor', () => ({
  checkApiHealth: jest.fn(() => Promise.resolve({
    isHealthy: true,
    lastChecked: new Date(),
    responseTime: 100,
  })),
}));

describe('Startup Validation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.RAKUTEN_APPLICATION_ID;
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NODE_ENV;
    delete process.env.VERCEL_ENV;
  });

  describe('Requirement 1.1: Read RAKUTEN_APPLICATION_ID from environment variables', () => {
    it('should successfully read and validate API key from environment', async () => {
      // Set up environment
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';

      // Import after setting environment variables
      const { validateApplicationStartup } = await import('../startup-validation');
      
      const result = await validateApplicationStartup({
        exitOnError: false,
        validateConnections: false,
      });

      // Verify the API key was read and processed
      expect(result.configurationStatus.rakutenApi.configured).toBe(true);
      
      // Verify logging occurred
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Reading Rakuten API key from environment variables'),
        expect.objectContaining({
          hasApiKey: true,
          apiKeyLength: 20,
        })
      );
    });
  });

  describe('Requirement 1.3: Fall back to mock data when API key is missing', () => {
    it('should fall back to mock data when RAKUTEN_APPLICATION_ID is not set', async () => {
      // Set up environment without API key
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Don't set RAKUTEN_APPLICATION_ID

      const { validateApplicationStartup } = await import('../startup-validation');
      
      const result = await validateApplicationStartup({
        exitOnError: false,
        validateConnections: false,
      });

      // Verify fallback to mock data
      expect(result.configurationStatus.rakutenApi.configured).toBe(false);
      expect(result.configurationStatus.rakutenApi.usingMockData).toBe(true);
      
      // Verify appropriate warning was logged
      expect(result.warnings.some(warning => 
        warning.includes('falling back to mock data')
      )).toBe(true);
    });
  });

  describe('Requirement 1.5: Log warning and use mock data for invalid API key', () => {
    it('should handle invalid API key format gracefully', async () => {
      // Set up environment with invalid API key
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = 'invalid-key-format';

      const { validateApplicationStartup } = await import('../startup-validation');
      
      const result = await validateApplicationStartup({
        exitOnError: false,
        validateConnections: false,
      });

      // Verify API key is marked as invalid
      expect(result.configurationStatus.rakutenApi.configured).toBe(true);
      expect(result.configurationStatus.rakutenApi.valid).toBe(false);
      
      // Verify warning about invalid format
      expect(result.warnings.some(warning => 
        warning.includes('invalid') || warning.includes('format')
      )).toBe(true);
    });
  });

  describe('Requirement 2.3: Provide helpful error messages with setup instructions', () => {
    it('should provide setup instructions when API key is missing', async () => {
      // Set up environment without API key
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

      const { validateApplicationStartup } = await import('../startup-validation');
      
      const result = await validateApplicationStartup({
        exitOnError: false,
        validateConnections: false,
      });

      // Verify helpful recommendations are provided
      expect(result.recommendations.some(rec => 
        rec.includes('RAKUTEN_APPLICATION_ID') || rec.includes('API key')
      )).toBe(true);
      
      expect(result.recommendations.some(rec => 
        rec.includes('webservice.rakuten.co.jp')
      )).toBe(true);
    });
  });

  describe('Requirement 2.4: Clearly indicate data source in development mode', () => {
    it('should clearly indicate mock data usage in development', async () => {
      // Set up development environment without API key
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

      const { validateApplicationStartup } = await import('../startup-validation');
      
      const result = await validateApplicationStartup({
        exitOnError: false,
        validateConnections: false,
      });

      // Verify development mode behavior
      expect(result.environment).toBe('development');
      expect(result.configurationStatus.rakutenApi.usingMockData).toBe(true);
      
      // Verify clear indication of data source
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('mock'),
        expect.objectContaining({
          environment: 'development',
          usingMockData: true,
        })
      );
    });
  });

  describe('Graceful startup behavior', () => {
    it('should allow application to start even with configuration issues in development', async () => {
      // Set up minimal environment (missing some optional configs)
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

      const { validateApplicationStartup } = await import('../startup-validation');
      
      const result = await validateApplicationStartup({
        exitOnError: false,
        validateConnections: false,
      });

      // Application should be able to start
      expect(result.canStart).toBe(true);
      
      // But should have warnings about missing configuration
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should prevent startup in production with missing critical configuration', async () => {
      // Set up production environment with missing API key
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Missing RAKUTEN_APPLICATION_ID

      const { validateApplicationStartup } = await import('../startup-validation');
      
      const result = await validateApplicationStartup({
        exitOnError: false,
        validateConnections: false,
      });

      // Should have errors about missing required configuration
      expect(result.errors.some(error => 
        error.includes('required in production')
      )).toBe(true);
    });
  });
});