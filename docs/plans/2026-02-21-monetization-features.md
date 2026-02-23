# Monetization Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 3つの収益化機能を実装する：(1) 本人確認（1,000円一回限り）、(2) アクティビティ有料化（参加費設定）、(3) 未確認ユーザーのチャット制限

**Architecture:**
- 本人確認: 書類S3アップロード → Stripe Checkout (mode: payment, 1,000円) → webhook後DynamoDB更新 → admin承認
- アクティビティ有料化: 参加費設定 → 参加時Stripe Checkout → webhook後自動join
- チャット制限: sendMessage Lambda + フロントエンドで verificationStatus === 'approved' チェック

**Tech Stack:** AWS Lambda (Node.js 20.x TypeScript), DynamoDB (single-table), Stripe (checkout, webhooks), React 19, Zustand, Tailwind CSS

---

## DynamoDB キー設計

```
本人確認レコード:
  PK: USER#<userId>
  SK: VERIFICATION
  Fields: documentUrl, paymentStatus (payment_pending|pending|approved|rejected),
          submittedAt, reviewedAt, reviewNote, stripeSessionId

アクティビティ支払い記録:
  PK: ACTIVITY#<activityId>
  SK: PAYMENT#<userId>
  Fields: amount, status (paid), paidAt, stripeSessionId

ユーザーPROFILEの変更:
  verificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected'
  (既存は 'pending'|'approved'|'rejected' → 'unverified' を追加)
```

---

## Feature 1: 本人確認システム

### Task 1: 型定義の更新

**Files:**
- Modify: `backend/types/index.ts`
- Modify: `frontend/src/types/activity.ts` (存在確認後)

**Step 1: backend/types/index.ts の verificationStatus を更新**

```typescript
// 変更前
verificationStatus: 'pending' | 'approved' | 'rejected';

// 変更後
verificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
```

**Step 2: VerificationRecord 型を追加**

```typescript
export interface VerificationRecord {
  userId: string;
  documentUrl: string;
  paymentStatus: 'payment_pending' | 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  stripeSessionId?: string;
}
```

**Step 3: Activity 型に entryFee を追加**

```typescript
export interface Activity {
  // ... 既存フィールド ...
  entryFee?: number; // 円単位, 0 or undefined = 無料
}
```

**Step 4: 変更をコンパイル確認**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/backend && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add backend/types/index.ts
git commit -m "feat: add verification types and entryFee to Activity"
```

---

### Task 2: getPresignedUrl に verification uploadType を追加

**Files:**
- Modify: `backend/functions/uploads/getPresignedUrl.ts`

**Step 1: uploadType に 'verification' を追加**

```typescript
// 変更前
interface GetPresignedUrlInput {
  fileName: string;
  fileType: string;
  uploadType: 'profile' | 'activity';
}

// 変更後
interface GetPresignedUrlInput {
  fileName: string;
  fileType: string;
  uploadType: 'profile' | 'activity' | 'verification';
}
```

**Step 2: バリデーション更新（2箇所）**

```typescript
// ALLOWED_IMAGE_TYPES に PDF を追加（身分証はPDFの場合も）
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

// ALLOWED_EXTENSIONS
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

// バリデーション
if (!['profile', 'activity', 'verification'].includes(uploadType)) {
  return errorResponse(400, 'uploadType must be "profile", "activity", or "verification"');
}
```

**Step 3: Commit**

```bash
git add backend/functions/uploads/getPresignedUrl.ts
git commit -m "feat: add verification upload type to presigned URL"
```

---

### Task 3: 本人確認 checkout Lambda 作成

**Files:**
- Create: `backend/functions/verification/createCheckout.ts`

**Step 1: ファイル作成**

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const FRONTEND_URL = process.env.FRONTEND_URL!;
const VERIFICATION_PRICE_YEN = 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * POST /verification/checkout
 * 本人確認の支払いセッションを作成する
 * Body: { documentUrl: string, email: string }
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { documentUrl, email } = body as { documentUrl: string; email: string };

    if (!documentUrl || !email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'documentUrl and email are required' }) };
    }

    // すでに承認済みならエラー
    const existing = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'VERIFICATION' },
    }));
    if (existing.Item?.paymentStatus === 'approved') {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Already verified' }) };
    }

    // Stripe Checkout セッション作成 (一回限り支払い)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: VERIFICATION_PRICE_YEN,
          product_data: {
            name: '本人確認',
            description: '本人確認審査手数料（一回限り）',
          },
        },
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/profile/verification/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/profile/verification`,
      metadata: {
        type: 'verification',
        userId,
        documentUrl,
      },
      customer_email: email,
    });

    // DynamoDB に支払い待ちレコードを保存
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: 'VERIFICATION',
        documentUrl,
        paymentStatus: 'payment_pending',
        stripeSessionId: session.id,
        submittedAt: new Date().toISOString(),
      },
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Error creating verification checkout:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};
```

**Step 2: Commit**

```bash
git add backend/functions/verification/createCheckout.ts
git commit -m "feat: add verification checkout Lambda"
```

---

### Task 4: 本人確認ステータス取得 Lambda

**Files:**
- Create: `backend/functions/verification/getStatus.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
};

