/**
 * Unit tests for Rakuten API Key Validator
 */

import { 
  ApiKeyValidator, 
  apiKeyValidator,
  validateRakutenApiKeyFormat,
  testRakutenApiConnection,
  validateRakutenApiKey,
  getRakutenSetupInstructions,
  type ApiKeyValidationResult,
  type ConnectionTestResult,
  type SetupInstructions
} from '../rakuten-api-validator';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock config
jest.mock('../config', () => ({
  config: {
    rakuten: {
      baseUrl: 'https://app.rakuten.co.jp/services/api',
    },
    app: {
      name: 'Test App',
      version: '1.0.0',
    },
  },
}));

describe('ApiKeyValidator', () => {
  let validator: ApiKeyValidator;

  beforeEach(() => {
    validator = new ApiKeyValidator();
    mockFetch.mockClear();
  });

  describe('validateFormat', () => {
    it('should return true for valid 20-character alphanumeric API key', () => {
      const validKey = 'abcdefghij1234567890';
      expect(validator.validateFormat(validKey)).toBe(true);
    });

    it('should return true for valid API key with mixed case', () => {
      const validKey = 'AbCdEfGhIj1234567890';
      expect(validator.validateFormat(validKey)).toBe(true);
    });

    it('should return false for API key that is too short', () => {
      const shortKey = 'abcdefghij123456789'; // 19 characters
      expect(validator.validateFormat(shortKey)).toBe(false);
    });

    it('should return false for API key that is too long', () => {
      const longKey = 'abcdefghij12345678901'; // 21 characters
      expect(validator.validateFormat(longKey)).toBe(false);
    });

    it('should return false for API key with special characters', () => {
      const invalidKey = 'abcdefghij123456789!';
      expect(validator.validateFormat(invalidKey)).toBe(false);
    });

    it('should return false for API key with spaces', () => {
      const invalidKey = 'abcdefghij 123456789';
      expect(validator.validateFormat(invalidKey)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validator.validateFormat('')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validator.validateFormat(null as any)).toBe(false);
      expect(validator.validateFormat(undefined as any)).toBe(false);
    });

    it('should handle API key with leading/trailing whitespace', () => {
      const keyWithSpaces = ' abcdefghij1234567890 ';
      expect(validator.validateFormat(keyWithSpaces)).toBe(false);
    });
  });

  describe('testConnection', () => {
    const validApiKey = 'abcdefghij1234567890';

    it('should return success for valid API response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ result: [] }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid API key format', async () => {
      const invalidKey = 'invalid-key';
      
      const result = await validator.testConnection(invalidKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key format. Expected 20 alphanumeric characters.');
      expect(result.responseTime).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle 401 unauthorized error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key. Please check your RAKUTEN_APPLICATION_ID.');
      expect(result.statusCode).toBe(401);
    });

    it('should handle 403 forbidden error', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key does not have permission to access this endpoint.');
      expect(result.statusCode).toBe(403);
    });

    it('should handle 429 rate limit error', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded. Please wait before making more requests.');
      expect(result.statusCode).toBe(429);
    });

    it('should handle server errors (5xx)', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rakuten API server error. Please try again later.');
      expect(result.statusCode).toBe(500);
    });

    it('should handle network timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
        })
      );

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error: Network error');
    });

    it('should extract rate limit information from headers', async () => {
      const headers = new Headers();
      headers.set('X-RateLimit-Remaining', '100');
      headers.set('X-RateLimit-Reset', '1640995200'); // Unix timestamp

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ result: [] }),
        headers,
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.testConnection(validApiKey);

      expect(result.success).toBe(true);
      expect(result.rateLimitInfo).toEqual({
        remaining: 100,
        resetTime: new Date(1640995200 * 1000),
      });
    });

    it('should make correct API request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ result: [] }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await validator.testConnection(validApiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://app.rakuten.co.jp/services/api/Recipe/CategoryList/20170426'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'Test App/1.0.0',
          }),
        })
      );

      const calledUrl = (mockFetch.mock.calls[0][0] as string);
      expect(calledUrl).toContain(`applicationId=${validApiKey}`);
      expect(calledUrl).toContain('format=json');
    });
  });

  describe('validateConnection', () => {
    const validApiKey = 'abcdefghij1234567890';

    it('should return invalid for malformed API key', async () => {
      const result = await validator.validateConnection('invalid-key');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid API key format');
    });

    it('should return valid for successful connection test', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ result: [] }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.validateConnection(validApiKey);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.details?.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return invalid for failed connection test', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validator.validateConnection(validApiKey);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });
  });

  describe('getSetupInstructions', () => {
    it('should return development instructions by default', () => {
      const instructions = validator.getSetupInstructions();

      expect(instructions.environment).toBe('development');
      expect(instructions.steps.some(step => step.includes('.env.local'))).toBe(true);
      expect(instructions.environmentVariables).toHaveProperty('RAKUTEN_APPLICATION_ID');
      expect(instructions.troubleshooting).toBeInstanceOf(Array);
      expect(instructions.links).toBeInstanceOf(Array);
    });

    it('should return staging-specific instructions', () => {
      const instructions = validator.getSetupInstructions('staging');

      expect(instructions.environment).toBe('staging');
      expect(instructions.steps.some(step => step.includes('staging'))).toBe(true);
      expect(instructions.environmentVariables).toHaveProperty('RAKUTEN_ENABLE_HEALTH_CHECKS');
    });

    it('should return production-specific instructions', () => {
      const instructions = validator.getSetupInstructions('production');

      expect(instructions.environment).toBe('production');
      expect(instructions.steps.some(step => step.includes('production'))).toBe(true);
      expect(instructions.steps.some(step => step.includes('monitoring'))).toBe(true);
    });

    it('should include all required sections', () => {
      const instructions = validator.getSetupInstructions('development');

      expect(instructions.steps.length).toBeGreaterThan(0);
      expect(Object.keys(instructions.environmentVariables).length).toBeGreaterThan(0);
      expect(instructions.troubleshooting.length).toBeGreaterThan(0);
      expect(instructions.links.length).toBeGreaterThan(0);
      
      // Check that links have required properties
      instructions.links.forEach(link => {
        expect(link).toHaveProperty('title');
        expect(link).toHaveProperty('url');
        expect(typeof link.title).toBe('string');
        expect(typeof link.url).toBe('string');
      });
    });
  });
});

