import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { addRecipeToShoppingList } from '../../../../lib/shopping-list';
import { withPremiumCheck } from '../../../../middleware/premium-check';

/**
 * POST /api/shopping-list/recipe
 * Add recipe ingredients to shopping list
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
    const { recipeId, recipeName, ingredients, category } = body;

    // Validate required fields
    if (!recipeId || !recipeName || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: 'Missing required fields: recipeId, recipeName, ingredients' },
        { status: 400 }
      );
    }

    // Validate ingredients structure
    for (const ingredient of ingredients) {
      if (!ingredient.name) {
        return NextResponse.json(
          { error: 'Each ingredient must have a name' },
          { status: 400 }
        );
      }
    }

    const addedItems = await addRecipeToShoppingList(
      session.user.id,
      recipeId,
      recipeName,
      ingredients,
      category
    );

    return NextResponse.json({
      success: true,
      addedItems,
      count: addedItems.length,
      message: `Added ${addedItems.length} ingredients from ${recipeName} to shopping list`
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding recipe to shopping list:', error);
    
    return NextResponse.json(
      { error: 'Failed to add recipe to shopping list' },
      { status: 500 }
    );
  }
});