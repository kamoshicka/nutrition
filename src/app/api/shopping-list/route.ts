import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getUserShoppingList, addToShoppingList, clearShoppingList, clearCheckedItems } from '../../../lib/shopping-list';
import { withPremiumCheck } from '../../../middleware/premium-check';

/**
 * GET /api/shopping-list
 * Get user's shopping list
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
    const includeChecked = searchParams.get('includeChecked') !== 'false';
    const recipeId = searchParams.get('recipeId');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') as 'created_at' | 'food_name' | 'recipe_name' | null;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;

    const shoppingList = await getUserShoppingList(session.user.id, {
      includeChecked,
      recipeId: recipeId || undefined,
      category: category || undefined,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'desc'
    });

    return NextResponse.json(shoppingList);

  } catch (error) {
    console.error('Error getting shopping list:', error);
    
    return NextResponse.json(
      { error: 'Failed to get shopping list' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/shopping-list
 * Add item to shopping list
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
    const { foodName, quantity, unit, recipeId, recipeName, category, notes } = body;

    // Validate required fields
    if (!foodName) {
      return NextResponse.json(
        { error: 'Missing required field: foodName' },
        { status: 400 }
      );
    }

    const item = await addToShoppingList(
      session.user.id,
      foodName,
      quantity,
      unit,
      recipeId,
      recipeName,
      category,
      notes
    );

    return NextResponse.json(item, { status: 201 });

  } catch (error) {
    console.error('Error adding to shopping list:', error);
    
    return NextResponse.json(
      { error: 'Failed to add to shopping list' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/shopping-list
 * Clear shopping list items
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
    const clearType = searchParams.get('type'); // 'checked' or 'all'

    let deletedCount: number;
    let message: string;

    if (clearType === 'checked') {
      deletedCount = await clearCheckedItems(session.user.id);
      message = `Cleared ${deletedCount} checked items`;
    } else {
      deletedCount = await clearShoppingList(session.user.id);
      message = `Cleared ${deletedCount} items`;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message
    });

  } catch (error) {
    console.error('Error clearing shopping list:', error);
    
    return NextResponse.json(
      { error: 'Failed to clear shopping list' },
      { status: 500 }
    );
  }
});