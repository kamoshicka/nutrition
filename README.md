# ヘルスケア食材アプリ

病気・症状に対して効果的な食材と調理法、実際のレシピを提供する包括的なWebアプリケーション

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/healthcare-food-app)

## 🌟 主な機能

- **50種類の健康食材データベース** - 科学的根拠に基づいた健康効果情報
- **16のカテゴリ別分類** - 糖尿病、高血圧、心疾患など症状別の食材検索
- **楽天レシピAPI連携** - 実際の調理レシピを自動取得・表示
- **包括的な調理法ガイド** - 栄養保持率を考慮した最適な調理方法
- **レスポンシブデザイン** - モバイル・タブレット・デスクトップ対応
- **アクセシビリティ対応** - WCAG 2.1 AA準拠
- **PWA対応** - オフライン機能とアプリライクな体験

## 🛠 技術スタック

### フロントエンド
- **Next.js 14** - App Router使用
- **TypeScript** - 型安全性の確保
- **Tailwind CSS** - ユーティリティファーストCSS
- **React Hooks** - 状態管理とライフサイクル

### バックエンド・API
- **Next.js API Routes** - サーバーサイドAPI
- **楽天ウェブサービスAPI** - レシピデータ取得
- **レート制限機能** - API使用量の最適化
- **エラーハンドリング** - 堅牢なエラー処理

### テスト・品質保証
- **Cypress** - E2Eテスト
- **Jest** - ユニットテスト
- **ESLint** - コード品質チェック
- **アクセシビリティテスト** - 自動化されたa11yチェック

### デプロイ・インフラ
- **Vercel** - 本番環境デプロイ
- **GitHub Actions** - CI/CDパイプライン
- **環境変数管理** - セキュアな設定管理

## 🚀 クイックスタート

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/healthcare-food-app.git
cd healthcare-food-app
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env.local` ファイルを作成：
```bash
# 楽天API設定（本番環境では必須）
RAKUTEN_APPLICATION_ID=your_rakuten_application_id_here

# アプリケーション設定
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# 開発用フラグ（楽天APIキーがない場合はモックデータを使用）
USE_MOCK_RECIPES=true
```

### 4. 開発サーバーの起動
```bash
npm run dev
```

### 5. ブラウザでアクセス
http://localhost:3000 を開いてアプリケーションを確認

## 📁 プロジェクト構造

```
healthcare-food-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── categories/    # カテゴリAPI
│   │   │   ├── foods/         # 食材API
│   │   │   ├── recipes/       # レシピAPI
│   │   │   └── search/        # 検索API
│   │   ├── categories/        # カテゴリページ
│   │   ├── foods/            # 食材詳細ページ
│   │   ├── search/           # 検索ページ
│   │   ├── globals.css       # グローバルスタイル
│   │   ├── layout.tsx        # ルートレイアウト
│   │   └── page.tsx          # ホームページ
│   ├── components/            # 再利用可能なコンポーネント
│   │   └── ui/               # UIコンポーネント
│   ├── data/                 # 静的データファイル
│   │   ├── categories.json   # カテゴリデータ
│   │   ├── foods.json        # 食材データ（50種類）
│   │   └── cooking-methods.json # 調理法データ
│   ├── lib/                  # ユーティリティ・設定
│   │   ├── config.ts         # アプリケーション設定
│   │   ├── data-loader.ts    # データ読み込み
│   │   └── rakuten-recipe-api.ts # 楽天API連携
│   └── types/                # TypeScript型定義
├── cypress/                  # E2Eテスト
├── docs/                     # ドキュメント
├── public/                   # 静的ファイル
├── scripts/                  # ユーティリティスクリプト
└── vercel.json              # Vercel設定
```

## 🧪 テスト

### E2Eテスト（Cypress）
```bash
# テストランナーを開く
npm run e2e

# ヘッドレスモードで実行
npm run e2e:headless

# 特定のテストファイルを実行
npx cypress run --spec "cypress/e2e/home.cy.ts"
```

### アクセシビリティテスト
```bash
# 開発サーバーを起動した状態で実行
npm run check-a11y
```

### コード品質チェック
```bash
# ESLintチェック
npm run lint

