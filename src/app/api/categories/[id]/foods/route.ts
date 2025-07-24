import { NextRequest, NextResponse } from 'next/server';
import { getFoodsByCategory, getCategoryById } from '@/lib/data-loader';
import { ErrorResponse } from '@/types';

/**
 * GET /api/categories/[id]/foods
 * Returns all foods for a specific category
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const categoryId = params.id;
    
    // Validate category ID
    if (!categoryId || typeof categoryId !== 'string' || categoryId.trim() === '') {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INVALID_CATEGORY_ID',
          message: '有効なカテゴリIDを指定してください'
        }
      };
      
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Check if category exists
    const category = await getCategoryById(categoryId);
    if (!category) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '指定されたカテゴリが見つかりません',
          details: { categoryId }
        }
      };
      
      return NextResponse.json(errorResponse, {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get foods for the category
    const foods = await getFoodsByCategory(categoryId);
    
    return NextResponse.json(foods, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error(`Error in GET /api/categories/${params.id}/foods:`, error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: 'FOODS_LOAD_ERROR',
        message: 'カテゴリの食材読み込みに失敗しました',
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