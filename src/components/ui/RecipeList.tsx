'use client';

import { useState, useEffect, useCallback } from 'react';
import { RakutenRecipe } from '@/types';
import RecipeCard from './RecipeCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface RecipeListProps {
  foodId?: string;
  foodName?: string;
  searchKeyword?: string;
  categoryId?: string;
  className?: string;
}

export default function RecipeList({ 
  foodId, 
  foodName, 
  searchKeyword, 
  categoryId, 
  className = '' 
}: RecipeListProps) {
  const [recipes, setRecipes] = useState<RakutenRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchRecipes = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      let url = '';
      if (foodId) {
        url = `/api/foods/${foodId}/recipes`;
      } else if (searchKeyword) {
        url = `/api/recipes/search?q=${encodeURIComponent(searchKeyword)}&page=${pageNum}`;
        if (categoryId) {
          url += `&categoryId=${categoryId}`;
        }
      } else {
        url = `/api/recipes?page=${pageNum}`;
        if (categoryId) {
          url += `&categoryId=${categoryId}`;
        }
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'レシピの取得に失敗しました');
      }

      const data = await response.json();
      const newRecipes = data.recipes || [];

      if (pageNum === 1) {
        setRecipes(newRecipes);
      } else {
        setRecipes(prev => [...prev, ...newRecipes]);
      }

      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レシピの取得中にエラーが発生しました');
      console.error('Recipe fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [foodId, searchKeyword, categoryId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchRecipes(page + 1);
    }
  };

  const retry = () => {
    setError(null);
    fetchRecipes(1);
  };

  if (loading && recipes.length === 0) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && recipes.length === 0) {
    return (
      <div className={className}>
        <ErrorMessage
          message="レシピの取得に失敗しました"
          details={error}
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {foodName && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {foodName}のレシピ
          </h2>
          <p className="text-gray-600">
            {recipes.length}件のレシピが見つかりました
          </p>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-12">
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">レシピが見つかりませんでした</h3>
          <p className="mt-1 text-sm text-gray-500">
            別のキーワードで検索してみてください。
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.recipeId} recipe={recipe} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'ロード中...' : 'もっと見る'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorMessage
                message="追加のレシピ取得に失敗しました"
                details={error}
                onRetry={() => fetchRecipes(page)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}