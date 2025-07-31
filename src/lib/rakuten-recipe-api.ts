import { RakutenRecipe, RakutenRecipeCategory, RakutenRecipeSearchResponse, RakutenRecipeCategoryResponse } from '@/types';
import { config } from './config';
import { getCachedHealthStatus } from './rakuten-health-monitor';
import { 
  rakutenApiLogger, 
  logApiRequest, 
  logDataSourceUsage, 
  createTimer,
  type ApiRequestLogEntry 
} from './rakuten-api-logger';

// Error types for better error handling
export enum RakutenApiErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  CONFIGURATION = 'CONFIGURATION',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export class RakutenApiError extends Error {
  public readonly type: RakutenApiErrorType;
  public readonly statusCode?: number;
  public readonly retryAfter?: number;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: RakutenApiErrorType,
    statusCode?: number,
    retryAfter?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'RakutenApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
    this.originalError = originalError;
  }
}

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};

// 楽天APIキーの確認（実行時にチェック）
const hasRakutenKey = !!process.env.RAKUTEN_APPLICATION_ID;
const useMockData = process.env.USE_MOCK_RECIPES === 'true' || !hasRakutenKey;

// レート制限管理
class RateLimiter {
        private requests: number[] = [];
        private readonly maxRequestsPerSecond: number;

        constructor(maxRequestsPerSecond: number = 5) {
                this.maxRequestsPerSecond = maxRequestsPerSecond;
        }

        async waitIfNeeded(): Promise<void> {
                const now = Date.now();
                // 1秒以内のリクエストをフィルタリング
                this.requests = this.requests.filter(time => now - time < 1000);

                if (this.requests.length >= this.maxRequestsPerSecond) {
                        const oldestRequest = Math.min(...this.requests);
                        const waitTime = 1000 - (now - oldestRequest);
                        if (waitTime > 0) {
                                await new Promise(resolve => setTimeout(resolve, waitTime));
                        }
                }

                this.requests.push(now);
        }
}

const rateLimiter = new RateLimiter(config.rakuten.rateLimit.requestsPerSecond);

/**
 * Sleep utility for retry delays
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Parse retry-after header value
 */
function parseRetryAfter(retryAfterHeader: string | null): number | undefined {
  if (!retryAfterHeader) return undefined;
  
  const seconds = parseInt(retryAfterHeader, 10);
  return isNaN(seconds) ? undefined : seconds * 1000; // Convert to milliseconds
}

/**
 * Enhanced error handler that creates appropriate RakutenApiError instances
 */
function handleApiError(error: any, response?: Response): RakutenApiError {
  // Handle fetch errors (network issues, timeouts, etc.)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new RakutenApiError(
      'Network error: Unable to connect to Rakuten API',
      RakutenApiErrorType.NETWORK,
      undefined,
      undefined,
      error
    );
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return new RakutenApiError(
      'Request timeout: Rakuten API did not respond within the expected time',
      RakutenApiErrorType.TIMEOUT,
      undefined,
      undefined,
      error
    );
  }

  // Handle HTTP response errors
  if (response) {
    const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
    
    switch (response.status) {
      case 401:
        return new RakutenApiError(
          'Authentication failed: Invalid or expired API key',
          RakutenApiErrorType.AUTHENTICATION,
          401,
          undefined,
          error
        );
      
      case 429:
        return new RakutenApiError(
          'Rate limit exceeded: Too many requests to Rakuten API',
          RakutenApiErrorType.RATE_LIMIT,
          429,
          retryAfter,
          error
        );
      
      case 503:
        return new RakutenApiError(
          'Service unavailable: Rakuten API is temporarily down',
          RakutenApiErrorType.SERVICE_UNAVAILABLE,
          503,
          retryAfter,
          error
        );
      
      default:
        return new RakutenApiError(
          `HTTP error ${response.status}: ${response.statusText}`,
          RakutenApiErrorType.NETWORK,
          response.status,
          undefined,
          error
        );
    }
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError) {
    return new RakutenApiError(
      'Invalid response format: Unable to parse API response',
      RakutenApiErrorType.INVALID_RESPONSE,
      undefined,
      undefined,
      error
    );
  }

  // Handle configuration errors
  if (error.message.includes('APIキーが設定されていません') || error.message.includes('API key')) {
    return new RakutenApiError(
      'Configuration error: Rakuten API key is not configured',
      RakutenApiErrorType.CONFIGURATION,
      undefined,
      undefined,
      error
    );
  }

  // Default error
  return new RakutenApiError(
    `Unexpected error: ${error.message}`,
    RakutenApiErrorType.NETWORK,
    undefined,
    undefined,
    error
  );
}

