'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { AdSenseAd } from './AdSenseAd';
import { AdBlockerDetector } from './AdBlockerDetector';
import { shouldShowAds, getRecommendedPlacements } from '../../lib/adsense';

interface AdLayoutProps {
  pageType: string;
  children: React.ReactNode;
  showAdBlockerDetector?: boolean;
  className?: string;
}

export function AdLayout({ 
  pageType, 
  children, 
  showAdBlockerDetector = true,
  className = '' 
}: AdLayoutProps) {
  const { data: session } = useSession();
  
  // Check if ads should be shown
  const showAds = shouldShowAds(session?.user);
  
  // Get recommended ad placements for this page type
  const recommendedPlacements = getRecommendedPlacements(pageType);
  
  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (!showAds) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`ad-layout ${className}`}>
      {/* Ad Blocker Detector */}
      {showAdBlockerDetector && (
        <AdBlockerDetector className="mb-4" />
      )}

      {/* Header Ad */}
      {recommendedPlacements.includes('header') && (
        <div className="mb-6">
          <AdSenseAd 
            placement="header" 
            className="w-full"
            fallback={
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">ヘッダー広告エリア</p>
              </div>
            }
          />
        </div>
      )}

      {/* Mobile Banner (mobile only) */}
      {isMobile && recommendedPlacements.includes('mobile_banner') && (
        <div className="mb-4 sticky top-0 z-40 bg-white border-b border-gray-200">
          <AdSenseAd 
            placement="mobile_banner" 
            className="w-full"
            fallback={
              <div className="bg-gray-100 p-2 text-center">
                <p className="text-xs text-gray-500">モバイル広告</p>
              </div>
            }
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {children}
          
          {/* In-Article Ad */}
          {recommendedPlacements.includes('in_article') && (
            <div className="my-8">
              <AdSenseAd 
                placement="in_article" 
                className="w-full"
                fallback={
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">記事内広告エリア</p>
                  </div>
                }
              />
            </div>
          )}
        </div>

        {/* Sidebar with Ads (desktop only) */}
        {!isMobile && recommendedPlacements.includes('sidebar') && (
          <div className="w-full lg:w-80 space-y-6">
            {/* Sidebar Ad */}
            <AdSenseAd 
              placement="sidebar" 
              fallback={
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">サイドバー広告エリア</p>
                </div>
              }
            />
            
            {/* Content Ad */}
            {recommendedPlacements.includes('content') && (
              <AdSenseAd 
                placement="content" 
                fallback={
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">コンテンツ広告エリア</p>
                  </div>
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Footer Ad */}
      {recommendedPlacements.includes('footer') && (
        <div className="mt-8">
          <AdSenseAd 
            placement="footer" 
            className="w-full"
            fallback={
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">フッター広告エリア</p>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

export default AdLayout;