/**
 * Startup Configuration Validation
 * 
 * This module provides startup validation that checks API key configuration
 * on application boot, implements warning and error logging for configuration
 * issues, and creates graceful startup behavior when API key is missing or invalid.
 */

import { config, validateConfig, generateConfigReport, getEnvironmentSpecificConfig } from './config';
import { environmentSetup, validateEnvironmentSpecificConfig } from './environment-setup';
import { logger } from '../../lib/logger';
import { 
  logApiKeyValidation, 
  logStartupSummary,
  type ApiKeyValidationLogEntry 
} from './rakuten-api-logger';

export interface StartupValidationResult {
  isValid: boolean;
  canStart: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  environment: string;
  configurationStatus: {
    rakutenApi: {
      configured: boolean;
      valid: boolean;
      usingMockData: boolean;
    };
    database: {
      configured: boolean;
      accessible: boolean;
    };
    authentication: {
      configured: boolean;
      valid: boolean;
    };
    payments: {
      configured: boolean;
      valid: boolean;
    };
  };
}

export interface StartupValidationOptions {
  exitOnError: boolean;
  logLevel: 'minimal' | 'detailed' | 'verbose';
  skipNonCritical: boolean;
  validateConnections: boolean;
}

/**
 * Startup Validation Class
 */
export class StartupValidator {
  private readonly options: StartupValidationOptions;
  private readonly environment: string;

  constructor(options: Partial<StartupValidationOptions> = {}) {
    this.options = {
      exitOnError: process.env.NODE_ENV === 'production',
      logLevel: process.env.NODE_ENV === 'production' ? 'minimal' : 'detailed',
      skipNonCritical: false,
      validateConnections: true,
      ...options
    };
    this.environment = getEnvironmentSpecificConfig().environment;
  }

  /**
   * Performs comprehensive startup validation
   */
  async validateStartup(): Promise<StartupValidationResult> {
    const startTime = Date.now();
    
    logger.info('Starting application configuration validation', {
      environment: this.environment,
      type: 'startup_validation'
    });

    const result: StartupValidationResult = {
      isValid: true,
      canStart: true,
      errors: [],
      warnings: [],
      recommendations: [],
      environment: this.environment,
      configurationStatus: {
        rakutenApi: {
          configured: false,
          valid: false,
          usingMockData: true
        },
        database: {
          configured: false,
          accessible: false
        },
        authentication: {
          configured: false,
          valid: false
        },
        payments: {
          configured: false,
          valid: false
        }
      }
    };

    try {
      // 1. Validate environment variables
      await this.validateEnvironmentVariables(result);

      // 2. Validate Rakuten API configuration
      await this.validateRakutenApiConfiguration(result);

      // 3. Validate database configuration
      await this.validateDatabaseConfiguration(result);

      // 4. Validate authentication configuration
      await this.validateAuthenticationConfiguration(result);

      // 5. Validate payment configuration (if required)
      await this.validatePaymentConfiguration(result);

      // 6. Validate connections (if enabled)
      if (this.options.validateConnections) {
        await this.validateConnections(result);
      }

      // Determine overall validation status
      result.isValid = result.errors.length === 0;
      result.canStart = this.determineCanStart(result);

      // Log validation results
      await this.logValidationResults(result, Date.now() - startTime);

      // Log startup summary using Rakuten API logger
      logStartupSummary({
        hasApiKey: result.configurationStatus.rakutenApi.configured,
        isValidApiKey: result.configurationStatus.rakutenApi.valid,
        useMockData: result.configurationStatus.rakutenApi.usingMockData,
        environment: this.environment,
        healthChecksEnabled: config.rakuten.monitoring.enableHealthChecks,
        logLevel: config.rakuten.monitoring.logLevel,
      });

      // Handle validation failure
      if (!result.canStart && this.options.exitOnError) {
        await this.handleValidationFailure(result);
      }

    } catch (error) {
      logger.error('Startup validation failed with exception', {
        environment: this.environment,
        type: 'startup_validation_error'
      }, error as Error);

      result.isValid = false;
      result.canStart = false;
      result.errors.push(`Validation exception: ${(error as Error).message}`);

      if (this.options.exitOnError) {
        await this.handleValidationFailure(result);
      }
    }

    return result;
  }

