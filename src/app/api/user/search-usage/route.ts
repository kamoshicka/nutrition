import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { canUserSearch } from '../../../../lib/search-limits';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/search-usage
 * Get current user's search usage information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: '検索使用量を取得するにはログインが必要です'
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchUsage = await canUserSearch(userId);

    return NextResponse.json({
      canSearch: searchUsage.canSearch,
      remainingSearches: searchUsage.remainingSearches,
      isPremium: searchUsage.isPremium,
      message: searchUsage.message,
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting user search usage:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get search usage',
        message: '検索使用量の取得に失敗しました'
      },
      { status: 500 }
    );
  }
}