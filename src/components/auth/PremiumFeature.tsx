'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface PremiumFeatureProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  featureName?: string;
}

/**
 * PremiumFeature component for conditionally rendering premium content
 * 
 * @param children - Content to show for premium users
 * @param fallback - Content to show for non-premium users (optional)
 * @param showUpgradePrompt - Whether to show upgrade prompt for non-premium users
 * @param featureName - Name of the feature for the upgrade prompt
 */
export default function PremiumFeature({
  children,
  fallback,
  showUpgradePrompt = true,
  featureName = 'この機能'
}: PremiumFeatureProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const isPremium = session?.user.subscription?.status === 'premium';

  if (isPremium) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt if enabled
  if (showUpgradePrompt) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              プレミアム機能
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {featureName}はプレミアムプランでご利用いただけます。
            </p>
            <div className="mt-4 flex space-x-3">
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                プレミアムにアップグレード
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                詳細を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}