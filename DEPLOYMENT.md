# クックケア デプロイメントガイド

## 🚀 本番デプロイ手順

### 前提条件
- [x] Vercelアカウントの作成
- [x] GitHubリポジトリの準備
- [ ] 楽天ウェブサービスAPIキーの取得
- [ ] Google AdSenseアカウントの設定
- [ ] Stripe本番アカウントの設定

### 1. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. "New Project" をクリック
3. GitHubリポジトリを選択
4. プロジェクト名: `cookcare`
5. Framework Preset: `Next.js`
6. Root Directory: `./` (デフォルト)

### 2. 環境変数の設定

Vercel Dashboard > Settings > Environment Variables で以下を設定：

#### 必須環境変数
```
NEXTAUTH_SECRET=your-production-secret-32-chars-minimum
NEXTAUTH_URL=https://cookcare.vercel.app
DATABASE_URL=./data/production.db
NODE_ENV=production
BCRYPT_ROUNDS=12
```

#### 楽天API設定（後で設定）
```
RAKUTEN_APPLICATION_ID=your_rakuten_app_id
USE_MOCK_RECIPES=false
```

#### AdSense設定（後で設定）
```
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-your-publisher-id
```

#### Stripe設定（後で設定）
```
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_production_price_id
```

### 3. デプロイ実行

1. 環境変数設定後、"Deploy" をクリック
2. ビルドログを確認
3. デプロイ完了後、URLにアクセスして動作確認

### 4. カスタムドメイン設定（オプション）

1. Vercel Dashboard > Settings > Domains
2. カスタムドメインを追加
3. DNS設定を更新

### 5. 本番環境での追加設定

#### 楽天API設定
1. [楽天ウェブサービス](https://webservice.rakuten.co.jp/) でアカウント作成
2. アプリケーション登録
3. Application IDを取得
4. Vercelの環境変数に設定

#### Google AdSense設定
1. [Google AdSense](https://www.google.com/adsense/) でアカウント作成
2. サイトを追加・審査申請
3. 承認後、Publisher IDを取得
4. Vercelの環境変数に設定

#### Stripe設定
1. [Stripe Dashboard](https://dashboard.stripe.com/) でLiveモードに切り替え
2. 本番用APIキーを取得
3. Webhookエンドポイントを設定: `https://cookcare.vercel.app/api/subscription/webhook`
4. 商品・価格を作成
5. Vercelの環境変数に設定

### 6. 監視・メンテナンス

- Vercel Analytics の有効化
- エラー監視の設定
- パフォーマンス監視
- 定期的なセキュリティアップデート

### 7. トラブルシューティング

#### よくある問題
1. **ビルドエラー**: 型エラーやインポートエラーをチェック
2. **環境変数エラー**: 必須変数が設定されているか確認
3. **データベースエラー**: SQLiteファイルの権限をチェック
4. **API制限**: 楽天APIの利用制限を確認

#### デバッグ方法
- Vercel Function Logs を確認
- ブラウザの開発者ツールでエラーをチェック
- `/api/debug/env-check` エンドポイントで設定確認

## 📊 デプロイ後の確認項目

- [ ] ホームページの表示
- [ ] 食材検索機能
- [ ] レシピ表示機能
- [ ] ユーザー認証
- [ ] 広告表示（設定後）
- [ ] 決済機能（設定後）
- [ ] モバイル対応
- [ ] SEO設定
- [ ] パフォーマンス
- [ ] セキュリティヘッダー

## 🔒 セキュリティチェック

- [ ] HTTPS強制
- [ ] セキュリティヘッダー設定
- [ ] 環境変数の適切な管理
- [ ] APIエンドポイントの保護
- [ ] CORS設定
- [ ] CSP設定