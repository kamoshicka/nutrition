import React, { useState } from 'react';
import { CookingMethod } from '@/types';

interface CookingMethodListProps {
  cookingMethods: CookingMethod[];
  sortBy?: 'nutritionRetention' | 'difficulty' | 'cookingTime';
}

const CookingMethodList: React.FC<CookingMethodListProps> = ({ 
  cookingMethods, 
  sortBy = 'nutritionRetention' 
}) => {
  const [activeSortBy, setActiveSortBy] = useState<'nutritionRetention' | 'difficulty' | 'cookingTime'>(sortBy);
  
  // Sort cooking methods based on selected criteria
  const sortedMethods = [...cookingMethods].sort((a, b) => {
    switch (activeSortBy) {
      case 'nutritionRetention':
        return b.nutritionRetention - a.nutritionRetention;
      case 'difficulty':
        const difficultyScore = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return difficultyScore[a.difficulty] - difficultyScore[b.difficulty];
      case 'cookingTime':
        return a.cookingTime - b.cookingTime;
      default:
        return b.nutritionRetention - a.nutritionRetention;
    }
  });

  // Helper function to render difficulty badge
  const renderDifficultyBadge = (difficulty: CookingMethod['difficulty']) => {
    const badgeClasses = {
      easy: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hard: 'bg-red-100 text-red-800 border-red-200',
    };
    
    const badgeLabels = {
      easy: '簡単',
      medium: '普通',
      hard: '難しい',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[difficulty]}`}>
        {badgeLabels[difficulty]}
      </span>
    );
  };

  if (cookingMethods.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-center">
        <p className="text-gray-500">この食材に対する調理法情報はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-gray-700 mr-2 self-center">並び替え:</span>
        <button
          onClick={() => setActiveSortBy('nutritionRetention')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeSortBy === 'nutritionRetention'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          栄養保持率
        </button>
        <button
          onClick={() => setActiveSortBy('difficulty')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeSortBy === 'difficulty'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          難易度
        </button>
        <button
          onClick={() => setActiveSortBy('cookingTime')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeSortBy === 'cookingTime'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          調理時間
        </button>
      </div>
      
      {sortedMethods.map((method) => (
        <div key={method.id} className="border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md">
          <div className="flex flex-wrap items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">{method.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
              {renderDifficultyBadge(method.difficulty)}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {method.cookingTime}分
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                栄養保持率 {method.nutritionRetention}%
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">{method.description}</p>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">調理手順</h4>
            <ol className="list-decimal list-inside space-y-2">
              {method.steps.map((step, index) => (
                <li key={index} className="text-gray-700">
                  <span className="ml-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CookingMethodList;