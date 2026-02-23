# Activity-Linked Group Chat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When users join an activity, automatically create/join a group chat room so all participants can communicate.

**Architecture:** Extend the existing `join` Lambda to create/update group chat rooms in the same DynamoDB single-table. Create a new `leave` Lambda for activity departure that also removes users from the group chat. Add system messages (join/leave) to the chat. Fix the `getRooms` Lambda to return room metadata. Update frontend to display room names, system messages, and a "open group chat" button on activity detail.

**Tech Stack:** TypeScript, AWS Lambda, DynamoDB (single-table), API Gateway (REST + WebSocket), React, Zustand

---

### Task 1: Fix `getRooms` Lambda — Return Room Metadata

The current `getRooms` returns only `ChatParticipation` records (just `chatRoomId` and `joinedAt`), but the frontend expects full room metadata. This is a prerequisite for everything else.

**Files:**
- Modify: `backend/functions/chat/getRooms.ts`

**Step 1: Rewrite getRooms to batch-fetch room metadata**

Replace `backend/functions/chat/getRooms.ts` with:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Query user's chat participations
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHATROOM#',
        },
      })
    );

    const participations = result.Items || [];

    // Batch fetch room metadata for each participation
    const rooms = await Promise.all(
      participations.map(async (participation) => {
        const roomResult = await ddbDocClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `CHATROOM#${participation.chatRoomId}`,
              SK: 'METADATA',
            },
          })
        );

        if (!roomResult.Item) return null;

        const room = roomResult.Item;

        // Also get last message info
        const lastMsgResult = await ddbDocClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `CHATROOM#${participation.chatRoomId}`,
              SK: 'LASTMESSAGE',
            },
          })
        );

        return {
          chatRoomId: room.chatRoomId,
          name: room.name || (room.type === 'direct' ? 'ダイレクトメッセージ' : 'グループチャット'),
          participantIds: room.participantIds,
          type: room.type,
          activityId: room.activityId,
          lastMessageAt: lastMsgResult.Item?.lastMessageAt || room.createdAt,
          lastMessage: lastMsgResult.Item?.lastMessage,
          createdAt: room.createdAt,
        };
      })
    );

    const validRooms = rooms.filter(Boolean);

    // Sort by lastMessageAt descending
    validRooms.sort((a, b) => {
      const dateA = new Date(a!.lastMessageAt).getTime();
      const dateB = new Date(b!.lastMessageAt).getTime();
      return dateB - dateA;
    });

    return successResponse({ rooms: validRooms, count: validRooms.length });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve chat rooms');
  }
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd backend && npx tsc --noEmit functions/chat/getRooms.ts` (or project-level typecheck)

**Step 3: Commit**

```bash
git add backend/functions/chat/getRooms.ts
git commit -m "fix: getRooms returns full room metadata with lastMessage"
```

---

### Task 2: Add `name` and `messageType` Fields to Data Model

Update `createRoom.ts` to accept a `name` field. Update `getRoom.ts` to return `name` and `messageType`. Update `sendMessage.ts` to include `messageType` in stored messages. Update the chat Zustand store and frontend types.

**Files:**
- Modify: `backend/functions/chat/createRoom.ts:10-13,75-82`
- Modify: `backend/functions/chat/getRoom.ts:74-83`
- Modify: `backend/functions/websocket/sendMessage.ts:59-71,135-145`
- Modify: `frontend/src/stores/chat.ts:3-11,13-22`

**Step 1: Update createRoom to accept `name`**

In `backend/functions/chat/createRoom.ts`, change the `CreateChatRoomInput` interface (line 10-13):

```typescript
interface CreateChatRoomInput {
  participantIds: string[];
  activityId?: string;
  name?: string;
}
```

And update the chatRoom object (line 75-82) to include `name`:

```typescript
const chatRoom = {
  chatRoomId,
  name: input.name,
  participantIds: input.participantIds,
  type,
  activityId: input.activityId,
  lastMessageAt: now,
  createdAt: now,
};
```

**Step 2: Update getRoom to return `name` and `messageType`**

In `backend/functions/chat/getRoom.ts`, update the messages mapping (line 74-83) to include `messageType`:

```typescript
const messages = (messagesResult.Items || [])
  .map((item) => ({
    messageId: item.messageId,
    senderId: item.senderId,
    content: item.content,
    messageType: item.messageType || 'user',
    readBy: item.readBy || [],
    createdAt: item.createdAt,
    timestamp: item.timestamp,
  }))
  .reverse();
