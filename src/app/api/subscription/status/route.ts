import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getUserById } from '../../../../../lib/auth';
import { stripe } from '@/lib/stripe-server';

export async function GET(request: NextRequest) {
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

    let stripeSubscription = null;
    
    // If user has a Stripe subscription, fetch the latest status
    if (user.subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    const response = {
      subscription: {
        status: user.subscription.status,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
      },
      stripe: stripeSubscription ? {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      } : null,
      isPremium: user.subscription.status === 'premium',
      isCancelled: user.subscription.status === 'cancelled',
      isFree: user.subscription.status === 'free',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting subscription status:', error);
    
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

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
        { error: 'No Stripe subscription found' },
        { status: 400 }
      );
    }

    // Sync with Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId
    );

    const status = mapStripeStatusToAppStatus(stripeSubscription.status);
    
    // Update local database with Stripe data
    const { updateUserSubscription } = await import('../../../../../lib/auth');
    await updateUserSubscription(user.id, {
      status,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription status synchronized',
      subscription: {
        status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

  } catch (error) {
    console.error('Error syncing subscription status:', error);
    
    return NextResponse.json(
      { error: 'Failed to sync subscription status' },
      { status: 500 }
    );
  }
}

function mapStripeStatusToAppStatus(stripeStatus: string): 'free' | 'premium' | 'cancelled' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'premium';
    case 'canceled':
    case 'unpaid':
    case 'past_due':
      return 'cancelled';
    case 'incomplete':
    case 'incomplete_expired':
    default:
      return 'free';
  }
}