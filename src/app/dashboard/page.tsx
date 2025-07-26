import React from 'react';
import { Metadata } from 'next';
import { PremiumDashboard } from '../../components/ui/PremiumDashboard';

export const metadata: Metadata = {
  title: 'ダッシュボード | ヘルスケア食材アプリ',
  description: 'プレミアム機能の統合ダッシュボード。お気に入り、買い物リスト、栄養計算などの機能を一元管理できます。',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PremiumDashboard />
      </div>
    </div>
  );
}