  /**
   * Validates environment variables
   */
  private async validateEnvironmentVariables(result: StartupValidationResult): Promise<void> {
    try {
      const envValidation = validateEnvironmentSpecificConfig();
      
      result.errors.push(...envValidation.errors);
      result.warnings.push(...envValidation.warnings);
      result.recommendations.push(...envValidation.recommendations);

      if (!envValidation.isValid) {
        logger.warn('Environment variable validation failed', {
          environment: this.environment,
          errors: envValidation.errors,
          type: 'env_validation'
        });
      }

    } catch (error) {
      const errorMessage = `Environment validation error: ${(error as Error).message}`;
      result.errors.push(errorMessage);
      logger.error('Environment validation exception', {
        environment: this.environment,
        type: 'env_validation_error'
      }, error as Error);
    }
  }

  /**
   * Validates Rakuten API configuration
   */
  private async validateRakutenApiConfiguration(result: StartupValidationResult): Promise<void> {
    try {
      const rakutenConfig = config.rakuten;
      const apiStatus = result.configurationStatus.rakutenApi;

      // Check if API key is configured
      apiStatus.configured = !!rakutenConfig.applicationId;
      apiStatus.valid = rakutenConfig.validation.isValid;
      apiStatus.usingMockData = rakutenConfig.fallback.useMockData;

      // Requirement 1.1: WHEN the system starts THEN it SHALL read the RAKUTEN_APPLICATION_ID from environment variables
      const envApiKey = process.env.RAKUTEN_APPLICATION_ID;
      logger.info('Reading Rakuten API key from environment variables', {
        environment: this.environment,
        hasApiKey: !!envApiKey,
        apiKeyLength: envApiKey?.length || 0,
        type: 'rakuten_env_read'
      });

      // Log startup API key validation using structured logging
      const startupLogEntry: ApiKeyValidationLogEntry = {
        validationType: 'startup',
        isValid: apiStatus.valid,
        hasApiKey: apiStatus.configured,
        environment: this.environment,
        error: !apiStatus.configured ? 'API key not configured' : 
               !apiStatus.valid ? 'API key format invalid' : undefined,
      };
      logApiKeyValidation(startupLogEntry);

      if (!apiStatus.configured) {
        // Requirement 1.3: WHEN the RAKUTEN_APPLICATION_ID is missing or empty THEN the system SHALL fall back to mock recipe data
        // Requirement 2.3: WHEN the API key is missing THEN the system SHALL provide helpful error messages with setup instructions
        if (this.environment === 'production') {
          result.errors.push('Rakuten API key is required in production environment');
          result.recommendations.push('Configure RAKUTEN_APPLICATION_ID environment variable');
          result.recommendations.push('Visit https://webservice.rakuten.co.jp/ to obtain an API key');
        } else {
          result.warnings.push(`Rakuten API key not configured in ${this.environment} environment - falling back to mock data`);
          result.recommendations.push('Set RAKUTEN_APPLICATION_ID to use real recipe data');
          result.recommendations.push('Visit https://webservice.rakuten.co.jp/ to obtain an API key');
          
          // Requirement 2.4: WHEN running in development mode THEN the system SHALL clearly indicate whether real or mock data is being used
          logger.warn('Development mode: Using mock recipe data due to missing API key', {
            environment: this.environment,
            usingMockData: true,
            type: 'mock_data_fallback'
          });
        }
      } else if (!apiStatus.valid) {
        // Requirement 1.5: IF the API key format is invalid THEN the system SHALL log a warning and use mock data
        const warningMessage = 'Rakuten API key format is invalid - falling back to mock data';
        if (this.environment === 'production') {
          result.errors.push('Rakuten API key format is invalid');
        } else {
          result.warnings.push(warningMessage);
        }
        result.recommendations.push('Verify RAKUTEN_APPLICATION_ID is exactly 20 alphanumeric characters');
        
        logger.warn('Invalid API key format detected', {
          environment: this.environment,
          apiKeyLength: envApiKey?.length || 0,
          usingMockData: true,
          type: 'invalid_api_key_format'
        });
      } else {
        // API key is configured and valid
        logger.info('Rakuten API key is configured and valid', {
          environment: this.environment,
          usingMockData: apiStatus.usingMockData,
          type: 'valid_api_key'
        });
        
        // Requirement 2.4: Clearly indicate data source in development
        if (this.environment === 'development') {
          if (apiStatus.usingMockData) {
            logger.info('Development mode: Using mock data despite valid API key (USE_MOCK_RECIPES=true)', {
              environment: this.environment,
              type: 'mock_data_override'
            });
          } else {
            logger.info('Development mode: Using real Rakuten API data', {
              environment: this.environment,
              type: 'real_api_data'
            });
          }
        }
      }

      // Log API configuration status
      logger.info('Rakuten API configuration validated', {
        environment: this.environment,
        configured: apiStatus.configured,
        valid: apiStatus.valid,
        usingMockData: apiStatus.usingMockData,
        type: 'rakuten_config_validation'
      });

    } catch (error) {
      const errorMessage = `Rakuten API validation error: ${(error as Error).message}`;
      result.errors.push(errorMessage);
      logger.error('Rakuten API validation exception', {
        environment: this.environment,
        type: 'rakuten_validation_error'
      }, error as Error);
    }
  }

