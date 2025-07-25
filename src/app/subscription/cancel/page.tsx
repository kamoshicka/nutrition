'use client';

import Link from 'next/link';

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
        <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          決済がキャンセルされました
        </h1>
        <p className="text-gray-600 mb-6">
          プレミアムプランの登録がキャンセルされました。いつでも再度お申し込みいただけます。
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">プレミアム機能</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 無制限検索</li>
            <li>• お気に入り機能</li>
            <li>• 栄養計算機能</li>
            <li>• PDF保存機能</li>
            <li>• 買い物リスト機能</li>
            <li>• 広告非表示</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            7日間無料トライアル付き
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            プランを見る
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}