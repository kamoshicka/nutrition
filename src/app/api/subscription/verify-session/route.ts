import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, updateUserSubscription } from '@/lib/auth';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify that the session belongs to the current user
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Session does not belong to current user' },
        { status: 403 }
      );
    }

    const subscription = checkoutSession.subscription as any;
    const customer = checkoutSession.customer as any;

    if (subscription && customer) {
      // Update user subscription in database
      await updateUserSubscription(session.user.id, {
        status: 'premium',
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      },
    });

  } catch (error) {
    console.error('Error verifying session:', error);
    
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}