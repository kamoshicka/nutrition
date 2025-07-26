import { getDatabase } from '../../lib/database';
import { getUserById } from '../../lib/auth';

/**
 * Shopping list management system for premium users
 */

export interface ShoppingListItem {
  id: string;
  userId: string;
  foodName: string;
  quantity?: string;
  unit?: string;
  checked: boolean;
  recipeId?: string;
  recipeName?: string;
  category?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  total: number;
  checkedCount: number;
  uncheckedCount: number;
  completionPercentage: number;
}

export interface RecipeIngredient {
  name: string;
  amount?: string;
  unit?: string;
}

/**
 * Add item to shopping list
 */
export async function addToShoppingList(
  userId: string,
  foodName: string,
  quantity?: string,
  unit?: string,
  recipeId?: string,
  recipeName?: string,
  category?: string,
  notes?: string
): Promise<ShoppingListItem> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const itemId = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if similar item already exists (same food name and recipe)
    const existingItem = await db.get(
      'SELECT * FROM shopping_list WHERE user_id = ? AND food_name = ? AND recipe_id = ?',
      [userId, foodName, recipeId || null]
    );

    if (existingItem) {
      // Update existing item quantity if provided
      if (quantity) {
        await db.run(
          'UPDATE shopping_list SET quantity = ?, updated_at = ? WHERE id = ?',
          [quantity, now.toISOString(), existingItem.id]
        );
        
        return {
          id: existingItem.id,
          userId,
          foodName,
          quantity,
          unit,
          checked: existingItem.checked,
          recipeId,
          recipeName,
          category,
          notes,
          createdAt: new Date(existingItem.created_at),
          updatedAt: now
        };
      } else {
        // Return existing item without changes
        return {
          id: existingItem.id,
          userId: existingItem.user_id,
          foodName: existingItem.food_name,
          quantity: existingItem.quantity,
          unit: existingItem.unit,
          checked: existingItem.checked,
          recipeId: existingItem.recipe_id,
          recipeName: existingItem.recipe_name,
          category: existingItem.category,
          notes: existingItem.notes,
          createdAt: new Date(existingItem.created_at),
          updatedAt: new Date(existingItem.updated_at)
        };
      }
    }

    // Insert new item
    await db.run(
      `INSERT INTO shopping_list (
        id, user_id, food_name, quantity, unit, checked, recipe_id, recipe_name, category, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        userId,
        foodName,
        quantity || null,
        unit || null,
        false,
        recipeId || null,
        recipeName || null,
        category || null,
        notes || null,
        now.toISOString(),
        now.toISOString()
      ]
    );

    return {
      id: itemId,
      userId,
      foodName,
      quantity,
      unit,
      checked: false,
      recipeId,
      recipeName,
      category,
      notes,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    console.error('Error adding to shopping list:', error);
    throw error;
  }
}

/**
 * Add multiple items from recipe ingredients
 */
export async function addRecipeToShoppingList(
  userId: string,
  recipeId: string,
  recipeName: string,
  ingredients: RecipeIngredient[],
  category?: string
): Promise<ShoppingListItem[]> {
  try {
    const addedItems: ShoppingListItem[] = [];

    for (const ingredient of ingredients) {
      const item = await addToShoppingList(
        userId,
        ingredient.name,
        ingredient.amount,
        ingredient.unit,
        recipeId,
        recipeName,
        category
      );
      addedItems.push(item);
    }

    return addedItems;
  } catch (error) {
    console.error('Error adding recipe to shopping list:', error);
    throw error;
  }
}

/**
 * Update shopping list item
 */
export async function updateShoppingListItem(
  userId: string,
  itemId: string,
  updates: {
    foodName?: string;
    quantity?: string;
    unit?: string;
    checked?: boolean;
    notes?: string;
  }
): Promise<ShoppingListItem | null> {
  try {
    const db = await getDatabase();
    const now = new Date();

    // Check if item exists and belongs to user
    const existingItem = await db.get(
      'SELECT * FROM shopping_list WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (!existingItem) {
      return null;
    }

    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.foodName !== undefined) {
      updateFields.push('food_name = ?');
      updateValues.push(updates.foodName);
    }
    if (updates.quantity !== undefined) {
      updateFields.push('quantity = ?');
      updateValues.push(updates.quantity);
    }
    if (updates.unit !== undefined) {
      updateFields.push('unit = ?');
      updateValues.push(updates.unit);
    }
    if (updates.checked !== undefined) {
      updateFields.push('checked = ?');
      updateValues.push(updates.checked);
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(updates.notes);
    }

    updateFields.push('updated_at = ?');
    updateValues.push(now.toISOString());
    updateValues.push(itemId, userId);

    await db.run(
      `UPDATE shopping_list SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    // Return updated item
    const updatedItem = await db.get(
      'SELECT * FROM shopping_list WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    return {
      id: updatedItem.id,
      userId: updatedItem.user_id,
      foodName: updatedItem.food_name,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      checked: updatedItem.checked,
      recipeId: updatedItem.recipe_id,
      recipeName: updatedItem.recipe_name,
      category: updatedItem.category,
      notes: updatedItem.notes,
      createdAt: new Date(updatedItem.created_at),
      updatedAt: new Date(updatedItem.updated_at)
    };
  } catch (error) {
    console.error('Error updating shopping list item:', error);
    throw error;
  }
}

/**
 * Remove item from shopping list
 */
export async function removeFromShoppingList(
  userId: string,
  itemId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();

    const result = await db.run(
      'DELETE FROM shopping_list WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    return (result.changes || 0) > 0;
  } catch (error) {
    console.error('Error removing from shopping list:', error);
    throw error;
  }
}

/**
 * Get user's shopping list
 */
