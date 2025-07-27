'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SelectedFood, NutritionTotals, calculateTotalNutrition, compareWithRecommendedIntake, getAvailableAgeGroups, formatNutritionValue } from '../../lib/nutrition';
import { searchFoodNutrition, getAllFoodNutrition } from '../../lib/nutrition-data';
import { FoodNutrition } from '../../lib/nutrition';
import LoadingSpinner from './LoadingSpinner';

interface NutritionCalculatorProps {
  className?: string;
  onSave?: (name: string, selectedFoods: SelectedFood[], ageGroup?: string, gender?: 'male' | 'female') => void;
  initialFoods?: SelectedFood[];
  initialName?: string;
}

export function NutritionCalculator({
  className = '',
  onSave,
  initialFoods = [],
  initialName = ''
}: NutritionCalculatorProps) {
  const { data: session, status } = useSession();
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>(initialFoods);
  const [availableFoods, setAvailableFoods] = useState<FoodNutrition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<FoodNutrition[]>([]);
  const [showFoodSelector, setShowFoodSelector] = useState(false);
  const [nutritionTotals, setNutritionTotals] = useState<NutritionTotals | null>(null);
  const [ageGroup, setAgeGroup] = useState<string>('18-29');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [showComparison, setShowComparison] = useState(false);
  const [calculationName, setCalculationName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available foods on mount
  useEffect(() => {
    const foods = getAllFoodNutrition();
    setAvailableFoods(foods);
    setFilteredFoods(foods);
  }, []);

  // Filter foods based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFoods(availableFoods);
    } else {
      const filtered = searchFoodNutrition(searchQuery);
      setFilteredFoods(filtered);
    }
  }, [searchQuery, availableFoods]);

  // Calculate nutrition totals when selected foods change
  useEffect(() => {
    if (selectedFoods.length > 0) {
      const totals = calculateTotalNutrition(selectedFoods);
      setNutritionTotals(totals);
    } else {
      setNutritionTotals(null);
    }
  }, [selectedFoods]);

  // Check if user has premium access
  const hasPremiumAccess = status === 'authenticated' && session?.user?.subscription?.status === 'premium';

  if (status !== 'authenticated') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          栄養計算機能をご利用ください
        </h3>
        
        <p className="text-blue-700 mb-4">
          栄養計算機能をご利用いただくには、ログインが必要です。
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
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`} data-testid="nutrition-calculator-upgrade-prompt">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          栄養計算機能はプレミアムプラン限定です
        </h3>
        
        <p className="text-blue-700 mb-4">
          複数の食材から栄養価を計算し、推奨摂取量と比較できる機能です。プレミアムプランへのアップグレードが必要です。
        </p>
        
        <Link
          href="/pricing"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
          data-testid="upgrade-button"
        >
          プレミアムプランを見る
        </Link>
      </div>
    );
  }

  const addFood = (food: FoodNutrition) => {
    const newSelectedFood: SelectedFood = {
      food,
      quantity: 100,
      unit: food.unit
    };
    setSelectedFoods([...selectedFoods, newSelectedFood]);
    setShowFoodSelector(false);
    setSearchQuery('');
  };

  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const updateFoodQuantity = (index: number, quantity: number) => {
    const updated = [...selectedFoods];
    updated[index].quantity = quantity;
    setSelectedFoods(updated);
  };

  const updateFoodUnit = (index: number, unit: string) => {
    const updated = [...selectedFoods];
    updated[index].unit = unit;
    setSelectedFoods(updated);
  };

  const handleSave = async () => {
    if (!calculationName.trim()) {
      setError('計算名を入力してください');
      return;
    }

    if (selectedFoods.length === 0) {
      setError('食材を選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (onSave) {
        await onSave(calculationName, selectedFoods, ageGroup, gender);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const comparison = nutritionTotals && showComparison 
    ? compareWithRecommendedIntake(nutritionTotals, ageGroup, gender)
    : null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`} data-testid="nutrition-calculator">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">栄養計算機</h2>
        <p className="text-gray-600">複数の食材を選択して、総合的な栄養価を計算できます。</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Calculation Name */}
        <div>
          <label htmlFor="calculationName" className="block text-sm font-medium text-gray-700 mb-2">
            計算名
          </label>
          <input
            type="text"
            id="calculationName"
            value={calculationName}
            onChange={(e) => setCalculationName(e.target.value)}
            placeholder="例: 今日の朝食"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Food Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">選択した食材</h3>
            <button
              onClick={() => setShowFoodSelector(!showFoodSelector)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              食材を追加
            </button>
          </div>

          {/* Food Selector */}
          {showFoodSelector && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="食材を検索..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredFoods.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => addFood(food)}
                      className="text-left p-2 bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{food.name}</div>
                      <div className="text-sm text-gray-500">{food.category}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Selected Foods List */}
          {selectedFoods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              食材を選択してください
            </div>
          ) : (
            <div className="space-y-3">
              {selectedFoods.map((selectedFood, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{selectedFood.food.name}</div>
                    <div className="text-sm text-gray-500">{selectedFood.food.category}</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={selectedFood.quantity}
                      onChange={(e) => updateFoodQuantity(index, parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.1"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    
                    <select
                      value={selectedFood.unit}
                      onChange={(e) => updateFoodUnit(index, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="個">個</option>
                      <option value="枚">枚</option>
                      <option value="本">本</option>
                      <option value="カップ">カップ</option>
                      <option value="大さじ">大さじ</option>
                      <option value="小さじ">小さじ</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => removeFood(index)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition Results */}
        {nutritionTotals && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">栄養価合計</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">エネルギー</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatNutritionValue(nutritionTotals.calories, 'kcal')} kcal
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">たんぱく質</div>
                <div className="text-lg font-bold text-green-900">
                  {formatNutritionValue(nutritionTotals.protein, 'g')} g
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm text-yellow-600 font-medium">脂質</div>
                <div className="text-lg font-bold text-yellow-900">
                  {formatNutritionValue(nutritionTotals.fat, 'g')} g
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">炭水化物</div>
                <div className="text-lg font-bold text-purple-900">
                  {formatNutritionValue(nutritionTotals.carbohydrates, 'g')} g
                </div>
              </div>
            </div>

            {/* Comparison Settings */}
            <div className="flex items-center space-x-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getAvailableAgeGroups().map(age => (
                    <option key={age} value={age}>{age}歳</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {showComparison ? '比較を隠す' : '推奨量と比較'}
                </button>
              </div>
            </div>

            {/* Nutrition Comparison */}
            {comparison && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">推奨摂取量との比較</h4>
                <div className="space-y-3">
                  {comparison.map((comp) => (
                    <div key={comp.nutrient} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{comp.name}</span>
                        <span className="text-sm text-gray-600">
                          {comp.current} / {comp.recommended} {comp.unit} ({comp.percentage}%)
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${
                            comp.status === 'low' ? 'bg-red-500' :
                            comp.status === 'adequate' ? 'bg-green-500' :
                            comp.status === 'high' ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(comp.percentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-sm text-gray-600">{comp.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Save Button */}
        {onSave && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading || selectedFoods.length === 0 || !calculationName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : '計算を保存'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NutritionCalculator;