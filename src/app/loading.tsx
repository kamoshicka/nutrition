'use client';

import CategoryCardSkeleton from '@/components/ui/skeletons/CategoryCardSkeleton';

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-4"></div>
        <div className="h-5 w-full max-w-2xl bg-gray-200 rounded animate-pulse mx-auto"></div>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse mb-6"></div>
        <CategoryCardSkeleton />
      </div>
    </div>
  );
}