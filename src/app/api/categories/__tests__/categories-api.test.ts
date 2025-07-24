import { NextRequest } from 'next/server';
import { GET as getCategoriesHandler } from '../route';
import { GET as getCategoryHandler } from '../[id]/route';
import { GET as getCategoryFoodsHandler } from '../[id]/foods/route';
import * as dataLoader from '@/lib/data-loader';

// Mock the data-loader module
jest.mock('@/lib/data-loader', () => ({
  loadCategories: jest.fn(),
  getCategoryById: jest.fn(),
  getFoodsByCategory: jest.fn(),
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
  }
];

describe('Categories API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('returns all categories successfully', async () => {
      // Mock the loadCategories function
      (dataLoader.loadCategories as jest.Mock).mockResolvedValue(mockCategories);

      // Call the handler
      const response = await getCategoriesHandler();
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(mockCategories);
      expect(dataLoader.loadCategories).toHaveBeenCalledTimes(1);
    });

    it('handles errors correctly', async () => {
      // Mock the loadCategories function to throw an error
      const mockError = new Error('Test error');
      (dataLoader.loadCategories as jest.Mock).mockRejectedValue(mockError);

      // Call the handler
      const response = await getCategoriesHandler();
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CATEGORIES_LOAD_ERROR');
      expect(data.error.message).toBe('カテゴリの読み込みに失敗しました');
      expect(data.error.details).toBe('Test error');
    });
  });

  describe('GET /api/categories/[id]', () => {
    it('returns a specific category successfully', async () => {
      // Mock the getCategoryById function
      (dataLoader.getCategoryById as jest.Mock).mockResolvedValue(mockCategories[0]);

      // Create mock request and params
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: 'cat1' } };

      // Call the handler
      const response = await getCategoryHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(mockCategories[0]);
      expect(dataLoader.getCategoryById).toHaveBeenCalledWith('cat1');
    });

    it('returns 404 for non-existent category', async () => {
      // Mock the getCategoryById function to return null
      (dataLoader.getCategoryById as jest.Mock).mockResolvedValue(null);

      // Create mock request and params
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: 'non-existent' } };

      // Call the handler
      const response = await getCategoryHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('returns 400 for invalid category ID', async () => {
      // Create mock request and params with empty ID
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: '' } };

      // Call the handler
      const response = await getCategoryHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_CATEGORY_ID');
    });

    it('handles errors correctly', async () => {
      // Mock the getCategoryById function to throw an error
      const mockError = new Error('Test error');
      (dataLoader.getCategoryById as jest.Mock).mockRejectedValue(mockError);

      // Create mock request and params
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: 'cat1' } };

      // Call the handler
      const response = await getCategoryHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CATEGORY_LOAD_ERROR');
      expect(data.error.details).toBe('Test error');
    });
  });

  describe('GET /api/categories/[id]/foods', () => {
    it('returns foods for a specific category successfully', async () => {
      // Mock the necessary functions
      (dataLoader.getCategoryById as jest.Mock).mockResolvedValue(mockCategories[0]);
      (dataLoader.getFoodsByCategory as jest.Mock).mockResolvedValue(mockFoods);

      // Create mock request and params
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: 'cat1' } };

      // Call the handler
      const response = await getCategoryFoodsHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(mockFoods);
      expect(dataLoader.getCategoryById).toHaveBeenCalledWith('cat1');
      expect(dataLoader.getFoodsByCategory).toHaveBeenCalledWith('cat1');
    });

    it('returns 404 for non-existent category', async () => {
      // Mock the getCategoryById function to return null
      (dataLoader.getCategoryById as jest.Mock).mockResolvedValue(null);

      // Create mock request and params
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: 'non-existent' } };

      // Call the handler
      const response = await getCategoryFoodsHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('returns 400 for invalid category ID', async () => {
      // Create mock request and params with empty ID
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: '' } };

      // Call the handler
      const response = await getCategoryFoodsHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_CATEGORY_ID');
    });

    it('handles errors correctly', async () => {
      // Mock the necessary functions
      (dataLoader.getCategoryById as jest.Mock).mockResolvedValue(mockCategories[0]);
      
      // Mock getFoodsByCategory to throw an error
      const mockError = new Error('Test error');
      (dataLoader.getFoodsByCategory as jest.Mock).mockRejectedValue(mockError);

      // Create mock request and params
      const mockRequest = {} as NextRequest;
      const mockParams = { params: { id: 'cat1' } };

      // Call the handler
      const response = await getCategoryFoodsHandler(mockRequest, mockParams as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('FOODS_LOAD_ERROR');
      expect(data.error.details).toBe('Test error');
    });
  });
});