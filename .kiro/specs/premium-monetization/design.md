# プレミアム機能・マネタイズ設計書

## 概要

既存のヘルスケア食材アプリに、サブスクリプション型プレミアム機能と広告収入モデルを統合する設計書です。個人開発レベルで管理可能な実装を重視し、外部サービス（Stripe、Google AdSense、楽天アフィリエイト）を活用します。

## アーキテクチャ

### システム構成
```
Next.js Application
├── Authentication (NextAuth.js)
├── Subscription Management (Stripe)
├── Premium Features
├── Ad Management (AdSense + Affiliate)
└── Data Storage (JSON + SQLite)
```

### 技術スタック追加
- **認証**: NextAuth.js v4
- **決済**: Stripe
- **データベース**: SQLite (ユーザーデータ用)
- **PDF生成**: jsPDF + html2canvas
- **広告**: Google AdSense, 楽天アフィリエイト

## コンポーネントとインターフェース

### 新規データモデル

#### User（ユーザー）
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  subscription: UserSubscription;
  searchCount: number;
  searchCountResetDate: Date;
}
```

#### UserSubscription（サブスクリプション）
```typescript
interface UserSubscription {
  status: 'free' | 'premium' | 'cancelled';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}
```

#### Favorite（お気に入り）
```typescript
interface Favorite {
  id: string;
  userId: string;
  type: 'food' | 'recipe';
  itemId: string;
  notes?: string;
  createdAt: Date;
}
```

#### ShoppingListItem（買い物リスト）
```typescript
interface ShoppingListItem {
  id: string;
  userId: string;
  foodName: string;
  quantity: string;
  checked: boolean;
  recipeId?: string;
  createdAt: Date;
}
```

#### NutritionCalculation（栄養計算）
```typescript
interface NutritionCalculation {
  id: string;
  userId: string;
  name: string;
  foods: {
    foodId: string;
    quantity: number;
  }[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  createdAt: Date;
}
```

### 新規コンポーネント

#### 1. AuthComponents
```typescript
// components/auth/LoginForm.tsx
interface LoginFormProps {
  onSuccess: () => void;
  redirectTo?: string;
}

// components/auth/SignupForm.tsx
interface SignupFormProps {
  onSuccess: () => void;
  redirectTo?: string;
}

// components/auth/UserMenu.tsx
interface UserMenuProps {
  user: User;
  onLogout: () => void;
}
```

#### 2. SubscriptionComponents
```typescript
// components/subscription/PricingCard.tsx
interface PricingCardProps {
  plan: 'free' | 'premium';
  features: string[];
  price?: number;
  onSubscribe?: () => void;
}

// components/subscription/SubscriptionStatus.tsx
interface SubscriptionStatusProps {
  subscription: UserSubscription;
  onManage: () => void;
}
```

#### 3. PremiumFeatureComponents
```typescript
// components/premium/FavoriteButton.tsx
interface FavoriteButtonProps {
  type: 'food' | 'recipe';
  itemId: string;
  isFavorited: boolean;
  onToggle: (favorited: boolean) => void;
  isPremium: boolean;
}

// components/premium/NutritionCalculator.tsx
interface NutritionCalculatorProps {
  selectedFoods: { foodId: string; quantity: number }[];
  onCalculate: (result: NutritionCalculation) => void;
  isPremium: boolean;
}

// components/premium/PDFExportButton.tsx
interface PDFExportButtonProps {
  recipeData: any;
  fileName: string;
  isPremium: boolean;
}
```

#### 4. AdComponents
```typescript
// components/ads/AdBanner.tsx
interface AdBannerProps {
  size: 'small' | 'medium' | 'large';
  position: 'header' | 'sidebar' | 'footer' | 'inline';
  showAds: boolean; // false for premium users
}

// components/ads/AffiliateLink.tsx
interface AffiliateLinkProps {
  productName: string;
  category: 'food' | 'kitchen' | 'health';
  children: React.ReactNode;
}
```

### API Routes拡張

#### 認証・ユーザー管理
```
POST /api/auth/signup
POST /api/auth/signin
GET  /api/auth/session
POST /api/auth/signout

GET  /api/user/profile
PUT  /api/user/profile
GET  /api/user/subscription
```

#### サブスクリプション管理
```
POST /api/subscription/create-checkout-session
POST /api/subscription/webhook (Stripe webhook)
POST /api/subscription/cancel
GET  /api/subscription/status
```

#### プレミアム機能
```
GET  /api/favorites
POST /api/favorites
DELETE /api/favorites/[id]

GET  /api/shopping-list
POST /api/shopping-list
PUT  /api/shopping-list/[id]
DELETE /api/shopping-list/[id]

POST /api/nutrition/calculate
GET  /api/nutrition/history

POST /api/pdf/generate-recipe
```

#### 検索制限・広告
```
POST /api/search/track (検索回数カウント)
GET  /api/ads/config
GET  /api/affiliate/links
```

## データストレージ設計

### SQLiteデータベース構造
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  search_count INTEGER DEFAULT 0,
  search_count_reset_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start DATETIME,
  current_period_end DATETIME,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Favorites table
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Shopping list table
CREATE TABLE shopping_list (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  quantity TEXT,
  checked BOOLEAN DEFAULT FALSE,
  recipe_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Nutrition calculations table
CREATE TABLE nutrition_calculations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  foods_data TEXT NOT NULL, -- JSON string
  total_nutrition TEXT NOT NULL, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## セキュリティ設計

### 認証・認可
- **NextAuth.js**: セッション管理とOAuth対応
- **JWT**: サーバーサイドでのトークン検証
- **CSRF保護**: Next.jsの標準機能を活用
- **Rate Limiting**: API呼び出し制限

### データ保護
- **パスワードハッシュ化**: bcrypt使用
- **環境変数**: 機密情報の適切な管理
- **HTTPS**: 本番環境での強制
- **入力検証**: zod使用

## 決済システム設計

### Stripe統合
```typescript
// lib/stripe.ts
interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  priceId: string; // プレミアムプランの価格ID
}

