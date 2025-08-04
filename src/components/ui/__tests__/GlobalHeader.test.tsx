import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalHeader from '../GlobalHeader';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('GlobalHeader', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/');
    
    // Default fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: ['りんご', 'バナナ', 'オレンジ'] }),
    });
  });

  test('renders header with app title and search bar', () => {
    render(<GlobalHeader />);
    
    expect(screen.getByText('クックケア')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('カテゴリや食材を検索...')).toBeInTheDocument();
  });

  test('navigates to search page on search submission', () => {
    render(<GlobalHeader />);
    
    const searchInput = screen.getByPlaceholderText('カテゴリや食材を検索...');
    fireEvent.change(searchInput, { target: { value: 'りんご' } });
    
    const form = searchInput.closest('form');
    fireEvent.submit(form!);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/search?q=りんご');
  });

  test('loads search history from localStorage', () => {
    const mockHistory = ['りんご', 'バナナ', 'オレンジ'];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockHistory));
    
    render(<GlobalHeader />);
    
    // Focus the search input to show suggestions
    const searchInput = screen.getByPlaceholderText('カテゴリや食材を検索...');
    fireEvent.focus(searchInput);
    
    // Check if history items are displayed
    expect(screen.getByText('最近の検索')).toBeInTheDocument();
    expect(screen.getByText('りんご')).toBeInTheDocument();
    expect(screen.getByText('バナナ')).toBeInTheDocument();
    expect(screen.getByText('オレンジ')).toBeInTheDocument();
  });

  test('saves search term to history on search', () => {
    const mockHistory: string[] = [];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockHistory));
    
    render(<GlobalHeader />);
    
    const searchInput = screen.getByPlaceholderText('カテゴリや食材を検索...');
    fireEvent.change(searchInput, { target: { value: 'りんご' } });
    
    const form = searchInput.closest('form');
    fireEvent.submit(form!);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'searchHistory',
      JSON.stringify(['りんご'])
    );
  });

  test('fetches and displays search suggestions', async () => {
    render(<GlobalHeader />);
    
    const searchInput = screen.getByPlaceholderText('カテゴリや食材を検索...');
    fireEvent.change(searchInput, { target: { value: 'り' } });
    
    // Wait for debounce
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/search/suggestions?q=り'));
    });
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('りんご')).toBeInTheDocument();
      expect(screen.getByText('バナナ')).toBeInTheDocument();
      expect(screen.getByText('オレンジ')).toBeInTheDocument();
    });
  });

  test('clicking on a suggestion performs search', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: ['りんご', 'りんごジュース'] }),
    });
    
    render(<GlobalHeader />);
    
    const searchInput = screen.getByPlaceholderText('カテゴリや食材を検索...');
    fireEvent.change(searchInput, { target: { value: 'りん' } });
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('りんご')).toBeInTheDocument();
    });
    
    // Click on a suggestion
    fireEvent.click(screen.getByText('りんご'));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/search?q=りんご');
  });
});