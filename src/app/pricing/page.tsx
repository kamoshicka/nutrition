import React from 'react';
import { Metadata } from 'next';
import { PricingPlans } from '../../components/ui/PricingPlans';

export const metadata: Metadata = {
  title: '料金プラン | クックケア',
  description: 'シンプルな料金プラン。基本機能は無料、プレミアムプランで全機能をご利用いただけます。7日間無料トライアル実施中。',
  keywords: '料金, プラン, プレミアム, 無料, トライアル, 栄養計算, お気に入り, PDF保存',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PricingPlans 
          showHeader={true}
          highlightPremium={true}
        />
      </div>
    </div>
  );
}