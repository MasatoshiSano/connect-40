import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ddbDocClient } from '/opt/nodejs/dynamodb';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse } from '/opt/nodejs/utils';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME!;

interface CreateChatRoomInput {
  participantIds: string[];
  activityId?: string;
}

/**
 * Create chat room
 * POST /chat/rooms
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const input: CreateChatRoomInput = JSON.parse(event.body || '{}');

    if (!input.participantIds || input.participantIds.length === 0) {
      return errorResponse(400, 'INVALID_INPUT', 'Participant IDs required');
    }

    // Include current user in participants if not already
    if (!input.participantIds.includes(userId)) {
      input.participantIds.push(userId);
    }

    const chatRoomId = uuidv4();
    const now = new Date().toISOString();
    const type = input.participantIds.length === 2 ? 'direct' : 'group';

    const chatRoom = {
      chatRoomId,
      participantIds: input.participantIds,
      type,
      activityId: input.activityId,
      lastMessageAt: now,
      createdAt: now,
    };

    // Store chat room
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CHATROOM#${chatRoomId}`,
          SK: 'METADATA',
          Type: 'ChatRoom',
          ...chatRoom,
        },
      })
    );

    // Create participant records for easier querying
    for (const participantId of input.participantIds) {
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${participantId}`,
            SK: `CHATROOM#${chatRoomId}`,
            Type: 'ChatParticipation',
            chatRoomId,
            participantId,
            joinedAt: now,
          },
        })
      );
    }

    return successResponse(chatRoom);
  } catch (error) {
    console.error('Create chat room error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create chat room');
  }
};
