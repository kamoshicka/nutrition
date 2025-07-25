'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useCallback } from 'react';

/**
 * Custom hook for authentication state and utilities
 */
export function useAuth() {
  const { data: session, status, update } = useSession();

  const authState = useMemo(() => {
    const isLoading = status === 'loading';
    const isAuthenticated = !!session;
    const user = session?.user || null;
    
    // Subscription status
    const subscriptionStatus = user?.subscription?.status || 'free';
    const isPremium = subscriptionStatus === 'premium';
    const isCancelled = subscriptionStatus === 'cancelled';
    const isFree = subscriptionStatus === 'free';
    
    // Search limits - now unlimited for all users
    const searchCount = user?.searchCount || 0;
    const searchLimit = -1; // Unlimited for all users
    const remainingSearches = -1; // Always unlimited
    const canSearch = true; // Always allow search
    const isNearSearchLimit = false; // Never near limit
    const isAtSearchLimit = false; // Never at limit

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
        usagePercentage: 0, // Always 0% since unlimited
      },
    };
  }, [session, status]);

  const refreshUser = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error('Error refreshing user session:', error);
    }
  }, [update]);

  return {
    ...authState,
    refreshUser,
  };
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
    // Search is now unlimited for all users, but we still track for analytics
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
      return { success: true, remainingSearches: -1, ...data };
    } catch (error) {
      console.error('Error tracking search:', error);
      return { success: true, remainingSearches: -1, error }; // Still allow search even if tracking fails
    }
  };

  return {
    ...search,
    trackSearch,
  };
}