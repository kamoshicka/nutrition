import { NextResponse } from 'next/server';
import { getRecipeCategories } from '@/lib/rakuten-recipe-api';
import { createErrorResponse } from '@/lib/api-errors';

/**
 * GET /api/recipes/categories
 * レシピカテゴリ一覧を取得
 */
export async function GET(): Promise<NextResponse> {
  try {
    const categories = await getRecipeCategories();

    return NextResponse.json({
      categories,
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200' // カテゴリは変更頻度が低いため長めにキャッシュ
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}