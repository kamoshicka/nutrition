# ヘルスケア食材アプリ

病気・症状に対して効果的な食材と調理法を提供するWebアプリケーション

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データストレージ**: JSON ファイル

## 開発環境のセットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 環境変数の設定:
`.env.local` ファイルを作成し、楽天APIキーを設定してください：
```bash
RAKUTEN_APPLICATION_ID=your_rakuten_application_id_here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

楽天APIキーは[楽天ウェブサービス](https://webservice.rakuten.co.jp/)で取得できます。
詳細な取得手順は[docs/rakuten-api-setup.md](docs/rakuten-api-setup.md)を参照してください。

3. 開発サーバーの起動:
```bash
npm run dev
```

4. ブラウザで http://localhost:3000 を開く

## プロジェクト構造

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── globals.css     # グローバルスタイル
│   ├── layout.tsx      # ルートレイアウト
│   └── page.tsx        # ホームページ
├── components/         # 再利用可能なコンポーネント
├── data/              # JSONデータファイル
└── types/             # TypeScript型定義
```

## 機能

- 病気・症状カテゴリの一覧表示
- カテゴリ別食材一覧
- 食材詳細情報（効能、栄養情報、注意事項）
- 調理法の表示
- **楽天レシピAPI連携によるレシピ表示**
- レスポンシブデザイン
- 検索機能

## 開発コマンド

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバー起動
- `npm run lint` - ESLintチェック
- `npm run cypress` - Cypressテストランナーを開く
- `npm run cypress:headless` - ヘッドレスモードでCypressテストを実行
- `npm run e2e` - 開発サーバーを起動してCypressテストランナーを開く
- `npm run e2e:headless` - 開発サーバーを起動してヘッドレスモードでCypressテストを実行

## E2Eテスト

このプロジェクトではCypressを使用してE2Eテストを実装しています。以下の主要なユーザーフローをテストしています：

1. ホームページの表示とカテゴリ検索
2. カテゴリ詳細ページの表示と食材一覧
3. 食材詳細ページの表示と調理法の確認
4. グローバル検索機能
5. エラーハンドリング
6. アクセシビリティ（WCAG準拠）

テストを実行するには：

```bash
# 開発サーバーを起動してCypressテストランナーを開く
npm run e2e

# または、ヘッドレスモードで実行（CI環境向け）
npm run e2e:headless
```

## パフォーマンス最適化

このプロジェクトでは以下のパフォーマンス最適化を実装しています：

### 画像最適化
- Next.jsの組み込み画像最適化機能を使用
- 自動的なWebPとAVIF形式への変換
- レスポンシブ画像サイズの自動生成

### コード分割
- Next.jsの自動コード分割機能を活用
- ページ単位での遅延ロード
- 共通コンポーネントの効率的なバンドル

### SEO対策
- 適切なメタデータの設定
- OpenGraph対応
- robots.txtとサイトマップの実装
- 構造化データの追加

### アクセシビリティ
- WCAG 2.1 AA準拠を目指した実装
- スクリーンリーダー対応
- キーボードナビゲーション
- スキップリンクの実装
- コントラスト比の最適化

アクセシビリティチェックを実行するには：

```bash
# 開発サーバーを起動した状態で実行
npm run check-a11y
```

## 本番環境へのデプロイ

本番環境へのデプロイ手順については以下のドキュメントを参照してください：

- [楽天APIキー取得ガイド](docs/rakuten-api-setup.md)
- [デプロイガイド](docs/deployment-guide.md)

### 主要な本番環境設定

1. **楽天APIキーの設定**
   ```bash
   RAKUTEN_APPLICATION_ID=your_actual_api_key
   ```

2. **本番環境フラグ**
   ```bash
   NODE_ENV=production
   USE_MOCK_RECIPES=false
   ```

3. **セキュリティ設定**
   - HTTPS強制
   - Content Security Policy
   - レート制限