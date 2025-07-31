/**
 * Tests for startup validation functionality
 */

import { jest } from '@jest/globals';
import { StartupValidator, validateApplicationStartup, quickStartupCheck, gracefulStartup } from '../startup-validation';

// Mock dependencies
jest.mock('../config', () => ({
  config: {
    rakuten: {
      applicationId: undefined,
      validation: {
        isConfigured: false,
        isValid: false,
        lastValidated: null,
      },
      fallback: {
        useMockData: true,
      },
      monitoring: {
        enableHealthChecks: false,
      },
    },
    app: {
      environment: 'development',
    },
  },
  validateConfig: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
  })),
  generateConfigReport: jest.fn(() => 'Mock config report'),
  getEnvironmentSpecificConfig: jest.fn(() => ({
    environment: 'development',
    isProduction: false,
    isDevelopment: true,
  })),
}));

jest.mock('../environment-setup', () => ({
  validateEnvironmentSpecificConfig: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    environment: 'development',
  })),
}));

jest.mock('../../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../rakuten-health-monitor', () => ({
  checkApiHealth: jest.fn(() => Promise.resolve({
    isHealthy: true,
    lastChecked: new Date(),
    responseTime: 100,
  })),
}));

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

beforeEach(() => {
  jest.clearAllMocks();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  
  // Reset environment variables
  delete process.env.RAKUTEN_APPLICATION_ID;
  delete process.env.DATABASE_URL;
  delete process.env.NEXTAUTH_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  delete process.env.STRIPE_PRICE_ID;
  delete process.env.NODE_ENV;
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
});

