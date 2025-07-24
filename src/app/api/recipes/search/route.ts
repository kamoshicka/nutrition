import { NextRequest, NextResponse } from 'next/server';
import { searchRecipes } from '@/lib/rakuten-recipe-api';
import { createErrorResponse, ApiErrors } from '@/app/api/error';

/**
 * GET /api/recipes/search
 * キーワードでレシピを検索
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('q');
    const categoryId = searchParams.get('categoryId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const hits = parseInt(searchParams.get('hits') || '20');

    if (!keyword || keyword.trim() === '') {
      throw ApiErrors.invalidRequest('検索キーワードを指定してください');
    }

    const recipes = await searchRecipes(keyword.trim(), {
      categoryId,
      page,
      hits
    });

    return NextResponse.json({
      recipes,
      keyword: keyword.trim(),
      page,
      hasMore: recipes.length === hits,
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