/**
 * GET /verification/status
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const result = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'VERIFICATION' },
    }));

    if (!result.Item) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ data: { status: 'unverified' } }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        data: {
          status: result.Item.paymentStatus,
          submittedAt: result.Item.submittedAt,
          reviewedAt: result.Item.reviewedAt,
          reviewNote: result.Item.reviewNote,
        },
      }),
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
```

**Commit:**
```bash
git add backend/functions/verification/getStatus.ts
git commit -m "feat: add verification status Lambda"
```

---

### Task 5: Admin 承認・却下 Lambda

**Files:**
- Create: `backend/functions/verification/approve.ts`
- Create: `backend/functions/verification/reject.ts`

**approve.ts:**

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * POST /verification/approve
 * Body: { targetUserId: string }
 * Admin only - ADMIN_USER_IDS env var で制御
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const adminUserId = event.requestContext.authorizer?.claims?.sub;
    if (!adminUserId || !ADMIN_USER_IDS.includes(adminUserId)) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { targetUserId } = body as { targetUserId: string };
    if (!targetUserId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'targetUserId is required' }) };
    }

    const now = new Date().toISOString();

    // VERIFICATION レコード更新
    await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${targetUserId}`, SK: 'VERIFICATION' },
      UpdateExpression: 'SET paymentStatus = :status, reviewedAt = :now',
      ExpressionAttributeValues: { ':status': 'approved', ':now': now },
    }));

    // USER PROFILE の verificationStatus 更新
    await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${targetUserId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET verificationStatus = :status, updatedAt = :now',
      ExpressionAttributeValues: { ':status': 'approved', ':now': now },
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ data: { success: true } }),
    };
  } catch (error) {
    console.error('Error approving verification:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
```

**reject.ts (approve.ts と同様、statusを 'rejected' に):**

```typescript
// approve.ts と同じ構造で、以下を変更:
// - UpdateExpression に reviewNote も含める
// Body: { targetUserId: string, reviewNote?: string }
// ':status': 'rejected', ':note': reviewNote || ''
// UpdateExpression: 'SET paymentStatus = :status, reviewedAt = :now, reviewNote = :note'
// USER PROFILE: verificationStatus = 'rejected'
```

**Commit:**
```bash
git add backend/functions/verification/approve.ts backend/functions/verification/reject.ts
git commit -m "feat: add admin verification approve/reject Lambdas"
```

---

### Task 6: webhook.ts に本人確認ハンドラーを追加

**Files:**
- Modify: `backend/functions/payment/webhook.ts`

**Step 1: checkout.session.completed の case を更新**

```typescript
case 'checkout.session.completed': {
  const session = stripeEvent.data.object as Stripe.Checkout.Session;
  const type = session.metadata?.type;

  if (type === 'verification') {
    await handleVerificationCheckoutCompleted(session);
  } else {
    await handleCheckoutCompleted(session);
  }
  break;
}
```

**Step 2: handleVerificationCheckoutCompleted を追加**

```typescript
async function handleVerificationCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in verification session metadata');
    return;
  }

  const now = new Date().toISOString();

  // VERIFICATION レコードを 'pending'（admin審査待ち）に更新
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'VERIFICATION' },
      UpdateExpression: 'SET paymentStatus = :status, paidAt = :now',
      ExpressionAttributeValues: {
        ':status': 'pending',
        ':now': now,
      },
    })
  );

  // USER PROFILE の verificationStatus も 'pending' に
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET verificationStatus = :status, updatedAt = :now',
      ExpressionAttributeValues: {
        ':status': 'pending',
        ':now': now,
      },
    })
  );

  console.log(`Verification payment received for user ${userId}, awaiting admin review`);
}
```

**Commit:**
```bash
git add backend/functions/payment/webhook.ts
git commit -m "feat: handle verification payment in webhook"
```

---

### Task 7: CDK api-stack.ts に本人確認エンドポイントを追加

**Files:**
- Modify: `cdk/lib/stacks/api-stack.ts`

**Step 1: 本人確認 Lambda 関数を追加（既存の payment セクションの後に）**

```typescript
// Verification Lambda functions
const verificationEnv = {
  TABLE_NAME: props.table.tableName,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  FRONTEND_URL: frontendUrl,
};

const createVerificationCheckoutFunction = new NodejsFunction(this, 'CreateVerificationCheckout', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: path.join(__dirname, '../../../backend/functions/verification/createCheckout.ts'),
  environment: verificationEnv,
  bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
  timeout: cdk.Duration.seconds(30),
});

const getVerificationStatusFunction = new NodejsFunction(this, 'GetVerificationStatus', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: path.join(__dirname, '../../../backend/functions/verification/getStatus.ts'),
  environment: { TABLE_NAME: props.table.tableName },
  bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
  timeout: cdk.Duration.seconds(10),
});

const approveVerificationFunction = new NodejsFunction(this, 'ApproveVerification', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: path.join(__dirname, '../../../backend/functions/verification/approve.ts'),
  environment: {
    TABLE_NAME: props.table.tableName,
    ADMIN_USER_IDS: process.env.ADMIN_USER_IDS || '',
  },
  bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
  timeout: cdk.Duration.seconds(10),
});

const rejectVerificationFunction = new NodejsFunction(this, 'RejectVerification', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: path.join(__dirname, '../../../backend/functions/verification/reject.ts'),
  environment: {
    TABLE_NAME: props.table.tableName,
    ADMIN_USER_IDS: process.env.ADMIN_USER_IDS || '',
  },
  bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
  timeout: cdk.Duration.seconds(10),
});

// Permissions
props.table.grantReadWriteData(createVerificationCheckoutFunction);
props.table.grantReadData(getVerificationStatusFunction);
props.table.grantReadWriteData(approveVerificationFunction);
props.table.grantReadWriteData(rejectVerificationFunction);

this.functions.push(
  createVerificationCheckoutFunction,
  getVerificationStatusFunction,
  approveVerificationFunction,
  rejectVerificationFunction,
);
```

**Step 2: API ルートを追加**

```typescript
// Verification API Routes
const verification = this.api.root.addResource('verification');

// POST /verification/checkout
const verificationCheckout = verification.addResource('checkout');
verificationCheckout.addMethod('POST', new apigateway.LambdaIntegration(createVerificationCheckoutFunction), {
  authorizer: this.authorizer,
});

// GET /verification/status
const verificationStatus = verification.addResource('status');
verificationStatus.addMethod('GET', new apigateway.LambdaIntegration(getVerificationStatusFunction), {
  authorizer: this.authorizer,
});

// POST /verification/approve (admin)
const verificationApprove = verification.addResource('approve');
verificationApprove.addMethod('POST', new apigateway.LambdaIntegration(approveVerificationFunction), {
  authorizer: this.authorizer,
});

// POST /verification/reject (admin)
const verificationReject = verification.addResource('reject');
verificationReject.addMethod('POST', new apigateway.LambdaIntegration(rejectVerificationFunction), {
  authorizer: this.authorizer,
});
```

**Step 3: CDK コンパイル確認**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/cdk && npx tsc
```

**Commit:**
```bash
git add cdk/lib/stacks/api-stack.ts cdk/lib/stacks/api-stack.js cdk/lib/stacks/api-stack.d.ts
git commit -m "feat: add verification API endpoints to CDK stack"
```

---

### Task 8: フロントエンド - 本人確認ページ

**Files:**
- Create: `frontend/src/pages/profile/VerificationPage.tsx`
- Create: `frontend/src/pages/profile/VerificationSuccess.tsx`
- Modify: `frontend/src/services/api.ts` (verification API calls 追加)
- Modify: `frontend/src/App.tsx` (ルート追加)

**Step 1: api.ts に verification 関数を追加**

```typescript
// api.ts の末尾に追加

export interface VerificationStatus {
  status: 'unverified' | 'payment_pending' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export async function getVerificationStatus(): Promise<VerificationStatus> {
  return fetchWithAuth<VerificationStatus>('/verification/status');
}

export async function createVerificationCheckout(data: {
  documentUrl: string;
  email: string;
}): Promise<{ sessionId: string; url: string }> {
  return fetchWithAuth('/verification/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Step 2: VerificationPage.tsx 作成**

3ステップのUI:
1. 「書類をアップロード」 → presigned URL でS3へ
2. 「1,000円で本人確認を申請する」ボタン → Stripe Checkout へリダイレクト
3. ステータス表示（未申請/審査待ち/承認済み/却下）

```typescript
import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { useAuthStore } from '../../stores/auth';
import { getVerificationStatus, createVerificationCheckout, VerificationStatus } from '../../services/api';
import { getPresignedUploadUrl, uploadFileToS3 } from '../../services/upload'; // 既存のアップロードサービス

export const VerificationPage = () => {
  const { idToken } = useAuthStore();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    getVerificationStatus().then(setStatus).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // presigned URL 取得
      const { presignedUrl, publicUrl } = await fetchWithAuth<{ presignedUrl: string; publicUrl: string }>(
        '/uploads/presigned-url',
        {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            uploadType: 'verification',
          }),
        }
      );
      // S3 へアップロード
      await fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setDocumentUrl(publicUrl);
    } catch (err) {
      setError('アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handlePayment = async () => {
    if (!documentUrl) return;
    setIsProcessing(true);
    setError(null);
    try {
      // JWT からメールアドレスを取得
      const payload = JSON.parse(atob(idToken!.split('.')[1]));
      const email = payload.email;
      const { url } = await createVerificationCheckout({ documentUrl, email });
      window.location.href = url;
    } catch (err) {
      setError('決済の開始に失敗しました');
      setIsProcessing(false);
    }
  };

  // ステータスに応じた表示
  const renderStatus = () => {
    switch (status?.status) {
      case 'approved':
        return (
          <div className="text-center py-12">
            <Icon name="verified" className="text-gold !text-[64px] mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-text-primary dark:text-text-dark-primary mb-2">本人確認済み</h2>
            <p className="text-text-secondary dark:text-text-dark-secondary">チャット機能をご利用いただけます</p>
          </div>
        );
      case 'pending':
        return (
          <div className="text-center py-12">
            <Icon name="hourglass_empty" className="text-gold !text-[64px] mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-text-primary dark:text-text-dark-primary mb-2">審査中</h2>
            <p className="text-text-secondary dark:text-text-dark-secondary">通常2〜3営業日で審査が完了します</p>
          </div>
        );
      case 'rejected':
        return (
          <div className="text-center py-12">
            <Icon name="cancel" className="text-red-400 !text-[64px] mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-text-primary dark:text-text-dark-primary mb-2">審査却下</h2>
            {status.reviewNote && (
              <p className="text-text-secondary dark:text-text-dark-secondary">{status.reviewNote}</p>
            )}
          </div>
        );
      default:
        return renderApplicationForm();
    }
  };

  const renderApplicationForm = () => (
    <div className="max-w-lg mx-auto">
      {/* ステップ1: 書類アップロード */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-serif text-gold/40">01</span>
          <h3 className="font-serif text-lg text-text-primary dark:text-text-dark-primary">身分証をアップロード</h3>
        </div>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
          運転免許証・マイナンバーカード・パスポートのいずれか
        </p>
        <input type="file" accept="image/*,application/pdf" onChange={handleFileChange}
          className="w-full text-text-secondary dark:text-text-dark-secondary text-sm" />
        {file && !documentUrl && (
          <button onClick={handleUpload} disabled={uploading}
            className="mt-3 px-6 py-2 border border-gold text-gold hover:bg-gold/10 transition text-sm disabled:opacity-50">
            {uploading ? 'アップロード中...' : 'アップロード'}
          </button>
        )}
        {documentUrl && (
          <p className="mt-2 text-sm text-green-subtle flex items-center gap-1">
            <Icon name="check_circle" /> アップロード完了
          </p>
        )}
      </div>

      {/* ステップ2: 支払い */}
      <div className="border-t border-border-light dark:border-border-dark pt-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-serif text-gold/40">02</span>
          <h3 className="font-serif text-lg text-text-primary dark:text-text-dark-primary">審査手数料を支払う</h3>
        </div>
        <div className="mb-6 p-4 bg-gold/5 border border-gold/20">
          <p className="text-3xl font-serif text-gold">¥1,000</p>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">一回限り・返金不可</p>
        </div>
        <button onClick={handlePayment} disabled={!documentUrl || isProcessing}
          className="w-full py-4 border border-gold text-gold hover:bg-gold/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
          {isProcessing ? '処理中...' : '本人確認を申請する（¥1,000）'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
    </div>
  );

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <span className="section-label">IDENTITY VERIFICATION</span>
            <h1 className="font-serif font-light text-3xl tracking-ryokan mt-2 text-text-primary dark:text-text-dark-primary">
              本人確認
            </h1>
            <p className="mt-4 text-text-secondary dark:text-text-dark-secondary">
              本人確認を完了すると、チャット機能が利用可能になります
            </p>
          </div>
          {status ? renderStatus() : <p className="text-text-secondary">読み込み中...</p>}
        </div>
      </div>
    </Layout>
  );
};
```

**Step 3: VerificationSuccess.tsx 作成（支払い後のリダイレクト先）**

```typescript
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { Link } from 'react-router-dom';

