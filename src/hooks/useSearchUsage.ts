'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SearchUsageState {
  remainingSearches: number;
  isPremium: boolean;
  warning?: string;
  canSearch: boolean;
  isLoading: boolean;
  error?: string;
}

export function useSearchUsage() {
  const { data: session, status } = useSession();
  const [usage, setUsage] = useState<SearchUsageState>({
    remainingSearches: -1,
    isPremium: false,
    canSearch: true,
    isLoading: true
  });

  // Fetch current search usage
  const fetchUsage = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setUsage({
        remainingSearches: -1,
        isPremium: false,
        canSearch: false,
        isLoading: false,
        error: 'Authentication required'
      });
      return;
    }

    try {
      setUsage(prev => ({ ...prev, isLoading: true, error: undefined }));

      const response = await fetch('/api/user/search-usage');
      
      if (!response.ok) {
        throw new Error('Failed to fetch search usage');
      }

      const data = await response.json();
      
      setUsage({
        remainingSearches: data.remainingSearches,
        isPremium: data.isPremium,
        warning: data.message,
        canSearch: data.canSearch,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching search usage:', error);
      setUsage(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [session, status]);

  // Update usage from API response headers
  const updateUsageFromHeaders = useCallback((response: Response) => {
    const remaining = response.headers.get('X-Search-Remaining');
    const isPremium = response.headers.get('X-Search-Is-Premium') === 'true';
    const warning = response.headers.get('X-Search-Warning');

    if (remaining !== null) {
      setUsage(prev => ({
        ...prev,
        remainingSearches: parseInt(remaining, 10),
        isPremium,
        warning: warning || undefined,
        canSearch: isPremium || parseInt(remaining, 10) > 0
      }));
    }
  }, []);

  // Perform search with usage tracking
  const performSearch = useCallback(async (searchFn: () => Promise<Response>): Promise<Response> => {
    if (!usage.canSearch) {
      throw new Error('Search limit exceeded');
    }

    try {
      const response = await searchFn();
      
      // Update usage from response headers
      updateUsageFromHeaders(response);
      
      return response;
    } catch (error) {
      // Re-fetch usage on error to get current state
      await fetchUsage();
      throw error;
    }
  }, [usage.canSearch, updateUsageFromHeaders, fetchUsage]);

  // Check if user can search
  const checkCanSearch = useCallback((): { canSearch: boolean; reason?: string } => {
    if (status !== 'authenticated') {
      return { canSearch: false, reason: 'Authentication required' };
    }

    if (usage.isPremium) {
      return { canSearch: true };
    }

    if (usage.remainingSearches <= 0) {
      return { 
        canSearch: false, 
        reason: 'Monthly search limit exceeded. Upgrade to premium for unlimited searches.' 
      };
    }

    return { canSearch: true };
  }, [status, usage.isPremium, usage.remainingSearches]);

  // Refresh usage data
  const refreshUsage = useCallback(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Fetch usage on mount and session change
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    ...usage,
    performSearch,
    checkCanSearch,
    refreshUsage,
    updateUsageFromHeaders
  };
}

export default useSearchUsage;