import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getUserById, updateUserSubscription } from '../../../../../lib/auth';
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

    const user = await getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Cancel the subscription at period end (don't cancel immediately)
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update local database
    await updateUserSubscription(user.id, {
      status: user.subscription.status, // Keep current status until period ends
      stripeCustomerId: user.subscription.stripeCustomerId,
      stripeSubscriptionId: user.subscription.stripeSubscriptionId,
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current period',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}