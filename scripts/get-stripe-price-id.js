#!/usr/bin/env node

/**
 * Stripe Price ID取得スクリプト
 * 既存のプロダクトから価格IDを取得するか、新しい価格を作成します
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// .env.localファイルを手動で読み込み
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

async function getOrCreatePriceId() {
  try {
    console.log('🔍 Stripeから価格情報を取得中...');
    
    // 既存の価格を取得
    const prices = await stripe.prices.list({
      limit: 100,
      active: true,
    });
    
    console.log(`📋 ${prices.data.length}個の価格が見つかりました`);
    
    // プレミアムプラン用の価格を探す
    const premiumPrice = prices.data.find(price => 
      price.unit_amount === 300 && // 300円 (JPYは最小単位が円)
      price.currency === 'jpy' &&
      price.recurring?.interval === 'month'
    );
    
    if (premiumPrice) {
      console.log('✅ 既存のプレミアムプラン価格が見つかりました:');
      console.log(`   Price ID: ${premiumPrice.id}`);
      console.log(`   金額: ¥${premiumPrice.unit_amount}/月`);
      console.log(`   プロダクト: ${premiumPrice.product}`);
      
      console.log('\n📝 .env.localファイルを以下のように更新してください:');
      console.log(`STRIPE_PRICE_ID=${premiumPrice.id}`);
      
      return premiumPrice.id;
    }
    
    // 既存の価格がない場合、プロダクトから新しい価格を作成
    console.log('⚠️  既存のプレミアムプラン価格が見つかりませんでした');
    
    const productId = envVars.STRIPE_PRICE_ID; // これは実際にはプロダクトID
    
    if (productId && productId.startsWith('prod_')) {
      console.log(`🔧 プロダクト ${productId} に新しい価格を作成します...`);
      
      const newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: 300, // 300円 (JPYは最小単位が円)
        currency: 'jpy',
        recurring: {
          interval: 'month',
        },
        nickname: 'プレミアムプラン月額',
      });
      
      console.log('✅ 新しい価格が作成されました:');
      console.log(`   Price ID: ${newPrice.id}`);
      console.log(`   金額: ¥${newPrice.unit_amount}/月`);
      
      console.log('\n📝 .env.localファイルを以下のように更新してください:');
      console.log(`STRIPE_PRICE_ID=${newPrice.id}`);
      
      return newPrice.id;
    }
    
    console.log('❌ プロダクトIDが正しく設定されていません');
    console.log('Stripeダッシュボードで確認してください: https://dashboard.stripe.com/products');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔑 Stripe APIキーを確認してください');
    }
  }
}

// 全ての価格を表示する関数
async function listAllPrices() {
  try {
    const prices = await stripe.prices.list({
      limit: 100,
      active: true,
    });
    
    console.log('\n📋 利用可能な価格一覧:');
    console.log('=' .repeat(60));
    
    for (const price of prices.data) {
      console.log(`ID: ${price.id}`);
      console.log(`金額: ${price.unit_amount ? `¥${price.unit_amount}` : '無料'}`);
      console.log(`通貨: ${price.currency.toUpperCase()}`);
      console.log(`間隔: ${price.recurring ? price.recurring.interval : '一回払い'}`);
      console.log(`プロダクト: ${price.product}`);
      console.log('-'.repeat(40));
    }
  } catch (error) {
    console.error('価格一覧の取得に失敗:', error.message);
  }
}

// メイン実行
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    await listAllPrices();
  } else {
    await getOrCreatePriceId();
  }
}

main();