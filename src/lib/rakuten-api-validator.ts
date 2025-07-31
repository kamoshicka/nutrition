/**
 * Rakuten API Key Validation Service
 * 
 * This service provides comprehensive validation for Rakuten API keys including:
 * - Format validation
 * - Connection testing with actual API calls
 * - Setup instruction generation for different environments
 */

import { config } from './config';
import { 
  logApiKeyValidation, 
  createTimer,
  type ApiKeyValidationLogEntry 
} from './rakuten-api-logger';

// Validation result interfaces
export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    rateLimitRemaining?: number;
    accountType?: string;
    permissions?: string[];
    responseTime?: number;
  };
}

export interface SetupInstructions {
  environment: string;
  steps: string[];
  environmentVariables: Record<string, string>;
  troubleshooting: string[];
  links: {
    title: string;
    url: string;
  }[];
}

export interface ConnectionTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
  };
}

/**
 * API Key Validator Class
 */
export class ApiKeyValidator {
  private readonly RAKUTEN_API_KEY_PATTERN = /^[a-zA-Z0-9]{20}$/;
  private readonly TEST_ENDPOINT = '/Recipe/CategoryList/20170426';
  private readonly CONNECTION_TIMEOUT = 10000; // 10 seconds

  /**
   * Validates the format of a Rakuten API key
   * @param apiKey - The API key to validate
   * @returns boolean indicating if the format is valid
   */
  validateFormat(apiKey: string): boolean {
    const timer = createTimer();
    const hasApiKey = !!(apiKey && typeof apiKey === 'string');
    
    // Rakuten API keys are typically 20 characters of alphanumeric characters
    // We don't trim here to ensure exact format validation
    const isValid = hasApiKey && this.RAKUTEN_API_KEY_PATTERN.test(apiKey);
    
    // Log the validation attempt
    const logEntry: ApiKeyValidationLogEntry = {
      validationType: 'format',
      isValid,
      hasApiKey,
      environment: config.app.environment,
      responseTime: timer.end(),
      error: !isValid ? (hasApiKey ? 'Invalid API key format' : 'API key not provided') : undefined,
    };
    
    logApiKeyValidation(logEntry);
    
    return isValid;
  }

  /**
   * Tests the connection to Rakuten API with the provided API key
   * @param apiKey - The API key to test
   * @returns Promise<ConnectionTestResult> with connection test results
   */
  async testConnection(apiKey: string): Promise<ConnectionTestResult> {
    const timer = createTimer();
    const hasApiKey = !!(apiKey && typeof apiKey === 'string');

    try {
      // Validate format first (this will also log the format validation)
      if (!this.validateFormat(apiKey)) {
        const result = {
          success: false,
          responseTime: timer.end(),
          error: 'Invalid API key format. Expected 20 alphanumeric characters.',
        };
        
        // Log the connection test failure
        const logEntry: ApiKeyValidationLogEntry = {
          validationType: 'connection',
          isValid: false,
          hasApiKey,
          environment: config.app.environment,
          responseTime: result.responseTime,
          error: result.error,
        };
        logApiKeyValidation(logEntry);
        
        return result;
      }

      // Prepare test request
      const searchParams = new URLSearchParams({
        applicationId: apiKey,
        format: 'json',
      });

      const url = `${config.rakuten.baseUrl}${this.TEST_ENDPOINT}?${searchParams.toString()}`;

      // Make test request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.CONNECTION_TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `${config.app.name}/${config.app.version}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = timer.end();

      // Handle different response statuses
      if (response.ok) {
        // Try to parse the response to ensure it's valid
        const data = await response.json();
        
        const result = {
          success: true,
          responseTime,
          rateLimitInfo: this.extractRateLimitInfo(response),
        };
        
        // Log successful connection test
        const logEntry: ApiKeyValidationLogEntry = {
          validationType: 'connection',
          isValid: true,
          hasApiKey: true,
          environment: config.app.environment,
          responseTime,
        };
        logApiKeyValidation(logEntry);
        
        return result;
      } else {
        let errorMessage = `API request failed with status ${response.status}`;
        
        switch (response.status) {
          case 401:
            errorMessage = 'Invalid API key. Please check your RAKUTEN_APPLICATION_ID.';
            break;
          case 403:
            errorMessage = 'API key does not have permission to access this endpoint.';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded. Please wait before making more requests.';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Rakuten API server error. Please try again later.';
            break;
        }

        const result = {
          success: false,
          responseTime,
          error: errorMessage,
          statusCode: response.status,
          rateLimitInfo: this.extractRateLimitInfo(response),
        };
        
        // Log failed connection test
        const logEntry: ApiKeyValidationLogEntry = {
          validationType: 'connection',
          isValid: false,
          hasApiKey: true,
          environment: config.app.environment,
          responseTime,
          error: errorMessage,
        };
        logApiKeyValidation(logEntry);
        
        return result;
      }
    } catch (error) {
      const responseTime = timer.end();
      let errorMessage = 'Unknown error occurred during connection test.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Connection timeout after ${this.CONNECTION_TIMEOUT}ms. Please check your network connection.`;
        } else {
          errorMessage = `Network error: ${error.message}`;
        }
      }

