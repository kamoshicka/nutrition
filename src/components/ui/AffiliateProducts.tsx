'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getProductRecommendations, 
  trackAffiliateClick, 
  formatPrice,
  shouldShowAffiliateAds,
  getAffiliateDisclosure
} from '../../lib/affiliate';
import { useSession } from 'next-auth/react';
import { LoadingSpinner } from './LoadingSpinner';

interface AffiliateProductsProps {
  foodName: string;
  foodCategory: string;
  limit?: number;
  title?: string;
  showDisclosure?: boolean;
  className?: string;
}

export function AffiliateProducts({
  foodName,
  foodCategory,
  limit = 6,
  title = '関連商品',
  showDisclosure = true,
  className = ''
}: AffiliateProductsProps) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(null);

        const recommendations = await getProductRecommendations(
          foodName,
          foodCategory,
          limit
        );

        setProducts(recommendations.products);
      } catch (error) {
        console.error('Error fetching affiliate products:', error);
        setError('商品情報の取得に失敗しました');
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
  if (!isLoading && products.length === 0 && !error) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-xs text-gray-500">
          PR
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative">
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
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                
                {/* Provider Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    product.provider === 'rakuten' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {product.provider === 'rakuten' ? '楽天' : 'Amazon'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                  {product.name}
                </h4>
                
                {product.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {product.description}
                  </p>
                )}

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${
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
                    {product.reviewCount && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  
                  {!product.availability && (
                    <span className="text-xs text-red-600">
                      在庫切れ
                    </span>
                  )}
                </div>

                {/* Buy Button */}
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleProductClick(product)}
                  className={`mt-3 w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    product.availability
                      ? product.provider === 'rakuten'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!product.availability}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {product.provider === 'rakuten' ? '楽天で購入' : 'Amazonで購入'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Affiliate Disclosure */}
      {showDisclosure && products.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            {getAffiliateDisclosure()}
          </p>
        </div>
      )}
    </div>
  );
}

export default AffiliateProducts;