import { NextRequest } from 'next/server';
import { GET as getCategoriesSearch } from '../categories/route';
import { GET as getFoodsSearch } from '../foods/route';
import * as searchLib from '@/lib/search';

// Mock the search library
jest.mock('@/lib/search', () => ({
  searchCategories: jest.fn(),
  searchFoods: jest.fn(),
}));

describe('Search API Routes', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/search/categories', () => {
    it('should return search results for categories', async () => {
      // Mock search results
      const mockSearchResult = {
        items: [
          { id: 'cat1', name: 'Category 1', description: 'Description 1', foodIds: ['food1'] },
          { id: 'cat2', name: 'Category 2', description: 'Description 2', foodIds: ['food2'] }
        ],
        total: 2,
        query: 'test'
      };
      
      (searchLib.searchCategories as jest.Mock).mockResolvedValue(mockSearchResult);
      
      // Create mock request
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/categories?q=test')
      );
      
      // Call the API route
      const response = await getCategoriesSearch(request);
      const data = await response.json();
      
      // Verify response
      expect(response.status).toBe(200);
      expect(data).toEqual(mockSearchResult);
      expect(searchLib.searchCategories).toHaveBeenCalledWith('test', expect.any(Object));
    });
    
    it('should return 400 error for empty query', async () => {
      // Create mock request with empty query
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/categories?q=')
      );
      
      // Call the API route
      const response = await getCategoriesSearch(request);
      const data = await response.json();
      
      // Verify response
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_SEARCH_QUERY');
      expect(searchLib.searchCategories).not.toHaveBeenCalled();
    });
    
    it('should return 400 error for invalid limit parameter', async () => {
      // Create mock request with invalid limit
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/categories?q=test&limit=invalid')
      );
      
      // Call the API route
      const response = await getCategoriesSearch(request);
      const data = await response.json();
      
      // Verify response
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_LIMIT_PARAMETER');
      expect(searchLib.searchCategories).not.toHaveBeenCalled();
    });
    
    it('should handle search options correctly', async () => {
      // Mock search results
      const mockSearchResult = {
        items: [{ id: 'cat1', name: 'Category 1', description: 'Description 1', foodIds: ['food1'] }],
        total: 1,
        query: 'test'
      };
      
      (searchLib.searchCategories as jest.Mock).mockResolvedValue(mockSearchResult);
      
      // Create mock request with search options
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/categories?q=test&limit=5&caseSensitive=true&exactMatch=true')
      );
      
      // Call the API route
      const response = await getCategoriesSearch(request);
      
      // Verify search options were passed correctly
      expect(searchLib.searchCategories).toHaveBeenCalledWith('test', {
        limit: 5,
        caseSensitive: true,
        exactMatch: true
      });
    });
  });

  describe('GET /api/search/foods', () => {
    it('should return search results for foods', async () => {
      // Mock search results
      const mockSearchResult = {
        items: [
          { 
            id: 'food1', 
            name: 'Food 1', 
            description: 'Description 1',
            nutritionalInfo: { calories: 100, protein: 10, carbohydrates: 20, fat: 5, vitamins: [], minerals: [] },
            healthBenefits: [],
            precautions: [],
            cookingMethodIds: []
          }
        ],
        total: 1,
        query: 'test'
      };
      
      (searchLib.searchFoods as jest.Mock).mockResolvedValue(mockSearchResult);
      
      // Create mock request
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/foods?q=test')
      );
      
      // Call the API route
      const response = await getFoodsSearch(request);
      const data = await response.json();
      
      // Verify response
      expect(response.status).toBe(200);
      expect(data).toEqual(mockSearchResult);
      expect(searchLib.searchFoods).toHaveBeenCalledWith('test', expect.any(Object));
    });
    
    it('should return 400 error for empty query', async () => {
      // Create mock request with empty query
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/foods?q=')
      );
      
      // Call the API route
      const response = await getFoodsSearch(request);
      const data = await response.json();
      
      // Verify response
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_SEARCH_QUERY');
      expect(searchLib.searchFoods).not.toHaveBeenCalled();
    });
    
    it('should return 400 error for invalid limit parameter', async () => {
      // Create mock request with invalid limit
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/foods?q=test&limit=invalid')
      );
      
      // Call the API route
      const response = await getFoodsSearch(request);
      const data = await response.json();
      
      // Verify response
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_LIMIT_PARAMETER');
      expect(searchLib.searchFoods).not.toHaveBeenCalled();
    });
    
    it('should handle search options correctly', async () => {
      // Mock search results
      const mockSearchResult = {
        items: [],
        total: 0,
        query: 'test'
      };
      
      (searchLib.searchFoods as jest.Mock).mockResolvedValue(mockSearchResult);
      
      // Create mock request with search options
      const request = new NextRequest(
        new URL('http://localhost:3000/api/search/foods?q=test&limit=5&caseSensitive=true&exactMatch=true')
      );
      
      // Call the API route
      const response = await getFoodsSearch(request);
      
      // Verify search options were passed correctly
      expect(searchLib.searchFoods).toHaveBeenCalledWith('test', {
        limit: 5,
        caseSensitive: true,
        exactMatch: true
      });
    });
  });
});