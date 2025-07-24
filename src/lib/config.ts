/**
 * アプリケーション設定管理
 */

export const config = {
  // 楽天API設定
  rakuten: {
    applicationId: process.env.RAKUTEN_APPLICATION_ID,
    baseUrl: 'https://app.rakuten.co.jp/services/api',
    // レート制限設定
    rateLimit: {
      requestsPerSecond: 5,
      requestsPerDay: 10000,
    },
  },
  
  // アプリケーション設定
  app: {
    name: 'ヘルスケア食材アプリ',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  
  // 機能フラグ
  features: {
    useMockRecipes: process.env.USE_MOCK_RECIPES === 'true' || !process.env.RAKUTEN_APPLICATION_ID,
    enableAnalytics: process.env.NODE_ENV === 'production',
    enableErrorReporting: process.env.NODE_ENV === 'production',
  },
  
  // キャッシュ設定
  cache: {
    recipes: {
      ttl: 600, // 10分
      staleWhileRevalidate: 1200, // 20分
    },
    categories: {
      ttl: 3600, // 1時間
      staleWhileRevalidate: 7200, // 2時間
    },
  },
};

/**
 * 設定の検証
 */
export function validateConfig() {
  const errors: string[] = [];
  
  if (config.app.environment === 'production') {
    if (!config.rakuten.applicationId) {
      errors.push('本番環境では RAKUTEN_APPLICATION_ID が必要です');
    }
  }
  
  if (errors.length > 0) {
    console.error('設定エラー:', errors);
    if (config.app.environment === 'production') {
      throw new Error(`設定エラー: ${errors.join(', ')}`);
    }
  }
  
  return errors.length === 0;
}

/**
 * 開発環境かどうかを判定
 */
export const isDevelopment = config.app.environment === 'development';

/**
 * 本番環境かどうかを判定
 */
export const isProduction = config.app.environment === 'production';