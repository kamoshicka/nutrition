import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SearchResultsPage from '../page';
import { useSearchParams } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock window.history.pushState
const pushStateSpy = jest.fn();
Object.defineProperty(window, 'history', {
  writable: true,
  value: { pushState: pushStateSpy },
});

describe('SearchResultsPage', () => {
  const mockSearchParams = new URLSearchParams();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useSearchParams
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param),
    }));
    
    // Default mock implementation for fetch
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/search/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              { id: 'cat1', name: 'カテゴリ1', description: '説明1', foodIds: ['food1', 'food2'] },
              { id: 'cat2', name: 'カテゴリ2', description: '説明2', foodIds: ['food3'] }
            ],
            total: 2,
            query: 'test'
          })
        });
      } else if (url.includes('/api/search/foods')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              { 
                id: 'food1', 
                name: '食材1', 
                description: '説明1',
                nutritionalInfo: {
                  calories: 100,
                  protein: 10,
                  carbohydrates: 20,
                  fat: 5,
                  vitamins: ['A', 'C'],
                  minerals: ['鉄', 'カルシウム']
                },
                healthBenefits: [
                  { condition: '風邪', effect: '免疫力向上', scientificBasis: '研究結果', effectiveness: 'high' }
                ],
                precautions: [],
                cookingMethodIds: ['method1']
              }
            ],
            total: 1,
            query: 'test'
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders search bar with initial query', async () => {
    mockSearchParams.set('q', 'test');
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param),
    }));

    render(<SearchResultsPage />);
    
    expect(screen.getByPlaceholderText('カテゴリや食材を検索...')).toHaveValue('test');
    expect(screen.getByText('検索結果')).toBeInTheDocument();
    
    // Wait for search results to load
    await waitFor(() => {
      expect(screen.getByText('「test」の検索結果: 3件')).toBeInTheDocument();
    });
  });

  test('displays loading state while fetching results', () => {
    mockSearchParams.set('q', 'loading');
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param),
    }));
    
    // Delay the fetch response
    (global.fetch as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0, query: 'loading' })
      }), 100));
    });

    render(<SearchResultsPage />);
    
    expect(screen.getByText('検索結果を読み込み中...')).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    mockSearchParams.set('q', 'error');
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param),
    }));
    
    // Mock fetch to reject
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.reject(new Error('API error'));
    });

    render(<SearchResultsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('検索中にエラーが発生しました')).toBeInTheDocument();
    });
  });

  test('filters results when tab is changed', async () => {
    mockSearchParams.set('q', 'test');
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param),
    }));

    render(<SearchResultsPage />);
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('カテゴリ1')).toBeInTheDocument();
      expect(screen.getByText('食材1')).toBeInTheDocument();
    });
    
    // Click on categories tab
    fireEvent.click(screen.getByText('カテゴリ (2)'));
    
    // Should show only categories
    expect(screen.getByText('カテゴリ1')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ2')).toBeInTheDocument();
    expect(screen.queryByText('食材1')).not.toBeInTheDocument();
    
    // Click on foods tab
    fireEvent.click(screen.getByText('食材 (1)'));
    
    // Should show only foods
    expect(screen.queryByText('カテゴリ1')).not.toBeInTheDocument();
    expect(screen.getByText('食材1')).toBeInTheDocument();
  });

  test('performs new search when search bar is submitted', async () => {
    mockSearchParams.set('q', 'initial');
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param),
    }));

    render(<SearchResultsPage />);
    
    // Change search input
    const searchInput = screen.getByPlaceholderText('カテゴリや食材を検索...');
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    
    // Submit the form
    const form = searchInput.closest('form');
    fireEvent.submit(form!);
    
    // Check if fetch was called with new search term
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('new%20search'));
      expect(pushStateSpy).toHaveBeenCalled();
    });
  });

  test('displays no results message when search returns empty', async () => {
    mockSearchParams.set('q', 'empty');
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (param: string) => mockSearchParams.get(param),
    }));
    
    // Mock fetch to return empty results
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0, query: 'empty' })
      });
    });

    render(<SearchResultsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('検索結果が見つかりませんでした')).toBeInTheDocument();
      expect(screen.getByText('別のキーワードで検索してみてください。')).toBeInTheDocument();
    });
  });
});