  /**
   * Validates database configuration
   */
  private async validateDatabaseConfiguration(result: StartupValidationResult): Promise<void> {
    try {
      const dbStatus = result.configurationStatus.database;
      const databaseUrl = process.env.DATABASE_URL;

      dbStatus.configured = !!databaseUrl;

      if (!dbStatus.configured) {
        result.errors.push('Database URL is not configured');
        result.recommendations.push('Set DATABASE_URL environment variable');
      } else {
        // Basic database URL validation
        if (databaseUrl.startsWith('./') || databaseUrl.startsWith('/')) {
          // SQLite file path
          dbStatus.accessible = true; // We'll assume file-based DB is accessible
        } else {
          // URL-based database
          try {
            new URL(databaseUrl);
            dbStatus.accessible = true;
          } catch {
            result.errors.push('Database URL format is invalid');
            dbStatus.accessible = false;
          }
        }
      }

      logger.info('Database configuration validated', {
        environment: this.environment,
        configured: dbStatus.configured,
        accessible: dbStatus.accessible,
        type: 'database_config_validation'
      });

    } catch (error) {
      const errorMessage = `Database validation error: ${(error as Error).message}`;
      result.errors.push(errorMessage);
      logger.error('Database validation exception', {
        environment: this.environment,
        type: 'database_validation_error'
      }, error as Error);
    }
  }

  /**
   * Validates authentication configuration
   */
  private async validateAuthenticationConfiguration(result: StartupValidationResult): Promise<void> {
    try {
      const authStatus = result.configurationStatus.authentication;
      const nextAuthSecret = process.env.NEXTAUTH_SECRET;
      const nextAuthUrl = process.env.NEXTAUTH_URL;

      authStatus.configured = !!nextAuthSecret;
      authStatus.valid = authStatus.configured && nextAuthSecret.length >= 32;

      if (!authStatus.configured) {
        result.errors.push('NextAuth secret is not configured');
        result.recommendations.push('Set NEXTAUTH_SECRET environment variable (minimum 32 characters)');
      } else if (!authStatus.valid) {
        result.errors.push('NextAuth secret is too short (minimum 32 characters required)');
        result.recommendations.push('Generate a longer NEXTAUTH_SECRET');
      }

      // Validate NextAuth URL in production
      if (this.environment === 'production' && !nextAuthUrl) {
        result.warnings.push('NEXTAUTH_URL is not set in production');
        result.recommendations.push('Set NEXTAUTH_URL to your production domain');
      }

      logger.info('Authentication configuration validated', {
        environment: this.environment,
        configured: authStatus.configured,
        valid: authStatus.valid,
        type: 'auth_config_validation'
      });

    } catch (error) {
      const errorMessage = `Authentication validation error: ${(error as Error).message}`;
      result.errors.push(errorMessage);
      logger.error('Authentication validation exception', {
        environment: this.environment,
        type: 'auth_validation_error'
      }, error as Error);
    }
  }

