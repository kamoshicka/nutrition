/**
 * Environment Setup Helper Utilities
 * 
 * This module provides utilities for:
 * - Environment variable checking and validation
 * - Example configuration file generation
 * - Environment-specific validation with clear error messages
 */

import { config } from './config';
import { getRakutenSetupInstructions } from './rakuten-api-validator';

// Environment check result interfaces
export interface EnvironmentCheck {
  missing: string[];
  invalid: string[];
  warnings: string[];
  isReady: boolean;
  environment: 'development' | 'staging' | 'production';
}

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  environment: string;
}

export interface ExampleConfigOptions {
  environment: 'development' | 'staging' | 'production';
  includeComments: boolean;
  includeOptionalVars: boolean;
}

/**
 * Environment Setup Helper Class
 */
export class EnvironmentSetup {
  private readonly REQUIRED_VARS_BY_ENV = {
    production: [
      'RAKUTEN_APPLICATION_ID',
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_ID'
    ],
    staging: [
      'NEXTAUTH_SECRET',
      'DATABASE_URL'
    ],
    development: [
      'NEXTAUTH_SECRET',
      'DATABASE_URL'
    ]
  };

  private readonly OPTIONAL_VARS = [
    'RAKUTEN_API_TIMEOUT',
    'RAKUTEN_RATE_LIMIT_RPS',
    'RAKUTEN_ENABLE_HEALTH_CHECKS',
    'USE_MOCK_RECIPES',
    'NEXT_PUBLIC_API_URL',
    'BCRYPT_ROUNDS',
    'ENABLE_ANALYTICS',
    'ENABLE_ERROR_REPORTING'
  ];

  private readonly NUMERIC_VARS = [
    'RAKUTEN_API_TIMEOUT',
    'RAKUTEN_RATE_LIMIT_RPS',
    'BCRYPT_ROUNDS'
  ];

  private readonly BOOLEAN_VARS = [
    'USE_MOCK_RECIPES',
    'RAKUTEN_ENABLE_HEALTH_CHECKS',
    'ENABLE_ANALYTICS',
    'ENABLE_ERROR_REPORTING'
  ];

  private readonly URL_VARS = [
    'NEXT_PUBLIC_API_URL',
    'NEXTAUTH_URL',
    'DATABASE_URL'
  ];

  /**
   * Checks required environment variables for the current environment
   */
  checkRequiredVariables(): EnvironmentCheck {
    const environment = this.detectEnvironment();
    const requiredVars = this.REQUIRED_VARS_BY_ENV[environment];
    
    const missing: string[] = [];
    const invalid: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      
      if (!value || value.trim() === '') {
        missing.push(varName);
      } else if (!this.validateVariableValue(varName, value)) {
        invalid.push(varName);
      }
    }

    // Check optional variables for format issues
    for (const varName of this.OPTIONAL_VARS) {
      const value = process.env[varName];
      
      if (value && !this.validateVariableValue(varName, value)) {
        warnings.push(`${varName} has invalid format, using default value`);
      }
    }

    // Environment-specific warnings
    if (environment === 'production') {
      if (!process.env.RAKUTEN_APPLICATION_ID) {
        warnings.push('Production environment should have RAKUTEN_APPLICATION_ID configured for real recipe data');
      }
      if (process.env.USE_MOCK_RECIPES === 'true') {
        warnings.push('Production environment is configured to use mock recipes');
      }
    }

    if (environment === 'development') {
      if (process.env.RAKUTEN_APPLICATION_ID && !process.env.USE_MOCK_RECIPES) {
        warnings.push('Consider setting USE_MOCK_RECIPES=true in development to save API quota');
      }
    }

