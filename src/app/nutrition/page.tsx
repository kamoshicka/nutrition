import React from 'react';
import { Metadata } from 'next';
import { NutritionCalculatorPage } from './NutritionCalculatorPage';

export const metadata: Metadata = {
  title: '栄養計算機 | ヘルスケア食材アプリ',
  description: '複数の食材から栄養価を計算し、推奨摂取量と比較できます。プレミアムプラン限定機能です。',
};

export default function NutritionPage() {
  return <NutritionCalculatorPage />;
}