export const VerificationSuccess = () => (
  <Layout isAuthenticated={true}>
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <Icon name="hourglass_empty" className="text-gold !text-[64px] mx-auto mb-6" />
        <h1 className="font-serif text-3xl text-text-primary dark:text-text-dark-primary mb-4">
          ありがとうございます
        </h1>
        <p className="text-text-secondary dark:text-text-dark-secondary mb-8">
          書類を受け付けました。通常2〜3営業日で審査が完了します。
        </p>
        <Link to="/dashboard"
          className="px-8 py-3 border border-gold text-gold hover:bg-gold/10 transition">
          ダッシュボードへ
        </Link>
      </div>
    </div>
  </Layout>
);
```

**Step 4: App.tsx にルートを追加**

```typescript
// 既存のlazy importsに追加
const VerificationPage = lazy(() => import('./pages/profile/VerificationPage').then(m => ({ default: m.VerificationPage })));
const VerificationSuccess = lazy(() => import('./pages/profile/VerificationSuccess').then(m => ({ default: m.VerificationSuccess })));

// ProtectedRoute 内に追加
<Route path="/profile/verification" element={<VerificationPage />} />
<Route path="/profile/verification/success" element={<VerificationSuccess />} />
```

**Step 5: TypeScript チェック**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npx tsc --noEmit
```

