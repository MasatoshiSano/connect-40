# Connect40 デプロイ状況

## 最終更新: 2026-02-14

## 開発環境 (dev)

### デプロイ済みスタック

#### 1. Auth Stack (Connect40-Auth-dev)
- **User Pool ID**: `ap-northeast-1_PVAJ2az5K`
- **Client ID**: `37grcsfgso7rssqr2cq5lcdkq4`
- **ステータス**: ✅ デプロイ済み

#### 2. Database Stack (Connect40-Database-dev)
- **Table Name**: `Connect40-Table-dev`
- **Table ARN**: `arn:aws:dynamodb:ap-northeast-1:863646532781:table/Connect40-Table-dev`
- **ステータス**: ✅ デプロイ済み

#### 3. Storage Stack (Connect40-Storage-dev)
- **Bucket Name**: `connect40-uploads-dev-863646532781`
- **ステータス**: ✅ デプロイ済み

#### 4. API Stack (Connect40-Api-dev)
- **API Endpoint**: `https://id2itnyrml.execute-api.ap-northeast-1.amazonaws.com/dev/`
- **Lambda Functions**: 13個（ユーザー、アクティビティ、チャット、決済）
- **ステータス**: ✅ デプロイ済み（決済機能含む）

#### 5. WebSocket Stack (Connect40-WebSocket-dev)
- **WebSocket Endpoint**: `wss://pbcffoe04f.execute-api.ap-northeast-1.amazonaws.com/dev`
- **Lambda Functions**: 4個（connect, disconnect, sendMessage, default）
- **ステータス**: ✅ デプロイ済み

#### 6. Frontend Stack (Connect40-Frontend-dev)
- **Frontend URL**: `https://d2s0k9gtsxu3ev.cloudfront.net`
- **S3 Bucket**: `connect40-frontend-dev-863646532781`
- **CloudFront Distribution**: `E356KF1HDDL8LL`
- **ステータス**: ✅ デプロイ済み（Toast・Skeleton対応）

#### 7. Monitoring Stack (Connect40-Monitoring-dev)
- **CloudWatch Dashboards**: 設定済み
- **ステータス**: ✅ デプロイ済み

## 実装済み機能

### Phase 1-3: 基盤 (100%完了)
- ✅ Cognito認証
- ✅ DynamoDB設計
- ✅ S3ストレージ
- ✅ API Gateway
- ✅ Lambda関数基盤

### Phase 4: チャット機能 (100%完了)
- ✅ WebSocket API Gateway
- ✅ リアルタイムメッセージング
- ✅ チャットルーム管理
- ✅ 接続管理・ハートビート

### Phase 5: 決済・使用量制限 (100%完了)
- ✅ Stripe統合（Checkout, Webhook, Portal）
- ✅ 使用量制限（無料: 5活動/月, 3チャット; プレミアム: 無制限）
- ✅ サブスクリプション管理

### Phase 6: UI/UX改善 (主要機能完了)
- ✅ Toastコンポーネント（通知システム）
- ✅ Skeletonコンポーネント（ローディング）
- ⚠️ レスポンシブ対応（基本実装済み、詳細調整は継続）
- ⚠️ Serendieブランドガイドライン適用（部分的）

### Phase 7: テスト・デプロイ (進行中)
- ✅ セキュリティ監査（脆弱性: 0件）
- ⚠️ E2Eテスト（未実装）
- ⚠️ CI/CD（未実装）
- ⚠️ 本番環境（未設定）

## テストユーザー

### Dev環境テストユーザー
- **Email**: `test@example.com`
- **Password**: （Cognitoで設定済み）

## 環境変数

### 必須設定（本番環境用）

#### Stripe
- `STRIPE_SECRET_KEY`: Stripe Secret Key（現在: ダミー値）
- `STRIPE_WEBHOOK_SECRET`: Webhook Secret（現在: ダミー値）
- `VITE_STRIPE_PREMIUM_PRICE_ID`: Premium Plan Price ID（未設定）

#### Frontend
- `VITE_API_ENDPOINT`: APIエンドポイント ✅
- `VITE_WEBSOCKET_ENDPOINT`: WebSocketエンドポイント ✅
- `VITE_COGNITO_USER_POOL_ID`: ✅
- `VITE_COGNITO_CLIENT_ID`: ✅

## 未実装項目

### 高優先度
1. **Stripe本番設定**: 実際のAPIキーとPrice IDの設定
2. **ドメイン設定**: 独自ドメイン・SSL証明書
3. **E2Eテスト**: Playwrightでの主要フロー検証

### 中優先度
4. **CI/CD**: GitHub Actionsでの自動デプロイ
5. **モニタリングアラート**: CloudWatch Alarmsの詳細設定
6. **本番環境**: Prodスタックのデプロイ

### 低優先度
7. **パフォーマンス最適化**: Lambda cold start、bundle size
8. **ユーザーガイド**: エンドユーザー向けドキュメント

## 次のステップ

1. **Stripe設定**
   - Stripeアカウント作成
   - Product・Price作成
   - 環境変数更新・再デプロイ

2. **ドメイン設定**
   - Route 53でドメイン設定
   - ACMでSSL証明書発行
   - CloudFrontにカスタムドメイン適用

3. **テスト実装**
   - Playwrightセットアップ
   - 主要ユーザーフローのE2Eテスト作成

4. **CI/CD構築**
   - GitHub Actionsワークフロー作成
   - 自動テスト・デプロイパイプライン

5. **本番リリース**
   - Prod環境スタック作成
   - データベース移行計画
   - ロールバック計画

## コスト概算（Dev環境）

### 月額推定コスト
- **Lambda**: $5-10（リクエスト数に依存）
- **DynamoDB**: $5-15（読み取り/書き込み量に依存）
- **API Gateway**: $5-10
- **CloudFront**: $1-5
- **S3**: $1-3
- **Cognito**: 無料枠内（MAU 50,000まで）
- **CloudWatch**: $5-10

**合計**: 約 $22-53/月

### コスト削減施策
- 未使用時のLambda関数削除
- DynamoDBのオンデマンド課金活用
- CloudFrontのキャッシュ最適化

## セキュリティ

### 実施済み
- ✅ HTTPS通信（CloudFront）
- ✅ Cognito JWT認証
- ✅ API GatewayオーソライザーCORS設定
- ✅ DynamoDB暗号化（デフォルト）
- ✅ S3暗号化（デフォルト）
- ✅ 依存関係脆弱性スキャン（0件）

### 未実施
- ⚠️ WAF設定（本番環境で推奨）
- ⚠️ Secrets Managerでの機密情報管理
- ⚠️ VPC Endpoints（コスト削減）
- ⚠️ GuardDuty有効化

## サポート

### 問題発生時
1. CloudWatch Logsで該当Lambda関数のログ確認
2. API GatewayのCloudWatch Metricsで HTTPステータス確認
3. DynamoDB Metricsでスロットリング確認

### 開発者連絡先
- プロジェクトリポジトリ: （GitHub URLを記載）
- 技術スタック: AWS CDK, React 19, TypeScript, Tailwind CSS
