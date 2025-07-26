import { RakutenRecipe, RakutenRecipeCategory, RakutenRecipeSearchResponse, RakutenRecipeCategoryResponse } from '@/types';
import { config, validateConfig } from './config';

// 設定の検証
validateConfig();

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
 * 楽天レシピAPIのベースリクエスト関数
 */
async function makeRakutenRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
        if (!config.rakuten.applicationId) {
                throw new Error('楽天APIキーが設定されていません');
        }

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

        try {
                const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': `${config.app.name}/${config.app.version}`,
                        },
                        // タイムアウト設定
                        signal: AbortSignal.timeout(10000), // 10秒
                });

                if (!response.ok) {
                        // APIエラーの詳細ログ
                        const errorText = await response.text();
                        console.error(`楽天API エラー [${response.status}]:`, errorText);
                        
                        if (response.status === 429) {
                                throw new Error('APIリクエスト制限に達しました。しばらく待ってから再試行してください。');
                        } else if (response.status === 401) {
                                throw new Error('APIキーが無効です。設定を確認してください。');
                        } else {
                                throw new Error(`楽天API エラー: ${response.status} ${response.statusText}`);
                        }
                }

                const data = await response.json();
                return data;
        } catch (error) {
                console.error('楽天API リクエストエラー:', error);
                throw error;
        }
}

/**
 * レシピカテゴリ一覧を取得
 */
export async function getRecipeCategories(): Promise<RakutenRecipeCategory[]> {
        try {
                const response = await makeRakutenRequest<RakutenRecipeCategoryResponse>('/Recipe/CategoryList/20170426');

                // 大カテゴリ、中カテゴリ、小カテゴリを統合
                const allCategories = [
                        ...response.result.large,
                        ...response.result.medium,
                        ...response.result.small
                ];

                return allCategories;
        } catch (error) {
                console.error('レシピカテゴリ取得エラー:', error);
                throw new Error('レシピカテゴリの取得に失敗しました');
        }
}

/**
 * キーワードでレシピを検索
 */
export async function searchRecipes(keyword: string, options: {
        categoryId?: string;
        page?: number;
        hits?: number;
} = {}): Promise<RakutenRecipe[]> {
        try {
                if (!config.rakuten.applicationId) {
                        console.warn('楽天APIキーが設定されていないため、モックデータを返します');
                        return getMockRecipes(keyword).slice(0, options.hits || 20);
                }

                const params: Record<string, string | number> = {
                        keyword,
                        page: options.page || 1,
                        hits: options.hits || 20,
                };

                if (options.categoryId) {
                        params.categoryId = options.categoryId;
                }

                const response = await makeRakutenRequest<RakutenRecipeSearchResponse>('/Recipe/CategoryRanking/20170426', params);
                return response.result || [];
        } catch (error) {
                console.error('レシピ検索エラー:', error);
                // エラーの場合もモックデータを返す
                return getMockRecipes(keyword).slice(0, options.hits || 20);
        }
}

/**
 * 食材名からレシピを検索
 */
export async function getRecipesByFoodName(foodName: string, limit: number = 10): Promise<RakutenRecipe[]> {
        try {
                if (config.features.useMockRecipes) {
                        console.warn('楽天APIキーが設定されていないため、モックデータを返します');
                        return getMockRecipes(foodName).slice(0, limit);
                }
                return await searchRecipes(foodName, { hits: limit });
        } catch (error) {
                console.error('食材レシピ取得エラー:', error);
                // エラーの場合もモックデータを返す
                return getMockRecipes(foodName).slice(0, limit);
        }
}

/**
 * カテゴリ別レシピランキングを取得
 */
export async function getRecipeRanking(categoryId?: string, page: number = 1): Promise<RakutenRecipe[]> {
        try {
                if (!config.rakuten.applicationId) {
                        console.warn('楽天APIキーが設定されていないため、モックデータを返します');
                        return getMockRecipes('人気レシピ');
                }

                const params: Record<string, string | number> = {
                        page,
                        hits: 20,
                };

                if (categoryId) {
                        params.categoryId = categoryId;
                }

                const response = await makeRakutenRequest<RakutenRecipeSearchResponse>('/Recipe/CategoryRanking/20170426', params);
                return response.result || [];
        } catch (error) {
                console.error('レシピランキング取得エラー:', error);
                // エラーの場合もモックデータを返す
                return getMockRecipes('人気レシピ');
        }
}

/**
 * レシピIDから詳細情報を取得（楽天レシピAPIには詳細取得APIがないため、検索結果から取得）
 */
export async function getRecipeById(recipeId: number): Promise<RakutenRecipe | null> {
        try {
                // 楽天レシピAPIには個別のレシピ詳細取得APIがないため、
                // レシピIDを使って検索を行う（実際の実装では制限があります）
                const recipes = await getRecipeRanking();
                return recipes.find(recipe => recipe.recipeId === recipeId) || null;
        } catch (error) {
                console.error('レシピ詳細取得エラー:', error);
                throw new Error('レシピ詳細の取得に失敗しました');
        }
}