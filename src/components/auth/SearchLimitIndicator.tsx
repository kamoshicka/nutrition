'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SearchLimitIndicatorProps {
  className?: string;
  showOnlyWhenLimited?: boolean;
}

/**
 * SearchLimitIndicator component for showing search usage to free users
 * 
 * @param className - Additional CSS classes
 * @param showOnlyWhenLimited - Only show when user is approaching or at limit
 */
export default function SearchLimitIndicator({ 
  className = '',
  showOnlyWhenLimited = false 
}: SearchLimitIndicatorProps) {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session) {
    return null;
  }

  const isPremium = session.user.subscription?.status === 'premium';
  
  // Don't show for premium users
  if (isPremium) {
    return null;
  }

  const searchCount = session.user.searchCount || 0;
  const searchLimit = 30;
  const remainingSearches = Math.max(0, searchLimit - searchCount);
  const usagePercentage = (searchCount / searchLimit) * 100;
  
  // Show warning when 80% of searches are used
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = remainingSearches === 0;

  // Only show when limited if requested
  if (showOnlyWhenLimited && !isNearLimit) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className={`rounded-lg p-3 ${
        isAtLimit ? 'bg-red-50 border border-red-200' :
        isNearLimit ? 'bg-yellow-50 border border-yellow-200' :
        'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${
              isAtLimit ? 'text-red-600' :
              isNearLimit ? 'text-yellow-600' :
              'text-blue-600'
            }`}>
              {isAtLimit ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                isAtLimit ? 'text-red-800' :
                isNearLimit ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {isAtLimit ? '検索制限に達しました' : `検索残り ${remainingSearches}回`}
              </p>
              <p className={`text-xs ${
                isAtLimit ? 'text-red-600' :
                isNearLimit ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                月間検索制限: {searchCount}/{searchLimit}回
              </p>
            </div>
          </div>
          
          {(isNearLimit || isAtLimit) && (
            <Link
              href="/pricing"
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                isAtLimit 
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              アップグレード
            </Link>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-red-500' :
                isNearLimit ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
        
        {isAtLimit && (
          <div className="mt-3 text-xs text-red-600">
            プレミアムプランにアップグレードして無制限検索をお楽しみください。
          </div>
        )}
      </div>
    </div>
  );
}