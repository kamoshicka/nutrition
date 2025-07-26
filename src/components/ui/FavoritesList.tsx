'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoriteButton } from './FavoriteButton';
import { LoadingSpinner } from './LoadingSpinner';

interface FavoritesListProps {
  itemType?: 'food' | 'recipe';
  className?: string;
}

export function FavoritesList({ itemType, className = '' }: FavoritesListProps) {
  const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const {
    favorites,
    total,
    hasMore,
    isLoading,
    error,
    loadMore,
    refresh,
    clearFavorites
  } = useFavorites({
    itemType,
    sortBy,
    sortOrder
  });

  const handleSortChange = (newSortBy: 'created_at' | 'name') => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('すべてのお気に入りを削除しますか？この操作は取り消せません。')) {
      await clearFavorites(itemType);
    }
  };

  if (error && error.includes('Premium')) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          お気に入り機能はプレミアムプラン限定です
        </h3>
        
        <p className="text-blue-700 mb-4">
          お気に入り機能をご利用いただくには、プレミアムプランへのアップグレードが必要です。
        </p>
        
        <Link
          href="/pricing"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          プレミアムプランを見る
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-700">エラー: {error}</p>
        <button
          onClick={refresh}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            お気に入り
            {itemType && (
              <span className="ml-2 text-lg text-gray-600">
                ({itemType === 'food' ? '食材' : 'レシピ'})
              </span>
            )}
          </h2>
          <p className="text-gray-600 mt-1">
            {total > 0 ? `${total}件のお気に入り` : 'お気に入りはありません'}
          </p>
        </div>

        {total > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="更新"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
            >
              すべて削除
            </button>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      {total > 0 && (
        <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">並び順:</span>
          
          <button
            onClick={() => handleSortChange('created_at')}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              sortBy === 'created_at'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            追加日時
            {sortBy === 'created_at' && (
              <span className="ml-1">
                {sortOrder === 'desc' ? '↓' : '↑'}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handleSortChange('name')}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              sortBy === 'name'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            名前
            {sortBy === 'name' && (
              <span className="ml-1">
                {sortOrder === 'desc' ? '↓' : '↑'}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && favorites.length === 0 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            お気に入りがありません
          </h3>
          
          <p className="text-gray-600 mb-4">
            {itemType === 'food' 
              ? '食材ページでハートボタンを押してお気に入りに追加しましょう'
              : itemType === 'recipe'
              ? 'レシピページでハートボタンを押してお気に入りに追加しましょう'
              : '食材やレシピページでハートボタンを押してお気に入りに追加しましょう'
            }
          </p>
          
          <Link
            href="/search"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            食材を探す
          </Link>
        </div>
      )}

      {/* Favorites Grid */}
      {favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {favorite.itemData.name}
                  </h3>
                  
                  {favorite.itemData.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {favorite.itemData.description}
                    </p>
                  )}
                  
                  {favorite.itemData.category && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {favorite.itemData.category}
                    </span>
                  )}
                </div>

                <FavoriteButton
                  itemType={favorite.itemType}
                  itemId={favorite.itemId}
                  itemData={favorite.itemData}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(favorite.createdAt).toLocaleDateString('ja-JP')}
                </span>

                <Link
                  href={favorite.itemType === 'food' 
                    ? `/foods/${favorite.itemId}` 
                    : `/recipes/${favorite.itemId}`
                  }
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  詳細を見る →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '読み込み中...' : 'もっと見る'}
          </button>
        </div>
      )}
    </div>
  );
}

export default FavoritesList;