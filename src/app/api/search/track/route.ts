import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, updateUserSearchCount } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is premium (premium users don't have search limits)
    const isPremium = session.user.subscription?.status === 'premium';
    
    if (isPremium) {
      return NextResponse.json({
        searchCount: 0,
        remainingSearches: -1, // -1 indicates unlimited
        isPremium: true
      });
    }

    const body = await request.json();
    const { increment = 1 } = body;

    // Update search count
    const newSearchCount = await updateUserSearchCount(session.user.id, increment);
    const searchLimit = 30;
    const remainingSearches = Math.max(0, searchLimit - newSearchCount);

    return NextResponse.json({
      searchCount: newSearchCount,
      remainingSearches,
      searchLimit,
      isPremium: false
    });
  } catch (error) {
    console.error('Search tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is premium
    const isPremium = session.user.subscription?.status === 'premium';
    
    if (isPremium) {
      return NextResponse.json({
        searchCount: 0,
        remainingSearches: -1, // -1 indicates unlimited
        isPremium: true
      });
    }

    const searchCount = session.user.searchCount || 0;
    const searchLimit = 30;
    const remainingSearches = Math.max(0, searchLimit - searchCount);

    return NextResponse.json({
      searchCount,
      remainingSearches,
      searchLimit,
      isPremium: false
    });
  } catch (error) {
    console.error('Search status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}