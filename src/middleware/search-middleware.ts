import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { canUserSearch, incrementSearchCount } from '../lib/search-limits';

/**
 * Search middleware to enforce search limits for free users
 */
export async function searchMiddleware(request: NextRequest) {
  try {
    // Get user token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token?.user?.id) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: '検索機能を利用するにはログインが必要です',
          loginUrl: '/auth/signin'
        },
        { status: 401 }
      );
    }
    
    const userId = token.user.id as string;
    
    // Check if user can search
    const searchPermission = await canUserSearch(userId);
    
    if (!searchPermission.canSearch) {
      return NextResponse.json(
        {
          error: 'Search limit exceeded',
          message: searchPermission.message,
          remainingSearches: 0,
          isPremium: false,
          upgradeUrl: '/pricing',
          resetDate: getNextMonthResetDate()
        },
        { status: 429 } // Too Many Requests
      );
    }
    
    // If user can search, increment the count (for non-premium users)
    if (!searchPermission.isPremium) {
      try {
        await incrementSearchCount(userId);
      } catch (error) {
        console.error('Error incrementing search count:', error);
        // Don't block the search if count increment fails
      }
    }
    
    // Add search usage info to response headers for client-side display
    const response = NextResponse.next();
    response.headers.set('X-Search-Remaining', searchPermission.remainingSearches.toString());
    response.headers.set('X-Search-Is-Premium', searchPermission.isPremium.toString());
    
    if (searchPermission.message) {
      response.headers.set('X-Search-Warning', searchPermission.message);
    }
    
    return response;
    
  } catch (error) {
    console.error('Search middleware error:', error);
    
    // On error, allow search but log the issue
    return NextResponse.next();
  }
}

/**
 * Wrapper for search API routes
 */
export function withSearchLimits(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Apply search middleware
    const middlewareResult = await searchMiddleware(req);
    
    // If middleware returns an error response, return it
    if (middlewareResult.status !== 200) {
      return middlewareResult;
    }
    
    // Otherwise, proceed with the handler
    return handler(req);
  };
}

/**
 * Get next month reset date
 */
function getNextMonthResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

/**
 * Extract search usage info from response headers
 */
export function extractSearchUsageFromHeaders(response: Response): {
  remainingSearches: number;
  isPremium: boolean;
  warning?: string;
} {
  const remaining = response.headers.get('X-Search-Remaining');
  const isPremium = response.headers.get('X-Search-Is-Premium') === 'true';
  const warning = response.headers.get('X-Search-Warning');
  
  return {
    remainingSearches: remaining ? parseInt(remaining, 10) : -1,
    isPremium,
    warning: warning || undefined
  };
}