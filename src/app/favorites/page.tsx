import React from 'react';
import { Metadata } from 'next';
import { FavoritesList } from '../../components/ui/FavoritesList';

export const metadata: Metadata = {
  title: 'お気に入り | ヘルスケア食材アプリ',
  description: 'お気に入りに追加した食材とレシピを管理できます。プレミアムプラン限定機能です。',
};

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FavoritesList />
      </div>
    </div>
  );
}