  /**
   * Validates payment configuration
   */
  private async validatePaymentConfiguration(result: StartupValidationResult): Promise<void> {
    try {
      const paymentStatus = result.configurationStatus.payments;
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const stripePriceId = process.env.STRIPE_PRICE_ID;

      paymentStatus.configured = !!(stripeSecretKey && stripePublishableKey && stripePriceId);
      paymentStatus.valid = paymentStatus.configured;

      // Validate Stripe key formats
      if (stripeSecretKey) {
        const isTestKey = stripeSecretKey.startsWith('sk_test_');
        const isLiveKey = stripeSecretKey.startsWith('sk_live_');
        
        if (!isTestKey && !isLiveKey) {
          result.errors.push('Stripe secret key format is invalid');
          paymentStatus.valid = false;
        } else if (this.environment === 'production' && isTestKey) {
          result.errors.push('Production environment is using test Stripe keys');
          result.recommendations.push('Configure live Stripe keys for production');
          paymentStatus.valid = false;
        } else if (this.environment !== 'production' && isLiveKey) {
          result.warnings.push(`${this.environment} environment is using live Stripe keys`);
          result.recommendations.push('Consider using test Stripe keys for non-production environments');
        }
      }

      if (stripePublishableKey) {
        const isTestKey = stripePublishableKey.startsWith('pk_test_');
        const isLiveKey = stripePublishableKey.startsWith('pk_live_');
        
        if (!isTestKey && !isLiveKey) {
          result.errors.push('Stripe publishable key format is invalid');
          paymentStatus.valid = false;
        }
      }

      // Payment configuration is optional in development
      if (!paymentStatus.configured && this.environment === 'production') {
        result.errors.push('Payment configuration is required in production');
        result.recommendations.push('Configure Stripe keys and price ID for payment processing');
      } else if (!paymentStatus.configured) {
        result.warnings.push(`Payment configuration not set in ${this.environment} environment`);
        result.recommendations.push('Configure Stripe keys to test payment functionality');
      }

      logger.info('Payment configuration validated', {
        environment: this.environment,
        configured: paymentStatus.configured,
        valid: paymentStatus.valid,
        type: 'payment_config_validation'
      });

    } catch (error) {
      const errorMessage = `Payment validation error: ${(error as Error).message}`;
      result.errors.push(errorMessage);
      logger.error('Payment validation exception', {
        environment: this.environment,
        type: 'payment_validation_error'
      }, error as Error);
    }
  }

  /**
   * Validates external service connections
   */
  private async validateConnections(result: StartupValidationResult): Promise<void> {
    if (this.options.skipNonCritical) {
      return;
    }

    try {
      // Test Rakuten API connection if configured
      if (result.configurationStatus.rakutenApi.configured && result.configurationStatus.rakutenApi.valid) {
        try {
          // Import and use the health monitor
          const { checkApiHealth } = await import('./rakuten-health-monitor');
          const healthStatus = await checkApiHealth();
          
          if (!healthStatus.isHealthy) {
            result.warnings.push('Rakuten API health check failed');
            result.recommendations.push('Verify Rakuten API key and network connectivity');
            
            logger.warn('Rakuten API health check failed at startup', {
              environment: this.environment,
              error: healthStatus.error,
              type: 'rakuten_health_check'
            });
          } else {
            logger.info('Rakuten API health check passed', {
              environment: this.environment,
              responseTime: healthStatus.responseTime,
              type: 'rakuten_health_check'
            });
          }
        } catch (error) {
          result.warnings.push('Could not perform Rakuten API health check');
          logger.warn('Rakuten API health check exception', {
            environment: this.environment,
            type: 'rakuten_health_check_error'
          }, error as Error);
        }
      }

    } catch (error) {
      logger.warn('Connection validation failed', {
        environment: this.environment,
        type: 'connection_validation_error'
      }, error as Error);
    }
  }

  /**
   * Determines if the application can start based on validation results
   */
  private determineCanStart(result: StartupValidationResult): boolean {
    // Critical errors that prevent startup
    const criticalErrors = result.errors.filter(error => 
      error.includes('required in production') ||
      error.includes('Database URL is not configured') ||
      error.includes('NextAuth secret is not configured')
    );

    // In production, any critical error prevents startup
    if (this.environment === 'production' && criticalErrors.length > 0) {
      return false;
    }

    // In non-production, only database and auth errors prevent startup
    const blockingErrors = result.errors.filter(error =>
      error.includes('Database URL is not configured') ||
      error.includes('NextAuth secret is not configured')
    );

    return blockingErrors.length === 0;
  }