**Commit:**
```bash
git add frontend/src/pages/profile/VerificationPage.tsx frontend/src/pages/profile/VerificationSuccess.tsx frontend/src/services/api.ts frontend/src/App.tsx
git commit -m "feat: add verification page and success page"
```

---

## Feature 2: 未確認ユーザーのチャット制限

### Task 9: バックエンド - sendMessage で verificationStatus チェック

**Files:**
- Modify: `backend/functions/websocket/sendMessage.ts`

**Step 1: ユーザーレコードを取得してverificationStatusをチェック**

```typescript
// sendMessage.ts の handler 内、メッセージ保存の前に追加

// 送信者の verificationStatus を確認
const userResult = await ddb.send(new GetCommand({
  TableName: TABLE_NAME,
  Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
}));

if (!userResult.Item) {
  await apigw.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: JSON.stringify({ type: 'error', message: 'User not found' }),
  }));
  return { statusCode: 404, body: 'User not found' };
}

if (userResult.Item.verificationStatus !== 'approved') {
  await apigw.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: JSON.stringify({
      type: 'error',
      code: 'VERIFICATION_REQUIRED',
      message: '本人確認が必要です。プロフィールから本人確認を行ってください。',
    }),
  }));
  return { statusCode: 403, body: 'Verification required' };
}
```

