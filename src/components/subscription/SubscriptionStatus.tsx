'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionData {
  subscription: {
    status: 'free' | 'premium' | 'cancelled';
    cancelAtPeriodEnd: boolean;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    stripeSubscriptionId?: string;
  };
  stripe?: {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
  };
  isPremium: boolean;
  isCancelled: boolean;
  isFree: boolean;
}

export default function SubscriptionStatus() {
  const { user, refreshUser } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/subscription/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError('サブスクリプション情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('サブスクリプションをキャンセルしますか？現在の期間終了まで機能をご利用いただけます。')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await fetchSubscriptionStatus();
      await refreshUser();
      alert('サブスクリプションがキャンセルされました。現在の期間終了まで機能をご利用いただけます。');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      alert('キャンセル処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/subscription/resume', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      await fetchSubscriptionStatus();
      await refreshUser();
      alert('サブスクリプションが再開されました。');
    } catch (err) {
      console.error('Error resuming subscription:', err);
      alert('再開処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncStatus = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/subscription/status', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync subscription status');
      }

      await fetchSubscriptionStatus();
      await refreshUser();
      alert('サブスクリプション状態を同期しました。');
    } catch (err) {
      console.error('Error syncing subscription status:', err);
      alert('同期処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">ログインが必要です</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchSubscriptionStatus}
          className="mt-2 text-blue-600 hover:text-blue-700"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const { subscription, stripe, isPremium, isCancelled, isFree } = subscriptionData;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">サブスクリプション管理</h2>
      
      {/* Current Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">現在のステータス</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">プラン:</span>
            <span className={`font-medium ${
              isPremium ? 'text-green-600' : 
              isCancelled ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {isPremium ? 'プレミアム' : isCancelled ? 'キャンセル済み' : '無料'}
            </span>
          </div>
          
          {subscription.currentPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                {subscription.cancelAtPeriodEnd ? '終了日:' : '次回更新日:'}
              </span>
              <span className="font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}
          
          {stripe?.trialEnd && new Date(stripe.trialEnd) > new Date() && (
            <div className="flex justify-between">
              <span className="text-gray-600">無料トライアル終了:</span>
              <span className="font-medium text-blue-600">
                {new Date(stripe.trialEnd).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {isPremium && !subscription.cancelAtPeriodEnd && (
          <button
            onClick={handleCancelSubscription}
            disabled={actionLoading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? '処理中...' : 'サブスクリプションをキャンセル'}
          </button>
        )}

        {isPremium && subscription.cancelAtPeriodEnd && (
          <button
            onClick={handleResumeSubscription}
            disabled={actionLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? '処理中...' : 'サブスクリプションを再開'}
          </button>
        )}

        {isFree && (
          <a
            href="/pricing"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-center"
          >
            プレミアムプランに登録
          </a>
        )}

        {subscription.stripeSubscriptionId && (
          <button
            onClick={handleSyncStatus}
            disabled={actionLoading}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? '処理中...' : 'ステータスを同期'}
          </button>
        )}
      </div>

      {/* Warning for cancelled subscriptions */}
      {subscription.cancelAtPeriodEnd && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ サブスクリプションは{new Date(subscription.currentPeriodEnd!).toLocaleDateString('ja-JP')}に終了予定です。
            それまでプレミアム機能をご利用いただけます。
          </p>
        </div>
      )}
    </div>
  );
}