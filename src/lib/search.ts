import { Category, Food, CookingMethod, getEffectivenessScore } from '@/types';
import { loadCategories, loadFoods, loadCookingMethods } from './data-loader';

/**
 * Search options interface
 */
export interface SearchOptions {
  caseSensitive?: boolean;
  exactMatch?: boolean;
  limit?: number;
}

/**
 * Search result interface
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
}

/**
 * Normalize text for search (remove extra spaces, convert to lowercase if needed)
 */
function normalizeText(text: string, caseSensitive: boolean = false): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  return caseSensitive ? normalized : normalized.toLowerCase();
}

/**
 * Check if text matches query based on search options
 */
function matchesQuery(text: string, query: string, options: SearchOptions = {}): boolean {
  const { caseSensitive = false, exactMatch = false } = options;
  
  const normalizedText = normalizeText(text, caseSensitive);
  const normalizedQuery = normalizeText(query, caseSensitive);
  
  if (exactMatch) {
    return normalizedText === normalizedQuery;
  }
  
  return normalizedText.indexOf(normalizedQuery) !== -1;
}

/**
 * Search categories by name or description
 */
export async function searchCategories(
  query: string, 
  options: SearchOptions = {}
): Promise<SearchResult<Category>> {
  try {
    if (!query.trim()) {
      const categories = await loadCategories();
      return {
        items: options.limit ? categories.slice(0, options.limit) : categories,
        total: categories.length,
        query: query.trim()
      };
    }

    const categories = await loadCategories();
    const filteredCategories = categories.filter(category => 
      matchesQuery(category.name, query, options) ||
      matchesQuery(category.description, query, options)
    );

    const limitedResults = options.limit ? 
      filteredCategories.slice(0, options.limit) : 
      filteredCategories;

    return {
      items: limitedResults,
      total: filteredCategories.length,
      query: query.trim()
    };
  } catch (error) {
    console.error('Error searching categories:', error);
    return {
      items: [],
      total: 0,
      query: query.trim()
    };
  }
}

/**
 * Search foods by name, description, or health benefits
 */
export async function searchFoods(
  query: string, 
  options: SearchOptions = {}
): Promise<SearchResult<Food>> {
  try {
    if (!query.trim()) {
      const foods = await loadFoods();
      return {
        items: options.limit ? foods.slice(0, options.limit) : foods,
        total: foods.length,
        query: query.trim()
      };
    }

    const foods = await loadFoods();
    const filteredFoods = foods.filter(food => {
      // Search in name and description
      if (matchesQuery(food.name, query, options) ||
          matchesQuery(food.description, query, options)) {
        return true;
      }
      
      // Search in health benefits conditions and effects
      return food.healthBenefits.some(benefit =>
        matchesQuery(benefit.condition, query, options) ||
        matchesQuery(benefit.effect, query, options)
      );
    });

    // Sort by relevance (exact matches first, then by effectiveness)
    const sortedFoods = filteredFoods.sort((a, b) => {
      const aExactMatch = matchesQuery(a.name, query, { ...options, exactMatch: true });
      const bExactMatch = matchesQuery(b.name, query, { ...options, exactMatch: true });
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Sort by highest effectiveness of health benefits
      const aMaxEffectiveness = Math.max(...a.healthBenefits.map(b => getEffectivenessScore(b.effectiveness)));
      const bMaxEffectiveness = Math.max(...b.healthBenefits.map(b => getEffectivenessScore(b.effectiveness)));
      
      return bMaxEffectiveness - aMaxEffectiveness;
    });

    const limitedResults = options.limit ? 
      sortedFoods.slice(0, options.limit) : 
      sortedFoods;

    return {
      items: limitedResults,
      total: filteredFoods.length,
      query: query.trim()
    };
  } catch (error) {
    console.error('Error searching foods:', error);
    return {
      items: [],
      total: 0,
      query: query.trim()
    };
  }
}

/**
 * Search cooking methods by name or description
 */
