import { FoodNutrition, NutritionData } from './nutrition';

/**
 * Nutrition database for common Japanese foods
 * Data based on Standard Tables of Food Composition in Japan
 */

export const NUTRITION_DATABASE: FoodNutrition[] = [
  // Vegetables
  {
    id: 'tomato',
    name: 'トマト',
    category: '野菜',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 19,
      protein: 0.7,
      fat: 0.1,
      carbohydrates: 4.7,
      fiber: 1.0,
      sodium: 3,
      potassium: 210,
      calcium: 7,
      iron: 0.2,
      vitaminA: 45,
      vitaminB1: 0.05,
      vitaminB2: 0.02,
      vitaminC: 15,
      vitaminD: 0,
      vitaminE: 0.9
    }
  },
  {
    id: 'carrot',
    name: 'にんじん',
    category: '野菜',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 37,
      protein: 0.6,
      fat: 0.1,
      carbohydrates: 9.1,
      fiber: 2.5,
      sodium: 28,
      potassium: 270,
      calcium: 27,
      iron: 0.2,
      vitaminA: 720,
      vitaminB1: 0.07,
      vitaminB2: 0.06,
      vitaminC: 4,
      vitaminD: 0,
      vitaminE: 0.5
    }
  },
  {
    id: 'spinach',
    name: 'ほうれん草',
    category: '野菜',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 20,
      protein: 2.2,
      fat: 0.4,
      carbohydrates: 3.1,
      fiber: 2.8,
      sodium: 16,
      potassium: 690,
      calcium: 49,
      iron: 2.0,
      vitaminA: 350,
      vitaminB1: 0.11,
      vitaminB2: 0.20,
      vitaminC: 35,
      vitaminD: 0,
      vitaminE: 2.1
    }
  },
  {
    id: 'broccoli',
    name: 'ブロッコリー',
    category: '野菜',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 33,
      protein: 4.3,
      fat: 0.5,
      carbohydrates: 5.2,
      fiber: 4.4,
      sodium: 20,
      potassium: 360,
      calcium: 38,
      iron: 1.0,
      vitaminA: 67,
      vitaminB1: 0.14,
      vitaminB2: 0.20,
      vitaminC: 120,
      vitaminD: 0,
      vitaminE: 2.4
    }
  },
  {
    id: 'cabbage',
    name: 'キャベツ',
    category: '野菜',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 23,
      protein: 1.3,
      fat: 0.2,
      carbohydrates: 5.2,
      fiber: 1.8,
      sodium: 5,
      potassium: 200,
      calcium: 43,
      iron: 0.3,
      vitaminA: 5,
      vitaminB1: 0.04,
      vitaminB2: 0.03,
      vitaminC: 41,
      vitaminD: 0,
      vitaminE: 0.1
    }
  },

  // Fruits
  {
    id: 'apple',
    name: 'りんご',
    category: '果物',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 54,
      protein: 0.2,
      fat: 0.1,
      carbohydrates: 14.6,
      fiber: 1.5,
      sodium: 0,
      potassium: 110,
      calcium: 3,
      iron: 0.1,
      vitaminA: 1,
      vitaminB1: 0.02,
      vitaminB2: 0.01,
      vitaminC: 4,
      vitaminD: 0,
      vitaminE: 0.1
    }
  },
  {
    id: 'banana',
    name: 'バナナ',
    category: '果物',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 86,
      protein: 1.1,
      fat: 0.2,
      carbohydrates: 22.5,
      fiber: 1.1,
      sodium: 0,
      potassium: 360,
      calcium: 6,
      iron: 0.3,
      vitaminA: 5,
      vitaminB1: 0.05,
      vitaminB2: 0.04,
      vitaminC: 16,
      vitaminD: 0,
      vitaminE: 0.5
    }
  },
  {
    id: 'orange',
    name: 'オレンジ',
    category: '果物',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 46,
      protein: 1.0,
      fat: 0.1,
      carbohydrates: 11.7,
      fiber: 1.0,
      sodium: 1,
      potassium: 140,
      calcium: 21,
      iron: 0.2,
      vitaminA: 8,
      vitaminB1: 0.07,
      vitaminB2: 0.04,
      vitaminC: 60,
      vitaminD: 0,
      vitaminE: 0.3
    }
  },

  // Grains
  {
    id: 'rice',
    name: '白米（炊飯）',
    category: '穀類',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 168,
      protein: 2.5,
      fat: 0.3,
      carbohydrates: 37.1,
      fiber: 0.3,
      sodium: 1,
      potassium: 29,
      calcium: 3,
      iron: 0.1,
      vitaminA: 0,
      vitaminB1: 0.02,
      vitaminB2: 0.01,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0.1
    }
  },
  {
    id: 'bread',
    name: '食パン',
    category: '穀類',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 264,
      protein: 9.3,
      fat: 4.4,
      carbohydrates: 46.7,
      fiber: 2.3,
      sodium: 500,
      potassium: 100,
      calcium: 29,
      iron: 0.6,
      vitaminA: 2,
      vitaminB1: 0.07,
      vitaminB2: 0.06,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0.5
    }
  },

  // Proteins
  {
    id: 'chicken_breast',
    name: '鶏むね肉（皮なし）',
    category: '肉類',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 108,
      protein: 22.3,
      fat: 1.5,
      carbohydrates: 0,
      fiber: 0,
      sodium: 40,
      potassium: 370,
      calcium: 4,
      iron: 0.3,
      vitaminA: 6,
      vitaminB1: 0.08,
      vitaminB2: 0.10,
      vitaminC: 1,
      vitaminD: 0.1,
      vitaminE: 0.2
    }
  },
  {
    id: 'salmon',
    name: '鮭',
    category: '魚類',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 133,
      protein: 22.3,
      fat: 4.1,
      carbohydrates: 0.1,
      fiber: 0,
      sodium: 59,
      potassium: 350,
      calcium: 10,
      iron: 0.5,
      vitaminA: 11,
      vitaminB1: 0.15,
      vitaminB2: 0.21,
      vitaminC: 1,
      vitaminD: 32.0,
      vitaminE: 1.2
    }
  },
  {
    id: 'tofu',
    name: '木綿豆腐',
    category: '豆類',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 72,
      protein: 6.6,
      fat: 4.2,
      carbohydrates: 1.6,
      fiber: 0.4,
      sodium: 7,
      potassium: 110,
      calcium: 120,
      iron: 0.9,
      vitaminA: 0,
      vitaminB1: 0.07,
      vitaminB2: 0.03,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0.4
    }
  },
  {
    id: 'egg',
    name: '鶏卵',
    category: '卵類',
    unit: '個',
    standardAmount: 50, // 1個あたり約50g
    nutrition: {
      calories: 151,
      protein: 12.3,
      fat: 10.3,
      carbohydrates: 0.3,
      fiber: 0,
      sodium: 140,
      potassium: 130,
      calcium: 51,
      iron: 1.8,
      vitaminA: 150,
      vitaminB1: 0.06,
      vitaminB2: 0.43,
      vitaminC: 0,
      vitaminD: 1.8,
      vitaminE: 1.0
    }
  },

  // Dairy
  {
    id: 'milk',
    name: '牛乳',
    category: '乳類',
    unit: 'ml',
    standardAmount: 100,
    nutrition: {
      calories: 67,
      protein: 3.3,
      fat: 3.8,
      carbohydrates: 4.8,
      fiber: 0,
      sodium: 41,
      potassium: 150,
      calcium: 110,
      iron: 0.02,
      vitaminA: 38,
      vitaminB1: 0.04,
      vitaminB2: 0.15,
      vitaminC: 1,
      vitaminD: 0.3,
      vitaminE: 0.1
    }
  },
  {
    id: 'yogurt',
    name: 'プレーンヨーグルト',
    category: '乳類',
    unit: 'g',
    standardAmount: 100,
    nutrition: {
      calories: 62,
      protein: 3.6,
      fat: 3.0,
      carbohydrates: 4.9,
      fiber: 0,
      sodium: 48,
      potassium: 170,
      calcium: 120,
      iron: 0.1,
      vitaminA: 33,
      vitaminB1: 0.04,
      vitaminB2: 0.14,
      vitaminC: 1,
      vitaminD: 0,
      vitaminE: 0.1
    }
  }
];

/**
 * Get nutrition data for a food by ID
 */
export function getFoodNutrition(foodId: string): FoodNutrition | null {
  return NUTRITION_DATABASE.find(food => food.id === foodId) || null;
}

/**
 * Search foods by name or category
 */
export function searchFoodNutrition(query: string): FoodNutrition[] {
  const lowerQuery = query.toLowerCase();
  return NUTRITION_DATABASE.filter(food => 
    food.name.toLowerCase().includes(lowerQuery) ||
    food.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get foods by category
 */
export function getFoodsByCategory(category: string): FoodNutrition[] {
  return NUTRITION_DATABASE.filter(food => food.category === category);
}

/**
 * Get all available categories
 */
export function getNutritionCategories(): string[] {
  return Array.from(new Set(NUTRITION_DATABASE.map(food => food.category)));
}

/**
 * Get all foods
 */
export function getAllFoodNutrition(): FoodNutrition[] {
  return NUTRITION_DATABASE;
}