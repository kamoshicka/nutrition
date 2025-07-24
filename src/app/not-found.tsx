'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  // Log the 404 error for analytics purposes
  useEffect(() => {
    console.error('404 error: Page not found');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-24 h-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">ページが見つかりません</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        お探しのページは存在しないか、移動または削除された可能性があります。
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
      >
        ホームに戻る
      </Link>
    </div>
  );
}