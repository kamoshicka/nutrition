'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isPremium = session.user.subscription.status === 'premium';
  const remainingSearches = isPremium ? '無制限' : Math.max(0, 30 - session.user.searchCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">
          こんにちは、{session.user.name || 'ユーザー'}さん
        </p>
      </div>

      {/* Account Status */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">アカウント情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">プラン</h3>
            <div className="flex items-center mt-1">
              <p className="text-lg font-semibold text-gray-900">
                {isPremium ? 'プレミアム' : '無料'}
              </p>
              {isPremium && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  Premium
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">今月の検索回数</h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {isPremium ? '無制限' : `${session.user.searchCount}/30`}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">残り検索回数</h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {remainingSearches}
            </p>
          </div>
        </div>
      </div>

      {/* Premium Features */}
      {isPremium ? (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">プレミアム機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/premium/favorites"
              className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-medium text-indigo-900">お気に入り</h3>
              <p className="text-sm text-indigo-700 mt-1">
                食材やレシピを保存
              </p>
            </Link>
            <Link
              href="/premium/nutrition-calculator"
              className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-medium text-green-900">栄養計算機</h3>
              <p className="text-sm text-green-700 mt-1">
                栄養価を簡単計算
              </p>
            </Link>
            <Link
              href="/premium/shopping-list"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-medium text-blue-900">買い物リスト</h3>
              <p className="text-sm text-blue-700 mt-1">
                必要な食材を管理
              </p>
            </Link>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">PDF保存</h3>
              <p className="text-sm text-purple-700 mt-1">
                レシピをPDFで保存
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <h2 className="text-xl font-semibold mb-2">プレミアムプランにアップグレード</h2>
          <p className="mb-4">
            お気に入り機能、栄養計算機、買い物リスト、PDF保存機能など、すべての機能を無制限でご利用いただけます。
          </p>
          <Link
            href="/pricing"
            className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            プレミアムプランを見る
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/search"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">食材を検索</h3>
              <p className="text-sm text-gray-500">症状や病気に効果的な食材を探す</p>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">カテゴリを見る</h3>
              <p className="text-sm text-gray-500">食材カテゴリから探す</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}