export async function searchCookingMethods(
  query: string, 
  options: SearchOptions = {}
): Promise<SearchResult<CookingMethod>> {
  try {
    if (!query.trim()) {
      const methods = await loadCookingMethods();
      return {
        items: options.limit ? methods.slice(0, options.limit) : methods,
        total: methods.length,
        query: query.trim()
      };
    }

    const methods = await loadCookingMethods();
    const filteredMethods = methods.filter(method => 
      matchesQuery(method.name, query, options) ||
      matchesQuery(method.description, query, options)
    );

    // Sort by nutrition retention (higher is better)
    const sortedMethods = filteredMethods.sort((a, b) => {
      const aExactMatch = matchesQuery(a.name, query, { ...options, exactMatch: true });
      const bExactMatch = matchesQuery(b.name, query, { ...options, exactMatch: true });
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      return b.nutritionRetention - a.nutritionRetention;
    });

    const limitedResults = options.limit ? 
      sortedMethods.slice(0, options.limit) : 
      sortedMethods;

    return {
      items: limitedResults,
      total: filteredMethods.length,
      query: query.trim()
    };
  } catch (error) {
    console.error('Error searching cooking methods:', error);
    return {
      items: [],
      total: 0,
      query: query.trim()
    };
  }
}

/**
 * Filter foods by category
 */
export async function filterFoodsByCategory(categoryId: string): Promise<Food[]> {
  try {
    const categories = await loadCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
      return [];
    }

    const foods = await loadFoods();
    return foods.filter(food => category.foodIds.indexOf(food.id) !== -1);
  } catch (error) {
    console.error(`Error filtering foods by category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Filter foods by health condition
 */
export async function filterFoodsByCondition(condition: string): Promise<Food[]> {
  try {
    const foods = await loadFoods();
    return foods.filter(food => 
      food.healthBenefits.some(benefit => 
        matchesQuery(benefit.condition, condition, { exactMatch: false })
      )
    ).sort((a, b) => {
      // Sort by effectiveness for the specific condition
      const aRelevantBenefit = a.healthBenefits.find(benefit => 
        matchesQuery(benefit.condition, condition, { exactMatch: false })
      );
      const bRelevantBenefit = b.healthBenefits.find(benefit => 
        matchesQuery(benefit.condition, condition, { exactMatch: false })
      );
      
      if (!aRelevantBenefit || !bRelevantBenefit) return 0;
      
      return getEffectivenessScore(bRelevantBenefit.effectiveness) - 
             getEffectivenessScore(aRelevantBenefit.effectiveness);
    });
  } catch (error) {
    console.error(`Error filtering foods by condition ${condition}:`, error);
    return [];
  }
}

/**
 * Filter cooking methods by difficulty
 */
export async function filterCookingMethodsByDifficulty(
  difficulty: CookingMethod['difficulty']
): Promise<CookingMethod[]> {
  try {
    const methods = await loadCookingMethods();
    return methods.filter(method => method.difficulty === difficulty)
      .sort((a, b) => b.nutritionRetention - a.nutritionRetention);
  } catch (error) {
    console.error(`Error filtering cooking methods by difficulty ${difficulty}:`, error);
    return [];
  }
}

/**
 * Filter cooking methods by cooking time (max minutes)
 */
export async function filterCookingMethodsByTime(maxMinutes: number): Promise<CookingMethod[]> {
  try {
    const methods = await loadCookingMethods();
    return methods.filter(method => method.cookingTime <= maxMinutes)
      .sort((a, b) => a.cookingTime - b.cookingTime);
  } catch (error) {
    console.error(`Error filtering cooking methods by time ${maxMinutes}:`, error);
    return [];
  }
}

/**
 * Get suggested search terms based on available data
 */
export async function getSuggestedSearchTerms(query: string, limit: number = 5): Promise<string[]> {
  try {
    if (!query.trim()) {
      return [];
    }

    const suggestions: Set<string> = new Set();
    
    // Get suggestions from categories
    const categories = await loadCategories();
    categories.forEach(category => {
      if (matchesQuery(category.name, query)) {
        suggestions.add(category.name);
      }
    });

    // Get suggestions from foods
    const foods = await loadFoods();
    foods.forEach(food => {
      if (matchesQuery(food.name, query)) {
        suggestions.add(food.name);
      }
      // Add health condition suggestions
      food.healthBenefits.forEach(benefit => {
        if (matchesQuery(benefit.condition, query)) {
          suggestions.add(benefit.condition);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Error getting suggested search terms:', error);
    return [];
  }
}