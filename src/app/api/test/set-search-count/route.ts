import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getDatabase } from '../../../../../lib/database';

export async function POST(request: NextRequest) {
  // Only allow in test environment
  if (process.env.NODE_ENV !== 'test' && process.env.CYPRESS_TEST !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count } = await request.json();

    if (typeof count !== 'number' || count < 0) {
      return NextResponse.json({ error: 'Invalid count' }, { status: 400 });
    }

    const db = await getDatabase();
    
    await db.run(
      'UPDATE users SET search_count = ? WHERE id = ?',
      [count, session.user.id]
    );

    return NextResponse.json({ success: true, count });

  } catch (error) {
    console.error('Error setting search count:', error);
    return NextResponse.json({ error: 'Failed to set search count' }, { status: 500 });
  }
}