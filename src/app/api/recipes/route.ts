import { NextRequest, NextResponse } from 'next/server';
import { getRecipeRanking } from '@/lib/rakuten-recipe-api';
import { createErrorResponse } from '@/app/api/error';

/**
 * GET /api/recipes
 * レシピランキングを取得
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');

    const recipes = await getRecipeRanking(categoryId, page);

    return NextResponse.json({
      recipes,
      page,
      hasMore: recipes.length === 20, // 20件取得できた場合は次のページがある可能性
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}