export async function getUserShoppingList(
  userId: string,
  options: {
    includeChecked?: boolean;
    recipeId?: string;
    category?: string;
    sortBy?: 'created_at' | 'food_name' | 'recipe_name';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<ShoppingList> {
  try {
    const db = await getDatabase();
    const {
      includeChecked = true,
      recipeId,
      category,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Build query conditions
    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (!includeChecked) {
      whereClause += ' AND checked = 0';
    }

    if (recipeId) {
      whereClause += ' AND recipe_id = ?';
      params.push(recipeId);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    // Build sort clause
    const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Get items
    const items = await db.all(
      `SELECT * FROM shopping_list ${whereClause} ${orderClause}`,
      params
    );

    // Get counts
    const countResult = await db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN checked = 1 THEN 1 ELSE 0 END) as checked_count,
        SUM(CASE WHEN checked = 0 THEN 1 ELSE 0 END) as unchecked_count
       FROM shopping_list ${whereClause}`,
      params
    );

    const total = countResult?.total || 0;
    const checkedCount = countResult?.checked_count || 0;
    const uncheckedCount = countResult?.unchecked_count || 0;
    const completionPercentage = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    // Transform database results
    const transformedItems: ShoppingListItem[] = items.map(row => ({
      id: row.id,
      userId: row.user_id,
      foodName: row.food_name,
      quantity: row.quantity,
      unit: row.unit,
      checked: row.checked,
      recipeId: row.recipe_id,
      recipeName: row.recipe_name,
      category: row.category,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));

    return {
      items: transformedItems,
      total,
      checkedCount,
      uncheckedCount,
      completionPercentage
    };
  } catch (error) {
    console.error('Error getting user shopping list:', error);
    throw error;
  }
}

/**
 * Toggle item checked status
 */
export async function toggleShoppingListItem(
  userId: string,
  itemId: string
): Promise<ShoppingListItem | null> {
  try {
    const db = await getDatabase();

    // Get current item
    const item = await db.get(
      'SELECT * FROM shopping_list WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (!item) {
      return null;
    }

    // Toggle checked status
    const newCheckedStatus = !item.checked;
    const now = new Date();

    await db.run(
      'UPDATE shopping_list SET checked = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [newCheckedStatus, now.toISOString(), itemId, userId]
    );

    return {
      id: item.id,
      userId: item.user_id,
      foodName: item.food_name,
      quantity: item.quantity,
      unit: item.unit,
      checked: newCheckedStatus,
      recipeId: item.recipe_id,
      recipeName: item.recipe_name,
      category: item.category,
      notes: item.notes,
      createdAt: new Date(item.created_at),
      updatedAt: now
    };
  } catch (error) {
    console.error('Error toggling shopping list item:', error);
    throw error;
  }
}

/**
 * Clear checked items from shopping list
 */
export async function clearCheckedItems(userId: string): Promise<number> {
  try {
    const db = await getDatabase();

    const result = await db.run(
      'DELETE FROM shopping_list WHERE user_id = ? AND checked = 1',
      [userId]
    );

    return result.changes || 0;
  } catch (error) {
    console.error('Error clearing checked items:', error);
    throw error;
  }
}

/**
 * Clear all items from shopping list
 */
export async function clearShoppingList(userId: string): Promise<number> {
  try {
    const db = await getDatabase();

    const result = await db.run(
      'DELETE FROM shopping_list WHERE user_id = ?',
      [userId]
    );

    return result.changes || 0;
  } catch (error) {
    console.error('Error clearing shopping list:', error);
    throw error;
  }
}

/**
 * Get shopping list by recipe
 */
export async function getShoppingListByRecipe(
  userId: string,
  recipeId: string
): Promise<ShoppingListItem[]> {
  try {
    const shoppingList = await getUserShoppingList(userId, { recipeId });
    return shoppingList.items;
  } catch (error) {
    console.error('Error getting shopping list by recipe:', error);
    throw error;
  }
}

/**
 * Get shopping list categories
 */
export async function getShoppingListCategories(userId: string): Promise<string[]> {
  try {
    const db = await getDatabase();

    const categories = await db.all(
      'SELECT DISTINCT category FROM shopping_list WHERE user_id = ? AND category IS NOT NULL ORDER BY category',
      [userId]
    );

    return categories.map(row => row.category);
  } catch (error) {
    console.error('Error getting shopping list categories:', error);
    return [];
  }
}

/**
 * Get shopping list statistics
 */
export async function getShoppingListStats(userId: string): Promise<{
  totalItems: number;
  checkedItems: number;
  uncheckedItems: number;
  completionPercentage: number;
  recipeCount: number;
  categoryCount: number;
}> {
  try {
    const db = await getDatabase();

    const stats = await db.get(
      `SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN checked = 1 THEN 1 ELSE 0 END) as checked_items,
        SUM(CASE WHEN checked = 0 THEN 1 ELSE 0 END) as unchecked_items,
        COUNT(DISTINCT recipe_id) as recipe_count,
        COUNT(DISTINCT category) as category_count
       FROM shopping_list 
       WHERE user_id = ?`,
      [userId]
    );

    const totalItems = stats?.total_items || 0;
    const checkedItems = stats?.checked_items || 0;
    const uncheckedItems = stats?.unchecked_items || 0;
    const completionPercentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      checkedItems,
      uncheckedItems,
      completionPercentage,
      recipeCount: stats?.recipe_count || 0,
      categoryCount: stats?.category_count || 0
    };
  } catch (error) {
    console.error('Error getting shopping list stats:', error);
    return {
      totalItems: 0,
      checkedItems: 0,
      uncheckedItems: 0,
      completionPercentage: 0,
      recipeCount: 0,
      categoryCount: 0
    };
  }
}