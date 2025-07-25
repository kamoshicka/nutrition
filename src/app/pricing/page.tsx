'use client';

import { useAuth } from '@/hooks/useAuth';
import PricingCard from '@/components/subscription/PricingCard';
import Link from 'next/link';

export default function PricingPage() {
  const { user, isLoading } = useAuth();

  const freeFeatures = [
    '月30回まで検索',
    '基本的な食材情報',
    '楽天レシピ検索',
    '広告表示あり',
  ];

  const premiumFeatures = [
    '無制限検索',
    'お気に入り機能（無制限）',
    '栄養計算機能',
    'PDF保存機能',
    '買い物リスト機能',
    '広告非表示',
    '7日間無料トライアル',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isPremium = user?.subscription?.status === 'premium';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            料金プラン
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            あなたに最適なプランを選択して、より充実した健康管理を始めましょう
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <PricingCard
            plan="free"
            features={freeFeatures}
            isCurrentPlan={!isPremium}
          />
          
          <PricingCard
            plan="premium"
            features={premiumFeatures}
            price={980}
            isCurrentPlan={isPremium}
          />
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              よくある質問
            </h3>
            
            <div className="space-y-4 text-left">
              <div>
                <h4 className="font-medium text-gray-900">無料トライアルはありますか？</h4>
                <p className="text-gray-600 text-sm mt-1">
                  はい、プレミアムプランには7日間の無料トライアルが付いています。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">いつでもキャンセルできますか？</h4>
                <p className="text-gray-600 text-sm mt-1">
                  はい、いつでもキャンセル可能です。次回更新日まで機能をご利用いただけます。
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">支払い方法は？</h4>
                <p className="text-gray-600 text-sm mt-1">
                  クレジットカード（Visa、Mastercard、JCB、American Express）に対応しています。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}