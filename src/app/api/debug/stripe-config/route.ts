/**
 * Stripe設定のデバッグ用エンドポイント
 * 開発環境でのみ利用可能
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  const stripeConfig = {
    hasSecretKey:
      !!process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("placeholder"),
    hasPublishableKey:
      !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes("placeholder"),
    hasWebhookSecret:
      !!process.env.STRIPE_WEBHOOK_SECRET &&
      !process.env.STRIPE_WEBHOOK_SECRET.includes("placeholder"),
    hasPriceId:
      !!process.env.STRIPE_PRICE_ID &&
      !process.env.STRIPE_PRICE_ID.includes("placeholder"),
    secretKeyPrefix:
      process.env.STRIPE_SECRET_KEY?.substring(0, 8) || "not set",
    publishableKeyPrefix:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8) ||
      "not set",
    priceIdPrefix: process.env.STRIPE_PRICE_ID?.substring(0, 8) || "not set",
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json({
    message: "Stripe configuration debug info",
    config: stripeConfig,
    recommendations: {
      needsSecretKey: !stripeConfig.hasSecretKey,
      needsPublishableKey: !stripeConfig.hasPublishableKey,
      needsWebhookSecret: !stripeConfig.hasWebhookSecret,
      needsPriceId: !stripeConfig.hasPriceId,
    },
  });
}
