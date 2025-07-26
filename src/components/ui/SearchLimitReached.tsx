'use client';

import React from 'react';
import Link from 'next/link';

interface SearchLimitReachedProps {
  remainingSearches: number;
  resetDate?: string;
  className?: string;
}

export function SearchLimitReached({ 
  remainingSearches, 
  resetDate,
  className = '' 
}: SearchLimitReachedProps) {
  const formatResetDate = (dateString?: string) => {
    if (!dateString) return '来月1日';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '来月1日';
    }
  };

  return (
    <div className={`max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-red-800 mb-2">
        検索回数上限に達しました
      </h3>

      <p className="text-red-700 mb-4">
        今月の無料検索回数（50回）をすべて使い切りました。
        {formatResetDate(resetDate)}に検索回数がリセットされます。
      </p>

      <div className="space-y-3">
        <Link
          href="/pricing"
          className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          プレミアムプランで無制限検索
        </Link>

        <div className="text-sm text-gray-600">
          <p className="mb-2">プレミアムプランの特典：</p>
          <ul className="text-left space-y-1">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              無制限検索
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              お気に入り機能
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              栄養計算機能
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              PDF保存機能
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              買い物リスト機能
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          月額300円で全ての機能をご利用いただけます
        </p>
      </div>
    </div>
  );
}

export default SearchLimitReached;