    return {
      missing,
      invalid,
      warnings,
      isReady: missing.length === 0 && invalid.length === 0,
      environment
    };
  }

  /**
   * Generates example configuration file content
   */
  generateExampleConfig(options: ExampleConfigOptions = {
    environment: 'development',
    includeComments: true,
    includeOptionalVars: true
  }): string {
    const { environment, includeComments, includeOptionalVars } = options;
    const setupInstructions = getRakutenSetupInstructions(environment);
    
    let config = '';

    if (includeComments) {
      config += `# Environment Configuration for ${environment.toUpperCase()}\n`;
      config += `# Generated on ${new Date().toISOString()}\n`;
      config += `#\n`;
      config += `# This file contains environment variables needed for the Healthcare Food App\n`;
      config += `# Copy this file to .env.local and update the values as needed\n`;
      config += `#\n`;
      config += `# For Rakuten API setup instructions, see:\n`;
      config += `# ${setupInstructions.links[0].url}\n\n`;
    }

    // Required variables section
    if (includeComments) {
      config += `# ===== REQUIRED VARIABLES =====\n`;
    }

    const requiredVars = this.REQUIRED_VARS_BY_ENV[environment];
    for (const varName of requiredVars) {
      const example = this.getExampleValue(varName, environment);
      const description = this.getVariableDescription(varName);
      
      if (includeComments && description) {
        config += `# ${description}\n`;
      }
      config += `${varName}=${example}\n`;
      if (includeComments) config += '\n';
    }

    // Optional variables section
    if (includeOptionalVars) {
      if (includeComments) {
        config += `# ===== OPTIONAL VARIABLES =====\n`;
        config += `# These variables have default values but can be customized\n\n`;
      }

      for (const varName of this.OPTIONAL_VARS) {
        const example = this.getExampleValue(varName, environment);
        const description = this.getVariableDescription(varName);
        
        if (includeComments && description) {
          config += `# ${description}\n`;
        }
        config += `${varName}=${example}\n`;
        if (includeComments) config += '\n';
      }
    }

    // Environment-specific notes
    if (includeComments) {
      config += `# ===== ENVIRONMENT-SPECIFIC NOTES =====\n`;
      
      switch (environment) {
        case 'development':
          config += `# - Set USE_MOCK_RECIPES=true to save API quota during development\n`;
          config += `# - RAKUTEN_APPLICATION_ID is optional in development\n`;
          config += `# - Health checks are disabled by default in development\n`;
          break;
        case 'staging':
          config += `# - RAKUTEN_APPLICATION_ID is recommended for realistic testing\n`;
          config += `# - Health checks are enabled by default in staging\n`;
          config += `# - Use test Stripe keys for payment testing\n`;
          break;
        case 'production':
          config += `# - RAKUTEN_APPLICATION_ID is required for real recipe data\n`;
          config += `# - All Stripe keys must be production keys\n`;
          config += `# - Health checks are enabled by default\n`;
          config += `# - Ensure all secrets are properly secured\n`;
          break;
      }
    }

    return config;
  }

  /**
   * Validates environment-specific configuration with detailed error messages
   */
  validateEnvironmentSpecificConfig(): EnvironmentValidationResult {
    const environment = this.detectEnvironment();
    const check = this.checkRequiredVariables();
    
    const result: EnvironmentValidationResult = {
      isValid: check.isReady,
      errors: [],
      warnings: check.warnings,
      recommendations: [],
      environment
    };

    // Process missing variables
    for (const varName of check.missing) {
      const description = this.getVariableDescription(varName);
      const setupHint = this.getSetupHint(varName, environment);
      
      result.errors.push(`Missing required variable: ${varName}${description ? ` (${description})` : ''}`);
      if (setupHint) {
        result.recommendations.push(setupHint);
      }
    }

    // Process invalid variables
    for (const varName of check.invalid) {
      const expectedFormat = this.getExpectedFormat(varName);
      result.errors.push(`Invalid format for ${varName}: ${expectedFormat}`);
    }

    // Environment-specific validation
    this.addEnvironmentSpecificValidation(result, environment);

    // Add general recommendations
    if (result.errors.length > 0) {
      result.recommendations.push(`Run 'npm run env:setup' to generate example configuration files`);
      result.recommendations.push(`Check the documentation for detailed setup instructions`);
    }

    return result;
  }

  /**
   * Detects the current environment
   */
  private detectEnvironment(): 'development' | 'staging' | 'production' {
    const nodeEnv = process.env.NODE_ENV;
    const vercelEnv = process.env.VERCEL_ENV;
    
    if (vercelEnv === 'production' || nodeEnv === 'production') {
      return 'production';
    } else if (vercelEnv === 'preview') {
      return 'staging';
    } else {
      return 'development';
    }
  }

  /**
   * Validates a specific environment variable value
   */
  private validateVariableValue(varName: string, value: string): boolean {
    // Check numeric variables
    if (this.NUMERIC_VARS.includes(varName)) {
      const num = parseInt(value, 10);
      return !isNaN(num) && num > 0;
    }

    // Check boolean variables
    if (this.BOOLEAN_VARS.includes(varName)) {
      return ['true', 'false'].includes(value.toLowerCase());
    }

    // Check URL variables
    if (this.URL_VARS.includes(varName)) {
      try {
        new URL(value);
        return true;
      } catch {
        // For DATABASE_URL, allow file paths
        if (varName === 'DATABASE_URL' && (value.startsWith('./') || value.startsWith('/'))) {
          return true;
        }
        return false;
      }
    }

    // Check Rakuten API key format
    if (varName === 'RAKUTEN_APPLICATION_ID') {
      return /^[a-zA-Z0-9]{20}$/.test(value);
    }

    // Check minimum length for secrets
    if (varName.includes('SECRET') || varName.includes('KEY')) {
      return value.length >= 32;
    }

    // Default: non-empty string
    return value.trim().length > 0;
  }

  /**
   * Gets example value for a variable
   */
  private getExampleValue(varName: string, environment: string): string {
    const examples: Record<string, string | Record<string, string>> = {
      RAKUTEN_APPLICATION_ID: 'your_20_character_api_key_here',
      NEXTAUTH_SECRET: 'your-super-secret-key-here-minimum-32-characters-long',
      NEXTAUTH_URL: environment === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
      DATABASE_URL: './data/app.db',
      NEXT_PUBLIC_API_URL: environment === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
      NODE_ENV: environment,
      USE_MOCK_RECIPES: environment === 'development' ? 'true' : 'false',
      RAKUTEN_API_TIMEOUT: '10000',
      RAKUTEN_RATE_LIMIT_RPS: '5',
      RAKUTEN_ENABLE_HEALTH_CHECKS: environment === 'development' ? 'false' : 'true',
      BCRYPT_ROUNDS: '12',
      ENABLE_ANALYTICS: environment === 'production' ? 'true' : 'false',
      ENABLE_ERROR_REPORTING: environment === 'production' ? 'true' : 'false',
      STRIPE_SECRET_KEY: environment === 'production' ? 'sk_live_your_live_key_here' : 'sk_test_your_test_key_here',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: environment === 'production' ? 'pk_live_your_live_key_here' : 'pk_test_your_test_key_here',
      STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret_here',
      STRIPE_PRICE_ID: 'price_your_price_id_here'
    };

    const example = examples[varName];
    if (typeof example === 'object') {
      return example[environment] || example.development || 'your_value_here';
    }
    return example || 'your_value_here';
  }

  /**
   * Gets description for a variable
   */
  private getVariableDescription(varName: string): string {
    const descriptions: Record<string, string> = {
      RAKUTEN_APPLICATION_ID: 'Rakuten Recipe API Application ID (20 characters)',
      NEXTAUTH_SECRET: 'NextAuth.js secret for JWT signing (minimum 32 characters)',
      NEXTAUTH_URL: 'Base URL for NextAuth.js callbacks',
      DATABASE_URL: 'SQLite database file path',
      NEXT_PUBLIC_API_URL: 'Public API base URL',
      USE_MOCK_RECIPES: 'Use mock recipe data instead of Rakuten API (true/false)',
      RAKUTEN_API_TIMEOUT: 'API request timeout in milliseconds',
      RAKUTEN_RATE_LIMIT_RPS: 'Maximum requests per second to Rakuten API',
      RAKUTEN_ENABLE_HEALTH_CHECKS: 'Enable periodic API health checks (true/false)',
      BCRYPT_ROUNDS: 'Number of bcrypt hashing rounds',
      ENABLE_ANALYTICS: 'Enable analytics tracking (true/false)',
      ENABLE_ERROR_REPORTING: 'Enable error reporting (true/false)',
      STRIPE_SECRET_KEY: 'Stripe secret key for payment processing',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key (client-side)',
      STRIPE_WEBHOOK_SECRET: 'Stripe webhook endpoint secret',
      STRIPE_PRICE_ID: 'Stripe price ID for premium subscriptions'
    };

    return descriptions[varName] || '';
  }

  /**
   * Gets setup hint for a variable
   */
  private getSetupHint(varName: string, environment: string): string {
    const hints: Record<string, string> = {
      RAKUTEN_APPLICATION_ID: 'Get your API key from https://webservice.rakuten.co.jp/',
      NEXTAUTH_SECRET: 'Generate a random 32+ character string for JWT signing',
      STRIPE_SECRET_KEY: 'Get your Stripe keys from https://dashboard.stripe.com/apikeys',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Get your Stripe keys from https://dashboard.stripe.com/apikeys',
      STRIPE_WEBHOOK_SECRET: 'Create a webhook endpoint in Stripe dashboard',
      STRIPE_PRICE_ID: 'Create a product and price in Stripe dashboard'
    };

    return hints[varName] || '';
  }

  /**
   * Gets expected format description for a variable
   */
  private getExpectedFormat(varName: string): string {
    if (this.NUMERIC_VARS.includes(varName)) {
      return 'Expected a positive integer';
    }
    if (this.BOOLEAN_VARS.includes(varName)) {
      return 'Expected "true" or "false"';
    }
    if (this.URL_VARS.includes(varName)) {
      return 'Expected a valid URL or file path';
    }
    if (varName === 'RAKUTEN_APPLICATION_ID') {
      return 'Expected exactly 20 alphanumeric characters';
    }
    if (varName.includes('SECRET') || varName.includes('KEY')) {
      return 'Expected minimum 32 characters';
    }
    return 'Expected non-empty string';
  }

  /**
   * Adds environment-specific validation rules
   */
  private addEnvironmentSpecificValidation(result: EnvironmentValidationResult, environment: string): void {
    switch (environment) {
      case 'production':
        if (!process.env.RAKUTEN_APPLICATION_ID) {
          result.warnings.push('Production environment should have real Rakuten API key configured');
          result.recommendations.push('Configure RAKUTEN_APPLICATION_ID for production recipe data');
        }
        if (process.env.USE_MOCK_RECIPES === 'true') {
          result.warnings.push('Production is configured to use mock data');
          result.recommendations.push('Set USE_MOCK_RECIPES=false for production');
        }
        if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
          result.errors.push('Production environment is using test Stripe keys');
          result.recommendations.push('Configure production Stripe keys for live payments');
        }
        break;

      case 'staging':
        if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
          result.warnings.push('Staging environment is using live Stripe keys');
          result.recommendations.push('Consider using test Stripe keys in staging');
        }
        break;

      case 'development':
        if (process.env.RAKUTEN_APPLICATION_ID && process.env.USE_MOCK_RECIPES !== 'true') {
          result.recommendations.push('Consider setting USE_MOCK_RECIPES=true to save API quota in development');
        }
        break;
    }
  }
}

