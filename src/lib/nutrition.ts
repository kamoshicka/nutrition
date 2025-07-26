/**
 * Nutrition calculation system for premium users
 */

// Nutrition data structure
export interface NutritionData {
  calories: number;          // kcal per 100g
  protein: number;           // g per 100g
  fat: number;              // g per 100g
  carbohydrates: number;    // g per 100g
  fiber: number;            // g per 100g
  sodium: number;           // mg per 100g
  potassium: number;        // mg per 100g
  calcium: number;          // mg per 100g
  iron: number;             // mg per 100g
  vitaminA: number;         // μg per 100g
  vitaminB1: number;        // mg per 100g
  vitaminB2: number;        // mg per 100g
  vitaminC: number;         // mg per 100g
  vitaminD: number;         // μg per 100g
  vitaminE: number;         // mg per 100g
}

// Food item with nutrition data
export interface FoodNutrition {
  id: string;
  name: string;
  category: string;
  nutrition: NutritionData;
  unit: string;             // 単位 (g, ml, 個, etc.)
  standardAmount: number;   // 標準量 (100g基準)
}

// User's food selection with quantity
export interface SelectedFood {
  food: FoodNutrition;
  quantity: number;         // 選択した量
  unit: string;            // 選択した単位
}

// Calculated nutrition totals
export interface NutritionTotals extends NutritionData {
  totalWeight: number;      // 総重量 (g)
}

// Daily recommended intake by age and gender
export interface DailyRecommendedIntake {
  ageGroup: string;
  gender: 'male' | 'female';
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  vitaminA: number;
  vitaminB1: number;
  vitaminB2: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
}

// Nutrition comparison result
export interface NutritionComparison {
  nutrient: keyof NutritionData;
  name: string;
  unit: string;
  current: number;
  recommended: number;
  percentage: number;
  status: 'low' | 'adequate' | 'high' | 'excessive';
  message: string;
}

// Daily recommended intake data (Japanese dietary reference intakes)
export const DAILY_RECOMMENDED_INTAKE: DailyRecommendedIntake[] = [
  // Adult Male (18-29)
  {
    ageGroup: '18-29',
    gender: 'male',
    calories: 2650,
    protein: 65,
    fat: 73.9, // 25% of calories
    carbohydrates: 331.3, // 50% of calories
    fiber: 21,
    sodium: 2300, // mg (salt equivalent: 7.5g)
    potassium: 3000,
    calcium: 800,
    iron: 7.5,
    vitaminA: 900,
    vitaminB1: 1.4,
    vitaminB2: 1.6,
    vitaminC: 100,
    vitaminD: 8.5,
    vitaminE: 6.0
  },
  // Adult Female (18-29)
  {
    ageGroup: '18-29',
    gender: 'female',
    calories: 2000,
    protein: 50,
    fat: 55.6, // 25% of calories
    carbohydrates: 250, // 50% of calories
    fiber: 18,
    sodium: 2300, // mg (salt equivalent: 7.0g)
    potassium: 2600,
    calcium: 650,
    iron: 10.5,
    vitaminA: 700,
    vitaminB1: 1.1,
    vitaminB2: 1.2,
    vitaminC: 100,
    vitaminD: 8.5,
    vitaminE: 5.0
  },
  // Adult Male (30-49)
  {
    ageGroup: '30-49',
    gender: 'male',
    calories: 2700,
    protein: 65,
    fat: 75, // 25% of calories
    carbohydrates: 337.5, // 50% of calories
    fiber: 21,
    sodium: 2300,
    potassium: 3000,
    calcium: 650,
    iron: 7.5,
    vitaminA: 900,
    vitaminB1: 1.4,
    vitaminB2: 1.6,
    vitaminC: 100,
    vitaminD: 8.5,
    vitaminE: 6.0
  },
  // Adult Female (30-49)
  {
    ageGroup: '30-49',
    gender: 'female',
    calories: 2050,
    protein: 50,
    fat: 56.9, // 25% of calories
    carbohydrates: 256.3, // 50% of calories
    fiber: 18,
    sodium: 2300,
    potassium: 2600,
    calcium: 650,
    iron: 10.5,
    vitaminA: 700,
    vitaminB1: 1.1,
    vitaminB2: 1.2,
    vitaminC: 100,
    vitaminD: 8.5,
    vitaminE: 5.0
  }
];

/**
 * Calculate total nutrition from selected foods
 */
