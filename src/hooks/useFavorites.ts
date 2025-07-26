'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface FavoriteItem {
  id: string;
  userId: string;
  itemType: 'food' | 'recipe';
  itemId: string;
  itemData: {
    name: string;
    description?: string;
    imageUrl?: string;
    category?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FavoritesList {
  favorites: FavoriteItem[];
  total: number;
  hasMore: boolean;
}

interface UseFavoritesOptions {
  itemType?: 'food' | 'recipe';
  limit?: number;
  sortBy?: 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export function useFavorites(options: UseFavoritesOptions = {}) {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<FavoritesList>({
    favorites: [],
    total: 0,
    hasMore: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    itemType,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  // Fetch favorites from API
  const fetchFavorites = useCallback(async (offset = 0, append = false) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder
      });

      if (itemType) {
        params.append('type', itemType);
      }

      const response = await fetch(`/api/favorites?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for favorites');
        }
        throw new Error('Failed to fetch favorites');
      }

      const data: FavoritesList = await response.json();
      
      setFavorites(prev => ({
        favorites: append ? [...prev.favorites, ...data.favorites] : data.favorites,
        total: data.total,
        hasMore: data.hasMore
      }));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [session, status, itemType, limit, sortBy, sortOrder]);

  // Add item to favorites
  const addToFavorites = useCallback(async (
    itemType: 'food' | 'recipe',
    itemId: string,
    itemData: FavoriteItem['itemData']
  ): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType,
          itemId,
          itemData
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for favorites');
        }
        if (response.status === 409) {
          throw new Error('Item is already in favorites');
        }
        throw new Error('Failed to add to favorites');
      }

      // Refresh favorites list
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status, fetchFavorites]);

  // Remove item from favorites
  const removeFromFavorites = useCallback(async (
    itemType: 'food' | 'recipe',
    itemId: string
  ): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`/api/favorites/${itemType}/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for favorites');
        }
        if (response.status === 404) {
          throw new Error('Favorite not found');
        }
        throw new Error('Failed to remove from favorites');
      }

      // Update local state
      setFavorites(prev => ({
        ...prev,
        favorites: prev.favorites.filter(
          fav => !(fav.itemType === itemType && fav.itemId === itemId)
        ),
        total: prev.total - 1
      }));

      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status]);

  // Check if item is in favorites
  const isInFavorites = useCallback(async (
    itemType: 'food' | 'recipe',
    itemId: string
  ): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return false;
    }

    try {
      const response = await fetch(`/api/favorites/${itemType}/${itemId}`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isFavorite;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }, [session, status]);

  // Clear all favorites
  const clearFavorites = useCallback(async (itemType?: 'food' | 'recipe'): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const params = itemType ? `?type=${itemType}` : '';
      const response = await fetch(`/api/favorites${params}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for favorites');
        }
        throw new Error('Failed to clear favorites');
      }

      // Update local state
      if (itemType) {
        setFavorites(prev => ({
          ...prev,
          favorites: prev.favorites.filter(fav => fav.itemType !== itemType),
          total: prev.favorites.filter(fav => fav.itemType !== itemType).length
        }));
      } else {
        setFavorites({
          favorites: [],
          total: 0,
          hasMore: false
        });
      }

      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status]);

  // Load more favorites (pagination)
  const loadMore = useCallback(async () => {
    if (!favorites.hasMore || isLoading) {
      return;
    }

    await fetchFavorites(favorites.favorites.length, true);
  }, [favorites.hasMore, favorites.favorites.length, isLoading, fetchFavorites]);

  // Refresh favorites
  const refresh = useCallback(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFavorites();
    }
  }, [status, fetchFavorites]);

  return {
    favorites: favorites.favorites,
    total: favorites.total,
    hasMore: favorites.hasMore,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    isInFavorites,
    clearFavorites,
    loadMore,
    refresh
  };
}

export default useFavorites;