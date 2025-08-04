# Vercel環境変数設定ガイド

## 🔧 Phase 1: 必須環境変数

Vercel Dashboard > Settings > Environment Variables で以下を設定：

### Production環境用
```
NEXTAUTH_SECRET=COOKCARE_NUTRITION_KEY
NEXTAUTH_URL=https://cookcare.vercel.app
DATABASE_URL=./data/production.db
NODE_ENV=production
USE_MOCK_RECIPES=true
BCRYPT_ROUNDS=12
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-test
```

### Preview環境用（同じ値）
```
NEXTAUTH_SECRET=COOKCARE_NUTRITION_KEY
NEXTAUTH_URL=https://cookcare-git-main-your-username.vercel.app
DATABASE_URL=./data/preview.db
NODE_ENV=production
USE_MOCK_RECIPES=true
BCRYPT_ROUNDS=12
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-test
```

### Development環境用（同じ値）
```
NEXTAUTH_SECRET=COOKCARE_NUTRITION_KEY
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=./data/development.db
NODE_ENV=development
USE_MOCK_RECIPES=true
BCRYPT_ROUNDS=12
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-test
```

## 📝 設定手順

1. Vercel Dashboard > Project Settings > Environment Variables
2. 各環境（Production, Preview, Development）に対して上記の変数を追加
3. "Save" をクリック
4. "Redeploy" をクリックして再デプロイ

## ⚠️ 注意事項

- NEXTAUTH_SECRET は32文字以上の強力なランダム文字列を使用
- 本番URLは実際のVercelドメインに合わせて調整
- Phase 2以降で楽天API、AdSense、Stripeの実際の値に更新予定