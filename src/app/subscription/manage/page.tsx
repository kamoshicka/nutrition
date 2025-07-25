import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import Link from 'next/link';

export default function ManageSubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            サブスクリプション管理
          </h1>
          <p className="text-lg text-gray-600">
            プレミアムプランの管理とキャンセル
          </p>
        </div>

        <SubscriptionStatus />

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}