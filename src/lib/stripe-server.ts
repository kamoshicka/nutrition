import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
  priceId: process.env.STRIPE_PRICE_ID || 'price_placeholder',
};

// Stripe product configuration
export const PREMIUM_PLAN = {
  name: 'プレミアムプラン',
  description: 'お気に入り、栄養計算、PDF保存、買い物リスト機能',
  price: 300, // 300円/月
  currency: 'jpy',
  interval: 'month' as const,
  trialPeriodDays: 7,
};

export const validateStripeConfig = () => {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`);
  }
};