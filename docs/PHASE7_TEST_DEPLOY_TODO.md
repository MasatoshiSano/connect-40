# Phase 7: テスト・デプロイTODO

## 概要
本番環境へのデプロイとテスト実施

## 実装が必要な項目

### 1. テスト実装

#### Unit Tests
- `frontend/src/**/*.test.tsx` - コンポーネントテスト
- `backend/functions/**/*.test.ts` - Lambda関数テスト

#### Integration Tests
- API統合テスト
- WebSocket接続テスト
- Stripe決済フローテスト

#### E2E Tests
- Playwright使用
- 主要ユーザーフロー:
  1. サインアップ→プロフィール作成→ログイン
  2. アクティビティ作成→参加→チャット
  3. プレミアム登録→機能利用

### 2. CI/CD構築

#### GitHub Actions
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup Node.js
      - Install dependencies
      - Run lint
      - Run type check
      - Run unit tests
      - Run E2E tests

  deploy-dev:
    needs: test
    if: github.ref == 'refs/heads/develop'
    steps:
      - Deploy to dev environment

  deploy-prod:
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - Deploy to prod environment
```

### 3. 環境設定

#### Dev環境
- API: `dev.api.connect40.jp`
- Frontend: `dev.connect40.jp`
- WebSocket: `dev.ws.connect40.jp`

#### Prod環境
- API: `api.connect40.jp`
- Frontend: `connect40.jp`
- WebSocket: `ws.connect40.jp`

### 4. デプロイ手順

#### Backend (CDK)
```bash
cd cdk
npm run build
cdk bootstrap aws://ACCOUNT/REGION
cdk deploy --all --profile connect40-prod
```

#### Frontend (S3 + CloudFront)
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://connect40-frontend-prod
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

### 5. モニタリング・ログ

#### CloudWatch
- Lambda関数のエラーレート監視
- API Gatewayのレイテンシ監視
- DynamoDBのスロットリング監視

#### Alarm設定
- エラーレート 5%超過時
- レスポンスタイム 3秒超過時
- DynamoDB読み取り/書き込みキャパシティ 80%超過時

#### ログ集約
- CloudWatch Logs Insights使用
- エラーログの集約・分析

### 6. セキュリティチェック

#### 脆弱性スキャン
- `npm audit`
- Dependabot有効化
- OWASP Top 10チェック

#### 認証・認可
- Cognitoトークン検証
- API Gatewayオーソライザー
- CORS設定確認

#### データ保護
- DynamoDB暗号化有効化
- S3バケット暗号化有効化
- Secrets Manager使用

### 7. パフォーマンスチューニング

#### Frontend
- Lighthouse Score 90+目標
- Bundle size最適化
- Image lazy loading

#### Backend
- Lambda関数のコールドスタート最適化
- DynamoDB GSI活用
- CloudFront CDN活用

### 8. ドキュメント整備

#### 運用ドキュメント
- `docs/OPERATIONS.md` - 運用手順書
- `docs/TROUBLESHOOTING.md` - トラブルシューティング
- `docs/API.md` - API仕様書

#### ユーザーガイド
- `docs/USER_GUIDE.md` - ユーザーマニュアル
- `docs/FAQ.md` - よくある質問

## デプロイチェックリスト

- [ ] 環境変数設定（Cognito, Stripe, Google Maps API）
- [ ] ドメイン設定・SSL証明書
- [ ] バックアップ設定
- [ ] モニタリング・アラート設定
- [ ] セキュリティグループ・VPC設定
- [ ] ログ保持期間設定
- [ ] コスト予算アラート設定
- [ ] 利用規約・プライバシーポリシー公開

## 本番リリース後

### 初期監視期間（1週間）
- 毎日ログ確認
- エラーレート監視
- ユーザーフィードバック収集

### 定期メンテナンス
- 週次: ログ分析
- 月次: パフォーマンスレビュー
- 四半期: セキュリティ監査
