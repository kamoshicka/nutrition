/**
 * Centralized configuration management
 * Handles environment variables and application settings
 */

import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Application URLs
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'STRIPE_PUBLISHABLE_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PRICE_ID: z.string().min(1, 'STRIPE_PRICE_ID is required'),
  
  // External APIs
  RAKUTEN_APPLICATION_ID: z.string().optional(),
  USE_MOCK_RECIPES: z.string().default('false').transform(val => val === 'true'),
  
  // Security
  BCRYPT_ROUNDS: z.string().default('12').transform(val => parseInt(val, 10)),
  
  // Monitoring and Analytics
  ENABLE_ANALYTICS: z.string().default('false').transform(val => val === 'true'),
  ENABLE_ERROR_REPORTING: z.string().default('false').transform(val => val === 'true'),
  ENABLE_PERFORMANCE_MONITORING: z.string().default('false').transform(val => val === 'true'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
  
  // External Services
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(val => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(val => parseInt(val, 10)),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  
  // SSL/Security
  FORCE_HTTPS: z.string().default('false').transform(val => val === 'true'),
  
  // Cache
  REDIS_URL: z.string().optional(),
  ENABLE_REDIS_CACHE: z.string().default('false').transform(val => val === 'true'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Backup
  ENABLE_AUTOMATED_BACKUPS: z.string().default('false').transform(val => val === 'true'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.string().default('30').transform(val => parseInt(val, 10)),
  
  // Health Check
  HEALTH_CHECK_ENDPOINT: z.string().default('/api/health'),
  HEALTH_CHECK_TIMEOUT: z.string().default('5000').transform(val => parseInt(val, 10)),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter(err => err.code === 'invalid_type' && (err as any).received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.issues
        .filter(err => err.code !== 'invalid_type' || (err as any).received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      console.error('❌ Environment variable validation failed:');
      
      if (missingVars.length > 0) {
        console.error('\nMissing required variables:');
        missingVars.forEach(var_ => console.error(`  - ${var_}`));
      }
      
      if (invalidVars.length > 0) {
        console.error('\nInvalid variables:');
        invalidVars.forEach(var_ => console.error(`  - ${var_}`));
      }
      
      throw new Error('Environment validation failed');
    }
    throw error;
  }
}

// Export validated configuration
export const config = parseEnv();

// Convenience exports for common configurations
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Database configuration
export const dbConfig = {
  url: config.DATABASE_URL,
  // Add connection pool settings for production
  ...(isProduction && {
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    }
  })
};

// Stripe configuration
export const stripeConfig = {
  secretKey: config.STRIPE_SECRET_KEY,
  publishableKey: config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: config.STRIPE_WEBHOOK_SECRET,
  priceId: config.STRIPE_PRICE_ID,
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
};

// CORS configuration
export const corsConfig = {
  origin: config.ALLOWED_ORIGINS ? config.ALLOWED_ORIGINS.split(',') : undefined,
  credentials: true,
};

// Email configuration
export const emailConfig = config.SMTP_HOST ? {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT || 587,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD,
  },
  from: config.FROM_EMAIL,
} : null;

// Feature flags
export const features = {
  analytics: config.ENABLE_ANALYTICS,
  errorReporting: config.ENABLE_ERROR_REPORTING,
  performanceMonitoring: config.ENABLE_PERFORMANCE_MONITORING,
  redisCache: config.ENABLE_REDIS_CACHE,
  automatedBackups: config.ENABLE_AUTOMATED_BACKUPS,
  mockRecipes: config.USE_MOCK_RECIPES,
};

// Security configuration
export const securityConfig = {
  bcryptRounds: config.BCRYPT_ROUNDS,
  forceHttps: config.FORCE_HTTPS,
  corsOrigins: corsConfig.origin,
};

// Monitoring configuration
export const monitoringConfig = {
  sentryDsn: config.SENTRY_DSN,
  gaTrackingId: config.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  healthCheckEndpoint: config.HEALTH_CHECK_ENDPOINT,
  healthCheckTimeout: config.HEALTH_CHECK_TIMEOUT,
};

// Logging configuration
export const loggingConfig = {
  level: config.LOG_LEVEL,
  format: config.LOG_FORMAT,
};

// Validate critical production settings
if (isProduction) {
  // Ensure HTTPS is enforced in production
  if (!config.FORCE_HTTPS && config.NEXTAUTH_URL.startsWith('http://')) {
    console.warn('⚠️  WARNING: HTTPS not enforced in production environment');
  }
  
  // Ensure strong bcrypt rounds in production
  if (config.BCRYPT_ROUNDS < 12) {
    console.warn('⚠️  WARNING: bcrypt rounds should be at least 12 in production');
  }
  
  // Ensure error reporting is enabled in production
  if (!config.ENABLE_ERROR_REPORTING) {
    console.warn('⚠️  WARNING: Error reporting is disabled in production');
  }
}

// Export configuration validation function for runtime checks
export function validateConfig(): boolean {
  try {
    parseEnv();
    return true;
  } catch (error) {
    return false;
  }
}