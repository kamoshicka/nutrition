import {
  searchRecipes,
  getRecipeCategories,
  RakutenApiError,
  RakutenApiErrorType
} from '../rakuten-recipe-api';
import { config } from '../config';
import { getCachedHealthStatus } from '../rakuten-health-monitor';

// Mock dependencies
jest.mock('../rakuten-health-monitor');

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  log: jest.spyOn(console, 'log').mockImplementation()
};

// Store original environment variables
const originalEnv = process.env;

describe('Rakuten Recipe API Error Handling - Core Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      RAKUTEN_APPLICATION_ID: 'test-api-key',
      NODE_ENV: 'test'
    };
    
    // Mock the config object directly
    Object.defineProperty(config, 'rakuten', {
      value: {
        applicationId: 'test-api-key',
        baseUrl: 'https://app.rakuten.co.jp/services/api',
        rateLimit: {
          requestsPerSecond: 5
        }
      },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(config, 'app', {
      value: {
        name: 'test-app',
        version: '1.0.0'
      },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(config, 'features', {
      value: {
        useMockRecipes: false
      },
      writable: true,
      configurable: true
    });
    
    (getCachedHealthStatus as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('RakutenApiError', () => {
    it('should create error with all properties', () => {
      const originalError = new Error('Original error');
      const error = new RakutenApiError(
        'Test error',
        RakutenApiErrorType.AUTHENTICATION,
        401,
        5000,
        originalError
      );

      expect(error.message).toBe('Test error');
      expect(error.type).toBe(RakutenApiErrorType.AUTHENTICATION);
      expect(error.statusCode).toBe(401);
      expect(error.retryAfter).toBe(5000);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('RakutenApiError');
    });
  });

  describe('Configuration Error Handling', () => {
    it('should handle missing API key in searchRecipes', async () => {
      // Mock config to have no API key
      Object.defineProperty(config, 'rakuten', {
        value: {
          applicationId: '',
          baseUrl: 'https://app.rakuten.co.jp/services/api',
          rateLimit: {
            requestsPerSecond: 5
          }
        },
        writable: true,
        configurable: true
      });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2);
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('API key not configured')
      );
    });

    it('should throw configuration error in getRecipeCategories', async () => {
      // Mock config to have no API key
      Object.defineProperty(config, 'rakuten', {
        value: {
          applicationId: '',
          baseUrl: 'https://app.rakuten.co.jp/services/api',
          rateLimit: {
            requestsPerSecond: 5
          }
        },
        writable: true,
        configurable: true
      });

      await expect(getRecipeCategories()).rejects.toThrow(
        'Recipe categories are not available: API key not configured'
      );
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle 401 authentication error and fallback to mock data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid API key'),
        headers: {
          get: () => null
        }
      });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2);
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Authentication error')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to mock data')
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw authentication error in getRecipeCategories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid API key'),
        headers: {
          get: () => null
        }
      });

      await expect(getRecipeCategories()).rejects.toThrow(
        'Recipe categories are not available: Invalid API key'
      );
    });
  });

  describe('Rate Limit Error Handling', () => {
    it('should handle 429 rate limit error and retry with success', async () => {
      const retryAfterSeconds = 1;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: () => Promise.resolve('Rate limit exceeded'),
          headers: {
            get: (name: string) => name === 'retry-after' ? retryAfterSeconds.toString() : null
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: [{ recipeId: 1, recipeTitle: 'Test Recipe' }] })
        });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(1);
      expect(result[0].recipeTitle).toBe('Test Recipe');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Rate limit exceeded')
      );
    }, 10000); // Increase timeout for retry test

    it('should fallback to mock data after max retries for rate limit', async () => {
      mockFetch
        .mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: () => Promise.resolve('Rate limit exceeded'),
          headers: {
            get: (name: string) => name === 'retry-after' ? '0.1' : null // Short retry time for test
          }
        });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Max retries
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to mock data')
      );
    }, 10000); // Increase timeout for retry test
  });

  describe('Network Error Handling', () => {
    it('should handle network timeout error and fallback to mock data', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Network issue')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to mock data')
      );
    });

    it('should handle fetch network error and fallback to mock data', async () => {
      const networkError = new TypeError('fetch failed');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Network issue')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to mock data')
      );
    });

    it('should retry on network errors and succeed', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: [{ recipeId: 1, recipeTitle: 'Test Recipe' }] })
        });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(1);
      expect(result[0].recipeTitle).toBe('Test Recipe');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 10000); // Increase timeout for retry test
  });

  describe('Service Unavailable Error Handling', () => {
    it('should handle 503 service unavailable with retry and success', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: () => Promise.resolve('Service temporarily unavailable'),
          headers: {
            get: (name: string) => name === 'retry-after' ? '0.1' : null // Short retry time for test
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: [{ recipeId: 1, recipeTitle: 'Test Recipe' }] })
        });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(1);
      expect(result[0].recipeTitle).toBe('Test Recipe');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Service unavailable')
      );
    }, 10000); // Increase timeout for retry test
  });

  describe('Invalid Response Error Handling', () => {
    it('should handle JSON parsing error and fallback to mock data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Unexpected error')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to mock data')
      );
    });
  });

  describe('Health Status Integration', () => {
    it('should warn when API is unhealthy but still make request', async () => {
      (getCachedHealthStatus as jest.Mock).mockReturnValue({
        isHealthy: false,
        error: 'API is down'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: [{ recipeId: 1, recipeTitle: 'Test Recipe' }] })
      });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(1);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('API is unhealthy'),
        'API is down'
      );
    });
  });

  describe('Error Logging', () => {
    it('should log authentication errors with appropriate level', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid API key'),
        headers: {
          get: () => null
        }
      });

      await searchRecipes('test');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Authentication error'),
        expect.objectContaining({
          context: expect.stringContaining('searchRecipes'),
          type: RakutenApiErrorType.AUTHENTICATION,
          statusCode: 401
        })
      );
    });

    it('should log rate limit errors with retry-after information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('Rate limit exceeded'),
        headers: {
          get: (name: string) => name === 'retry-after' ? '0.1' : null // Short retry time for test
        }
      });

      await searchRecipes('test');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Rate limit exceeded'),
        expect.objectContaining({
          context: expect.stringContaining('searchRecipes'),
          type: RakutenApiErrorType.RATE_LIMIT,
          statusCode: 429,
          retryAfter: 100 // 0.1 seconds = 100ms
        })
      );
    }, 10000); // Increase timeout for retry test
  });
});