// サブスクリプション作成フロー
1. フロントエンド: Stripe Checkoutセッション作成要求
2. バックエンド: Stripe APIでCheckoutセッション作成
3. フロントエンド: Stripeホストページにリダイレクト
4. 決済完了後: Webhookでサブスクリプション状態更新
```

### 決済状態管理
- **アクティブ**: 正常な課金状態
- **キャンセル予定**: 期間終了時にキャンセル
- **期限切れ**: 未払いまたは期間終了
- **トライアル**: 7日間無料体験

## 広告システム設計

### Google AdSense統合
```typescript
// components/ads/AdSense.tsx
interface AdSenseProps {
  adSlot: string;
  adFormat: 'auto' | 'rectangle' | 'banner';
  responsive?: boolean;
}

// 広告表示ロジック
const shouldShowAds = (user: User | null): boolean => {
  return !user || user.subscription.status === 'free';
};
```

### アフィリエイト広告
```typescript
// lib/affiliate.ts
interface AffiliateLink {
  platform: 'rakuten' | 'amazon';
  productId: string;
  category: string;
  url: string;
}

// 食材に基づく関連商品推奨
const getRelatedProducts = (foodId: string): AffiliateLink[] => {
  // 食材カテゴリに基づいて関連商品を返す
};
```

## エラーハンドリング

### プレミアム機能アクセス制御
```typescript
// middleware/premium-check.ts
const requiresPremium = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getUser(req);
    if (!user || user.subscription.status !== 'premium') {
      return res.status(403).json({
        error: 'Premium subscription required',
        upgradeUrl: '/pricing'
      });
    }
    return handler(req, res);
  };
};
```

### 決済エラー処理
- **カード決済失敗**: ユーザーに分かりやすいエラーメッセージ
- **Webhook失敗**: リトライ機能とログ記録
- **サブスクリプション同期エラー**: 手動同期機能

## テスト戦略

### 単体テスト
- **認証フロー**: ログイン・サインアップ・セッション管理
- **プレミアム機能**: アクセス制御・機能動作
- **決済処理**: Stripeモック使用

### 統合テスト
- **E2E決済フロー**: Stripe Test Mode使用
- **プレミアム機能統合**: 実際のユーザーフロー
- **広告表示**: 表示・非表示の切り替え

### セキュリティテスト
- **認証バイパス**: 不正アクセス試行
- **SQL Injection**: 入力検証テスト
- **CSRF攻撃**: トークン検証テスト

## パフォーマンス最適化

### データベース最適化
- **インデックス**: user_id, created_atにインデックス作成
- **クエリ最適化**: N+1問題の回避
- **キャッシュ**: Redis使用（将来的に）

### フロントエンド最適化
- **コード分割**: プレミアム機能の遅延読み込み
- **画像最適化**: Next.js Image最適化
- **バンドルサイズ**: 不要なライブラリの除去

## 監視・分析

### KPI追跡
- **ユーザー登録数**: 日次・月次
- **プレミアム転換率**: コンバージョンファネル
- **解約率**: チャーン分析
- **広告収益**: クリック率・収益率

### エラー監視
- **Sentry**: エラートラッキング
- **ログ**: 構造化ログ出力
- **アラート**: 重要エラーの通知

---

この設計に基づいて、段階的にプレミアム機能とマネタイズ機能を実装していきます。