      const result = {
        success: false,
        responseTime,
        error: errorMessage,
      };
      
      // Log connection test error
      const logEntry: ApiKeyValidationLogEntry = {
        validationType: 'connection',
        isValid: false,
        hasApiKey,
        environment: config.app.environment,
        responseTime,
        error: errorMessage,
      };
      logApiKeyValidation(logEntry);
      
      return result;
    }
  }

  /**
   * Validates API key with both format and connection testing
   * @param apiKey - The API key to validate
   * @returns Promise<ApiKeyValidationResult> with comprehensive validation results
   */
  async validateConnection(apiKey: string): Promise<ApiKeyValidationResult> {
    // First check format
    if (!this.validateFormat(apiKey)) {
      return {
        isValid: false,
        error: 'Invalid API key format. Rakuten API keys must be exactly 20 alphanumeric characters.',
      };
    }

    // Then test connection
    const connectionResult = await this.testConnection(apiKey);
    
    if (connectionResult.success) {
      return {
        isValid: true,
        details: {
          responseTime: connectionResult.responseTime,
          rateLimitRemaining: connectionResult.rateLimitInfo?.remaining,
        },
      };
    } else {
      return {
        isValid: false,
        error: connectionResult.error,
      };
    }
  }

  /**
   * Generates setup instructions for different environments
   * @param environment - The target environment ('development', 'staging', 'production')
   * @returns SetupInstructions with detailed setup guidance
   */
  getSetupInstructions(environment: 'development' | 'staging' | 'production' = 'development'): SetupInstructions {
    const baseSteps = [
      '1. Visit the Rakuten Web Service portal at https://webservice.rakuten.co.jp/',
      '2. Create a free account or log in to your existing account',
      '3. Navigate to "アプリID発行" (Application ID Issuance)',
      '4. Register a new application with the following details:',
      '   - Application Name: Your app name (e.g., "Healthcare Food App")',
      '   - Application URL: Your application URL',
      '   - Application Description: Brief description of your app',
      '5. After registration, you will receive a 20-character Application ID',
      '6. Copy this Application ID for use as your RAKUTEN_APPLICATION_ID',
    ];

    const environmentSpecificSteps: Record<string, string[]> = {
      development: [
        ...baseSteps,
        '7. Create a .env.local file in your project root',
        '8. Add the following line: RAKUTEN_APPLICATION_ID=your_20_character_key_here',
        '9. Optionally set USE_MOCK_RECIPES=false to use real API data',
        '10. Restart your development server',
      ],
      staging: [
        ...baseSteps,
        '7. Set the RAKUTEN_APPLICATION_ID environment variable in your staging environment',
        '8. Ensure USE_MOCK_RECIPES is set to false for real data testing',
        '9. Configure rate limiting appropriately for staging load',
        '10. Test the API integration thoroughly before promoting to production',
      ],
      production: [
        ...baseSteps,
        '7. Set the RAKUTEN_APPLICATION_ID environment variable in your production environment',
        '8. Ensure the API key is kept secure and not exposed in logs',
        '9. Configure appropriate rate limiting (recommended: 5 requests/second)',
        '10. Set up monitoring and alerting for API failures',
        '11. Consider implementing caching to reduce API usage',
      ],
    };

    const environmentVariables: Record<string, Record<string, string>> = {
      development: {
        'RAKUTEN_APPLICATION_ID': 'your_20_character_api_key_here',
        'USE_MOCK_RECIPES': 'false (optional, set to true to use mock data)',
        'RAKUTEN_RATE_LIMIT_RPS': '5 (optional, requests per second)',
        'RAKUTEN_API_TIMEOUT': '10000 (optional, timeout in milliseconds)',
      },
      staging: {
        'RAKUTEN_APPLICATION_ID': 'your_20_character_api_key_here',
        'USE_MOCK_RECIPES': 'false',
        'RAKUTEN_RATE_LIMIT_RPS': '5',
        'RAKUTEN_ENABLE_HEALTH_CHECKS': 'true',
      },
      production: {
        'RAKUTEN_APPLICATION_ID': 'your_20_character_api_key_here',
        'USE_MOCK_RECIPES': 'false',
        'RAKUTEN_RATE_LIMIT_RPS': '5',
        'RAKUTEN_ENABLE_HEALTH_CHECKS': 'true',
        'RAKUTEN_API_TIMEOUT': '10000',
      },
    };

    const troubleshooting = [
      'If you get "Invalid API key" errors, verify the key is exactly 20 characters',
      'If you get rate limit errors, reduce RAKUTEN_RATE_LIMIT_RPS or implement caching',
      'If you get timeout errors, increase RAKUTEN_API_TIMEOUT value',
      'If the API is unreachable, the app will automatically fall back to mock data',
      'Check the browser console or server logs for detailed error messages',
      'Ensure your API key has the necessary permissions for Recipe API access',
    ];

    return {
      environment,
      steps: environmentSpecificSteps[environment] || environmentSpecificSteps.development,
      environmentVariables: environmentVariables[environment] || environmentVariables.development,
      troubleshooting,
      links: [
        {
          title: 'Rakuten Web Service Portal',
          url: 'https://webservice.rakuten.co.jp/',
        },
        {
          title: 'Rakuten Recipe API Documentation',
          url: 'https://webservice.rakuten.co.jp/api/recipeapi/',
        },
        {
          title: 'API Usage Guidelines',
          url: 'https://webservice.rakuten.co.jp/guide/',
        },
      ],
    };
  }

  /**
   * Extracts rate limit information from response headers
   * @param response - The fetch response object
   * @returns Rate limit information if available
   */
  private extractRateLimitInfo(response: Response): { remaining: number; resetTime: Date } | undefined {
    // Rakuten API doesn't typically provide rate limit headers,
    // but we'll check for common patterns
    const remaining = response.headers.get('X-RateLimit-Remaining') || 
                     response.headers.get('X-Rate-Limit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset') || 
                  response.headers.get('X-Rate-Limit-Reset');

    if (remaining && reset) {
      return {
        remaining: parseInt(remaining, 10),
        resetTime: new Date(parseInt(reset, 10) * 1000),
      };
    }

    return undefined;
  }
}

// Export a singleton instance for convenience
export const apiKeyValidator = new ApiKeyValidator();

// Export utility functions for backward compatibility
export const validateRakutenApiKeyFormat = (apiKey: string): boolean => {
  return apiKeyValidator.validateFormat(apiKey);
};

export const testRakutenApiConnection = async (apiKey: string): Promise<ConnectionTestResult> => {
  return apiKeyValidator.testConnection(apiKey);
};

export const validateRakutenApiKey = async (apiKey: string): Promise<ApiKeyValidationResult> => {
  return apiKeyValidator.validateConnection(apiKey);
};

export const getRakutenSetupInstructions = (environment?: 'development' | 'staging' | 'production'): SetupInstructions => {
  return apiKeyValidator.getSetupInstructions(environment);
};