**Commit:**
```bash
git add backend/functions/websocket/sendMessage.ts
git commit -m "feat: require verification to send chat messages"
```

---

### Task 10: フロントエンド - チャット入力のブロック表示

**Files:**
- Modify: `frontend/src/components/chat/MessageInput.tsx`
- Modify: `frontend/src/stores/auth.ts` (verificationStatus を格納)

**Step 1: auth store に verificationStatus を追加**

```typescript
// auth.ts の UserState に追加
verificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
```

ログイン時・プロフィール取得時に verificationStatus をストアにセット。

**Step 2: MessageInput.tsx で verificationStatus チェック**

```typescript
// MessageInput.tsx
import { useAuthStore } from '../../stores/auth';
import { Link } from 'react-router-dom';

const { verificationStatus } = useAuthStore();

if (verificationStatus !== 'approved') {
  return (
    <div className="p-4 border-t border-border-light dark:border-border-dark">
      <div className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20">
        <Icon name="lock" className="text-gold flex-shrink-0" />
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
          チャットを利用するには{' '}
          <Link to="/profile/verification" className="text-gold underline underline-offset-2">
            本人確認
          </Link>
          が必要です
        </p>
      </div>
    </div>
  );
}
```

**Commit:**
```bash
git add frontend/src/components/chat/MessageInput.tsx frontend/src/stores/auth.ts
git commit -m "feat: show verification prompt in chat when not verified"
```

