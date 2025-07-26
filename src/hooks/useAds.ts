'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  shouldShowAds, 
  detectAdBlocker, 
  trackAdPerformance,
  estimateAdRevenue,
  ADSENSE_CONFIG
} from '../lib/adsense';

interface AdState {
  showAds: boolean;
  isAdBlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AdAnalytics {
  impressions: number;
  clicks: number;
  ctr: number;
  estimatedRevenue: number;
}

export function useAds() {
  const { data: session, status } = useSession();
  const [adState, setAdState] = useState<AdState>({
    showAds: false,
    isAdBlocked: false,
    isLoading: true,
    error: null
  });
  const [analytics, setAnalytics] = useState<AdAnalytics>({
    impressions: 0,
    clicks: 0,
    ctr: 0,
    estimatedRevenue: 0
  });

  // Initialize ad state
  useEffect(() => {
    const initializeAds = async () => {
      try {
        setAdState(prev => ({ ...prev, isLoading: true, error: null }));

        // Check if ads should be shown
        const showAds = shouldShowAds(session?.user);
        
        let isAdBlocked = false;
        if (showAds && ADSENSE_CONFIG.enabled) {
          // Detect ad blocker
          isAdBlocked = await detectAdBlocker();
        }

        setAdState({
          showAds,
          isAdBlocked,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error initializing ads:', error);
        setAdState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    if (status !== 'loading') {
      initializeAds();
    }
  }, [session, status]);

  // Track ad impression
  const trackImpression = useCallback((placement: string) => {
    trackAdPerformance(placement, 'impression');
    
    setAnalytics(prev => {
      const newImpressions = prev.impressions + 1;
      const newCtr = prev.clicks > 0 ? (prev.clicks / newImpressions) * 100 : 0;
      const newRevenue = estimateAdRevenue(newImpressions, newCtr / 100);
      
      return {
        ...prev,
        impressions: newImpressions,
        ctr: newCtr,
        estimatedRevenue: newRevenue
      };
    });
  }, []);

  // Track ad click
  const trackClick = useCallback((placement: string) => {
    trackAdPerformance(placement, 'click');
    
    setAnalytics(prev => {
      const newClicks = prev.clicks + 1;
      const newCtr = prev.impressions > 0 ? (newClicks / prev.impressions) * 100 : 0;
      const newRevenue = estimateAdRevenue(prev.impressions, newCtr / 100);
      
      return {
        ...prev,
        clicks: newClicks,
        ctr: newCtr,
        estimatedRevenue: newRevenue
      };
    });
  }, []);

  // Check if specific placement should show ads
  const shouldShowPlacement = useCallback((placement: string): boolean => {
    return adState.showAds && !adState.isAdBlocked && ADSENSE_CONFIG.enabled;
  }, [adState.showAds, adState.isAdBlocked]);

  // Get ad configuration
  const getAdConfig = useCallback(() => {
    return {
      publisherId: ADSENSE_CONFIG.publisherId,
      enabled: ADSENSE_CONFIG.enabled,
      testMode: ADSENSE_CONFIG.testMode
    };
  }, []);

  // Refresh ad state
  const refreshAdState = useCallback(async () => {
    setAdState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const showAds = shouldShowAds(session?.user);
      let isAdBlocked = false;
      
      if (showAds && ADSENSE_CONFIG.enabled) {
        isAdBlocked = await detectAdBlocker();
      }
      
      setAdState({
        showAds,
        isAdBlocked,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAdState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [session]);

  // Reset analytics
  const resetAnalytics = useCallback(() => {
    setAnalytics({
      impressions: 0,
      clicks: 0,
      ctr: 0,
      estimatedRevenue: 0
    });
  }, []);

  return {
    // State
    ...adState,
    analytics,
    
    // Functions
    trackImpression,
    trackClick,
    shouldShowPlacement,
    getAdConfig,
    refreshAdState,
    resetAnalytics
  };
}

export default useAds;