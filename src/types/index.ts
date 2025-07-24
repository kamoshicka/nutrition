// Type definitions for the healthcare food app

export interface Category {
  id: string;
  name: string;
  description: string;
  foodIds: string[];
}

export interface Food {
  id: string;
  name: string;
  description: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    vitamins: string[];
    minerals: string[];
  };
  healthBenefits: HealthBenefit[];
  precautions: string[];
  cookingMethodIds: string[];
}

export interface HealthBenefit {
  condition: string;
  effect: string;
  scientificBasis: string;
  effectiveness: 'high' | 'medium' | 'low';
}

export interface CookingMethod {
  id: string;
  name: string;
  description: string;
  steps: string[];
  nutritionRetention: number; // 栄養保持率 (0-100)
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number; // 分
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Validation functions
export const validateCategory = (category: any): category is Category => {
  return (
    typeof category === 'object' &&
    category !== null &&
    typeof category.id === 'string' &&
    category.id.length > 0 &&
    typeof category.name === 'string' &&
    category.name.length > 0 &&
    typeof category.description === 'string' &&
    Array.isArray(category.foodIds) &&
    category.foodIds.every((id: any) => typeof id === 'string')
  );
};

export const validateHealthBenefit = (benefit: any): benefit is HealthBenefit => {
  return (
    typeof benefit === 'object' &&
    benefit !== null &&
    typeof benefit.condition === 'string' &&
    benefit.condition.length > 0 &&
    typeof benefit.effect === 'string' &&
    benefit.effect.length > 0 &&
    typeof benefit.scientificBasis === 'string' &&
    benefit.scientificBasis.length > 0 &&
    ['high', 'medium', 'low'].indexOf(benefit.effectiveness) !== -1
  );
};

export const validateFood = (food: any): food is Food => {
  return (
    typeof food === 'object' &&
    food !== null &&
    typeof food.id === 'string' &&
    food.id.length > 0 &&
    typeof food.name === 'string' &&
    food.name.length > 0 &&
    typeof food.description === 'string' &&
    typeof food.nutritionalInfo === 'object' &&
    food.nutritionalInfo !== null &&
    typeof food.nutritionalInfo.calories === 'number' &&
    food.nutritionalInfo.calories >= 0 &&
    typeof food.nutritionalInfo.protein === 'number' &&
    food.nutritionalInfo.protein >= 0 &&
    typeof food.nutritionalInfo.carbohydrates === 'number' &&
    food.nutritionalInfo.carbohydrates >= 0 &&
    typeof food.nutritionalInfo.fat === 'number' &&
    food.nutritionalInfo.fat >= 0 &&
    Array.isArray(food.nutritionalInfo.vitamins) &&
    food.nutritionalInfo.vitamins.every((v: any) => typeof v === 'string') &&
    Array.isArray(food.nutritionalInfo.minerals) &&
    food.nutritionalInfo.minerals.every((m: any) => typeof m === 'string') &&
    Array.isArray(food.healthBenefits) &&
    food.healthBenefits.every(validateHealthBenefit) &&
    Array.isArray(food.precautions) &&
    food.precautions.every((p: any) => typeof p === 'string') &&
    Array.isArray(food.cookingMethodIds) &&
    food.cookingMethodIds.every((id: any) => typeof id === 'string')
  );
};

export const validateCookingMethod = (method: any): method is CookingMethod => {
  return (
    typeof method === 'object' &&
    method !== null &&
    typeof method.id === 'string' &&
    method.id.length > 0 &&
    typeof method.name === 'string' &&
    method.name.length > 0 &&
    typeof method.description === 'string' &&
    Array.isArray(method.steps) &&
    method.steps.every((step: any) => typeof step === 'string' && step.length > 0) &&
    typeof method.nutritionRetention === 'number' &&
    method.nutritionRetention >= 0 &&
    method.nutritionRetention <= 100 &&
    ['easy', 'medium', 'hard'].indexOf(method.difficulty) !== -1 &&
    typeof method.cookingTime === 'number' &&
    method.cookingTime > 0
  );
};

// Utility functions for data processing
export const validateDataArray = <T>(
  data: any[],
  validator: (item: any) => item is T,
  dataType: string
): T[] => {
  const validItems: T[] = [];
  const errors: string[] = [];

  data.forEach((item, index) => {
    if (validator(item)) {
      validItems.push(item);
    } else {
      errors.push(`Invalid ${dataType} at index ${index}`);
    }
  });

  if (errors.length > 0) {
    console.warn(`Data validation warnings for ${dataType}:`, errors);
  }

  return validItems;
};

// Helper function to get effectiveness level as number for sorting
export const getEffectivenessScore = (effectiveness: HealthBenefit['effectiveness']): number => {
  switch (effectiveness) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

// 楽天レシピAPI関連の型定義
export interface RakutenRecipeCategory {
  categoryId: string;
  categoryName: string;
  categoryUrl: string;
  parentCategoryId?: string;
}

export interface RakutenRecipe {
  recipeId: number;
  recipeTitle: string;
  recipeUrl: string;
  foodImageUrl: string;
  mediumImageUrl: string;
  smallImageUrl: string;
  pickup: number;
  shop: number;
  nickname: string;
  recipeMaterial: string[];
  recipeIndication: string;
  recipeCost: string;
  recipePublishday: string;
  rank: string;
}

export interface RakutenRecipeSearchResponse {
  result: RakutenRecipe[];
}

export interface RakutenRecipeCategoryResponse {
  result: {
    large: RakutenRecipeCategory[];
    medium: RakutenRecipeCategory[];
    small: RakutenRecipeCategory[];
  };
}