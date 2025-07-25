'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import SearchLimitIndicator from '@/components/auth/SearchLimitIndicator';

function DashboardContent() {
  const { user, subscription, search } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">
          こんにちは、{user.name || 'ユーザー'}さん
        </p>
      </div>

      {/* Search Limit Indicator for Free Users */}
      {!subscription.isPremium && (
        <div className="mb-6">
          <SearchLimitIndicator />
        </div>
      )}

      {/* Account Status */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">アカウント情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">プラン</h3>
            <div className="flex items-center mt-1">
              <p className="text-lg font-semibold text-gray-900">
                {subscription.isPremium ? 'プレミアム' : 
                 subscription.isCancelled ? '期限切れ' : '無料'}
              </p>
              {subscription.isPremium && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                  Premium
                </span>
              )}
              {subscription.isCancelled && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                  期限切れ
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">今月の検索回数</h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {subscription.isPremium ? '無制限' : `${search.count}/${search.limit}`}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">残り検索回数</h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {subscription.isPremium ? '無制限' : search.remaining}
            </p>
          </div>
        </div>
        
        {/* Subscription Details for Premium Users */}
        {subscription.isPremium && subscription.currentPeriodEnd && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-800">
                プレミアムプランは {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')} まで有効です
                {subscription.cancelAtPeriodEnd && ' (キャンセル予定)'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Premium Features */}
      {subscription.isPremium ? (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">プレミアム機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/premium/favorites"
              className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg transition-colors group"
            >
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="font-medium text-indigo-900">お気に入り</h3>
              </div>
              <p className="text-sm text-indigo-700">
                食材やレシピを無制限で保存
              </p>
            </Link>
            <Link
              href="/premium/nutrition-calculator"
              className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors group"
            >
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="font-medium text-green-900">栄養計算機</h3>
              </div>
              <p className="text-sm text-green-700">
                複数食材の栄養価を簡単計算
              </p>
            </Link>
            <Link
              href="/premium/shopping-list"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors group"
            >
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="font-medium text-blue-900">買い物リスト</h3>
              </div>
              <p className="text-sm text-blue-700">
                必要な食材を効率的に管理
              </p>
            </Link>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-medium text-purple-900">PDF保存</h3>
              </div>
              <p className="text-sm text-purple-700">
                レシピをPDF形式で保存
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <div className="flex items-center mb-4">
            <svg className="h-8 w-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-xl font-semibold">プレミアムプランにアップグレード</h2>
          </div>
          <p className="mb-4">
            お気に入り機能、栄養計算機、買い物リスト、PDF保存機能など、すべての機能を無制限でご利用いただけます。
          </p>
          <div className="flex space-x-3">
            <Link
              href="/pricing"
              className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              プレミアムプランを見る
            </Link>
            <Link
              href="/pricing"
              className="border border-white text-white px-4 py-2 rounded-md font-medium hover:bg-white hover:text-indigo-600 transition-colors"
            >
              7日間無料トライアル
            </Link>
          </div>
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

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardContent />
    </AuthGuard>
  );
}