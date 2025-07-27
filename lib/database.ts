import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { withOptimizedQuery } from './database-optimizer';
import { logger } from './logger';
import { errorMonitoring } from './error-monitoring';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  const dbPath = path.join(process.cwd(), 'data', 'app.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  // Create users table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      search_count INTEGER DEFAULT 0,
      search_count_reset_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create subscriptions table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_start DATETIME,
      current_period_end DATETIME,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create favorites table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('food', 'recipe')),
      item_id TEXT NOT NULL,
      item_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, item_type, item_id)
    )
  `);

  // Create shopping_list table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS shopping_list (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      quantity TEXT,
      unit TEXT,
      checked BOOLEAN DEFAULT FALSE,
      recipe_id TEXT,
      recipe_name TEXT,
      category TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create nutrition_calculations table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS nutrition_calculations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      foods_data TEXT NOT NULL,
      total_nutrition TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list(user_id);
    CREATE INDEX IF NOT EXISTS idx_nutrition_calculations_user_id ON nutrition_calculations(user_id);
  `);

  console.log('Database initialized successfully');
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

/**
 * Execute an optimized database query with monitoring and caching
 */
export async function executeOptimizedQuery<T>(
  query: string,
  params: any[] = [],
  options?: {
    cache?: boolean;
    cacheKey?: string;
    timeout?: number;
  }
): Promise<T> {
  try {
    const database = await getDatabase();
    return await withOptimizedQuery<T>(database, query, params, options);
  } catch (error) {
    errorMonitoring.reportError(error instanceof Error ? error : String(error), {
      url: 'database_query',
      method: 'QUERY'
    });
    throw error;
  }
}

/**
 * Get user by ID with caching
 */
export async function getUserById(userId: string): Promise<any> {
  return executeOptimizedQuery(
    'SELECT * FROM users WHERE id = ?',
    [userId],
    { cache: true, cacheKey: `user_${userId}` }
  );
}

/**
 * Get user subscription with caching
 */
export async function getUserSubscription(userId: string): Promise<any> {
  return executeOptimizedQuery(
    'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId],
    { cache: true, cacheKey: `subscription_${userId}` }
  );
}

/**
 * Get user favorites with pagination
 */
export async function getUserFavorites(
  userId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<any[]> {
  return executeOptimizedQuery(
    'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset],
    { cache: true, cacheKey: `favorites_${userId}_${limit}_${offset}` }
  );
}

/**
 * Get user shopping list items
 */
export async function getShoppingListItems(userId: string): Promise<any[]> {
  return executeOptimizedQuery(
    'SELECT * FROM shopping_list WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    { cache: true, cacheKey: `shopping_list_${userId}` }
  );
}

/**
 * Update user search count with optimized query
 */
export async function updateUserSearchCount(userId: string): Promise<void> {
  await executeOptimizedQuery(
    'UPDATE users SET search_count = search_count + 1 WHERE id = ?',
    [userId]
  );
}