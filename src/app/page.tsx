'use client';

import { useState, useEffect, Suspense } from 'react';
import { Category } from '@/types';
import SearchBar from '@/components/ui/SearchBar';
import CategoryCard from '@/components/ui/CategoryCard';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ApiErrorFallback from '@/components/ui/ApiErrorFallback';
import CategoryCardSkeleton from '@/components/ui/skeletons/CategoryCardSkeleton';
import AdSenseAd from '@/components/ui/AdSenseAd';

// Wrapper component with error boundary
export default function HomePageWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<CategoryCardSkeleton />}>
        <HomePage />
      </Suspense>
    </ErrorBoundary>
  );
}

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'カテゴリの取得に失敗しました');
        }
        
        const data = await response.json();
        setCategories(data);
        setFilteredCategories(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'カテゴリの取得中にエラーが発生しました');
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle search term changes
  const handleSearchChange = async (value: string) => {
    setSearchTerm(value);
    
    if (value.trim() === '') {
      // If search is empty, show all categories
      setFilteredCategories(categories);
      return;
    }
    
    try {
      const response = await fetch(`/api/search/categories?q=${encodeURIComponent(value)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '検索中にエラーが発生しました');
      }
      
      const data = await response.json();
      setFilteredCategories(data);
    } catch (err) {
      console.error('Error searching categories:', err);
      // On search error, fall back to client-side filtering
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(value.toLowerCase()) || 
        category.description.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  };

  // Handle retry when error occurs
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-fetch categories
    fetch('/api/categories')
      .then(response => {
        if (!response.ok) {
          throw new Error('カテゴリの取得に失敗しました');
        }
        return response.json();
      })
      .then(data => {
        setCategories(data);
        setFilteredCategories(data);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'カテゴリの取得中にエラーが発生しました');
        console.error('Error fetching categories:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="space-y-8">
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
      
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          クックケア - 健康食材検索
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          病気・症状に効果的な食材と調理法を見つけて、<br></br>健康的な食生活をサポートします。
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <SearchBar 
          placeholder="カテゴリを検索..." 
          value={searchTerm}
          onChange={handleSearchChange}
          className="mb-6"
        />
        
        {isLoading ? (
          <CategoryCardSkeleton />
        ) : error ? (
          <ApiErrorFallback 
            error={new Error(error)} 
            retryAction={handleRetry}
          />
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">検索条件に一致するカテゴリがありません</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category, index) => (
                <div key={category.id}>
                  <CategoryCard category={category} />
                  {/* Insert ad after every 6 categories */}
                  {(index + 1) % 6 === 0 && (
                    <div className="mt-6 mb-6">
                      <AdSenseAd 
                        placement="content" 
                        className="w-full"
                        fallback={
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-600">コンテンツ広告</p>
                          </div>
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Footer Ad */}
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
          </>
        )}
      </div>
    </div>
  );
}