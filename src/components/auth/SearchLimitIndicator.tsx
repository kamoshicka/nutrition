'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SearchLimitIndicatorProps {
  className?: string;
  showOnlyWhenLimited?: boolean;
}

/**
 * SearchLimitIndicator component - now shows premium upgrade benefits since search is unlimited for all
 * 
 * @param className - Additional CSS classes
 * @param showOnlyWhenLimited - Only show for non-premium users to promote upgrade
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

  // Since search is now unlimited for all users, this component now promotes premium features
  if (showOnlyWhenLimited) {
    return null; // Don't show since there are no search limits
  }

  return (
    <div className={`${className}`}>
      <div className="rounded-lg p-3 bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                検索は無制限でご利用いただけます
              </p>
              <p className="text-xs text-blue-600">
                プレミアムプランでさらに便利な機能をお楽しみください
              </p>
            </div>
          </div>
          
          <Link
            href="/pricing"
            className="text-xs font-medium px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            プレミアム機能を見る
          </Link>
        </div>
        
        <div className="mt-3 text-xs text-blue-600">
          プレミアムプラン（月額300円）: お気に入り、栄養計算、PDF保存、買い物リスト、広告非表示
        </div>
      </div>
    </div>
  );
}