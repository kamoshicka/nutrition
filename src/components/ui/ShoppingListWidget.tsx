'use client';

import React from 'react';
import Link from 'next/link';
import { useShoppingList } from '../../hooks/useShoppingList';

interface ShoppingListWidgetProps {
  title?: string;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

export function ShoppingListWidget({
  title = '買い物リスト',
  limit = 5,
  showViewAll = true,
  className = ''
}: ShoppingListWidgetProps) {
  const { shoppingList, isLoading, error, toggleItem } = useShoppingList({
    includeChecked: false,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  if (error && error.includes('Premium')) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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

  const displayItems = shoppingList.items.slice(0, limit);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        
        {showViewAll && shoppingList.total > 0 && (
          <Link
            href="/shopping-list"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            すべて見る ({shoppingList.uncheckedCount})
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      {shoppingList.total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>進捗</span>
            <span>{shoppingList.checkedCount} / {shoppingList.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${shoppingList.completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && shoppingList.items.length === 0 && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            買い物リストが空です
          </p>
          
          <Link
            href="/shopping-list"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            アイテムを追加
          </Link>
        </div>
      )}

      {/* Shopping List Items */}
      {displayItems.length > 0 && (
        <div className="space-y-2">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item.id)}
                className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 hover:border-green-400 flex items-center justify-center transition-colors"
              >
                {item.checked && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Item Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.foodName}
                  </span>
                  {(item.quantity || item.unit) && (
                    <span className="text-xs text-gray-500 ml-2">
                      {item.quantity}{item.unit}
                    </span>
                  )}
                </div>
                
                {item.recipeName && (
                  <div className="text-xs text-gray-500 truncate">
                    {item.recipeName}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Link (bottom) */}
      {showViewAll && displayItems.length > 0 && shoppingList.total > displayItems.length && (
        <div className="text-center mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/shopping-list"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            他 {shoppingList.total - displayItems.length} 件を見る
          </Link>
        </div>
      )}
    </div>
  );
}

export default ShoppingListWidget;