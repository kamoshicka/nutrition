'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Maximum number of search history items to store
const MAX_HISTORY_ITEMS = 10;

// Search history context type
interface SearchHistoryContextType {
  searchHistory: string[];
  addToHistory: (term: string) => void;
  clearHistory: () => void;
}

// Create context with default values
const SearchHistoryContext = createContext<SearchHistoryContextType>({
  searchHistory: [],
  addToHistory: () => {},
  clearHistory: () => {},
});

// Custom hook to use search history
export const useSearchHistory = () => useContext(SearchHistoryContext);

// Provider component
export function SearchHistoryProvider({ children }: { children: ReactNode }) {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Load search history from localStorage on component mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory.slice(0, MAX_HISTORY_ITEMS));
        }
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);
  
  // Add a search term to history
  const addToHistory = (term: string) => {
    if (!term.trim()) return;
    
    const updatedHistory = [
      term,
      ...searchHistory.filter(item => item !== term) // Remove duplicates
    ].slice(0, MAX_HISTORY_ITEMS);
    
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };
  
  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };
  
  return (
    <SearchHistoryContext.Provider value={{ searchHistory, addToHistory, clearHistory }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}