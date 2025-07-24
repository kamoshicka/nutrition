'use client';

import Skeleton from '../Skeleton';

/**
 * SearchResultsSkeleton component for displaying loading state of search results
 * 
 * This component shows a placeholder layout of search results while content is loading.
 */
export default function SearchResultsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Search info */}
      <div className="mb-6">
        <Skeleton variant="text" className="h-6 w-64 mb-2" />
        <Skeleton variant="text" className="h-4 w-40" />
      </div>

      {/* Categories section */}
      <div className="bg-white shadow rounded-lg p-6">
        <Skeleton variant="text" className="h-6 w-40 mb-6" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <Skeleton variant="text" className="h-5 w-3/4 mb-2" />
              <Skeleton variant="text" className="h-4 w-full mb-1" />
              <Skeleton variant="text" className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>

      {/* Foods section */}
      <div className="bg-white shadow rounded-lg p-6">
        <Skeleton variant="text" className="h-6 w-40 mb-6" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <Skeleton variant="text" className="h-5 w-3/4 mb-2" />
              <Skeleton variant="text" className="h-4 w-full mb-1" />
              <Skeleton variant="text" className="h-4 w-5/6 mb-3" />
              <Skeleton variant="rounded" className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}