---

## Feature 3: アクティビティ有料化

### Task 11: Activity 型と create/update Lambda に entryFee を追加

**Files:**
- Modify: `backend/functions/activities/create.ts`
- Modify: `backend/functions/activities/update.ts`

**Step 1: create.ts に entryFee を追加**

```typescript
// body のパースに追加
const { title, description, category, location, dateTime, duration, maxParticipants, tags, recurrence, entryFee } = body;

// entryFee のバリデーション
const fee = typeof entryFee === 'number' && entryFee >= 0 ? Math.floor(entryFee) : 0;

// DynamoDB PutItem に追加
entryFee: fee,
```

**Step 2: update.ts も同様に entryFee 対応**

**Commit:**
```bash
git add backend/functions/activities/create.ts backend/functions/activities/update.ts
git commit -m "feat: add entryFee to activity create/update"
```

---

### Task 12: アクティビティ join-checkout Lambda 作成

**Files:**
- Create: `backend/functions/activities/joinCheckout.ts`

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' });
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const FRONTEND_URL = process.env.FRONTEND_URL!;
const PLATFORM_FEE_PERCENT = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

/**
 * POST /activities/{id}/join-checkout
 * 有料アクティビティの支払いセッション作成
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const activityId = event.pathParameters?.id;
    if (!activityId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Activity ID required' }) };
    }

    // アクティビティ取得
    const activityResult = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
    }));

    if (!activityResult.Item) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Activity not found' }) };
    }

    const activity = activityResult.Item;
    const entryFee: number = activity.entryFee || 0;

    if (entryFee <= 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'This activity is free. Use the regular join endpoint.' }) };
    }

    // JWT からメール取得
    const body = JSON.parse(event.body || '{}');
    const { email } = body as { email: string };
    if (!email) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'email is required' }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: entryFee,
          product_data: {
            name: activity.title,
            description: `${activity.title} への参加費`,
          },
        },
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/activities/${activityId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/activities/${activityId}`,
      metadata: {
        type: 'activity_join',
        activityId,
        userId,
      },
      customer_email: email,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Error creating activity join checkout:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
```

**Commit:**
```bash
git add backend/functions/activities/joinCheckout.ts
git commit -m "feat: add activity join-checkout Lambda"
```

---

### Task 13: webhook.ts に activity_join ハンドラーを追加

**Files:**
- Modify: `backend/functions/payment/webhook.ts`

**Step 1: checkout.session.completed の type 分岐に activity_join を追加**

```typescript
if (type === 'verification') {
  await handleVerificationCheckoutCompleted(session);
} else if (type === 'activity_join') {
  await handleActivityJoinCheckoutCompleted(session);
} else {
  await handleCheckoutCompleted(session);
}
```

**Step 2: handleActivityJoinCheckoutCompleted 追加**

```typescript
async function handleActivityJoinCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { activityId, userId } = session.metadata || {};
  if (!activityId || !userId) {
    console.error('Missing activityId or userId in activity_join session metadata');
    return;
  }

  const now = new Date().toISOString();

  // アクティビティ取得
  const activityResult = await ddbDocClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
  }));

  if (!activityResult.Item) {
    console.error(`Activity ${activityId} not found`);
    return;
  }

  const activity = activityResult.Item;
  const participants: string[] = activity.participants || [];

  if (participants.includes(userId)) {
    console.log(`User ${userId} already joined activity ${activityId}`);
    return;
  }

  // 支払い記録保存
  await ddbDocClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `ACTIVITY#${activityId}`,
      SK: `PAYMENT#${userId}`,
      amount: session.amount_total,
      stripeSessionId: session.id,
      status: 'paid',
      paidAt: now,
    },
  }));

  // アクティビティに参加者追加
  await ddbDocClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `ACTIVITY#${activityId}`, SK: 'METADATA' },
    UpdateExpression: 'SET participants = list_append(participants, :userId), currentParticipants = currentParticipants + :one, updatedAt = :now',
    ExpressionAttributeValues: {
      ':userId': [userId],
      ':one': 1,
      ':now': now,
    },
    ConditionExpression: 'currentParticipants < maxParticipants',
  }));

  console.log(`User ${userId} successfully joined activity ${activityId} via payment`);
}
```

必要な import を追加:
```typescript
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
```

**Commit:**
```bash
git add backend/functions/payment/webhook.ts
git commit -m "feat: handle activity join payment in webhook"
```

---

### Task 14: CDK に join-checkout エンドポイントを追加

**Files:**
- Modify: `cdk/lib/stacks/api-stack.ts`

```typescript
const joinCheckoutFunction = new NodejsFunction(this, 'ActivityJoinCheckout', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: path.join(__dirname, '../../../backend/functions/activities/joinCheckout.ts'),
  environment: {
    TABLE_NAME: props.table.tableName,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    FRONTEND_URL: frontendUrl,
  },
  bundling: { minify: true, sourceMap: true, externalModules: ['@aws-sdk/*'], forceDockerBundling: false },
  timeout: cdk.Duration.seconds(30),
});

props.table.grantReadWriteData(joinCheckoutFunction);
this.functions.push(joinCheckoutFunction);

// POST /activities/{id}/join-checkout
const activityJoinCheckout = activityById.addResource('join-checkout');
activityJoinCheckout.addMethod('POST', new apigateway.LambdaIntegration(joinCheckoutFunction), {
  authorizer: this.authorizer,
});
```

**CDK コンパイル確認:**
```bash
cd /mnt/c/Users/masat/AllApps/Connect40/cdk && npx tsc
```

**Commit:**
```bash
git add cdk/lib/stacks/api-stack.ts cdk/lib/stacks/api-stack.js cdk/lib/stacks/api-stack.d.ts
git commit -m "feat: add activity join-checkout endpoint to CDK stack"
```

---

### Task 15: フロントエンド - CreateActivity に参加費フィールド追加

**Files:**
- Modify: `frontend/src/pages/activities/CreateActivity.tsx`
- Modify: `frontend/src/types/activity.ts`

**Step 1: activity.ts に entryFee を追加**

```typescript
export interface Activity {
  // ... 既存フィールド ...
  entryFee?: number;
}
```

**Step 2: CreateActivity フォームに参加費入力を追加**

```typescript
// formState に entryFee 追加
const [entryFee, setEntryFee] = useState<number>(0);

// フォームに追加（「開催日時」フィールドの近くに）
<div>
  <label className="block text-sm text-text-secondary dark:text-text-dark-secondary mb-1">
    参加費（円）<span className="ml-1 text-text-muted">※0円で無料</span>
  </label>
  <input
    type="number"
    min={0}
    step={100}
    value={entryFee}
    onChange={e => setEntryFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
    className="input"
    placeholder="0"
  />
</div>

// submit 時に entryFee を含める
body: JSON.stringify({ ..., entryFee }),
```

**Commit:**
```bash
git add frontend/src/pages/activities/CreateActivity.tsx frontend/src/types/activity.ts
git commit -m "feat: add entry fee field to create activity form"
```

---

### Task 16: ActivityDetail に有料参加フロー

**Files:**
- Modify: `frontend/src/pages/activities/ActivityDetail.tsx`
- Create: `frontend/src/pages/activities/ActivityPaymentSuccess.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: ActivityDetail の「参加する」ボタンを有料対応**

```typescript
// entryFee > 0 の場合は join-checkout API を呼ぶ
const handleJoin = async () => {
  if (activity.entryFee && activity.entryFee > 0) {
    // 有料参加フロー
    const payload = JSON.parse(atob(idToken!.split('.')[1]));
    const { url } = await fetchWithAuth<{ url: string }>(`/activities/${activityId}/join-checkout`, {
      method: 'POST',
      body: JSON.stringify({ email: payload.email }),
    });
    window.location.href = url;
  } else {
    // 無料参加（既存フロー）
    await joinActivity(activityId!);
    setIsJoined(true);
  }
};
```

参加費の表示（アクティビティ詳細画面）:
```typescript
{activity.entryFee && activity.entryFee > 0 && (
  <div className="flex items-center gap-2 text-gold">
    <Icon name="payments" />
    <span className="font-serif text-xl">¥{activity.entryFee.toLocaleString()}</span>
    <span className="text-sm text-text-secondary dark:text-text-dark-secondary">参加費</span>
  </div>
)}
```

**Step 2: ActivityPaymentSuccess.tsx 作成**

```typescript
import { Layout } from '../../components/layout/Layout';
import { Icon } from '../../components/ui/Icon';
import { Link, useParams } from 'react-router-dom';

export const ActivityPaymentSuccess = () => {
  const { id } = useParams();
  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Icon name="check_circle" className="text-gold !text-[64px] mx-auto mb-6" />
          <h1 className="font-serif text-3xl text-text-primary dark:text-text-dark-primary mb-4">
            参加が完了しました
          </h1>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-8">
            お支払いが確認できました。アクティビティの詳細をご確認ください。
          </p>
          <Link to={`/activities/${id}`}
            className="px-8 py-3 border border-gold text-gold hover:bg-gold/10 transition">
            アクティビティへ戻る
          </Link>
        </div>
      </div>
    </Layout>
  );
};
```

**Step 3: App.tsx にルート追加**

```typescript
const ActivityPaymentSuccess = lazy(() => import('./pages/activities/ActivityPaymentSuccess').then(m => ({ default: m.ActivityPaymentSuccess })));

// ProtectedRoute 内に追加
<Route path="/activities/:id/payment/success" element={<ActivityPaymentSuccess />} />
```

**Step 4: TypeScript チェック**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npx tsc --noEmit
```

**Commit:**
```bash
git add frontend/src/pages/activities/ActivityDetail.tsx frontend/src/pages/activities/ActivityPaymentSuccess.tsx frontend/src/App.tsx
git commit -m "feat: add paid activity join flow and payment success page"
```

---

## Deploy

### Task 17: バックエンドのデプロイ

```bash
# CDK コンパイル
cd /mnt/c/Users/masat/AllApps/Connect40/cdk && npx tsc

# シンス (Linux filesystem に CDK_OUTDIR)
CDK_OUTDIR=/tmp/cdk-output npx cdk synth --app "npx ts-node --prefer-ts-exts bin/cdk.ts" --all

# assets publish
npx cdk-assets publish --path /tmp/cdk-output/Connect40-ApiStack-dev.assets.json --profile default

# CloudFormation deploy
aws cloudformation deploy \
  --template-file /tmp/cdk-output/Connect40-ApiStack-dev.template.json \
  --stack-name Connect40-ApiStack-dev \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    StripeSecretKey="$STRIPE_SECRET_KEY" \
    AdminUserIds="<your-cognito-user-id>" \
  --region ap-northeast-1
```

### Task 18: フロントエンドのビルド＆デプロイ

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/frontend && npm run build
aws s3 sync dist/ s3://connect40-frontend-dev-863646532781 --delete
aws cloudfront create-invalidation --distribution-id E356KF1HDDL8LL --paths "/*"
```

---

## 環境変数チェックリスト

デプロイ前に以下を確認:
- `STRIPE_SECRET_KEY` - Stripe ダッシュボードから
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook エンドポイント登録後
- `ADMIN_USER_IDS` - 管理者の Cognito sub（UUID）
- Stripe webhook に `checkout.session.completed` イベントを追加登録