/**
 * Log error with appropriate level based on error type using structured logging
 */
function logApiError(error: RakutenApiError, context: string, endpoint?: string, method: string = 'GET'): void {
  const logEntry: ApiRequestLogEntry = {
    endpoint: endpoint || context,
    method,
    dataSource: 'real_api',
    success: false,
    statusCode: error.statusCode,
    responseTime: 0, // Will be set by caller if available
    error: error.message,
    fallbackReason: `${error.type}: ${error.message}`,
  };

  logApiRequest(logEntry);
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: RakutenApiError): boolean {
  return [
    RakutenApiErrorType.RATE_LIMIT,
    RakutenApiErrorType.TIMEOUT,
    RakutenApiErrorType.NETWORK,
    RakutenApiErrorType.SERVICE_UNAVAILABLE
  ].includes(error.type);
}

/**
 * Execute a function with retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: RakutenApiError;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const apiError = error instanceof RakutenApiError ? error : handleApiError(error);
      lastError = apiError;

      logApiError(apiError, `${context} (attempt ${attempt}/${retryConfig.maxAttempts})`);

      // Don't retry on non-retryable errors
      if (!isRetryableError(apiError)) {
        throw apiError;
      }

      // Don't retry on the last attempt
      if (attempt === retryConfig.maxAttempts) {
        break;
      }

      // Calculate delay for next attempt
      let delay: number;
      if (apiError.type === RakutenApiErrorType.RATE_LIMIT && apiError.retryAfter) {
        // Use server-provided retry-after value
        delay = apiError.retryAfter;
        console.log(`[Rakuten API] Rate limited, waiting ${delay}ms as requested by server`);
      } else {
        // Use exponential backoff
        delay = calculateBackoffDelay(attempt, retryConfig);
        console.log(`[Rakuten API] Retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxAttempts})`);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * モックレシピデータ（楽天APIが利用できない場合のフォールバック）
 */
function getMockRecipes(keyword: string): RakutenRecipe[] {
        return [
                {
                        recipeId: 1,
                        recipeTitle: `${keyword}の簡単炒め物`,
                        recipeUrl: '#',
                        foodImageUrl: '/placeholder-recipe.jpg',
                        mediumImageUrl: '/placeholder-recipe.jpg',
                        smallImageUrl: '/placeholder-recipe.jpg',
                        pickup: 0,
                        shop: 0,
                        nickname: 'サンプルユーザー',
                        recipeMaterial: [`${keyword}`, '醤油', 'ごま油', 'にんにく'],
                        recipeIndication: '約15分',
                        recipeCost: '300円前後',
                        recipePublishday: new Date().toISOString().split('T')[0],
                        rank: '1'
                },
                {
                        recipeId: 2,
                        recipeTitle: `${keyword}のヘルシーサラダ`,
                        recipeUrl: '#',
                        foodImageUrl: '/placeholder-recipe.jpg',
                        mediumImageUrl: '/placeholder-recipe.jpg',
                        smallImageUrl: '/placeholder-recipe.jpg',
                        pickup: 0,
                        shop: 0,
                        nickname: 'サンプルユーザー',
                        recipeMaterial: [`${keyword}`, 'レタス', 'トマト', 'ドレッシング'],
                        recipeIndication: '約10分',
                        recipeCost: '200円前後',
                        recipePublishday: new Date().toISOString().split('T')[0],
                        rank: '2'
                }
        ];
}

/**
 * 楽天レシピAPIのベースリクエスト関数（エラーハンドリング強化版）
 */
