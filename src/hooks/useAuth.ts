'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

/**
 * Custom hook for authentication state and utilities
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const authState = useMemo(() => {
    const isLoading = status === 'loading';
    const isAuthenticated = !!session;
    const user = session?.user || null;
    
    // Subscription status
    const subscriptionStatus = user?.subscription?.status || 'free';
    const isPremium = subscriptionStatus === 'premium';
    const isCancelled = subscriptionStatus === 'cancelled';
    const isFree = subscriptionStatus === 'free';
    
    // Search limits
    const searchCount = user?.searchCount || 0;
    const searchLimit = 30;
    const remainingSearches = isPremium ? -1 : Math.max(0, searchLimit - searchCount);
    const canSearch = isPremium || remainingSearches > 0;
    const isNearSearchLimit = !isPremium && (searchCount / searchLimit) >= 0.8;
    const isAtSearchLimit = !isPremium && remainingSearches === 0;

    return {
      // Basic auth state
      isLoading,
      isAuthenticated,
      user,
      
      // Subscription state
      subscription: {
        status: subscriptionStatus,
        isPremium,
        isCancelled,
        isFree,
        stripeCustomerId: user?.subscription?.stripeCustomerId,
        stripeSubscriptionId: user?.subscription?.stripeSubscriptionId,
        currentPeriodStart: user?.subscription?.currentPeriodStart,
        currentPeriodEnd: user?.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user?.subscription?.cancelAtPeriodEnd || false,
      },
      
      // Search limits
      search: {
        count: searchCount,
        limit: searchLimit,
        remaining: remainingSearches,
        canSearch,
        isNearLimit: isNearSearchLimit,
        isAtLimit: isAtSearchLimit,
        usagePercentage: isPremium ? 0 : (searchCount / searchLimit) * 100,
      },
    };
  }, [session, status]);

  return authState;
}

/**
 * Hook for checking if user has access to premium features
 */
export function usePremiumAccess() {
  const { subscription } = useAuth();
  
  return {
    hasPremiumAccess: subscription.isPremium,
    needsUpgrade: !subscription.isPremium,
    subscriptionStatus: subscription.status,
  };
}

/**
 * Hook for search limit management
 */
export function useSearchLimits() {
  const { search, subscription } = useAuth();
  
  const trackSearch = async (increment: number = 1) => {
    if (subscription.isPremium) {
      return { success: true, remainingSearches: -1 };
    }

    try {
      const response = await fetch('/api/search/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ increment }),
      });

      if (!response.ok) {
        throw new Error('Failed to track search');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Error tracking search:', error);
      return { success: false, error };
    }
  };

  return {
    ...search,
    trackSearch,
  };
}