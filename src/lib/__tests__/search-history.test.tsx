import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchHistoryProvider, useSearchHistory } from '../search-history';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the search history context
function TestComponent() {
  const { searchHistory, addToHistory, clearHistory } = useSearchHistory();
  
  return (
    <div>
      <h1>Search History</h1>
      <ul>
        {searchHistory.map((item, index) => (
          <li key={index} data-testid="history-item">{item}</li>
        ))}
      </ul>
      <button onClick={() => addToHistory('test item')}>Add Item</button>
      <button onClick={clearHistory}>Clear History</button>
    </div>
  );
}

describe('SearchHistoryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('loads search history from localStorage on mount', () => {
    const mockHistory = ['item1', 'item2', 'item3'];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockHistory));
    
    render(
      <SearchHistoryProvider>
        <TestComponent />
      </SearchHistoryProvider>
    );
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('searchHistory');
    expect(screen.getAllByTestId('history-item')).toHaveLength(3);
    expect(screen.getByText('item1')).toBeInTheDocument();
    expect(screen.getByText('item2')).toBeInTheDocument();
    expect(screen.getByText('item3')).toBeInTheDocument();
  });

  test('adds item to search history', () => {
    render(
      <SearchHistoryProvider>
        <TestComponent />
      </SearchHistoryProvider>
    );
    
    // Initially empty
    expect(screen.queryByTestId('history-item')).not.toBeInTheDocument();
    
    // Add an item
    fireEvent.click(screen.getByText('Add Item'));
    
    // Check if item was added
    expect(screen.getByTestId('history-item')).toHaveTextContent('test item');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'searchHistory',
      JSON.stringify(['test item'])
    );
  });

  test('prevents duplicate items in history', () => {
    const mockHistory = ['item1', 'item2'];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockHistory));
    
    render(
      <SearchHistoryProvider>
        <TestComponent />
      </SearchHistoryProvider>
    );
    
    // Add an existing item
    act(() => {
      const { addToHistory } = useSearchHistory();
      addToHistory('item1');
    });
    
    // Check if item was moved to the front without duplication
    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems).toHaveLength(2);
    expect(historyItems[0]).toHaveTextContent('item1');
    expect(historyItems[1]).toHaveTextContent('item2');
  });

  test('clears search history', () => {
    const mockHistory = ['item1', 'item2'];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockHistory));
    
    render(
      <SearchHistoryProvider>
        <TestComponent />
      </SearchHistoryProvider>
    );
    
    // Initially has items
    expect(screen.getAllByTestId('history-item')).toHaveLength(2);
    
    // Clear history
    fireEvent.click(screen.getByText('Clear History'));
    
    // Check if history was cleared
    expect(screen.queryByTestId('history-item')).not.toBeInTheDocument();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('searchHistory');
  });

  test('limits history to maximum items', () => {
    // Create a history with more than the maximum items
    const mockHistory = Array.from({ length: 15 }, (_, i) => `item${i + 1}`);
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockHistory));
    
    render(
      <SearchHistoryProvider>
        <TestComponent />
      </SearchHistoryProvider>
    );
    
    // Should be limited to 10 items (MAX_HISTORY_ITEMS)
    expect(screen.getAllByTestId('history-item')).toHaveLength(10);
  });
});