async function makeRakutenRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
        const timer = createTimer();
        
        if (!config.rakuten.applicationId) {
                logDataSourceUsage('makeRakutenRequest', 'mock_data', 'API key not configured');
                throw new RakutenApiError(
                        'Rakuten API key is not configured',
                        RakutenApiErrorType.CONFIGURATION
                );
        }

        // Check cached health status before making request
        const healthStatus = getCachedHealthStatus();
        if (healthStatus && !healthStatus.isHealthy) {
                logDataSourceUsage('makeRakutenRequest', 'mock_data', `API unhealthy: ${healthStatus.error}`);
        }

        return await withRetry(async () => {
                // レート制限の適用
                await rateLimiter.waitIfNeeded();

                const searchParams = new URLSearchParams({
                        applicationId: config.rakuten.applicationId,
                        format: 'json',
                        ...Object.entries(params).reduce((acc, [key, value]) => {
                                acc[key] = String(value);
                                return acc;
                        }, {} as Record<string, string>)
                });

                const url = `${config.rakuten.baseUrl}${endpoint}?${searchParams.toString()}`;
                let response: Response;

                try {
                        response = await fetch(url, {
                                method: 'GET',
                                headers: {
                                        'Content-Type': 'application/json',
                                        'User-Agent': `${config.app.name}/${config.app.version}`,
                                },
                                // タイムアウト設定
                                signal: AbortSignal.timeout(config.rakuten.timeout), 
                        });
                } catch (error) {
                        const duration = timer.end();
                        logApiError(handleApiError(error), 'makeRakutenRequest', endpoint, 'GET');
                        throw handleApiError(error);
                }

                const duration = timer.end();

                if (!response.ok) {
                        let errorText: string;
                        try {
                                errorText = await response.text();
                        } catch {
                                errorText = 'Unable to read error response';
                        }

                        const apiError = handleApiError(new Error(errorText), response);
                        logApiError(apiError, 'makeRakutenRequest', endpoint, 'GET');
                        throw apiError;
                }

                try {
                        const data = await response.json();
                        
                        // Log successful request
                        const logEntry: ApiRequestLogEntry = {
                                endpoint,
                                method: 'GET',
                                dataSource: 'real_api',
                                success: true,
                                statusCode: response.status,
                                responseTime: duration,
                                rateLimitRemaining: response.headers.get('x-ratelimit-remaining') ? 
                                        parseInt(response.headers.get('x-ratelimit-remaining')!, 10) : undefined,
                        };
                        logApiRequest(logEntry);
                        
                        return data;
                } catch (error) {
                        const apiError = handleApiError(error);
                        logApiError(apiError, 'makeRakutenRequest', endpoint, 'GET');
                        throw apiError;
                }
        }, `makeRakutenRequest(${endpoint})`);
}

/**
 * レシピカテゴリ一覧を取得（エラーハンドリング強化版）
 */
export async function getRecipeCategories(): Promise<RakutenRecipeCategory[]> {
        const timer = createTimer();
        
        try {
                logDataSourceUsage('getRecipeCategories', 'real_api', 'Fetching from Rakuten API');
                const response = await makeRakutenRequest<RakutenRecipeCategoryResponse>('/Recipe/CategoryList/20170426');

                // 大カテゴリ、中カテゴリ、小カテゴリを統合
                const allCategories = [
                        ...response.result.large,
                        ...response.result.medium,
                        ...response.result.small
                ];

                return allCategories;
        } catch (error) {
                const duration = timer.end();
                const apiError = error instanceof RakutenApiError ? error : handleApiError(error);
                
                // Log the failed request
                const logEntry: ApiRequestLogEntry = {
                        endpoint: '/Recipe/CategoryList/20170426',
                        method: 'GET',
                        dataSource: 'real_api',
                        success: false,
                        responseTime: duration,
                        error: apiError.message,
                        fallbackReason: `${apiError.type}: Cannot provide mock categories`,
                };
                logApiRequest(logEntry);

                // For category errors, we can't provide meaningful mock data
                // so we re-throw with a user-friendly message
                if (apiError.type === RakutenApiErrorType.CONFIGURATION) {
                        throw new Error('Recipe categories are not available: API key not configured');
                } else if (apiError.type === RakutenApiErrorType.AUTHENTICATION) {
                        throw new Error('Recipe categories are not available: Invalid API key');
                } else {
                        throw new Error('Recipe categories are temporarily unavailable. Please try again later.');
                }
        }
}

/**
 * キーワードでレシピを検索（エラーハンドリング強化版）
 */
