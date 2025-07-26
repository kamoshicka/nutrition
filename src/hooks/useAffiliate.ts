'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getProductRecommendations, 
  trackAffiliateClick,
  shouldShowAffiliateAds,
  AFFILIATE_CONFIG
} from '../lib/affiliate';

interface AffiliateState {
  showAffiliateAds: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AffiliateAnalytics {
  clicks: number;
  impressions: number;
  ctr: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    clicks: number;
    provider: 'rakuten' | 'amazon';
  }>;
}

export function useAffiliate() {
  const { data: session, status } = useSession();
  const [affiliateState, setAffiliateState] = useState<AffiliateState>({
    showAffiliateAds: false,
    isLoading: true,
    error: null
  });
  const [analytics, setAnalytics] = useState<AffiliateAnalytics>({
    clicks: 0,
    impressions: 0,
    ctr: 0,
    topProducts: []
  });
  const [productCache, setProductCache] = useState<Map<string, any>>(new Map());

  // Initialize affiliate state
  useEffect(() => {
    const initializeAffiliate = () => {
      try {
        setAffiliateState(prev => ({ ...prev, isLoading: true, error: null }));

        const showAds = shouldShowAffiliateAds(session?.user);

        setAffiliateState({
          showAffiliateAds: showAds,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error initializing affiliate:', error);
        setAffiliateState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    if (status !== 'loading') {
      initializeAffiliate();
    }
  }, [session, status]);

  // Get product recommendations with caching
  const getProducts = useCallback(async (
    foodName: string,
    foodCategory: string,
    limit: number = 6
  ) => {
    const cacheKey = `${foodName}_${foodCategory}_${limit}`;
    
    // Check cache first
    if (productCache.has(cacheKey)) {
      return productCache.get(cacheKey);
    }

    try {
      const recommendations = await getProductRecommendations(
        foodName,
        foodCategory,
        limit
      );

      // Cache the results
      setProductCache(prev => new Map(prev.set(cacheKey, recommendations)));
      
      // Track impression
      trackImpression(foodName, recommendations.products.length);

      return recommendations;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }, [productCache]);

  // Track product click
  const trackClick = useCallback((
    productId: string,
    provider: 'rakuten' | 'amazon',
    foodName: string,
    productName: string
  ) => {
    trackAffiliateClick(productId, provider, foodName);
    
    setAnalytics(prev => {
      const newClicks = prev.clicks + 1;
      const newCtr = prev.impressions > 0 ? (newClicks / prev.impressions) * 100 : 0;
      
      // Update top products
      const existingProductIndex = prev.topProducts.findIndex(p => p.productId === productId);
      let newTopProducts = [...prev.topProducts];
      
      if (existingProductIndex >= 0) {
        newTopProducts[existingProductIndex].clicks += 1;
      } else {
        newTopProducts.push({
          productId,
          productName,
          clicks: 1,
          provider
        });
      }
      
      // Sort by clicks and keep top 10
      newTopProducts = newTopProducts
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      return {
        ...prev,
        clicks: newClicks,
        ctr: newCtr,
        topProducts: newTopProducts
      };
    });
  }, []);

  // Track product impression
  const trackImpression = useCallback((foodName: string, productCount: number) => {
    setAnalytics(prev => {
      const newImpressions = prev.impressions + productCount;
      const newCtr = prev.clicks > 0 ? (prev.clicks / newImpressions) * 100 : 0;
      
      return {
        ...prev,
        impressions: newImpressions,
        ctr: newCtr
      };
    });
  }, []);

  // Check if specific provider is enabled
  const isProviderEnabled = useCallback((provider: 'rakuten' | 'amazon'): boolean => {
    return AFFILIATE_CONFIG[provider].enabled;
  }, []);

  // Get affiliate configuration
  const getAffiliateConfig = useCallback(() => {
    return {
      rakuten: {
        enabled: AFFILIATE_CONFIG.rakuten.enabled,
        hasApplicationId: !!AFFILIATE_CONFIG.rakuten.applicationId,
        hasAffiliateId: !!AFFILIATE_CONFIG.rakuten.affiliateId
      },
      amazon: {
        enabled: AFFILIATE_CONFIG.amazon.enabled,
        hasAssociateTag: !!AFFILIATE_CONFIG.amazon.associateTag
      }
    };
  }, []);

  // Clear product cache
  const clearCache = useCallback(() => {
    setProductCache(new Map());
  }, []);

  // Reset analytics
  const resetAnalytics = useCallback(() => {
    setAnalytics({
      clicks: 0,
      impressions: 0,
      ctr: 0,
      topProducts: []
    });
  }, []);

  // Refresh affiliate state
  const refreshAffiliateState = useCallback(() => {
    const showAds = shouldShowAffiliateAds(session?.user);
    setAffiliateState(prev => ({
      ...prev,
      showAffiliateAds: showAds
    }));
  }, [session]);

  return {
    // State
    ...affiliateState,
    analytics,
    
    // Functions
    getProducts,
    trackClick,
    trackImpression,
    isProviderEnabled,
    getAffiliateConfig,
    clearCache,
    resetAnalytics,
    refreshAffiliateState
  };
}

export default useAffiliate;