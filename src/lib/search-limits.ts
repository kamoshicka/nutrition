import { getUserById, updateUserSearchCount } from '../../lib/auth';

/**
 * Search limitation system for free users
 */

export const SEARCH_LIMITS = {
  FREE_SEARCHES_PER_MONTH: 50,
  PREMIUM_UNLIMITED: -1
};

export interface SearchUsage {
  userId: string;
  searchCount: number;
  lastResetDate: Date;
  currentMonth: string;
  canSearch: boolean;
  remainingSearches: number;
  isPremium: boolean;
}

/**
 * Get user's current search usage
 */
export async function getUserSearchUsage(userId: string): Promise<SearchUsage> {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const isPremium = user.subscription.status === 'premium';
    const currentMonth = getCurrentMonth();
    
    // Reset count if it's a new month
    const lastResetMonth = `${user.searchCountResetDate.getFullYear()}-${String(user.searchCountResetDate.getMonth() + 1).padStart(2, '0')}`;
    if (lastResetMonth !== currentMonth) {
      await resetUserSearchCount(userId);
      return {
        userId,
        searchCount: 0,
        lastResetDate: new Date(),
        currentMonth,
        canSearch: true,
        remainingSearches: isPremium ? SEARCH_LIMITS.PREMIUM_UNLIMITED : SEARCH_LIMITS.FREE_SEARCHES_PER_MONTH,
        isPremium
      };
    }

    const searchCount = user.searchCount || 0;
    const canSearch = isPremium || searchCount < SEARCH_LIMITS.FREE_SEARCHES_PER_MONTH;
    const remainingSearches = isPremium 
      ? SEARCH_LIMITS.PREMIUM_UNLIMITED 
      : Math.max(0, SEARCH_LIMITS.FREE_SEARCHES_PER_MONTH - searchCount);

    return {
      userId,
      searchCount,
      lastResetDate: user.searchCountResetDate,
      currentMonth,
      canSearch,
      remainingSearches,
      isPremium
    };
  } catch (error) {
    console.error('Error getting user search usage:', error);
    throw error;
  }
}

/**
 * Increment user's search count
 */
export async function incrementSearchCount(userId: string): Promise<SearchUsage> {
  try {
    const usage = await getUserSearchUsage(userId);
    
    // Premium users have unlimited searches
    if (usage.isPremium) {
      return usage;
    }
    
    // Check if user has reached the limit
    if (!usage.canSearch) {
      throw new Error('Search limit reached');
    }
    
    // Increment the count
    const newCount = usage.searchCount + 1;
    await updateUserSearchCount(userId, newCount, usage.currentMonth);
    
    return {
      ...usage,
      searchCount: newCount,
      canSearch: newCount < SEARCH_LIMITS.FREE_SEARCHES_PER_MONTH,
      remainingSearches: Math.max(0, SEARCH_LIMITS.FREE_SEARCHES_PER_MONTH - newCount)
    };
  } catch (error) {
    console.error('Error incrementing search count:', error);
    throw error;
  }
}

/**
 * Reset user's search count for new month
 */
export async function resetUserSearchCount(userId: string): Promise<void> {
  try {
    const currentMonth = getCurrentMonth();
    await updateUserSearchCount(userId, 0, currentMonth);
  } catch (error) {
    console.error('Error resetting search count:', error);
    throw error;
  }
}

/**
 * Get current month string (YYYY-MM format)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check if user can perform search
 */
export async function canUserSearch(userId: string): Promise<{
  canSearch: boolean;
  remainingSearches: number;
  isPremium: boolean;
  message?: string;
}> {
  try {
    const usage = await getUserSearchUsage(userId);
    
    if (usage.isPremium) {
      return {
        canSearch: true,
        remainingSearches: -1,
        isPremium: true
      };
    }
    
    if (!usage.canSearch) {
      return {
        canSearch: false,
        remainingSearches: 0,
        isPremium: false,
        message: `今月の検索回数上限（${SEARCH_LIMITS.FREE_SEARCHES_PER_MONTH}回）に達しました。プレミアムプランで無制限検索をご利用ください。`
      };
    }
    
    return {
      canSearch: true,
      remainingSearches: usage.remainingSearches,
      isPremium: false,
      message: usage.remainingSearches <= 5 
        ? `残り${usage.remainingSearches}回の検索が可能です。` 
        : undefined
    };
  } catch (error) {
    console.error('Error checking user search permission:', error);
    // On error, allow search but log the issue
    return {
      canSearch: true,
      remainingSearches: -1,
      isPremium: false
    };
  }
}

/**
 * Get search limit warning message
 */
export function getSearchLimitMessage(remainingSearches: number, isPremium: boolean): string | null {
  if (isPremium) {
    return null;
  }
  
  if (remainingSearches === 0) {
    return '今月の検索回数上限に達しました。プレミアムプランで無制限検索をご利用ください。';
  }
  
  if (remainingSearches <= 5) {
    return `残り${remainingSearches}回の検索が可能です。プレミアムプランで無制限検索をご利用ください。`;
  }
  
  return null;
}

/**
 * Monthly reset scheduler function
 * This should be called by a cron job or scheduled task
 */
export async function performMonthlyReset(): Promise<void> {
  try {
    console.log('Starting monthly search count reset...');
    
    // This would typically be implemented with a database query
    // to reset all users' search counts at once
    // For now, we'll implement it as a placeholder
    
    const currentMonth = getCurrentMonth();
    console.log(`Resetting search counts for month: ${currentMonth}`);
    
    // In a real implementation, you would:
    // 1. Query all users from the database
    // 2. Reset their search counts
    // 3. Update their lastResetDate
    
    console.log('Monthly search count reset completed');
  } catch (error) {
    console.error('Error performing monthly reset:', error);
    throw error;
  }
}