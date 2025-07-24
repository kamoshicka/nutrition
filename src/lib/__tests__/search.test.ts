import {
  searchCategories,
  searchFoods,
  searchCookingMethods,
  filterFoodsByCategory,
  filterFoodsByCondition,
  filterCookingMethodsByDifficulty,
  filterCookingMethodsByTime,
  getSuggestedSearchTerms
} from '../search';
import { loadCategories, loadFoods, loadCookingMethods } from '../data-loader';

// Mock the data-loader module
jest.mock('../data-loader', () => ({
  loadCategories: jest.fn(),
  loadFoods: jest.fn(),
  loadCookingMethods: jest.fn()
}));

// Mock data
const mockCategories = [
  {
    id: 'cat1',
    name: '消化器系',
    description: '胃腸の健康に関連する食材',
    foodIds: ['food1', 'food2']
  },
  {
    id: 'cat2',
    name: '循環器系',
    description: '心臓と血管の健康に関連する食材',
    foodIds: ['food2', 'food3']
  }
];

const mockFoods = [
  {
    id: 'food1',
    name: 'ショウガ',
    description: '消化を助ける食材',
    nutritionalInfo: {
      calories: 80,
      protein: 1.8,
      carbohydrates: 18,
      fat: 0.8,
      vitamins: ['B6', 'C'],
      minerals: ['マグネシウム', '亜鉛']
    },
    healthBenefits: [
      {
        condition: '消化不良',
        effect: '消化を促進する',
        scientificBasis: '研究による裏付け',
        effectiveness: 'high'
      }
    ],
    precautions: ['過剰摂取に注意'],
    cookingMethodIds: ['method1', 'method2']
  },
  {
    id: 'food2',
    name: 'ニンニク',
    description: '血行を良くする食材',
    nutritionalInfo: {
      calories: 149,
      protein: 6.4,
      carbohydrates: 33,
      fat: 0.5,
      vitamins: ['B6', 'C'],
      minerals: ['マンガン', 'セレン']
    },
    healthBenefits: [
      {
        condition: '高血圧',
        effect: '血圧を下げる効果',
        scientificBasis: '臨床試験の結果',
        effectiveness: 'medium'
      }
    ],
    precautions: ['血液凝固抑制薬との相互作用に注意'],
    cookingMethodIds: ['method2', 'method3']
  },
  {
    id: 'food3',
    name: 'ブルーベリー',
    description: '抗酸化作用のある食材',
    nutritionalInfo: {
      calories: 57,
      protein: 0.7,
      carbohydrates: 14,
      fat: 0.3,
      vitamins: ['C', 'K'],
      minerals: ['マンガン']
    },
    healthBenefits: [
      {
        condition: '視力低下',
        effect: '目の健康をサポート',
        scientificBasis: '抗酸化物質の作用',
        effectiveness: 'high'
      }
    ],
    precautions: [],
    cookingMethodIds: ['method1']
  }
];

const mockCookingMethods = [
  {
    id: 'method1',
    name: '蒸す',
    description: '水蒸気で調理する方法',
    steps: ['準備する', '蒸し器に入れる', '蒸す'],
    nutritionRetention: 90,
    difficulty: 'easy',
    cookingTime: 15
  },
  {
    id: 'method2',
    name: '炒める',
    description: '油で炒める調理法',
    steps: ['材料を切る', '油を熱する', '炒める'],
    nutritionRetention: 70,
    difficulty: 'medium',
    cookingTime: 10
  },
  {
    id: 'method3',
    name: '煮込む',
    description: '長時間煮込む調理法',
    steps: ['材料を準備する', '鍋に入れる', '煮込む'],
    nutritionRetention: 60,
    difficulty: 'hard',
    cookingTime: 60
  }
];

