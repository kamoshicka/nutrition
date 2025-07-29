'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';

interface PricingPlansProps {
  className?: string;
  showHeader?: boolean;
  highlightPremium?: boolean;
}

export function PricingPlans({ 
  className = '', 
  showHeader = true,
  highlightPremium = true 
}: PricingPlansProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current subscription status
  const currentPlan = session?.user?.subscription?.status || 'free';
  const isCurrentlyPremium = currentPlan === 'premium';

  const handleUpgrade = async () => {
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    if (isCurrentlyPremium) {
      router.push('/dashboard');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // 開発環境でのStripe設定不備
        if (errorData.developmentMode) {
          setError(
            `${errorData.message}\n\n開発環境では実際のStripeキーが必要です。\n.env.localファイルでSTRIPE_SECRET_KEYとSTRIPE_PRICE_IDを設定してください。`
          );
          return;
        }
        
        // Stripe認証エラー
        if (errorData.error === 'Stripe authentication failed') {
          setError('決済システムの設定に問題があります。管理者にお問い合わせください。');
          return;
        }
        
        // Stripe設定エラー
        if (errorData.error === 'Invalid Stripe configuration') {
          setError('決済システムの設定に問題があります。管理者にお問い合わせください。');
          return;
        }
        
        // その他のエラー
        setError(errorData.message || '決済ページの作成に失敗しました。もう一度お試しください。');
        return;
      }

      const { url } = await response.json();
      
      if (!url) {
        setError('決済ページのURLが取得できませんでした。もう一度お試しください。');
        return;
      }
      
      // 決済ページにリダイレクト
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。');
      } else {
        const errorMessage = error instanceof Error ? error.message : '決済ページの作成に失敗しました。もう一度お試しください。';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      name: '検索機能',
      free: '月50回まで',
      premium: '無制限',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      name: 'お気に入り機能',
      free: '利用不可',
      premium: '無制限保存',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      name: '栄養計算機能',
      free: '利用不可',
      premium: '詳細分析・比較',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'PDF保存機能',
      free: '利用不可',
      premium: '無制限保存',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: '買い物リスト',
      free: '利用不可',
      premium: '無制限作成',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      name: '広告表示',
      free: 'あり',
      premium: 'なし',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    },
    {
      name: 'サポート',
      free: 'コミュニティ',
      premium: '優先サポート',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={className}>
      {/* Header */}
      {showHeader && (
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            シンプルな料金プラン
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            基本機能は無料でご利用いただけます。プレミアムプランで、さらに便利な機能をお楽しみください。
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
        {/* Free Plan */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 relative">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">無料プラン</h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ¥0
              <span className="text-lg font-normal text-gray-600">/月</span>
            </div>
            <p className="text-gray-600">基本機能をお試しください</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">月50回まで検索</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">基本的な食材情報</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">レシピ検索</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">コミュニティサポート</span>
            </li>
          </ul>

          <button
            disabled={currentPlan === 'free'}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
              currentPlan === 'free'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {currentPlan === 'free' ? '現在のプラン' : '無料で始める'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className={`bg-white rounded-2xl p-8 relative ${
          highlightPremium 
            ? 'border-2 border-blue-500 shadow-xl' 
            : 'border-2 border-gray-200'
        }`}>
          {highlightPremium && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                おすすめ
              </span>
            </div>
          )}

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">プレミアムプラン</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              ¥300
              <span className="text-lg font-normal text-gray-600">/月</span>
            </div>
            <p className="text-gray-600">すべての機能をフル活用</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">無制限検索</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">お気に入り機能</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">栄養計算機能</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">PDF保存機能</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">買い物リスト機能</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">広告なし</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">優先サポート</span>
            </li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
              isCurrentlyPremium
                ? 'bg-green-100 text-green-800 cursor-default'
                : isLoading
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                処理中...
              </div>
            ) : isCurrentlyPremium ? (
              '現在のプラン'
            ) : status !== 'authenticated' ? (
              'ログインして始める'
            ) : (
              '7日間無料トライアルを始める'
            )}
          </button>

          {!isCurrentlyPremium && (
            <p className="text-center text-sm text-gray-500 mt-3">
              7日間無料 • いつでもキャンセル可能
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-red-700 text-sm">
              {error.split('\n').map((line, index) => (
                <p key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          機能比較表
        </h2>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">機能</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">無料プラン</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">プレミアムプラン</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-gray-400 mr-3">
                          {feature.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {feature.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm ${
                        feature.free === '利用不可' || feature.free === 'あり' 
                          ? 'text-gray-500' 
                          : 'text-gray-900'
                      }`}>
                        {feature.free}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-blue-600">
                        {feature.premium}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          よくある質問
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              無料トライアルはありますか？
            </h3>
            <p className="text-gray-600">
              はい、プレミアムプランは7日間無料でお試しいただけます。トライアル期間中はいつでもキャンセル可能です。
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              いつでもキャンセルできますか？
            </h3>
            <p className="text-gray-600">
              はい、いつでもキャンセル可能です。キャンセル後も現在の請求期間の終了まではプレミアム機能をご利用いただけます。
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              支払い方法は何が利用できますか？
            </h3>
            <p className="text-gray-600">
              クレジットカード（Visa、Mastercard、American Express、JCB）でのお支払いが可能です。Stripeの安全な決済システムを使用しています。
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              データはどのように保護されますか？
            </h3>
            <p className="text-gray-600">
              お客様のデータは暗号化され、安全に保護されています。プライバシーポリシーに従って適切に管理いたします。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      {!isCurrentlyPremium && (
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            今すぐプレミアムプランを始めませんか？
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            7日間の無料トライアルで、すべてのプレミアム機能をお試しください。健康的な食生活をもっと便利にサポートします。
          </p>
          
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                処理中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {status !== 'authenticated' ? 'ログインして始める' : '7日間無料トライアルを始める'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default PricingPlans;