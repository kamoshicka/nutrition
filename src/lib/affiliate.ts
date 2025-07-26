/**
 * Affiliate advertisement system for Rakuten and Amazon
 */

export interface AffiliateConfig {
  rakuten: {
    applicationId: string;
    affiliateId: string;
    enabled: boolean;
  };
  amazon: {
    associateTag: string;
    accessKey: string;
    secretKey: string;
    enabled: boolean;
  };
}

export interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  provider: 'rakuten' | 'amazon';
  category: string;
  rating?: number;
  reviewCount?: number;
  availability: boolean;
}

export interface ProductRecommendation {
  foodName: string;
  category: string;
  products: AffiliateProduct[];
  totalCount: number;
}

// Affiliate configuration
export const AFFILIATE_CONFIG: AffiliateConfig = {
  rakuten: {
    applicationId: process.env.RAKUTEN_APPLICATION_ID || '',
    affiliateId: process.env.RAKUTEN_AFFILIATE_ID || '',
    enabled: !!process.env.RAKUTEN_APPLICATION_ID && !!process.env.RAKUTEN_AFFILIATE_ID
  },
  amazon: {
    associateTag: process.env.AMAZON_ASSOCIATE_TAG || '',
    accessKey: process.env.AMAZON_ACCESS_KEY || '',
    secretKey: process.env.AMAZON_SECRET_KEY || '',
    enabled: !!process.env.AMAZON_ASSOCIATE_TAG
  }
};

// Food category to product category mapping
const FOOD_CATEGORY_MAPPING: Record<string, string[]> = {
  '野菜': ['野菜', '有機野菜', '冷凍野菜', '野菜ジュース'],
  '果物': ['果物', 'フルーツ', '冷凍フルーツ', 'ドライフルーツ'],
  '肉類': ['肉', '牛肉', '豚肉', '鶏肉', '冷凍肉'],
  '魚類': ['魚', '刺身', '冷凍魚', '缶詰'],
  '穀類': ['米', 'パン', '麺類', 'シリアル'],
  '乳製品': ['牛乳', 'チーズ', 'ヨーグルト', 'バター'],
  '調味料': ['調味料', 'スパイス', 'ソース', 'ドレッシング'],
  '豆類': ['豆', '大豆製品', '豆腐', '納豆'],
  '卵類': ['卵', '卵製品'],
  '油脂類': ['油', 'オリーブオイル', 'ごま油', 'バター']
};

/**
 * Generate Rakuten affiliate URL
 */
export function generateRakutenAffiliateUrl(
  productUrl: string,
  affiliateId: string = AFFILIATE_CONFIG.rakuten.affiliateId
): string {
  if (!affiliateId) {
    return productUrl;
  }

  try {
    const url = new URL(productUrl);
    url.searchParams.set('scid', affiliateId);
    return url.toString();
  } catch {
    return productUrl;
  }
}

/**
 * Generate Amazon affiliate URL
 */
export function generateAmazonAffiliateUrl(
  productUrl: string,
  associateTag: string = AFFILIATE_CONFIG.amazon.associateTag
): string {
  if (!associateTag) {
    return productUrl;
  }

  try {
    const url = new URL(productUrl);
    url.searchParams.set('tag', associateTag);
    return url.toString();
  } catch {
    return productUrl;
  }
}

/**
 * Search Rakuten products by keyword
 */
export async function searchRakutenProducts(
  keyword: string,
  options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  } = {}
): Promise<AffiliateProduct[]> {
  if (!AFFILIATE_CONFIG.rakuten.enabled) {
    return [];
  }

  const { category, minPrice, maxPrice, limit = 10 } = options;

  try {
    const params = new URLSearchParams({
      applicationId: AFFILIATE_CONFIG.rakuten.applicationId,
      keyword,
      hits: limit.toString(),
      format: 'json'
    });

    if (category) {
      params.append('genreId', category);
    }
    if (minPrice) {
      params.append('minPrice', minPrice.toString());
    }
    if (maxPrice) {
      params.append('maxPrice', maxPrice.toString());
    }

    const response = await fetch(
      `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?${params}`
    );

    if (!response.ok) {
      throw new Error('Rakuten API request failed');
    }

    const data = await response.json();
    
    if (!data.Items || !Array.isArray(data.Items)) {
      return [];
    }

    return data.Items.map((item: any) => ({
      id: item.Item.itemCode,
      name: item.Item.itemName,
      description: item.Item.catchcopy || item.Item.itemCaption || '',
      price: item.Item.itemPrice,
      currency: 'JPY',
      imageUrl: item.Item.mediumImageUrls?.[0]?.imageUrl || item.Item.smallImageUrls?.[0]?.imageUrl || '',
      affiliateUrl: generateRakutenAffiliateUrl(item.Item.itemUrl),
      provider: 'rakuten' as const,
      category: item.Item.genreName || category || '',
      rating: item.Item.reviewAverage ? parseFloat(item.Item.reviewAverage) : undefined,
      reviewCount: item.Item.reviewCount || undefined,
      availability: item.Item.availability === 1
    }));
  } catch (error) {
    console.error('Error searching Rakuten products:', error);
    return [];
  }
}

