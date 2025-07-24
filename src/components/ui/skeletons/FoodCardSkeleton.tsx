'use client';

import Skeleton from '../Skeleton';

interface FoodCardSkeletonProps {
  count?: number;
}

/**
 * FoodCardSkeleton component for displaying loading state of food cards
 * 
 * This component shows a placeholder grid of food cards while content is loading.
 */
export default function FoodCardSkeleton({ count = 8 }: FoodCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
          >
            <div className="space-y-3">
              <Skeleton variant="text" className="h-5 w-3/4" />
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-5/6" />
              <div className="pt-2">
                <Skeleton variant="rounded" className="h-6 w-1/3" />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}