describe('Exported utility functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('validateRakutenApiKeyFormat', () => {
    it('should validate API key format correctly', () => {
      expect(validateRakutenApiKeyFormat('abcdefghij1234567890')).toBe(true);
      expect(validateRakutenApiKeyFormat('invalid-key')).toBe(false);
    });
  });

  describe('testRakutenApiConnection', () => {
    it('should test API connection', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ result: [] }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await testRakutenApiConnection('abcdefghij1234567890');
      expect(result.success).toBe(true);
    });
  });

  describe('validateRakutenApiKey', () => {
    it('should validate API key with connection test', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ result: [] }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await validateRakutenApiKey('abcdefghij1234567890');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getRakutenSetupInstructions', () => {
    it('should return setup instructions', () => {
      const instructions = getRakutenSetupInstructions('development');
      expect(instructions.environment).toBe('development');
      expect(instructions.steps.length).toBeGreaterThan(0);
    });
  });
});

describe('Singleton instance', () => {
  it('should export a singleton instance', () => {
    expect(apiKeyValidator).toBeInstanceOf(ApiKeyValidator);
  });

  it('should maintain state across calls', () => {
    // Test that the singleton maintains consistent behavior
    const result1 = apiKeyValidator.validateFormat('abcdefghij1234567890');
    const result2 = apiKeyValidator.validateFormat('abcdefghij1234567890');
    expect(result1).toBe(result2);
  });
});

describe('Error handling edge cases', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should handle JSON parsing errors', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      headers: new Headers(),
    };
    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await apiKeyValidator.testConnection('abcdefghij1234567890');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });

  it('should handle unknown errors gracefully', async () => {
    mockFetch.mockRejectedValue('Unknown error');

    const result = await apiKeyValidator.testConnection('abcdefghij1234567890');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error occurred during connection test.');
  });

  it('should handle response without headers', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ result: [] }),
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    };
    mockFetch.mockResolvedValue(mockResponse as any);

    const result = await apiKeyValidator.testConnection('abcdefghij1234567890');
    expect(result.success).toBe(true);
    expect(result.rateLimitInfo).toBeUndefined();
  });
});