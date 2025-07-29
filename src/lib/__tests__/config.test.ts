/**
 * Configuration management tests
 */

import { 
  config, 
  validateConfig, 
  generateConfigReport, 
  getEnvironmentSpecificConfig,
  isDevelopment,
  isStaging,
  isProduction,
  type ConfigValidationResult,
  type RakutenConfig
} from '../config';

// Mock environment variables
const originalEnv = process.env;

describe('Configuration Management', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Detection', () => {
    it('should detect development environment correctly', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL_ENV;
      
      // Re-import to get fresh config
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.app.environment).toBe('development');
    });

    it('should detect production environment from NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.VERCEL_ENV;
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.app.environment).toBe('production');
    });

    it('should detect production environment from VERCEL_ENV', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'production';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.app.environment).toBe('production');
    });

    it('should detect staging environment from VERCEL_ENV', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'preview';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.app.environment).toBe('staging');
    });
  });

  describe('Rakuten API Key Validation', () => {
    it('should validate correct API key format', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.validation.isConfigured).toBe(true);
      expect(freshConfig.rakuten.validation.isValid).toBe(true);
    });

    it('should reject invalid API key format', () => {
      process.env.RAKUTEN_APPLICATION_ID = 'invalid-key';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.validation.isConfigured).toBe(true);
      expect(freshConfig.rakuten.validation.isValid).toBe(false);
    });

    it('should handle missing API key', () => {
      delete process.env.RAKUTEN_APPLICATION_ID;
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.validation.isConfigured).toBe(false);
      expect(freshConfig.rakuten.validation.isValid).toBe(false);
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should parse numeric environment variables correctly', () => {
      process.env.RAKUTEN_API_TIMEOUT = '15000';
      process.env.RAKUTEN_RATE_LIMIT_RPS = '10';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.timeout).toBe(15000);
      expect(freshConfig.rakuten.rateLimit.requestsPerSecond).toBe(10);
    });

    it('should use default values for invalid numeric environment variables', () => {
      process.env.RAKUTEN_API_TIMEOUT = 'invalid';
      process.env.RAKUTEN_RATE_LIMIT_RPS = 'not-a-number';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.timeout).toBe(10000); // default
      expect(freshConfig.rakuten.rateLimit.requestsPerSecond).toBe(5); // default
    });

    it('should parse boolean environment variables correctly', () => {
      process.env.USE_MOCK_RECIPES = 'true';
      process.env.RAKUTEN_ENABLE_HEALTH_CHECKS = 'false';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.fallback.useMockData).toBe(true);
      expect(freshConfig.rakuten.monitoring.enableHealthChecks).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should pass validation in development with no API key', () => {
      delete process.env.RAKUTEN_APPLICATION_ID;
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { validateConfig } = require('../config');
      
      const result = validateConfig();
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should fail validation in production without API key', () => {
      delete process.env.RAKUTEN_APPLICATION_ID;
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      
      expect(() => {
        const { validateConfig } = require('../config');
        validateConfig();
      }).toThrow('設定エラー');
    });

    it('should pass validation with valid API key', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      const { validateConfig } = require('../config');
      
      const result = validateConfig();
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail validation with invalid API key format', () => {
      process.env.RAKUTEN_APPLICATION_ID = 'invalid-key';
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      
      expect(() => {
        const { validateConfig } = require('../config');
        validateConfig();
      }).toThrow('設定エラー');
    });

    it('should warn about high rate limits', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.RAKUTEN_RATE_LIMIT_RPS = '15';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { validateConfig } = require('../config');
      
      const result = validateConfig();
      expect(result.warnings.some(w => w.includes('レート制限が高く設定'))).toBe(true);
    });
  });

  describe('Mock Data Configuration', () => {
    it('should use mock data when API key is not configured', () => {
      delete process.env.RAKUTEN_APPLICATION_ID;
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.features.useMockRecipes).toBe(true);
      expect(freshConfig.rakuten.fallback.useMockData).toBe(true);
    });

    it('should use real data when API key is configured and USE_MOCK_RECIPES is false', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.USE_MOCK_RECIPES = 'false';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.features.useMockRecipes).toBe(false);
      expect(freshConfig.rakuten.fallback.useMockData).toBe(false);
    });

    it('should respect USE_MOCK_RECIPES=true even with API key', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.USE_MOCK_RECIPES = 'true';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.features.useMockRecipes).toBe(true);
      expect(freshConfig.rakuten.fallback.useMockData).toBe(true);
    });
  });

  describe('Health Check Configuration', () => {
    it('should enable health checks by default in production', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.NODE_ENV = 'production';
      delete process.env.RAKUTEN_ENABLE_HEALTH_CHECKS;
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.monitoring.enableHealthChecks).toBe(true);
    });

    it('should disable health checks by default in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.RAKUTEN_ENABLE_HEALTH_CHECKS;
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.monitoring.enableHealthChecks).toBe(false);
    });

    it('should respect explicit health check configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.RAKUTEN_ENABLE_HEALTH_CHECKS = 'true';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.monitoring.enableHealthChecks).toBe(true);
    });
  });

  describe('Configuration Report Generation', () => {
    it('should generate comprehensive configuration report', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { generateConfigReport } = require('../config');
      
      const report = generateConfigReport();
      expect(report).toContain('設定レポート');
      expect(report).toContain('楽天API設定');
      expect(report).toContain('APIキー設定: ✓');
      expect(report).toContain('APIキー有効: ✓');
    });

    it('should show errors in configuration report', () => {
      delete process.env.RAKUTEN_APPLICATION_ID;
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      
      // Catch the error and test report generation
      try {
        const { generateConfigReport } = require('../config');
        generateConfigReport();
      } catch (error) {
        // Expected in production without API key
      }
      
      // Test with development environment to avoid throwing
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      
      const { generateConfigReport } = require('../config');
      const report = generateConfigReport();
      expect(report).toContain('APIキー設定: ✗');
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should return correct environment-specific configuration', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      const { getEnvironmentSpecificConfig } = require('../config');
      
      const envConfig = getEnvironmentSpecificConfig();
      expect(envConfig.environment).toBe('production');
      expect(envConfig.isProduction).toBe(true);
      expect(envConfig.isDevelopment).toBe(false);
      expect(envConfig.isStaging).toBe(false);
      expect(envConfig.rakutenApiRequired).toBe(true);
    });
  });

  describe('Environment Helper Functions', () => {
    it('should correctly identify development environment', () => {
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { isDevelopment, isStaging, isProduction } = require('../config');
      
      expect(isDevelopment).toBe(true);
      expect(isStaging).toBe(false);
      expect(isProduction).toBe(false);
    });

    it('should correctly identify staging environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'preview';
      
      jest.resetModules();
      const { isDevelopment, isStaging, isProduction } = require('../config');
      
      expect(isDevelopment).toBe(false);
      expect(isStaging).toBe(true);
      expect(isProduction).toBe(false);
    });

    it('should correctly identify production environment', () => {
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      const { isDevelopment, isStaging, isProduction } = require('../config');
      
      expect(isDevelopment).toBe(false);
      expect(isStaging).toBe(false);
      expect(isProduction).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid boolean environment variables gracefully', () => {
      process.env.USE_MOCK_RECIPES = 'invalid-boolean';
      process.env.RAKUTEN_ENABLE_HEALTH_CHECKS = 'not-a-boolean';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { validateConfig } = require('../config');
      
      const result = validateConfig();
      expect(result.warnings.some(w => w.includes('USE_MOCK_RECIPES'))).toBe(true);
      expect(result.warnings.some(w => w.includes('RAKUTEN_ENABLE_HEALTH_CHECKS'))).toBe(true);
    });

    it('should provide helpful recommendations for development environment', () => {
      process.env.RAKUTEN_APPLICATION_ID = '12345678901234567890';
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { validateConfig } = require('../config');
      
      const result = validateConfig();
      expect(result.recommendations.some(r => r.includes('USE_MOCK_RECIPES=true'))).toBe(true);
    });
  });

  describe('Configuration Structure', () => {
    it('should have all required configuration sections', () => {
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig).toHaveProperty('rakuten');
      expect(freshConfig).toHaveProperty('app');
      expect(freshConfig).toHaveProperty('features');
      expect(freshConfig).toHaveProperty('cache');
      
      expect(freshConfig.rakuten).toHaveProperty('applicationId');
      expect(freshConfig.rakuten).toHaveProperty('baseUrl');
      expect(freshConfig.rakuten).toHaveProperty('timeout');
      expect(freshConfig.rakuten).toHaveProperty('rateLimit');
      expect(freshConfig.rakuten).toHaveProperty('validation');
      expect(freshConfig.rakuten).toHaveProperty('fallback');
      expect(freshConfig.rakuten).toHaveProperty('monitoring');
    });

    it('should have correct default values', () => {
      delete process.env.RAKUTEN_APPLICATION_ID;
      process.env.NODE_ENV = 'development';
      
      jest.resetModules();
      const { config: freshConfig } = require('../config');
      
      expect(freshConfig.rakuten.baseUrl).toBe('https://app.rakuten.co.jp/services/api');
      expect(freshConfig.rakuten.timeout).toBe(10000);
      expect(freshConfig.rakuten.rateLimit.requestsPerSecond).toBe(5);
      expect(freshConfig.rakuten.rateLimit.requestsPerDay).toBe(10000);
      expect(freshConfig.rakuten.rateLimit.burstLimit).toBe(10);
      expect(freshConfig.rakuten.monitoring.healthCheckInterval).toBe(300000);
    });
  });
});