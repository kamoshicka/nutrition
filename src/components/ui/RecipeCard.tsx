'use client';

import { RakutenRecipe } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface RecipeCardProps {
  recipe: RakutenRecipe;
  className?: string;
}

export default function RecipeCard({ recipe, className = '' }: RecipeCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      <div className="relative h-48 bg-gray-200">
        {(recipe.mediumImageUrl && recipe.mediumImageUrl !== '/placeholder-recipe.jpg') ? (
          <Image
            src={recipe.mediumImageUrl || recipe.foodImageUrl}
            alt={recipe.recipeTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm text-gray-500">レシピ画像</p>
            </div>
          </div>
        )}
        {recipe.pickup === 1 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            注目
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {recipe.recipeTitle}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            {recipe.nickname}
          </span>
          {recipe.rank && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              ランク {recipe.rank}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>{recipe.recipeIndication}</span>
          <span>{recipe.recipeCost}</span>
        </div>

        {recipe.recipeMaterial && recipe.recipeMaterial.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">材料:</p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {recipe.recipeMaterial.slice(0, 3).join(', ')}
              {recipe.recipeMaterial.length > 3 && '...'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {new Date(recipe.recipePublishday).toLocaleDateString('ja-JP')}
          </span>
          <Link
            href={recipe.recipeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            レシピを見る
          </Link>
        </div>
      </div>
    </div>
  );
}