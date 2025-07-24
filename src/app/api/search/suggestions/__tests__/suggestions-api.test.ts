import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as searchModule from '@/lib/search';

// Mock the search module
jest.mock('@/lib/search', () => ({
  getSuggestedSearchTerms: jest.fn(),
}));

describe('Search Suggestions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty suggestions for empty query', async () => {
    // Create mock request
    const request = new NextRequest(new URL('http://localhost/api/search/suggestions?q='));
    
    // Call the API handler
    const response = await GET(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(200);
    expect(data).toEqual({ suggestions: [] });
    expect(searchModule.getSuggestedSearchTerms).not.toHaveBeenCalled();
  });

  it('returns suggestions for valid query', async () => {
    // Mock the search function
    const mockSuggestions = ['りんご', 'りんごジュース', 'りんごパイ'];
    (searchModule.getSuggestedSearchTerms as jest.Mock).mockResolvedValue(mockSuggestions);
    
    // Create mock request
    const request = new NextRequest(new URL('http://localhost/api/search/suggestions?q=りん'));
    
    // Call the API handler
    const response = await GET(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(200);
    expect(data).toEqual({ suggestions: mockSuggestions });
    expect(searchModule.getSuggestedSearchTerms).toHaveBeenCalledWith('りん', 5);
  });

  it('respects the limit parameter', async () => {
    // Mock the search function
    const mockSuggestions = ['りんご', 'りんごジュース'];
    (searchModule.getSuggestedSearchTerms as jest.Mock).mockResolvedValue(mockSuggestions);
    
    // Create mock request
    const request = new NextRequest(new URL('http://localhost/api/search/suggestions?q=りん&limit=2'));
    
    // Call the API handler
    const response = await GET(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(200);
    expect(data).toEqual({ suggestions: mockSuggestions });
    expect(searchModule.getSuggestedSearchTerms).toHaveBeenCalledWith('りん', 2);
  });

  it('handles errors gracefully', async () => {
    // Mock the search function to throw an error
    (searchModule.getSuggestedSearchTerms as jest.Mock).mockRejectedValue(new Error('Test error'));
    
    // Create mock request
    const request = new NextRequest(new URL('http://localhost/api/search/suggestions?q=りん'));
    
    // Call the API handler
    const response = await GET(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('SUGGESTIONS_ERROR');
    expect(data.error.message).toBe('検索候補の取得中にエラーが発生しました');
    expect(data.error.details).toBe('Test error');
  });
});