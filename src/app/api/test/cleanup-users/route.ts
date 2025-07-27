import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../../lib/database';

export async function DELETE(request: NextRequest) {
  // Only allow in test environment or with Cypress test header
  const isCypressTest = request.headers.get('x-cypress-test') === 'true';
  if (process.env.NODE_ENV === 'production' && !isCypressTest) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const db = await getDatabase();
    
    // Delete test users and related data
    await db.run('DELETE FROM favorites WHERE user_id LIKE "test-user-%"');
    await db.run('DELETE FROM shopping_list WHERE user_id LIKE "test-user-%"');
    await db.run('DELETE FROM nutrition_calculations WHERE user_id LIKE "test-user-%"');
    await db.run('DELETE FROM subscriptions WHERE user_id LIKE "test-user-%"');
    await db.run('DELETE FROM users WHERE id LIKE "test-user-%"');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error cleaning up test users:', error);
    return NextResponse.json({ error: 'Failed to cleanup test users' }, { status: 500 });
  }
}