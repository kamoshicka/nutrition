/**
 * Tests for Rakuten API Health Monitoring System
 */

import { jest } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock console methods
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Rakuten Health Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    jest.resetModules();
  });

  describe('Health Check with API Key', () => {
    beforeEach(() => {
      // Mock config with API key
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: 'test-api-key-12345678',
            baseUrl: 'https://app.rakuten.co.jp/services/api',
            timeout: 5000,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));
    });

    it('should return healthy status when API responds correctly', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock successful API response
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            large: [{ categoryId: '1', categoryName: 'Test Category' }],
            medium: [],
            small: [],
          },
        }),
        headers: {
          get: (name: string) => {
            if (name === 'X-RateLimit-Remaining') return '100';
            if (name === 'X-RateLimit-Reset') return String(Math.floor(Date.now() / 1000) + 3600);
            return null;
          },
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(true);
      expect(status.lastChecked).toBeInstanceOf(Date);
      expect(status.endpoint).toBe('/Recipe/CategoryList/20170426');
      expect(status.apiVersion).toBe('20170426');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when API returns 401 error', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock API error response
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
        headers: {
          get: () => null,
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(false);
      expect(status.error).toBe('Authentication failed - Invalid API key');
      expect(status.lastChecked).toBeInstanceOf(Date);
    });

    it('should handle rate limit errors correctly', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock rate limit error response
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
        headers: {
          get: (name: string) => {
            if (name === 'X-RateLimit-Remaining') return '0';
            if (name === 'X-RateLimit-Reset') return String(Math.floor(Date.now() / 1000) + 3600);
            return null;
          },
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(false);
      expect(status.error).toBe('Rate limit exceeded');
      expect(status.rateLimitStatus).toEqual({
        remaining: 0,
        resetTime: expect.any(Date),
      });
    });

    it('should handle network timeouts', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(false);
      expect(status.error).toBe('API request timeout after 5000ms');
    });

    it('should handle network errors', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock network error
      const networkError = new Error('Network connection failed');
      mockFetch.mockRejectedValueOnce(networkError);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(false);
      expect(status.error).toBe('Network error: Network connection failed');
    });

    it('should handle invalid API response structure', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock invalid response structure
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          // Missing result.large array
          result: {},
        }),
        headers: {
          get: () => null,
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(false);
      expect(status.error).toBe('Invalid API response structure');
    });
  });

  describe('Mock Mode Handling', () => {
    beforeEach(() => {
      // Mock config without API key
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: undefined,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));
    });

    it('should return healthy status in mock mode when no API key is configured', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(true);
      expect(status.endpoint).toBe('mock-data');
      expect(status.apiVersion).toBe('mock');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      // Mock config with API key
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: 'test-api-key-12345678',
            baseUrl: 'https://app.rakuten.co.jp/services/api',
            timeout: 5000,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));
    });

    it('should check if API is healthy', async () => {
      const { isApiHealthy } = await import('../rakuten-health-monitor');
      
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            large: [{ categoryId: '1', categoryName: 'Test Category' }],
            medium: [],
            small: [],
          },
        }),
        headers: {
          get: () => null,
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const healthy = await isApiHealthy();
      expect(healthy).toBe(true);
    });

    it('should get current health status', async () => {
      const { getCurrentHealthStatus } = await import('../rakuten-health-monitor');
      
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            large: [{ categoryId: '1', categoryName: 'Test Category' }],
            medium: [],
            small: [],
          },
        }),
        headers: {
          get: () => null,
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const status = await getCurrentHealthStatus();
      expect(status.isHealthy).toBe(true);
      expect(status).toHaveProperty('lastChecked');
    });

    it('should get cached health status', async () => {
      const { getCachedHealthStatus } = await import('../rakuten-health-monitor');
      
      const cachedStatus = getCachedHealthStatus();
      expect(cachedStatus).toBeNull(); // No cached status initially
    });
  });

  describe('Scheduled Health Checks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Mock config with health checks enabled
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: 'test-api-key-12345678',
            baseUrl: 'https://app.rakuten.co.jp/services/api',
            timeout: 5000,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start and stop scheduled health checks', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            large: [{ categoryId: '1', categoryName: 'Test Category' }],
            medium: [],
            small: [],
          },
        }),
        headers: {
          get: () => null,
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const monitor = getHealthMonitor();
      monitor.scheduleHealthChecks();

      // Verify initial health check is performed
      await jest.runOnlyPendingTimersAsync();
      expect(mockFetch).toHaveBeenCalled();

      // Stop health checks
      monitor.stopHealthChecks();
      expect(mockConsoleInfo).toHaveBeenCalledWith('Stopped scheduled health checks');
    });
  });

  describe('Initialization and Shutdown', () => {
    beforeEach(() => {
      // Mock config with health checks enabled
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: 'test-api-key-12345678',
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));
    });

    it('should initialize and shutdown health monitoring', async () => {
      const { initializeHealthMonitoring, shutdownHealthMonitoring } = await import('../rakuten-health-monitor');
      
      initializeHealthMonitoring();
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('Starting scheduled health checks')
      );

      shutdownHealthMonitoring();
      expect(mockConsoleInfo).toHaveBeenCalledWith('Stopped scheduled health checks');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock config with API key
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: 'test-api-key-12345678',
            baseUrl: 'https://app.rakuten.co.jp/services/api',
            timeout: 5000,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));
    });

    it('should handle JSON parsing errors', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: {
          get: () => null,
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();
      
      expect(status.isHealthy).toBe(false);
      expect(status.error).toContain('Invalid JSON');
    });
  });

  describe('Caching and Rate Limiting', () => {
    beforeEach(() => {
      // Mock config with API key
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: 'test-api-key-12345678',
            baseUrl: 'https://app.rakuten.co.jp/services/api',
            timeout: 5000,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));
    });

    it('should cache health check results and respect rate limiting', async () => {
      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock successful API response
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            large: [{ categoryId: '1', categoryName: 'Test Category' }],
            medium: [],
            small: [],
          },
        }),
        headers: {
          get: () => null,
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const monitor = getHealthMonitor();
      
      // First call should make API request
      const status1 = await monitor.checkApiHealth();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(status1.isHealthy).toBe(true);

      // Second call immediately should use cached result due to rate limiting
      const status2 = await monitor.checkApiHealth();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(status2.lastChecked).toEqual(status1.lastChecked);
    });
  });
});