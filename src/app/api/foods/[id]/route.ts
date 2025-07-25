import { NextRequest, NextResponse } from 'next/server';
import { getFoodById, getCookingMethodsByFood } from '@/lib/data-loader';
import { ApiErrors, createErrorResponse } from '@/lib/api-errors';

/**
 * GET /api/foods/[id]
 * Returns detailed information about a specific food and its associated cooking methods
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const foodId = params.id;
    
    // Validate food ID
    if (!foodId || typeof foodId !== 'string' || foodId.trim() === '') {
      throw ApiErrors.invalidRequest('有効な食材IDを指定してください');
    }
    
    // Get food details
    const food = await getFoodById(foodId);
    if (!food) {
      throw ApiErrors.notFound('食材');
    }
    
    // Get associated cooking methods
    const cookingMethods = await getCookingMethodsByFood(foodId);
    
    // Sort cooking methods by nutrition retention (highest first)
    const sortedCookingMethods = [...cookingMethods].sort(
      (a, b) => b.nutritionRetention - a.nutritionRetention
    );
    
    // Return combined response
    return NextResponse.json({
      food,
      cookingMethods: sortedCookingMethods
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