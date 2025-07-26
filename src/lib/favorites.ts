import { getDatabase } from '../../lib/database';
import { getUserById } from '../../lib/auth';

/**
 * Favorites management system for premium users
 */

export interface Favorite {
  id: string;
  userId: string;
  itemType: 'food' | 'recipe';
  itemId: string;
  itemData: {
    name: string;
    description?: string;
    imageUrl?: string;
    category?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoritesList {
  favorites: Favorite[];
  total: number;
  hasMore: boolean;
}

/**
 * Add item to favorites
 */
export async function addToFavorites(
  userId: string,
  itemType: 'food' | 'recipe',
  itemId: string,
  itemData: Favorite['itemData']
): Promise<Favorite> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const favoriteId = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if item is already in favorites
    const existing = await db.get(
      'SELECT id FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [userId, itemType, itemId]
    );

    if (existing) {
      throw new Error('Item is already in favorites');
    }

    // Insert new favorite
    await db.run(
      `INSERT INTO favorites (
        id, user_id, item_type, item_id, item_data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        favoriteId,
        userId,
        itemType,
        itemId,
        JSON.stringify(itemData),
        now.toISOString(),
        now.toISOString()
      ]
    );

    return {
      id: favoriteId,
      userId,
      itemType,
      itemId,
      itemData,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

/**
 * Remove item from favorites
 */
export async function removeFromFavorites(
  userId: string,
  itemType: 'food' | 'recipe',
  itemId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();

    const result = await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [userId, itemType, itemId]
    );

    return (result.changes || 0) > 0;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

/**
 * Get user's favorites list
 */
export async function getUserFavorites(
  userId: string,
  options: {
    itemType?: 'food' | 'recipe';
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'name';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<FavoritesList> {
  try {
    const db = await getDatabase();
    const {
      itemType,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Build query conditions
    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (itemType) {
      whereClause += ' AND item_type = ?';
      params.push(itemType);
    }

    // Build sort clause
    const sortColumn = sortBy === 'name' ? "JSON_EXTRACT(item_data, '$.name')" : sortBy;
    const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // Get favorites with pagination
    const favorites = await db.all(
      `SELECT * FROM favorites ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM favorites ${whereClause}`,
      params
    );

    const total = countResult?.total || 0;
    const hasMore = offset + favorites.length < total;

    // Transform database results to Favorite objects
    const transformedFavorites: Favorite[] = favorites.map(row => ({
      id: row.id,
      userId: row.user_id,
      itemType: row.item_type as 'food' | 'recipe',
      itemId: row.item_id,
      itemData: JSON.parse(row.item_data),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));

    return {
      favorites: transformedFavorites,
      total,
      hasMore
    };
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
}

/**
 * Check if item is in user's favorites
 */
export async function isInFavorites(
  userId: string,
  itemType: 'food' | 'recipe',
  itemId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();

    const result = await db.get(
      'SELECT id FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [userId, itemType, itemId]
    );

    return !!result;
  } catch (error) {
    console.error('Error checking if item is in favorites:', error);
    return false;
  }
}

/**
 * Get favorites count for user
 */
export async function getFavoritesCount(
  userId: string,
  itemType?: 'food' | 'recipe'
): Promise<number> {
  try {
    const db = await getDatabase();

    let query = 'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?';
    const params: any[] = [userId];

    if (itemType) {
      query += ' AND item_type = ?';
      params.push(itemType);
    }

    const result = await db.get(query, params);
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting favorites count:', error);
    return 0;
  }
}

/**
 * Clear all favorites for user
 */
export async function clearUserFavorites(
  userId: string,
  itemType?: 'food' | 'recipe'
): Promise<number> {
  try {
    const db = await getDatabase();

    let query = 'DELETE FROM favorites WHERE user_id = ?';
    const params: any[] = [userId];

    if (itemType) {
      query += ' AND item_type = ?';
      params.push(itemType);
    }

    const result = await db.run(query, params);
    return result.changes || 0;
  } catch (error) {
    console.error('Error clearing user favorites:', error);
    throw error;
  }
}

/**
 * Update favorite item data (when source data changes)
 */
export async function updateFavoriteItemData(
  userId: string,
  itemType: 'food' | 'recipe',
  itemId: string,
  itemData: Favorite['itemData']
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const now = new Date();

    const result = await db.run(
      'UPDATE favorites SET item_data = ?, updated_at = ? WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [JSON.stringify(itemData), now.toISOString(), userId, itemType, itemId]
    );

    return (result.changes || 0) > 0;
  } catch (error) {
    console.error('Error updating favorite item data:', error);
    throw error;
  }
}

/**
 * Get popular favorites (for recommendations)
 */
export async function getPopularFavorites(
  itemType?: 'food' | 'recipe',
  limit: number = 10
): Promise<Array<{
  itemId: string;
  itemType: 'food' | 'recipe';
  itemData: Favorite['itemData'];
  favoriteCount: number;
}>> {
  try {
    const db = await getDatabase();

    let query = `
      SELECT 
        item_id, 
        item_type, 
        item_data, 
        COUNT(*) as favorite_count
      FROM favorites 
    `;
    const params: any[] = [];

    if (itemType) {
      query += ' WHERE item_type = ?';
      params.push(itemType);
    }

    query += `
      GROUP BY item_id, item_type 
      ORDER BY favorite_count DESC 
      LIMIT ?
    `;
    params.push(limit);

    const results = await db.all(query, params);

    return results.map(row => ({
      itemId: row.item_id,
      itemType: row.item_type as 'food' | 'recipe',
      itemData: JSON.parse(row.item_data),
      favoriteCount: row.favorite_count
    }));
  } catch (error) {
    console.error('Error getting popular favorites:', error);
    return [];
  }
}