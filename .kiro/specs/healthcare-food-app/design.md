# 設計書

## 概要

ヘルスケア食材アプリは、病気・症状に対して効果的な食材と調理法を提供するWebアプリケーションです。React.jsをフロントエンド、Node.js/Express.jsをバックエンドとして使用し、JSONファイルベースのデータストレージを採用します。

## アーキテクチャ

### システム構成
```
Next.js Application
    ↓ API Routes
Data Storage (JSON Files)
```

### 技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS
- **データストレージ**: JSON ファイル
- **開発ツール**: TypeScript, ESLint, Prettier

### Next.js選択の理由
- **SSR/SSG**: SEO最適化と初期表示速度の向上
- **API Routes**: 別途バックエンドサーバー不要、開発効率向上
- **ファイルベースルーティング**: 直感的なページ構成
- **最適化機能**: 画像最適化、コード分割が自動
- **TypeScript統合**: 型安全性の向上

## コンポーネントとインターフェース

### フロントエンドコンポーネント

#### 1. App Component
- アプリケーションのルートコンポーネント
- ルーティングとグローバル状態管理

#### 2. CategoryList Component
- 病気・症状カテゴリの一覧表示
- 検索機能付き
- Props: `categories`, `onCategorySelect`, `searchTerm`, `onSearchChange`

#### 3. FoodList Component
- 選択されたカテゴリに対応する食材一覧
- Props: `foods`, `onFoodSelect`, `selectedCategory`

#### 4. FoodDetail Component
- 食材の詳細情報表示（効能、栄養情報、注意事項）
- Props: `food`, `cookingMethods`

#### 5. CookingMethodList Component
- 調理法の一覧と詳細表示
- Props: `methods`, `onMethodSelect`

#### 6. SearchBar Component
- 汎用検索コンポーネント
- Props: `placeholder`, `value`, `onChange`

### API Routes（Next.js）

#### エンドポイント設計

```
GET /api/categories
- 病気・症状カテゴリ一覧を取得
- ファイル: app/api/categories/route.ts

GET /api/categories/[id]/foods
- 特定カテゴリの食材一覧を取得
- ファイル: app/api/categories/[id]/foods/route.ts

GET /api/foods/[id]
- 食材の詳細情報を取得
- ファイル: app/api/foods/[id]/route.ts

GET /api/search/foods?q=:query
- 食材名での検索
- ファイル: app/api/search/foods/route.ts

GET /api/search/categories?q=:query
- カテゴリ名での検索
- ファイル: app/api/search/categories/route.ts
```

### ページ構成（App Router）

```
app/
├── page.tsx                    # ホームページ（カテゴリ一覧）
├── categories/[id]/page.tsx    # カテゴリ別食材一覧
├── foods/[id]/page.tsx         # 食材詳細ページ
├── search/page.tsx             # 検索結果ページ
└── api/                        # API Routes
```

## データモデル

### Category（病気・症状カテゴリ）
```typescript
interface Category {
  id: string;
  name: string;
  description: string;
  foodIds: string[];
}
```

### Food（食材）
```typescript
interface Food {
  id: string;
  name: string;
  description: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    vitamins: string[];
    minerals: string[];
  };
  healthBenefits: HealthBenefit[];
  precautions: string[];
  cookingMethodIds: string[];
}
```

### HealthBenefit（健康効果）
```typescript
interface HealthBenefit {
  condition: string;
  effect: string;
  scientificBasis: string;
  effectiveness: 'high' | 'medium' | 'low';
}
```

### CookingMethod（調理法）
```typescript
interface CookingMethod {
  id: string;
  name: string;
  description: string;
  steps: string[];
  nutritionRetention: number; // 栄養保持率 (0-100)
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number; // 分
}
```

## エラーハンドリング

### フロントエンド
- APIエラーの統一的な処理
- ユーザーフレンドリーなエラーメッセージ表示
- ネットワークエラー時のリトライ機能

### バックエンド
- 統一されたエラーレスポンス形式
- ログ記録システム
- バリデーションエラーの詳細な情報提供

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## テスト戦略

### フロントエンドテスト
- **単体テスト**: Jest + React Testing Library
  - コンポーネントの動作確認
  - ユーザーインタラクションのテスト
- **統合テスト**: API連携の確認
- **E2Eテスト**: Cypress（主要なユーザーフロー）

### API Routesテスト
- **単体テスト**: Jest + @testing-library/jest-environment-jsdom
  - API エンドポイントのテスト
  - データ処理ロジックのテスト
- **統合テスト**: データファイルとの連携確認

### テストデータ
- 実際の医学的情報に基づいたサンプルデータ
- エッジケースを含むテストシナリオ

## レスポンシブデザイン

### ブレークポイント
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

### モバイルファースト設計
- タッチフレンドリーなUI要素
- 重要な情報の優先表示
- 簡潔なナビゲーション

### アクセシビリティ
- WCAG 2.1 AA準拠
- キーボードナビゲーション対応
- スクリーンリーダー対応