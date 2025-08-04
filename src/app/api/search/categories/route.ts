import { NextRequest, NextResponse } from 'next/server';
import { searchCategories } from '@/lib/search';
import { ErrorResponse } from '@/types';
import { withSearchLimits } from '../../../../middleware/search-middleware';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/search/categories?q=:query
 * Search categories by name or description
 */
export const GET = withSearchLimits(async function(request: NextRequest): Promise<NextResponse> {
  try {
    // Get search query from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    
    // Get optional parameters
    const limit = searchParams.has('limit') 
      ? parseInt(searchParams.get('limit') || '10', 10) 
      : undefined;
    const caseSensitive = searchParams.get('caseSensitive') === 'true';
    const exactMatch = searchParams.get('exactMatch') === 'true';
    
    // Validate query parameter
    if (query.trim() === '') {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INVALID_SEARCH_QUERY',
          message: '検索クエリを指定してください',
          details: { query }
        }
      };
      
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Validate limit parameter if provided
    if (searchParams.has('limit')) {
      const limitValue = parseInt(searchParams.get('limit') || '', 10);
      if (isNaN(limitValue) || limitValue < 1) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_LIMIT_PARAMETER',
            message: '有効な制限値を指定してください（1以上の整数）',
            details: { limit: searchParams.get('limit') }
          }
        };
        
        return NextResponse.json(errorResponse, {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // Perform search
    const searchResult = await searchCategories(query, {
      limit,
      caseSensitive,
      exactMatch
    });
    
    // Return search results
    return NextResponse.json(searchResult, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/search/categories:', error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: 'CATEGORY_SEARCH_ERROR',
        message: 'カテゴリ検索中にエラーが発生しました',
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
});