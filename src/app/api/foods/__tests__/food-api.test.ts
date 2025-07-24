import { NextRequest } from 'next/server';
import { GET } from '../[id]/route';
import * as dataLoader from '@/lib/data-loader';

// Mock the data-loader module
jest.mock('@/lib/data-loader', () => ({
  getFoodById: jest.fn(),
  getCookingMethodsByFood: jest.fn()
}));

describe('Food API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid food ID', async () => {
    const mockRequest = {} as NextRequest;
    const mockParams = { params: { id: '' } };
    
    const response = await GET(mockRequest, mockParams as any);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_FOOD_ID');
  });

  it('should return 404 when food is not found', async () => {
    const mockRequest = {} as NextRequest;
    const mockParams = { params: { id: 'non-existent-food' } };
    
    // Mock getFoodById to return null (food not found)
    (dataLoader.getFoodById as jest.Mock).mockResolvedValue(null);
    
    const response = await GET(mockRequest, mockParams as any);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error.code).toBe('FOOD_NOT_FOUND');
    expect(dataLoader.getFoodById).toHaveBeenCalledWith('non-existent-food');
  });

  it('should return food details and cooking methods', async () => {
    const mockRequest = {} as NextRequest;
    const mockParams = { params: { id: 'garlic' } };
    
    // Mock food data
    const mockFood = {
      id: 'garlic',
      name: 'にんにく',
      description: '強い香りと味を持つ香味野菜',
      nutritionalInfo: {
        calories: 134,
        protein: 6.2,
        carbohydrates: 28.4,
        fat: 0.9,
        vitamins: ['ビタミンB6', 'ビタミンC'],
        minerals: ['マンガン', 'セレン']
      },
      healthBenefits: [
        {
          condition: '高血圧',
          effect: '血管を拡張させる',
          scientificBasis: 'アリシンという成分が血管拡張作用を持つ',
          effectiveness: 'high'
        }
      ],
      precautions: ['空腹時の大量摂取は胃腸障害を起こす可能性がある'],
      cookingMethodIds: ['roasted', 'raw']
    };
    
    // Mock cooking methods
    const mockCookingMethods = [
      {
        id: 'raw',
        name: '生食',
        description: '加熱せずにそのまま食べる',
        steps: ['食材をよく洗う', 'そのまま食べる'],
        nutritionRetention: 100,
        difficulty: 'easy',
        cookingTime: 5
      },
      {
        id: 'roasted',
        name: 'ロースト',
        description: 'オーブンで焼く',
        steps: ['オーブンを予熱する', '焼く'],
        nutritionRetention: 80,
        difficulty: 'medium',
        cookingTime: 20
      }
    ];
    
    // Setup mocks
    (dataLoader.getFoodById as jest.Mock).mockResolvedValue(mockFood);
    (dataLoader.getCookingMethodsByFood as jest.Mock).mockResolvedValue(mockCookingMethods);
    
    const response = await GET(mockRequest, mockParams as any);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.food).toEqual(mockFood);
    
    // Verify cooking methods are sorted by nutrition retention (highest first)
    expect(data.cookingMethods[0].id).toBe('raw');
    expect(data.cookingMethods[1].id).toBe('roasted');
    
    expect(dataLoader.getFoodById).toHaveBeenCalledWith('garlic');
    expect(dataLoader.getCookingMethodsByFood).toHaveBeenCalledWith('garlic');
  });

  it('should handle errors properly', async () => {
    const mockRequest = {} as NextRequest;
    const mockParams = { params: { id: 'garlic' } };
    
    // Mock an error
    const mockError = new Error('Database connection failed');
    (dataLoader.getFoodById as jest.Mock).mockRejectedValue(mockError);
    
    const response = await GET(mockRequest, mockParams as any);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error.code).toBe('FOOD_DETAILS_LOAD_ERROR');
    expect(data.error.details).toBe('Database connection failed');
  });
});