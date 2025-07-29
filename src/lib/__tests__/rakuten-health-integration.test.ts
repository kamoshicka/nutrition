/**
 * Integration tests for Rakuten Health Monitoring System
 * 
 * These tests verify the complete integration of the health monitoring system
 * with the application configuration and API endpoints.
 */

import { jest } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Rakuten Health Monitoring Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    jest.resetModules();
  });

  describe('Health Monitoring with Real Configuration', () => {
    it('should integrate with config validation', async () => {
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
            validation: {
              isConfigured: true,
              isValid: true,
              lastValidated: null,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
            environment: 'development',
          },
          features: {
            useMockRecipes: false,
          },
        },
        validateConfig: () => ({
          isValid: true,
          errors: [],
          warnings: [],
          recommendations: [],
        }),
      }));

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

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(true);
      expect(status.endpoint).toBe('/Recipe/CategoryList/20170426');
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
    });

    it('should handle mock mode correctly', async () => {
      // Mock config without API key (mock mode)
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: undefined,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'info' as const,
            },
            validation: {
              isConfigured: false,
              isValid: false,
              lastValidated: null,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
            environment: 'development',
          },
          features: {
            useMockRecipes: true,
          },
        },
        validateConfig: () => ({
          isValid: true,
          errors: [],
          warnings: ['開発環境でRakuten APIキーが設定されていません。モックデータを使用します'],
          recommendations: ['実際のAPIテストを行う場合は、RAKUTEN_APPLICATION_ID を設定してください'],
        }),
      }));

      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(true);
      expect(status.endpoint).toBe('mock-data');
      expect(status.apiVersion).toBe('mock');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Health Status Caching', () => {
    it('should cache health status across multiple calls', async () => {
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

      const { getHealthMonitor, getCachedHealthStatus } = await import('../rakuten-health-monitor');
      
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
      
      // Initially no cached status
      expect(getCachedHealthStatus()).toBeNull();
      
      // First health check
      const status1 = await monitor.checkApiHealth();
      expect(status1.isHealthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Should now have cached status
      const cached = getCachedHealthStatus();
      expect(cached).not.toBeNull();
      expect(cached?.isHealthy).toBe(true);
      
      // Second health check should use cache due to rate limiting
      const status2 = await monitor.checkApiHealth();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(status2.lastChecked).toEqual(status1.lastChecked);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle API authentication errors gracefully', async () => {
      // Mock config with invalid API key
      jest.doMock('../config', () => ({
        config: {
          rakuten: {
            applicationId: 'invalid-api-key',
            baseUrl: 'https://app.rakuten.co.jp/services/api',
            timeout: 5000,
            monitoring: {
              enableHealthChecks: true,
              healthCheckInterval: 60000,
              logLevel: 'error' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));

      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock authentication error response
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

    it('should handle network connectivity issues', async () => {
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
              logLevel: 'error' as const,
            },
          },
          app: {
            name: 'Test App',
            version: '1.0.0',
          },
        },
      }));

      const { getHealthMonitor } = await import('../rakuten-health-monitor');
      
      // Mock network error
      const networkError = new Error('Network connection failed');
      mockFetch.mockRejectedValueOnce(networkError);

      const monitor = getHealthMonitor();
      const status = await monitor.checkApiHealth();

      expect(status.isHealthy).toBe(false);
      expect(status.error).toBe('Network error: Network connection failed');
      expect(status.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('Utility Functions Integration', () => {
    it('should provide utility functions that work with the monitoring system', async () => {
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

      const { 
        isApiHealthy, 
        getCurrentHealthStatus, 
        getCachedHealthStatus 
      } = await import('../rakuten-health-monitor');
      
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

      // Test isApiHealthy utility
      const healthy = await isApiHealthy();
      expect(healthy).toBe(true);

      // Test getCurrentHealthStatus utility
      const currentStatus = await getCurrentHealthStatus();
      expect(currentStatus.isHealthy).toBe(true);
      expect(currentStatus.lastChecked).toBeInstanceOf(Date);

      // Test getCachedHealthStatus utility
      const cachedStatus = getCachedHealthStatus();
      expect(cachedStatus).not.toBeNull();
      expect(cachedStatus?.isHealthy).toBe(true);
    });
  });
});