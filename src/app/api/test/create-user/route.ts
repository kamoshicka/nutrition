import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getDatabase } from '../../../../../lib/database';

export async function POST(request: NextRequest) {
  // Only allow in test environment or with Cypress test header
  const isCypressTest = request.headers.get('x-cypress-test') === 'true';
  if (process.env.NODE_ENV === 'production' && !isCypressTest) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { email, password, isPremium = false } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.run(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      [userId, email, 'Test User', hashedPassword, new Date().toISOString()]
    );

    // Create subscription
    const subscriptionStatus = isPremium ? 'premium' : 'free';
    const currentPeriodStart = isPremium ? new Date().toISOString() : null;
    const currentPeriodEnd = isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

    await db.run(
      'INSERT INTO subscriptions (id, user_id, status, current_period_start, current_period_end) VALUES (?, ?, ?, ?, ?)',
      [`sub-${userId}`, userId, subscriptionStatus, currentPeriodStart, currentPeriodEnd]
    );

    return NextResponse.json({ 
      success: true, 
      userId,
      email,
      isPremium 
    });

  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
  }
}