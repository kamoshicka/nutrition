import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Premium feature access control middleware
 * Checks if user has premium subscription for protected routes
 */

const PREMIUM_ROUTES = [
  '/api/favorites',
  '/api/nutrition',
  '/api/pdf',
  '/api/shopping-list',
  '/favorites',
  '/nutrition',
  '/pdf',
  '/shopping-list'
];

const FREE_TIER_LIMITS = {
  searchesPerDay: 50,
  favoritesLimit: 10,
  nutritionCalculationsPerDay: 5
};

export async function premiumCheckMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a premium route
  const isPremiumRoute = PREMIUM_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isPremiumRoute) {
    return NextResponse.next();
  }
  
  try {
    // Get user token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'プレミアム機能を利用するにはログインが必要です',
          upgradeUrl: '/auth/signin'
        },
        { status: 401 }
      );
    }
    
    // Check subscription status
    const user = token.user as any;
    const subscriptionStatus = user?.subscription?.status || 'free';
    
    if (subscriptionStatus !== 'premium') {
      // For API routes, return JSON error
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Premium subscription required',
            message: 'この機能はプレミアムプランでのみご利用いただけます',
            upgradeUrl: '/pricing',
            currentPlan: subscriptionStatus,
            limits: FREE_TIER_LIMITS
          },
          { status: 403 }
        );
      }
      
      // For page routes, redirect to pricing page
      const url = request.nextUrl.clone();
      url.pathname = '/pricing';
      url.searchParams.set('from', pathname);
      url.searchParams.set('reason', 'premium_required');
      
      return NextResponse.redirect(url);
    }
    
    // User has premium access, continue
    return NextResponse.next();
    
  } catch (error) {
    console.error('Premium check middleware error:', error);
    
    // On error, allow access but log the issue
    return NextResponse.next();
  }
}

/**
 * Check if user can access premium feature
 * Used in components and pages for conditional rendering
 */
export function checkPremiumAccess(user: any): {
  hasPremium: boolean;
  canAccess: boolean;
  message?: string;
  upgradeUrl?: string;
} {
  if (!user) {
    return {
      hasPremium: false,
      canAccess: false,
      message: 'ログインが必要です',
      upgradeUrl: '/auth/signin'
    };
  }
  
  const subscriptionStatus = user.subscription?.status || 'free';
  const hasPremium = subscriptionStatus === 'premium';
  
  if (!hasPremium) {
    return {
      hasPremium: false,
      canAccess: false,
      message: 'プレミアムプランが必要です',
      upgradeUrl: '/pricing'
    };
  }
  
  return {
    hasPremium: true,
    canAccess: true
  };
}

/**
 * Premium feature wrapper for API routes
 */
export function withPremiumCheck(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const premiumCheck = await premiumCheckMiddleware(req);
    
    // If middleware returns a response (error), return it
    if (premiumCheck.status !== 200) {
      return premiumCheck;
    }
    
    // Otherwise, proceed with the handler
    return handler(req);
  };
}

/**
 * Get user's usage limits based on subscription
 */
export function getUserLimits(user: any): {
  searchesPerDay: number;
  favoritesLimit: number;
  nutritionCalculationsPerDay: number;
  hasUnlimitedAccess: boolean;
} {
  const subscriptionStatus = user?.subscription?.status || 'free';
  
  if (subscriptionStatus === 'premium') {
    return {
      searchesPerDay: -1, // Unlimited
      favoritesLimit: -1, // Unlimited
      nutritionCalculationsPerDay: -1, // Unlimited
      hasUnlimitedAccess: true
    };
  }
  
  return {
    ...FREE_TIER_LIMITS,
    hasUnlimitedAccess: false
  };
}