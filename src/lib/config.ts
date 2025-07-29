/**
 * アプリケーション設定管理
 */

// 環境変数の型定義
interface EnvironmentVariables {
  RAKUTEN_APPLICATION_ID?: string;
  RAKUTEN_API_TIMEOUT?: string;
  RAKUTEN_RATE_LIMIT_RPS?: string;
  RAKUTEN_ENABLE_HEALTH_CHECKS?: string;
  USE_MOCK_RECIPES?: string;
  NODE_ENV: string;
  VERCEL_ENV?: string;
  NEXT_PUBLIC_API_URL?: string;
  npm_package_version?: string;
}

// 設定検証結果の型定義
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// 楽天API設定の型定義
export interface RakutenConfig {
  applicationId: string | undefined;
  baseUrl: string;
  timeout: number;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  validation: {
    isConfigured: boolean;
    isValid: boolean;
    lastValidated: Date | null;
  };
  fallback: {
    useMockData: boolean;
    mockDataPath: string;
    fallbackTimeout: number;
  };
  monitoring: {
    enableHealthChecks: boolean;
    healthCheckInterval: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// 環境検出
function detectEnvironment(): 'development' | 'staging' | 'production' {
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  
  if (vercelEnv === 'production' || nodeEnv === 'production') {
    return 'production';
  } else if (vercelEnv === 'preview') {
    return 'staging';
  } else {
    return 'development';
  }
}

// Import the new API key validator
import { validateRakutenApiKeyFormat } from './rakuten-api-validator';

// 楽天APIキーのフォーマット検証 (using the new validator)
function validateRakutenApiKeyFormatInternal(apiKey: string | undefined): boolean {
  if (!apiKey) return false;
  return validateRakutenApiKeyFormat(apiKey);
}

// 数値環境変数のパース
function parseNumericEnvVar(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ブール環境変数のパース
function parseBooleanEnvVar(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// 楽天API設定の構築
function buildRakutenConfig(): RakutenConfig {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  const environment = detectEnvironment();
  
  return {
    applicationId,
    baseUrl: 'https://app.rakuten.co.jp/services/api',
    timeout: parseNumericEnvVar(process.env.RAKUTEN_API_TIMEOUT, 10000),
    rateLimit: {
      requestsPerSecond: parseNumericEnvVar(process.env.RAKUTEN_RATE_LIMIT_RPS, 5),
      requestsPerDay: 10000,
      burstLimit: 10,
    },
    validation: {
      isConfigured: !!applicationId,
      isValid: validateRakutenApiKeyFormatInternal(applicationId),
      lastValidated: null,
    },
    fallback: {
      useMockData: parseBooleanEnvVar(process.env.USE_MOCK_RECIPES, !applicationId),
      mockDataPath: '/data/mock-recipes.json',
      fallbackTimeout: 5000,
    },
    monitoring: {
      enableHealthChecks: parseBooleanEnvVar(process.env.RAKUTEN_ENABLE_HEALTH_CHECKS, environment !== 'development'),
      healthCheckInterval: 300000, // 5分
      logLevel: environment === 'production' ? 'error' : 'info',
    },
  };
}

export const config = {
  // 楽天API設定
  rakuten: buildRakutenConfig(),
  
  // アプリケーション設定
  app: {
    name: 'ヘルスケア食材アプリ',
    version: process.env.npm_package_version || '1.0.0',
    environment: detectEnvironment(),
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  
  // 機能フラグ
  features: {
    useMockRecipes: buildRakutenConfig().fallback.useMockData,
    enableAnalytics: detectEnvironment() === 'production',
    enableErrorReporting: detectEnvironment() === 'production',
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
 * 楽天APIキーの詳細検証
 */
function validateRakutenApiKey(): { isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] } {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    recommendations: [] as string[],
  };

  const { applicationId } = config.rakuten;
  const environment = config.app.environment;

  // APIキーの存在チェック
  if (!applicationId) {
    if (environment === 'production') {
      result.isValid = false;
      result.errors.push('本番環境では RAKUTEN_APPLICATION_ID が必須です');
      result.recommendations.push('楽天ウェブサービス (https://webservice.rakuten.co.jp/) でAPIキーを取得してください');
    } else if (environment === 'staging') {
      result.warnings.push('ステージング環境でRakuten APIキーが設定されていません。モックデータを使用します');
      result.recommendations.push('実際のAPIテストを行う場合は、RAKUTEN_APPLICATION_ID を設定してください');
    } else {
      result.warnings.push('開発環境でRakuten APIキーが設定されていません。モックデータを使用します');
      result.recommendations.push('実際のAPIテストを行う場合は、RAKUTEN_APPLICATION_ID を設定してください');
    }
    return result;
  }

  // APIキーのフォーマット検証
  if (!validateRakutenApiKeyFormatInternal(applicationId)) {
    result.isValid = false;
    result.errors.push('RAKUTEN_APPLICATION_ID のフォーマットが無効です（20文字の英数字である必要があります）');
    result.recommendations.push('楽天ウェブサービスから正しいAPIキーをコピーしてください');
  }

  // 環境固有の検証
  if (environment === 'development' && applicationId) {
    result.recommendations.push('開発環境では USE_MOCK_RECIPES=true を設定してAPIクォータを節約することを推奨します');
  }

  return result;
}

/**
 * 環境変数の検証
 */
function validateEnvironmentVariables(): { isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] } {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    recommendations: [] as string[],
  };

  const environment = config.app.environment;

  // 必須環境変数のチェック
  const requiredVars: { [key: string]: string[] } = {
    production: ['RAKUTEN_APPLICATION_ID'],
    staging: [],
    development: [],
  };

  const required = requiredVars[environment] || [];
  for (const varName of required) {
    if (!process.env[varName]) {
      result.isValid = false;
      result.errors.push(`${environment}環境では ${varName} が必須です`);
    }
  }

  // 数値環境変数の検証
  const numericVars = ['RAKUTEN_API_TIMEOUT', 'RAKUTEN_RATE_LIMIT_RPS'];
  for (const varName of numericVars) {
    const value = process.env[varName];
    if (value && isNaN(parseInt(value, 10))) {
      result.warnings.push(`${varName} は数値である必要があります。デフォルト値を使用します`);
    }
  }

  // ブール環境変数の検証
  const booleanVars = ['USE_MOCK_RECIPES', 'RAKUTEN_ENABLE_HEALTH_CHECKS'];
  for (const varName of booleanVars) {
    const value = process.env[varName];
    if (value && !['true', 'false'].includes(value.toLowerCase())) {
      result.warnings.push(`${varName} は 'true' または 'false' である必要があります。デフォルト値を使用します`);
    }
  }

  return result;
}

/**
 * 設定の包括的検証
 */
export function validateConfig(): ConfigValidationResult {
  const result: ConfigValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
  };

  // 楽天APIキーの検証
  const rakutenValidation = validateRakutenApiKey();
  result.errors.push(...rakutenValidation.errors);
  result.warnings.push(...rakutenValidation.warnings);
  result.recommendations.push(...rakutenValidation.recommendations);
  if (!rakutenValidation.isValid) {
    result.isValid = false;
  }

  // 環境変数の検証
  const envValidation = validateEnvironmentVariables();
  result.errors.push(...envValidation.errors);
  result.warnings.push(...envValidation.warnings);
  result.recommendations.push(...envValidation.recommendations);
  if (!envValidation.isValid) {
    result.isValid = false;
  }

  // レート制限設定の検証
  if (config.rakuten.rateLimit.requestsPerSecond > 10) {
    result.warnings.push('楽天APIのレート制限が高く設定されています。APIクォータの消費にご注意ください');
  }

  // ログ出力
  if (result.errors.length > 0) {
    console.error('設定エラー:', result.errors);
  }
  if (result.warnings.length > 0) {
    console.warn('設定警告:', result.warnings);
  }
  if (result.recommendations.length > 0 && config.app.environment === 'development') {
    console.info('設定推奨事項:', result.recommendations);
  }

  // 本番環境でエラーがある場合は例外を投げる
  if (!result.isValid && config.app.environment === 'production') {
    throw new Error(`設定エラー: ${result.errors.join(', ')}`);
  }

  return result;
}

/**
 * 設定の詳細レポート生成
 */
export function generateConfigReport(): string {
  const validation = validateConfig();
  const environment = config.app.environment;
  
  let report = `\n=== 設定レポート (${environment}環境) ===\n`;
  
  // 楽天API設定状況
  report += `\n楽天API設定:\n`;
  report += `  - APIキー設定: ${config.rakuten.validation.isConfigured ? '✓' : '✗'}\n`;
  report += `  - APIキー有効: ${config.rakuten.validation.isValid ? '✓' : '✗'}\n`;
  report += `  - モックデータ使用: ${config.features.useMockRecipes ? '✓' : '✗'}\n`;
  report += `  - ヘルスチェック: ${config.rakuten.monitoring.enableHealthChecks ? '✓' : '✗'}\n`;
  report += `  - レート制限: ${config.rakuten.rateLimit.requestsPerSecond} req/sec\n`;
  
  // エラー・警告・推奨事項
  if (validation.errors.length > 0) {
    report += `\nエラー:\n`;
    validation.errors.forEach(error => report += `  ✗ ${error}\n`);
  }
  
  if (validation.warnings.length > 0) {
    report += `\n警告:\n`;
    validation.warnings.forEach(warning => report += `  ⚠ ${warning}\n`);
  }
  
  if (validation.recommendations.length > 0) {
    report += `\n推奨事項:\n`;
    validation.recommendations.forEach(rec => report += `  💡 ${rec}\n`);
  }
  
  report += `\n設定状態: ${validation.isValid ? '✓ 正常' : '✗ 要修正'}\n`;
  report += `=====================================\n`;
  
  return report;
}

/**
 * 環境固有の設定取得
 */
export function getEnvironmentSpecificConfig() {
  const environment = config.app.environment;
  
  return {
    environment,
    isProduction: environment === 'production',
    isStaging: environment === 'staging',
    isDevelopment: environment === 'development',
    rakutenApiRequired: environment === 'production',
    shouldUseMockData: config.features.useMockRecipes,
    logLevel: config.rakuten.monitoring.logLevel,
    enableHealthChecks: config.rakuten.monitoring.enableHealthChecks,
  };
}

/**
 * 開発環境かどうかを判定
 */
export const isDevelopment = config.app.environment === 'development';

/**
 * ステージング環境かどうかを判定
 */
export const isStaging = config.app.environment === 'staging';

/**
 * 本番環境かどうかを判定
 */
export const isProduction = config.app.environment === 'production';