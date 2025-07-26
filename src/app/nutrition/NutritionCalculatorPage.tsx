'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NutritionCalculator } from '../../components/ui/NutritionCalculator';
import { SelectedFood } from '../../lib/nutrition';

export function NutritionCalculatorPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (
    name: string,
    selectedFoods: SelectedFood[],
    ageGroup?: string,
    gender?: 'male' | 'female'
  ) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/nutrition/calculations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          selectedFoods,
          ageGroup,
          gender
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('プレミアムプランが必要です');
        }
        throw new Error('保存に失敗しました');
      }

      const result = await response.json();
      
      // Redirect to the saved calculation
      router.push(`/nutrition/calculations/${result.id}`);
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">栄養計算機</h1>
          <p className="text-gray-600">
            複数の食材を選択して、総合的な栄養価を計算し、推奨摂取量と比較できます。
          </p>
        </div>

        <NutritionCalculator onSave={handleSave} />
      </div>
    </div>
  );
}