import React from 'react';
import { Metadata } from 'next';
import { ShoppingList } from '../../components/ui/ShoppingList';

export const metadata: Metadata = {
  title: '買い物リスト | ヘルスケア食材アプリ',
  description: 'レシピの材料や食材を買い物リストに追加して、効率的にお買い物ができます。プレミアムプラン限定機能です。',
};

export default function ShoppingListPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ShoppingList />
      </div>
    </div>
  );
}