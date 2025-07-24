'use client';

import { Food } from '@/types';
import Link from 'next/link';

interface FoodCardProps {
  food: Food;
  className?: string;
}

/**
 * FoodCard component to display food information
 * 
 * This component displays a food card with name, description,
 * and a summary of health benefits. It also provides navigation
 * to the food detail page.
 */
export default function FoodCard({ food, className = '' }: FoodCardProps) {
  // Get the primary health benefit (highest effectiveness)
  const primaryBenefit = food.healthBenefits.length > 0 
    ? food.healthBenefits.sort((a, b) => {
        const effectivenessScore = { high: 3, medium: 2, low: 1 };
        return effectivenessScore[b.effectiveness] - effectivenessScore[a.effectiveness];
      })[0]
    : null;

  // Format nutrition info for display
  const nutritionHighlights = [
    `カロリー: ${food.nutritionalInfo.calories}kcal`,
    `タンパク質: ${food.nutritionalInfo.protein}g`,
    `炭水化物: ${food.nutritionalInfo.carbohydrates}g`,
    `脂質: ${food.nutritionalInfo.fat}g`
  ];

  return (
    <Link 
      href={`/foods/${food.id}`}
      className={`block h-full transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <div className="h-full p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg">
        <h3 className="mb-2 text-xl font-semibold text-gray-800">{food.name}</h3>
        <p className="text-gray-600 mb-3">{food.description}</p>
        
        {primaryBenefit && (
          <div className="mb-3">
            <div className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                primaryBenefit.effectiveness === 'high' ? 'bg-green-500' : 
                primaryBenefit.effectiveness === 'medium' ? 'bg-yellow-500' : 'bg-orange-400'
              }`}></span>
              <span className="text-sm font-medium text-gray-700">
                {primaryBenefit.condition}に効果的
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 pl-4">{primaryBenefit.effect}</p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            {nutritionHighlights.map((item, index) => (
              <div key={index} className="text-xs text-gray-500">{item}</div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center mt-4 text-blue-600">
          <span className="text-sm font-medium">詳細を見る</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-4 h-4 ml-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </div>
        
        {food.precautions.length > 0 && (
          <div className="mt-2 text-xs text-red-500">
            <span className="font-medium">注意事項あり</span>
          </div>
        )}
      </div>
    </Link>
  );
}