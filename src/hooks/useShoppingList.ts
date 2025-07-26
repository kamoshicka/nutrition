'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface ShoppingListItem {
  id: string;
  userId: string;
  foodName: string;
  quantity?: string;
  unit?: string;
  checked: boolean;
  recipeId?: string;
  recipeName?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  total: number;
  checkedCount: number;
  uncheckedCount: number;
  completionPercentage: number;
}

interface UseShoppingListOptions {
  includeChecked?: boolean;
  recipeId?: string;
  category?: string;
  sortBy?: 'created_at' | 'food_name' | 'recipe_name';
  sortOrder?: 'asc' | 'desc';
}

export function useShoppingList(options: UseShoppingListOptions = {}) {
  const { data: session, status } = useSession();
  const [shoppingList, setShoppingList] = useState<ShoppingList>({
    items: [],
    total: 0,
    checkedCount: 0,
    uncheckedCount: 0,
    completionPercentage: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    includeChecked = true,
    recipeId,
    category,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  // Fetch shopping list from API
  const fetchShoppingList = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        includeChecked: includeChecked.toString(),
        sortBy,
        sortOrder
      });

      if (recipeId) {
        params.append('recipeId', recipeId);
      }

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/shopping-list?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        throw new Error('Failed to fetch shopping list');
      }

      const data: ShoppingList = await response.json();
      setShoppingList(data);
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [session, status, includeChecked, recipeId, category, sortBy, sortOrder]);

  // Add item to shopping list
  const addItem = useCallback(async (
    foodName: string,
    quantity?: string,
    unit?: string,
    recipeId?: string,
    recipeName?: string,
    category?: string,
    notes?: string
  ): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodName,
          quantity,
          unit,
          recipeId,
          recipeName,
          category,
          notes
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        throw new Error('Failed to add item to shopping list');
      }

      // Refresh shopping list
      await fetchShoppingList();
      return true;
    } catch (error) {
      console.error('Error adding item to shopping list:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status, fetchShoppingList]);

  // Add recipe ingredients to shopping list
  const addRecipe = useCallback(async (
    recipeId: string,
    recipeName: string,
    ingredients: Array<{
      name: string;
      amount?: string;
      unit?: string;
    }>,
    category?: string
  ): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch('/api/shopping-list/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId,
          recipeName,
          ingredients,
          category
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        throw new Error('Failed to add recipe to shopping list');
      }

      // Refresh shopping list
      await fetchShoppingList();
      return true;
    } catch (error) {
      console.error('Error adding recipe to shopping list:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status, fetchShoppingList]);

  // Update item
  const updateItem = useCallback(async (
    itemId: string,
    updates: {
      foodName?: string;
      quantity?: string;
      unit?: string;
      checked?: boolean;
      notes?: string;
    }
  ): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`/api/shopping-list/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        if (response.status === 404) {
          throw new Error('Item not found');
        }
        throw new Error('Failed to update item');
      }

      // Update local state
      const updatedItem: ShoppingListItem = await response.json();
      setShoppingList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? updatedItem : item
        ),
        checkedCount: prev.items.filter(item => 
          item.id === itemId ? updatedItem.checked : item.checked
        ).length,
        uncheckedCount: prev.items.filter(item => 
          item.id === itemId ? !updatedItem.checked : !item.checked
        ).length,
        completionPercentage: prev.total > 0 
          ? Math.round((prev.items.filter(item => 
              item.id === itemId ? updatedItem.checked : item.checked
            ).length / prev.total) * 100)
          : 0
      }));

      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status]);

  // Toggle item checked status
  const toggleItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`/api/shopping-list/${itemId}`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        if (response.status === 404) {
          throw new Error('Item not found');
        }
        throw new Error('Failed to toggle item');
      }

      // Update local state
      const updatedItem: ShoppingListItem = await response.json();
      setShoppingList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? updatedItem : item
        ),
        checkedCount: prev.items.filter(item => 
          item.id === itemId ? updatedItem.checked : item.checked
        ).length,
        uncheckedCount: prev.items.filter(item => 
          item.id === itemId ? !updatedItem.checked : !item.checked
        ).length,
        completionPercentage: prev.total > 0 
          ? Math.round((prev.items.filter(item => 
              item.id === itemId ? updatedItem.checked : item.checked
            ).length / prev.total) * 100)
          : 0
      }));

      return true;
    } catch (error) {
      console.error('Error toggling item:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status]);

  // Remove item
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch(`/api/shopping-list/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        if (response.status === 404) {
          throw new Error('Item not found');
        }
        throw new Error('Failed to remove item');
      }

      // Update local state
      setShoppingList(prev => {
        const removedItem = prev.items.find(item => item.id === itemId);
        const newItems = prev.items.filter(item => item.id !== itemId);
        const newTotal = prev.total - 1;
        const newCheckedCount = removedItem?.checked 
          ? prev.checkedCount - 1 
          : prev.checkedCount;
        const newUncheckedCount = !removedItem?.checked 
          ? prev.uncheckedCount - 1 
          : prev.uncheckedCount;

        return {
          items: newItems,
          total: newTotal,
          checkedCount: newCheckedCount,
          uncheckedCount: newUncheckedCount,
          completionPercentage: newTotal > 0 
            ? Math.round((newCheckedCount / newTotal) * 100)
            : 0
        };
      });

      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status]);

  // Clear checked items
  const clearChecked = useCallback(async (): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch('/api/shopping-list?type=checked', {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        throw new Error('Failed to clear checked items');
      }

      // Refresh shopping list
      await fetchShoppingList();
      return true;
    } catch (error) {
      console.error('Error clearing checked items:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status, fetchShoppingList]);

  // Clear all items
  const clearAll = useCallback(async (): Promise<boolean> => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required');
      return false;
    }

    try {
      setError(null);

      const response = await fetch('/api/shopping-list?type=all', {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for shopping list');
        }
        throw new Error('Failed to clear shopping list');
      }

      // Update local state
      setShoppingList({
        items: [],
        total: 0,
        checkedCount: 0,
        uncheckedCount: 0,
        completionPercentage: 0
      });

      return true;
    } catch (error) {
      console.error('Error clearing shopping list:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [session, status]);

  // Refresh shopping list
  const refresh = useCallback(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  // Initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchShoppingList();
    }
  }, [status, fetchShoppingList]);

  return {
    shoppingList,
    isLoading,
    error,
    addItem,
    addRecipe,
    updateItem,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
    refresh
  };
}

export default useShoppingList;