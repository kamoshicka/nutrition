'use client';

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoriteButton } from './FavoriteButton';

interface FavoritesWidgetProps {
  title?: string;
  itemType?: 'food' | 'recipe';
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

export function FavoritesWidget({
  title = 'お気に入り',
  itemType,
  limit = 6,
  showViewAll = true,
  className = ''
}: FavoritesWidgetProps) {
  const { favorites, total, isLoading, error } = useFavorites({
    itemType,
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  if (error && error.includes('Premium')) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          
          <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">プレミアムプラン限定機能</p>
          
          <Link
            href="/pricing"
            className="inline-block text-sm bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            アップグレード
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-red-600">エラーが発生しました</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        
        {showViewAll && total > 0 && (
          <Link
            href="/favorites"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            すべて見る ({total})
          </Link>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && favorites.length === 0 && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            {itemType === 'food' 
              ? 'お気に入りの食材がありません'
              : itemType === 'recipe'
              ? 'お気に入りのレシピがありません'
              : 'お気に入りがありません'
            }
          </p>
          
          <Link
            href="/search"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            食材を探す
          </Link>
        </div>
      )}

      {/* Favorites List */}
      {favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={favorite.itemType === 'food' 
                    ? `/foods/${favorite.itemId}` 
                    : `/recipes/${favorite.itemId}`
                  }
                  className="block"
                >
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {favorite.itemData.name}
                  </h4>
                  
                  {favorite.itemData.category && (
                    <p className="text-xs text-gray-500 mt-1">
                      {favorite.itemData.category}
                    </p>
                  )}
                </Link>
              </div>

              <div className="flex items-center space-x-2 ml-3">
                <span className="text-xs text-gray-400">
                  {new Date(favorite.createdAt).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                
                <FavoriteButton
                  itemType={favorite.itemType}
                  itemId={favorite.itemId}
                  itemData={favorite.itemData}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Link (bottom) */}
      {showViewAll && favorites.length > 0 && total > favorites.length && (
        <div className="text-center mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/favorites"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            他 {total - favorites.length} 件を見る
          </Link>
        </div>
      )}
    </div>
  );
}

export default FavoritesWidget;