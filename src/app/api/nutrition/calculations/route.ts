import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { saveNutritionCalculation, getUserNutritionCalculations } from '../../../../lib/nutrition-calculations';
import { withPremiumCheck } from '../../../../middleware/premium-check';

/**
 * GET /api/nutrition/calculations
 * Get user's nutrition calculations
 */
export const GET = withPremiumCheck(async function(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;
    const sortBy = searchParams.get('sortBy') as 'created_at' | 'name' | null;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;

    const calculations = await getUserNutritionCalculations(session.user.id, {
      limit,
      offset,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'desc'
    });

    return NextResponse.json(calculations);

  } catch (error) {
    console.error('Error getting nutrition calculations:', error);
    
    return NextResponse.json(
      { error: 'Failed to get nutrition calculations' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/nutrition/calculations
 * Save nutrition calculation
 */
export const POST = withPremiumCheck(async function(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    // Validate selectedFoods structure
    for (const food of selectedFoods) {
      if (!food.food || !food.quantity || !food.unit) {
        return NextResponse.json(
          { error: 'Invalid selectedFoods structure' },
          { status: 400 }
        );
      }
    }

    const calculation = await saveNutritionCalculation(
      session.user.id,
      name,
      selectedFoods,
      ageGroup,
      gender
    );

    return NextResponse.json(calculation, { status: 201 });

  } catch (error) {
    console.error('Error saving nutrition calculation:', error);
    
    return NextResponse.json(
      { error: 'Failed to save nutrition calculation' },
      { status: 500 }
    );
  }
});