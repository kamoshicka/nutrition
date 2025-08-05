#!/usr/bin/env node

/**
 * 楽天API統合テストスクリプト
 * Phase 2デプロイ後の動作確認用
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.argv[2] || 'https://cookcare-lilac.vercel.app';
const IS_LOCAL = BASE_URL.includes('localhost');

console.log(`🧪 楽天API統合テスト開始`);
console.log(`📍 テスト対象: ${BASE_URL}`);
console.log(`⏰ 開始時刻: ${new Date().toISOString()}\n`);

// HTTPリクエスト関数
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// テスト関数
async function runTests() {
  const tests = [
    {
      name: '🏥 ヘルスチェック',
      url: `${BASE_URL}/api/debug/rakuten-health`,
      validator: (response) => {
        if (response.statusCode !== 200) {
          return `❌ ステータスコード: ${response.statusCode}`;
        }
        
        const health = response.data.health?.current;
        if (!health) {
          return '❌ ヘルス情報が見つかりません';
        }
        
        const config = response.data.configuration;
        if (!config) {
          return '❌ 設定情報が見つかりません';
        }
        
        // API統合状況をチェック
        if (config.useMockData) {
          return '⚠️  モックデータモード（Phase 1状態）';
        }
        
        if (!config.apiKeyConfigured) {
          return '❌ APIキーが設定されていません';
        }
        
        if (!health.isHealthy) {
          return `❌ API不健全: ${health.error || '不明なエラー'}`;
        }
        
        return `✅ 正常 (応答時間: ${health.responseTime}ms, エンドポイント: ${health.endpoint})`;
      }
    },
    
    {
      name: '📂 レシピカテゴリ取得',
      url: `${BASE_URL}/api/recipes/categories`,
      validator: (response) => {
        if (response.statusCode !== 200) {
          return `❌ ステータスコード: ${response.statusCode}`;
        }
        
        if (!Array.isArray(response.data)) {
          return '❌ カテゴリデータが配列ではありません';
        }
        
        if (response.data.length === 0) {
          return '❌ カテゴリが取得できませんでした';
        }
        
        const firstCategory = response.data[0];
        if (!firstCategory.categoryId || !firstCategory.categoryName) {
          return '❌ カテゴリデータの形式が不正です';
        }
        
        return `✅ ${response.data.length}個のカテゴリを取得`;
      }
    },
    
    {
      name: '🔍 レシピ検索（鶏肉）',
      url: `${BASE_URL}/api/recipes/search?q=鶏肉`,
      validator: (response) => {
        if (response.statusCode !== 200) {
          return `❌ ステータスコード: ${response.statusCode}`;
        }
        
        if (!response.data.recipes || !Array.isArray(response.data.recipes)) {
          return '❌ レシピデータが見つかりません';
        }
        
        if (response.data.recipes.length === 0) {
          return '❌ レシピが取得できませんでした';
        }
        
        const firstRecipe = response.data.recipes[0];
        if (!firstRecipe.recipeTitle || !firstRecipe.recipeUrl) {
          return '❌ レシピデータの形式が不正です';
        }
        
        return `✅ ${response.data.recipes.length}件のレシピを取得`;
      }
    },
    
    {
      name: '🔍 レシピ検索（野菜）',
      url: `${BASE_URL}/api/recipes/search?q=野菜`,
      validator: (response) => {
        if (response.statusCode !== 200) {
          return `❌ ステータスコード: ${response.statusCode}`;
        }
        
        if (!response.data.recipes || !Array.isArray(response.data.recipes)) {
          return '❌ レシピデータが見つかりません';
        }
        
        return `✅ ${response.data.recipes.length}件のレシピを取得`;
      }
    }
  ];
  
  console.log('📋 テスト実行中...\n');
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`⏳ ${test.name}をテスト中...`);
      const response = await makeRequest(test.url);
      const result = test.validator(response);
      
      console.log(`   ${result}`);
      console.log(`   📊 応答時間: ${response.responseTime}ms`);
      
      if (result.startsWith('✅')) {
        passedTests++;
      }
      
      // レート制限を考慮して1秒待機
      if (tests.indexOf(test) < tests.length - 1) {
        console.log('   ⏱️  レート制限のため1秒待機...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.log(`   ❌ エラー: ${error.message}`);
    }
  }
  
  console.log('\n📊 テスト結果サマリー');
  console.log(`✅ 成功: ${passedTests}/${totalTests}`);
  console.log(`❌ 失敗: ${totalTests - passedTests}/${totalTests}`);
  console.log(`⏰ 完了時刻: ${new Date().toISOString()}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 すべてのテストが成功しました！Phase 2統合完了です。');
  } else if (passedTests > 0) {
    console.log('\n⚠️  一部のテストが失敗しました。設定を確認してください。');
  } else {
    console.log('\n🚨 すべてのテストが失敗しました。Phase 1状態の可能性があります。');
  }
}

// テスト実行
runTests().catch(console.error);