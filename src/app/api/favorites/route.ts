import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getUserFavorites, addToFavorites, clearUserFavorites } from '../../../lib/favorites';
import { withPremiumCheck } from '../../../middleware/premium-check';

/**
 * GET /api/favorites
 * Get user's favorites list
 */
export const GET = withPremiumCheck(async function(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const itemType = searchParams.get('type') as 'food' | 'recipe' | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;
    const sortBy = searchParams.get('sortBy') as 'created_at' | 'name' | null;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;

    const favorites = await getUserFavorites(session.user.id, {
      itemType: itemType || undefined,
      limit,
      offset,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'desc'
    });

    return NextResponse.json(favorites);

  } catch (error) {
    console.error('Error getting favorites:', error);
    
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/favorites
 * Add item to favorites
 */
export const POST = withPremiumCheck(async function(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemType, itemId, itemData } = body;

    // Validate required fields
    if (!itemType || !itemId || !itemData) {
      return NextResponse.json(
        { error: 'Missing required fields: itemType, itemId, itemData' },
        { status: 400 }
      );
    }

    // Validate itemType
    if (!['food', 'recipe'].includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid itemType. Must be "food" or "recipe"' },
        { status: 400 }
      );
    }

    // Validate itemData structure
    if (!itemData.name) {
      return NextResponse.json(
        { error: 'itemData must include name field' },
        { status: 400 }
      );
    }

    const favorite = await addToFavorites(
      session.user.id,
      itemType,
      itemId,
      itemData
    );

    return NextResponse.json(favorite, { status: 201 });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    
    if (error instanceof Error && error.message === 'Item is already in favorites') {
      return NextResponse.json(
        { error: 'Item is already in favorites' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add to favorites' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/favorites
 * Clear all favorites
 */
export const DELETE = withPremiumCheck(async function(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const itemType = searchParams.get('type') as 'food' | 'recipe' | null;

    const deletedCount = await clearUserFavorites(
      session.user.id,
      itemType || undefined
    );

    return NextResponse.json({
      success: true,
      deletedCount,
      message: itemType 
        ? `Cleared ${deletedCount} ${itemType} favorites`
        : `Cleared ${deletedCount} favorites`
    });

  } catch (error) {
    console.error('Error clearing favorites:', error);
    
    return NextResponse.json(
      { error: 'Failed to clear favorites' },
      { status: 500 }
    );
  }
});