export function calculateTotalNutrition(selectedFoods: SelectedFood[]): NutritionTotals {
  const totals: NutritionTotals = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    fiber: 0,
    sodium: 0,
    potassium: 0,
    calcium: 0,
    iron: 0,
    vitaminA: 0,
    vitaminB1: 0,
    vitaminB2: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    totalWeight: 0
  };

  selectedFoods.forEach(({ food, quantity, unit }) => {
    // Convert quantity to grams (assuming 100g base)
    const quantityInGrams = convertToGrams(quantity, unit, food.unit);
    const multiplier = quantityInGrams / 100; // nutrition data is per 100g

    // Add to totals
    totals.calories += food.nutrition.calories * multiplier;
    totals.protein += food.nutrition.protein * multiplier;
    totals.fat += food.nutrition.fat * multiplier;
    totals.carbohydrates += food.nutrition.carbohydrates * multiplier;
    totals.fiber += food.nutrition.fiber * multiplier;
    totals.sodium += food.nutrition.sodium * multiplier;
    totals.potassium += food.nutrition.potassium * multiplier;
    totals.calcium += food.nutrition.calcium * multiplier;
    totals.iron += food.nutrition.iron * multiplier;
    totals.vitaminA += food.nutrition.vitaminA * multiplier;
    totals.vitaminB1 += food.nutrition.vitaminB1 * multiplier;
    totals.vitaminB2 += food.nutrition.vitaminB2 * multiplier;
    totals.vitaminC += food.nutrition.vitaminC * multiplier;
    totals.vitaminD += food.nutrition.vitaminD * multiplier;
    totals.vitaminE += food.nutrition.vitaminE * multiplier;
    totals.totalWeight += quantityInGrams;
  });

  return totals;
}

/**
 * Convert quantity to grams
 */
function convertToGrams(quantity: number, fromUnit: string, foodUnit: string): number {
  // Simple conversion logic - in a real app, this would be more sophisticated
  const conversions: { [key: string]: number } = {
    'g': 1,
    'kg': 1000,
    'ml': 1, // Assuming 1ml ≈ 1g for most foods
    'l': 1000,
    '個': 100, // Default: 1 piece = 100g
    '枚': 50,  // Default: 1 slice = 50g
    '本': 150, // Default: 1 piece = 150g
    'カップ': 200, // Default: 1 cup = 200g
    '大さじ': 15,  // 1 tablespoon = 15g
    '小さじ': 5    // 1 teaspoon = 5g
  };

  const multiplier = conversions[fromUnit] || 1;
  return quantity * multiplier;
}

/**
 * Compare nutrition with daily recommended intake
 */