```

And update the response body (line 91-101) to include `name`:

```typescript
body: JSON.stringify({
  data: {
    chatRoomId: chatRoom.chatRoomId,
    name: chatRoom.name,
    participantIds: chatRoom.participantIds,
    type: chatRoom.type,
    activityId: chatRoom.activityId,
    lastMessageAt: chatRoom.lastMessageAt,
    createdAt: chatRoom.createdAt,
    messages,
  },
}),
```

**Step 3: Update sendMessage to store `messageType`**

In `backend/functions/websocket/sendMessage.ts`, add `messageType: 'user'` to the stored message (line 59-71):

```typescript
const message = {
  PK: `CHATROOM#${chatRoomId}`,
  SK: `MESSAGE#${timestamp}#${messageId}`,
  Type: 'Message',
  messageId,
  chatRoomId,
  senderId,
  content,
  messageType: 'user',
  readBy: [senderId],
  createdAt: now,
  timestamp,
};
```

And include `messageType` in the broadcast payload (line 135-145):

```typescript
const messageData = JSON.stringify({
  type: 'message',
  data: {
    messageId,
    chatRoomId,
    senderId,
    content,
    messageType: 'user',
    createdAt: now,
    timestamp,
  },
});
```

**Step 4: Update frontend types**

In `frontend/src/stores/chat.ts`, update Message interface (line 3-11):

```typescript
export interface Message {
  messageId: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: 'user' | 'system';
  readBy: string[];
  createdAt: string;
  timestamp: number;
}
```

Update ChatRoom interface (line 13-22):

```typescript
export interface ChatRoom {
  chatRoomId: string;
  name?: string;
  participantIds: string[];
  type: 'direct' | 'group';
  activityId?: string;
  lastMessageAt?: string;
  lastMessage?: string;
  createdAt: string;
  unreadCount?: number;
}
```

**Step 5: Commit**

```bash
git add backend/functions/chat/createRoom.ts backend/functions/chat/getRoom.ts backend/functions/websocket/sendMessage.ts frontend/src/stores/chat.ts
git commit -m "feat: add name and messageType fields to chat data model"
```

---

### Task 3: Extend `join` Lambda — Auto-Create Group Chat

When a user joins an activity, automatically create or join the activity's group chat room.

**Files:**
- Modify: `backend/functions/activities/join.ts`

**Step 1: Add group chat creation logic to join handler**

Replace the entire `backend/functions/activities/join.ts`:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME!;

const createSystemMessage = async (
  chatRoomId: string,
  content: string
): Promise<void> => {
  const messageId = uuidv4();
  const timestamp = Date.now();
  const now = new Date().toISOString();

  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: `MESSAGE#${timestamp}#${messageId}`,
        Type: 'Message',
        messageId,
        chatRoomId,
        senderId: 'system',
        content,
        messageType: 'system',
        readBy: [],
        createdAt: now,
        timestamp,
      },
    })
  );

  // Update last message
  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: 'LASTMESSAGE',
        lastMessageAt: now,
        lastMessage: content.substring(0, 100),
      },
    })
  );
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const activityId = event.pathParameters?.id;
    if (!activityId) {
      return errorResponse(400, 'INVALID_INPUT', 'Activity ID is required');
    }

    // Get activity
    const activityResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
      })
    );

    if (!activityResult.Item) {
      return errorResponse(404, 'NOT_FOUND', 'Activity not found');
    }

    const activity = activityResult.Item;

    // Validate
    if (activity.hostUserId === userId) {
      return errorResponse(400, 'INVALID_ACTION', 'Host cannot join their own activity');
    }

    if (activity.participants.includes(userId)) {
      return errorResponse(400, 'ALREADY_JOINED', 'Already joined this activity');
    }

    if (activity.currentParticipants >= activity.maxParticipants) {
      return errorResponse(400, 'ACTIVITY_FULL', 'Activity is full');
    }

    if (activity.status !== 'upcoming') {
      return errorResponse(400, 'INVALID_STATUS', 'Cannot join non-upcoming activity');
    }

    const now = new Date().toISOString();

    // Update activity participants
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'ADD currentParticipants :inc SET participants = list_append(participants, :userId), updatedAt = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':userId': [userId],
          ':now': now,
        },
      })
    );

    // Create participant record
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `ACTIVITY#${activityId}`,
          Type: 'Participation',
          activityId,
          userId,
          joinedAt: now,
        },
      })
    );

    // --- Group Chat Integration ---

    // Get user's nickname for system message
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );
    const nickname = userResult.Item?.nickname || 'ユーザー';

    // Check if activity already has a chat room
    const chatRoomQuery = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ACTIVITY#${activityId}`,
          ':sk': 'CHATROOM#',
        },
      })
    );

    let chatRoomId: string;

    if (chatRoomQuery.Items && chatRoomQuery.Items.length > 0) {
      // Chat room exists — add user to it
      chatRoomId = chatRoomQuery.Items[0].chatRoomId;

      // Add user to participantIds
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CHATROOM#${chatRoomId}`,
            SK: 'METADATA',
          },
          UpdateExpression: 'SET participantIds = list_append(participantIds, :userId)',
          ExpressionAttributeValues: {
            ':userId': [userId],
          },
        })
      );

      // Create chat participation record
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `CHATROOM#${chatRoomId}`,
            GSI1PK: `USERROOMS#${userId}`,
            GSI1SK: now,
            Type: 'ChatParticipation',
            chatRoomId,
            participantId: userId,
            joinedAt: now,
          },
        })
      );

      // Post system message
      await createSystemMessage(chatRoomId, `${nickname}さんが参加しました`);
    } else {
      // No chat room yet — create one
      chatRoomId = uuidv4();

      const participantIds = [activity.hostUserId, userId];

      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `CHATROOM#${chatRoomId}`,
            SK: 'METADATA',
            Type: 'ChatRoom',
            chatRoomId,
            name: activity.title,
            participantIds,
            type: 'group',
            activityId,
            lastMessageAt: now,
            createdAt: now,
          },
        })
      );

      // Create activity-to-chatroom lookup record
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `ACTIVITY#${activityId}`,
            SK: `CHATROOM#${chatRoomId}`,
            Type: 'ActivityChatRoom',
            chatRoomId,
            activityId,
            createdAt: now,
          },
        })
      );

      // Create participation records for each participant
      for (const participantId of participantIds) {
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `USER#${participantId}`,
              SK: `CHATROOM#${chatRoomId}`,
              GSI1PK: `USERROOMS#${participantId}`,
              GSI1SK: now,
              Type: 'ChatParticipation',
              chatRoomId,
              participantId,
              joinedAt: now,
            },
          })
        );
      }

      // Post system message
      await createSystemMessage(chatRoomId, `グループチャットが作成されました`);
      await createSystemMessage(chatRoomId, `${nickname}さんが参加しました`);
    }

    return successResponse({
      message: 'Successfully joined activity',
      chatRoomId,
    });
  } catch (error) {
    console.error('Join activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to join activity');
  }
};
```

**Step 2: Add uuid dependency if not present**

Check `backend/package.json` for `uuid` dependency. If missing:

Run: `cd backend && npm install uuid && npm install -D @types/uuid`

**Step 3: Commit**

```bash
git add backend/functions/activities/join.ts backend/package.json backend/package-lock.json
git commit -m "feat: auto-create group chat when joining activity"
```

---

### Task 4: Create `leave` Lambda — Activity Departure + Chat Removal

No leave function exists yet. Create one that removes the user from the activity AND the associated chat room.

**Files:**
- Create: `backend/functions/activities/leave.ts`
- Modify: `cdk/lib/stacks/api-stack.ts:193-244` (add leave function + route)
- Modify: `frontend/src/services/api.ts` (add leaveActivity function)

**Step 1: Create the leave Lambda**

Create `backend/functions/activities/leave.ts`:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { GetCommand, UpdateCommand, DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME!;

const createSystemMessage = async (
  chatRoomId: string,
  content: string
): Promise<void> => {
  const messageId = uuidv4();
  const timestamp = Date.now();
  const now = new Date().toISOString();

  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: `MESSAGE#${timestamp}#${messageId}`,
        Type: 'Message',
        messageId,
        chatRoomId,
        senderId: 'system',
        content,
        messageType: 'system',
        readBy: [],
        createdAt: now,
        timestamp,
      },
    })
  );

  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: 'LASTMESSAGE',
        lastMessageAt: now,
        lastMessage: content.substring(0, 100),
      },
    })
  );
};

/**
 * Leave an activity
 * POST /activities/:id/leave
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const activityId = event.pathParameters?.id;
    if (!activityId) {
      return errorResponse(400, 'INVALID_INPUT', 'Activity ID is required');
    }

    // Get activity
    const activityResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
      })
    );

    if (!activityResult.Item) {
      return errorResponse(404, 'NOT_FOUND', 'Activity not found');
    }

    const activity = activityResult.Item;

    if (activity.hostUserId === userId) {
      return errorResponse(400, 'INVALID_ACTION', 'Host cannot leave their own activity');
    }

    const participantIndex = (activity.participants as string[]).indexOf(userId);
    if (participantIndex === -1) {
      return errorResponse(400, 'NOT_PARTICIPANT', 'Not a participant of this activity');
    }

    const now = new Date().toISOString();

    // Remove user from activity participants
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ACTIVITY#${activityId}`,
          SK: 'METADATA',
        },
        UpdateExpression: `ADD currentParticipants :dec REMOVE participants[${participantIndex}] SET updatedAt = :now`,
        ExpressionAttributeValues: {
          ':dec': -1,
          ':now': now,
        },
      })
    );

    // Delete participant record
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ACTIVITY#${activityId}`,
        },
      })
    );

    // --- Group Chat Removal ---

    // Get user's nickname
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );
    const nickname = userResult.Item?.nickname || 'ユーザー';

    // Find chat room linked to activity
    const chatRoomQuery = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ACTIVITY#${activityId}`,
          ':sk': 'CHATROOM#',
        },
      })
    );

    if (chatRoomQuery.Items && chatRoomQuery.Items.length > 0) {
      const chatRoomId = chatRoomQuery.Items[0].chatRoomId;

      // Get current room metadata to find user index in participantIds
      const roomResult = await ddbDocClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CHATROOM#${chatRoomId}`,
            SK: 'METADATA',
          },
        })
      );

      if (roomResult.Item) {
        const chatParticipantIndex = (roomResult.Item.participantIds as string[]).indexOf(userId);

        if (chatParticipantIndex !== -1) {
          // Remove user from chat room participantIds
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `CHATROOM#${chatRoomId}`,
                SK: 'METADATA',
              },
              UpdateExpression: `REMOVE participantIds[${chatParticipantIndex}]`,
            })
          );
        }
      }

      // Delete user's chat participation record
      await ddbDocClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `CHATROOM#${chatRoomId}`,
          },
        })
      );

      // Post system message
      await createSystemMessage(chatRoomId, `${nickname}さんが退出しました`);
    }

    return successResponse({ message: 'Successfully left activity' });
  } catch (error) {
    console.error('Leave activity error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to leave activity');
  }
};
```

**Step 2: Add leave route in CDK api-stack.ts**

In `cdk/lib/stacks/api-stack.ts`, after the joinActivityFunction definition (around line 206), add the leave function:

```typescript
const leaveActivityFunction = new NodejsFunction(this, 'LeaveActivityFunctionV2', {
  runtime: lambda.Runtime.NODEJS_20_X,
  entry: path.join(__dirname, '../../../backend/functions/activities/leave.ts'),
  environment: {
    TABLE_NAME: props.table.tableName,
  },
  bundling: {
    minify: true,
    sourceMap: true,
    externalModules: ['@aws-sdk/*'],
    forceDockerBundling: false,
  },
  timeout: cdk.Duration.seconds(10),
});
```

Add DynamoDB permission:
```typescript
props.table.grantReadWriteData(leaveActivityFunction);
```

Add to functions array and create the API route:
```typescript
// POST /activities/{id}/leave - Leave activity
const activityLeave = activityById.addResource('leave');
activityLeave.addMethod('POST', new apigateway.LambdaIntegration(leaveActivityFunction), {
  authorizer: this.authorizer,
});
```

**Step 3: Add leaveActivity API function in frontend**

In `frontend/src/services/api.ts`, after the `joinActivity` function (line 228), add:

```typescript
/**
 * Leave activity
 */
export async function leaveActivity(activityId: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/activities/${activityId}/leave`, {
    method: 'POST',
  });
}
```

**Step 4: Commit**

```bash
git add backend/functions/activities/leave.ts cdk/lib/stacks/api-stack.ts frontend/src/services/api.ts
git commit -m "feat: add leave activity with group chat removal"
```

---

### Task 5: Update Frontend — ChatList with Room Names

Update ChatList to display room names, participant counts, and last message preview.

**Files:**
- Modify: `frontend/src/pages/chat/ChatList.tsx`

**Step 1: Update ChatList component**

Replace the `ChatRoom` interface and room display in `frontend/src/pages/chat/ChatList.tsx`:

Update the `ChatRoom` interface (line 9-15):

```typescript
interface ChatRoom {
  chatRoomId: string;
  name?: string;
  participantIds: string[];
  type: 'direct' | 'group';
  activityId?: string;
  lastMessageAt: string;
  lastMessage?: string;
}
```

Update the room card rendering (line 90-112) to show room name and last message:

```tsx
{chatRooms.map((room) => (
  <div
    key={room.chatRoomId}
    onClick={() => navigate(`/chat/${room.chatRoomId}`)}
    className="bg-white dark:bg-surface-dark rounded-xl shadow-sm hover:shadow-md transition cursor-pointer p-4"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
        <Icon name={room.type === 'direct' ? 'person' : 'group'} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {room.name || (room.type === 'direct' ? 'ダイレクトメッセージ' : 'グループチャット')}
        </h3>
        <div className="flex items-center gap-2">
          {room.lastMessage && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
              {room.lastMessage}
            </p>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {new Date(room.lastMessageAt).toLocaleString('ja-JP', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {room.participantIds.length}人のメンバー
        </p>
      </div>
      <Icon name="chevron_right" className="text-gray-400 flex-shrink-0" />
    </div>
  </div>
))}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/chat/ChatList.tsx
git commit -m "feat: ChatList displays room name, last message, and member count"
```

---

### Task 6: Update Frontend — ChatRoom Header and System Messages

Show room name in ChatRoom header. Handle system messages in MessageBubble.

**Files:**
- Modify: `frontend/src/pages/chat/ChatRoom.tsx:147-158`
- Modify: `frontend/src/components/chat/MessageBubble.tsx`

**Step 1: Update ChatRoom header**

In `frontend/src/pages/chat/ChatRoom.tsx`, update the header (line 147-158):

```tsx
<div className="flex-1">
  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
    {currentRoom.name || (currentRoom.type === 'direct'
      ? 'ダイレクトメッセージ'
      : 'グループチャット')}
  </h1>
  <p className="text-sm text-gray-600 dark:text-gray-400">
    {currentRoom.participantIds.length}人のメンバー
  </p>
</div>
```

**Step 2: Update MessageBubble to handle system messages**

Replace `frontend/src/components/chat/MessageBubble.tsx`:

```tsx
import { type Message } from '../../stores/chat';
import { useAuthStore } from '../../stores/auth';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { userId } = useAuthStore();

  // System message
  if (message.messageType === 'system' || message.senderId === 'system') {
    return (
      <div className="flex justify-center mb-4">
        <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const isMine = message.senderId === userId;

  const time = new Date(message.createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isRead = message.readBy.length > 1;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isMine
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{time}</span>
          {isMine && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isRead ? '既読' : '未読'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Step 3: Commit**

```bash
git add frontend/src/pages/chat/ChatRoom.tsx frontend/src/components/chat/MessageBubble.tsx
git commit -m "feat: ChatRoom shows room name, MessageBubble supports system messages"
```

---

### Task 7: Update Frontend — ActivityDetail with Group Chat Button + Leave

Add "グループチャットを開く" button to activity detail when user is a participant. Wire up the "参加をキャンセル" button to the new leaveActivity API.

**Files:**
- Modify: `frontend/src/pages/activities/ActivityDetail.tsx:55-65,308-369`

**Step 1: Update handleJoin to capture chatRoomId**

In `frontend/src/pages/activities/ActivityDetail.tsx`, update the state and handleJoin (around line 17, 41-65):

Add state: `const [chatRoomId, setChatRoomId] = useState<string | null>(null);`

Update handleJoin to capture the returned chatRoomId:

```typescript
const handleJoin = async () => {
  if (!activity || !activityId) return;

  setIsJoining(true);
  setError(null);
  setSuccessMessage(null);

  try {
    const { joinActivity, getActivity } = await import('../../services/api');
    const result = await joinActivity(activity.activityId);

    // Capture chatRoomId from join response
    if ('chatRoomId' in result) {
      setChatRoomId((result as { message: string; chatRoomId: string }).chatRoomId);
    }

    const updatedActivity = await getActivity(activityId);
    setActivity(updatedActivity);
    setSuccessMessage('アクティビティへの参加が完了しました！');

    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  } catch (err) {
    setError(err instanceof Error ? err.message : '参加申込に失敗しました');
  } finally {
    setIsJoining(false);
  }
};
```

**Step 2: Add handleLeave function**

After handleJoin, add:

```typescript
const handleLeave = async () => {
  if (!activity || !activityId) return;

  setError(null);

  try {
    const { leaveActivity, getActivity } = await import('../../services/api');
    await leaveActivity(activity.activityId);

    const updatedActivity = await getActivity(activityId);
    setActivity(updatedActivity);
    setChatRoomId(null);
    setSuccessMessage('アクティビティから退出しました');

    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  } catch (err) {
    setError(err instanceof Error ? err.message : '退出に失敗しました');
  }
};
```

**Step 3: Update action buttons section**

Replace the participant button area (line 362-369) with a section that includes both the "open chat" and "leave" buttons:

```tsx
{(isParticipant || isHost) && (
  <div className="space-y-3 mt-6">
    <button
      onClick={() => {
        if (chatRoomId) {
          navigate(`/chat/${chatRoomId}`);
        } else {
          navigate('/chat');
        }
      }}
      className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-semibold flex items-center justify-center gap-2"
    >
      <Icon name="chat_bubble" />
      グループチャットを開く
    </button>

    {isParticipant && !isHost && (
      <button
        onClick={handleLeave}
        className="w-full py-4 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-semibold flex items-center justify-center gap-2"
      >
        <Icon name="cancel" />
        参加をキャンセル
      </button>
    )}
  </div>
)}
```

**Step 4: Update joinActivity return type**

In `frontend/src/services/api.ts`, update the return type of `joinActivity`:

```typescript
export async function joinActivity(activityId: string): Promise<{ message: string; chatRoomId?: string }> {
  return fetchWithAuth<{ message: string; chatRoomId?: string }>(`/activities/${activityId}/join`, {
    method: 'POST',
  });
}
```

**Step 5: Commit**

```bash
git add frontend/src/pages/activities/ActivityDetail.tsx frontend/src/services/api.ts
git commit -m "feat: ActivityDetail shows group chat button and wires up leave"
```

---

### Task 8: WebSocket — Broadcast System Messages to Connected Users

When system messages are posted (join/leave), notify connected WebSocket clients so they see the message in real-time.

**Files:**
- Modify: `backend/functions/activities/join.ts` (add WebSocket notification)
- Modify: `backend/functions/activities/leave.ts` (add WebSocket notification)

**Step 1: Create shared WebSocket broadcast utility**

Create `backend/functions/common/broadcastToRoom.ts`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

interface BroadcastMessage {
  type: string;
  data: Record<string, unknown>;
}

export const broadcastToRoom = async (
  tableName: string,
  wsEndpoint: string,
  chatRoomId: string,
  message: BroadcastMessage
): Promise<void> => {
  // Get chat room to find participants
  const roomResult = await ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `CHATROOM#${chatRoomId}`,
        SK: 'METADATA',
      },
    })
  );

  if (!roomResult.Item) return;

  const participantIds = roomResult.Item.participantIds as string[];
  const apiGatewayClient = new ApiGatewayManagementApiClient({
    endpoint: wsEndpoint,
  });

  // Get all connections for participants
  const connections: string[] = [];
  for (const participantId of participantIds) {
    const userConnections = await ddbDocClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${participantId}`,
          ':sk': 'CONNECTION#',
        },
      })
    );

    if (userConnections.Items) {
      connections.push(...userConnections.Items.map((item) => item.connectionId as string));
    }
  }

  // Broadcast to all connections
  const messageData = JSON.stringify(message);
  await Promise.allSettled(
    connections.map(async (connId) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: connId,
            Data: Buffer.from(messageData),
          })
        );
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 410) {
          await ddbDocClient.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                PK: `CONNECTION#${connId}`,
                SK: 'METADATA',
              },
            })
          );
        }
      }
    })
  );
};
```

**Step 2: Add WEBSOCKET_ENDPOINT env var to join and leave Lambdas in CDK**

In `cdk/lib/stacks/api-stack.ts`, the joinActivityFunction and leaveActivityFunction environments need the WebSocket endpoint. Since the WebSocket stack may be created after the API stack, we need to pass this as a cross-stack reference or environment variable.

Add to the `ApiStackProps` interface:
```typescript
webSocketEndpoint?: string;
```

Add `WEBSOCKET_ENDPOINT` to both the `joinActivityFunction` and `leaveActivityFunction` environment:
```typescript
environment: {
  TABLE_NAME: props.table.tableName,
  WEBSOCKET_ENDPOINT: props.webSocketEndpoint || '',
},
```

**Step 3: Import and call broadcastToRoom in join.ts and leave.ts**

After creating system messages in both files, add:

```typescript
import { broadcastToRoom } from '../common/broadcastToRoom';

// After createSystemMessage call:
const wsEndpoint = process.env.WEBSOCKET_ENDPOINT;
if (wsEndpoint) {
  await broadcastToRoom(TABLE_NAME, wsEndpoint, chatRoomId, {
    type: 'message',
    data: {
      messageId: 'system',
      chatRoomId,
      senderId: 'system',
      content: `${nickname}さんが参加しました`,
      messageType: 'system',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    },
  });
}
```

**Note:** This task is an enhancement. If the WebSocket endpoint is not configured, the system messages will still be visible when the user refreshes the chat room — they just won't appear in real-time. This can be skipped in the first pass and added later.

**Step 4: Commit**

```bash
git add backend/functions/common/broadcastToRoom.ts backend/functions/activities/join.ts backend/functions/activities/leave.ts cdk/lib/stacks/api-stack.ts
git commit -m "feat: broadcast system messages to connected WebSocket clients"
```

---

### Task 9: Integration Testing — Manual Verification Checklist

Test the full flow manually after deployment.

**Checklist:**
1. User A creates an activity
2. User B joins the activity → verify group chat room is created
3. User B opens chat list → verify room appears with activity title as name
4. User B opens the chat room → verify system messages ("グループチャットが作成されました", "User Bさんが参加しました")
5. User A also sees the chat room in their list
6. User A and B exchange messages → verify real-time delivery
7. User C joins the same activity → verify they are added to the existing chat room
8. User C sees all previous messages when opening the chat
9. User B leaves the activity → verify system message "User Bさんが退出しました"
10. User B no longer sees the chat room in their list
11. Activity detail page shows "グループチャットを開く" button for participants

This is a manual test — no automated tests are created in this pass.

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/functions/chat/getRooms.ts` | Modify | Return full room metadata + last message |
| `backend/functions/chat/createRoom.ts` | Modify | Accept `name` field |
| `backend/functions/chat/getRoom.ts` | Modify | Return `name` and `messageType` |
| `backend/functions/websocket/sendMessage.ts` | Modify | Store/broadcast `messageType` |
| `backend/functions/activities/join.ts` | Modify | Auto-create/join group chat on activity join |
| `backend/functions/activities/leave.ts` | Create | Leave activity + remove from chat |
| `backend/functions/common/broadcastToRoom.ts` | Create | Shared WebSocket broadcast utility |
| `cdk/lib/stacks/api-stack.ts` | Modify | Add leave Lambda + route + ws env |
| `frontend/src/stores/chat.ts` | Modify | Add `name`, `messageType` to types |
| `frontend/src/services/api.ts` | Modify | Add leaveActivity, update joinActivity return type |
| `frontend/src/pages/chat/ChatList.tsx` | Modify | Show room name, last message, member count |
| `frontend/src/pages/chat/ChatRoom.tsx` | Modify | Show room name in header |
| `frontend/src/components/chat/MessageBubble.tsx` | Modify | System message variant |
| `frontend/src/pages/activities/ActivityDetail.tsx` | Modify | Group chat button + leave button |
