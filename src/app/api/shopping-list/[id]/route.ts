import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { updateShoppingListItem, removeFromShoppingList, toggleShoppingListItem } from '../../../../lib/shopping-list';
import { withPremiumCheck } from '../../../../middleware/premium-check';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/shopping-list/[id]
 * Update shopping list item
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

    const { id } = params;
    const body = await request.json();
    const { foodName, quantity, unit, checked, notes } = body;

    const updatedItem = await updateShoppingListItem(session.user.id, id, {
      foodName,
      quantity,
      unit,
      checked,
      notes
    });

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Shopping list item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('Error updating shopping list item:', error);
    
    return NextResponse.json(
      { error: 'Failed to update shopping list item' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/shopping-list/[id]
 * Remove item from shopping list
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

    const { id } = params;
    const removed = await removeFromShoppingList(session.user.id, id);

    if (!removed) {
      return NextResponse.json(
        { error: 'Shopping list item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from shopping list'
    });

  } catch (error) {
    console.error('Error removing from shopping list:', error);
    
    return NextResponse.json(
      { error: 'Failed to remove from shopping list' },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/shopping-list/[id]
 * Toggle item checked status
 */
export const PATCH = withPremiumCheck(async function(
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

    const { id } = params;
    const toggledItem = await toggleShoppingListItem(session.user.id, id);

    if (!toggledItem) {
      return NextResponse.json(
        { error: 'Shopping list item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(toggledItem);

  } catch (error) {
    console.error('Error toggling shopping list item:', error);
    
    return NextResponse.json(
      { error: 'Failed to toggle shopping list item' },
      { status: 500 }
    );
  }
});