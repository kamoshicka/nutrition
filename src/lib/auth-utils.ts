import { getServerSession } from 'next-auth';
import { authOptions, User, getUserById, updateUserSubscription } from '../../lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Re-export functions for convenience
export { getUserById, updateUserSubscription };

/**
 * Utility functions for authentication and authorization
 */

/**
 * Get the current user session on the server side
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Check if the current user has premium subscription
 */
export async function requirePremium(): Promise<User> {
  const user = await requireAuth();
  if (user.subscription.status !== 'premium') {
    throw new Error('Premium subscription required');
  }
  return user;
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuthAPI(handler: (req: NextRequest, user: User) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const user = await requireAuth();
      return await handler(req, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      console.error('Auth API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware wrapper for API routes that require premium subscription
 */
export function withPremiumAPI(handler: (req: NextRequest, user: User) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const user = await requirePremium();
      return await handler(req, user);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        if (error.message === 'Premium subscription required') {
          return NextResponse.json(
            { error: 'Premium subscription required', upgradeUrl: '/pricing' },
            { status: 403 }
          );
        }
      }
      console.error('Premium API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user can perform search (now unlimited for all users)
 */
export async function canUserSearch(): Promise<{ canSearch: boolean; remainingSearches: number; isPremium: boolean }> {
  const user = await getCurrentUser();
  
  if (!user) {
    return { canSearch: false, remainingSearches: 0, isPremium: false };
  }

  const isPremium = user.subscription.status === 'premium';
  
  // Search is now unlimited for all users
  return { canSearch: true, remainingSearches: -1, isPremium };
}

/**
 * Get user's subscription status
 */
export function getSubscriptionStatus(user: User | null): {
  isPremium: boolean;
  isCancelled: boolean;
  isFree: boolean;
  status: string;
} {
  if (!user) {
    return {
      isPremium: false,
      isCancelled: false,
      isFree: true,
      status: 'free'
    };
  }

  const status = user.subscription?.status || 'free';
  
  return {
    isPremium: status === 'premium',
    isCancelled: status === 'cancelled',
    isFree: status === 'free',
    status
  };
}

/**
 * Format subscription period dates
 */
export function formatSubscriptionPeriod(user: User): {
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  daysUntilRenewal: number | null;
} {
  const subscription = user.subscription;
  
  if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
    return {
      currentPeriodStart: null,
      currentPeriodEnd: null,
      daysUntilRenewal: null
    };
  }

  const now = new Date();
  const endDate = new Date(subscription.currentPeriodEnd);
  const daysUntilRenewal = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    currentPeriodStart: subscription.currentPeriodStart.toLocaleDateString('ja-JP'),
    currentPeriodEnd: subscription.currentPeriodEnd.toLocaleDateString('ja-JP'),
    daysUntilRenewal: daysUntilRenewal > 0 ? daysUntilRenewal : 0
  };
}