export function compareWithRecommendedIntake(
  nutrition: NutritionTotals,
  ageGroup: string,
  gender: 'male' | 'female'
): NutritionComparison[] {
  const recommended = DAILY_RECOMMENDED_INTAKE.find(
    intake => intake.ageGroup === ageGroup && intake.gender === gender
  );

  if (!recommended) {
    throw new Error('Recommended intake data not found for the specified age group and gender');
  }

  const comparisons: NutritionComparison[] = [
    {
      nutrient: 'calories',
      name: 'エネルギー',
      unit: 'kcal',
      current: Math.round(nutrition.calories),
      recommended: recommended.calories,
      percentage: Math.round((nutrition.calories / recommended.calories) * 100),
      status: getStatus(nutrition.calories, recommended.calories, 'calories'),
      message: getStatusMessage(nutrition.calories, recommended.calories, 'calories')
    },
    {
      nutrient: 'protein',
      name: 'たんぱく質',
      unit: 'g',
      current: Math.round(nutrition.protein * 10) / 10,
      recommended: recommended.protein,
      percentage: Math.round((nutrition.protein / recommended.protein) * 100),
      status: getStatus(nutrition.protein, recommended.protein, 'protein'),
      message: getStatusMessage(nutrition.protein, recommended.protein, 'protein')
    },
    {
      nutrient: 'fat',
      name: '脂質',
      unit: 'g',
      current: Math.round(nutrition.fat * 10) / 10,
      recommended: recommended.fat,
      percentage: Math.round((nutrition.fat / recommended.fat) * 100),
      status: getStatus(nutrition.fat, recommended.fat, 'fat'),
      message: getStatusMessage(nutrition.fat, recommended.fat, 'fat')
    },
    {
      nutrient: 'carbohydrates',
      name: '炭水化物',
      unit: 'g',
      current: Math.round(nutrition.carbohydrates * 10) / 10,
      recommended: recommended.carbohydrates,
      percentage: Math.round((nutrition.carbohydrates / recommended.carbohydrates) * 100),
      status: getStatus(nutrition.carbohydrates, recommended.carbohydrates, 'carbohydrates'),
      message: getStatusMessage(nutrition.carbohydrates, recommended.carbohydrates, 'carbohydrates')
    },
    {
      nutrient: 'fiber',
      name: '食物繊維',
      unit: 'g',
      current: Math.round(nutrition.fiber * 10) / 10,
      recommended: recommended.fiber,
      percentage: Math.round((nutrition.fiber / recommended.fiber) * 100),
      status: getStatus(nutrition.fiber, recommended.fiber, 'fiber'),
      message: getStatusMessage(nutrition.fiber, recommended.fiber, 'fiber')
    },
    {
      nutrient: 'sodium',
      name: 'ナトリウム',
      unit: 'mg',
      current: Math.round(nutrition.sodium),
      recommended: recommended.sodium,
      percentage: Math.round((nutrition.sodium / recommended.sodium) * 100),
      status: getStatus(nutrition.sodium, recommended.sodium, 'sodium'),
      message: getStatusMessage(nutrition.sodium, recommended.sodium, 'sodium')
    },
    {
      nutrient: 'calcium',
      name: 'カルシウム',
      unit: 'mg',
      current: Math.round(nutrition.calcium),
      recommended: recommended.calcium,
      percentage: Math.round((nutrition.calcium / recommended.calcium) * 100),
      status: getStatus(nutrition.calcium, recommended.calcium, 'calcium'),
      message: getStatusMessage(nutrition.calcium, recommended.calcium, 'calcium')
    },
    {
      nutrient: 'iron',
      name: '鉄',
      unit: 'mg',
      current: Math.round(nutrition.iron * 10) / 10,
      recommended: recommended.iron,
      percentage: Math.round((nutrition.iron / recommended.iron) * 100),
      status: getStatus(nutrition.iron, recommended.iron, 'iron'),
      message: getStatusMessage(nutrition.iron, recommended.iron, 'iron')
    },
    {
      nutrient: 'vitaminC',
      name: 'ビタミンC',
      unit: 'mg',
      current: Math.round(nutrition.vitaminC),
      recommended: recommended.vitaminC,
      percentage: Math.round((nutrition.vitaminC / recommended.vitaminC) * 100),
      status: getStatus(nutrition.vitaminC, recommended.vitaminC, 'vitaminC'),
      message: getStatusMessage(nutrition.vitaminC, recommended.vitaminC, 'vitaminC')
    }
  ];

  return comparisons;
}

/**
 * Get status based on current vs recommended values
 */
function getStatus(current: number, recommended: number, nutrient: string): 'low' | 'adequate' | 'high' | 'excessive' {
  const percentage = (current / recommended) * 100;

  // Special handling for sodium (lower is better)
  if (nutrient === 'sodium') {
    if (percentage <= 50) return 'adequate';
    if (percentage <= 80) return 'high';
    return 'excessive';
  }

  // General nutrients (higher is generally better, but not excessive)
  if (percentage < 50) return 'low';
  if (percentage < 80) return 'adequate';
  if (percentage <= 120) return 'high';
  return 'excessive';
}

/**
 * Get status message
 */
function getStatusMessage(current: number, recommended: number, nutrient: string): string {
  const status = getStatus(current, recommended, nutrient);
  const percentage = Math.round((current / recommended) * 100);

  switch (status) {
    case 'low':
      return `推奨量の${percentage}%です。もう少し摂取することをお勧めします。`;
    case 'adequate':
      return `推奨量の${percentage}%で、適切な摂取量です。`;
    case 'high':
      return `推奨量の${percentage}%で、十分な摂取量です。`;
    case 'excessive':
      if (nutrient === 'sodium') {
        return `推奨量の${percentage}%で、摂取量が多すぎます。減塩を心がけましょう。`;
      }
      return `推奨量の${percentage}%で、摂取量が多めです。バランスを考慮しましょう。`;
    default:
      return '';
  }
}

/**
 * Get available age groups
 */
export function getAvailableAgeGroups(): string[] {
  return Array.from(new Set(DAILY_RECOMMENDED_INTAKE.map(intake => intake.ageGroup)));
}

/**
 * Format nutrition value for display
 */
export function formatNutritionValue(value: number, unit: string): string {
  if (unit === 'kcal' || unit === 'mg') {
    return Math.round(value).toString();
  }
  return (Math.round(value * 10) / 10).toString();
}