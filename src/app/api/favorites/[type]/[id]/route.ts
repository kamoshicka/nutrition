import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { removeFromFavorites, isInFavorites, updateFavoriteItemData } from '../../../../../lib/favorites';
import { withPremiumCheck } from '../../../../../middleware/premium-check';

interface RouteParams {
  params: {
    type: string;
    id: string;
  };
}

/**
 * GET /api/favorites/[type]/[id]
 * Check if item is in favorites
 */
export const GET = withPremiumCheck(async function(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { type, id } = params;

    // Validate type parameter
    if (!['food', 'recipe'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "food" or "recipe"' },
        { status: 400 }
      );
    }

    const isFavorite = await isInFavorites(
      session.user.id,
      type as 'food' | 'recipe',
      id
    );

    return NextResponse.json({
      isFavorite,
      itemType: type,
      itemId: id
    });

  } catch (error) {
    console.error('Error checking favorite status:', error);
    
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/favorites/[type]/[id]
 * Update favorite item data
 */
export const PUT = withPremiumCheck(async function(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { type, id } = params;
    const body = await request.json();
    const { itemData } = body;

    // Validate type parameter
    if (!['food', 'recipe'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "food" or "recipe"' },
        { status: 400 }
      );
    }

    // Validate itemData
    if (!itemData || !itemData.name) {
      return NextResponse.json(
        { error: 'itemData must include name field' },
        { status: 400 }
      );
    }

    const updated = await updateFavoriteItemData(
      session.user.id,
      type as 'food' | 'recipe',
      id,
      itemData
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Favorite updated successfully'
    });

  } catch (error) {
    console.error('Error updating favorite:', error);
    
    return NextResponse.json(
      { error: 'Failed to update favorite' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/favorites/[type]/[id]
 * Remove item from favorites
 */
export const DELETE = withPremiumCheck(async function(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { type, id } = params;

    // Validate type parameter
    if (!['food', 'recipe'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "food" or "recipe"' },
        { status: 400 }
      );
    }

    const removed = await removeFromFavorites(
      session.user.id,
      type as 'food' | 'recipe',
      id
    );

    if (!removed) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    
    return NextResponse.json(
      { error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
});