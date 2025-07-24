'use client';

import { Category } from '@/types';
import Link from 'next/link';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

/**
 * CategoryCard component to display category information
 * 
 * This component displays a category card with name, description,
 * and provides navigation to the category detail page.
 */
export default function CategoryCard({ category, className = '' }: CategoryCardProps) {
  return (
    <Link 
      href={`/categories/${category.id}`}
      className={`block h-full transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <div className="h-full p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg">
        <h3 className="mb-2 text-xl font-semibold text-gray-800">{category.name}</h3>
        <p className="text-gray-600">{category.description}</p>
        <div className="flex items-center mt-4 text-blue-600">
          <span className="text-sm font-medium">関連食材を見る</span>
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
        <div className="mt-2 text-xs text-gray-500">
          {category.foodIds.length}種類の食材
        </div>
      </div>
    </Link>
  );
}