import { getDatabase } from '../../lib/database';
import { getUserById } from '../../lib/auth';
import { SelectedFood, NutritionTotals, calculateTotalNutrition, compareWithRecommendedIntake, NutritionComparison } from './nutrition';

/**
 * Nutrition calculation management system for premium users
 */

export interface SavedNutritionCalculation {
  id: string;
  userId: string;
  name: string;
  selectedFoods: SelectedFood[];
  nutritionTotals: NutritionTotals;
  ageGroup?: string;
  gender?: 'male' | 'female';
  comparison?: NutritionComparison[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionCalculationsList {
  calculations: SavedNutritionCalculation[];
  total: number;
  hasMore: boolean;
}

/**
 * Save nutrition calculation
 */
export async function saveNutritionCalculation(
  userId: string,
  name: string,
  selectedFoods: SelectedFood[],
  ageGroup?: string,
  gender?: 'male' | 'female'
): Promise<SavedNutritionCalculation> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const calculationId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate nutrition totals
    const nutritionTotals = calculateTotalNutrition(selectedFoods);
    
    // Calculate comparison if age group and gender are provided
    let comparison: NutritionComparison[] | undefined;
    if (ageGroup && gender) {
      comparison = compareWithRecommendedIntake(nutritionTotals, ageGroup, gender);
    }

    // Save to database
    await db.run(
      `INSERT INTO nutrition_calculations (
        id, user_id, name, foods_data, total_nutrition, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        calculationId,
        userId,
        name,
        JSON.stringify({
          selectedFoods,
          ageGroup,
          gender,
          comparison
        }),
        JSON.stringify(nutritionTotals),
        now.toISOString()
      ]
    );

    return {
      id: calculationId,
      userId,
      name,
      selectedFoods,
      nutritionTotals,
      ageGroup,
      gender,
      comparison,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    console.error('Error saving nutrition calculation:', error);
    throw error;
  }
}

/**
 * Get user's nutrition calculations
 */
export async function getUserNutritionCalculations(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'name';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<NutritionCalculationsList> {
  try {
    const db = await getDatabase();
    const {
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Build sort clause
    const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Get calculations with pagination
    const calculations = await db.all(
      `SELECT * FROM nutrition_calculations WHERE user_id = ? ${orderClause} LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM nutrition_calculations WHERE user_id = ?',
      [userId]
    );

    const total = countResult?.total || 0;
    const hasMore = offset + calculations.length < total;

    // Transform database results
    const transformedCalculations: SavedNutritionCalculation[] = calculations.map(row => {
      const foodsData = JSON.parse(row.foods_data);
      const nutritionTotals = JSON.parse(row.total_nutrition);

      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        selectedFoods: foodsData.selectedFoods,
        nutritionTotals,
        ageGroup: foodsData.ageGroup,
        gender: foodsData.gender,
        comparison: foodsData.comparison,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.created_at) // Using created_at as updated_at for now
      };
    });

    return {
      calculations: transformedCalculations,
      total,
      hasMore
    };
  } catch (error) {
    console.error('Error getting user nutrition calculations:', error);
    throw error;
  }
}

/**
 * Get nutrition calculation by ID
 */
export async function getNutritionCalculation(
  userId: string,
  calculationId: string
): Promise<SavedNutritionCalculation | null> {
  try {
    const db = await getDatabase();

    const calculation = await db.get(
      'SELECT * FROM nutrition_calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );

    if (!calculation) {
      return null;
    }

    const foodsData = JSON.parse(calculation.foods_data);
    const nutritionTotals = JSON.parse(calculation.total_nutrition);

    return {
      id: calculation.id,
      userId: calculation.user_id,
      name: calculation.name,
      selectedFoods: foodsData.selectedFoods,
      nutritionTotals,
      ageGroup: foodsData.ageGroup,
      gender: foodsData.gender,
      comparison: foodsData.comparison,
      createdAt: new Date(calculation.created_at),
      updatedAt: new Date(calculation.created_at)
    };
  } catch (error) {
    console.error('Error getting nutrition calculation:', error);
    throw error;
  }
}

/**
 * Update nutrition calculation
 */
export async function updateNutritionCalculation(
  userId: string,
  calculationId: string,
  name: string,
  selectedFoods: SelectedFood[],
  ageGroup?: string,
  gender?: 'male' | 'female'
): Promise<SavedNutritionCalculation | null> {
  try {
    const db = await getDatabase();

    // Check if calculation exists and belongs to user
    const existing = await db.get(
      'SELECT id FROM nutrition_calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );

    if (!existing) {
      return null;
    }

    // Calculate nutrition totals
    const nutritionTotals = calculateTotalNutrition(selectedFoods);
    
    // Calculate comparison if age group and gender are provided
    let comparison: NutritionComparison[] | undefined;
    if (ageGroup && gender) {
      comparison = compareWithRecommendedIntake(nutritionTotals, ageGroup, gender);
    }

    // Update database
    await db.run(
      `UPDATE nutrition_calculations 
       SET name = ?, foods_data = ?, total_nutrition = ? 
       WHERE id = ? AND user_id = ?`,
      [
        name,
        JSON.stringify({
          selectedFoods,
          ageGroup,
          gender,
          comparison
        }),
        JSON.stringify(nutritionTotals),
        calculationId,
        userId
      ]
    );

    return {
      id: calculationId,
      userId,
      name,
      selectedFoods,
      nutritionTotals,
      ageGroup,
      gender,
      comparison,
      createdAt: new Date(), // Would need to get from DB in real implementation
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error updating nutrition calculation:', error);
    throw error;
  }
}

/**
 * Delete nutrition calculation
 */
export async function deleteNutritionCalculation(
  userId: string,
  calculationId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();

    const result = await db.run(
      'DELETE FROM nutrition_calculations WHERE id = ? AND user_id = ?',
      [calculationId, userId]
    );

    return (result.changes || 0) > 0;
  } catch (error) {
    console.error('Error deleting nutrition calculation:', error);
    throw error;
  }
}

/**
 * Get nutrition calculations count for user
 */
export async function getNutritionCalculationsCount(userId: string): Promise<number> {
  try {
    const db = await getDatabase();

    const result = await db.get(
      'SELECT COUNT(*) as count FROM nutrition_calculations WHERE user_id = ?',
      [userId]
    );

    return result?.count || 0;
  } catch (error) {
    console.error('Error getting nutrition calculations count:', error);
    return 0;
  }
}

/**
 * Clear all nutrition calculations for user
 */
export async function clearUserNutritionCalculations(userId: string): Promise<number> {
  try {
    const db = await getDatabase();

    const result = await db.run(
      'DELETE FROM nutrition_calculations WHERE user_id = ?',
      [userId]
    );

    return result.changes || 0;
  } catch (error) {
    console.error('Error clearing user nutrition calculations:', error);
    throw error;
  }
}