'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useShoppingList } from '../../hooks/useShoppingList';
import LoadingSpinner from './LoadingSpinner';

interface ShoppingListProps {
  className?: string;
  showHeader?: boolean;
  showStats?: boolean;
  showAddForm?: boolean;
  recipeId?: string;
  category?: string;
}

export function ShoppingList({
  className = '',
  showHeader = true,
  showStats = true,
  showAddForm = true,
  recipeId,
  category
}: ShoppingListProps) {
  const { data: session, status } = useSession();
  const [includeChecked, setIncludeChecked] = useState(true);
  const [sortBy, setSortBy] = useState<'created_at' | 'food_name' | 'recipe_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    foodName: string;
    quantity: string;
    unit: string;
    notes: string;
  }>({ foodName: '', quantity: '', unit: '', notes: '' });

  const {
    shoppingList,
    isLoading,
    error,
    addItem,
    updateItem,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
    refresh
  } = useShoppingList({
    includeChecked,
    recipeId,
    category,
    sortBy,
    sortOrder
  });

  // Check if user has premium access
  const hasPremiumAccess = status === 'authenticated' && session?.user?.subscription?.status === 'premium';

  if (status !== 'authenticated') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          買い物リスト機能をご利用ください
        </h3>
        
        <p className="text-blue-700 mb-4">
          買い物リスト機能をご利用いただくには、ログインが必要です。
        </p>
        
        <Link
          href="/auth/signin"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          ログイン
        </Link>
      </div>
    );
  }

  if (!hasPremiumAccess) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          買い物リスト機能はプレミアムプラン限定です
        </h3>
        
        <p className="text-blue-700 mb-4">
          レシピの材料や食材を買い物リストに追加して、効率的にお買い物ができます。プレミアムプランへのアップグレードが必要です。
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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const success = await addItem(
      newItemName,
      newItemQuantity || undefined,
      newItemUnit || undefined,
      recipeId,
      undefined,
      category
    );

    if (success) {
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item.id);
    setEditValues({
      foodName: item.foodName,
      quantity: item.quantity || '',
      unit: item.unit || '',
      notes: item.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const success = await updateItem(editingItem, editValues);
    if (success) {
      setEditingItem(null);
      setEditValues({ foodName: '', quantity: '', unit: '', notes: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({ foodName: '', quantity: '', unit: '', notes: '' });
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleClearChecked = async () => {
    if (window.confirm('チェック済みのアイテムを削除しますか？')) {
      await clearChecked();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('すべてのアイテムを削除しますか？この操作は取り消せません。')) {
      await clearAll();
    }
  };

  if (error && error.includes('Premium')) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-700">エラー: {error}</p>
        <Link href="/pricing" className="text-red-600 hover:text-red-800 underline">
          プレミアムプランにアップグレード
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
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">買い物リスト</h2>
              {recipeId ? (
                <p className="text-gray-600 mt-1">レシピの材料</p>
              ) : category ? (
                <p className="text-gray-600 mt-1">カテゴリ: {category}</p>
              ) : (
                <p className="text-gray-600 mt-1">お買い物をもっと効率的に</p>
              )}
            </div>

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

              {shoppingList.checkedCount > 0 && (
                <button
                  onClick={handleClearChecked}
                  className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded-md hover:bg-green-50"
                >
                  完了済みを削除
                </button>
              )}

              {shoppingList.total > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
                >
                  すべて削除
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Stats */}
        {showStats && shoppingList.total > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                進捗: {shoppingList.checkedCount} / {shoppingList.total} 完了
              </span>
              <span className="text-sm text-gray-600">
                {shoppingList.completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${shoppingList.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Add Item Form */}
        {showAddForm && (
          <form onSubmit={handleAddItem} className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">アイテムを追加</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="食材名"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="数量"
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">単位</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="個">個</option>
                <option value="本">本</option>
                <option value="枚">枚</option>
                <option value="パック">パック</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                追加
              </button>
            </div>
          </form>
        )}

        {/* Controls */}
        {shoppingList.total > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeChecked}
                  onChange={(e) => setIncludeChecked(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">完了済みも表示</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">並び順:</span>
              <button
                onClick={() => handleSortChange('created_at')}
                className={`text-sm px-2 py-1 rounded ${
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
                onClick={() => handleSortChange('food_name')}
                className={`text-sm px-2 py-1 rounded ${
                  sortBy === 'food_name'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                名前
                {sortBy === 'food_name' && (
                  <span className="ml-1">
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && shoppingList.items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              買い物リストが空です
            </h3>
            
            <p className="text-gray-600 mb-4">
              食材やレシピの材料を追加して、効率的にお買い物しましょう。
            </p>
            
            {showAddForm && (
              <p className="text-sm text-gray-500">
                上のフォームから食材を追加できます
              </p>
            )}
          </div>
        )}

        {/* Shopping List Items */}
        {shoppingList.items.length > 0 && (
          <div className="space-y-2">
            {shoppingList.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  item.checked 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.checked
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {item.checked && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                  {editingItem === item.id ? (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={editValues.foodName}
                          onChange={(e) => setEditValues(prev => ({ ...prev, foodName: e.target.value }))}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editValues.quantity}
                          onChange={(e) => setEditValues(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="数量"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editValues.unit}
                          onChange={(e) => setEditValues(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="単位"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={editValues.notes}
                        onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="メモ"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.foodName}
                        </span>
                        {(item.quantity || item.unit) && (
                          <span className={`text-sm ${item.checked ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.quantity}{item.unit}
                          </span>
                        )}
                      </div>
                      
                      {item.recipeName && (
                        <div className={`text-xs ${item.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                          レシピ: {item.recipeName}
                        </div>
                      )}
                      
                      {item.notes && (
                        <div className={`text-xs ${item.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                          メモ: {item.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingItem !== item.id && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="編集"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShoppingList;