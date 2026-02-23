# Admin Account Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an admin account (admin@connect40.jp) that can access and participate in ALL chat rooms using the existing chat UI.

**Architecture:** Cognito group `admin` → JWT `cognito:groups` claim → `isAdmin()` helper in each Lambda function. No frontend changes. Three Lambda functions modified; AWS CLI used for Cognito/DynamoDB setup.

**Tech Stack:** AWS Lambda (TypeScript), DynamoDB, AWS Cognito, @aws-sdk/lib-dynamodb

---

### Task 1: Modify `getRoom.ts` — admin bypass

**Files:**
- Modify: `backend/functions/chat/getRoom.ts:77-93`

**Step 1: Add `isAdmin` helper and bypass participant check**

Replace lines 77–93 (participant check block) with the following. Insert the helper before the `handler` export:

```typescript
// Add before the `export const handler` line:
function isAdmin(claims: Record<string, string>): boolean {
  const groups = claims['cognito:groups'];
  if (!groups) return false;
  const groupList = Array.isArray(groups) ? groups : groups.split(',').map((g) => g.trim());
  return groupList.includes('admin');
}
```

Then replace the participant check (lines 77–93):

```typescript
// OLD:
    // Verify the requesting user is a participant
    const roomParticipantIds = chatRoom.participantIds as string[];
    if (!roomParticipantIds.includes(userId)) {
      return {
        statusCode: 403,
        ...
      };
    }

// NEW:
    // Verify the requesting user is a participant (admin bypasses this)
    const claims = (event.requestContext.authorizer?.claims ?? {}) as Record<string, string>;
    const roomParticipantIds = chatRoom.participantIds as string[];
    if (!isAdmin(claims) && !roomParticipantIds.includes(userId)) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
        body: JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'Not a participant of this chat room',
          },
        }),
      };
    }
```

**Step 2: Verify TypeScript compiles**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/backend
npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add backend/functions/chat/getRoom.ts
git commit -m "feat: admin bypass for getRoom participant check"
```

---

### Task 2: Modify `getRooms.ts` — admin DynamoDB Scan

**Files:**
- Modify: `backend/functions/chat/getRooms.ts`

**Step 1: Add `ScanCommand` import**

```typescript
// Change:
import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
// To:
import { QueryCommand, BatchGetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
```

**Step 2: Add `isAdmin` helper before the handler**

```typescript
function isAdmin(claims: Record<string, string>): boolean {
  const groups = claims['cognito:groups'];
  if (!groups) return false;
  const groupList = Array.isArray(groups) ? groups : groups.split(',').map((g) => g.trim());
  return groupList.includes('admin');
}
```

**Step 3: Add admin Scan path at the start of try block, after userId check**

```typescript
    // Admin: scan all chat rooms
    const claims = (event.requestContext.authorizer?.claims ?? {}) as Record<string, string>;
    if (isAdmin(claims)) {
      const allRooms: RoomInfo[] = [];
      let lastKey: Record<string, unknown> | undefined;

      do {
        const scanResult = await ddbDocClient.send(
          new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'SK = :sk AND begins_with(PK, :prefix)',
            ExpressionAttributeValues: {
              ':sk': 'METADATA',
              ':prefix': 'CHATROOM#',
            },
            ExclusiveStartKey: lastKey,
          })
        );

        for (const item of scanResult.Items ?? []) {
          allRooms.push({
            chatRoomId: item.chatRoomId as string,
            name: (item.name as string) || (item.type === 'direct' ? 'ダイレクトメッセージ' : 'グループチャット'),
            participantIds: item.participantIds as string[],
            type: item.type as string,
            activityId: item.activityId as string | undefined,
            lastMessageAt: (item.lastMessageAt as string) || (item.createdAt as string),
            createdAt: item.createdAt as string,
          });
        }

        lastKey = scanResult.LastEvaluatedKey as Record<string, unknown> | undefined;
      } while (lastKey);

      allRooms.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      return successResponse({ rooms: allRooms, count: allRooms.length });
    }
```

This block is inserted right after the `userId` check (around line 31), before the existing `QueryCommand` call.

**Step 4: Verify TypeScript compiles**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/backend
npx tsc --noEmit
```

Expected: no errors

**Step 5: Commit**

```bash
git add backend/functions/chat/getRooms.ts
git commit -m "feat: admin scan for all chat rooms in getRooms"
```

---

### Task 3: Modify `users/create.ts` — skip age validation for admin

**Files:**
- Modify: `backend/functions/users/create.ts:56-58`

**Step 1: Add `isAdmin` helper before the handler**

```typescript
function isAdmin(claims: Record<string, string>): boolean {
  const groups = claims['cognito:groups'];
  if (!groups) return false;
  const groupList = Array.isArray(groups) ? groups : groups.split(',').map((g) => g.trim());
  return groupList.includes('admin');
}
```

**Step 2: Extract claims and wrap age validation**

After extracting `userId` and `email` (around line 32–33), add:

```typescript
    const claims = (event.requestContext.authorizer?.claims ?? {}) as Record<string, string>;
```

Then change the age validation (line 56–58):

```typescript
// OLD:
    if (typeof input.age !== 'number' || input.age < 35 || input.age > 49) {
      return errorResponse(400, 'INVALID_AGE', 'Age must be between 35 and 49');
    }

// NEW:
    if (!isAdmin(claims) && (typeof input.age !== 'number' || input.age < 35 || input.age > 49)) {
      return errorResponse(400, 'INVALID_AGE', 'Age must be between 35 and 49');
    }
```

**Step 3: Verify TypeScript compiles**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/backend
npx tsc --noEmit
```

Expected: no errors

**Step 4: Commit**

```bash
git add backend/functions/users/create.ts
git commit -m "feat: skip age validation for admin in users/create"
```

---

### Task 4: Build and deploy Lambda functions

**Step 1: Build backend TypeScript**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/backend
npm run build 2>&1 || npx tsc
```

Expected: compiles without errors

**Step 2: Deploy `getRoom` Lambda**

```bash
cd /mnt/c/Users/masat/AllApps/Connect40/backend
zip -j /tmp/getRoom.zip functions/chat/getRoom.js
aws lambda update-function-code \
  --function-name Connect40-dev-ChatGetRoom \
  --zip-file fileb:///tmp/getRoom.zip
```

Note: Lambda function names may differ. Check with:
```bash
aws lambda list-functions --query 'Functions[*].FunctionName' --output text | tr '\t' '\n' | grep -i chat
```

**Step 3: Deploy `getRooms` Lambda**

```bash
zip -j /tmp/getRooms.zip functions/chat/getRooms.js
aws lambda update-function-code \
  --function-name Connect40-dev-ChatGetRooms \
  --zip-file fileb:///tmp/getRooms.zip
```

**Step 4: Deploy `users/create` Lambda**

```bash
zip -j /tmp/usersCreate.zip functions/users/create.js
aws lambda update-function-code \
  --function-name Connect40-dev-UsersCreate \
  --zip-file fileb:///tmp/usersCreate.zip
```

> **Alternative: CDK deploy** if the project uses CDK for Lambda deployment:
> See `MEMORY.md` CDK Deploy Workaround section for WSL2 procedure.

---

### Task 5: AWS CLI — Cognito group + admin user setup

Run each command in order. All use User Pool ID `ap-northeast-1_PVAJ2az5K`.

**Step 1: Create Cognito group**

```bash
aws cognito-idp create-group \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --group-name admin \
  --description "Platform administrators"
```

Expected: JSON response with `Group.GroupName: "admin"`

**Step 2: Create admin Cognito user**

```bash
aws cognito-idp admin-create-user \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --user-attributes Name=email,Value=admin@connect40.jp Name=email_verified,Value=true \
  --temporary-password "Admin2026!" \
  --message-action SUPPRESS
```

Expected: JSON response with `User.Username: "admin@connect40.jp"`

**Step 3: Set permanent password**

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --password "Connect40Admin2026!" \
  --permanent
```

Expected: no output (success)

**Step 4: Add to admin group**

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --group-name admin
```

Expected: no output (success)

**Step 5: Get admin Cognito sub (userId)**

```bash
ADMIN_SUB=$(aws cognito-idp admin-get-user \
  --user-pool-id ap-northeast-1_PVAJ2az5K \
  --username admin@connect40.jp \
  --query 'UserAttributes[?Name==`sub`].Value' \
  --output text)
echo "Admin sub: $ADMIN_SUB"
```

**Step 6: Create admin DynamoDB profile**

```bash
aws dynamodb put-item \
  --table-name Connect40-dev \
  --item "{
    \"PK\": {\"S\": \"USER#${ADMIN_SUB}\"},
    \"SK\": {\"S\": \"PROFILE\"},
    \"GSI1PK\": {\"S\": \"USERS\"},
    \"GSI1SK\": {\"S\": \"2026-02-21T00:00:00.000Z\"},
    \"Type\": {\"S\": \"User\"},
    \"userId\": {\"S\": \"${ADMIN_SUB}\"},
    \"email\": {\"S\": \"admin@connect40.jp\"},
    \"nickname\": {\"S\": \"Connect40 運営\"},
    \"age\": {\"N\": \"40\"},
    \"bio\": {\"S\": \"Connect40の運営チームです。何かお困りのことがあればお気軽にメッセージください。\"},
    \"interests\": {\"L\": [{\"S\": \"community\"}]},
    \"location\": {\"M\": {\"latitude\": {\"N\": \"35.6762\"}, \"longitude\": {\"N\": \"139.6503\"}, \"address\": {\"S\": \"東京都\"}}},
    \"profilePhoto\": {\"S\": \"\"},
    \"verificationStatus\": {\"S\": \"verified\"},
    \"membershipTier\": {\"S\": \"premium\"},
    \"createdAt\": {\"S\": \"2026-02-21T00:00:00.000Z\"},
    \"updatedAt\": {\"S\": \"2026-02-21T00:00:00.000Z\"}
  }"
```

**Step 7: Commit final setup notes**

```bash
git add docs/plans/2026-02-21-admin-account-implementation.md
git commit -m "docs: admin account implementation plan"
```

---

## Manual Verification

After all tasks complete:

1. Log in as `admin@connect40.jp` / `Connect40Admin2026!` at the frontend
2. Navigate to `/chat` — all chat rooms should appear (not just ones the admin joined)
3. Click into any room — messages should load without 403
4. Send a message — it should appear in the room
5. Log in as a regular user — only their rooms should appear (unchanged behavior)
