# Connect40 運用ガイド

## デプロイ手順

### 前提条件
- AWS CLI設定済み
- Node.js 20.x インストール済み
- AWS CDK CLI インストール済み

### バックエンドデプロイ

```bash
# 1. CDKディレクトリに移動
cd cdk

# 2. 依存関係インストール
npm install

# 3. TypeScriptビルド
npm run build

# 4. 環境変数設定
export STRIPE_SECRET_KEY="sk_live_xxxxx"
export STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
export FRONTEND_URL="https://connect40.jp"

# 5. すべてのスタックをデプロイ
./node_modules/.bin/cdk deploy --all

# または個別スタックのみ
./node_modules/.bin/cdk deploy Connect40-Api-dev
```

### フロントエンドデプロイ

```bash
# 1. Frontendディレクトリに移動
cd frontend

# 2. 依存関係インストール
npm install

# 3. 環境変数確認（.env）
VITE_API_ENDPOINT=https://xxx.execute-api.ap-northeast-1.amazonaws.com/dev/
VITE_WEBSOCKET_ENDPOINT=wss://xxx.execute-api.ap-northeast-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_XXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxx
VITE_STRIPE_PREMIUM_PRICE_ID=price_xxxxx

# 4. ビルド
npm run build

# 5. S3にアップロード
aws s3 sync dist/ s3://connect40-frontend-dev-863646532781 --delete

# 6. CloudFrontキャッシュ無効化
aws cloudfront create-invalidation \
  --distribution-id E356KF1HDDL8LL \
  --paths "/*"
```

## 環境変数管理

### CDK環境変数
- `STRIPE_SECRET_KEY`: Stripe Secret API Key
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook Signing Secret
- `FRONTEND_URL`: フロントエンドURL（CORS用）

### Frontend環境変数（.env）
- `VITE_API_ENDPOINT`: API Gateway REST エンドポイント
- `VITE_WEBSOCKET_ENDPOINT`: API Gateway WebSocket エンドポイント
- `VITE_COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID`: Cognito App Client ID
- `VITE_STRIPE_PREMIUM_PRICE_ID`: Stripe Premium Plan Price ID

## モニタリング

### CloudWatch Logs

#### Lambda関数ログ確認
```bash
# 特定Lambda関数の最新ログ
aws logs tail /aws/lambda/Connect40-Api-dev-CreateActivityFunction \
  --follow --format short

# エラーログのみフィルタ
aws logs filter-log-events \
  --log-group-name /aws/lambda/Connect40-Api-dev-CreateActivityFunction \
  --filter-pattern "ERROR"
```

#### API Gatewayログ
```bash
# API Gatewayアクセスログ
aws logs tail /aws/apigateway/Connect40-Api-dev --follow
```

### CloudWatch Metrics

主要メトリクス:
- Lambda: `Invocations`, `Errors`, `Duration`, `Throttles`
- API Gateway: `Count`, `Latency`, `4XXError`, `5XXError`
- DynamoDB: `ConsumedReadCapacityUnits`, `ConsumedWriteCapacityUnits`

## トラブルシューティング

### Lambda関数エラー

#### 症状: Lambda関数がタイムアウト
```bash
# CloudWatch Logsでタイムアウトログ確認
aws logs filter-log-events \
  --log-group-name /aws/lambda/[FUNCTION_NAME] \
  --filter-pattern "Task timed out"
```

**対処法**:
1. Lambda関数のタイムアウト設定を延長（CDKで`timeout`プロパティ）
2. 処理を最適化（不要なAPI呼び出し削減）
3. 外部APIの接続タイムアウト設定

#### 症状: Lambda関数のコールドスタート遅延
**対処法**:
1. Provisioned Concurrency設定（有料）
2. 依存関係の最小化
3. Lambda Layerの活用

### DynamoDB関連

#### 症状: スロットリングエラー
```bash
# DynamoDB Metricsでスロットリング確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=Connect40-Table-dev \
  --start-time 2026-02-14T00:00:00Z \
  --end-time 2026-02-14T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

**対処法**:
1. DynamoDBのキャパシティモード確認（オンデマンド推奨）
2. GSIのキャパシティ設定見直し
3. バッチ処理の分散

### WebSocket接続エラー

#### 症状: WebSocket接続が切れる
**対処法**:
1. ハートビート間隔確認（現在30秒）
2. API Gateway WebSocketの接続制限確認
3. クライアント側の再接続ロジック確認

### Stripe決済エラー

#### 症状: チェックアウトセッション作成失敗
**対処法**:
1. Stripe APIキーが正しいか確認
2. Price IDが存在するか確認
3. CloudWatch Logsでエラー詳細確認

## セキュリティ対応

### 依存関係の脆弱性チェック

```bash
# Backend
cd backend && npm audit

# Frontend
cd frontend && npm audit

# CDK
cd cdk && npm audit

# 自動修正
npm audit fix
```

### Cognitoユーザー管理

#### ユーザー削除
```bash
aws cognito-idp admin-delete-user \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username test@example.com
```

#### ユーザー無効化
```bash
aws cognito-idp admin-disable-user \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username test@example.com
```

## バックアップ・リストア

### DynamoDB

#### Point-in-Time Recovery (PITR)有効化
```bash
aws dynamodb update-continuous-backups \
  --table-name Connect40-Table-dev \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

#### オンデマンドバックアップ
```bash
aws dynamodb create-backup \
  --table-name Connect40-Table-dev \
  --backup-name Connect40-Backup-$(date +%Y%m%d)
```

### S3

S3のバージョニングは既に有効化されています（CDKで設定済み）。
削除されたファイルは復元可能です。

## パフォーマンス最適化

### フロントエンドバンドルサイズ削減

```bash
# バンドルサイズ分析
cd frontend
npm run build -- --mode production
npx vite-bundle-visualizer
```

### Lambda関数最適化

- 不要な依存関係の削除
- コード分割（機能ごとに分離）
- Lambda Layerで共通ライブラリ共有

### CloudFrontキャッシュ最適化

- 静的コンテンツのキャッシュTTL延長
- 圧縮有効化（gzip/brotli）
- オリジンシールド活用

## ログ保持期間

現在の設定（変更可能）:
- Lambda: 14日間
- API Gateway: 30日間
- CloudWatch custom metrics: 15ヶ月

変更方法:
```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/[FUNCTION_NAME] \
  --retention-in-days 30
```

## コスト管理

### 予算アラート設定

```bash
aws budgets create-budget \
  --account-id 863646532781 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

### コスト削減チェックリスト

- [ ] 未使用のLambda関数削除
- [ ] DynamoDBのオンデマンド課金活用
- [ ] CloudFrontのキャッシュ最適化
- [ ] S3ライフサイクルポリシー設定
- [ ] CloudWatch Logsの保持期間短縮

## 定期メンテナンス

### 週次
- CloudWatch Logsのエラー確認
- Lambda関数のパフォーマンス確認

### 月次
- 依存関係の更新（`npm update`）
- セキュリティパッチ適用
- コスト分析レビュー

### 四半期
- DynamoDBテーブルの最適化
- アーキテクチャレビュー
- セキュリティ監査
