'use client';

import React from 'react';
import { RecipePDFData, FoodPDFData, NutritionCalculationPDFData } from '../../lib/pdf-generator';

interface PDFPreviewProps {
  type: 'recipe' | 'food' | 'nutrition';
  data: RecipePDFData | FoodPDFData | NutritionCalculationPDFData;
  notes?: string;
  className?: string;
}

export function PDFPreview({ type, data, notes, className = '' }: PDFPreviewProps) {
  const renderRecipePreview = (recipeData: RecipePDFData) => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">{recipeData.name}</h1>
        {recipeData.description && (
          <p className="text-gray-600">{recipeData.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {recipeData.category && (
          <div><strong>カテゴリ:</strong> {recipeData.category}</div>
        )}
        {recipeData.cookingTime && (
          <div><strong>調理時間:</strong> {recipeData.cookingTime}</div>
        )}
        {recipeData.servings && (
          <div><strong>人数:</strong> {recipeData.servings}人分</div>
        )}
        {recipeData.difficulty && (
          <div><strong>難易度:</strong> {recipeData.difficulty}</div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-green-600 mb-3 border-b border-green-200 pb-1">材料</h2>
        <ul className="space-y-2">
          {recipeData.ingredients.map((ingredient, index) => (
            <li key={index} className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="font-medium">{ingredient.name}</span>
              {ingredient.amount && (
                <span className="text-gray-600">{ingredient.amount}{ingredient.unit || ''}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {recipeData.instructions && recipeData.instructions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-3 border-b border-red-200 pb-1">作り方</h2>
          <ol className="space-y-2">
            {recipeData.instructions.map((instruction, index) => (
              <li key={index} className="flex">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {recipeData.nutritionInfo && (
        <div>
          <h2 className="text-lg font-semibold text-purple-600 mb-3 border-b border-purple-200 pb-1">栄養情報（1人分）</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recipeData.nutritionInfo.calories && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-600 font-medium">エネルギー</div>
                <div className="text-lg font-bold text-blue-900">{recipeData.nutritionInfo.calories}kcal</div>
              </div>
            )}
            {recipeData.nutritionInfo.protein && (
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-600 font-medium">たんぱく質</div>
                <div className="text-lg font-bold text-green-900">{recipeData.nutritionInfo.protein}g</div>
              </div>
            )}
            {recipeData.nutritionInfo.fat && (
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-sm text-yellow-600 font-medium">脂質</div>
                <div className="text-lg font-bold text-yellow-900">{recipeData.nutritionInfo.fat}g</div>
              </div>
            )}
            {recipeData.nutritionInfo.carbohydrates && (
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-purple-600 font-medium">炭水化物</div>
                <div className="text-lg font-bold text-purple-900">{recipeData.nutritionInfo.carbohydrates}g</div>
              </div>
            )}
            {recipeData.nutritionInfo.fiber && (
              <div className="bg-indigo-50 p-3 rounded">
                <div className="text-sm text-indigo-600 font-medium">食物繊維</div>
                <div className="text-lg font-bold text-indigo-900">{recipeData.nutritionInfo.fiber}g</div>
              </div>
            )}
            {recipeData.nutritionInfo.sodium && (
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm text-red-600 font-medium">ナトリウム</div>
                <div className="text-lg font-bold text-red-900">{recipeData.nutritionInfo.sodium}mg</div>
              </div>
            )}
          </div>
        </div>
      )}

      {recipeData.tags && recipeData.tags.length > 0 && (
        <div>
          <strong className="text-gray-700">タグ: </strong>
          <div className="inline-flex flex-wrap gap-2 mt-1">
            {recipeData.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFoodPreview = (foodData: FoodPDFData) => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">{foodData.name}</h1>
        {foodData.description && (
          <p className="text-gray-600">{foodData.description}</p>
        )}
        {foodData.category && (
          <div className="mt-2"><strong>カテゴリ:</strong> {foodData.category}</div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-green-600 mb-3 border-b border-green-200 pb-1">栄養成分（100gあたり）</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600 font-medium">エネルギー</div>
            <div className="text-lg font-bold text-blue-900">{foodData.nutritionPer100g.calories}kcal</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600 font-medium">たんぱく質</div>
            <div className="text-lg font-bold text-green-900">{foodData.nutritionPer100g.protein}g</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-sm text-yellow-600 font-medium">脂質</div>
            <div className="text-lg font-bold text-yellow-900">{foodData.nutritionPer100g.fat}g</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-sm text-purple-600 font-medium">炭水化物</div>
            <div className="text-lg font-bold text-purple-900">{foodData.nutritionPer100g.carbohydrates}g</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded">
            <div className="text-sm text-indigo-600 font-medium">食物繊維</div>
            <div className="text-lg font-bold text-indigo-900">{foodData.nutritionPer100g.fiber}g</div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-red-600 font-medium">ナトリウム</div>
            <div className="text-lg font-bold text-red-900">{foodData.nutritionPer100g.sodium}mg</div>
          </div>
        </div>
      </div>

      {foodData.healthBenefits && foodData.healthBenefits.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-3 border-b border-red-200 pb-1">健康効果</h2>
          <ul className="space-y-2">
            {foodData.healthBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {foodData.cookingMethods && foodData.cookingMethods.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-purple-600 mb-3 border-b border-purple-200 pb-1">調理方法</h2>
          <ul className="space-y-1">
            {foodData.cookingMethods.map((method, index) => (
              <li key={index} className="text-gray-700">• {method}</li>
            ))}
          </ul>
        </div>
      )}

      {foodData.seasonality && (
        <div>
          <h2 className="text-lg font-semibold text-green-600 mb-3 border-b border-green-200 pb-1">旬の時期</h2>
          <p className="text-gray-700">{foodData.seasonality}</p>
        </div>
      )}

      {foodData.storageInfo && (
        <div>
          <h2 className="text-lg font-semibold text-orange-600 mb-3 border-b border-orange-200 pb-1">保存方法</h2>
          <p className="text-gray-700">{foodData.storageInfo}</p>
        </div>
      )}
    </div>
  );

  const renderNutritionPreview = (calculationData: NutritionCalculationPDFData) => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">栄養計算結果: {calculationData.name}</h1>
        <div className="text-sm text-gray-600 space-y-1">
          <div><strong>計算日時:</strong> {calculationData.calculatedAt.toLocaleString('ja-JP')}</div>
          {calculationData.ageGroup && calculationData.gender && (
            <div><strong>対象:</strong> {calculationData.ageGroup}歳 {calculationData.gender === 'male' ? '男性' : '女性'}</div>
          )}
          <div><strong>総重量:</strong> {calculationData.nutritionTotals.totalWeight.toFixed(1)}g</div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-green-600 mb-3 border-b border-green-200 pb-1">選択した食材</h2>
        <div className="space-y-2">
          {calculationData.selectedFoods.map((food, index) => (
            <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{food.name}</span>
                <span className="text-sm text-gray-500 ml-2">({food.category})</span>
              </div>
              <span className="text-gray-600">{food.quantity}{food.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-red-600 mb-3 border-b border-red-200 pb-1">栄養価合計</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">エネルギー</div>
            <div className="text-xl font-bold text-blue-900">{Math.round(calculationData.nutritionTotals.calories)}kcal</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">たんぱく質</div>
            <div className="text-xl font-bold text-green-900">{(Math.round(calculationData.nutritionTotals.protein * 10) / 10)}g</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">脂質</div>
            <div className="text-xl font-bold text-yellow-900">{(Math.round(calculationData.nutritionTotals.fat * 10) / 10)}g</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">炭水化物</div>
            <div className="text-xl font-bold text-purple-900">{(Math.round(calculationData.nutritionTotals.carbohydrates * 10) / 10)}g</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-600 font-medium">食物繊維</div>
            <div className="text-xl font-bold text-indigo-900">{(Math.round(calculationData.nutritionTotals.fiber * 10) / 10)}g</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">ナトリウム</div>
            <div className="text-xl font-bold text-red-900">{Math.round(calculationData.nutritionTotals.sodium)}mg</div>
          </div>
        </div>
      </div>

      {calculationData.comparison && calculationData.comparison.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-purple-600 mb-3 border-b border-purple-200 pb-1">推奨摂取量との比較</h2>
          <div className="space-y-3">
            {calculationData.comparison.map((comp, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{comp.name}</span>
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
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">PDFプレビュー</h3>
        <p className="text-sm text-gray-600">以下の内容がPDFに含まれます</p>
      </div>

      <div className="space-y-6">
        {type === 'recipe' && renderRecipePreview(data as RecipePDFData)}
        {type === 'food' && renderFoodPreview(data as FoodPDFData)}
        {type === 'nutrition' && renderNutritionPreview(data as NutritionCalculationPDFData)}

        {notes && notes.trim() && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-2">メモ</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500">
            <div className="flex items-center mb-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              生成日時: {new Date().toLocaleString('ja-JP')}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              ヘルスケア食材アプリ - プレミアム機能
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFPreview;