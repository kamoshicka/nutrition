import { NextRequest, NextResponse } from 'next/server';
import { getSuggestedSearchTerms } from '@/lib/search';
import { ErrorResponse } from '@/types';

/**
 * GET /api/search/suggestions?q=:query
 * Get search suggestions based on query
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get search query from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    
    // Get optional parameters
    const limit = searchParams.has('limit') 
      ? parseInt(searchParams.get('limit') || '5', 10) 
      : 5;
    
    // Validate query parameter
    if (query.trim() === '') {
      return NextResponse.json({ suggestions: [] }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get suggestions
    const suggestions = await getSuggestedSearchTerms(query, limit);
    
    // Return suggestions
    return NextResponse.json({ suggestions }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/search/suggestions:', error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: 'SUGGESTIONS_ERROR',
        message: '検索候補の取得中にエラーが発生しました',
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