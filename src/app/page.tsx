'use client';

import { useState, useEffect, Suspense } from 'react';
import { Category } from '@/types';
import SearchBar from '@/components/ui/SearchBar';
import CategoryCard from '@/components/ui/CategoryCard';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ApiErrorFallback from '@/components/ui/ApiErrorFallback';
import CategoryCardSkeleton from '@/components/ui/skeletons/CategoryCardSkeleton';

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
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          病気・症状別食材検索
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          健康状態や特定の症状に基づいて、効果的な食材と調理方法を見つけることができます。
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map(category => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}