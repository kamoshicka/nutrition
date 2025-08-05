# Phase 2: 楽天API統合ガイド

## 🎯 目標
- 実際の楽天レシピAPIからデータを取得
- モックデータから実データへの切り替え
- レシピ検索機能の強化

## 📋 楽天ウェブサービス アカウント作成

### Step 1: アカウント登録
1. **楽天ウェブサービス**にアクセス: https://webservice.rakuten.co.jp/
2. 「新規アプリ登録」をクリック
3. 楽天会員IDでログイン（持っていない場合は新規登録）

### Step 2: アプリケーション登録
1. **アプリ名**: `クックケア`
2. **アプリURL**: `https://cookcare-lilac.vercel.app`
3. **アプリの説明**: 
   ```
   病気・症状に効果的な食材と調理法を提供するWebアプリケーション。
   ユーザーが健康状態に応じた食材を検索し、楽天レシピから
   関連するレシピを表示する健康支援サービスです。
   ```
4. **利用API**: 
   - ✅ 楽天レシピAPI
5. **月間予想PV数**: `10,000` (控えめに設定)

### Step 3: Application ID取得
1. 登録完了後、**Application ID**（20桁の数字）を取得
2. この値を安全に保管

## 🔧 Vercel環境変数更新

Application ID取得後、以下を実行：

### Production環境
```
RAKUTEN_APPLICATION_ID=your_20_digit_application_id
USE_MOCK_RECIPES=false
```

### Preview環境
```
RAKUTEN_APPLICATION_ID=your_20_digit_application_id
USE_MOCK_RECIPES=false
```

### Development環境（ローカル開発用）
```
RAKUTEN_APPLICATION_ID=your_20_digit_application_id
USE_MOCK_RECIPES=false
```

## 📊 API利用制限

### 楽天レシピAPI制限
- **1秒間のリクエスト数**: 1回
- **1日のリクエスト数**: 1,000回（無料プラン）
- **レスポンス形式**: JSON
- **文字コード**: UTF-8

### 推奨設定
- リクエスト間隔: 1秒以上
- キャッシュ活用: 5分間
- エラーハンドリング: フォールバック機能

## 🧪 テスト手順

1. **ローカルテスト**
   ```bash
   # .env.localを更新
   RAKUTEN_APPLICATION_ID=your_application_id
   USE_MOCK_RECIPES=false
   
   # 開発サーバー起動
   npm run dev
   
   # APIテスト
   curl http://localhost:3000/api/debug/rakuten-health
   ```

2. **本番テスト**
   - Vercelで環境変数更新
   - 自動再デプロイ
   - https://cookcare-lilac.vercel.app/api/debug/rakuten-health でテスト

## ⚠️ 注意事項

- Application IDは秘密情報として管理
- API制限を超えないよう注意
- エラー時はモックデータにフォールバック
- 利用規約を遵守

## 🎯 Phase 2 成功基準

- [ ] 楽天APIから実際のレシピデータを取得
- [ ] レシピ検索が正常に動作
- [ ] 食材詳細ページでレシピが表示
- [ ] API制限内での安定動作
- [ ] エラーハンドリングが適切に機能