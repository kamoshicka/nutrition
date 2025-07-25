'use client';

import { useState } from 'react';
import { redirectToCheckout } from '@/lib/stripe';

interface PricingCardProps {
  plan: 'free' | 'premium';
  features: string[];
  price?: number;
  onSubscribe?: () => void;
  isCurrentPlan?: boolean;
}

export default function PricingCard({ 
  plan, 
  features, 
  price, 
  onSubscribe,
  isCurrentPlan = false 
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (plan === 'free' || isCurrentPlan) return;
    
    setIsLoading(true);
    
    try {
      if (onSubscribe) {
        onSubscribe();
        return;
      }

      // Create checkout session
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionId);
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('決済処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = plan === 'premium';
  const cardClasses = isPremium 
    ? 'border-2 border-blue-500 bg-blue-50' 
    : 'border border-gray-200 bg-white';

  return (
    <div className={`rounded-lg p-6 ${cardClasses} relative`}>
      {isPremium && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            おすすめ
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {plan === 'free' ? '無料プラン' : 'プレミアムプラン'}
        </h3>
        
        <div className="mb-4">
          {price !== undefined ? (
            <div>
              <span className="text-3xl font-bold text-gray-900">¥{price}</span>
              <span className="text-gray-600">/月</span>
              {isPremium && (
                <div className="text-sm text-blue-600 mt-1">
                  7日間無料トライアル
                </div>
              )}
            </div>
          ) : (
            <span className="text-3xl font-bold text-gray-900">無料</span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg 
              className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={isLoading || plan === 'free' || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : plan === 'free'
            ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
            : isLoading
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            処理中...
          </div>
        ) : isCurrentPlan ? (
          '現在のプラン'
        ) : plan === 'free' ? (
          '現在のプラン'
        ) : (
          '今すぐ始める'
        )}
      </button>
    </div>
  );
}