# Phase 5: 決済・プレミアム機能実装TODO

## 概要
Stripe統合によるサブスクリプション決済の実装

## 実装が必要な項目

### Backend

#### 1. Stripe統合
- `backend/functions/payment/createCheckoutSession.ts` - チェックアウトセッション作成
- `backend/functions/payment/createPortalSession.ts` - カスタマーポータルセッション作成
- `backend/functions/payment/webhook.ts` - Stripeウェブフック処理
- `backend/functions/payment/getSubscription.ts` - サブスクリプション情報取得

#### 2. 環境変数
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxx
```

#### 3. DynamoDB設計
Subscription:
- PK: `USER#{userId}`
- SK: `SUBSCRIPTION`
- stripeCustomerId, subscriptionId, status, currentPeriodEnd

### Frontend

#### 1. サブスクリプションページ
- `frontend/src/pages/subscription/Plans.tsx` - プラン選択
- `frontend/src/pages/subscription/Success.tsx` - 決済成功
- `frontend/src/pages/subscription/Cancel.tsx` - 決済キャンセル
- `frontend/src/pages/subscription/Manage.tsx` - サブスクリプション管理

#### 2. Stripe Elements統合
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
```

#### 3. プレミアム機能制限
- 無料プラン: 月5アクティビティ参加、チャット3件まで
- プレミアムプラン: 無制限

### CDK

#### 1. 環境変数設定
- Stripe APIキーをSecretsManagerに保存
- Lambda関数に環境変数設定

## 料金プラン

### 無料プラン
- 月額: ¥0
- アクティビティ参加: 月5回まで
- チャットルーム: 3件まで
- プロフィール写真: 1枚

### プレミアムプラン
- 月額: ¥980
- アクティビティ参加: 無制限
- チャットルーム: 無制限
- プロフィール写真: 5枚
- 検索フィルター: 詳細フィルター利用可
- バッジ表示: プレミアムバッジ

## 実装手順

1. Stripeアカウント作成・製品設定
2. Webhook endpoint設定
3. Backend Lambda関数実装
4. Frontend UI実装
5. テスト（Stripe Test Mode）
6. 本番環境設定

## 参考
- Stripe Checkout: https://stripe.com/docs/payments/checkout
- Stripe Customer Portal: https://stripe.com/docs/billing/subscriptions/customer-portal
- Stripe Webhooks: https://stripe.com/docs/webhooks
