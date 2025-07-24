'use client';

import Skeleton from '../Skeleton';

/**
 * FoodDetailSkeleton component for displaying loading state of food detail page
 * 
 * This component shows a placeholder layout of the food detail page while content is loading.
 */
export default function FoodDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Back link */}
      <div className="mb-4">
        <Skeleton variant="text" className="h-4 w-32" />
      </div>

      {/* Food header */}
      <div className="bg-white shadow rounded-lg p-6">
        <Skeleton variant="text" className="h-8 w-3/4 mb-4" />
        <Skeleton variant="text" className="h-5 w-full mb-2" />
        <Skeleton variant="text" className="h-5 w-5/6" />
      </div>

      {/* Nutrition info */}
      <div className="bg-white shadow rounded-lg p-6">
        <Skeleton variant="text" className="h-6 w-40 mb-4" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-3 rounded-lg">
              <Skeleton variant="text" className="h-4 w-20 mb-2" />
              <Skeleton variant="text" className="h-5 w-16" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(2).fill(0).map((_, i) => (
            <div key={i}>
              <Skeleton variant="text" className="h-5 w-24 mb-3" />
              {Array(4).fill(0).map((_, j) => (
                <Skeleton key={j} variant="text" className="h-4 w-full mb-2" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Health benefits */}
      <div className="bg-white shadow rounded-lg p-6">
        <Skeleton variant="text" className="h-6 w-40 mb-6" />
        
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex justify-between mb-3">
              <Skeleton variant="text" className="h-5 w-1/3" />
              <Skeleton variant="rounded" className="h-5 w-16" />
            </div>
            <Skeleton variant="text" className="h-4 w-full mb-2" />
            <Skeleton variant="text" className="h-4 w-5/6 mb-4" />
            
            <div className="p-3 rounded-md">
              <Skeleton variant="text" className="h-4 w-32 mb-2" />
              <Skeleton variant="text" className="h-4 w-full mb-1" />
              <Skeleton variant="text" className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>

      {/* Cooking methods */}
      <div className="bg-white shadow rounded-lg p-6">
        <Skeleton variant="text" className="h-6 w-40 mb-3" />
        <Skeleton variant="text" className="h-4 w-full mb-6" />
        
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <Skeleton variant="text" className="h-5 w-1/4" />
                <div className="flex space-x-2">
                  <Skeleton variant="rounded" className="h-6 w-16" />
                  <Skeleton variant="rounded" className="h-6 w-16" />
                </div>
              </div>
              <Skeleton variant="text" className="h-4 w-full mb-2" />
              <Skeleton variant="text" className="h-4 w-5/6 mb-4" />
              
              <div className="pt-3">
                <Skeleton variant="text" className="h-4 w-32 mb-3" />
                {Array(3).fill(0).map((_, j) => (
                  <Skeleton key={j} variant="text" className="h-4 w-full mb-2" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}