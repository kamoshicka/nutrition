# Phase 2 実装ガイド

## 🎯 楽天API統合の実装手順

### 1. 楽天Application ID取得後の設定

#### Vercel環境変数更新
1. Vercel Dashboard → cookcare プロジェクト → Settings → Environment Variables
2. 以下の変数を**すべての環境**（Production, Preview, Development）に追加/更新：

```bash
# 楽天API設定
RAKUTEN_APPLICATION_ID=your_20_digit_application_id_here
USE_MOCK_RECIPES=false

# 既存の設定はそのまま維持
NEXTAUTH_SECRET=1jWKPBDgNgqQy0vIYMUd5l8l+SrJKnhdlJPFOq6DZgk=
NEXTAUTH_URL=https://cookcare-lilac.vercel.app
DATABASE_URL=./data/production.db
NODE_ENV=production
BCRYPT_ROUNDS=12
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-test
```

#### ローカル開発環境更新
`.env.local` ファイルに追加：
```bash
# 楽天API設定（実際のAPIキーに置き換え）
RAKUTEN_APPLICATION_ID=your_20_digit_application_id_here
USE_MOCK_RECIPES=false
```

### 2. API動作テスト手順

#### Step 1: ヘルスチェック
```bash
# 本番環境
curl https://cookcare-lilac.vercel.app/api/debug/rakuten-health

# ローカル環境
curl http://localhost:3000/api/debug/rakuten-health
```

**期待される結果:**
```json
{
  "health": {
    "current": {
      "isHealthy": true,
      "responseTime": 500,
      "endpoint": "real_api"
    }
  },
  "configuration": {
    "apiKeyConfigured": true,
    "apiKeyValid": true,
    "useMockData": false
  }
}
```

#### Step 2: レシピカテゴリ取得テスト
```bash
curl https://cookcare-lilac.vercel.app/api/recipes/categories
```

#### Step 3: レシピ検索テスト
```bash
curl "https://cookcare-lilac.vercel.app/api/recipes/search?q=鶏肉"
```

### 3. 機能確認チェックリスト

#### ✅ API統合確認
- [ ] 楽天APIから実際のレシピカテゴリを取得
- [ ] レシピ検索で実際のデータを取得
- [ ] 食材詳細ページでレシピが表示
- [ ] API制限（1秒1リクエスト）が適用されている
- [ ] エラー時にモックデータにフォールバック

#### ✅ パフォーマンス確認
- [ ] レスポンス時間が3秒以内
- [ ] キャッシュが適切に動作
- [ ] レート制限が適用されている
- [ ] 同時リクエストが制御されている

#### ✅ エラーハンドリング確認
- [ ] API制限エラー時の適切な処理
- [ ] ネットワークエラー時のフォールバック
- [ ] 無効なレスポンス時の処理
- [ ] ユーザーフレンドリーなエラーメッセージ

### 4. トラブルシューティング

#### よくある問題

**1. API Key Invalid エラー**
```
解決策: Application IDが正しく設定されているか確認
- 20桁の数字であること
- 環境変数名が正確であること（RAKUTEN_APPLICATION_ID）
```

**2. Rate Limit エラー**
```
解決策: リクエスト頻度を調整
- 1秒間に1リクエスト以下に制限
- キャッシュを活用してリクエスト数を削減
```

**3. Network Timeout**
```
解決策: タイムアウト設定を調整
- デフォルト10秒 → 必要に応じて延長
- リトライ機能を活用
```

### 5. 監視・メンテナンス

#### API使用量監視
- 1日1,000リクエスト制限の監視
- レスポンス時間の監視
- エラー率の監視

#### ログ確認
```bash
# Vercel Function Logs で以下を確認
- "🌐 Data Source: getRecipeCategories using real_api"
- "✅ API Request Success"
- "❌ API Request Failed" (エラー時)
```

### 6. Phase 3 準備

Phase 2が成功したら：
1. Google AdSenseアカウント作成
2. サイト審査申請
3. 広告配置の最適化

## 🚨 緊急時の対応

API障害時は以下のコマンドで即座にモックデータに戻せます：

```bash
# Vercel環境変数を更新
USE_MOCK_RECIPES=true
```

これにより、サービス継続性を保てます。