export async function searchRecipes(keyword: string, options: {
        categoryId?: string;
        page?: number;
        hits?: number;
} = {}): Promise<RakutenRecipe[]> {
        const timer = createTimer();
        
        try {
                if (!config.rakuten.applicationId) {
                        logDataSourceUsage('searchRecipes', 'mock_data', 'API key not configured');
                        const mockData = getMockRecipes(keyword).slice(0, options.hits || 20);
                        
                        // Log mock data usage
                        const logEntry: ApiRequestLogEntry = {
                                endpoint: '/Recipe/CategoryRanking/20170426',
                                method: 'GET',
                                dataSource: 'mock_data',
                                success: true,
                                responseTime: timer.end(),
                                fallbackReason: 'API key not configured',
                        };
                        logApiRequest(logEntry);
                        
                        return mockData;
                }

                const params: Record<string, string | number> = {
                        keyword,
                        page: options.page || 1,
                        hits: options.hits || 20,
                };

                if (options.categoryId) {
                        params.categoryId = options.categoryId;
                }

                logDataSourceUsage('searchRecipes', 'real_api', `Searching for "${keyword}"`);
                const response = await makeRakutenRequest<RakutenRecipeSearchResponse>('/Recipe/CategoryRanking/20170426', params);
                return response.result || [];
        } catch (error) {
                const duration = timer.end();
                const apiError = error instanceof RakutenApiError ? error : handleApiError(error);
                
                // Log the failed request before fallback
                const logEntry: ApiRequestLogEntry = {
                        endpoint: '/Recipe/CategoryRanking/20170426',
                        method: 'GET',
                        dataSource: 'real_api',
                        success: false,
                        responseTime: duration,
                        error: apiError.message,
                        fallbackReason: `${apiError.type}: Falling back to mock data`,
                };
                logApiRequest(logEntry);

                // Graceful fallback to mock data for all error types
                logDataSourceUsage('searchRecipes', 'mock_data', `Fallback after API error: ${apiError.type}`);
                const mockData = getMockRecipes(keyword).slice(0, options.hits || 20);
                
                // Log successful mock data usage
                const mockLogEntry: ApiRequestLogEntry = {
                        endpoint: '/Recipe/CategoryRanking/20170426',
                        method: 'GET',
                        dataSource: 'mock_data',
                        success: true,
                        responseTime: timer.end() - duration, // Time for mock data generation
                        fallbackReason: `API error: ${apiError.type}`,
                };
                logApiRequest(mockLogEntry);
                
                return mockData;
        }
}

/**
 * 食材名からレシピを検索（エラーハンドリング強化版）
 */
export async function getRecipesByFoodName(foodName: string, limit: number = 10): Promise<RakutenRecipe[]> {
        const timer = createTimer();
        
        try {
                if (config.features.useMockRecipes) {
                        logDataSourceUsage('getRecipesByFoodName', 'mock_data', 'Mock recipes enabled in config');
                        const mockData = getMockRecipes(foodName).slice(0, limit);
                        
                        // Log mock data usage
                        const logEntry: ApiRequestLogEntry = {
                                endpoint: 'getRecipesByFoodName',
                                method: 'GET',
                                dataSource: 'mock_data',
                                success: true,
                                responseTime: timer.end(),
                                fallbackReason: 'Mock recipes enabled in configuration',
                        };
                        logApiRequest(logEntry);
                        
                        return mockData;
                }
                
                logDataSourceUsage('getRecipesByFoodName', 'real_api', `Searching recipes for food: "${foodName}"`);
                return await searchRecipes(foodName, { hits: limit });
        } catch (error) {
                const duration = timer.end();
                const apiError = error instanceof RakutenApiError ? error : handleApiError(error);
                
                // Log the failed request
                const logEntry: ApiRequestLogEntry = {
                        endpoint: 'getRecipesByFoodName',
                        method: 'GET',
                        dataSource: 'real_api',
                        success: false,
                        responseTime: duration,
                        error: apiError.message,
                        fallbackReason: `${apiError.type}: Falling back to mock data`,
                };
                logApiRequest(logEntry);

                // Graceful fallback to mock data for all error types
                logDataSourceUsage('getRecipesByFoodName', 'mock_data', `Fallback after error: ${apiError.type}`);
                const mockData = getMockRecipes(foodName).slice(0, limit);
                
                // Log successful mock data usage
                const mockLogEntry: ApiRequestLogEntry = {
                        endpoint: 'getRecipesByFoodName',
                        method: 'GET',
                        dataSource: 'mock_data',
                        success: true,
                        responseTime: timer.end() - duration,
                        fallbackReason: `API error: ${apiError.type}`,
                };
                logApiRequest(mockLogEntry);
                
                return mockData;
        }
}

/**
 * カテゴリ別レシピランキングを取得（エラーハンドリング強化版）
 */
