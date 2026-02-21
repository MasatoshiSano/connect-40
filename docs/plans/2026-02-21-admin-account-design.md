# Admin Account Design

Date: 2026-02-21
Status: Approved

## Overview

Introduce an admin account (`admin@connect40.jp`) that can access and participate in ALL chat rooms using the existing chat UI. No frontend changes required.

## Approach: Cognito Group

Create a Cognito group called `admin`. The admin user is added to this group. The JWT token automatically includes `cognito:groups: ["admin"]`, allowing Lambda functions to check admin status without extra DB reads.

## Admin Detection

All backend functions that need admin behavior use this helper:

```typescript
function isAdmin(claims: Record<string, string>): boolean {
  const groups = claims['cognito:groups'];
  if (!groups) return false;
  const groupList = Array.isArray(groups) ? groups : [groups];
  return groupList.includes('admin');
}
```

Note: API Gateway Cognito authorizer may serialize `cognito:groups` as a comma-separated string or array depending on configuration. The helper handles both.

## Backend Changes

### `getRoom.ts`
- Remove hard 403 for non-participants
- Allow admin (isAdmin check) to bypass participant check
- Admin can read messages and appears to the client as accessing the room normally

### `getRooms.ts`
- For admin: DynamoDB Scan with `FilterExpression: 'SK = :metadataKey'` and `ExpressionAttributeValues: { ':metadataKey': 'METADATA' }`, then filter results where PK begins with `CHATROOM#`
- Returns all chat rooms sorted by lastMessageAt descending (same shape as non-admin response)
- For non-admin: existing logic unchanged

### `users/create.ts`
- Skip age validation (35–49) when request comes from admin (isAdmin check)
- All other validation remains

## Admin User Setup (AWS CLI)

### Step 1: Create Cognito group
```bash
aws cognito-idp create-group \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --group-name admin \
  --description "Platform administrators"
```

### Step 2: Create admin Cognito user
```bash
aws cognito-idp admin-create-user \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --user-attributes Name=email,Value=admin@connect40.jp Name=email_verified,Value=true \
  --temporary-password "Admin2026!" \
  --message-action SUPPRESS
```

### Step 3: Set permanent password
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --password "Connect40Admin2026!" \
  --permanent
```

### Step 4: Add to admin group
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --group-name admin
```

### Step 5: Get Cognito sub (userId) for DynamoDB profile
```bash
aws cognito-idp admin-get-user \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --query 'UserAttributes[?Name==`sub`].Value' \
  --output text
```

### Step 6: Create admin DynamoDB profile
Use the sub from Step 5 as `{ADMIN_SUB}`:

```bash
aws dynamodb put-item \
  --table-name Connect40-dev \
  --item '{
    "PK": {"S": "USER#{ADMIN_SUB}"},
    "SK": {"S": "PROFILE"},
    "GSI1PK": {"S": "USERS"},
    "GSI1SK": {"S": "2026-02-21T00:00:00.000Z"},
    "Type": {"S": "User"},
    "userId": {"S": "{ADMIN_SUB}"},
    "email": {"S": "admin@connect40.jp"},
    "nickname": {"S": "Connect40 運営"},
    "age": {"N": "40"},
    "bio": {"S": "Connect40の運営チームです。何かお困りのことがあればお気軽にメッセージください。"},
    "interests": {"L": [{"S": "community"}]},
    "location": {"M": {"latitude": {"N": "35.6762"}, "longitude": {"N": "139.6503"}, "address": {"S": "東京都"}}},
    "profilePhoto": {"S": ""},
    "verificationStatus": {"S": "verified"},
    "membershipTier": {"S": "premium"},
    "createdAt": {"S": "2026-02-21T00:00:00.000Z"},
    "updatedAt": {"S": "2026-02-21T00:00:00.000Z"}
  }'
```

## Files to Modify

- `backend/functions/chat/getRoom.ts` — bypass participant check for admin
- `backend/functions/chat/getRooms.ts` — return all rooms for admin via Scan
- `backend/functions/users/create.ts` — skip age validation for admin

## Files Not Modified

- Frontend (no changes needed)
- CDK stacks (Cognito group created via CLI)
- WebSocket handler
