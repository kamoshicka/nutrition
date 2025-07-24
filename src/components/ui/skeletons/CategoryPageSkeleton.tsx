'use client';

import Skeleton from '../Skeleton';

/**
 * CategoryPageSkeleton component for displaying loading state of category page
 * 
 * This component shows a placeholder layout of the category page while content is loading.
 */
export default function CategoryPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Skeleton variant="text" className="h-4 w-32" />
      </div>

      {/* Category header */}
      <div className="text-center mb-8">
        <Skeleton variant="text" className="h-8 w-64 mx-auto mb-3" />
        <Skeleton variant="text" className="h-5 w-full max-w-2xl mx-auto mb-1" />
        <Skeleton variant="text" className="h-5 w-5/6 max-w-xl mx-auto" />
      </div>
      
      <div className="max-w-4xl mx-auto">
        {/* Info box */}
        <div className="rounded-lg p-4 mb-6">
          <Skeleton variant="text" className="h-5 w-40 mb-2" />
          <Skeleton variant="text" className="h-4 w-full mb-1" />
          <Skeleton variant="text" className="h-4 w-5/6" />
        </div>
        
        {/* Search bar */}
        <Skeleton variant="rounded" className="h-10 w-full mb-6" />
        
        {/* Foods grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
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
      </div>
    </div>
  );
}