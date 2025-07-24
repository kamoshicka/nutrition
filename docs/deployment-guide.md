# 本番環境デプロイガイド

## 1. 環境変数の設定

### 必須環境変数
```bash
RAKUTEN_APPLICATION_ID=your_actual_rakuten_api_key
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### オプション環境変数
```bash
USE_MOCK_RECIPES=false
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true
```

## 2. Vercelでのデプロイ

### 手順
1. Vercelアカウントにログイン
2. GitHubリポジトリを接続
3. 環境変数を設定：
   ```bash
   vercel env add RAKUTEN_APPLICATION_ID production
   vercel env add NODE_ENV production
   vercel env add NEXT_PUBLIC_API_URL production
   ```
4. デプロイ実行：
   ```bash
   vercel --prod
   ```

### vercel.json設定
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300, stale-while-revalidate=600"
        }
      ]
    }
  ]
}
```

## 3. Netlifyでのデプロイ

### netlify.toml設定
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "public, max-age=300, stale-while-revalidate=600"
```

## 4. セキュリティ設定

### Content Security Policy
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://app.rakuten.co.jp;"
  }
];
```

### HTTPS強制
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }
];
```

## 5. パフォーマンス最適化

### キャッシュ戦略
- API レスポンス: 10分キャッシュ
- 静的アセット: 1年キャッシュ
- レシピ画像: CDN経由で配信

### 監視とログ
- エラー監視: Sentry
- パフォーマンス監視: Vercel Analytics
- ログ管理: Vercel Functions Logs

## 6. CI/CD設定

### GitHub Actions
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```