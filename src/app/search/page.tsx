'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Category, Food } from '@/types';
import SearchBar from '@/components/ui/SearchBar';
import CategoryCard from '@/components/ui/CategoryCard';
import FoodCard from '@/components/ui/FoodCard';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ApiErrorFallback from '@/components/ui/ApiErrorFallback';
import SearchResultsSkeleton from '@/components/ui/skeletons/SearchResultsSkeleton';
import { useSearchHistory } from '@/lib/search-history';
import AdSenseAd from '@/components/ui/AdSenseAd';

/**
 * SearchResultsPage component
 * 
 * This page displays search results for both categories and foods
 * based on the search query provided in the URL parameters.
 */
export default function SearchResultsPageWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResultsPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { addToHistory } = useSearchHistory();
  
  const [searchTerm, setSearchTerm] = useState(query);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'foods'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch search results when query changes
  useEffect(() => {
    if (!query) return;
    
    // Add query to search history
    if (query.trim()) {
      addToHistory(query);
    }
    
    setIsLoading(true);
    setError(null);
    
    // Fetch both categories and foods in parallel
    Promise.all([
      fetch(`/api/search/categories?q=${encodeURIComponent(query)}`)
        .then(res => {
          if (!res.ok) throw new Error('カテゴリの検索に失敗しました');
          return res.json();
        }),
      fetch(`/api/search/foods?q=${encodeURIComponent(query)}`)
        .then(res => {
          if (!res.ok) throw new Error('食材の検索に失敗しました');
          return res.json();
        })
    ])
    .then(([categoryResults, foodResults]) => {
      setCategories(categoryResults.items || []);
      setFoods(foodResults.items || []);
      setIsLoading(false);
    })
    .catch(err => {
      console.error('Search error:', err);
      setError(err.message || '検索中にエラーが発生しました');
      setIsLoading(false);
    });
  }, [query, addToHistory]);

  // Handle search submission
  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    
    // Add to search history
    addToHistory(value);
    
    // Update URL with new search query
    const url = new URL(window.location.href);
    url.searchParams.set('q', value);
    window.history.pushState({}, '', url.toString());
    
    // Reset state for new search
    setSearchTerm(value);
    setIsLoading(true);
    setError(null);
    
    // Fetch both categories and foods in parallel
    Promise.all([
      fetch(`/api/search/categories?q=${encodeURIComponent(value)}`)
        .then(res => {
          if (!res.ok) throw new Error('カテゴリの検索に失敗しました');
          return res.json();
        }),
      fetch(`/api/search/foods?q=${encodeURIComponent(value)}`)
        .then(res => {
          if (!res.ok) throw new Error('食材の検索に失敗しました');
          return res.json();
        })
    ])
    .then(([categoryResults, foodResults]) => {
      setCategories(categoryResults.items || []);
      setFoods(foodResults.items || []);
      setIsLoading(false);
    })
    .catch(err => {
      console.error('Search error:', err);
      setError(err.message || '検索中にエラーが発生しました');
      setIsLoading(false);
    });
  };

  // Filter results based on active tab
  const filteredCategories = activeTab === 'all' || activeTab === 'categories' ? categories : [];
  const filteredFoods = activeTab === 'all' || activeTab === 'foods' ? foods : [];
  
  // Calculate total results
  const totalResults = filteredCategories.length + filteredFoods.length;

  return (
    <div className="space-y-6">
      {/* Header Ad */}
      <AdSenseAd 
        placement="header" 
        className="w-full"
        fallback={
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">広告スペース</p>
          </div>
        }
      />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">検索結果</h1>
        
        <SearchBar
          placeholder="カテゴリや食材を検索..."
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearch}
          className="max-w-2xl"
        />
      </div>

      {isLoading ? (
        <SearchResultsSkeleton />
      ) : error ? (
        <ApiErrorFallback 
          error={new Error(error)} 
          retryAction={() => handleSearch(searchTerm)} 
        />
      ) : (
        <>
          {/* Filter tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                すべて ({categories.length + foods.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                カテゴリ ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('foods')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'foods'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                食材 ({foods.length})
              </button>
            </nav>
          </div>

          {/* Results summary */}
          <div className="text-sm text-gray-600 mb-4">
            {query ? (
              <p>「{query}」の検索結果: {totalResults}件</p>
            ) : (
              <p>検索キーワードを入力してください</p>
            )}
          </div>

          {/* No results message */}
          {totalResults === 0 && query && (
            <div className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">検索結果が見つかりませんでした</h3>
              <p className="mt-1 text-sm text-gray-500">別のキーワードで検索してみてください。</p>
            </div>
          )}

          {/* Categories section */}
          {filteredCategories.length > 0 && (
            <div className="mb-8">
              {activeTab !== 'categories' && <h2 className="text-xl font-semibold mb-4">カテゴリ</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Content Ad between sections */}
          {filteredCategories.length > 0 && filteredFoods.length > 0 && (
            <AdSenseAd 
              placement="content" 
              className="w-full my-8"
              fallback={
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center my-8">
                  <p className="text-sm text-blue-600">コンテンツ広告</p>
                </div>
              }
            />
          )}

          {/* Foods section */}
          {filteredFoods.length > 0 && (
            <div>
              {activeTab !== 'foods' && <h2 className="text-xl font-semibold mb-4">食材</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFoods.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            </div>
          )}

          {/* Footer Ad */}
          {totalResults > 0 && (
            <div className="mt-8">
              <AdSenseAd 
                placement="footer" 
                className="w-full"
                fallback={
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">フッター広告スペース</p>
                  </div>
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}