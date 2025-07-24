import { promises as fs } from 'fs';
import path from 'path';
import { Category, Food, CookingMethod, validateCategory, validateFood, validateCookingMethod, validateDataArray } from '@/types';

// Cache interface
interface DataCache {
  categories?: Category[];
  foods?: Food[];
  cookingMethods?: CookingMethod[];
  lastUpdated?: {
    categories?: number;
    foods?: number;
    cookingMethods?: number;
  };
}

// In-memory cache
let cache: DataCache = {
  lastUpdated: {}
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Generic function to load and validate JSON data with caching
 */
async function loadJsonData<T>(
  filename: string,
  validator: (item: any) => item is T,
  dataType: string,
  cacheKey: keyof DataCache
): Promise<T[]> {
  const now = Date.now();
  const lastUpdated = cache.lastUpdated?.[cacheKey as keyof typeof cache.lastUpdated];
  
  // Return cached data if it's still valid
  if (cache[cacheKey] && lastUpdated && (now - lastUpdated) < CACHE_DURATION) {
    return cache[cacheKey] as T[];
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const rawData = JSON.parse(fileContent);

    if (!Array.isArray(rawData)) {
      throw new Error(`Expected array in ${filename}, got ${typeof rawData}`);
    }

    // Validate data
    const validatedData = validateDataArray(rawData, validator, dataType);
    
    if (validatedData.length === 0) {
      throw new Error(`No valid ${dataType} found in ${filename}`);
    }

    // Update cache
    cache[cacheKey] = validatedData as any;
    if (!cache.lastUpdated) {
      cache.lastUpdated = {};
    }
    cache.lastUpdated[cacheKey as keyof typeof cache.lastUpdated] = now;

    return validatedData;
  } catch (error) {
    console.error(`Error loading ${dataType} from ${filename}:`, error);
    
    // Return cached data if available, even if expired
    if (cache[cacheKey]) {
      console.warn(`Using expired cache for ${dataType} due to load error`);
      return cache[cacheKey] as T[];
    }
    
    throw new Error(`Failed to load ${dataType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load all categories from JSON file
 */
export async function loadCategories(): Promise<Category[]> {
  return loadJsonData('categories.json', validateCategory, 'categories', 'categories');
}

/**
 * Load all foods from JSON file
 */
export async function loadFoods(): Promise<Food[]> {
  return loadJsonData('foods.json', validateFood, 'foods', 'foods');
}

/**
 * Load all cooking methods from JSON file
 */
export async function loadCookingMethods(): Promise<CookingMethod[]> {
  return loadJsonData('cooking-methods.json', validateCookingMethod, 'cooking methods', 'cookingMethods');
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const categories = await loadCategories();
    return categories.find(category => category.id === id) || null;
  } catch (error) {
    console.error(`Error getting category by ID ${id}:`, error);
    return null;
  }
}

/**
 * Get food by ID
 */
export async function getFoodById(id: string): Promise<Food | null> {
  try {
    const foods = await loadFoods();
    return foods.find(food => food.id === id) || null;
  } catch (error) {
    console.error(`Error getting food by ID ${id}:`, error);
    return null;
  }
}

/**
 * Get cooking method by ID
 */
export async function getCookingMethodById(id: string): Promise<CookingMethod | null> {
  try {
    const cookingMethods = await loadCookingMethods();
    return cookingMethods.find(method => method.id === id) || null;
  } catch (error) {
    console.error(`Error getting cooking method by ID ${id}:`, error);
    return null;
  }
}

/**
 * Get foods by category ID
 */
export async function getFoodsByCategory(categoryId: string): Promise<Food[]> {
  try {
    const category = await getCategoryById(categoryId);
    if (!category) {
      return [];
    }

    const foods = await loadFoods();
    return foods.filter(food => category.foodIds.includes(food.id));
  } catch (error) {
    console.error(`Error getting foods by category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Get cooking methods by food ID
 */
export async function getCookingMethodsByFood(foodId: string): Promise<CookingMethod[]> {
  try {
    const food = await getFoodById(foodId);
    if (!food) {
      return [];
    }

    const cookingMethods = await loadCookingMethods();
    return cookingMethods.filter(method => food.cookingMethodIds.includes(method.id));
  } catch (error) {
    console.error(`Error getting cooking methods by food ${foodId}:`, error);
    return [];
  }
}

/**
 * Clear cache (useful for testing or manual cache invalidation)
 */
export function clearCache(): void {
  cache = { lastUpdated: {} };
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(): DataCache {
  return { ...cache };
}