export async function getRecipeRanking(categoryId?: string, page: number = 1): Promise<RakutenRecipe[]> {
        const timer = createTimer();
        
        try {
                if (!config.rakuten.applicationId) {
                        logDataSourceUsage('getRecipeRanking', 'mock_data', 'API key not configured');
                        const mockData = getMockRecipes('人気レシピ');
                        
                        // Log mock data usage
                        const logEntry: ApiRequestLogEntry = {
                                endpoint: '/Recipe/CategoryRanking/20170426',
                                method: 'GET',
                                dataSource: 'mock_data',
                                success: true,
                                responseTime: timer.end(),
                                fallbackReason: 'API key not configured',
                        };
                        logApiRequest(logEntry);
                        
                        return mockData;
                }

                const params: Record<string, string | number> = {
                        page,
                        hits: 20,
                };

                if (categoryId) {
                        params.categoryId = categoryId;
                }

                logDataSourceUsage('getRecipeRanking', 'real_api', `Fetching ranking${categoryId ? ` for category ${categoryId}` : ''}`);
                const response = await makeRakutenRequest<RakutenRecipeSearchResponse>('/Recipe/CategoryRanking/20170426', params);
                return response.result || [];
        } catch (error) {
                const duration = timer.end();
                const apiError = error instanceof RakutenApiError ? error : handleApiError(error);
                
                // Log the failed request
                const logEntry: ApiRequestLogEntry = {
                        endpoint: '/Recipe/CategoryRanking/20170426',
                        method: 'GET',
                        dataSource: 'real_api',
                        success: false,
                        responseTime: duration,
                        error: apiError.message,
                        fallbackReason: `${apiError.type}: Falling back to mock data`,
                };
                logApiRequest(logEntry);

                // Graceful fallback to mock data for all error types
                logDataSourceUsage('getRecipeRanking', 'mock_data', `Fallback after API error: ${apiError.type}`);
                const mockData = getMockRecipes('人気レシピ');
                
                // Log successful mock data usage
                const mockLogEntry: ApiRequestLogEntry = {
                        endpoint: '/Recipe/CategoryRanking/20170426',
                        method: 'GET',
                        dataSource: 'mock_data',
                        success: true,
                        responseTime: timer.end() - duration,
                        fallbackReason: `API error: ${apiError.type}`,
                };
                logApiRequest(mockLogEntry);
                
                return mockData;
        }
}

/**
 * レシピIDから詳細情報を取得（エラーハンドリング強化版）
 */
export async function getRecipeById(recipeId: number): Promise<RakutenRecipe | null> {
        const timer = createTimer();
        
        try {
                // 楽天レシピAPIには個別のレシピ詳細取得APIがないため、
                // レシピIDを使って検索を行う（実際の実装では制限があります）
                logDataSourceUsage('getRecipeById', 'real_api', `Fetching recipe details for ID: ${recipeId}`);
                const recipes = await getRecipeRanking();
                return recipes.find(recipe => recipe.recipeId === recipeId) || null;
        } catch (error) {
                const duration = timer.end();
                const apiError = error instanceof RakutenApiError ? error : handleApiError(error);
                
                // Log the failed request
                const logEntry: ApiRequestLogEntry = {
                        endpoint: 'getRecipeById',
                        method: 'GET',
                        dataSource: 'real_api',
                        success: false,
                        responseTime: duration,
                        error: apiError.message,
                        fallbackReason: `${apiError.type}: Falling back to mock data`,
                };
                logApiRequest(logEntry);

                // For recipe detail errors, we can try to return a mock recipe with the requested ID
                logDataSourceUsage('getRecipeById', 'mock_data', `Fallback for recipe ID: ${recipeId}`);
                const mockRecipes = getMockRecipes('詳細レシピ');
                const mockRecipe = mockRecipes[0];
                
                if (mockRecipe) {
                        // Update the mock recipe with the requested ID
                        const result = { ...mockRecipe, recipeId };
                        
                        // Log successful mock data usage
                        const mockLogEntry: ApiRequestLogEntry = {
                                endpoint: 'getRecipeById',
                                method: 'GET',
                                dataSource: 'mock_data',
                                success: true,
                                responseTime: timer.end() - duration,
                                fallbackReason: `API error: ${apiError.type}`,
                        };
                        logApiRequest(mockLogEntry);
                        
                        return result;
                }
                
                // Log when no mock data is available
                const noDataLogEntry: ApiRequestLogEntry = {
                        endpoint: 'getRecipeById',
                        method: 'GET',
                        dataSource: 'mock_data',
                        success: false,
                        responseTime: timer.end() - duration,
                        error: 'No mock data available for recipe',
                        fallbackReason: `API error: ${apiError.type}`,
                };
                logApiRequest(noDataLogEntry);
                
                return null;
        }
}