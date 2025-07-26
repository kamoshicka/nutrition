'use client';

import React, { useState, useEffect } from 'react';
import { 
  getProductRecommendations, 
  trackAffiliateClick, 
  formatPrice,
  shouldShowAffiliateAds,
  generateProductSearchUrl
} from '../../lib/affiliate';
import { useSession } from 'next-auth/react';

interface AffiliateWidgetProps {
  foodName: string;
  foodCategory: string;
  limit?: number;
  title?: string;
  compact?: boolean;
  className?: string;
}

export function AffiliateWidget({
  foodName,
  foodCategory,
  limit = 3,
  title = 'おすすめ商品',
  compact = true,
  className = ''
}: AffiliateWidgetProps) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if affiliate ads should be shown
  const showAffiliateAds = shouldShowAffiliateAds(session?.user);

  useEffect(() => {
    if (!showAffiliateAds) {
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        const recommendations = await getProductRecommendations(
          foodName,
          foodCategory,
          limit
        );

        setProducts(recommendations.products);
      } catch (error) {
        console.error('Error fetching affiliate products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [foodName, foodCategory, limit, showAffiliateAds]);

  const handleProductClick = (product: any) => {
    trackAffiliateClick(product.id, product.provider, foodName);
  };

  // Don't render if affiliate ads shouldn't be shown
  if (!showAffiliateAds) {
    return null;
  }

  // Don't render if no products and not loading
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          PR
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        </div>
      )}

      {/* Products List */}
      {!isLoading && products.length > 0 && (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Product Image */}
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                  {product.name}
                </h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  
                  <span className={`text-xs px-1 py-0.5 rounded ${
                    product.provider === 'rakuten' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {product.provider === 'rakuten' ? '楽天' : 'Amazon'}
                  </span>
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-2 h-2 ${
                            i < Math.floor(product.rating) 
                              ? 'text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Buy Link */}
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleProductClick(product)}
                  className={`inline-flex items-center mt-2 text-xs font-medium transition-colors ${
                    product.provider === 'rakuten'
                      ? 'text-red-600 hover:text-red-800'
                      : 'text-orange-600 hover:text-orange-800'
                  }`}
                >
                  購入する
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* More Products Links */}
      {products.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <a
              href={generateProductSearchUrl('rakuten', foodName)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 font-medium"
            >
              楽天で検索
            </a>
            <a
              href={generateProductSearchUrl('amazon', foodName)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-800 font-medium"
            >
              Amazonで検索
            </a>
          </div>
        </div>
      )}

      {/* Disclosure */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          当サイトはアフィリエイト広告を利用しています
        </p>
      </div>
    </div>
  );
}

export default AffiliateWidget;