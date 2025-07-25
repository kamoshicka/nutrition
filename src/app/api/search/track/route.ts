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

    const isPremium = session.user.subscription?.status === 'premium';
    const body = await request.json();
    const { increment = 1 } = body;

    // Still track search count for analytics, but no limits for any user
    const newSearchCount = await updateUserSearchCount(session.user.id, increment);

    return NextResponse.json({
      searchCount: newSearchCount,
      remainingSearches: -1, // -1 indicates unlimited for all users
      searchLimit: -1, // No limit
      isPremium
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

    const isPremium = session.user.subscription?.status === 'premium';
    const searchCount = session.user.searchCount || 0;

    return NextResponse.json({
      searchCount,
      remainingSearches: -1, // -1 indicates unlimited for all users
      searchLimit: -1, // No limit
      isPremium
    });
  } catch (error) {
    console.error('Search status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}