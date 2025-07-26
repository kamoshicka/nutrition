'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface SearchUsageIndicatorProps {
  remainingSearches: number;
  isPremium: boolean;
  warning?: string;
  className?: string;
}

export function SearchUsageIndicator({ 
  remainingSearches, 
  isPremium, 
  warning,
  className = '' 
}: SearchUsageIndicatorProps) {
  const { data: session } = useSession();

  // Don't show for unauthenticated users
  if (!session) {
    return null;
  }

  // Don't show for premium users unless there's a warning
  if (isPremium && !warning) {
    return null;
  }

  const getStatusColor = () => {
    if (isPremium) return 'text-green-600';
    if (remainingSearches === 0) return 'text-red-600';
    if (remainingSearches <= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getBackgroundColor = () => {
    if (isPremium) return 'bg-green-50 border-green-200';
    if (remainingSearches === 0) return 'bg-red-50 border-red-200';
    if (remainingSearches <= 5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className={`rounded-lg border p-3 ${getBackgroundColor()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {isPremium ? (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              プレミアムプラン - 無制限検索
            </span>
          ) : remainingSearches === 0 ? (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              検索回数上限に達しました
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              残り{remainingSearches}回の検索が可能
            </span>
          )}
        </div>

        {!isPremium && (
          <Link
            href="/pricing"
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            アップグレード
          </Link>
        )}
      </div>

      {warning && (
        <p className={`mt-2 text-xs ${getStatusColor()}`}>
          {warning}
        </p>
      )}

      {remainingSearches === 0 && (
        <div className="mt-2 text-xs text-gray-600">
          <p>来月1日に検索回数がリセットされます。</p>
          <p className="mt-1">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-800 underline">
              プレミアムプラン
            </Link>
            で無制限検索をご利用ください。
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchUsageIndicator;