import { User } from './auth';

export function isPremiumUser(user: User | null): boolean {
  if (!user) return false;
  return user.subscription.status === 'premium';
}

export function canAccessPremiumFeature(user: User | null): boolean {
  return isPremiumUser(user);
}

export function hasSearchLimitReached(user: User | null): boolean {
  if (!user) return false;
  if (isPremiumUser(user)) return false;
  
  const MONTHLY_SEARCH_LIMIT = 30;
  return user.searchCount >= MONTHLY_SEARCH_LIMIT;
}

export function getRemainingSearches(user: User | null): number {
  if (!user) return 0;
  if (isPremiumUser(user)) return Infinity;
  
  const MONTHLY_SEARCH_LIMIT = 30;
  return Math.max(0, MONTHLY_SEARCH_LIMIT - user.searchCount);
}

export interface PremiumFeatureCheck {
  hasAccess: boolean;
  reason?: 'not_authenticated' | 'not_premium' | 'search_limit_reached';
  upgradeUrl?: string;
}

export function checkPremiumFeatureAccess(
  user: User | null,
  feature: 'favorites' | 'nutrition_calculator' | 'pdf_export' | 'shopping_list' | 'unlimited_search'
): PremiumFeatureCheck {
  if (!user) {
    return {
      hasAccess: false,
      reason: 'not_authenticated',
      upgradeUrl: '/auth/signin',
    };
  }

  if (feature === 'unlimited_search') {
    if (hasSearchLimitReached(user)) {
      return {
        hasAccess: false,
        reason: 'search_limit_reached',
        upgradeUrl: '/pricing',
      };
    }
    return { hasAccess: true };
  }

  if (!isPremiumUser(user)) {
    return {
      hasAccess: false,
      reason: 'not_premium',
      upgradeUrl: '/pricing',
    };
  }

  return { hasAccess: true };
}