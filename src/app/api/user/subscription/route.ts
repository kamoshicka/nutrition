import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getDatabase } from '../../../../../lib/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE user_id = ?',
      [session.user.id]
    );

    if (!subscription) {
      return NextResponse.json({
        subscription: {
          status: 'free',
          cancelAtPeriodEnd: false,
        }
      });
    }

    return NextResponse.json({
      subscription: {
        status: subscription.status,
        stripeCustomerId: subscription.stripe_customer_id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start) : null,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}