/**
 * Get mock Amazon products (placeholder implementation)
 */
export async function searchAmazonProducts(
  keyword: string,
  options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  } = {}
): Promise<AffiliateProduct[]> {
  // Note: This is a placeholder implementation
  // In a real application, you would use Amazon Product Advertising API
  
  if (!AFFILIATE_CONFIG.amazon.enabled) {
    return [];
  }

  // Mock data for demonstration
  const mockProducts: AffiliateProduct[] = [
    {
      id: 'amazon-001',
      name: `${keyword} - Amazon商品1`,
      description: `高品質な${keyword}をお届けします`,
      price: 1200,
      currency: 'JPY',
      imageUrl: '/placeholder-product.jpg',
      affiliateUrl: generateAmazonAffiliateUrl(`https://amazon.co.jp/dp/B001`),
      provider: 'amazon',
      category: options.category || '食品',
      rating: 4.5,
      reviewCount: 150,
      availability: true
    },
    {
      id: 'amazon-002',
      name: `${keyword} - Amazon商品2`,
      description: `新鮮な${keyword}を産地直送`,
      price: 980,
      currency: 'JPY',
      imageUrl: '/placeholder-product.jpg',
      affiliateUrl: generateAmazonAffiliateUrl(`https://amazon.co.jp/dp/B002`),
      provider: 'amazon',
      category: options.category || '食品',
      rating: 4.2,
      reviewCount: 89,
      availability: true
    }
  ];

  return mockProducts.slice(0, options.limit || 10);
}

/**
 * Get product recommendations for a food item
 */
export async function getProductRecommendations(
  foodName: string,
  foodCategory: string,
  limit: number = 6
): Promise<ProductRecommendation> {
  const searchKeywords = [foodName];
  
  // Add category-specific keywords
  const categoryKeywords = FOOD_CATEGORY_MAPPING[foodCategory] || [];
  searchKeywords.push(...categoryKeywords);

  const allProducts: AffiliateProduct[] = [];

  // Search Rakuten products
  for (const keyword of searchKeywords.slice(0, 2)) { // Limit API calls
    try {
      const rakutenProducts = await searchRakutenProducts(keyword, {
        limit: Math.ceil(limit / 2)
      });
      allProducts.push(...rakutenProducts);
    } catch (error) {
      console.error(`Error searching Rakuten for ${keyword}:`, error);
    }
  }

  // Search Amazon products (mock)
  try {
    const amazonProducts = await searchAmazonProducts(foodName, {
      category: foodCategory,
      limit: Math.ceil(limit / 2)
    });
    allProducts.push(...amazonProducts);
  } catch (error) {
    console.error(`Error searching Amazon for ${foodName}:`, error);
  }

  // Remove duplicates and sort by rating
  const uniqueProducts = allProducts
    .filter((product, index, self) => 
      index === self.findIndex(p => p.name === product.name)
    )
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);

  return {
    foodName,
    category: foodCategory,
    products: uniqueProducts,
    totalCount: uniqueProducts.length
  };
}

/**
 * Track affiliate click
 */
export function trackAffiliateClick(
  productId: string,
  provider: 'rakuten' | 'amazon',
  foodName: string
): void {
  try {
    // Track affiliate click for analytics
    console.log(`Affiliate click tracked: ${provider} - ${productId} for ${foodName}`);
    
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'affiliate_click', {
        event_category: 'affiliate',
        event_label: `${provider}_${foodName}`,
        value: 1
      });
    }
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

/**
 * Get affiliate disclosure text
 */
export function getAffiliateDisclosure(): string {
  return '当サイトは、Amazon.co.jpおよび楽天市場を宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムの参加者です。';
}

/**
 * Check if affiliate features should be shown
 */
export function shouldShowAffiliateAds(user: any): boolean {
  // Show affiliate ads to all users (including premium users)
  // Affiliate ads are less intrusive than display ads
  return AFFILIATE_CONFIG.rakuten.enabled || AFFILIATE_CONFIG.amazon.enabled;
}

/**
 * Get category-specific product suggestions
 */
export function getCategoryProductSuggestions(category: string): string[] {
  return FOOD_CATEGORY_MAPPING[category] || [category];
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Generate product search URL for external sites
 */
export function generateProductSearchUrl(
  provider: 'rakuten' | 'amazon',
  keyword: string
): string {
  const encodedKeyword = encodeURIComponent(keyword);
  
  switch (provider) {
    case 'rakuten':
      return `https://search.rakuten.co.jp/search/mall/${encodedKeyword}/`;
    case 'amazon':
      return `https://www.amazon.co.jp/s?k=${encodedKeyword}`;
    default:
      return '';
  }
}