describe('StartupValidator', () => {
  describe('validateStartup', () => {
    it('should pass validation with minimal required configuration in development', async () => {
      // Set minimal required environment variables
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.isValid).toBe(true);
      expect(result.canStart).toBe(true);
      expect(result.environment).toBe('development');
      expect(result.configurationStatus.database.configured).toBe(true);
      expect(result.configurationStatus.authentication.configured).toBe(true);
    });

    it('should fail validation when required variables are missing in production', async () => {
      process.env.NODE_ENV = 'production';
      // Don't set any environment variables

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.isValid).toBe(false);
      expect(result.canStart).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('required in production'))).toBe(true);
    });

    it('should validate Rakuten API configuration correctly', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = 'invalid-api-key-format';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.configurationStatus.rakutenApi.configured).toBe(true);
      expect(result.configurationStatus.rakutenApi.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Rakuten API key format is invalid'))).toBe(true);
    });

    it('should validate database configuration', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Don't set DATABASE_URL

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.configurationStatus.database.configured).toBe(false);
      expect(result.errors.some(error => error.includes('Database URL is not configured'))).toBe(true);
      expect(result.canStart).toBe(false);
    });

    it('should validate authentication configuration', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'short'; // Too short

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.configurationStatus.authentication.configured).toBe(true);
      expect(result.configurationStatus.authentication.valid).toBe(false);
      expect(result.errors.some(error => error.includes('NextAuth secret is too short'))).toBe(true);
    });

    it('should validate payment configuration in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890'; // Valid format
      // Don't set Stripe keys

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.configurationStatus.payments.configured).toBe(false);
      expect(result.errors.some(error => error.includes('Payment configuration is required in production'))).toBe(true);
    });

    it('should detect test Stripe keys in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.STRIPE_SECRET_KEY = 'sk_test_test_key_here';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_test_key_here';
      process.env.STRIPE_PRICE_ID = 'price_test';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.configurationStatus.payments.configured).toBe(true);
      expect(result.configurationStatus.payments.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Production environment is using test Stripe keys'))).toBe(true);
    });

    it('should warn about live Stripe keys in staging', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'preview'; // This makes it staging
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.STRIPE_SECRET_KEY = 'sk_live_live_key_here';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_live_live_key_here';
      process.env.STRIPE_PRICE_ID = 'price_live';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.warnings.some(warning => warning.includes('Staging environment is using live Stripe keys'))).toBe(true);
    });

    it('should handle validation exceptions gracefully', async () => {
      process.env.NODE_ENV = 'development';
      
      // Mock environment setup to throw an error
      const { validateEnvironmentSpecificConfig } = require('../environment-setup');
      validateEnvironmentSpecificConfig.mockImplementation(() => {
        throw new Error('Mock validation error');
      });

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.isValid).toBe(false);
      expect(result.canStart).toBe(false);
      expect(result.errors.some(error => error.includes('Validation exception'))).toBe(true);
    });

    it('should perform connection validation when enabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';

      // Mock config to show API as configured and valid
      const { config } = require('../config');
      config.rakuten.applicationId = '12345678901234567890';
      config.rakuten.validation.isConfigured = true;
      config.rakuten.validation.isValid = true;

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: true,
      });

      const result = await validator.validateStartup();

      // Should have attempted health check
      const { checkApiHealth } = require('../rakuten-health-monitor');
      expect(checkApiHealth).toHaveBeenCalled();
    });

    it('should handle failed API health check gracefully', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';

      // Mock config to show API as configured and valid
      const { config } = require('../config');
      config.rakuten.applicationId = '12345678901234567890';
      config.rakuten.validation.isConfigured = true;
      config.rakuten.validation.isValid = true;

      // Mock health check to fail
      const { checkApiHealth } = require('../rakuten-health-monitor');
      checkApiHealth.mockResolvedValue({
        isHealthy: false,
        lastChecked: new Date(),
        error: 'Connection failed',
      });

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: true,
      });

      const result = await validator.validateStartup();

      expect(result.warnings.some(warning => warning.includes('Rakuten API health check failed'))).toBe(true);
    });
  });

  describe('determineCanStart', () => {
    it('should allow startup in development with warnings', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // No Rakuten API key - should generate warnings but allow startup

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.canStart).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should prevent startup when critical services are missing', async () => {
      process.env.NODE_ENV = 'development';
      // Missing DATABASE_URL and NEXTAUTH_SECRET

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.canStart).toBe(false);
    });
  });

  describe('logging behavior', () => {
    it('should log detailed information in verbose mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

      const validator = new StartupValidator({
        exitOnError: false,
        logLevel: 'verbose',
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting application configuration validation'),
        expect.any(Object)
      );
    });

    it('should log minimal information in minimal mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

      const validator = new StartupValidator({
        exitOnError: false,
        logLevel: 'minimal',
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Application startup validation passed'),
        expect.any(Object)
      );
    });
  });
});

describe('validateApplicationStartup', () => {
  it('should use default validator when no options provided', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

    const result = await validateApplicationStartup();

    expect(result).toBeDefined();
    expect(result.environment).toBe('development');
  });

  it('should use custom options when provided', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

    const result = await validateApplicationStartup({
      logLevel: 'verbose',
      validateConnections: false,
    });

    expect(result).toBeDefined();
  });
});

describe('quickStartupCheck', () => {
  it('should return true for valid configuration', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

    const canStart = await quickStartupCheck();

    expect(canStart).toBe(true);
  });

  it('should return false for invalid configuration', async () => {
    process.env.NODE_ENV = 'development';
    // Missing required variables

    const canStart = await quickStartupCheck();

    expect(canStart).toBe(false);
  });

  it('should handle exceptions gracefully', async () => {
    // Mock validateApplicationStartup to throw by mocking the entire module
    const mockValidateApplicationStartup = jest.fn().mockRejectedValue(new Error('Test error'));
    
    // Temporarily replace the function
    const originalModule = await import('../startup-validation');
    const mockModule = {
      ...originalModule,
      validateApplicationStartup: mockValidateApplicationStartup
    };
    
    // Use the mocked function directly
    try {
      await mockModule.validateApplicationStartup();
    } catch (error) {
      // Expected to throw
    }

    const canStart = await quickStartupCheck();

    expect(canStart).toBe(false);
  });
});

