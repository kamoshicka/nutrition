'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Food, CookingMethod, HealthBenefit } from '@/types';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ApiErrorFallback from '@/components/ui/ApiErrorFallback';
import CookingMethodList from '@/components/ui/CookingMethodList';
import FoodDetailSkeleton from '@/components/ui/skeletons/FoodDetailSkeleton';
import RecipeList from '@/components/ui/RecipeList';
import AdSenseAd from '@/components/ui/AdSenseAd';
import { AffiliateProducts } from '@/components/ui/AffiliateProducts';

// Wrapper component with error boundary
export default function FoodDetailPageWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FoodDetailSkeleton />}>
        <FoodDetailPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function FoodDetailPage() {
  const params = useParams();
  const foodId = params.id as string;
  
  const [food, setFood] = useState<Food | null>(null);
  const [cookingMethods, setCookingMethods] = useState<CookingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wrap fetchFoodDetails in useCallback to prevent recreation on every render
  const fetchFoodDetails = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/foods/${foodId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || '食材データの取得に失敗しました');
        }
        
        const data = await response.json();
        setFood(data.food);
        setCookingMethods(data.cookingMethods || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        console.error('食材詳細の取得エラー:', err);
      } finally {
        setLoading(false);
      }
    }, [foodId]);
    
  useEffect(() => {
    if (foodId) {
      fetchFoodDetails();
    }
  }, [fetchFoodDetails, foodId]);

  // Helper function to render effectiveness badge
  const renderEffectivenessBadge = (effectiveness: HealthBenefit['effectiveness']) => {
    const badgeClasses = {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    const badgeLabels = {
      high: '高効果',
      medium: '中程度',
      low: '軽度',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[effectiveness]}`}>
        {badgeLabels[effectiveness]}
      </span>
    );
  };

  if (loading) {
    return <FoodDetailSkeleton />;
  }

  if (error) {
    return <ApiErrorFallback 
      error={new Error(error)} 
      retryAction={() => fetchFoodDetails()} 
    />;
  }

  if (!food) {
    // If we've finished loading but there's no food, redirect to 404
    if (!loading) {
      notFound();
    }
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header Ad */}
      <AdSenseAd 
        placement="header" 
        className="w-full"
        fallback={
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">広告スペース</p>
          </div>
        }
      />
      
      {/* 戻るリンク */}
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          トップページに戻る
        </Link>
      </div>

      {/* 食材ヘッダー */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{food.name}</h1>
        <p className="text-lg text-gray-700 mb-4">{food.description}</p>
      </div>

      {/* 栄養情報 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">栄養情報</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">カロリー</p>
            <p className="text-lg font-medium">{food.nutritionalInfo.calories} kcal</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">タンパク質</p>
            <p className="text-lg font-medium">{food.nutritionalInfo.protein}g</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">炭水化物</p>
            <p className="text-lg font-medium">{food.nutritionalInfo.carbohydrates}g</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">脂質</p>
            <p className="text-lg font-medium">{food.nutritionalInfo.fat}g</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">ビタミン</h3>
            <ul className="list-disc list-inside space-y-1">
              {food.nutritionalInfo.vitamins.map((vitamin, index) => (
                <li key={index} className="text-gray-700">{vitamin}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">ミネラル</h3>
            <ul className="list-disc list-inside space-y-1">
              {food.nutritionalInfo.minerals.map((mineral, index) => (
                <li key={index} className="text-gray-700">{mineral}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 健康効果 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">健康効果</h2>
        <div className="space-y-6">
          {food.healthBenefits.map((benefit, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">{benefit.condition}</h3>
                {renderEffectivenessBadge(benefit.effectiveness)}
              </div>
              <p className="text-gray-700 mb-3">{benefit.effect}</p>
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-1">科学的根拠</h4>
                <p className="text-sm text-gray-700">{benefit.scientificBasis}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 注意事項 */}
      {food.precautions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">注意事項</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <ul className="list-disc list-inside space-y-2">
              {food.precautions.map((precaution, index) => (
                <li key={index} className="text-gray-700">{precaution}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 調理法 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">推奨調理法</h2>
        {cookingMethods.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              効果的な調理法を選んで、栄養価を最大限に活かしましょう。
              並び替えボタンで、栄養保持率・難易度・調理時間で並び替えができます。
            </p>
            <CookingMethodList cookingMethods={cookingMethods} />
          </>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-500">この食材に対する調理法情報はありません</p>
          </div>
        )}
      </div>

      {/* Content Ad */}
      <AdSenseAd 
        placement="content" 
        className="w-full"
        fallback={
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600">コンテンツ広告</p>
          </div>
        }
      />

      {/* Affiliate Products */}
      <AffiliateProducts 
        foodName={food.name}
        foodCategory=""
        showDisclosure={true}
        className="bg-white shadow rounded-lg p-6"
      />

      {/* レシピ */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">おすすめレシピ</h2>
        <p className="text-sm text-gray-500 mb-6">
          楽天レシピから{food.name}を使ったおすすめレシピをご紹介します。
        </p>
        <RecipeList foodId={foodId} foodName={food.name} />
      </div>

      {/* Footer Ad */}
      <AdSenseAd 
        placement="footer" 
        className="w-full"
        fallback={
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">フッター広告スペース</p>
          </div>
        }
      />
    </div>
  );
}