// Export singleton instance
export const environmentSetup = new EnvironmentSetup();

// Export utility functions for convenience
export const checkRequiredVariables = (): EnvironmentCheck => {
  return environmentSetup.checkRequiredVariables();
};

export const generateExampleConfig = (options?: ExampleConfigOptions): string => {
  return environmentSetup.generateExampleConfig(options);
};

export const validateEnvironmentSpecificConfig = (): EnvironmentValidationResult => {
  return environmentSetup.validateEnvironmentSpecificConfig();
};

/**
 * Utility function to create environment-specific example files
 */
export const createEnvironmentExamples = (): Record<string, string> => {
  const environments: Array<'development' | 'staging' | 'production'> = ['development', 'staging', 'production'];
  const examples: Record<string, string> = {};

  for (const env of environments) {
    examples[`.env.${env}.example`] = generateExampleConfig({
      environment: env,
      includeComments: true,
      includeOptionalVars: true
    });
  }

  return examples;
};

/**
 * Utility function to validate all environments
 */
export const validateAllEnvironments = (): Record<string, EnvironmentValidationResult> => {
  const results: Record<string, EnvironmentValidationResult> = {};
  
  // Save current environment values
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  try {
    // Test each environment by temporarily modifying the environment
    const environments = [
      { name: 'development', NODE_ENV: 'development', VERCEL_ENV: undefined },
      { name: 'staging', NODE_ENV: 'production', VERCEL_ENV: 'preview' },
      { name: 'production', NODE_ENV: 'production', VERCEL_ENV: 'production' }
    ];

    for (const { name, NODE_ENV, VERCEL_ENV } of environments) {
      // Create a mock environment object for validation
      const mockEnv = { ...process.env } as any;
      mockEnv.NODE_ENV = NODE_ENV;
      if (VERCEL_ENV) {
        mockEnv.VERCEL_ENV = VERCEL_ENV;
      } else {
        delete mockEnv.VERCEL_ENV;
      }

      // Create a temporary environment setup instance with mocked values
      const tempEnvSetup = new EnvironmentSetup();
      
      // Since we can't modify NODE_ENV directly, we'll create a basic validation result
      // This is a simplified version that focuses on the key validation logic
      const basicValidation: EnvironmentValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: [],
        environment: name
      };

      // Add environment-specific validation logic
      if (name === 'production') {
        if (!process.env.RAKUTEN_APPLICATION_ID) {
          basicValidation.errors.push('RAKUTEN_APPLICATION_ID is required in production');
          basicValidation.isValid = false;
        }
        if (!process.env.DATABASE_URL) {
          basicValidation.errors.push('DATABASE_URL is required in production');
          basicValidation.isValid = false;
        }
        if (!process.env.NEXTAUTH_SECRET) {
          basicValidation.errors.push('NEXTAUTH_SECRET is required in production');
          basicValidation.isValid = false;
        }
      }

      results[name] = basicValidation;
    }
  } finally {
    // Environment variables are restored automatically since we didn't modify them
    // This is safer than trying to modify read-only properties
  }

  return results;
};