  /**
   * Logs validation results based on configured log level
   */
  private async logValidationResults(result: StartupValidationResult, duration: number): Promise<void> {
    const logMeta = {
      environment: this.environment,
      duration,
      isValid: result.isValid,
      canStart: result.canStart,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      type: 'startup_validation_complete'
    };

    if (this.options.logLevel === 'verbose' || (!result.isValid && this.options.logLevel !== 'minimal')) {
      // Generate and log detailed configuration report
      const configReport = generateConfigReport();
      logger.info('Startup validation completed with detailed report', {
        ...logMeta,
        configReport
      });
    } else if (this.options.logLevel === 'detailed') {
      logger.info('Startup validation completed', {
        ...logMeta,
        errors: result.errors,
        warnings: result.warnings,
        recommendations: result.recommendations
      });
    } else {
      // Minimal logging
      if (result.canStart) {
        logger.info('Application startup validation passed', logMeta);
      } else {
        logger.error('Application startup validation failed', {
          ...logMeta,
          criticalErrors: result.errors
        });
      }
    }

    // Always log configuration status summary
    logger.info('Configuration status summary', {
      environment: this.environment,
      rakutenApi: result.configurationStatus.rakutenApi,
      database: result.configurationStatus.database,
      authentication: result.configurationStatus.authentication,
      payments: result.configurationStatus.payments,
      type: 'config_status_summary'
    });
  }

  /**
   * Handles validation failure by logging and optionally exiting
   */
  private async handleValidationFailure(result: StartupValidationResult): Promise<void> {
    logger.error('Application cannot start due to configuration errors', {
      environment: this.environment,
      errors: result.errors,
      canStart: result.canStart,
      type: 'startup_failure'
    });

    // In production, exit the process
    if (this.environment === 'production') {
      console.error('\n❌ Application startup failed due to configuration errors:');
      result.errors.forEach(error => console.error(`  • ${error}`));
      
      if (result.recommendations.length > 0) {
        console.error('\n💡 Recommendations:');
        result.recommendations.forEach(rec => console.error(`  • ${rec}`));
      }
      
      console.error('\nPlease fix the configuration errors and restart the application.\n');
      process.exit(1);
    }
  }
}

// Export singleton instance with default options
export const startupValidator = new StartupValidator();

/**
 * Main startup validation function
 */
export async function validateApplicationStartup(options?: Partial<StartupValidationOptions>): Promise<StartupValidationResult> {
  const validator = options ? new StartupValidator(options) : startupValidator;
  return await validator.validateStartup();
}

/**
 * Quick startup check for development
 */
export async function quickStartupCheck(): Promise<boolean> {
  try {
    const result = await validateApplicationStartup({
      exitOnError: false,
      logLevel: 'minimal',
      skipNonCritical: true,
      validateConnections: false
    });
    return result.canStart;
  } catch (error) {
    logger.error('Quick startup check failed', {
      type: 'quick_startup_check_error'
    }, error as Error);
    return false;
  }
}

/**
 * Graceful startup with fallback behavior
 */
export async function gracefulStartup(): Promise<void> {
  try {
    const result = await validateApplicationStartup({
      exitOnError: false,
      logLevel: 'detailed',
      skipNonCritical: false,
      validateConnections: true
    });

    if (!result.canStart) {
      logger.warn('Application starting with configuration issues', {
        environment: result.environment,
        errors: result.errors,
        warnings: result.warnings,
        type: 'graceful_startup_warning'
      });

      // Enable fallback modes
      if (!result.configurationStatus.rakutenApi.valid) {
        logger.info('Enabling mock recipe data due to Rakuten API configuration issues', {
          type: 'fallback_mode_enabled'
        });
      }
    } else {
      logger.info('Application started successfully', {
        environment: result.environment,
        type: 'successful_startup'
      });
    }

  } catch (error) {
    logger.error('Graceful startup failed', {
      type: 'graceful_startup_error'
    }, error as Error);
    
    // Continue with fallback configuration
    logger.warn('Continuing with fallback configuration', {
      type: 'fallback_startup'
    });
  }
}