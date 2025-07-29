/**
 * Tests for Environment Setup Helper Utilities
 */

import {
  EnvironmentSetup,
  environmentSetup,
  checkRequiredVariables,
  generateExampleConfig,
  validateEnvironmentSpecificConfig,
  createEnvironmentExamples,
  validateAllEnvironments,
  type EnvironmentCheck,
  type EnvironmentValidationResult,
  type ExampleConfigOptions
} from '../environment-setup';

// Mock the config module
jest.mock('../config', () => ({
  config: {
    app: {
      environment: 'development'
    }
  }
}));

// Mock the rakuten-api-validator module
jest.mock('../rakuten-api-validator', () => ({
  getRakutenSetupInstructions: jest.fn(() => ({
    environment: 'development',
    steps: ['Step 1', 'Step 2'],
    environmentVariables: {},
    troubleshooting: [],
    links: [{ title: 'Rakuten Portal', url: 'https://webservice.rakuten.co.jp/' }]
  }))
}));

describe('EnvironmentSetup', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.RAKUTEN_APPLICATION_ID;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.USE_MOCK_RECIPES;
    delete process.env.RAKUTEN_API_TIMEOUT;
    delete process.env.RAKUTEN_RATE_LIMIT_RPS;
    delete process.env.RAKUTEN_ENABLE_HEALTH_CHECKS;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_ID;
    delete process.env.VERCEL_ENV;
    
    // Set default environment
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('checkRequiredVariables', () => {
    it('should identify missing required variables in development', () => {
      const result = checkRequiredVariables();
      
      expect(result.environment).toBe('development');
      expect(result.missing).toContain('NEXTAUTH_SECRET');
      expect(result.missing).toContain('DATABASE_URL');
      expect(result.isReady).toBe(false);
    });

    it('should identify missing required variables in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'production';
      
      const result = checkRequiredVariables();
      
      expect(result.environment).toBe('production');
      expect(result.missing).toContain('RAKUTEN_APPLICATION_ID');
      expect(result.missing).toContain('NEXTAUTH_SECRET');
      expect(result.missing).toContain('DATABASE_URL');
      expect(result.missing).toContain('STRIPE_SECRET_KEY');
      expect(result.isReady).toBe(false);
    });

    it('should validate when all required variables are present', () => {
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = './data/app.db';
      
      const result = checkRequiredVariables();
      
      expect(result.missing).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
      expect(result.isReady).toBe(true);
    });

    it('should identify invalid variable formats', () => {
      process.env.NEXTAUTH_SECRET = 'short'; // Too short
      process.env.DATABASE_URL = 'invalid-url';
      process.env.RAKUTEN_API_TIMEOUT = 'not-a-number';
      
      const result = checkRequiredVariables();
      
      expect(result.invalid).toContain('NEXTAUTH_SECRET');
      expect(result.warnings).toContain('RAKUTEN_API_TIMEOUT has invalid format, using default value');
    });

    it('should provide environment-specific warnings', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'production';
      process.env.USE_MOCK_RECIPES = 'true';
      
      const result = checkRequiredVariables();
      
      expect(result.warnings).toContain('Production environment is configured to use mock recipes');
    });

    it('should warn about API quota usage in development', () => {
      process.env.RAKUTEN_APPLICATION_ID = 'a'.repeat(20);
      // USE_MOCK_RECIPES not set, defaults to false when API key is present
      
      const result = checkRequiredVariables();
      
      expect(result.warnings).toContain('Consider setting USE_MOCK_RECIPES=true in development to save API quota');
    });
  });

  describe('generateExampleConfig', () => {
    it('should generate basic config without comments', () => {
      const config = generateExampleConfig({
        environment: 'development',
        includeComments: false,
        includeOptionalVars: false
      });
      
      expect(config).toContain('NEXTAUTH_SECRET=');
      expect(config).toContain('DATABASE_URL=');
      expect(config).not.toContain('#');
      expect(config).not.toContain('RAKUTEN_API_TIMEOUT=');
    });

    it('should generate config with comments and optional vars', () => {
      const config = generateExampleConfig({
        environment: 'development',
        includeComments: true,
        includeOptionalVars: true
      });
      
      expect(config).toContain('# Environment Configuration for DEVELOPMENT');
      expect(config).toContain('NEXTAUTH_SECRET=');
      expect(config).toContain('RAKUTEN_API_TIMEOUT=');
      expect(config).toContain('# API request timeout in milliseconds');
    });

    it('should generate production-specific config', () => {
      const config = generateExampleConfig({
        environment: 'production',
        includeComments: true,
        includeOptionalVars: true
      });
      
      expect(config).toContain('RAKUTEN_APPLICATION_ID=');
      expect(config).toContain('STRIPE_SECRET_KEY=');
      expect(config).toContain('USE_MOCK_RECIPES=false');
      expect(config).toContain('ENABLE_ANALYTICS=true');
      expect(config).toContain('# - RAKUTEN_APPLICATION_ID is required for real recipe data');
    });

    it('should generate staging-specific config', () => {
      const config = generateExampleConfig({
        environment: 'staging',
        includeComments: true,
        includeOptionalVars: true
      });
      
      expect(config).toContain('RAKUTEN_ENABLE_HEALTH_CHECKS=true');
      expect(config).toContain('# - Health checks are enabled by default in staging');
    });
  });

  describe('validateEnvironmentSpecificConfig', () => {
    it('should return validation errors for missing variables', () => {
      const result = validateEnvironmentSpecificConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required variable: NEXTAUTH_SECRET (NextAuth.js secret for JWT signing (minimum 32 characters))');
      expect(result.recommendations).toContain('Generate a random 32+ character string for JWT signing');
    });

    it('should return validation errors for invalid formats', () => {
      process.env.NEXTAUTH_SECRET = 'short';
      process.env.DATABASE_URL = 'invalid';
      
      const result = validateEnvironmentSpecificConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid format for NEXTAUTH_SECRET: Expected minimum 32 characters');
      expect(result.errors).toContain('Invalid format for DATABASE_URL: Expected a valid URL or file path');
    });

    it('should validate successfully with correct configuration', () => {
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = './data/app.db';
      
      const result = validateEnvironmentSpecificConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide production-specific validation', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'production';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = './data/app.db';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.STRIPE_PRICE_ID = 'price_123';
      process.env.USE_MOCK_RECIPES = 'true';
      
      const result = validateEnvironmentSpecificConfig();
      
      expect(result.errors).toContain('Production environment is using test Stripe keys');
      expect(result.warnings).toContain('Production is configured to use mock data');
    });

    it('should provide staging-specific validation', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'preview';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = './data/app.db';
      process.env.STRIPE_SECRET_KEY = 'sk_live_123' + 'a'.repeat(32); // Make it long enough
      
      const result = validateEnvironmentSpecificConfig();
      
      expect(result.warnings).toContain('Staging environment is using live Stripe keys');
    });
  });

  describe('createEnvironmentExamples', () => {
    it('should create examples for all environments', () => {
      const examples = createEnvironmentExamples();
      
      expect(Object.keys(examples)).toContain('.env.development.example');
      expect(Object.keys(examples)).toContain('.env.staging.example');
      expect(Object.keys(examples)).toContain('.env.production.example');
      
      expect(examples['.env.development.example']).toContain('USE_MOCK_RECIPES=true');
      expect(examples['.env.production.example']).toContain('RAKUTEN_APPLICATION_ID=');
      expect(examples['.env.staging.example']).toContain('RAKUTEN_ENABLE_HEALTH_CHECKS=true');
    });
  });

  describe('validateAllEnvironments', () => {
    it('should validate all environments and restore original env', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalVercelEnv = process.env.VERCEL_ENV;
      
      const results = validateAllEnvironments();
      
      expect(results).toHaveProperty('development');
      expect(results).toHaveProperty('staging');
      expect(results).toHaveProperty('production');
      
      // Check that original environment is restored
      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
      expect(process.env.VERCEL_ENV).toBe(originalVercelEnv);
    });
  });

  describe('EnvironmentSetup class', () => {
    let setup: EnvironmentSetup;

    beforeEach(() => {
      setup = new EnvironmentSetup();
    });

    describe('variable validation', () => {
      it('should validate numeric variables', () => {
        process.env.RAKUTEN_API_TIMEOUT = '10000';
        process.env.RAKUTEN_RATE_LIMIT_RPS = '5';
        process.env.BCRYPT_ROUNDS = '12';
        
        const result = setup.checkRequiredVariables();
        
        expect(result.warnings).not.toContain('RAKUTEN_API_TIMEOUT has invalid format, using default value');
        expect(result.warnings).not.toContain('RAKUTEN_RATE_LIMIT_RPS has invalid format, using default value');
        expect(result.warnings).not.toContain('BCRYPT_ROUNDS has invalid format, using default value');
      });

      it('should validate boolean variables', () => {
        process.env.USE_MOCK_RECIPES = 'true';
        process.env.RAKUTEN_ENABLE_HEALTH_CHECKS = 'false';
        process.env.ENABLE_ANALYTICS = 'true';
        
        const result = setup.checkRequiredVariables();
        
        expect(result.warnings).not.toContain('USE_MOCK_RECIPES has invalid format, using default value');
        expect(result.warnings).not.toContain('RAKUTEN_ENABLE_HEALTH_CHECKS has invalid format, using default value');
        expect(result.warnings).not.toContain('ENABLE_ANALYTICS has invalid format, using default value');
      });

      it('should validate URL variables', () => {
        process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
        process.env.NEXTAUTH_URL = 'https://example.com';
        process.env.DATABASE_URL = './data/app.db'; // File path should be valid
        
        const result = setup.checkRequiredVariables();
        
        expect(result.warnings).not.toContain('NEXT_PUBLIC_API_URL has invalid format, using default value');
        expect(result.warnings).not.toContain('NEXTAUTH_URL has invalid format, using default value');
        expect(result.warnings).not.toContain('DATABASE_URL has invalid format, using default value');
      });

      it('should validate Rakuten API key format', () => {
        process.env.RAKUTEN_APPLICATION_ID = 'a'.repeat(20); // Valid format
        
        const result = setup.checkRequiredVariables();
        
        expect(result.warnings).not.toContain('RAKUTEN_APPLICATION_ID has invalid format, using default value');
      });

      it('should validate secret key lengths', () => {
        process.env.NEXTAUTH_SECRET = 'a'.repeat(32); // Valid length
        
        const result = setup.checkRequiredVariables();
        
        expect(result.invalid).not.toContain('NEXTAUTH_SECRET');
      });
    });

    describe('environment detection', () => {
      it('should detect development environment', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.VERCEL_ENV;
        
        const result = setup.checkRequiredVariables();
        
        expect(result.environment).toBe('development');
      });

      it('should detect staging environment', () => {
        process.env.NODE_ENV = 'development';
        process.env.VERCEL_ENV = 'preview';
        
        const result = setup.checkRequiredVariables();
        
        expect(result.environment).toBe('staging');
      });

      it('should detect production environment', () => {
        process.env.NODE_ENV = 'production';
        process.env.VERCEL_ENV = 'production';
        
        const result = setup.checkRequiredVariables();
        
        expect(result.environment).toBe('production');
      });
    });
  });

  describe('utility functions', () => {
    it('should export convenience functions', () => {
      expect(typeof checkRequiredVariables).toBe('function');
      expect(typeof generateExampleConfig).toBe('function');
      expect(typeof validateEnvironmentSpecificConfig).toBe('function');
      expect(typeof createEnvironmentExamples).toBe('function');
      expect(typeof validateAllEnvironments).toBe('function');
    });

    it('should use singleton instance', () => {
      const result1 = checkRequiredVariables();
      const result2 = environmentSetup.checkRequiredVariables();
      
      expect(result1.environment).toBe(result2.environment);
    });
  });

  describe('error handling', () => {
    it('should handle missing environment variables gracefully', () => {
      // Clear all environment variables
      const keys = Object.keys(process.env);
      keys.forEach(key => {
        if (key.startsWith('RAKUTEN_') || key.startsWith('NEXTAUTH_') || key.startsWith('STRIPE_')) {
          delete process.env[key];
        }
      });
      
      expect(() => checkRequiredVariables()).not.toThrow();
      expect(() => validateEnvironmentSpecificConfig()).not.toThrow();
      expect(() => generateExampleConfig()).not.toThrow();
    });

    it('should handle invalid URL formats gracefully', () => {
      process.env.NEXT_PUBLIC_API_URL = 'not-a-url';
      
      const result = checkRequiredVariables();
      
      expect(result.warnings).toContain('NEXT_PUBLIC_API_URL has invalid format, using default value');
    });
  });
});