import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '../../layers/common/nodejs/dynamodb';
import { QueryCommand, BatchGetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '../../layers/common/nodejs/utils';

const TABLE_NAME = process.env.TABLE_NAME!;

interface RoomInfo {
  chatRoomId: string;
  name: string;
  participantIds: string[];
  type: string;
  activityId?: string;
  lastMessageAt: string;
  lastMessage?: string;
  createdAt: string;
}

function isAdmin(claims: Record<string, string>): boolean {
  const groups = claims['cognito:groups'];
  if (!groups) return false;
  const groupList = Array.isArray(groups) ? groups : groups.split(',').map((g) => g.trim());
  return groupList.includes('admin');
}

/**
 * Get user's chat rooms
 * GET /chat/rooms
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Admin: scan all chat rooms
    const claims = (event.requestContext.authorizer?.claims ?? {}) as Record<string, string>;
    if (isAdmin(claims)) {
      const allRooms: RoomInfo[] = [];
      let lastKey: Record<string, unknown> | undefined;

      do {
        const scanResult = await ddbDocClient.send(
          new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'SK = :sk',
            ExpressionAttributeValues: {
              ':sk': 'METADATA',
            },
            ExclusiveStartKey: lastKey,
          })
        );

        for (const item of scanResult.Items ?? []) {
          if (typeof item.PK === 'string' && item.PK.startsWith('CHATROOM#')) {
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
        }

        lastKey = scanResult.LastEvaluatedKey as Record<string, unknown> | undefined;
      } while (lastKey);

      allRooms.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      return successResponse({ rooms: allRooms, count: allRooms.length });
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

    if (participations.length === 0) {
      return successResponse({ rooms: [], count: 0 });
    }

    // Build batch keys for both METADATA and LASTMESSAGE in a single BatchGet
    const batchKeys = participations.flatMap((p) => [
      { PK: `CHATROOM#${p.chatRoomId}`, SK: 'METADATA' },
      { PK: `CHATROOM#${p.chatRoomId}`, SK: 'LASTMESSAGE' },
    ]);

    // DynamoDB BatchGetItem supports max 100 keys per request
    const allItems: Record<string, unknown>[] = [];
    for (let i = 0; i < batchKeys.length; i += 100) {
      const chunk = batchKeys.slice(i, i + 100);
      const batchResult = await ddbDocClient.send(
        new BatchGetCommand({
          RequestItems: {
            [TABLE_NAME]: {
              Keys: chunk,
            },
          },
        })
      );
      if (batchResult.Responses?.[TABLE_NAME]) {
        allItems.push(...batchResult.Responses[TABLE_NAME]);
      }
    }

    // Index fetched items by PK+SK for O(1) lookup
    const itemMap = new Map<string, Record<string, unknown>>();
    for (const item of allItems) {
      const key = `${item.PK}#${item.SK}`;
      itemMap.set(key, item);
    }

    const validRooms: RoomInfo[] = [];

    for (const participation of participations) {
      const roomId = participation.chatRoomId as string;
      const room = itemMap.get(`CHATROOM#${roomId}#METADATA`);
      if (!room) continue;

      const lastMsg = itemMap.get(`CHATROOM#${roomId}#LASTMESSAGE`);

      validRooms.push({
        chatRoomId: room.chatRoomId as string,
        name: (room.name as string) || (room.type === 'direct' ? 'ダイレクトメッセージ' : 'グループチャット'),
        participantIds: room.participantIds as string[],
        type: room.type as string,
        activityId: room.activityId as string | undefined,
        lastMessageAt: (lastMsg?.lastMessageAt as string) || (room.createdAt as string),
        lastMessage: lastMsg?.lastMessage as string | undefined,
        createdAt: room.createdAt as string,
      });
    }

    // Sort by lastMessageAt descending
    validRooms.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt).getTime();
      const dateB = new Date(b.lastMessageAt).getTime();
      return dateB - dateA;
    });

    return successResponse({ rooms: validRooms, count: validRooms.length });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to retrieve chat rooms');
  }
};