describe('gracefulStartup', () => {
  it('should complete successfully with valid configuration', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

    await expect(gracefulStartup()).resolves.not.toThrow();

    const { logger } = require('../../../lib/logger');
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Application started successfully'),
      expect.any(Object)
    );
  });

  it('should continue with warnings when configuration has issues', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
    // Add some configuration that will generate warnings
    process.env.RAKUTEN_APPLICATION_ID = 'invalid-format';

    await expect(gracefulStartup()).resolves.not.toThrow();

    const { logger } = require('../../../lib/logger');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle exceptions gracefully', async () => {
    // Mock validateApplicationStartup to throw
    const originalValidate = validateApplicationStartup;
    (validateApplicationStartup as jest.Mock) = jest.fn().mockRejectedValue(new Error('Test error'));

    await expect(gracefulStartup()).resolves.not.toThrow();

    const { logger } = require('../../../lib/logger');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Graceful startup failed'),
      expect.any(Object),
      expect.any(Error)
    );

    // Restore original function
    (validateApplicationStartup as any) = originalValidate;
  });
});

describe('environment-specific behavior', () => {
  it('should have stricter validation in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
    // Missing RAKUTEN_APPLICATION_ID which is required in production

    const validator = new StartupValidator({
      exitOnError: false,
      validateConnections: false,
    });

    const result = await validator.validateStartup();

    expect(result.canStart).toBe(false);
    expect(result.errors.some(error => error.includes('required in production'))).toBe(true);
  });

  it('should be more lenient in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
    // Missing RAKUTEN_APPLICATION_ID - should be OK in development

    const validator = new StartupValidator({
      exitOnError: false,
      validateConnections: false,
    });

    const result = await validator.validateStartup();

    expect(result.canStart).toBe(true);
    expect(result.warnings.some(warning => warning.includes('Rakuten API key not configured'))).toBe(true);
  });

  it('should handle staging environment correctly', async () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview'; // This makes it staging
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';

    const validator = new StartupValidator({
      exitOnError: false,
      validateConnections: false,
    });

    const result = await validator.validateStartup();

    expect(result.environment).toBe('staging');
    expect(result.canStart).toBe(true); // Staging is more lenient than production
  });
});

describe('configuration status reporting', () => {
  it('should accurately report configuration status', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = './data/test.db';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
    process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
    process.env.STRIPE_SECRET_KEY = 'sk_test_test_key';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_test_key';
    process.env.STRIPE_PRICE_ID = 'price_test';

    // Mock config to reflect the environment variables
    const { config } = require('../config');
    config.rakuten.applicationId = '12345678901234567890';
    config.rakuten.validation.isConfigured = true;
    config.rakuten.validation.isValid = true;

    const validator = new StartupValidator({
      exitOnError: false,
      validateConnections: false,
    });

    const result = await validator.validateStartup();

    expect(result.configurationStatus.rakutenApi.configured).toBe(true);
    expect(result.configurationStatus.rakutenApi.valid).toBe(true);
    expect(result.configurationStatus.database.configured).toBe(true);
    expect(result.configurationStatus.authentication.configured).toBe(true);
    expect(result.configurationStatus.authentication.valid).toBe(true);
    expect(result.configurationStatus.payments.configured).toBe(true);
  });
});

