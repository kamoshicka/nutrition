import { NextResponse } from 'next/server';
import { loadCategories } from '@/lib/data-loader';
import { ErrorResponse } from '@/types';

/**
 * GET /api/categories
 * Returns all available categories
 */
export async function GET(): Promise<NextResponse> {
  try {
    const categories = await loadCategories();
    
    return NextResponse.json(categories, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: 'CATEGORIES_LOAD_ERROR',
        message: 'カテゴリの読み込みに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };
    
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}