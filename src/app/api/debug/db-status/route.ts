import { NextResponse } from 'next/server';
import { getDatabase, initializeDatabase } from '../../../../../lib/database';

export async function GET() {
  try {
    // Try to initialize database first
    await initializeDatabase();
    
    const db = await getDatabase();
    
    // Check if tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    // Check user count
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    
    // Check subscription count
    const subscriptionCount = await db.get('SELECT COUNT(*) as count FROM subscriptions');
    
    return NextResponse.json({
      status: 'success',
      tables: tables.map(t => t.name),
      userCount: userCount?.count || 0,
      subscriptionCount: subscriptionCount?.count || 0,
      message: 'Database is accessible and initialized'
    });
  } catch (error) {
    console.error('Database status check failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database check failed'
    }, { status: 500 });
  }
}