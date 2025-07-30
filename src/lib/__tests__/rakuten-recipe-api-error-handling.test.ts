import {
  searchRecipes,
  getRecipeCategories,
  getRecipesByFoodName,
  getRecipeRanking,
  getRecipeById,
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

describe('Rakuten Recipe API Error Handling', () => {
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
      (config as any).rakuten.applicationId = '';

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2);
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('API key not configured')
      );
    });

    it('should throw configuration error in getRecipeCategories', async () => {
      (config as any).rakuten.applicationId = '';

      await expect(getRecipeCategories()).rejects.toThrow(
        'Recipe categories are not available: API key not configured'
      );
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle 401 authentication error with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: () => Promise.resolve('Invalid API key'),
          headers: {
            get: () => null
          }
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: () => Promise.resolve('Invalid API key'),
          headers: {
            get: () => null
          }
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: () => Promise.resolve('Invalid API key'),
          headers: {
            get: () => null
          }
        });

      const result = await searchRecipes('test');

      // Should fallback to mock data after authentication errors
      expect(result).toHaveLength(2);
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error')
      );
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for auth errors
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
    it('should handle 429 rate limit error with retry', async () => {
      const retryAfterSeconds = 2;
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

      const startTime = Date.now();
      const result = await searchRecipes('test');
      const endTime = Date.now();

      expect(result).toHaveLength(1);
      expect(result[0].recipeTitle).toBe('Test Recipe');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Should have waited for retry-after period (allowing some tolerance)
      expect(endTime - startTime).toBeGreaterThanOrEqual(retryAfterSeconds * 1000 - 100);
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
    });

    it('should fallback to mock data after max retries for rate limit', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: () => Promise.resolve('Rate limit exceeded'),
          headers: {
            get: (name: string) => name === 'retry-after' ? '1' : null
          }
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: () => Promise.resolve('Rate limit exceeded'),
          headers: {
            get: (name: string) => name === 'retry-after' ? '1' : null
          }
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: () => Promise.resolve('Rate limit exceeded'),
          headers: {
            get: (name: string) => name === 'retry-after' ? '1' : null
          }
        });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Max retries
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to mock data')
      );
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network timeout error', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Network issue')
      );
    });

    it('should handle fetch network error', async () => {
      const networkError = new TypeError('fetch failed');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Network issue')
      );
    });

    it('should retry on network errors', async () => {
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
    });
  });

  describe('Service Unavailable Error Handling', () => {
    it('should handle 503 service unavailable with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: () => Promise.resolve('Service temporarily unavailable'),
          headers: {
            get: (name: string) => name === 'retry-after' ? '1' : null
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
        expect.stringContaining('Service unavailable')
      );
    });
  });

  describe('Invalid Response Error Handling', () => {
    it('should handle JSON parsing error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      const result = await searchRecipes('test');

      expect(result).toHaveLength(2); // Mock data
      expect(result[0].recipeTitle).toContain('test');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error')
      );
    });
  });

  describe('Health Status Integration', () => {
    it('should warn when API is unhealthy', async () => {
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

  describe('Function-Specific Error Handling', () => {
    describe('getRecipesByFoodName', () => {
      it('should use mock data when useMockRecipes is enabled', async () => {
        (config as any).features.useMockRecipes = true;

        const result = await getRecipesByFoodName('chicken', 5);

        expect(result).toHaveLength(2);
        expect(result[0].recipeTitle).toContain('chicken');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('Mock recipes enabled')
        );
      });

      it('should fallback to mock data on API error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await getRecipesByFoodName('chicken', 5);

        expect(result).toHaveLength(2);
        expect(result[0].recipeTitle).toContain('chicken');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('Falling back to mock data for food search: "chicken"')
        );
      });
    });

    describe('getRecipeRanking', () => {
      it('should fallback to mock data on API error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await getRecipeRanking('category1');

        expect(result).toHaveLength(2);
        expect(result[0].recipeTitle).toContain('人気レシピ');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('Falling back to mock data for recipe ranking')
        );
      });
    });

    describe('getRecipeById', () => {
      it('should return mock recipe with correct ID on error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await getRecipeById(123);

        expect(result).not.toBeNull();
        expect(result!.recipeId).toBe(123);
        expect(result!.recipeTitle).toContain('詳細レシピ');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('Falling back to mock data for recipe ID: 123')
        );
      });
    });
  });

  describe('Exponential Backoff', () => {
    it('should use exponential backoff for retries', async () => {
      const networkError = new TypeError('fetch failed');
      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: [{ recipeId: 1, recipeTitle: 'Test Recipe' }] })
        });

      const startTime = Date.now();
      const result = await searchRecipes('test');
      const endTime = Date.now();

      expect(result).toHaveLength(1);
      expect(result[0].recipeTitle).toBe('Test Recipe');
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Should have waited for exponential backoff (1s + 2s = 3s minimum)
      expect(endTime - startTime).toBeGreaterThanOrEqual(3000 - 100);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Retrying in 1000ms')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Retrying in 2000ms')
      );
    });
  });

  describe('Error Logging', () => {
    it('should log different error types with appropriate levels', async () => {
      // Test authentication error logging
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
          get: (name: string) => name === 'retry-after' ? '5' : null
        }
      });

      await searchRecipes('test');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Rakuten API] Rate limit exceeded'),
        expect.objectContaining({
          context: expect.stringContaining('searchRecipes'),
          type: RakutenApiErrorType.RATE_LIMIT,
          statusCode: 429,
          retryAfter: 5000
        })
      );
    });
  });
});