'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Category, Food } from '@/types';
import FoodCard from '@/components/ui/FoodCard';
import SearchBar from '@/components/ui/SearchBar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ApiErrorFallback from '@/components/ui/ApiErrorFallback';
import CategoryPageSkeleton from '@/components/ui/skeletons/CategoryPageSkeleton';
import Link from 'next/link';

// Wrapper component with error boundary
export default function CategoryPageWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<CategoryPageSkeleton />}>
        <CategoryPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch category and foods on component mount
  useEffect(() => {
    const fetchCategoryAndFoods = async () => {
      try {
        setIsLoading(true);
        
        // Fetch category details
        const categoryResponse = await fetch(`/api/categories/${categoryId}`);
        if (!categoryResponse.ok) {
          const errorData = await categoryResponse.json();
          throw new Error(errorData.error?.message || 'カテゴリの取得に失敗しました');
        }
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);
        
        // Fetch foods for this category
        const foodsResponse = await fetch(`/api/categories/${categoryId}/foods`);
        if (!foodsResponse.ok) {
          const errorData = await foodsResponse.json();
          throw new Error(errorData.error?.message || '食材の取得に失敗しました');
        }
        const foodsData = await foodsResponse.json();
        setFoods(foodsData);
        setFilteredFoods(foodsData);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得中にエラーが発生しました');
        console.error('Error fetching category data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryAndFoods();
    }
  }, [categoryId]);

  // Handle search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (value.trim() === '') {
      // If search is empty, show all foods
      setFilteredFoods(foods);
      return;
    }
    
    // Filter foods client-side
    const filtered = foods.filter(food => 
      food.name.toLowerCase().includes(value.toLowerCase()) || 
      food.description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredFoods(filtered);
  };

  // Handle retry when error occurs
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    
    // Re-fetch category and foods
    Promise.all([
      fetch(`/api/categories/${categoryId}`).then(res => res.json()),
      fetch(`/api/categories/${categoryId}/foods`).then(res => res.json())
    ])
      .then(([categoryData, foodsData]) => {
        setCategory(categoryData);
        setFoods(foodsData);
        setFilteredFoods(foodsData);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'データの取得中にエラーが発生しました');
        console.error('Error fetching data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
          aria-label="カテゴリ一覧に戻る"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          カテゴリ一覧に戻る
        </Link>
      </div>

      {isLoading ? (
        <CategoryPageSkeleton />
      ) : error ? (
        <ApiErrorFallback 
          error={new Error(error)} 
          retryAction={handleRetry}
        />
      ) : category ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {category.name}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {category.description}
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-4 mb-6 shadow-sm">
              <h2 className="text-lg font-medium text-blue-800 mb-2">このカテゴリについて</h2>
              <p className="text-blue-700">
                {category.name}に効果的な食材を一覧で表示しています。
                各食材の詳細情報や調理法を確認するには、食材カードをクリックしてください。
              </p>
            </div>
            
            <SearchBar 
              placeholder="食材を検索..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="mb-6"
            />
            
            {filteredFoods.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {searchTerm ? '検索条件に一致する食材がありません' : 'このカテゴリには食材がありません'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4" aria-live="polite">
                  {filteredFoods.length}件の食材が見つかりました
                  {searchTerm && ` (検索: "${searchTerm}")`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list" aria-label={`${category.name}に効果的な食材一覧`}>
                  {filteredFoods.map(food => (
                    <div key={food.id} role="listitem">
                      <FoodCard 
                        food={food} 
                        className="h-full transition-all hover:shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        // If we've finished loading but there's no category, redirect to 404
        notFound()
      )}
    </div>
  );
}