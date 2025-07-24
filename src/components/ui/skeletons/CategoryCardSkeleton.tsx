'use client';

import Skeleton from '../Skeleton';

interface CategoryCardSkeletonProps {
  count?: number;
}

/**
 * CategoryCardSkeleton component for displaying loading state of category cards
 * 
 * This component shows a placeholder grid of category cards while content is loading.
 */
export default function CategoryCardSkeleton({ count = 6 }: CategoryCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <div className="space-y-3">
              <Skeleton variant="text" className="h-6 w-3/4" />
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-5/6" />
            </div>
          </div>
        ))}
    </div>
  );
}