describe('Search Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadCategories as jest.Mock).mockResolvedValue(mockCategories);
    (loadFoods as jest.Mock).mockResolvedValue(mockFoods);
    (loadCookingMethods as jest.Mock).mockResolvedValue(mockCookingMethods);
  });

  describe('searchCategories', () => {
    it('returns all categories when query is empty', async () => {
      const result = await searchCategories('');
      expect(result.items).toEqual(mockCategories);
      expect(result.total).toBe(2);
    });

    it('filters categories by name', async () => {
      const result = await searchCategories('消化');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('cat1');
    });

    it('filters categories by description', async () => {
      const result = await searchCategories('心臓');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('cat2');
    });

    it('respects the limit option', async () => {
      const result = await searchCategories('', { limit: 1 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('handles case sensitivity', async () => {
      const result = await searchCategories('消化', { caseSensitive: true });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('cat1');
    });

    it('handles errors gracefully', async () => {
      (loadCategories as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await searchCategories('test');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('searchFoods', () => {
    it('returns all foods when query is empty', async () => {
      const result = await searchFoods('');
      expect(result.items).toEqual(mockFoods);
      expect(result.total).toBe(3);
    });

    it('filters foods by name', async () => {
      const result = await searchFoods('ショウガ');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('food1');
    });

    it('filters foods by description', async () => {
      const result = await searchFoods('抗酸化');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('food3');
    });

    it('filters foods by health benefit condition', async () => {
      const result = await searchFoods('高血圧');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('food2');
    });

    it('sorts results by effectiveness', async () => {
      // Mock foods with different effectiveness for the same condition
      const specialMockFoods = [
        {
          id: 'food1',
          name: 'テスト食材1',
          description: 'テスト',
          nutritionalInfo: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, vitamins: [], minerals: [] },
          healthBenefits: [{ condition: 'テスト症状', effect: 'テスト効果', scientificBasis: '', effectiveness: 'low' }],
          precautions: [],
          cookingMethodIds: []
        },
        {
          id: 'food2',
          name: 'テスト食材2',
          description: 'テスト',
          nutritionalInfo: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, vitamins: [], minerals: [] },
          healthBenefits: [{ condition: 'テスト症状', effect: 'テスト効果', scientificBasis: '', effectiveness: 'high' }],
          precautions: [],
          cookingMethodIds: []
        }
      ];
      
      (loadFoods as jest.Mock).mockResolvedValue(specialMockFoods);
      
      const result = await searchFoods('テスト');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('food2'); // High effectiveness should come first
      expect(result.items[1].id).toBe('food1');
    });

    it('handles errors gracefully', async () => {
      (loadFoods as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await searchFoods('test');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('searchCookingMethods', () => {
    it('returns all cooking methods when query is empty', async () => {
      const result = await searchCookingMethods('');
      expect(result.items).toEqual(mockCookingMethods);
      expect(result.total).toBe(3);
    });

    it('filters cooking methods by name', async () => {
      const result = await searchCookingMethods('蒸す');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('method1');
    });

    it('filters cooking methods by description', async () => {
      const result = await searchCookingMethods('長時間');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('method3');
    });

    it('sorts results by nutrition retention', async () => {
      const result = await searchCookingMethods('調理');
      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe('method1'); // Highest nutrition retention
      expect(result.items[1].id).toBe('method2');
      expect(result.items[2].id).toBe('method3');
    });

    it('handles errors gracefully', async () => {
      (loadCookingMethods as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await searchCookingMethods('test');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('filterFoodsByCategory', () => {
    it('returns foods for a valid category', async () => {
      const result = await filterFoodsByCategory('cat1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('food1');
      expect(result[1].id).toBe('food2');
    });

    it('returns empty array for invalid category', async () => {
      const result = await filterFoodsByCategory('invalid');
      expect(result).toEqual([]);
    });

    it('handles errors gracefully', async () => {
      (loadCategories as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await filterFoodsByCategory('cat1');
      expect(result).toEqual([]);
    });
  });

  describe('filterFoodsByCondition', () => {
    it('returns foods for a specific health condition', async () => {
      const result = await filterFoodsByCondition('高血圧');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('food2');
    });

    it('sorts results by effectiveness for the condition', async () => {
      // Mock foods with different effectiveness for the same condition
      const specialMockFoods = [
        {
          id: 'food1',
          name: 'テスト食材1',
          description: 'テスト',
          nutritionalInfo: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, vitamins: [], minerals: [] },
          healthBenefits: [{ condition: 'テスト症状', effect: 'テスト効果', scientificBasis: '', effectiveness: 'low' }],
          precautions: [],
          cookingMethodIds: []
        },
        {
          id: 'food2',
          name: 'テスト食材2',
          description: 'テスト',
          nutritionalInfo: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, vitamins: [], minerals: [] },
          healthBenefits: [{ condition: 'テスト症状', effect: 'テスト効果', scientificBasis: '', effectiveness: 'high' }],
          precautions: [],
          cookingMethodIds: []
        }
      ];
      
      (loadFoods as jest.Mock).mockResolvedValue(specialMockFoods);
      
      const result = await filterFoodsByCondition('テスト症状');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('food2'); // High effectiveness should come first
      expect(result[1].id).toBe('food1');
    });

    it('handles errors gracefully', async () => {
      (loadFoods as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await filterFoodsByCondition('test');
      expect(result).toEqual([]);
    });
  });

  describe('filterCookingMethodsByDifficulty', () => {
    it('returns cooking methods with specified difficulty', async () => {
      const result = await filterCookingMethodsByDifficulty('easy');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('method1');
    });

    it('sorts results by nutrition retention', async () => {
      // Add another easy method with lower nutrition retention
      const extendedMethods = [
        ...mockCookingMethods,
        {
          id: 'method4',
          name: '生食',
          description: '調理せずに食べる',
          steps: ['洗う', '切る', '食べる'],
          nutritionRetention: 100,
          difficulty: 'easy',
          cookingTime: 5
        }
      ];
      
      (loadCookingMethods as jest.Mock).mockResolvedValue(extendedMethods);
      
      const result = await filterCookingMethodsByDifficulty('easy');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('method4'); // Higher nutrition retention
      expect(result[1].id).toBe('method1');
    });

    it('handles errors gracefully', async () => {
      (loadCookingMethods as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await filterCookingMethodsByDifficulty('easy');
      expect(result).toEqual([]);
    });
  });

  describe('filterCookingMethodsByTime', () => {
    it('returns cooking methods within specified time', async () => {
      const result = await filterCookingMethodsByTime(15);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('method2'); // 10 minutes
      expect(result[1].id).toBe('method1'); // 15 minutes
    });

    it('sorts results by cooking time (ascending)', async () => {
      const result = await filterCookingMethodsByTime(60);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('method2'); // 10 minutes
      expect(result[1].id).toBe('method1'); // 15 minutes
      expect(result[2].id).toBe('method3'); // 60 minutes
    });

    it('handles errors gracefully', async () => {
      (loadCookingMethods as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await filterCookingMethodsByTime(30);
      expect(result).toEqual([]);
    });
  });

  describe('getSuggestedSearchTerms', () => {
    it('returns empty array for empty query', async () => {
      const result = await getSuggestedSearchTerms('');
      expect(result).toEqual([]);
    });

    it('returns suggestions from category names', async () => {
      const result = await getSuggestedSearchTerms('消化');
      expect(result).toContain('消化器系');
    });

    it('returns suggestions from food names', async () => {
      const result = await getSuggestedSearchTerms('ニン');
      expect(result).toContain('ニンニク');
    });

    it('returns suggestions from health conditions', async () => {
      const result = await getSuggestedSearchTerms('高血');
      expect(result).toContain('高血圧');
    });

    it('respects the limit parameter', async () => {
      // Create mock data with many matching items
      const manyCategories = Array(10).fill(0).map((_, i) => ({
        id: `cat${i}`,
        name: `テストカテゴリー${i}`,
        description: 'テスト',
        foodIds: []
      }));
      
      (loadCategories as jest.Mock).mockResolvedValue(manyCategories);
      
      const result = await getSuggestedSearchTerms('テスト', 3);
      expect(result).toHaveLength(3);
    });

    it('handles errors gracefully', async () => {
      (loadCategories as jest.Mock).mockRejectedValue(new Error('Test error'));
      const result = await getSuggestedSearchTerms('test');
      expect(result).toEqual([]);
    });
  });
});