# TypeScriptチェック
npx tsc --noEmit
```

## 🔧 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLintチェック |
| `npm run cypress` | Cypressテストランナー |
| `npm run cypress:headless` | ヘッドレスCypressテスト |
| `npm run e2e` | E2Eテスト（サーバー起動込み） |
| `npm run e2e:headless` | ヘッドレスE2Eテスト |
| `npm run check-a11y` | アクセシビリティチェック |

## 🍳 楽天レシピAPI連携

### 開発環境での使用
楽天APIキーが設定されていない場合、自動的にモックデータを使用します。

### 本番環境での設定
1. [楽天ウェブサービス](https://webservice.rakuten.co.jp/)でアカウント作成
2. アプリケーション登録してAPIキーを取得
3. 環境変数に設定

詳細な手順は [docs/rakuten-api-setup.md](docs/rakuten-api-setup.md) を参照してください。

### API機能
- **レシピ検索**: 食材名でレシピを検索
- **カテゴリ別レシピ**: カテゴリごとのレシピ一覧
- **レート制限**: 1秒間に5リクエストまで
- **エラーハンドリング**: APIエラー時のフォールバック機能

## 🚀 本番環境デプロイ

### Vercelでのデプロイ（推奨）

1. **GitHubリポジトリをVercelに接続**
   ```bash
   # Vercel CLIをインストール
   npm i -g vercel
   
   # プロジェクトをデプロイ
   vercel
   ```

2. **環境変数の設定**
   ```bash
   # Vercelダッシュボードまたはコマンドラインで設定
   vercel env add RAKUTEN_APPLICATION_ID
   vercel env add NODE_ENV production
   vercel env add USE_MOCK_RECIPES false
   ```

3. **自動デプロイの設定**
   - mainブランチへのプッシュで自動デプロイ
   - プレビューデプロイ機能
   - ロールバック機能

### その他のプラットフォーム
- **Netlify**: [docs/deployment-guide.md#netlify](docs/deployment-guide.md#netlify)
- **AWS**: [docs/deployment-guide.md#aws](docs/deployment-guide.md#aws)
- **Docker**: [docs/deployment-guide.md#docker](docs/deployment-guide.md#docker)

## 🔒 セキュリティ

### 実装済みセキュリティ機能
- **Content Security Policy**: XSS攻撃の防止
- **HTTPS強制**: 本番環境での暗号化通信
- **API レート制限**: DDoS攻撃の防止
- **環境変数管理**: 機密情報の安全な管理
- **入力値検証**: SQLインジェクション等の防止

### セキュリティベストプラクティス
- APIキーは絶対にクライアントサイドで使用しない
- 定期的な依存関係の更新
- セキュリティヘッダーの適切な設定

## ♿ アクセシビリティ

### WCAG 2.1 AA準拠機能
- **キーボードナビゲーション**: 全機能をキーボードで操作可能
- **スクリーンリーダー対応**: 適切なARIAラベルとセマンティックHTML
- **コントラスト比**: 4.5:1以上を確保
- **フォーカス管理**: 明確なフォーカスインジケーター
- **スキップリンク**: メインコンテンツへの直接アクセス

### アクセシビリティテスト
```bash
# 自動テストの実行
npm run check-a11y

# Cypressでのa11yテスト
npm run cypress -- --spec "cypress/e2e/accessibility.cy.ts"
```

## 📊 パフォーマンス最適化

### 実装済み最適化
- **画像最適化**: Next.js Image コンポーネント使用
- **コード分割**: 自動的なページ単位分割
- **キャッシュ戦略**: 適切なHTTPキャッシュヘッダー
- **バンドル最適化**: Tree shakingとminification
- **レスポンシブ画像**: デバイスに応じた画像サイズ

### パフォーマンス指標
- **Lighthouse Score**: 90+を目標
- **Core Web Vitals**: 全指標でGood評価
- **First Contentful Paint**: 1.5秒以下
- **Time to Interactive**: 3秒以下

## 📋 データ仕様

### 食材データ（50種類）
各食材には以下の情報が含まれています：
- **基本情報**: 名前、説明、栄養成分
- **健康効果**: 科学的根拠に基づいた効能
- **注意事項**: 摂取時の注意点
- **調理法**: 推奨される調理方法

### カテゴリ（16種類）
- 糖尿病、高血圧、心疾患、消化器系の健康
- 免疫力向上、脳の健康、骨の健康、目の健康
- がん予防、貧血、便秘、筋肉の健康
- 老化防止、甲状腺機能、炎症抑制、水分補給

## 🤝 コントリビューション

### 開発への参加方法
1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コーディング規約
- **TypeScript**: 厳密な型チェック
- **ESLint**: 設定済みルールに従う
- **Prettier**: 自動フォーマット
- **コミットメッセージ**: Conventional Commits形式

### バグレポート・機能要望
[GitHub Issues](https://github.com/your-username/healthcare-food-app/issues) でお気軽にご報告ください。

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🙏 謝辞

- **楽天ウェブサービス**: レシピデータの提供
- **Next.js チーム**: 優れたフレームワークの提供
- **Tailwind CSS**: 効率的なスタイリングシステム
- **Cypress**: 信頼性の高いE2Eテストツール

## 📞 サポート

- **ドキュメント**: [docs/](docs/) フォルダ内の詳細ガイド
- **FAQ**: よくある質問と回答
- **Issue Tracker**: バグレポートと機能要望
- **Discussions**: 一般的な質問と議論

---

**健康的な食生活をサポートするために開発されました。** 🥗✨