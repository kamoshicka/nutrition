import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { getNutritionCalculation, updateNutritionCalculation, deleteNutritionCalculation } from '../../../../../lib/nutrition-calculations';
import { withPremiumCheck } from '../../../../../middleware/premium-check';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/nutrition/calculations/[id]
 * Get nutrition calculation by ID
 */
export const GET = withPremiumCheck(async function(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const calculation = await getNutritionCalculation(session.user.id, id);

    if (!calculation) {
      return NextResponse.json(
        { error: 'Nutrition calculation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(calculation);

  } catch (error) {
    console.error('Error getting nutrition calculation:', error);
    
    return NextResponse.json(
      { error: 'Failed to get nutrition calculation' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/nutrition/calculations/[id]
 * Update nutrition calculation
 */
export const PUT = withPremiumCheck(async function(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, selectedFoods, ageGroup, gender } = body;

    // Validate required fields
    if (!name || !selectedFoods || !Array.isArray(selectedFoods)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, selectedFoods' },
        { status: 400 }
      );
    }

    if (selectedFoods.length === 0) {
      return NextResponse.json(
        { error: 'At least one food must be selected' },
        { status: 400 }
      );
    }

    const calculation = await updateNutritionCalculation(
      session.user.id,
      id,
      name,
      selectedFoods,
      ageGroup,
      gender
    );

    if (!calculation) {
      return NextResponse.json(
        { error: 'Nutrition calculation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(calculation);

  } catch (error) {
    console.error('Error updating nutrition calculation:', error);
    
    return NextResponse.json(
      { error: 'Failed to update nutrition calculation' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/nutrition/calculations/[id]
 * Delete nutrition calculation
 */
export const DELETE = withPremiumCheck(async function(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const deleted = await deleteNutritionCalculation(session.user.id, id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Nutrition calculation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Nutrition calculation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting nutrition calculation:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete nutrition calculation' },
      { status: 500 }
    );
  }
});