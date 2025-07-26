import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { withPremiumCheck } from '../../../../middleware/premium-check';

/**
 * POST /api/pdf/recipe
 * Generate PDF for recipe data
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
    const { recipeData } = body;

    // Validate required fields
    if (!recipeData || !recipeData.name) {
      return NextResponse.json(
        { error: 'Missing required fields: recipeData with name' },
        { status: 400 }
      );
    }

    // In a real implementation, you would generate the PDF server-side
    // For now, we'll return success and let the client handle PDF generation
    return NextResponse.json({
      success: true,
      message: 'PDF generation request received',
      filename: `recipe-${recipeData.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    });

  } catch (error) {
    console.error('Error processing recipe PDF request:', error);
    
    return NextResponse.json(
      { error: 'Failed to process PDF request' },
      { status: 500 }
    );
  }
});