import { NextRequest, NextResponse } from 'next/server';
import { getFoodById } from '@/lib/data-loader';
import { getRecipesByFoodName } from '@/lib/rakuten-recipe-api';
import { ApiErrors, createErrorResponse } from '@/lib/api-errors';

/**
 * GET /api/foods/[id]/recipes
 * 特定の食材に関連するレシピを取得
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const foodId = params.id;

    // 食材IDの検証
    if (!foodId || typeof foodId !== 'string' || foodId.trim() === '') {
      throw ApiErrors.invalidRequest('有効な食材IDを指定してください');
    }

    // 食材情報を取得
    const food = await getFoodById(foodId);
    if (!food) {
      throw ApiErrors.notFound('食材');
    }

    // 食材名でレシピを検索
    const recipes = await getRecipesByFoodName(food.name, 15);

    return NextResponse.json({
      food: {
        id: food.id,
        name: food.name,
        description: food.description
      },
      recipes,
      total: recipes.length
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200'
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}