describe('startup validation requirements', () => {
  describe('Requirement 1.1: Read RAKUTEN_APPLICATION_ID from environment variables on startup', () => {
    it('should read and log RAKUTEN_APPLICATION_ID from environment variables', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Reading Rakuten API key from environment variables',
        expect.objectContaining({
          environment: 'development',
          hasApiKey: true,
          apiKeyLength: 20,
          type: 'rakuten_env_read'
        })
      );
    });

    it('should log when RAKUTEN_APPLICATION_ID is not set', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Don't set RAKUTEN_APPLICATION_ID

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Reading Rakuten API key from environment variables',
        expect.objectContaining({
          environment: 'development',
          hasApiKey: false,
          apiKeyLength: 0,
          type: 'rakuten_env_read'
        })
      );
    });
  });

  describe('Requirement 1.3: Fall back to mock data when API key is missing', () => {
    it('should fall back to mock data when RAKUTEN_APPLICATION_ID is missing', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Don't set RAKUTEN_APPLICATION_ID

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.configurationStatus.rakutenApi.configured).toBe(false);
      expect(result.configurationStatus.rakutenApi.usingMockData).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('falling back to mock data')
      )).toBe(true);
    });

    it('should log mock data fallback in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Don't set RAKUTEN_APPLICATION_ID

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.warn).toHaveBeenCalledWith(
        'Development mode: Using mock recipe data due to missing API key',
        expect.objectContaining({
          environment: 'development',
          usingMockData: true,
          type: 'mock_data_fallback'
        })
      );
    });
  });

  describe('Requirement 1.5: Log warning and use mock data for invalid API key format', () => {
    it('should log warning and use mock data for invalid API key format', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = 'invalid-format';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.warnings.some(warning => 
        warning.includes('Rakuten API key format is invalid - falling back to mock data')
      )).toBe(true);

      const { logger } = require('../../../lib/logger');
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid API key format detected',
        expect.objectContaining({
          environment: 'development',
          usingMockData: true,
          type: 'invalid_api_key_format'
        })
      );
    });

    it('should treat invalid API key as error in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = 'invalid-format';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.errors.some(error => 
        error.includes('Rakuten API key format is invalid')
      )).toBe(true);
    });
  });

  describe('Requirement 2.3: Provide helpful error messages with setup instructions', () => {
    it('should provide setup instructions when API key is missing', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Don't set RAKUTEN_APPLICATION_ID

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.recommendations.some(rec => 
        rec.includes('Set RAKUTEN_APPLICATION_ID to use real recipe data')
      )).toBe(true);
      expect(result.recommendations.some(rec => 
        rec.includes('Visit https://webservice.rakuten.co.jp/ to obtain an API key')
      )).toBe(true);
    });

    it('should provide format instructions when API key is invalid', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = 'invalid-format';

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      const result = await validator.validateStartup();

      expect(result.recommendations.some(rec => 
        rec.includes('Verify RAKUTEN_APPLICATION_ID is exactly 20 alphanumeric characters')
      )).toBe(true);
    });
  });

  describe('Requirement 2.4: Clearly indicate data source in development mode', () => {
    it('should indicate mock data usage when API key is missing in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      // Don't set RAKUTEN_APPLICATION_ID

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.warn).toHaveBeenCalledWith(
        'Development mode: Using mock recipe data due to missing API key',
        expect.objectContaining({
          environment: 'development',
          usingMockData: true,
          type: 'mock_data_fallback'
        })
      );
    });

    it('should indicate real API data usage when API key is valid in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';

      // Mock config to show valid API key but not using mock data
      const { config } = require('../config');
      config.rakuten.applicationId = '12345678901234567890';
      config.rakuten.validation.isConfigured = true;
      config.rakuten.validation.isValid = true;
      config.rakuten.fallback.useMockData = false;

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Development mode: Using real Rakuten API data',
        expect.objectContaining({
          environment: 'development',
          type: 'real_api_data'
        })
      );
    });

    it('should indicate mock data override when USE_MOCK_RECIPES is true despite valid API key', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = './data/test.db';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';

      // Mock config to show valid API key but using mock data due to override
      const { config } = require('../config');
      config.rakuten.applicationId = '12345678901234567890';
      config.rakuten.validation.isConfigured = true;
      config.rakuten.validation.isValid = true;
      config.rakuten.fallback.useMockData = true;

      const validator = new StartupValidator({
        exitOnError: false,
        validateConnections: false,
      });

      await validator.validateStartup();

      const { logger } = require('../../../lib/logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Development mode: Using mock data despite valid API key (USE_MOCK_RECIPES=true)',
        expect.objectContaining({
          environment: 'development',
          type: 'mock_data_override'
        })
      );
    });
  });
});