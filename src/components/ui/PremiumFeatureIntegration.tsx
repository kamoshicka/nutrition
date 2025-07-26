'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { FavoriteButton } from './FavoriteButton';
import { PDFExportButton } from './PDFExportButton';
import { AffiliateProducts } from './AffiliateProducts';
import { AffiliateWidget } from './AffiliateWidget';
import { AdSenseAd } from './AdSenseAd';
import { SearchUsageIndicator } from './SearchUsageIndicator';
import { useSearchUsage } from '../../hooks/useSearchUsage';

interface PremiumFeatureIntegrationProps {
  pageType: 'food' | 'recipe' | 'search' | 'home';
  itemData?: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    imageUrl?: string;
  };
  showFavoriteButton?: boolean;
  showPDFExport?: boolean;
  showAffiliateProducts?: boolean;
  showAffiliateWidget?: boolean;
  showSearchUsage?: boolean;
  showAds?: boolean;
  className?: string;
}

export function PremiumFeatureIntegration({
  pageType,
  itemData,
  showFavoriteButton = true,
  showPDFExport = true,
  showAffiliateProducts = true,
  showAffiliateWidget = false,
  showSearchUsage = false,
  showAds = true,
  className = ''
}: PremiumFeatureIntegrationProps) {
  const { data: session, status } = useSession();
  const { remainingSearches, isPremium, warning } = useSearchUsage();

  // Check if user has premium access
  const hasPremiumAccess = status === 'authenticated' && session?.user?.subscription?.status === 'premium';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Usage Indicator */}
      {showSearchUsage && status === 'authenticated' && (
        <SearchUsageIndicator 
          remainingSearches={remainingSearches}
          isPremium={isPremium}
          warning={warning}
        />
      )}

      {/* Premium Action Buttons */}
      {itemData && (showFavoriteButton || showPDFExport) && (
        <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">プレミアム機能</h3>
            <p className="text-sm text-gray-600">
              {hasPremiumAccess 
                ? 'プレミアム機能をご利用いただけます' 
                : 'プレミアムプランで追加機能をご利用ください'
              }
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Favorite Button */}
            {showFavoriteButton && (
              <FavoriteButton
                itemType={pageType as 'food' | 'recipe'}
                itemId={itemData.id}
                itemData={{
                  name: itemData.name,
                  description: itemData.description,
                  imageUrl: itemData.imageUrl,
                  category: itemData.category
                }}
                size="md"
                showText={true}
              />
            )}

            {/* PDF Export Button */}
            {showPDFExport && (
              <PDFExportButton
                type={pageType as 'food' | 'recipe'}
                data={{
                  name: itemData.name,
                  description: itemData.description,
                  category: itemData.category,
                  imageUrl: itemData.imageUrl,
                  ...(pageType === 'food' && {
                    nutritionPer100g: {
                      calories: 0,
                      protein: 0,
                      fat: 0,
                      carbohydrates: 0,
                      fiber: 0,
                      sodium: 0
                    }
                  }),
                  ...(pageType === 'recipe' && {
                    ingredients: []
                  })
                } as any}
                size="md"
                variant="outline"
              />
            )}
          </div>
        </div>
      )}

      {/* Affiliate Products */}
      {showAffiliateProducts && itemData && (
        <AffiliateProducts
          foodName={itemData.name}
          foodCategory={itemData.category || ''}
          limit={6}
          title="関連商品"
          showDisclosure={true}
        />
      )}

      {/* Affiliate Widget */}
      {showAffiliateWidget && itemData && (
        <AffiliateWidget
          foodName={itemData.name}
          foodCategory={itemData.category || ''}
          limit={3}
          title="おすすめ商品"
          compact={true}
        />
      )}

      {/* Ads */}
      {showAds && (
        <div className="space-y-4">
          {/* Content Ad */}
          <AdSenseAd 
            placement="content"
            fallback={
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">広告エリア</p>
              </div>
            }
          />

          {/* In-Article Ad for longer content */}
          {(pageType === 'food' || pageType === 'recipe') && (
            <AdSenseAd 
              placement="in_article"
              fallback={
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">記事内広告エリア</p>
                </div>
              }
            />
          )}
        </div>
      )}

      {/* Premium Upgrade Prompt for Free Users */}
      {!hasPremiumAccess && status === 'authenticated' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                プレミアムプランでもっと便利に
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  無制限検索
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  お気に入り機能
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  栄養計算機能
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  PDF保存機能
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  買い物リスト
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  広告なし
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <a
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  プレミアムプランを見る
                </a>
                
                <span className="text-sm text-blue-700">
                  月額300円 • 7日間無料トライアル
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PremiumFeatureIntegration;